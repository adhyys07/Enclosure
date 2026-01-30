import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import { projects } from "./schema";

const IDENTITY_HOST = process.env.HC_IDENTITY_HOST || "https://auth.hackclub.com";
const IDENTITY_CLIENT_ID = process.env.HC_IDENTITY_CLIENT_ID || "";
const IDENTITY_CLIENT_SECRET = process.env.HC_IDENTITY_CLIENT_SECRET || "";
const IDENTITY_REDIRECT_URI = process.env.HC_IDENTITY_REDIRECT_URI || "http://localhost:5173/api/auth/callback/hc-identity";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/projects", async (_req, res) => {
  const rows = await db.select().from(projects).orderBy(desc(projects.createdAt));
  res.json(rows);
});

app.post("/api/projects", async (req, res) => {
  const { name, description, status } = req.body || {};
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "name is required" });
  }

  const [created] = await db
    .insert(projects)
    .values({
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : "",
      status: typeof status === "string" ? status.trim() : "draft"
    })
    .returning();

  res.status(201).json(created);
});

app.patch("/api/projects/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "invalid id" });
  }
  if (!status || typeof status !== "string") {
    return res.status(400).json({ error: "status is required" });
  }

  const [updated] = await db
    .update(projects)
    .set({ status: status.trim(), updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning();

  if (!updated) {
    return res.status(404).json({ error: "project not found" });
  }

  res.json(updated);
});

// --- Hack Club Identity OAuth ---
app.get("/api/auth/login", (_req, res) => {
  if (!IDENTITY_CLIENT_ID) return res.status(500).send("Missing HC_IDENTITY_CLIENT_ID");
  const url = new URL("/oauth/authorize", IDENTITY_HOST);
  url.searchParams.set("client_id", IDENTITY_CLIENT_ID);
  url.searchParams.set("redirect_uri", IDENTITY_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile email name slack_id verification_status");
  res.redirect(url.toString());
});

app.get("/api/auth/callback", async (req, res) => {
  const code = req.query.code as string | undefined;
  if (!code) return res.status(400).send("Missing code");
  if (!IDENTITY_CLIENT_ID || !IDENTITY_CLIENT_SECRET) {
    return res.status(500).send("Missing client id/secret");
  }
  try {
    const tokenUrl = new URL("/oauth/token", IDENTITY_HOST);
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: IDENTITY_REDIRECT_URI,
      client_id: IDENTITY_CLIENT_ID,
      client_secret: IDENTITY_CLIENT_SECRET
    });
    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson.access_token) {
      return res.status(502).json({ error: "token exchange failed", detail: tokenJson });
    }

    const meUrl = new URL("/api/v1/me", IDENTITY_HOST);
    const meRes = await fetch(meUrl, {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` }
    });
    const meJson = meRes.ok ? await meRes.json() : null;

    // Return tokens + profile to frontend for now (for testing). In production, set an httpOnly session cookie.
    res.json({
      token: tokenJson.access_token,
      refreshToken: tokenJson.refresh_token,
      expiresIn: tokenJson.expires_in,
      profile: meJson
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "auth callback failed", detail: message });
  }
});

app.get("/api/auth/me", async (req, res) => {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  if (!token) return res.status(401).json({ error: "missing bearer token" });
  try {
    const meUrl = new URL("/api/v1/me", IDENTITY_HOST);
    const meRes = await fetch(meUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!meRes.ok) {
      const detail = await meRes.text();
      return res.status(401).json({ error: "invalid token", detail });
    }
    const meJson = await meRes.json();
    res.json(meJson);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "profile lookup failed", detail: message });
  }
});

app.use(express.static(path.join(__dirname, "..")));

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`Dashboard + API running at http://localhost:${PORT}`);
});
