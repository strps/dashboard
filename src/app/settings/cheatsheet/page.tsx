import { listEntries, listTags } from "@/lib/dal/cheatsheet";

import { CheatsheetManager } from "./CheatsheetManager";

export default async function CheatsheetSettingsPage() {
  const [entries, tags] = await Promise.all([listEntries(), listTags()]);
  return (
    <div className="max-w-4xl">
      <div className="mb-5">
        <h2 className="text-base font-medium tracking-wide">Cheatsheet</h2>
        <p className="mt-1 text-xs text-white/50">
          Manage entries and tags. These are shared across every cheatsheet
          widget on your dashboard. Use the gear icon on a cheatsheet widget to
          configure which tags appear as filter buttons in that specific
          widget.
        </p>
      </div>
      <CheatsheetManager initialEntries={entries} initialTags={tags} />
    </div>
  );
}
