export type PlanCode = 'free' | 'pro' | 'team';
export interface McpUser {
    userId: string;
    planCode: PlanCode;
    callCount: number;
    limitReached: boolean;
}
export interface CaptureAsset {
    id: number;
    asset_kind: string;
    object_key: string;
    content_type: string | null;
    byte_size: number | null;
    signed_url: string;
}
export interface CaptureRecord {
    id: number;
    user_id: string | null;
    source_url: string | null;
    captured_at: number;
    status: string;
    created_at: number;
    assets: CaptureAsset[];
}
export interface CaptureSummary {
    id: number;
    source_url: string | null;
    captured_at: number;
    status: string;
}
export interface CaptureContent {
    id: number;
    sourceUrl: string | null;
    capturedAt: number;
    html: string;
    css: string;
    screenshotUrl: string | null;
}
export interface ConvertCaptureInput {
    captureId?: number;
    html?: string;
    css?: string;
    targetFramework: TargetFramework;
    targetStyling: TargetStyling;
}
export type TargetFramework = 'react' | 'vue' | 'svelte' | 'solid' | 'alpine' | 'astro' | 'lit' | 'preact' | 'solidjs';
export type TargetStyling = 'tailwind' | 'css-modules' | 'styled-components' | 'inline';
export declare class McpLimitError extends Error {
    constructor();
}
