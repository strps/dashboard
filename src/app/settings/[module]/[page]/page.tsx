import { notFound } from "next/navigation";

import { verifySession } from "@/lib/dal/session";
import { getConfigPage } from "@/dashboard/modules";

interface PageProps {
  params: Promise<{ module: string; page: string }>;
}

export default async function ModuleConfigPage({ params }: PageProps) {
  const { module: moduleId, page: pageSlug } = await params;
  const match = getConfigPage(moduleId, pageSlug);
  if (!match) notFound();

  const { page } = match;
  if (page.adminOnly) {
    const { isAdmin } = await verifySession();
    if (!isAdmin) notFound();
  }

  const PageComponent = page.component;

  return (
    <div className="max-w-4xl">
      <div className="mb-5">
        <h2 className="text-base font-medium tracking-wide">{page.label}</h2>
        {page.description && (
          <p className="mt-1 text-xs text-white/50">{page.description}</p>
        )}
      </div>
      <PageComponent />
    </div>
  );
}
