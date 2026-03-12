import { writeSnippets } from "./snippet-store.js";
const MAX_MESSAGE_SIZE = 1024 * 1024;
function sendResponse(response) {
    const json = JSON.stringify(response);
    const buf = Buffer.from(json, "utf-8");
    if (buf.length > MAX_MESSAGE_SIZE) {
        const err = { ok: false, error: "Response exceeds 1MB limit" };
        sendResponse(err);
        return;
    }
    const len = Buffer.allocUnsafe(4);
    len.writeUInt32LE(buf.length, 0);
    process.stdout.write(len);
    process.stdout.write(buf);
}
function handleMessage(msg) {
    const { type, payload } = msg;
    if (type === "SYNC_SNIPPETS") {
        const snippets = payload;
        if (!Array.isArray(snippets)) {
            sendResponse({ ok: false, error: "SYNC_SNIPPETS requires payload to be an array" });
            return;
        }
        writeSnippets(snippets)
            .then(() => sendResponse({ ok: true, payload: { synced: snippets.length } }))
            .catch((err) => sendResponse({ ok: false, error: err.message }));
        return;
    }
    if (type === "PING") {
        sendResponse({ ok: true, payload: { pong: true } });
        return;
    }
    sendResponse({ ok: false, error: `Unknown message type: ${type}` });
}
let stdinBuffer = Buffer.alloc(0);
/**
 * Chrome native messaging: each message is 4-byte little-endian length + JSON.
 * Reads from stdin and writes responses to stdout.
 */
export function runNativeHost() {
    process.stdin.on("data", (chunk) => {
        stdinBuffer = Buffer.concat([stdinBuffer, chunk]);
        while (stdinBuffer.length >= 4) {
            const len = stdinBuffer.readUInt32LE(0);
            if (len > MAX_MESSAGE_SIZE) {
                sendResponse({ ok: false, error: "Message too large" });
                process.exit(1);
            }
            if (stdinBuffer.length < 4 + len) {
                break;
            }
            const json = stdinBuffer.subarray(4, 4 + len).toString("utf-8");
            stdinBuffer = stdinBuffer.subarray(4 + len);
            try {
                const msg = JSON.parse(json);
                handleMessage(msg);
            }
            catch (err) {
                sendResponse({
                    ok: false,
                    error: err instanceof Error ? err.message : "Invalid JSON"
                });
            }
        }
    });
    process.stdin.on("end", () => {
        process.exit(0);
    });
}
