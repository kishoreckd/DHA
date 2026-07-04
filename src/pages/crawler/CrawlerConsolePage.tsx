import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, RefreshCw } from "lucide-react";
import { useState } from "react";
import { appToast } from "@/lib/toast";
import { crawlerApi } from "@/lib/api/collection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, ErrorState, ListRowsSkeleton, PageHeader } from "@/components/common/product-ui";
import { ActionCard, DataRow, Field, JsonBlock, TextAreaField } from "@/components/common/api-panels";

const crawlerTools = [
  "crawl",
  "gtmetrix",
  "catchpoint",
  "pagespeed",
  "pingdom",
  "webpage",
  "ssllabs",
  "httpsecurityheaders",
  "websitepulse",
  "dnschecker",
  "beacon",
  "silktide",
];

export function CrawlerConsolePage() {
  const queryClient = useQueryClient();
  const [tool, setTool] = useState("pagespeed");
  const [url, setUrl] = useState("");
  const [outputFormat, setOutputFormat] = useState("html");
  const [uploadToSharePoint, setUploadToSharePoint] = useState(true);
  const [includeRaw, setIncludeRaw] = useState(false);
  const [selectedToolKey, setSelectedToolKey] = useState("");
  const [toolName, setToolName] = useState("");
  const [toolFolder, setToolFolder] = useState("");
  const [jobId, setJobId] = useState("");
  const [jobDetail, setJobDetail] = useState<unknown>(null);
  const [ocrInput, setOcrInput] = useState("");

  const toolsQuery = useQuery({ queryKey: ["crawler", "tools"], queryFn: crawlerApi.tools });
  const jobsQuery = useQuery({ queryKey: ["crawler", "jobs"], queryFn: crawlerApi.jobs });

  const runCrawler = useMutation({
    mutationFn: () =>
      crawlerApi.run(tool, {
        url,
        output_format: outputFormat,
        upload_to_sharepoint: tool !== "crawl" && uploadToSharePoint,
        include_raw: includeRaw,
      }),
    onSuccess: (result) => {
      appToast.success("Crawler job submitted");
      const returnedJobId =
        typeof result.job_id === "string" ? result.job_id : typeof result.id === "string" ? result.id : "";
      if (returnedJobId) setJobId(returnedJobId);
      void queryClient.invalidateQueries({ queryKey: ["crawler", "jobs"] });
    },
  });

  const updateTool = useMutation({
    mutationFn: () =>
      crawlerApi.updateTool(selectedToolKey, {
        display_name: toolName,
        folder: toolFolder,
        status: "active",
      }),
    onSuccess: () => {
      appToast.success("Crawler tool updated");
      void queryClient.invalidateQueries({ queryKey: ["crawler", "tools"] });
    },
  });

  const loadJob = useMutation({
    mutationFn: () => crawlerApi.job(jobId),
    onSuccess: setJobDetail,
  });

  const ocr = useMutation({
    mutationFn: () => crawlerApi.ocr({ image_url: ocrInput, url: ocrInput }),
    onSuccess: () => appToast.success("OCR extraction completed"),
  });

  return (
    <>
      <PageHeader
        eyebrow="Crawler"
        title="Crawler console"
        description="Run crawler tools, manage crawler catalog entries, inspect jobs, and call OCR extraction."
        actions={
          <Button
            variant="outline"
            onClick={() => {
              void toolsQuery.refetch();
              void jobsQuery.refetch();
            }}
          >
            <RefreshCw data-icon="inline-start" />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ActionCard
          title="Run crawler"
          description="Maps to /crawl and individual /crawl/{tool} endpoints."
          action={{ label: "Run", onClick: () => runCrawler.mutate() }}
          pending={runCrawler.isPending}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="crawler-tool">Tool</Label>
            <Select value={tool} onValueChange={setTool}>
              <SelectTrigger id="crawler-tool">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {crawlerTools.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Field id="crawler-url" label="URL" value={url} onChange={setUrl} placeholder="https://example.com" />
          <Field id="output-format" label="Output format" value={outputFormat} onChange={setOutputFormat} />
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={uploadToSharePoint}
                onCheckedChange={(checked) => setUploadToSharePoint(checked === true)}
                disabled={tool === "crawl"}
              />
              Upload to SharePoint
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={includeRaw} onCheckedChange={(checked) => setIncludeRaw(checked === true)} />
              Include raw
            </label>
          </div>
          <JsonBlock value={runCrawler.data} />
        </ActionCard>

        <Card>
          <CardHeader>
            <CardTitle>Crawler tools</CardTitle>
            <CardDescription>GET/PATCH /crawl/tools endpoints via the frontend proxy.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {toolsQuery.isError && <ErrorState message="Unable to load crawler tools." retry={() => void toolsQuery.refetch()} />}
            {toolsQuery.isLoading ? (
              <ListRowsSkeleton rows={5} />
            ) : (toolsQuery.data ?? []).length === 0 ? (
              <EmptyState icon={<Bot />} title="No crawler tools returned" />
            ) : (
              toolsQuery.data?.map((item) => {
                const key = item.tool_key || item.key || item.display_name || "";
                return (
                  <DataRow
                    key={key}
                    title={item.display_name || key}
                    detail={item.folder || key}
                    status={item.status}
                    action={
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedToolKey(key);
                          setToolName(item.display_name || key);
                          setToolFolder(item.folder || "");
                        }}
                      >
                        Edit
                      </Button>
                    }
                  />
                );
              })
            )}
          </CardContent>
        </Card>

        <ActionCard
          title="Update crawler tool"
          description="Maps to PATCH /crawl/tools/{tool_key}."
          action={{ label: "Update tool", onClick: () => updateTool.mutate() }}
          pending={updateTool.isPending}
        >
          <Field id="crawler-tool-key" label="Tool key" value={selectedToolKey} onChange={setSelectedToolKey} />
          <Field id="crawler-tool-name" label="Display name" value={toolName} onChange={setToolName} />
          <Field id="crawler-tool-folder" label="Folder" value={toolFolder} onChange={setToolFolder} />
        </ActionCard>

        <Card>
          <CardHeader>
            <CardTitle>Crawler jobs</CardTitle>
            <CardDescription>GET /crawl/jobs and GET /crawl/jobs/&lbrace;crawler_job_id&rbrace;.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Field id="crawler-job-id" label="Job ID" value={jobId} onChange={setJobId} />
            <Button variant="outline" onClick={() => loadJob.mutate()} disabled={!jobId || loadJob.isPending}>
              Load job status
            </Button>
            {(jobsQuery.data ?? []).map((job) => {
              const id = job.job_id || job.id || "";
              return (
                <DataRow
                  key={id}
                  title={id || job.url || "Crawler job"}
                  detail={job.url || job.tool_key || job.tool || "No URL"}
                  status={job.status}
                  action={
                    id ? (
                      <Button size="sm" variant="outline" onClick={() => setJobId(id)}>
                        Use
                      </Button>
                    ) : null
                  }
                />
              );
            })}
            <JsonBlock value={jobDetail} />
          </CardContent>
        </Card>

        <ActionCard
          title="OCR extract"
          description="Maps to POST /ocr/extract."
          action={{ label: "Extract text", onClick: () => ocr.mutate() }}
          pending={ocr.isPending}
        >
          <TextAreaField id="ocr-input" label="Image URL or OCR source" value={ocrInput} onChange={setOcrInput} rows={3} />
          <JsonBlock value={ocr.data} />
        </ActionCard>
      </div>
    </>
  );
}
