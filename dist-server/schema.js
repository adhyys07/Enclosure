"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectedProjects = exports.approvedProjects = exports.shippedProjects = exports.createdProjects = exports.projects = exports.submissions = exports.user = exports.userRole = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.userRole = (0, pg_core_1.pgEnum)("user_role", ["admin", "reviewer", "member"]);
exports.user = (0, pg_core_1.pgTable)("user", {
    id: (0, pg_core_1.text)("id").primaryKey(),
    name: (0, pg_core_1.text)("name"),
    email: (0, pg_core_1.text)("email").notNull(),
    emailVerified: (0, pg_core_1.boolean)("email_verified").default(false).notNull(),
    image: (0, pg_core_1.text)("image"),
    slackId: (0, pg_core_1.text)("slack_id"),
    role: (0, exports.userRole)("role").default("member"),
    verificationStatus: (0, pg_core_1.text)("verification_status"),
    identityToken: (0, pg_core_1.text)("identity_token"),
    refreshToken: (0, pg_core_1.text)("refresh_token"),
    hackatimeAccessToken: (0, pg_core_1.text)("hackatime_access_token"),
    hackatimeRefreshToken: (0, pg_core_1.text)("hackatime_refresh_token"),
    hackatimeExpiresAt: (0, pg_core_1.timestamp)("hackatime_expires_at", { withTimezone: false }),
    hackatimeUserId: (0, pg_core_1.text)("hackatime_user_id"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: false }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: false }).defaultNow()
});
exports.submissions = (0, pg_core_1.pgTable)("submissions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    email: (0, pg_core_1.text)("email").notNull(),
    designUrl: (0, pg_core_1.text)("design_url").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: false }).defaultNow()
});
exports.projects = (0, pg_core_1.pgTable)("projects", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    description: (0, pg_core_1.text)("description"),
    status: (0, pg_core_1.text)("status").default("draft"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: false }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: false }).defaultNow()
});
exports.createdProjects = (0, pg_core_1.pgTable)("created_projects", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    email: (0, pg_core_1.text)("email").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: false }).defaultNow()
});
exports.shippedProjects = (0, pg_core_1.pgTable)("shipped_projects", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    email: (0, pg_core_1.text)("email").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: false }).defaultNow()
});
exports.approvedProjects = (0, pg_core_1.pgTable)("approved_projects", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    email: (0, pg_core_1.text)("email").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: false }).defaultNow()
});
exports.rejectedProjects = (0, pg_core_1.pgTable)("rejected_projects", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    email: (0, pg_core_1.text)("email").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: false }).defaultNow()
});
