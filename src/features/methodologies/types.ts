export type MethodologyStatus = "draft" | "in_review" | "approved" | "published" | "superseded";

export type Methodology = {
  id: string;
  name: string;
  description?: string | null;
  version_number: number;
  status: MethodologyStatus;
  metric_count?: number;
  total_weight?: number;
  based_on_version_id?: string | null;
  locked_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type MetricDefinition = {
  id: string;
  methodology_id: string;
  key: string;
  name: string;
  dimension: string;
  sub_dimension?: string | null;
  weight: number;
  threshold?: string | null;
  formula?: string | null;
  mapped_tool_keys: string[];
  status: "draft" | "active" | "disabled";
  updated_at: string;
};

export type MethodologyValidation = {
  is_valid: boolean;
  total_weight: number;
  errors: string[];
  warnings: string[];
};

export type AdminToolDefinition = {
  key: string;
  name: string;
  metric_area: string;
  is_enabled: boolean;
  mapped_metric_count: number;
};
