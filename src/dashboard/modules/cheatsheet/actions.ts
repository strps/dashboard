"use server";

import {
  createEntry,
  createTag,
  deleteEntry,
  deleteTag,
  listEntries,
  listTags,
  updateEntry,
  updateTag,
} from "@/lib/dal/cheatsheet";

import {
  entryInputSchema,
  tagInputSchema,
  type CheatsheetEntry,
  type CheatsheetEntryInput,
  type CheatsheetTag,
  type CheatsheetTagInput,
} from "./schemas";

export async function listEntriesAction(): Promise<CheatsheetEntry[]> {
  return listEntries();
}

export async function createEntryAction(
  input: CheatsheetEntryInput,
): Promise<CheatsheetEntry> {
  const parsed = entryInputSchema.parse(input);
  return createEntry(parsed);
}

export async function updateEntryAction(
  id: string,
  input: CheatsheetEntryInput,
): Promise<CheatsheetEntry> {
  const parsed = entryInputSchema.parse(input);
  return updateEntry(id, parsed);
}

export async function deleteEntryAction(id: string): Promise<void> {
  return deleteEntry(id);
}

export async function listTagsAction(): Promise<CheatsheetTag[]> {
  return listTags();
}

export async function createTagAction(
  input: CheatsheetTagInput,
): Promise<CheatsheetTag> {
  const parsed = tagInputSchema.parse(input);
  return createTag(parsed);
}

export async function updateTagAction(
  id: string,
  input: CheatsheetTagInput,
): Promise<CheatsheetTag> {
  const parsed = tagInputSchema.parse(input);
  return updateTag(id, parsed);
}

export async function deleteTagAction(id: string): Promise<void> {
  return deleteTag(id);
}
