import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ExternalLink, LoaderCircle, Play, RefreshCw, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useState } from "react";
import { PageHeader, StatusBadge } from "@/components/common/product-ui";
import { crawlerApi } from "@/lib/api/crawler";
import type { ToolKey, ToolRun } from "@/types/assessment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const tools: Array<{ key: ToolKey; label: string; description: string }> = [
  { key: "crawl", label: "Core crawler", description: "Primary site crawl and discovery" },
  { key: "pagespeed", label: "PageSpeed Insights", description: "Core Web Vitals and lab performance" },
  { key: "gtmetrix", label: "GTmetrix", description: "Waterfall and performance diagnostics" },
  { key: "catchpoint", label: "Catchpoint", description: "Synthetic experience monitoring" },
  { key: "webpage", label: "Webpage analysis", description: "Page structure and implementation evidence" },
  { key: "httpsecurityheaders", label: "Security headers", description: "HTTP security header posture" },
  { key: "ssllabs", label: "SSL Labs", description: "TLS and certificate assessment" },
  { key: "beacon", label: "Beacon", description: "Privacy and tracking signals" },
  { key: "dnschecker", label: "DNS Checker", description: "DNS availability and configuration" },
  { key: "websitepulse", label: "WebsitePulse", description: "Availability and response checks" },
  { key: "pingdom", label: "Pingdom", description: "Page performance and uptime" },
  { key: "silktide", label: "Silktide", description: "Accessibility and quality checks" },
];

const schema = z.object({
  url: z.string().url("Enter a complete URL, including https://"),
  selected: z.array(z.string()).min(1, "Select at least one tool"),
});

export function ToolSyncPage() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      url: "",
      selected: ["pagespeed", "webpage", "httpsecurityheaders", "ssllabs"],
    },
  });
  const [runs, setRuns] = useState<ToolRun[]>(
    tools.map((tool) => ({ tool: tool.key, label: tool.label, state: "idle" })),
  );

  async function start({ url, selected }: z.infer<typeof schema>) {
    const chosen = selected as ToolKey[];
    setRuns((cur) =>
      cur.map((run) => (chosen.includes(run.tool) ? { ...run, state: "queued" } : run)),
    );
    toast.message(`Queued ${chosen.length} assessment tools`);
    for (const tool of chosen) {
      const startedAt = new Date().toISOString();
      setRuns((cur) =>
        cur.map((run) => (run.tool === tool ? { ...run, state: "running", startedAt } : run)),
      );
      try {
        const result = await crawlerApi.run(tool, url);
        const artifacts = extractArtifacts(result);
        setRuns((cur) =>
          cur.map((run) =>
            run.tool === tool
              ? { ...run, state: "completed", completedAt: new Date().toISOString(), artifacts, message: "Synchronization completed" }
              : run,
          ),
        );
      } catch (error) {
        setRuns((cur) =>
          cur.map((run) =>
            run.tool === tool
              ? { ...run, state: "failed", completedAt: new Date().toISOString(), message: error instanceof Error ? error.message : "Tool failed" }
              : run,
          ),
        );
      }
    }
    toast.success("Tool synchronization finished");
  }

  return (
    <>
      <PageHeader
        eyebrow="EVIDENCE COLLECTION"
        title="Tool synchronization"
        description="Run selected assessment services against one target website. API keys remain on the server."
      />
      <form
        className="grid grid-cols-1 md:grid-cols-[minmax(420px,.9fr)_minmax(500px,1.1fr)] gap-4"
        onSubmit={form.handleSubmit(start)}
      >
        {/* Config panel */}
        <Card>
          <CardHeader>
            <span className="text-[10px] font-extrabold tracking-widest text-primary uppercase">
              TARGET
            </span>
            <CardTitle>Assessment website</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="url">Website URL</Label>
              <Input id="url" placeholder="https://www.example.com" {...form.register("url")} />
              {form.formState.errors.url && (
                <p className="text-[11px] text-destructive">{form.formState.errors.url.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {tools.map((tool) => {
                const checked = form.watch("selected").includes(tool.key);
                return (
                  <label
                    key={tool.key}
                    className={cn(
                      "flex items-start gap-2.5 min-h-[68px] p-3 rounded-md border cursor-pointer transition-colors",
                      checked
                        ? "border-blue-300 bg-blue-50"
                        : "border-border hover:border-border/80 hover:bg-muted/30",
                    )}
                  >
                    <input
                      type="checkbox"
                      value={tool.key}
                      className="mt-0.5 w-auto"
                      {...form.register("selected")}
                    />
                    <span className="flex flex-col gap-1">
                      <strong className="text-sm leading-none">{tool.label}</strong>
                      <small className="text-muted-foreground text-xs">{tool.description}</small>
                    </span>
                  </label>
                );
              })}
            </div>

            {form.formState.errors.selected && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {form.formState.errors.selected.message}
              </div>
            )}

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Play />
              )}
              Start synchronization
            </Button>
          </CardContent>
        </Card>

        {/* Status panel */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <span className="text-[10px] font-extrabold tracking-widest text-primary uppercase">
                LIVE STATUS
              </span>
              <CardTitle>Tool activity</CardTitle>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Refresh status"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {runs.map((run) => (
                <article
                  key={run.tool}
                  className="grid grid-cols-[34px_1fr_auto] items-center gap-3 min-h-[67px] py-2"
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full",
                      run.state === "completed" && "bg-emerald-50 text-emerald-600",
                      run.state === "failed" && "bg-red-50 text-red-600",
                      run.state === "running" && "bg-blue-50 text-blue-600",
                      run.state === "idle" || run.state === "queued"
                        ? "bg-slate-100 text-slate-400"
                        : "",
                    )}
                  >
                    {run.state === "completed" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : run.state === "failed" ? (
                      <XCircle className="h-4 w-4" />
                    ) : run.state === "running" ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : null}
                  </span>

                  <div className="flex flex-col gap-0.5 min-w-0">
                    <strong className="text-sm leading-none">{run.label}</strong>
                    <small className="text-muted-foreground text-xs">
                      {run.message || "Ready to run"}
                    </small>
                    {run.startedAt && (
                      <time className="text-muted-foreground text-[11px]">
                        Started {new Date(run.startedAt).toLocaleTimeString()}
                      </time>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge value={run.state} />
                    {run.artifacts?.map((artifact) => (
                      <a
                        key={artifact.url}
                        href={artifact.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${artifact.label}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </CardContent>
        </Card>
      </form>
    </>
  );
}

function extractArtifacts(result: unknown) {
  if (!result || typeof result !== "object") return [];
  const entries = Object.entries(result as Record<string, unknown>);
  return entries
    .filter(([, value]) => typeof value === "string" && /^https?:\/\//.test(value))
    .map(([label, url]) => ({ label, url: url as string }));
}
