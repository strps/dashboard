CREATE TABLE "cheatsheet_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"syntax" text NOT NULL,
	"description" text NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cheatsheet_entry_tag" (
	"entry_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "cheatsheet_entry_tag_entry_id_tag_id_pk" PRIMARY KEY("entry_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "cheatsheet_tag" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"parent_id" text,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cheatsheet_widget_config" (
	"widget_instance_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"filter_buttons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cheatsheet_entry" ADD CONSTRAINT "cheatsheet_entry_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cheatsheet_entry_tag" ADD CONSTRAINT "cheatsheet_entry_tag_entry_id_cheatsheet_entry_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."cheatsheet_entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cheatsheet_entry_tag" ADD CONSTRAINT "cheatsheet_entry_tag_tag_id_cheatsheet_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."cheatsheet_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cheatsheet_tag" ADD CONSTRAINT "cheatsheet_tag_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cheatsheet_tag" ADD CONSTRAINT "cheatsheet_tag_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cheatsheet_tag"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cheatsheet_widget_config" ADD CONSTRAINT "cheatsheet_widget_config_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cheatsheet_entry_user_idx" ON "cheatsheet_entry" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cheatsheet_entry_tag_tag_idx" ON "cheatsheet_entry_tag" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "cheatsheet_tag_user_idx" ON "cheatsheet_tag" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cheatsheet_widget_config_user_idx" ON "cheatsheet_widget_config" USING btree ("user_id");