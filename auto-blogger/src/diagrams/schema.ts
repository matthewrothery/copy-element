import { z } from "zod";

const diagramIdSchema = z
  .string()
  .min(1)
  .max(48)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase slug-style ids (letters, numbers, hyphens).");

const FlowSpecSchema = z.object({
  kind: z.literal("flow"),
  id: diagramIdSchema,
  altHint: z.string().min(4).max(200),
  nodes: z.array(z.object({ label: z.string().min(1).max(80) })).min(2).max(8),
});

const ColumnsSpecSchema = z.object({
  kind: z.literal("columns"),
  id: diagramIdSchema,
  altHint: z.string().min(4).max(200),
  columns: z
    .array(
      z.object({
        title: z.string().min(1).max(60),
        rows: z.array(z.string().min(1).max(120)).min(1).max(6),
      })
    )
    .min(2)
    .max(3),
});

const StepsSpecSchema = z.object({
  kind: z.literal("steps"),
  id: diagramIdSchema,
  altHint: z.string().min(4).max(200),
  labels: z.array(z.string().min(1).max(80)).min(3).max(7),
});

export const DiagramSpecSchema = z.discriminatedUnion("kind", [
  FlowSpecSchema,
  ColumnsSpecSchema,
  StepsSpecSchema,
]);

export type DiagramSpec = z.infer<typeof DiagramSpecSchema>;
