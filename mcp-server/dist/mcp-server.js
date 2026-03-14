import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buildSnippetPrompt } from "./prompt-helper.js";
import { getSnippetById, readSnippets } from "./snippet-store.js";
export async function runMcpServer() {
    const server = new McpServer({
        name: "snappymcp",
        version: "0.1.0"
    }, {
        capabilities: {
            tools: {}
        }
    });
    server.registerTool("list_snippets", {
        description: "List all captured UI snippets (id, title, sourceUrl, dimensions).",
        inputSchema: {}
    }, async () => {
        const snippets = await readSnippets();
        const list = snippets.map((s) => ({
            id: s.id,
            title: s.title,
            sourceUrl: s.sourceUrl,
            width: s.width,
            height: s.height
        }));
        return {
            content: [{ type: "text", text: JSON.stringify(list, null, 2) }]
        };
    });
    server.registerTool("get_snippet", {
        description: "Get full snippet data by ID (html, jsx, styleBlock, etc.).",
        inputSchema: {
            id: z.string().describe("Snippet ID from list_snippets")
        }
    }, async ({ id }) => {
        const snippet = await getSnippetById(id);
        if (!snippet) {
            return {
                content: [{ type: "text", text: JSON.stringify({ error: `Snippet not found: ${id}` }) }]
            };
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        id: snippet.id,
                        title: snippet.title,
                        sourceUrl: snippet.sourceUrl,
                        html: snippet.html,
                        jsx: snippet.jsx,
                        styleBlock: snippet.styleBlock,
                        width: snippet.width,
                        height: snippet.height
                    }, null, 2)
                }
            ]
        };
    });
    server.registerTool("get_snippet_prompt", {
        description: "Get a formatted prompt for a snippet (markdown with HTML and JSX blocks, token estimate) for pasting into AI tools.",
        inputSchema: {
            id: z.string().describe("Snippet ID from list_snippets")
        }
    }, async ({ id }) => {
        const snippet = await getSnippetById(id);
        if (!snippet) {
            return {
                content: [{ type: "text", text: `Snippet not found: ${id}` }]
            };
        }
        const prompt = buildSnippetPrompt(snippet);
        return {
            content: [{ type: "text", text: prompt }]
        };
    });
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
