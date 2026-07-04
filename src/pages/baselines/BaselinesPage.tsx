import { Archive, LoaderCircle, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { appToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, ErrorState, PageHeader, StatusBadge, TableSkeleton } from "@/components/common/product-ui";
import { useArchiveBaseline, useBaselines, useCreateBaseline, useUpdateBaselineStatus } from "@/features/baselines/hooks";

export function BaselinesPage() {
  const baselinesQuery = useBaselines();
  const createBaseline = useCreateBaseline();
  const updateStatus = useUpdateBaselineStatus();
  const archiveBaseline = useArchiveBaseline();
  const [form, setForm] = useState({ name: "", client_name: "", target_url: "" });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createBaseline.mutateAsync({ ...form, status: "draft", tool_reports: [] });
    setForm({ name: "", client_name: "", target_url: "" });
    appToast.success("Baseline created");
  }

  async function markReady(id: string) {
    await updateStatus.mutateAsync({ id, status: "ready" });
    appToast.success("Baseline marked ready");
  }

  async function archive(id: string) {
    await archiveBaseline.mutateAsync(id);
    appToast.success("Baseline archived");
  }

  return (
    <>
      <PageHeader
        eyebrow="Baselines"
        title="Baseline library"
        description="Create, list, inspect, ready, and archive baselines from the Postman baseline APIs."
      />
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create baseline</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="baseline-name">Name</Label>
                <Input
                  id="baseline-name"
                  value={form.name}
                  onChange={(event) => setForm((cur) => ({ ...cur, name: event.target.value }))}
                  placeholder="Lysol Q2 2025 Baseline"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="baseline-client">Client name</Label>
                <Input
                  id="baseline-client"
                  value={form.client_name}
                  onChange={(event) => setForm((cur) => ({ ...cur, client_name: event.target.value }))}
                  placeholder="Lysol"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="baseline-url">Target URL</Label>
                <Input
                  id="baseline-url"
                  type="url"
                  value={form.target_url}
                  onChange={(event) => setForm((cur) => ({ ...cur, target_url: event.target.value }))}
                  placeholder="https://example.com"
                  required
                />
              </div>
              <Button disabled={createBaseline.isPending || !form.name || !form.target_url}>
                {createBaseline.isPending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <Plus data-icon="inline-start" />}
                Create baseline
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Saved baselines</CardTitle>
          </CardHeader>
          <CardContent>
            {baselinesQuery.isLoading && <TableSkeleton columns={6} />}
            {baselinesQuery.isError && <ErrorState message="Unable to load baselines." retry={() => void baselinesQuery.refetch()} />}
            {baselinesQuery.data?.length === 0 && <EmptyState icon={<Archive />} title="No baselines yet" />}
            {baselinesQuery.data && baselinesQuery.data.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-sm">
                  <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Name</th>
                      <th className="px-3 py-2 font-semibold">Client</th>
                      <th className="px-3 py-2 font-semibold">Target</th>
                      <th className="px-3 py-2 font-semibold">Status</th>
                      <th className="px-3 py-2 font-semibold">Reports</th>
                      <th className="px-3 py-2 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {baselinesQuery.data.map((baseline) => (
                      <tr key={baseline.id}>
                        <td className="px-3 py-3 font-medium">
                          <Link className="hover:underline" to={`/baselines/${baseline.id}`}>
                            {baseline.name}
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{baseline.client_name || "—"}</td>
                        <td className="max-w-[260px] truncate px-3 py-3 text-muted-foreground">{baseline.target_url || "—"}</td>
                        <td className="px-3 py-3"><StatusBadge value={baseline.status} /></td>
                        <td className="px-3 py-3">{baseline.tool_reports?.length ?? 0}</td>
                        <td className="px-3 py-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => markReady(baseline.id)} disabled={updateStatus.isPending}>
                              Ready
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => archive(baseline.id)} disabled={archiveBaseline.isPending}>
                              Archive
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
