import { apiRequest, jsonBody } from "./client";

export type AnyRecord = Record<string, unknown>;

function normalizeList<T>(value: T[] | AnyRecord): T[] {
  if (Array.isArray(value)) return value;
  const keys = ["items", "data", "results", "reports", "publications", "reviews", "groups", "permissions", "events", "tools", "jobs"];
  for (const key of keys) {
    const nested = value[key];
    if (Array.isArray(nested)) return nested as T[];
  }
  return [];
}

export type Report = {
  id: string;
  title?: string | null;
  status?: string | null;
  assessment_id?: string | null;
  current_version_id?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  sections?: Array<{ key?: string; title?: string; content?: string; order?: number }>;
};

export type Review = {
  id: string;
  title?: string | null;
  status?: string | null;
  source_type?: string | null;
  source_id?: string | null;
  workspace_id?: string | null;
  reviewer_emails?: string[];
  created_at?: string | null;
  updated_at?: string | null;
};

export type PermissionGroup = {
  id: string;
  name: string;
  description?: string | null;
  permissions?: string[];
  status?: string | null;
};

export type AuditEvent = {
  id?: string;
  action?: string;
  actor_email?: string;
  subject?: string;
  created_at?: string;
  metadata?: unknown;
};

export type CrawlerTool = {
  key?: string;
  tool_key?: string;
  display_name?: string;
  folder?: string;
  status?: string;
};

export type CrawlerJob = {
  id?: string;
  job_id?: string;
  tool?: string;
  tool_key?: string;
  url?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

export const reportsApi = {
  list: async (workspaceId: string) =>
    normalizeList<Report>(await apiRequest<Report[] | AnyRecord>(`/api/gateway/workspaces/${workspaceId}/reports`)),
  get: (workspaceId: string, reportId: string) =>
    apiRequest<Report>(`/api/gateway/workspaces/${workspaceId}/reports/${reportId}`),
  create: (workspaceId: string, input: AnyRecord) =>
    apiRequest<Report>(`/api/gateway/workspaces/${workspaceId}/reports`, {
      method: "POST",
      body: jsonBody(input),
    }),
  update: (workspaceId: string, reportId: string, input: AnyRecord) =>
    apiRequest<Report>(`/api/gateway/workspaces/${workspaceId}/reports/${reportId}`, {
      method: "PATCH",
      body: jsonBody(input),
    }),
  renderHtml: (workspaceId: string, reportId: string) =>
    apiRequest<AnyRecord>(`/api/gateway/workspaces/${workspaceId}/reports/${reportId}/render-html`, {
      method: "POST",
      body: jsonBody({ notes: "Render HTML from frontend." }),
    }),
  renderPdf: (workspaceId: string, reportId: string) =>
    apiRequest<AnyRecord>(`/api/gateway/workspaces/${workspaceId}/reports/${reportId}/render-pdf`, {
      method: "POST",
      body: jsonBody({ notes: "Render PDF from frontend." }),
    }),
  publish: (workspaceId: string, reportId: string, publicAccess = false) =>
    apiRequest<Report>(`/api/gateway/workspaces/${workspaceId}/reports/${reportId}/publish`, {
      method: "POST",
      body: jsonBody({ notes: "Publish approved report.", public_access: publicAccess }),
    }),
  supersede: (workspaceId: string, reportId: string) =>
    apiRequest<Report>(`/api/gateway/workspaces/${workspaceId}/reports/${reportId}/supersede`, {
      method: "POST",
      body: jsonBody({ reason: "Superseded from frontend." }),
    }),
  publications: async () =>
    normalizeList<Report>(await apiRequest<Report[] | AnyRecord>("/api/gateway/publications")),
};

export const reviewsApi = {
  list: async () => normalizeList<Review>(await apiRequest<Review[] | AnyRecord>("/api/gateway/reviews")),
  get: (reviewId: string) => apiRequest<Review>(`/api/gateway/reviews/${reviewId}`),
  create: (input: AnyRecord) =>
    apiRequest<Review>("/api/gateway/reviews", { method: "POST", body: jsonBody(input) }),
  comment: (reviewId: string, input: AnyRecord) =>
    apiRequest<AnyRecord>(`/api/gateway/reviews/${reviewId}/comments`, { method: "POST", body: jsonBody(input) }),
  requestChanges: (reviewId: string, reason: string) =>
    apiRequest<Review>(`/api/gateway/reviews/${reviewId}/request-changes`, {
      method: "POST",
      body: jsonBody({ reason }),
    }),
  approve: (reviewId: string) =>
    apiRequest<Review>(`/api/gateway/reviews/${reviewId}/approve`, {
      method: "POST",
      body: jsonBody({ notes: "Approved from frontend." }),
    }),
  reject: (reviewId: string) =>
    apiRequest<Review>(`/api/gateway/reviews/${reviewId}/reject`, {
      method: "POST",
      body: jsonBody({ notes: "Rejected from frontend." }),
    }),
  comparison: (reviewId: string) => apiRequest<AnyRecord>(`/api/gateway/reviews/${reviewId}/comparison`),
};

export const permissionsApi = {
  catalog: async () =>
    normalizeList<AnyRecord>(await apiRequest<AnyRecord[] | AnyRecord>("/api/gateway/admin/permissions/catalog")),
  groups: async () =>
    normalizeList<PermissionGroup>(await apiRequest<PermissionGroup[] | AnyRecord>("/api/gateway/admin/permissions/groups")),
  createGroup: (input: AnyRecord) =>
    apiRequest<PermissionGroup>("/api/gateway/admin/permissions/groups", { method: "POST", body: jsonBody(input) }),
  updateGroup: (groupId: string, input: AnyRecord) =>
    apiRequest<PermissionGroup>(`/api/gateway/admin/permissions/groups/${groupId}`, {
      method: "PATCH",
      body: jsonBody(input),
    }),
  assign: (input: AnyRecord) =>
    apiRequest<AnyRecord>("/api/gateway/admin/permissions/assignments", { method: "POST", body: jsonBody(input) }),
  adminAudit: async (action = "", limit = 100) => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (action) qs.set("action", action);
    return normalizeList<AuditEvent>(await apiRequest<AuditEvent[] | AnyRecord>(`/api/gateway/admin/audit-events?${qs}`));
  },
  workspaceAudit: async (workspaceId: string, limit = 100) =>
    normalizeList<AuditEvent>(
      await apiRequest<AuditEvent[] | AnyRecord>(`/api/gateway/workspaces/${workspaceId}/audit-events?limit=${limit}`),
    ),
};

export const operationsApi = {
  readiness: () => apiRequest<AnyRecord>("/api/gateway/ready"),
  status: () => apiRequest<AnyRecord>("/api/gateway/admin/operations/status"),
  cleanupArtifacts: (dryRun = true) =>
    apiRequest<AnyRecord>(`/api/gateway/admin/operations/artifacts/cleanup?dry_run=${dryRun}`, { method: "POST" }),
};

export const crawlerApi = {
  tools: async () =>
    normalizeList<CrawlerTool>(await apiRequest<CrawlerTool[] | AnyRecord>("/api/crawler/tools?include_inactive=true")),
  updateTool: (toolKey: string, input: AnyRecord) =>
    apiRequest<CrawlerTool>(`/api/crawler/tools/${toolKey}`, { method: "PATCH", body: jsonBody(input) }),
  run: (tool: string, input: AnyRecord) =>
    apiRequest<AnyRecord>(`/api/crawler/${tool}`, { method: "POST", body: jsonBody(input) }),
  jobs: async () => normalizeList<CrawlerJob>(await apiRequest<CrawlerJob[] | AnyRecord>("/api/crawler/jobs?limit=20")),
  job: (jobId: string) => apiRequest<CrawlerJob>(`/api/crawler/jobs/${jobId}`),
  ocr: (input: AnyRecord) =>
    apiRequest<AnyRecord>("/api/crawler/ocr/extract", { method: "POST", body: jsonBody(input) }),
};
