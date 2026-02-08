import "dotenv/config";
import express from "express";
import cors from "cors";
import compression from "compression";
import path from "path";
import { desc } from "drizzle-orm";
import { db } from "./db";
import { shopItems, user } from "./schema";
import { betterAuth, OAuth2UserInfo } from "better-auth";
import { createFieldAttribute } from "better-auth/db";
// Removed broken better-auth imports
// ...existing code...
const ADMIN_KEY = process.env.ADMIN_KEY || "";
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "http://localhost:5173";
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || `http://localhost:${PORT}`;
const HC_IDENTITY_CLIENT_ID = process.env.HC_IDENTITY_CLIENT_ID || "";
const HC_IDENTITY_CLIENT_SECRET = process.env.HC_IDENTITY_CLIENT_SECRET || "";
const HC_IDENTITY_HOST = process.env.HC_IDENTITY_HOST || "https://auth.hackclub.com";
const HC_IDENTITY_REDIRECT_URI = process.env.HC_IDENTITY_REDIRECT_URI || `${BACKEND_BASE_URL.replace(/\/$/, "")}/api/auth/callback`;
const IDENTITY_BASE = process.env.HC_IDENTITY_HOST || "https://auth.hackclub.com";
  database: drizzleAdapter(db, {
// ...existing code...
function buildRedirectUri() {
  return `${BACKEND_BASE_URL.replace(/\/$/, "")}/api/auth/callback`;
}

async function fetchIdentityToken(code: string) {
  const resp = await fetch(`${IDENTITY_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      client_id: HC_IDENTITY_CLIENT_ID,
      client_secret: HC_IDENTITY_CLIENT_SECRET,
      redirect_uri: buildRedirectUri(),
    }),
  });

  if (!resp.ok) {
    throw new Error(`token exchange failed (${resp.status})`);
  }
  return resp.json() as Promise<{ access_token: string; refresh_token?: string }>;
}

async function fetchIdentityProfile(accessToken: string) {
  const resp = await fetch(`${IDENTITY_BASE}/v1/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) {
    throw new Error(`profile fetch failed (${resp.status})`);
  }
  return resp.json() as Promise<{
    id: string;
    email: string;
    name?: string;
    image?: string;
    slack_id?: string;
    verification_status?: string;
    email_verified?: boolean;
  }>;
}

const app = express();
app.use(cors({ origin: FRONTEND_BASE_URL, credentials: true }));
app.use(compression());
app.use(express.json());

// Use Better Auth's built-in login endpoint
app.use("/api/auth", auth.router);

// Callback handled by Better Auth

// Profile handled by Better Auth

app.get("/api/shop-items", async (_req, res) => {
  try {
    const rows = await db.select().from(shopItems).orderBy(desc(shopItems.createdAt));
    res.json(rows);
  } catch (err) {
    console.error("DB error in /api/shop-items:", err);
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "failed to list shop items", detail: message });
  }
});

app.post("/api/shop-items", async (req, res) => {
  try {
    if (!ADMIN_KEY || req.header("x-admin-key") !== ADMIN_KEY) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const { title, note, img, href } = req.body || {};
    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "title is required" });
    }
    const [created] = await db.insert(shopItems).values({
      title: title.trim(),
      note: typeof note === "string" ? note.trim() : null,
      img: typeof img === "string" ? img.trim() : null,
      href: typeof href === "string" ? href.trim() : null
    }).returning();
    res.status(201).json(created);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "failed to create shop item", detail: message });
  }
});

app.use(express.static(clientDir));
app.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
app.use("/css", express.static(path.resolve(process.cwd(), "css")));
app.use("/refs", express.static(path.resolve(process.cwd(), "refs")));

app.use((_req, res) => {
  res.sendFile(path.join(clientDir, "index.html"));
});

const server = app.listen(PORT, () => {
  console.log(`Shop API running at http://localhost:${PORT}`);
});

// Keep the event loop alive for debugging
setInterval(() => {
  // This interval keeps the process alive
}, 10000);

server.ref();
server.on("close", () => {
  console.log("Shop API server closed");
});

process.on("exit", (code) => {
  console.log("Process exit event. Exit code:", code);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection", reason);
});
