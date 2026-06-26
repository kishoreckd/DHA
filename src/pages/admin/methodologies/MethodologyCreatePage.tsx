import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/common/product-ui";
import { useAuth } from "@/features/auth/auth-provider";
import { useCreateMethodology } from "@/features/methodologies/hooks";

export function MethodologyCreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createMethodology = useCreateMethodology();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const canManage = user?.role === "admin" || user?.permissions.includes("methodology.manage");

  if (!canManage) return <Navigate to="/dashboard" replace />;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const methodology = await createMethodology.mutateAsync({ name, description });
    toast.success("Methodology draft created");
    navigate(`/admin/methodologies/${methodology.id}`);
  }

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="New methodology"
      />
      <Card>
        <CardHeader>
          <CardTitle>Draft details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex max-w-2xl flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="methodology-name">Name</Label>
              <Input id="methodology-name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="methodology-description">Description</Label>
              <Input
                id="methodology-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <Button type="submit" className="w-fit" disabled={createMethodology.isPending || !name.trim()}>
              {createMethodology.isPending && <LoaderCircle data-icon="inline-start" className="animate-spin" />}
              Create draft
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
