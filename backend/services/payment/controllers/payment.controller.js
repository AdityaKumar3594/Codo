import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import Payment from "../models/payment.model.js";

// Defined subscription/credit plans
export const PLANS = {
  pro: {
    name: "Pro Plan",
    planId: "pro",
    amount: 499, // In INR (₹499)
    credits: 500,
    description: "500 AI credits with priority processing",
  },
  team: {
    name: "Team Plan",
    planId: "team",
    amount: 999, // In INR (₹999)
    credits: 1200,
    description: "1200 AI credits for power users and teams",
  },
};

/**
 * GET /plans
 * Retrieve all available payment/credit plans
 */
export const getPlans = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      plans: PLANS,
    });
  } catch (error) {
    console.error("Error in getPlans:", error);
    return res.status(500).json({
      success: false,
      message: `Failed to fetch plans: ${error.message}`,
    });
  }
};

/**
 * POST /create-order
 * Create a new Razorpay order and save the pending payment record
 */
export const createOrder = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.body.userId;
    const { plan } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID is required",
      });
    }

    if (!plan || !PLANS[plan]) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan. Available plans are 'pro' and 'team'.",
      });
    }

    const selectedPlan = PLANS[plan];
    // Razorpay accepts amount in the smallest currency sub-unit (paise for INR: 1 INR = 100 paise)
    const amountInPaise = selectedPlan.amount * 100;
    const receipt = `rcpt_${Date.now()}_${String(userId).slice(-6)}`;

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        userId: String(userId),
        plan: selectedPlan.planId,
        credits: String(selectedPlan.credits),
      },
    };

    // 1. Create order on Razorpay
    const order = await razorpay.orders.create(options);

    // 2. Persist order in Payment database
    const payment = await Payment.create({
      userId,
      plan: selectedPlan.planId,
      amount: selectedPlan.amount,
      credits: selectedPlan.credits,
      currency: "INR",
      razorpayOrderId: order.id,
      status: "created",
    });

    return res.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      plan: selectedPlan.planId,
      credits: selectedPlan.credits,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error("Error in createOrder:", error);
    return res.status(500).json({
      success: false,
      message: `Failed to create Razorpay order: ${error.message}`,
    });
  }
};

/**
 * POST /verify
 * Verifies Razorpay HMAC-SHA256 signature and credits the user
 */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay payment parameters (order_id, payment_id, or signature)",
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error("RAZORPAY_KEY_SECRET is not configured");
      return res.status(500).json({
        success: false,
        message: "Razorpay secret key configuration missing",
      });
    }

    // Official Razorpay verification formula:
    // generated_signature = hmac_sha256(order_id + "|" + razorpay_payment_id, secret)
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: "failed", razorpayPaymentId: razorpay_payment_id }
      );

      return res.status(400).json({
        success: false,
        message: "Payment verification failed: Invalid signature",
      });
    }

    // Find payment record
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record for order not found",
      });
    }

    // Idempotency: if already processed
    if (payment.status === "success") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        payment,
      });
    }

    // Update payment record to success
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = "success";
    await payment.save();

    // Call Auth service to add credits to user account
    let updatedCredits = null;
    try {
      const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://localhost:8001";
      const authResponse = await fetch(`${authServiceUrl}/user/add-credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: String(payment.userId),
          amount: payment.credits,
        }),
      });

      if (authResponse.ok) {
        updatedCredits = await authResponse.json();
      } else {
        const errorText = await authResponse.text();
        console.error("Auth service add-credits failed:", errorText);
      }
    } catch (err) {
      console.error("Failed to connect to Auth service for adding credits:", err.message);
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified and credits added successfully",
      payment,
      credits: updatedCredits,
    });
  } catch (error) {
    console.error("Error in verifyPayment:", error);
    return res.status(500).json({
      success: false,
      message: `Payment verification error: ${error.message}`,
    });
  }
};

/**
 * GET /history
 * Retrieve user's payment history
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.query.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID is required",
      });
    }

    const payments = await Payment.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error("Error in getPaymentHistory:", error);
    return res.status(500).json({
      success: false,
      message: `Failed to fetch payment history: ${error.message}`,
    });
  }
};

/**
 * POST /webhook
 * Optional Razorpay server-to-server webhook handler for events (e.g. payment.captured, order.paid)
 */
export const handleWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret && webhookSignature) {
      const shasum = crypto.createHmac("sha256", webhookSecret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest("hex");

      if (digest !== webhookSignature) {
        return res.status(400).json({ message: "Invalid webhook signature" });
      }
    }

    const event = req.body.event;

    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = req.body.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        const payment = await Payment.findOne({ razorpayOrderId: orderId });
        if (payment && payment.status !== "success") {
          payment.status = "success";
          payment.razorpayPaymentId = paymentId;
          await payment.save();

          // Add credits
          try {
            const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://localhost:8001";
            await fetch(`${authServiceUrl}/user/add-credits`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: String(payment.userId),
                amount: payment.credits,
              }),
            });
          } catch (authErr) {
            console.error("Webhook auth add-credits failed:", authErr.message);
          }
        }
      }
    }

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Error in handleWebhook:", error);
    return res.status(500).json({ message: error.message });
  }
};
