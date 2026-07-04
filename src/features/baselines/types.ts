export type BaselineStatus = "draft" | "ready" | "archived" | string;

export type BaselineToolReport = {
  tool?: string;
  status?: string;
  report_url?: string;
  artifact_id?: string;
  [key: string]: unknown;
};

export type Baseline = {
  id: string;
  name: string;
  client_name?: string | null;
  target_url?: string | null;
  status: BaselineStatus;
  tool_reports?: BaselineToolReport[];
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type BaselineCreateInput = {
  name: string;
  client_name?: string;
  target_url: string;
  status?: BaselineStatus;
  tool_reports?: BaselineToolReport[];
};
