"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopItems = exports.user = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.user = (0, pg_core_1.pgTable)("user", {
    id: (0, pg_core_1.text)("id").primaryKey(),
    name: (0, pg_core_1.text)("name"),
    email: (0, pg_core_1.text)("email").notNull(),
    emailVerified: (0, pg_core_1.boolean)("email_verified").default(false),
    image: (0, pg_core_1.text)("image"),
    slackId: (0, pg_core_1.text)("slack_id"),
    verificationStatus: (0, pg_core_1.text)("verification_status"),
    role: (0, pg_core_1.text)("role").default("member"),
    identityToken: (0, pg_core_1.text)("identity_token"),
    refreshToken: (0, pg_core_1.text)("refresh_token"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow()
});
exports.shopItems = (0, pg_core_1.pgTable)("shop_items", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    title: (0, pg_core_1.text)("title").notNull(),
    note: (0, pg_core_1.text)("note"),
    img: (0, pg_core_1.text)("img"),
    href: (0, pg_core_1.text)("href"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow()
});
