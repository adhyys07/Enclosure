"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const path_1 = __importDefault(require("path"));
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("./db");
const schema_1 = require("./schema");
const PORT = Number(process.env.PORT) || 4000;
const ADMIN_KEY = process.env.ADMIN_KEY || "";
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "http://localhost:5173";
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || `http://localhost:${PORT}`;
const HC_IDENTITY_CLIENT_ID = process.env.HC_IDENTITY_CLIENT_ID || "";
const HC_IDENTITY_CLIENT_SECRET = process.env.HC_IDENTITY_CLIENT_SECRET || "";
const IDENTITY_BASE = process.env.HC_IDENTITY_BASE || "https://identity.hackclub.com";
const clientDir = path_1.default.resolve(process.cwd(), "dist");
function buildRedirectUri() {
    return `${BACKEND_BASE_URL.replace(/\/$/, "")}/api/auth/callback`;
}
async function fetchIdentityToken(code) {
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
    return resp.json();
}
async function fetchIdentityProfile(accessToken) {
    const resp = await fetch(`${IDENTITY_BASE}/v1/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) {
        throw new Error(`profile fetch failed (${resp.status})`);
    }
    return resp.json();
}
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: FRONTEND_BASE_URL, credentials: true }));
app.use((0, compression_1.default)());
app.use(express_1.default.json());
app.get("/api/auth/login", (req, res) => {
    const continueTo = typeof req.query.continue === "string" && req.query.continue.length
        ? String(req.query.continue)
        : FRONTEND_BASE_URL;
    if (!HC_IDENTITY_CLIENT_ID || !HC_IDENTITY_CLIENT_SECRET) {
        return res.status(500).json({ error: "identity client env vars missing" });
    }
    const redirectUri = buildRedirectUri();
    const url = new URL(`${IDENTITY_BASE}/oauth/authorize`);
    url.searchParams.set("client_id", HC_IDENTITY_CLIENT_ID);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    // Request the minimal valid scope accepted by Hack Club Identity.
    url.searchParams.set("scope", "identity.basic");
    url.searchParams.set("state", continueTo);
    return res.redirect(url.toString());
});
app.get("/api/auth/callback", async (req, res) => {
    try {
        const code = typeof req.query.code === "string" ? req.query.code : undefined;
        const continueTo = typeof req.query.state === "string" && req.query.state.length
            ? req.query.state
            : FRONTEND_BASE_URL;
        if (!code)
            return res.status(400).send("Missing authorization code");
        const tokens = await fetchIdentityToken(code);
        const profile = await fetchIdentityProfile(tokens.access_token);
        await db_1.db
            .insert(schema_1.user)
            .values({
            id: profile.id,
            email: profile.email,
            name: profile.name ?? null,
            image: profile.image ?? null,
            slackId: profile.slack_id ?? null,
            verificationStatus: profile.verification_status ?? null,
            emailVerified: Boolean(profile.email_verified),
            role: "member",
            identityToken: tokens.access_token,
            refreshToken: tokens.refresh_token ?? null,
            updatedAt: new Date(),
        })
            .onConflictDoUpdate({
            target: schema_1.user.id,
            set: {
                email: profile.email,
                name: profile.name ?? null,
                image: profile.image ?? null,
                slackId: profile.slack_id ?? null,
                verificationStatus: profile.verification_status ?? null,
                emailVerified: Boolean(profile.email_verified),
                identityToken: tokens.access_token,
                refreshToken: tokens.refresh_token ?? null,
                updatedAt: new Date(),
            },
        });
        return res.redirect(`${continueTo.replace(/\/$/, "")}?auth=ok`);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return res.status(500).send(`Auth failed: ${message}`);
    }
});
app.get("/api/auth/profile", async (_req, res) => {
    try {
        const [latest] = await db_1.db.select().from(schema_1.user).orderBy((0, drizzle_orm_1.desc)(schema_1.user.updatedAt)).limit(1);
        if (!latest)
            return res.status(404).json({ error: "not authenticated" });
        return res.json(latest);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return res.status(500).json({ error: "failed to fetch profile", detail: message });
    }
});
app.get("/api/shop-items", async (_req, res) => {
    try {
        const rows = await db_1.db.select().from(schema_1.shopItems).orderBy((0, drizzle_orm_1.desc)(schema_1.shopItems.createdAt));
        res.json(rows);
    }
    catch (err) {
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
        const [created] = await db_1.db.insert(schema_1.shopItems).values({
            title: title.trim(),
            note: typeof note === "string" ? note.trim() : null,
            img: typeof img === "string" ? img.trim() : null,
            href: typeof href === "string" ? href.trim() : null
        }).returning();
        res.status(201).json(created);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: "failed to create shop item", detail: message });
    }
});
app.use(express_1.default.static(clientDir));
app.use("/assets", express_1.default.static(path_1.default.resolve(process.cwd(), "assets")));
app.use("/css", express_1.default.static(path_1.default.resolve(process.cwd(), "css")));
app.use("/refs", express_1.default.static(path_1.default.resolve(process.cwd(), "refs")));
app.use((_req, res) => {
    res.sendFile(path_1.default.join(clientDir, "index.html"));
});
const server = app.listen(PORT, () => {
    console.log(`Shop API running at http://localhost:${PORT}`);
});
// Ensure the server keeps the event loop alive and log unexpected shutdowns.
server.ref();
server.on("close", () => {
    console.log("Shop API server closed");
});
process.on("uncaughtException", (err) => {
    console.error("Uncaught exception", err);
});
process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection", reason);
});
