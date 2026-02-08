import { pgTable, text, boolean, timestamp, serial } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: boolean("email_verified").default(false),
  image: text("image"),
  slackId: text("slack_id"),
  verificationStatus: text("verification_status"),
  role: text("role").default("member"),
  identityToken: text("identity_token"),
  refreshToken: text("refresh_token"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

export const shopItems = pgTable("shop_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  note: text("note"),
  img: text("img"),
  href: text("href"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});
