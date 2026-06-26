/**
 * Dev proxy server — replaces Next.js API routes.
 * Handles HTTP-only cookie auth and injects server-side secrets.
 * Runs on port 3001; Vite dev server forwards /api/* here.
 */

// ─── Load .env from project root ─────────────────────────────────────────────
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
try {
  const lines = readFileSync(resolve(__dir, "../.env"), "utf8").split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx === -1) continue;
    const key = t.slice(0, idx).trim();
    const val = t.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !(key in process.env)) process.env[key] = val;
  }
} catch {
  // .env not present — rely on env vars already set in shell
}

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
const PORT = 3001;
const ACCESS_COOKIE = "dha_access_token";

const BACKEND_URL = (process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
const APP_SECRET   = process.env.BACKEND_API_TOKEN_SECRET ?? "";
const CRAWLER_KEY  = process.env.CRAWLER_API_KEY ?? APP_SECRET;

app.use(cookieParser());
app.use(express.text({ type: "*/*" }));
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function beURL(path) {
  return `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function callBackend(path, init = {}, authMode, req) {
  const headers = new Headers();
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");

  if (authMode === "user") {
    const token = req.cookies[ACCESS_COOKIE];
    if (token) headers.set("Authorization", `Bearer ${token}`);
  } else if (authMode === "app") {
    if (!APP_SECRET) throw new Error("BACKEND_API_TOKEN_SECRET is not configured");
    headers.set("Authorization", `Bearer ${APP_SECRET}`);
  }

  const response = await fetch(beURL(path), { ...init, headers });
  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = { status: "error", message: "Backend returned an unreadable response.", data: null };
  }
  return { response, payload };
}

function send(res, payload, status = 200) {
  res.status(status).json(payload);
}

function cookieOpts() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  };
}

// ─── Auth  /api/auth/* ────────────────────────────────────────────────────────

const authEndpoints = {
  "login":              { path: "/login",                   auth: "app"  },
  "signup":             { path: "/signup",                  auth: "app"  },
  "forgot-password":    { path: "/auth/forgot-password",    auth: "app"  },
  "reset-password":     { path: "/auth/reset-password",     auth: "app"  },
  "invitations/verify": { path: "/auth/invitations/verify", auth: "app"  },
  "set-password":       { path: "/auth/set-password",       auth: "app"  },
  "session":            { path: "/users/me",                auth: "user" },
  "logout":             { path: "/logout",                  auth: "user" },
};

app.all("/api/auth/*path", async (req, res) => {
  try {
    const action = req.path.replace("/api/auth/", "");
    const cfg = authEndpoints[action];
    if (!cfg) return send(res, { status: "error", message: "Unknown auth action.", data: null }, 404);

    const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    const body = ["GET", "HEAD"].includes(req.method) ? undefined : (req.body || undefined);
    const { response, payload } = await callBackend(
      `${cfg.path}${qs}`,
      { method: req.method, body },
      cfg.auth,
      req,
    );

    const isTokenFlow = ["login", "signup", "set-password"].includes(action);
    if (response.ok && payload?.data?.access_token && isTokenFlow) {
      res.cookie(ACCESS_COOKIE, payload.data.access_token, cookieOpts());
      const safe = { ...payload.data };
      delete safe.access_token;
      return send(res, { ...payload, data: safe }, response.status);
    }

    if (action === "logout" || response.status === 401) {
      res.clearCookie(ACCESS_COOKIE, { path: "/" });
    }

    return send(res, payload, response.status);
  } catch (err) {
    send(res, { status: "error", message: err?.message ?? "Server error", data: null }, 503);
  }
});

// ─── Crawler  /api/crawler/:tool ──────────────────────────────────────────────

app.post("/api/crawler/:tool", async (req, res) => {
  try {
    if (!CRAWLER_KEY) throw new Error("CRAWLER_API_KEY is not configured");
    const { tool } = req.params;
    const endpoint = tool === "crawl" ? "/crawl" : `/crawl/${tool}`;
    const headers = new Headers({
      "Content-Type": "application/json",
      "X-API-Key": CRAWLER_KEY,
    });
    const response = await fetch(beURL(endpoint), {
      method: "POST",
      body: req.body,
      headers,
    });
    const payload = await response.json().catch(() => ({
      status: "error",
      message: "Unreadable response",
      data: null,
    }));
    send(res, payload, response.status);
  } catch (err) {
    send(res, { status: "error", message: err?.message ?? "Server error", data: null }, 503);
  }
});

// ─── Password change  /api/users/change-password ──────────────────────────────

app.post("/api/users/change-password", async (req, res) => {
  try {
    const { response, payload } = await callBackend(
      "/users/me/change-password",
      { method: "POST", body: req.body },
      "user",
      req,
    );
    if (response.ok) res.clearCookie(ACCESS_COOKIE, { path: "/" });
    send(res, payload, response.status);
  } catch (err) {
    send(res, { status: "error", message: err?.message ?? "Server error", data: null }, 503);
  }
});

// ─── Generic gateway  /api/gateway/* ──────────────────────────────────────────

app.all("/api/gateway/*path", async (req, res) => {
  try {
    const path = req.path.replace("/api/gateway/", "");
    const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    const body = ["GET", "HEAD"].includes(req.method) ? undefined : (req.body || undefined);
    const { response, payload } = await callBackend(
      `/${path}${qs}`,
      { method: req.method, body },
      "user",
      req,
    );
    send(res, payload, response.status);
  } catch (err) {
    send(res, { status: "error", message: err?.message ?? "Server error", data: null }, 503);
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[proxy] running  → http://localhost:${PORT}`);
  console.log(`[proxy] backend  → ${BACKEND_URL}`);
  console.log(`[proxy] secret   → ${APP_SECRET ? "✓ configured" : "✗ MISSING"}`);
  console.log(`[proxy] crawler  → ${CRAWLER_KEY ? "✓ configured" : "✗ MISSING"}`);
});
