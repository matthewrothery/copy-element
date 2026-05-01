import { GoogleGenAI, Modality } from "@google/genai";
import { AutoBloggerConfig } from "./config.js";
import { GeneratedArticle } from "./types.js";

export type GeneratedImage = {
  bytes: Buffer<ArrayBufferLike>;
  ext: "png" | "jpeg" | "webp";
};

function aspectRatioFromImageSize(size: AutoBloggerConfig["imageSize"]): string {
  switch (size) {
    case "1024x1024":
      return "1:1";
    case "1024x1536":
      return "2:3";
    case "1536x1024":
      return "3:2";
    default:
      return "3:2";
  }
}

function extFromMime(mime: string | undefined): "png" | "jpeg" | "webp" {
  if (!mime) return "png";
  const lower = mime.toLowerCase();
  if (lower === "image/jpeg" || lower === "image/jpg") return "jpeg";
  if (lower === "image/webp") return "webp";
  return "png";
}

function isGemini3TierImageModel(model: string): boolean {
  return model.includes("gemini-3");
}

function buildStyledPrompt(article: GeneratedArticle, config: AutoBloggerConfig): string {
  return `
Create a blog cover image.

Subject:
${article.imagePrompt}

Art direction:
- stencil street-art style
- bold minimalist shapes
- flat overlapping color layers
- clear silhouette
- no text or logos
- no photorealism

Palette:
- ${config.imagePalette}

Topic context:
- ${article.hubTitle} / ${article.clusterTitle}
- ${article.title}
`;
}

export async function generateCoverImage(
  article: GeneratedArticle,
  config: AutoBloggerConfig
): Promise<GeneratedImage> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required for cover image generation.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildStyledPrompt(article, config).trim();
  const aspectRatio = aspectRatioFromImageSize(config.imageSize);

  const imageConfig: { aspectRatio: string; imageSize?: string } = { aspectRatio };
  if (isGemini3TierImageModel(config.imageModel)) {
    imageConfig.imageSize = config.geminiImageResolution;
  }

  const response = await ai.models.generateContent({
    model: config.imageModel,
    contents: prompt,
    config: {
      responseModalities: [Modality.IMAGE],
      imageConfig,
    },
  });

  const candidate = response.candidates?.[0];
  const parts = candidate?.content?.parts;
  if (!parts?.length) {
    const blocked =
      response.promptFeedback?.blockReason ??
      response.promptFeedback?.blockReasonMessage ??
      "unknown";
    throw new Error(`Gemini image generation returned no candidates (${blocked}).`);
  }

  let mime: string | undefined;
  let base64: string | undefined;

  for (const part of parts) {
    if (part.inlineData?.data) {
      base64 = part.inlineData.data;
      mime = part.inlineData.mimeType;
      break;
    }
  }

  if (!base64 && response.data) {
    base64 = response.data;
    mime = "image/png";
  }

  if (!base64) {
    throw new Error("Gemini image generation did not return image bytes.");
  }

  return {
    bytes: Buffer.from(base64, "base64"),
    ext: extFromMime(mime),
  };
}
