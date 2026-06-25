export type ToolKey =
  | "crawl"
  | "gtmetrix"
  | "catchpoint"
  | "pagespeed"
  | "webpage"
  | "httpsecurityheaders"
  | "ssllabs"
  | "beacon"
  | "dnschecker"
  | "websitepulse"
  | "pingdom"
  | "silktide";

export type ToolRunState = "idle" | "queued" | "running" | "completed" | "failed";

export type ToolRun = {
  tool: ToolKey;
  label: string;
  state: ToolRunState;
  startedAt?: string;
  completedAt?: string;
  message?: string;
  artifacts?: Array<{ label: string; url: string }>;
};
