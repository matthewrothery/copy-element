export type PlanCode = "guest" | "free" | "pro";

export interface PlanFeatures {
  capturesPerMonth: number | "unlimited";
  savedElementsMax: number | "unlimited";
  mcpRequestsPerMonth: number | "unlimited";
  canCopyBasicAiPrompt: boolean;
  canCopyAdvancedAiPrompt: boolean;
  canSendToAiEditor: boolean;
  cloudSync: boolean;
}

export const PLAN_FEATURES: Record<PlanCode, PlanFeatures> = {
  guest: {
    capturesPerMonth: 10,
    savedElementsMax: 10,
    mcpRequestsPerMonth: 0,
    canCopyBasicAiPrompt: false,
    canCopyAdvancedAiPrompt: false,
    canSendToAiEditor: false,
    cloudSync: false,
  },
  free: {
    capturesPerMonth: 20,
    savedElementsMax: 25,
    mcpRequestsPerMonth: 10,
    canCopyBasicAiPrompt: true,
    canCopyAdvancedAiPrompt: false,
    canSendToAiEditor: false,
    cloudSync: false,
  },
  pro: {
    capturesPerMonth: "unlimited",
    savedElementsMax: "unlimited",
    mcpRequestsPerMonth: "unlimited",
    canCopyBasicAiPrompt: true,
    canCopyAdvancedAiPrompt: true,
    canSendToAiEditor: true,
    cloudSync: true,
  },
};
