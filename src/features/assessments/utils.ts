export function formatAssessmentDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "Not available";
}
