import type { Metadata } from "next";
import { buildPageMetadata } from "./metadata";

export function buildComparisonMetadata(meta: {
  title: string;
  description: string;
  canonicalPath: string;
}): Metadata {
  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    path: meta.canonicalPath,
  });
}
