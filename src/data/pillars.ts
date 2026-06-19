import type { PillarPage } from "@/data/types";

export const pillarGroups = [
  "Experience Quality & Platform Health",
  "Brand Findability & Conversion",
  "Digital Operational Maturity",
  "AI Maturity & Agentic Readiness",
  "Digital Brand & Trust",
] as const;

const groupForIndex = (index: number) => {
  if (index <= 13) return pillarGroups[0];
  if (index <= 18) return pillarGroups[1];
  if (index <= 23) return pillarGroups[2];
  if (index <= 25) return pillarGroups[3];
  return pillarGroups[4];
};

const titles = [
  "CWV",
  "Accessibility",
  "SEO",
  "GEO",
  "Content",
  "Best Practices",
  "Security",
  "Infrastructure",
  "Data Layer Cookies",
  "Technology Profile",
  "Peak Usage Reliability",
  "Release Stability",
  "Sustainability",
  "Service Worker PWA",
  "User Journey Analysis",
  "Conversion Payment",
  "Engagement Maturity",
  "Search Indexing",
  "AI On-site Search",
  "AI Features Benchmark",
  "AI Personalization",
  "Conversational AI",
  "Agentic Automation",
  "AI Agent Readiness",
  "MCP Transaction Surface",
  "Brand Guidelines",
  "Brand Consistency",
  "Online Reputation",
  "Competitor Content",
  "Structured Schema",
  "Rich Results",
  "E-E-A-T Signals",
  "Social Media",
  "Email Lead Capture",
  "Intl Localization",
  "Domain Backlinks",
  "Competitor Benchmark",
  "Property Subdomains",
  "Design System",
  "Landing Page Structure",
];

const summaries: Record<string, string> = {
  CWV: "Mobile LCP, CLS, render blocking, and script pressure are the largest experience risks across homepage, PDP, and PLP.",
  Accessibility:
    "Automated scores are decent, but template defects remain around alt text, list semantics, duplicate ARIA IDs, landmarks, and manual checks.",
  SEO: "Homepage trails clean competitor benchmarks; PDP and PLP need image, metadata, canonical, schema, and traffic-protection review.",
  GEO: "Domain-level AI visibility is present, but page-level cited-source proof and answer-ready use-case content are missing.",
  Content:
    "Several priority pages need deeper crawlable copy, useful FAQs, product guidance, and stronger keyword-to-page alignment.",
  "Best Practices": "Deprecated APIs, third-party cookies, console issues, and tag cleanup create shared template risk.",
  Security:
    "TLS posture is strong, while CSP, cross-origin policy depth, and script rules need hardening.",
  Infrastructure:
    "Availability and DNS are healthy at domain level, but page-specific infrastructure proof is incomplete.",
  "Data Layer Cookies":
    "Consent, analytics, remarketing, and tag ownership require a clearer inventory and event validation surface.",
  "Technology Profile":
    "Contentstack/Gatsby is a modern base, but the third-party stack adds performance, privacy, and ownership risk.",
  "Design System":
    "Repeated findings should become reusable component rules, acceptance criteria, and release gates.",
};

export const pillarPages: PillarPage[] = titles.map((title, index) => {
  const number = index + 1;
  const code = `P${String(number).padStart(2, "0")}`;
  const knownSummary =
    summaries[title] ??
    "Baseline evidence exists, but the next UI step is to review editable findings, evidence coverage, and sync readiness.";

  return {
    id: code.toLowerCase(),
    code,
    title,
    pillar: groupForIndex(number),
    pageFocus: number <= 4 ? "Domain" : number % 3 === 0 ? "PLP" : number % 2 === 0 ? "PDP" : "Homepage",
    score: Math.max(32, Math.min(88, 70 - (number % 9) * 4 + (number > 25 ? 6 : 0))),
    syncStatus: number <= 13 ? "Needs sync" : number % 4 === 0 ? "Missing evidence" : "Draft",
    summary: knownSummary,
    findings:
      number === 1
        ? [
            {
              metric: "Performance score",
              mobile: "28",
              desktop: "47",
              finding: "Both below target; mobile is critical.",
              severity: "Critical",
              evidence: "PageSpeed Insights Mobile/Desktop baseline PDFs",
            },
            {
              metric: "LCP",
              mobile: "14.7s",
              desktop: "3.2s",
              finding: "Severe mobile LCP failure; desktop also above target.",
              severity: "Critical",
              evidence: "Lighthouse and WebPageTest proof",
            },
            {
              metric: "CLS",
              mobile: "0.206",
              desktop: "0.014",
              finding: "Mobile fails CLS threshold; desktop passes.",
              severity: "High",
              evidence: "CrUX and lab layout-shift diagnostics",
            },
          ]
        : number === 2
          ? [
              {
                metric: "Image alt text",
                mobile: "flagged",
                desktop: "flagged",
                finding: "Product/template images require alternative text rules.",
                severity: "High",
                evidence: "WAVE, axe, AccessibilityChecker",
              },
              {
                metric: "List structure",
                mobile: "flagged",
                desktop: "flagged",
                finding: "List items are not contained in proper list parents.",
                severity: "High",
                evidence: "axe JSON and manual audit queue",
              },
            ]
          : [
              {
                metric: "Primary issue pattern",
                status: number <= 13 ? "Open" : "Review",
                finding: knownSummary,
                severity: number <= 13 ? "High" : "Medium",
                evidence: "SharePoint baseline report and metric workbook",
              },
            ],
  };
});
