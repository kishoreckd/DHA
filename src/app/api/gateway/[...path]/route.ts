import { NextRequest } from "next/server";
import { callBackend, configurationError, proxyResponse } from "@/lib/api/server";

async function handle(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const path = (await context.params).path.join("/");
    const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.text();
    const { response, payload } = await callBackend(
      `/${path}${request.nextUrl.search}`,
      { method: request.method, body: body || undefined },
      "user",
    );
    return proxyResponse(payload, response.status);
  } catch (error) {
    return configurationError(error);
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
