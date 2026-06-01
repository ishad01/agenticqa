import { Settings2 } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/pages/Dashboard";

export function SettingsPage() {
  return (
    <div className="space-y-5 p-6 lg:p-8">
      <PageHeader
        title="Settings"
        subtitle="Project, integrations, and notification preferences."
      />
      <EmptyState
        icon={Settings2}
        title="Settings coming soon"
        description="Jira credentials, GitLab token, notification routing, and per-user preferences will live here."
      />
    </div>
  );
}
