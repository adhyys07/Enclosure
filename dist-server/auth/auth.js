"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
exports.getAuth = getAuth;
const better_auth_1 = require("better-auth");
const db_1 = require("better-auth/db");
const drizzle_1 = require("better-auth/adapters/drizzle");
const plugins_1 = require("better-auth/plugins");
const db_2 = require("../db");
const schema = __importStar(require("../schema"));
let _auth = null;
function createAuth() {
    const identityHost = process.env.HC_IDENTITY_HOST;
    return (0, better_auth_1.betterAuth)({
        database: (0, drizzle_1.drizzleAdapter)(db_2.db, {
            provider: "pg",
            schema,
        }),
        user: {
            additionalFields: {
                slackId: (0, db_1.createFieldAttribute)("string", { required: false }),
                verificationStatus: (0, db_1.createFieldAttribute)("string", { required: false }),
                role: (0, db_1.createFieldAttribute)("string", { required: false }),
            },
        },
        emailAndPassword: {
            enabled: false,
        },
        plugins: [
            (0, plugins_1.genericOAuth)({
                config: [
                    {
                        // Use a URL-safe provider id (it becomes part of the callback route).
                        providerId: "hackclub-identity",
                        clientId: process.env.HC_IDENTITY_CLIENT_ID,
                        clientSecret: process.env.HC_IDENTITY_CLIENT_SECRET,
                        discoveryUrl: `${identityHost}/.well-known/openid-configuration`,
                        redirectURI: process.env.HC_IDENTITY_REDIRECT_URI,
                        // These claims are supported by the provider; scopes_supported lists at least openid/profile.
                        scopes: ['profile', 'email', 'name', 'slack_id', 'verification_status'],
                        getToken: async ({ code, redirectURI }) => {
                            const clientId = process.env.HC_IDENTITY_CLIENT_ID;
                            const clientSecret = process.env.HC_IDENTITY_CLIENT_SECRET;
                            const response = await fetch(`${identityHost}/oauth/token`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded",
                                },
                                body: new URLSearchParams({
                                    client_id: clientId,
                                    client_secret: clientSecret,
                                    code,
                                    redirect_uri: redirectURI,
                                    grant_type: "authorization_code",
                                }),
                            });
                            const data = await response.json();
                            if (!response.ok) {
                                throw new Error(data.error);
                            }
                            // Identify the user immediately via the provider (first time we can trust `access_token`)
                            // and ensure the user exists in our DB.
                            const userInfoResponse = await fetch(`${identityHost}/api/v1/me`, {
                                headers: {
                                    Authorization: `Bearer ${data.access_token}`,
                                },
                            });
                            let userInfo = null;
                            if (userInfoResponse.ok) {
                                const me = (await userInfoResponse.json());
                                const userData = me.identity;
                                const id = userData?.id;
                                const email = userData?.primary_email;
                                if (userData && id && email) {
                                    const now = new Date();
                                    const firstName = userData.first_name ?? "";
                                    const lastName = userData.last_name ?? "";
                                    const name = `${firstName} ${lastName}`.trim();
                                    const image = userData.avatar_url ?? null;
                                    const slackId = userData.slack_id ?? null;
                                    const verificationStatus = userData.verification_status ?? null;
                                    const identityToken = data.access_token ?? null;
                                    const refreshToken = data.refresh_token ?? null;
                                    // Create the user if missing; otherwise update stored Identity fields + tokens.
                                    await db_2.db
                                        .insert(schema.user)
                                        .values({
                                        id,
                                        name,
                                        email,
                                        emailVerified: true,
                                        image,
                                        slackId,
                                        verificationStatus,
                                        identityToken,
                                        refreshToken,
                                        createdAt: now,
                                        updatedAt: now,
                                    })
                                        .onConflictDoUpdate({
                                        target: schema.user.id,
                                        set: {
                                            name,
                                            email,
                                            emailVerified: true,
                                            image,
                                            slackId,
                                            verificationStatus,
                                            identityToken,
                                            refreshToken,
                                            updatedAt: now,
                                        },
                                    });
                                    userInfo = {
                                        id,
                                        name,
                                        email,
                                        emailVerified: true,
                                        // Better Auth's OAuth2UserInfo uses `image?: string` (undefined when absent), not null.
                                        image: image ?? undefined,
                                        slackId,
                                        verificationStatus,
                                        identityToken,
                                        refreshToken,
                                    };
                                }
                            }
                            else {
                                console.error("Error getting user info", userInfoResponse.statusText);
                            }
                            if (process.env.NODE_ENV !== "production") {
                                // Debug-only log to help inspect OAuth payloads during development.
                                console.debug("[auth:getToken] tokens received", {
                                    hasAccessToken: Boolean(data.access_token),
                                    hasRefreshToken: Boolean(data.refresh_token),
                                    scopes: data.scope,
                                    expiresIn: data.expires_in,
                                    userInfo,
                                });
                            }
                            return {
                                accessToken: data.access_token,
                                refreshToken: data.refresh_token,
                                idToken: data.id_token ?? null,
                                raw: {
                                    ...data,
                                    userInfo,
                                },
                            };
                        },
                        getUserInfo: async (tokens) => {
                            // User is identified/created in `getToken`; just return it here.
                            const userInfo = tokens.raw?.userInfo;
                            return (userInfo ?? null);
                        },
                    },
                ],
            }),
        ],
    });
}
function getAuth() {
    if (!_auth) {
        _auth = createAuth();
    }
    return _auth;
}
exports.auth = getAuth();
