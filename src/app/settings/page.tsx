import { redirect } from "next/navigation";

import { MODULES } from "@/dashboard/modules";

export default function SettingsIndexPage() {
  const firstModuleWithPages = MODULES.find(
    (m) => m.configPages && m.configPages.length > 0,
  );
  const firstPage = firstModuleWithPages?.configPages?.[0];
  if (firstModuleWithPages && firstPage) {
    redirect(`/settings/${firstModuleWithPages.id}/${firstPage.slug}`);
  }
  redirect("/settings/cheatsheet");
}
