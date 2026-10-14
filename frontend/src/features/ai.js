const FILE_OPS = new Set([
    "file_created",
    "folder_created",
    "file_updated",
    "file_deleted",
    "tree_fetched",
    "file_fetched",
]);

export const isFileOp = (eventType) => FILE_OPS.has(eventType);

export const streamChat = async ({
    projectId,
    message,
    history = [],
    onEvent,
    signal,
}) => {
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/ai/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept:"text/event-stream"
        },
        credentials: "include",
        signal,
        body: JSON.stringify({
            projectId,
            message,
            history,
        }),
    });

    if (!response.ok) {
        let msg = "Ai Request Failed";
        try {
            const data = await response.json();
            msg = data?.message || msg;
        } catch {
            // response was not JSON
        }
        throw new Error(msg);
    }

    if (!response.body) {
        throw new Error("AI streaming is not supported.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const flushEvent = (eventText) => {
        if (!eventText.trim()) return;

        let eventType = "message";
        let dataText = "";

        for (const line of eventText.split("\n")) {
            if (line.startsWith("event:")) {
                eventType = line.slice(6).trim();
            }
            if (line.startsWith("data:")) {
                dataText += line.slice(5).trim();
            }
        }

        if (!dataText) return;

        let data;
        try {
            data = JSON.parse(dataText);
        } catch {
            data = dataText;
        }

        onEvent?.(eventType, data);
    };

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const eventText of events) {
            flushEvent(eventText);
        }
    }

    if (buffer.trim()) flushEvent(buffer);
};
