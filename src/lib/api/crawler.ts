import { apiRequest, jsonBody } from "./client";
import type { ToolKey } from "@/types/assessment";

export type CrawlerRunOptions = {
  output_format?: "html" | "json" | "screenshot";
  upload_to_sharepoint?: boolean;
  include_raw?: boolean;
};

export type CrawlerTool = {
  key?: string;
  tool_key?: string;
  display_name?: string;
  name?: string;
  folder?: string;
  status?: "active" | "inactive" | string;
  description?: string | null;
};

export const crawlerApi = {
  tools: (includeInactive = true) =>
    apiRequest<CrawlerTool[]>(`/api/crawler/tools?include_inactive=${includeInactive}`),
  updateTool: (toolKey: string, input: Pick<CrawlerTool, "display_name" | "folder" | "status">) =>
    apiRequest<CrawlerTool>(`/api/crawler/tools/${toolKey}`, {
      method: "PATCH",
      body: jsonBody(input),
    }),
  run: (tool: ToolKey, url: string, options: CrawlerRunOptions = {}) =>
    apiRequest<unknown>(`/api/crawler/${tool}`, {
      method: "POST",
      body: jsonBody({
        url,
        output_format: options.output_format ?? (tool === "catchpoint" ? "json" : tool === "silktide" ? "screenshot" : "html"),
        upload_to_sharepoint: options.upload_to_sharepoint ?? true,
        include_raw: options.include_raw ?? false,
      }),
    }),
  jobs: (limit = 20) => apiRequest<unknown[]>(`/api/crawler/jobs?limit=${limit}`),
  job: (jobId: string) => apiRequest<unknown>(`/api/crawler/jobs/${jobId}`),
  ocrExtract: (input: unknown) =>
    apiRequest<unknown>("/api/crawler/ocr/extract", {
      method: "POST",
      body: jsonBody(input),
    }),
};
