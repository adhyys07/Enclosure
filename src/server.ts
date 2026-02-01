import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import { projects, user as users } from "./schema";

process.on("uncaughtException", (err) => {
  console.error("[fatal] uncaught exception", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("[fatal] unhandled rejection", reason);
});

const IDENTITY_HOST = process.env.HC_IDENTITY_HOST || "https://auth.hackclub.com";
const IDENTITY_CLIENT_ID = process.env.HC_IDENTITY_CLIENT_ID || "";
const IDENTITY_CLIENT_SECRET = process.env.HC_IDENTITY_CLIENT_SECRET || "";
const IDENTITY_REDIRECT_URI = process.env.HC_IDENTITY_REDIRECT_URI || "http://localhost:4000/api/auth/callback";
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "http://localhost:5713";
const DEV_FORCE_ELIGIBLE = process.env.DEV_FORCE_ELIGIBLE?.toLowerCase();
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const CACHET_BASE = process.env.CACHET_BASE || "https://cachet.dunkirk.sh";
async function fetchSlackAvatar(opts: { slackId?: string | null; email?: string | null }): Promise<string | undefined> {
  // Try cachet first (no token needed) when we have a Slack user id
  if (opts.slackId) {
    try {
      const res = await fetch(`${CACHET_BASE}/users/${opts.slackId}`);
      if (res.ok) {
        const data = (await res.json()) as { imageUrl?: string };
        if (data.imageUrl) return data.imageUrl;
      }
    } catch {
      // best-effort
    }
  }

  if (!SLACK_BOT_TOKEN) return undefined;
  const headers = { Authorization: `Bearer ${SLACK_BOT_TOKEN}`, "Content-Type": "application/x-www-form-urlencoded" } as const;

  // Prefer lookup by ID when available
  if (opts.slackId) {
    const res = await fetch("https://slack.com/api/users.info", {
      method: "POST",
      headers,
      body: new URLSearchParams({ user: opts.slackId })
    });
    const data = (await res.json()) as { ok?: boolean; user?: { profile?: { image_512?: string; image_192?: string; image_72?: string } } };
    if (data.ok && data.user?.profile) {
      return data.user.profile.image_512 || data.user.profile.image_192 || data.user.profile.image_72;
    }
  }

  if (opts.email) {
    const res = await fetch("https://slack.com/api/users.lookupByEmail", {
      method: "POST",
      headers,
      body: new URLSearchParams({ email: opts.email })
    });
    const data = (await res.json()) as { ok?: boolean; user?: { profile?: { image_512?: string; image_192?: string; image_72?: string } } };
    if (data.ok && data.user?.profile) {
      return data.user.profile.image_512 || data.user.profile.image_192 || data.user.profile.image_72;
    }
  }

  return undefined;
}

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

    if (!meRes.ok) {
      const detail = await meRes.text();
      return res.status(502).json({ error: "profile fetch failed", detail });
    }

    const meJson = (await meRes.json()) as { identity?: Record<string, unknown> };
    const identity = meJson.identity || {};
    const identityId = typeof (identity as { id?: unknown }).id === "string" ? (identity as { id?: unknown }).id : undefined;
    const identityEmail = typeof (identity as { email?: unknown }).email === "string"
      ? (identity as { email?: unknown }).email
      : typeof (identity as { primary_email?: unknown }).primary_email === "string"
        ? (identity as { primary_email?: unknown }).primary_email
        : typeof (identity as { primaryEmail?: unknown }).primaryEmail === "string"
          ? (identity as { primaryEmail?: unknown }).primaryEmail
          : undefined;

    const identityName = typeof (identity as { name?: unknown }).name === "string"
      ? (identity as { name?: unknown }).name
      : (() => {
          const first = typeof (identity as { first_name?: unknown }).first_name === "string"
            ? (identity as { first_name?: unknown }).first_name
            : typeof (identity as { firstName?: unknown }).firstName === "string"
              ? (identity as { firstName?: unknown }).firstName
              : "";
          const last = typeof (identity as { last_name?: unknown }).last_name === "string"
            ? (identity as { last_name?: unknown }).last_name
            : typeof (identity as { lastName?: unknown }).lastName === "string"
              ? (identity as { lastName?: unknown }).lastName
              : "";
          const full = `${first} ${last}`.trim();
          return full || undefined;
        })();
    const slackId = typeof (identity as { slack_id?: unknown }).slack_id === "string" ? (identity as { slack_id?: unknown }).slack_id : undefined;
    const verificationStatus = typeof (identity as { verification_status?: unknown }).verification_status === "string"
      ? (identity as { verification_status?: unknown }).verification_status
      : undefined;
    const emailVerified = Boolean((identity as { email_verified?: unknown }).email_verified || (identity as { emailVerified?: unknown }).emailVerified);
    let profilePicture = typeof (identity as { image?: unknown }).image === "string"
      ? (identity as { image?: unknown }).image
      : typeof (identity as { picture?: unknown }).picture === "string"
        ? (identity as { picture?: unknown }).picture
        : typeof (identity as { profile?: { image_512?: unknown; image?: unknown } }).profile?.image_512 === "string"
          ? (identity as { profile?: { image_512?: unknown; image?: unknown } }).profile?.image_512
          : typeof (identity as { profile?: { image?: unknown } }).profile?.image === "string"
            ? (identity as { profile?: { image?: unknown } }).profile?.image
            : undefined;

    const rawEligible =
      (identity as { ysws_eligible?: unknown }).ysws_eligible ??
      (identity as { yswsEligible?: unknown }).yswsEligible ??
      (identity as { eligible?: unknown }).eligible;

    const isEligible =
      typeof rawEligible === "string" ? rawEligible.toLowerCase() === "yes" : Boolean(rawEligible);

    let effectiveEligible = isEligible;
    if (DEV_FORCE_ELIGIBLE === "yes" || DEV_FORCE_ELIGIBLE === "true") effectiveEligible = true;
    if (DEV_FORCE_ELIGIBLE === "no" || DEV_FORCE_ELIGIBLE === "false") effectiveEligible = false;

    console.log("[auth] identity", {
      id: identityId,
      email: identityEmail,
      slackId,
      verificationStatus,
      hasAccessToken: Boolean(tokenJson.access_token)
    });

    if (identityId && identityEmail) {
      const idValue = identityId as string;
      const emailValue = identityEmail as string;
      const existing = await db.select().from(users).where(eq(users.id, idValue)).limit(1);
      const pickString = (val: unknown) => (typeof val === "string" ? val : null);
      if (!profilePicture) {
        const fetched: string | undefined = await fetchSlackAvatar({
          slackId: typeof slackId === "string" ? slackId : null,
          email: emailValue
        });
        profilePicture = fetched ?? profilePicture;
      }
      const basePayload: {
        name: string | null;
        email: string;
        emailVerified: boolean;
        image: string | null;
        slackId: string | null;
        verificationStatus: string | null;
        identityToken: string | null;
        refreshToken: string | null;
        updatedAt: Date;
      } = {
        name: pickString(identityName ?? existing[0]?.name),
        email: emailValue,
        emailVerified,
        image: pickString(profilePicture ?? existing[0]?.image),
        slackId: pickString(slackId ?? existing[0]?.slackId),
        verificationStatus: pickString(verificationStatus ?? existing[0]?.verificationStatus),
        identityToken: typeof tokenJson.access_token === "string" ? tokenJson.access_token : existing[0]?.identityToken || null,
        refreshToken: typeof tokenJson.refresh_token === "string" ? tokenJson.refresh_token : existing[0]?.refreshToken || null,
        updatedAt: new Date()
      };

      if (existing.length) {
        await db.update(users).set(basePayload).where(eq(users.id, idValue));
        console.log("[auth] user updated", { id: idValue });
      } else {
        await db.insert(users).values({ ...basePayload, id: idValue, createdAt: new Date() });
        console.log("[auth] user inserted", { id: idValue });
      }
    }

    const redirectUrl = new URL("/dashboard", FRONTEND_BASE_URL);
    redirectUrl.searchParams.set("eligible", effectiveEligible ? "yes" : "no");
    if (!effectiveEligible) redirectUrl.searchParams.set("msg", "banned");

    return res.redirect(302, redirectUrl.toString());
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

// Convenience: return the most recently seen user (for UI avatar without exposing tokens)
app.get("/api/auth/profile", async (_req, res) => {
  try {
    const latest = await db.select().from(users).orderBy(desc(users.updatedAt)).limit(1);
    if (!latest.length) return res.status(404).json({ error: "no user" });
    const user = latest[0];
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      slackId: user.slackId
    });
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
