export type BaselineStatus = "ready" | "review" | "action_needed";

export interface BaselineRow {
  id: string;
  metric: string;
  evidence: string;
  impact: string;
  gap: string;
  status: BaselineStatus;
}

export interface BaselineModule {
  id: string;
  name: string;
  group: string;
  score: number;
  status: BaselineStatus;
  rows: BaselineRow[];
}

const names = [
  ["CWV", "Technical foundation"], ["Accessibility", "Technical foundation"], ["Best Practices", "Technical foundation"],
  ["SEO", "Findability"], ["GEO", "Findability"], ["Content", "Findability"], ["Security", "Technical foundation"],
  ["Infrastructure", "Technical foundation"], ["Data Layer & Cookies", "Data & measurement"], ["Technology Profile", "Technical foundation"],
  ["Peak Usage Reliability", "Operations"], ["Release Stability", "Operations"], ["Sustainability", "Operations"],
  ["Service Worker PWA", "Experience"], ["User Journey Analysis", "Experience"], ["Frictionless Conversion Payment", "Conversion"],
  ["Digital Engagement Maturity", "Experience"], ["Search Indexing Maturity", "Findability"], ["AI On-site Search", "AI maturity"],
  ["AI Features Benchmark", "AI maturity"], ["AI Personalization", "AI maturity"], ["Conversational AI", "AI maturity"],
  ["Agentic Automation", "AI maturity"], ["AI Agent Readiness", "AI maturity"], ["MCP Transaction Surface", "AI maturity"],
  ["Brand Guideline Adherence", "Brand & trust"], ["Brand Consistency", "Brand & trust"], ["Online Reputation", "Brand & trust"],
  ["Competitor Content Marketing", "Competitive"], ["Structured Data Schema", "Findability"], ["Structured Data Rich Results", "Findability"],
  ["E-E-A-T Signals", "Brand & trust"], ["Social Media Integration", "Engagement"], ["Email Lead Capture Maturity", "Conversion"],
  ["Intl Localization", "Experience"], ["Domain Authority Backlinks", "Findability"], ["Competitor Benchmark", "Competitive"],
  ["Property Subdomain Inv", "Technical foundation"], ["Design System Maturity", "Experience"], ["Landing Page Structural", "Conversion"],
] as const;

const specificRows: Record<string, string[][]> = {
  CWV: [
    ["Performance score", "Mobile 59 / Desktop 75", "Mobile experience materially trails desktop.", "Improve mobile score and establish a performance budget."],
    ["LCP", "Mobile 4.6s / Desktop 1.0s", "Slow primary content delays confidence and conversion.", "Mobile LCP materially fails the <=2.5s target."],
    ["CLS", "Mobile 0.016 / Desktop 0.008", "Stable visual experience across devices.", "Continue monitoring; both currently pass."],
    ["INP", "Mobile 314ms / Desktop 102ms", "Mobile interactions can feel delayed.", "Reduce long tasks and third-party blocking."],
  ],
  Accessibility: [
    ["Lighthouse accessibility score", "Mobile 94 / Desktop 93", "Strong automated score supports usability.", "Manual WCAG validation is still required."],
    ["WAVE errors", "Desktop 16", "Critical errors can block assistive technology users.", "Resolve errors at shared component level."],
    ["WAVE alerts", "Desktop 78", "Large alert volume signals structural inconsistency.", "Review headings, labels, and landmark usage."],
  ],
  SEO: [
    ["Lighthouse SEO score", "Homepage 92 / PDP 92", "Strong basic technical discoverability.", "Technical SEO debt still exists."],
    ["Semrush Site Audit", "6 errors / 11 warnings / 11 notices", "Issues reduce crawl and index efficiency.", "Prioritize errors and repeat crawl."],
    ["Sitemap and robots", "4 incorrect sitemap pages", "Incorrect entries dilute crawl focus.", "Remove stale URLs and validate robots rules."],
  ],
  Security: [
    ["Qualys SSL Labs grade", "A+", "Strong transport security improves trust.", "Continue certificate and cipher governance."],
    ["TLS protocol posture", "TLS 1.3/1.2 enabled", "Legacy protocols are disabled.", "Maintain protocol controls."],
    ["Security headers", "Core headers present", "Good browser-side protection baseline.", "Complete Permissions-Policy coverage."],
  ],
};

const genericRows = (name: string): BaselineRow[] => [
  { id: crypto.randomUUID(), metric: "Assessment framing", evidence: `${name} evidence collected across the digital estate.`, impact: "Establishes the current-state maturity baseline.", gap: "Confirm internal ownership and success criteria.", status: "ready" },
  { id: crypto.randomUUID(), metric: "Observed capability", evidence: `Outside-in evidence is available for ${name.toLowerCase()}.`, impact: "Shows customer and business performance impact.", gap: "Validate with internal analytics and operational data.", status: "review" },
  { id: crypto.randomUUID(), metric: "Coverage and governance", evidence: "Representative journeys and templates reviewed.", impact: "Creates a repeatable benchmark for future assessments.", gap: "Add owners, targets, monitoring cadence, and remediation plan.", status: "action_needed" },
];

export const createBaselineModules = (): BaselineModule[] => names.map(([name, group], index) => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  name,
  group,
  score: Math.max(42, Math.min(96, 68 + ((index * 7) % 27) - 6)),
  status: index % 9 === 0 ? "action_needed" : index % 4 === 0 ? "review" : "ready",
  rows: specificRows[name]?.map((row, rowIndex) => ({
    id: `${index}-${rowIndex}`,
    metric: row[0],
    evidence: row[1],
    impact: row[2],
    gap: row[3],
    status: rowIndex === 0 ? "ready" : "review",
  })) ?? genericRows(name),
}));

