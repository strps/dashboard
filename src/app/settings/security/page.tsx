import { redirect } from "next/navigation";

import { listAllowedEmails } from "@/lib/dal/allowedEmails";
import { verifySession } from "@/lib/dal/session";

import { AllowedEmailsManager } from "./AllowedEmailsManager";

export default async function SecuritySettingsPage() {
  const { isAdmin } = await verifySession();
  if (!isAdmin) redirect("/settings");
  const emails = await listAllowedEmails();
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-base font-medium tracking-wide">
          Allowed sign-ups
        </h2>
        <p className="mt-1 text-xs text-white/50">
          Only email addresses on this list can create an account. The first
          registered user is automatically an admin.
        </p>
      </div>
      <AllowedEmailsManager initialEmails={emails} />
    </div>
  );
}
