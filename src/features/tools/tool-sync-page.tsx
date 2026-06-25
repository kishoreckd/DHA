"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ExternalLink, LoaderCircle, Play, RefreshCw, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useState } from "react";
import { PageHeader, StatusBadge } from "@/components/common/product-ui";
import { crawlerApi } from "@/lib/api/crawler";
import type { ToolKey, ToolRun } from "@/types/assessment";

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
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { url: "", selected: ["pagespeed", "webpage", "httpsecurityheaders", "ssllabs"] } });
  const [runs, setRuns] = useState<ToolRun[]>(tools.map((tool) => ({ tool: tool.key, label: tool.label, state: "idle" })));

  async function start({ url, selected }: z.infer<typeof schema>) {
    const chosen = selected as ToolKey[];
    setRuns((current) => current.map((run) => chosen.includes(run.tool) ? { ...run, state: "queued" } : run));
    toast.message(`Queued ${chosen.length} assessment tools`);
    for (const tool of chosen) {
      const startedAt = new Date().toISOString();
      setRuns((current) => current.map((run) => run.tool === tool ? { ...run, state: "running", startedAt } : run));
      try {
        const result = await crawlerApi.run(tool, url);
        const artifacts = extractArtifacts(result);
        setRuns((current) => current.map((run) => run.tool === tool ? { ...run, state: "completed", completedAt: new Date().toISOString(), artifacts, message: "Synchronization completed" } : run));
      } catch (error) {
        setRuns((current) => current.map((run) => run.tool === tool ? { ...run, state: "failed", completedAt: new Date().toISOString(), message: error instanceof Error ? error.message : "Tool failed" } : run));
      }
    }
    toast.success("Tool synchronization finished");
  }

  return (
    <>
      <PageHeader eyebrow="EVIDENCE COLLECTION" title="Tool synchronization" description="Run selected assessment services against one target website. API keys remain on the server." />
      <form className="sync-layout" onSubmit={form.handleSubmit(start)}>
        <section className="panel">
          <header><div><span className="eyebrow">TARGET</span><h2>Assessment website</h2></div></header>
          <label>Website URL<input placeholder="https://www.example.com" {...form.register("url")} /><small>{form.formState.errors.url?.message}</small></label>
          <div className="tool-selection">
            {tools.map((tool) => {
              const checked = form.watch("selected").includes(tool.key);
              return <label key={tool.key} className={checked ? "selected" : ""}><input type="checkbox" value={tool.key} {...form.register("selected")} /><span><strong>{tool.label}</strong><small>{tool.description}</small></span></label>;
            })}
          </div>
          {form.formState.errors.selected && <div className="form-alert">{form.formState.errors.selected.message}</div>}
          <button className="button primary" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <LoaderCircle className="spin" /> : <Play />}Start synchronization</button>
        </section>
        <section className="panel">
          <header><div><span className="eyebrow">LIVE STATUS</span><h2>Tool activity</h2></div><button type="button" className="icon-button" aria-label="Refresh status"><RefreshCw /></button></header>
          <div className="run-list">
            {runs.map((run) => <article key={run.tool}>
              <span className={`run-icon ${run.state}`}>{run.state === "completed" ? <CheckCircle2 /> : run.state === "failed" ? <XCircle /> : run.state === "running" ? <LoaderCircle className="spin" /> : <span />}</span>
              <div><strong>{run.label}</strong><small>{run.message || "Ready to run"}</small>{run.startedAt && <time>Started {new Date(run.startedAt).toLocaleTimeString()}</time>}</div>
              <div><StatusBadge value={run.state} />{run.artifacts?.map((artifact) => <a key={artifact.url} href={artifact.url} target="_blank" rel="noreferrer" aria-label={`Open ${artifact.label}`}><ExternalLink /></a>)}</div>
            </article>)}
          </div>
        </section>
      </form>
    </>
  );
}

function extractArtifacts(result: unknown) {
  if (!result || typeof result !== "object") return [];
  const entries = Object.entries(result as Record<string, unknown>);
  return entries.filter(([, value]) => typeof value === "string" && /^https?:\/\//.test(value)).map(([label, url]) => ({ label, url: url as string }));
}
