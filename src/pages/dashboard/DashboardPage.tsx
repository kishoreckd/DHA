import { Link } from "react-router-dom";
import { DatabaseZap, FileDown, FolderPlus, RefreshCcw, Wrench } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { pillarGroups, pillarPages } from "@/data/pillars";
import { topPages } from "@/data/topPages";
import { automationTools } from "@/data/tools";

export function DashboardPage() {
  const selectedPages = topPages.filter((page) => page.selected).length;
  const syncNeeded = pillarPages.filter((page) => page.syncStatus !== "Synced").length;
  const readyTools = automationTools.filter((tool) => tool.status === "Ready").length;

  return (
    <>
      <PageHeader
        eyebrow="Client workspace"
        title="Digital Health Assessment dashboard"
        description="Create a client project, pull Semrush Top Pages, classify PDP/PLP targets, maintain editable DX baseline metrics, and track tool automation for every project."
        actions={
          <>
            <Button onClick={() => (window.location.href = "/projects/new")}>
              <FolderPlus className="h-4 w-4" />
              Create Project
            </Button>
            <Button variant="outline">
              <RefreshCcw className="h-4 w-4" />
              Sync Baseline
            </Button>
          </>
        }
      />
      <div className="page-shell">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Projects", "1", "lysol.com baseline created"],
            ["Selected top pages", String(selectedPages), "Homepage, PDP, and PLP targets"],
            ["Metric pages", String(pillarPages.length), `${syncNeeded} waiting on sync/evidence`],
            ["Automation tools", String(automationTools.length), `${readyTools} ready to integrate`],
          ].map(([label, value, detail]) => (
            <Card key={label}>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{detail}</div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Pillar readiness</CardTitle>
                <Button variant="outline" size="sm">
                  <FileDown className="h-4 w-4" />
                  Export sheet
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {pillarGroups.map((group) => {
                const pages = pillarPages.filter((page) => page.pillar === group);
                const score = Math.round(pages.reduce((sum, page) => sum + page.score, 0) / pages.length);
                return (
                  <Link
                    key={group}
                    to="/projects/lysol/pillars"
                    className="block rounded-lg border p-4 transition-colors hover:bg-muted/60"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{group}</div>
                        <div className="mt-1 text-sm text-muted-foreground">{pages.length} metric pages</div>
                      </div>
                      <Badge variant={score < 50 ? "danger" : score < 65 ? "warning" : "success"}>{score}/100</Badge>
                    </div>
                    <Progress value={score} className="mt-3" />
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next backend hooks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                ["Create client folder", "Project button creates the backend client space for lysol.com."],
                ["Fetch Semrush pages", "Top Pages populate the UI table and await PDP/PLP classification."],
                ["Sync baseline PDFs", "SharePoint PDFs map back into every metric page."],
                ["Sync tools", "Automation integrations update project-level tool status."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <DatabaseZap className="h-4 w-4 text-primary" />
                    {title}
                  </div>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">{text}</p>
                </div>
              ))}
              <Link to="/projects/lysol/tools">
                <Button className="mt-2 w-full" variant="secondary">
                  <Wrench className="h-4 w-4" />
                  Review tool automation
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
