import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

export const ACCESS_COOKIE = "dha_access_token";

function backendUrl(path: string) {
  const base = process.env.BACKEND_API_URL?.replace(/\/$/, "");
  if (!base) throw new Error("BACKEND_API_URL is not configured");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function callBackend<T>(
  path: string,
  init: RequestInit = {},
  auth: "user" | "app" | "none" = "user",
) {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  if (auth === "user") {
    const token = (await cookies()).get(ACCESS_COOKIE)?.value;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  if (auth === "app") {
    const secret = process.env.BACKEND_API_TOKEN_SECRET;
    if (!secret) throw new Error("BACKEND_API_TOKEN_SECRET is not configured");
    headers.set("Authorization", `Bearer ${secret}`);
  }

  const response = await fetch(backendUrl(path), { ...init, headers, cache: "no-store" });
  let payload: ApiResponse<T>;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    payload = { status: "error", message: "The backend returned an unreadable response.", data: null };
  }
  return { response, payload };
}

export function proxyResponse<T>(payload: ApiResponse<T>, status = 200) {
  return NextResponse.json(payload, { status });
}

export function configurationError(error: unknown) {
  const message = error instanceof Error ? error.message : "Server configuration error";
  return NextResponse.json<ApiResponse<null>>(
    { status: "error", message, data: null },
    { status: 503 },
  );
}
