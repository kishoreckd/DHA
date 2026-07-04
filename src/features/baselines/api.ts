import { apiRequest, jsonBody } from "@/lib/api/client";
import type { Baseline, BaselineCreateInput, BaselineStatus } from "./types";

export const baselinesApi = {
  list: () => apiRequest<Baseline[]>("/api/gateway/baselines"),
  create: (input: BaselineCreateInput) =>
    apiRequest<Baseline>("/api/gateway/baselines", {
      method: "POST",
      body: jsonBody({ status: "draft", tool_reports: [], ...input }),
    }),
  get: (baselineId: string) => apiRequest<Baseline>(`/api/gateway/baselines/${baselineId}`),
  updateStatus: (baselineId: string, status: BaselineStatus) =>
    apiRequest<Baseline>(`/api/gateway/baselines/${baselineId}/status`, {
      method: "PATCH",
      body: jsonBody({ status }),
    }),
  archive: (baselineId: string) =>
    apiRequest<null>(`/api/gateway/baselines/${baselineId}`, { method: "DELETE" }),
};
