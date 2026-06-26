import { Link } from "react-router-dom";
import { Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/product-ui";
import type { Workspace } from "../types";
import { WorkspaceStatusBadge } from "./WorkspaceStatusBadge";

export function WorkspaceHeader({ workspace }: { workspace: Workspace }) {
  return (
    <PageHeader
      eyebrow={workspace.organization?.name || "Workspace"}
      title={workspace.name}
      actions={
        <>
          <WorkspaceStatusBadge status={workspace.status} />
          <Button asChild variant="outline" size="sm">
            <Link to={`/workspaces/${workspace.id}/members`}>
              <Users data-icon="inline-start" />
              Members
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={`/workspaces/${workspace.id}/settings`}>
              <Settings data-icon="inline-start" />
              Settings
            </Link>
          </Button>
        </>
      }
    />
  );
}
