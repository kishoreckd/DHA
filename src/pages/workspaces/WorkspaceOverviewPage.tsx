import { Globe2, Search, ShieldCheck, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeListSkeleton, DetailSkeleton, ErrorState } from "@/components/common/product-ui";
import { WorkspaceHeader } from "@/features/workspaces/components/WorkspaceHeader";
import { useWorkspace, useWorkspacePermissions } from "@/features/workspaces/hooks";

const actions = [
  { label: "Properties", href: "properties", icon: Globe2 },
  { label: "Discovery", href: "discovery", icon: Search },
  { label: "Competitors", href: "competitors", icon: Users },
  { label: "Scope", href: "scope", icon: ShieldCheck },
];

export function WorkspaceOverviewPage() {
  const { workspaceId } = useParams();
  const workspaceQuery = useWorkspace(workspaceId);
  const permissionsQuery = useWorkspacePermissions(workspaceId);

  if (workspaceQuery.isLoading) return <DetailSkeleton />;
  if (workspaceQuery.isError || !workspaceQuery.data) {
    return <ErrorState message="This workspace was not found or you do not have access." />;
  }

  return (
    <>
      <WorkspaceHeader workspace={workspaceQuery.data} />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Assessment setup</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {actions.map(({ label, href, icon: Icon }) => (
              <Button key={href} asChild variant="outline" className="h-auto justify-start py-4">
                <Link to={`/workspaces/${workspaceId}/${href}`}>
                  <Icon data-icon="inline-start" />
                  {label}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Effective permissions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {permissionsQuery.isLoading && <BadgeListSkeleton />}
            {(permissionsQuery.data?.permissions ?? []).map((permission) => (
              <span
                key={permission}
                className="rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground"
              >
                {permission}
              </span>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
