import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
const DIR_NAME = ".snappymcp";
const FILE_NAME = "snippets.json";
function getStoreDir() {
    return path.join(os.homedir(), DIR_NAME);
}
function getStorePath() {
    return path.join(getStoreDir(), FILE_NAME);
}
function isSnippetRecord(value) {
    if (!value || typeof value !== "object") {
        return false;
    }
    const r = value;
    return (typeof r.id === "string" &&
        typeof r.title === "string" &&
        typeof r.sourceUrl === "string" &&
        typeof r.html === "string" &&
        typeof r.jsx === "string" &&
        typeof r.createdAt === "number" &&
        typeof r.width === "number" &&
        typeof r.height === "number");
}
export async function ensureStoreDir() {
    const dir = getStoreDir();
    await fs.mkdir(dir, { recursive: true });
}
export async function readSnippets() {
    const filePath = getStorePath();
    try {
        const raw = await fs.readFile(filePath, "utf-8");
        const data = JSON.parse(raw);
        if (!Array.isArray(data)) {
            return [];
        }
        return data.filter(isSnippetRecord);
    }
    catch (err) {
        const code = err?.code;
        if (code === "ENOENT") {
            return [];
        }
        throw err;
    }
}
export async function writeSnippets(snippets) {
    await ensureStoreDir();
    const filePath = getStorePath();
    const json = JSON.stringify(snippets, null, 0);
    await fs.writeFile(filePath, json, "utf-8");
}
export async function getSnippetById(id) {
    const snippets = await readSnippets();
    return snippets.find((s) => s.id === id) ?? null;
}
