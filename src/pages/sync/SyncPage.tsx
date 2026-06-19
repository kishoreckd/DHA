import { DatabaseZap, FileSpreadsheet, RefreshCcw, UploadCloud } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { pillarPages } from "@/data/pillars";

export function SyncPage() {
  const needSync = pillarPages.filter((page) => page.syncStatus === "Needs sync").length;
  const missing = pillarPages.filter((page) => page.syncStatus === "Missing evidence").length;
  const completed = pillarPages.length - needSync - missing;

  return (
    <>
      <PageHeader
        eyebrow="SharePoint and sheet sync"
        title="Baseline, export, and tool sync"
        description="Sync Baseline pulls the latest evidence PDFs from SharePoint for every metric. Export Sheet creates a workbook from edited UI data. Sync tools updates automation outputs per project."
        actions={
          <>
            <Button variant="outline">
              <UploadCloud className="h-4 w-4" />
              Sync to Sheet
            </Button>
            <Button>
              <RefreshCcw className="h-4 w-4" />
              Sync Baseline
            </Button>
          </>
        }
      />
      <div className="page-shell">
        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Synced or draft</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{completed}</div>
              <Progress value={(completed / pillarPages.length) * 100} className="mt-4" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Needs sync</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{needSync}</div>
              <Progress value={(needSync / pillarPages.length) * 100} className="mt-4" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Missing evidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{missing}</div>
              <Progress value={(missing / pillarPages.length) * 100} className="mt-4" />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          {[
            {
              icon: DatabaseZap,
              title: "Sync Baseline",
              badge: "SharePoint PDF pull",
              text: "Read metric PDFs from the client folder and map each PDF back to P01-P40 evidence fields.",
            },
            {
              icon: FileSpreadsheet,
              title: "Export Sheet",
              badge: "Workbook output",
              text: "Create an Excel baseline from editable UI metric data, classifications, evidence, and tool status.",
            },
            {
              icon: RefreshCcw,
              title: "Sync tools",
              badge: "Automation output",
              text: "Run configured tool integrations and update each project metric with fresh values and report files.",
            },
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <item.icon className="h-5 w-5 text-primary" />
                    {item.title}
                  </CardTitle>
                  <Badge variant="secondary">{item.badge}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{item.text}</p>
                <Button className="mt-4 w-full" variant="outline">
                  Configure
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </>
  );
}
