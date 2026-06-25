import { apiRequest, jsonBody } from "./client";
import type { ToolKey } from "@/types/assessment";

export const crawlerApi = {
  run: (tool: ToolKey, url: string) =>
    apiRequest<unknown>(`/api/crawler/${tool}`, {
      method: "POST",
      body: jsonBody({ url }),
    }),
};
