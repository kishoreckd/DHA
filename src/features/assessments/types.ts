export type AssessmentStatus =
  | "draft"
  | "evidence_review"
  | "baseline_draft"
  | "baseline_review"
  | "scored"
  | "snapshot_ready"
  | "report_draft"
  | "approved"
  | "published"
  | string;

export type Assessment = {
  id: string;
  name: string;
  status: AssessmentStatus;
  scope_id?: string | null;
  methodology_version_id?: string | null;
  methodology_name?: string | null;
  property_name?: string | null;
  target_url?: string | null;
  tool_batch_ids?: string[];
  notes?: string | null;
  score?: number | null;
  evidence_complete?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AssessmentCreateInput = {
  name: string;
  scope_id: string;
  methodology_version_id: string;
  tool_batch_ids?: string[];
  notes?: string;
};

export type EvidenceStatus = "pending" | "accepted" | "rejected" | "replaced" | string;

export type AssessmentEvidence = {
  id: string;
  metric_key?: string | null;
  title?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  tool_key?: string | null;
  value?: number | string | null;
  raw_value?: string | null;
  status: EvidenceStatus;
  notes?: string | null;
  created_at?: string | null;
};

export type EvidenceCompletenessItem = {
  metric_key: string;
  label?: string | null;
  dimension?: string | null;
  required_count?: number | null;
  accepted_count?: number | null;
  missing_required?: string[];
  is_complete?: boolean;
};

export type EvidenceCompleteness = {
  is_complete: boolean;
  complete_count?: number;
  total_count?: number;
  items?: EvidenceCompletenessItem[];
};

export type BaselineSection = {
  id: string;
  title: string;
  status?: string | null;
  revision?: number | null;
  summary?: string | null;
  content?: string | null;
  findings?: Array<{ id?: string; title?: string; severity?: string; description?: string }>;
  recommendations?: Array<{ id?: string; title?: string; priority?: string; description?: string }>;
};

export type AssessmentBaseline = {
  id: string;
  version_number?: number | null;
  status?: string | null;
  sections?: BaselineSection[];
  created_at?: string | null;
  updated_at?: string | null;
};

export type MetricScore = {
  id?: string;
  metric_key: string;
  label?: string | null;
  dimension?: string | null;
  calculated_score?: number | null;
  adjusted_score?: number | null;
  final_score?: number | null;
  weight?: number | null;
  rationale?: string | null;
  status?: string | null;
};

export type AssessmentSnapshot = {
  id: string;
  assessment_id?: string;
  overall_score?: number | null;
  status?: string | null;
  generated_at?: string | null;
  scores?: MetricScore[];
};

export type AssessmentTrendPoint = {
  assessment_id?: string;
  metric_key?: string;
  label?: string;
  value: number;
  captured_at?: string;
};

export type ReportSummary = {
  id: string;
  title?: string | null;
  status?: string | null;
  assessment_id?: string | null;
  current_version_id?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
};
