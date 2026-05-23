import { z } from "zod";

export const activitySelectorConfigSchema = z.object({
  clockMode: z.enum(["visible", "muted", "hide-big", "hidden"]),
});
export type ActivitySelectorConfig = z.infer<typeof activitySelectorConfigSchema>;

export const defaultActivitySelectorConfig: ActivitySelectorConfig = {
  clockMode: "visible",
};
