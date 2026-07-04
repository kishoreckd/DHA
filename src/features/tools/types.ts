export type ToolRunStatus = "queued" | "running" | "completed" | "partial" | "failed" | "cancelled" | "stale";

export type ToolDefinition = {
  key: string;
  name: string;
  description?: string | null;
  metric_area: string;
  supported_page_types: string[];
  requires_browser?: boolean;
  is_enabled: boolean;
};

export type ToolBatch = {
  id: string;
  workspace_id: string;
  name?: string | null;
  scope_id?: string | null;
  status: ToolRunStatus;
  tool_keys: string[];
  page_ids: string[];
  run_summary?: Record<string, unknown>;
  created_at: string;
};

export type ArtifactSummary = {
  id: string;
  name: string;
  artifact_type: string;
  size_bytes?: number | null;
  created_at: string;
};

export type Measurement = {
  id: string;
  metric_key: string;
  label: string;
  value: string | number | boolean | null;
  unit?: string | null;
  extracted_at: string;
};

export type ToolRun = {
  id: string;
  workspace_id: string;
  batch_id?: string | null;
  tool_key: string;
  tool_name?: string | null;
  page_id?: string | null;
  page_url?: string | null;
  status: ToolRunStatus;
  attempt: number;
  progress?: number | null;
  error?: { message: string; code?: string | null } | null;
  artifacts?: ArtifactSummary[];
  measurements?: Measurement[];
  queued_at: string;
  started_at?: string | null;
  completed_at?: string | null;
};
