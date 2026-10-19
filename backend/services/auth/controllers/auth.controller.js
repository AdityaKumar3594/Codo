import {app} from "../config/firebase.js";
import {getAuth} from "firebase-admin/auth"
import User from "../models/user.model.js";
import crypto from "crypto"
import redis from "../../../shared/redis/redis.js";

export const login =async (req,res)=>{
    try{
        const {token}=req.body;
        const decoded=await getAuth(app).verifyIdToken(token);

        //user creation
        let user=await User.findOne({
            firebaseUid:decoded.uid
        })

        if (!user){
            user=await User.create({
                firebaseUid:decoded.uid,
                name:decoded.name,
                email:decoded.email,
                avatar:decoded.picture,  
                credits: 100, // free 100 credits on first sign in
            })
        } else if (user.credits == null) {
            user.credits = 100;
            await user.save();
        }

        //storing session in redis
        const sessionId=crypto.randomUUID()

        await redis.set(`user-session-${user?._id}`,sessionId,"EX",7*24*60*60)

        await redis.set(`session-${sessionId}`,JSON.stringify({
            name:user.name,
            _id:user._id,
            email:user.email,
            avatar:user.avatar,
            credits: user.credits ?? 100
        }),
        "EX",7*24*60*60)

        //storing session in cookie

        res.cookie("session", sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        return res.status(200).json(user);
    }catch(error){
        console.log("login error:", error);
        return res.status(500).json({message:`login error ${error}`})
    }
}

export const logout=async (req,res)=>{
    try{
        const sessionId=req.cookies?.session;
        if (sessionId) {
            await redis.del(`session-${sessionId}`)
        }
        res.clearCookie("session", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        })
        return res.status(200).json({message: "Logged out successfully"})
    }catch(error){
        console.log("logout error:", error);
        return res.status(500).json({message: `logout error ${error}`})
    }
}

export const deductCredits=async (req,res)=>{
    try{
        const {userId,amount}=req.body;
        if(!userId){
            return res.status(401).json({message:"userId not found"});
        }

        const deductAmount = typeof amount === "number" && amount > 0 ? amount : 10;

        // Verify user and auto-initialize credits if missing
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.credits == null || isNaN(user.credits)) {
            user.credits = 100;
            await User.findByIdAndUpdate(userId, { credits: 100 });
        }

        if (user.credits < deductAmount) {
            return res.status(401).json({ message: "Insufficient credits", credits: user.credits });
        }

        user = await User.findByIdAndUpdate(
            userId,
            { $inc: { credits: -deductAmount } },
            { new: true }
        );

        const sessionId = (await redis.get(`user-session-${userId}`)) || (await redis.get(`user-id-${userId}`));

        if (sessionId) {
            await redis.set(
                `session-${sessionId}`,
                JSON.stringify({
                    name: user.name,
                    _id: user._id,
                    email: user.email || "",
                    avatar: user.avatar || "",
                    credits: user.credits
                }),
                "EX",
                7 * 24 * 60 * 60
            );
        }

        return res.status(200).json({ credits: user.credits });
    }catch(error){
        console.log("deduct credits error:", error);
        return res.status(500).json({message: `deduct credits error ${error}`});
    }
}

export const addCredits=async (req,res)=>{
    try{
        const {userId,amount}=req.body;
        if(!userId){
            return res.status(401).json({message:"userId not found"});
        }

        const creditAmount = typeof amount === "number" && amount > 0 ? amount : 10;
        const user = await User.findByIdAndUpdate(
            userId,
            { $inc: { credits: creditAmount } },
            { new: true }
        );

        if(!user){
            return res.status(404).json({message:"User not found"});
        }

        const sessionId = (await redis.get(`user-session-${userId}`)) || (await redis.get(`user-id-${userId}`));

        if (sessionId) {
            await redis.set(
                `session-${sessionId}`,
                JSON.stringify({
                    name: user.name,
                    _id: user._id,
                    email: user.email || "",
                    avatar: user.avatar || "",
                    credits: user.credits
                }),
                "EX",
                7 * 24 * 60 * 60
            );
        }

        return res.status(200).json({ credits: user.credits });
    }catch(error){
        console.log("add credits error:", error);
        return res.status(500).json({message: `add credits error ${error}`});
    }
}
