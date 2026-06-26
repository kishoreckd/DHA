import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspaces } from "../hooks";

export function WorkspaceSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: workspaces = [], isLoading } = useWorkspaces();
  const activeWorkspaceId = useMemo(() => {
    const match = location.pathname.match(/^\/workspaces\/([^/]+)/);
    return match?.[1] || "";
  }, [location.pathname]);

  if (isLoading || workspaces.length === 0) {
    return null;
  }

  return (
    <Select value={activeWorkspaceId} onValueChange={(value) => navigate(`/workspaces/${value}`)}>
      <SelectTrigger className="hidden w-[220px] bg-background sm:flex" aria-label="Switch workspace">
        <SelectValue placeholder="Select workspace" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {workspaces.map((workspace) => (
            <SelectItem key={workspace.id} value={workspace.id}>
              {workspace.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
