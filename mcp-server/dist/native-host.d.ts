/**
 * Chrome native messaging: each message is 4-byte little-endian length + JSON.
 * Reads from stdin and writes responses to stdout.
 */
export declare function runNativeHost(): void;
