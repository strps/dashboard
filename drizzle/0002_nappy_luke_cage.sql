CREATE TABLE "dashboard_layout" (
	"user_id" text PRIMARY KEY NOT NULL,
	"layout" jsonb NOT NULL,
	"instances" jsonb NOT NULL,
	"locked" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dashboard_layout" ADD CONSTRAINT "dashboard_layout_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;