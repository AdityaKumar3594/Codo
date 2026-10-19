import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { buildGraph } from "../graph/graph.js";
import { deductCredits } from "../utils/deductCredits.js";

const buildHistory = (history) => {
    if (!Array.isArray(history)) return [];

    return history
        .slice(-6)
        .filter((msg) => msg?.content && (msg.role === "user" || msg.role === "assistant"))
        .map((msg) =>
            msg.role === "user"
                ? new HumanMessage(msg.content)
                : new AIMessage(msg.content)
        );
};

const sendEvent = (res, type, data) => {
    if (res.writableEnded || res.destroyed) return false;

    try {
        res.write(`event:${type}\n`);
        res.write(`data:${JSON.stringify(data)}\n\n`);
        return true;
    } catch (error) {
        console.error(`SSE Error ${error}`);
        return false;
    }
};

const extractText = (content) => {
    if (typeof content === "string") return content;
    if (!Array.isArray(content)) return "";
    return content
        .filter((item) => item?.type === "text" && item.text)
        .map((item) => item.text)
        .join("");
};

const parseToolContent = (content) => {
    if (content == null) return null;
    if (typeof content !== "string") return content;
    try {
        return JSON.parse(content);
    } catch {
        return content;
    }
};

export const chat = async (req, res) => {
    let disconnected = false;
    let sseStarted = false;

    try {
        const { projectId, message, history = [] } = req.body;
        const userId = req.headers["x-user-id"];

        if (!projectId) {
            return res.status(400).json({ message: "projectId is required" });
        }
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({ message: "message is required" });
        }

        // Deduct 10 credits per AI prompt as specified
        const creditResult = await deductCredits({ userId, amount: 10 });
        if (!creditResult.success) {
            return res.status(creditResult.status === 401 ? 402 : (creditResult.status || 400)).json({
                message: creditResult.message || "Insufficient AI credits. Please upgrade your plan to continue.",
                insufficientCredits: true,
                credits: creditResult.credits ?? 0,
            });
        }

        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");
        res.flushHeaders?.();
        sseStarted = true;

        const abortController = new AbortController();
        res.once("close", () => {
            disconnected = true;
            abortController.abort();
            console.log("AI CLIENT DISCONNECTED");
        });

        sendEvent(res, "start", {
            success: true,
            message: "AI started",
            credits: creditResult.credits,
        });

        const graph = buildGraph({ projectId, userId });
        const messages = buildHistory(history);
        messages.push(new HumanMessage(message.trim()));

        const stream = await graph.stream(
            { messages },
            {
                streamMode: "updates",
                recursionLimit: 40,
                signal: abortController.signal,
            }
        );

        let finalMessage = "";

        for await (const chunk of stream) {
            if (disconnected || res.writableEnded) break;

            if (chunk?.agent) {
                const agentMessages = chunk.agent?.messages || [];
                const last = agentMessages[agentMessages.length - 1];
                if (!last) continue;

                const toolCalls = last.tool_calls || [];
                if (Array.isArray(toolCalls) && toolCalls.length > 0) {
                    for (const call of toolCalls) {
                        sendEvent(res, "tool_start", {
                            tool_name: call.name,
                            tool_args: call.args || call.arguments || {},
                        });
                    }
                    continue;
                }

                const content = extractText(last.content);
                if (content) {
                    finalMessage = content;
                    sendEvent(res, "message", { content: finalMessage });
                }
            }

            if (chunk?.tools) {
                const toolMessages = chunk.tools?.messages || [];
                for (const toolMessage of toolMessages) {
                    const result = parseToolContent(toolMessage.content);

                    if (result && typeof result === "object" && result.operation) {
                        sendEvent(res, result.operation, result);
                        continue;
                    }

                    sendEvent(res, "tool_result", result ?? toolMessage.content);
                }
            }
        }

        if (!disconnected && !res.writableEnded) {
            sendEvent(res, "done", {
                success: true,
                message: finalMessage,
                credits: creditResult.credits,
            });
            res.end();
        }
    } catch (error) {
        if (error?.name === "AbortError") return;

        console.log("AI STREAM ERROR:", error.message);
        if (disconnected) return;

        if (sseStarted || res.headersSent) {
            sendEvent(res, "error", {
                success: false,
                message: error?.message || "AI request failed",
            });
            if (!res.writableEnded) res.end();
            return;
        }

        return res.status(500).json({
            success: false,
            message: error?.message || "AI request failed",
        });
    }
};
