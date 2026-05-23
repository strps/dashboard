import { z } from "zod";

export type NoteBlock =
  | { id: string; type: "text"; text: string }
  | { id: string; type: "checklist"; text: string; checked: boolean };

export const blockSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string().min(1),
    type: z.literal("text"),
    text: z.string(),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("checklist"),
    text: z.string(),
    checked: z.boolean(),
  }),
]);

export const blocksSchema = z.array(blockSchema).max(500);
