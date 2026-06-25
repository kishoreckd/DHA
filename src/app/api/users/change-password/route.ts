import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { ACCESS_COOKIE, callBackend, configurationError, proxyResponse } from "@/lib/api/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const { response, payload } = await callBackend(
      "/users/me/change-password",
      { method: "POST", body },
      "user",
    );
    if (response.ok) (await cookies()).delete(ACCESS_COOKIE);
    return proxyResponse(payload, response.status);
  } catch (error) {
    return configurationError(error);
  }
}
