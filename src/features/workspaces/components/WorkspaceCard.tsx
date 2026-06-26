import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Workspace } from "../types";
import { WorkspaceStatusBadge } from "./WorkspaceStatusBadge";

export function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{workspace.name}</CardTitle>
          </div>
          <WorkspaceStatusBadge status={workspace.status} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="min-h-10 text-sm leading-relaxed text-muted-foreground">
          {workspace.description || "No workspace description has been added yet."}
        </p>
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{workspace.member_count ?? 0} members</span>
          <Button asChild size="sm">
            <Link to={`/workspaces/${workspace.id}`}>
              Open
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
