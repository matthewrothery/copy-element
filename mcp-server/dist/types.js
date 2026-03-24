export class McpLimitError extends Error {
    constructor() {
        super('MCP_LIMIT_REACHED: Monthly quota exhausted. Upgrade to Pro for unlimited access.');
        this.name = 'McpLimitError';
    }
}
