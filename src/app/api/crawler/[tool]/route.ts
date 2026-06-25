import { NextRequest } from "next/server";
import { callBackend, configurationError, proxyResponse } from "@/lib/api/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ tool: string }> },
) {
  try {
    const { tool } = await context.params;
    const apiKey = process.env.CRAWLER_API_KEY ?? process.env.BACKEND_API_TOKEN_SECRET;
    if (!apiKey) throw new Error("CRAWLER_API_KEY is not configured");
    const body = await request.text();
    const endpoint = tool === "crawl" ? "/crawl" : `/crawl/${tool}`;
    const { response, payload } = await callBackend(
      endpoint,
      { method: "POST", body, headers: { "X-API-Key": apiKey } },
      "none",
    );
    return proxyResponse(payload, response.status);
  } catch (error) {
    return configurationError(error);
  }
}
