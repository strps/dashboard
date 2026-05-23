import { sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "@/lib/db/schema";

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
