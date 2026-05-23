import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import type { LayoutItem } from "react-grid-layout";

import type { FilterButton } from "@/dashboard/widgets/cheatsheet/schemas";
import type { NoteBlock } from "@/dashboard/widgets/notes/schemas";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const allowedEmail = pgTable("allowed_email", {
  email: text("email").primaryKey(),
  isAdmin: boolean("is_admin").notNull().default(false),
  addedByUserId: text("added_by_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const activity = pgTable(
  "activity",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull(),
    order: integer("order").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("activity_user_order_idx").on(t.userId, t.order)],
);

export const dashboardLayout = pgTable("dashboard_layout", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  layout: jsonb("layout").$type<LayoutItem[]>().notNull(),
  instances: jsonb("instances")
    .$type<{ id: string; type: string }[]>()
    .notNull(),
  locked: boolean("locked").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const note = pgTable(
  "note",
  {
    widgetInstanceId: text("widget_instance_id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    blocks: jsonb("blocks").$type<NoteBlock[]>().notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("note_user_idx").on(t.userId)],
);

export const cheatsheetTag = pgTable(
  "cheatsheet_tag",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    parentId: text("parent_id"),
    color: text("color"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("cheatsheet_tag_user_idx").on(t.userId),
    foreignKey({
      columns: [t.parentId],
      foreignColumns: [t.id],
      name: "cheatsheet_tag_parent_fk",
    }).onDelete("set null"),
  ],
);

export const cheatsheetEntry = pgTable(
  "cheatsheet_entry",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    syntax: text("syntax").notNull(),
    description: text("description").notNull(),
    priority: integer("priority").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("cheatsheet_entry_user_idx").on(t.userId)],
);

export const cheatsheetEntryTag = pgTable(
  "cheatsheet_entry_tag",
  {
    entryId: text("entry_id")
      .notNull()
      .references(() => cheatsheetEntry.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => cheatsheetTag.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.entryId, t.tagId] }),
    index("cheatsheet_entry_tag_tag_idx").on(t.tagId),
  ],
);

export const cheatsheetWidgetConfig = pgTable(
  "cheatsheet_widget_config",
  {
    widgetInstanceId: text("widget_instance_id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    filterButtons: jsonb("filter_buttons")
      .$type<FilterButton[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("cheatsheet_widget_config_user_idx").on(t.userId)],
);

export const activityTag = pgTable(
  "activity_tag",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    parentId: text("parent_id"),
    color: text("color"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("activity_tag_user_idx").on(t.userId),
    foreignKey({
      columns: [t.parentId],
      foreignColumns: [t.id],
      name: "activity_tag_parent_fk",
    }).onDelete("set null"),
  ],
);

export const activityActivityTag = pgTable(
  "activity_activity_tag",
  {
    activityId: text("activity_id")
      .notNull()
      .references(() => activity.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => activityTag.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.activityId, t.tagId] }),
    index("activity_activity_tag_tag_idx").on(t.tagId),
  ],
);

export const timeEntry = pgTable(
  "time_entry",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activityId: text("activity_id")
      .notNull()
      .references(() => activity.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    endedAt: timestamp("ended_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("time_entry_user_started_idx").on(t.userId, t.startedAt),
    uniqueIndex("time_entry_one_open_per_user")
      .on(t.userId)
      .where(sql`${t.endedAt} IS NULL`),
  ],
);
