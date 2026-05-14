import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#[0-9a-f]{6}$/i, "Expected hex color like #a3e635");

export const tagSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  parentId: z.string().min(1).nullable(),
  color: hexColor.nullable(),
});
export type CheatsheetTag = z.infer<typeof tagSchema>;

export const tagInputSchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().min(1).nullable(),
  color: hexColor.nullable(),
});
export type CheatsheetTagInput = z.infer<typeof tagInputSchema>;

export const entrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(150),
  syntax: z.string().min(1),
  description: z.string(),
  priority: z.number().int(),
  tagIds: z.array(z.string().min(1)),
});
export type CheatsheetEntry = z.infer<typeof entrySchema>;

export const entryInputSchema = z.object({
  title: z.string().min(1).max(150),
  syntax: z.string().min(1),
  description: z.string(),
  priority: z.number().int(),
  tagIds: z.array(z.string().min(1)).max(50),
});
export type CheatsheetEntryInput = z.infer<typeof entryInputSchema>;

export const filterButtonSchema = z.object({
  tagId: z.string().min(1),
  labelOverride: z.string().max(40).nullable(),
  colorOverride: hexColor.nullable(),
});
export type FilterButton = z.infer<typeof filterButtonSchema>;

export const filterButtonsSchema = z.array(filterButtonSchema).max(50);
