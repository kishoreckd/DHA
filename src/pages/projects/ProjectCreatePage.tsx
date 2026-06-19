import { DatabaseZap, FolderPlus, PlayCircle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function ProjectCreatePage() {
  return (
    <>
      <PageHeader
        eyebrow="Create project"
        title="New client setup"
        description="This UI flow is ready for the backend: create the client record, create a client folder, call Semrush Top Pages, and prepare the metric baseline workspace."
      />
      <div className="page-shell">
        <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <Card>
            <CardHeader>
              <CardTitle>Client details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium">Client name</span>
                <Input defaultValue="Lysol Digital Experience" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Domain</span>
                <Input defaultValue="lysol.com" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Assessment template</span>
                <Select defaultValue="dx-baseline">
                  <option value="dx-baseline">DX Health Vitals Baseline</option>
                  <option value="custom">Custom metric set</option>
                </Select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Evidence store</span>
                <Select defaultValue="sharepoint">
                  <option value="sharepoint">SharePoint</option>
                  <option value="local">Local folder</option>
                </Select>
              </label>
              <div className="md:col-span-2 flex flex-wrap gap-2 pt-2">
                <Button>
                  <FolderPlus className="h-4 w-4" />
                  Create Client System
                </Button>
                <Button variant="secondary">
                  <DatabaseZap className="h-4 w-4" />
                  Run Semrush Top Pages
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Backend sequence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Create project/client record",
                "Create folder for domain",
                "Call Semrush API for Top Pages",
                "Return Top Pages to UI for classification",
                "Create metric baseline pages from DX workbook",
              ].map((step, index) => (
                <div key={step} className="flex gap-3 rounded-lg border p-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-secondary-foreground">
                    {index + 1}
                  </div>
                  <div className="text-sm font-medium">{step}</div>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                <PlayCircle className="h-4 w-4" />
                Preview created workspace
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
