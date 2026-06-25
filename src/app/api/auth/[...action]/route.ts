import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { ACCESS_COOKIE, callBackend, configurationError, proxyResponse } from "@/lib/api/server";
import type { User } from "@/types/auth";

type AuthPayload = { access_token?: string; user?: User } & Partial<User>;

const endpointMap: Record<string, { path: string; auth: "app" | "user" | "none" }> = {
  login: { path: "/login", auth: "app" },
  signup: { path: "/signup", auth: "app" },
  "forgot-password": { path: "/auth/forgot-password", auth: "app" },
  "reset-password": { path: "/auth/reset-password", auth: "app" },
  "invitations/verify": { path: "/auth/invitations/verify", auth: "app" },
  "set-password": { path: "/auth/set-password", auth: "app" },
  session: { path: "/users/me", auth: "user" },
  logout: { path: "/logout", auth: "user" },
};

async function handle(
  request: NextRequest,
  context: { params: Promise<{ action: string[] }> },
) {
  try {
    const action = (await context.params).action.join("/");
    const config = endpointMap[action];
    if (!config) return proxyResponse({ status: "error", message: "Unknown authentication action.", data: null }, 404);

    const suffix = request.nextUrl.search;
    const body = request.method === "GET" ? undefined : await request.text();
    const { response, payload } = await callBackend<AuthPayload>(
      `${config.path}${suffix}`,
      { method: request.method, body: body || undefined },
      config.auth,
    );

    const isTokenFlow = ["login", "signup", "set-password"].includes(action);
    if (response.ok && payload.data?.access_token && isTokenFlow) {
      (await cookies()).set(ACCESS_COOKIE, payload.data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      });
      const profile = (payload.data.user ?? payload.data) as AuthPayload;
      const safeProfile = { ...profile };
      delete safeProfile.access_token;
      return proxyResponse({ ...payload, data: safeProfile }, response.status);
    }

    if (action === "logout" || response.status === 401) {
      (await cookies()).delete(ACCESS_COOKIE);
    }
    return proxyResponse(payload, response.status);
  } catch (error) {
    return configurationError(error);
  }
}

export const GET = handle;
export const POST = handle;
