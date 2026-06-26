import { Plus, SquareStack } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CardGridSkeleton, EmptyState, ErrorState, PageHeader } from "@/components/common/product-ui";
import { WorkspaceCard } from "@/features/workspaces/components/WorkspaceCard";
import { useWorkspaces } from "@/features/workspaces/hooks";

export function WorkspacesListPage() {
  const { data: workspaces = [], isLoading, isError, refetch } = useWorkspaces();

  return (
    <>
      <PageHeader
        eyebrow="Workspaces"
        title="Assigned workspaces"
        actions={
          <Button asChild>
            <Link to="/workspaces/new">
              <Plus data-icon="inline-start" />
              New workspace
            </Link>
          </Button>
        }
      />
      {isLoading && <CardGridSkeleton />}
      {isError && <ErrorState message="Unable to load assigned workspaces." retry={() => void refetch()} />}
      {!isLoading && !isError && workspaces.length === 0 && (
        <EmptyState
          icon={<SquareStack />}
          title="No workspaces assigned"
        />
      )}
      {!isLoading && !isError && workspaces.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((workspace) => (
            <WorkspaceCard key={workspace.id} workspace={workspace} />
          ))}
        </div>
      )}
    </>
  );
}
