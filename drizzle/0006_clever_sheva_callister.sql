CREATE TABLE "activity_activity_tag" (
	"activity_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "activity_activity_tag_activity_id_tag_id_pk" PRIMARY KEY("activity_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "activity_tag" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"parent_id" text,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_activity_tag" ADD CONSTRAINT "activity_activity_tag_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_activity_tag" ADD CONSTRAINT "activity_activity_tag_tag_id_activity_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."activity_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_tag" ADD CONSTRAINT "activity_tag_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_tag" ADD CONSTRAINT "activity_tag_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."activity_tag"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_activity_tag_tag_idx" ON "activity_activity_tag" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "activity_tag_user_idx" ON "activity_tag" USING btree ("user_id");