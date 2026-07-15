ALTER TABLE "resumes"
ADD COLUMN IF NOT EXISTS "label" text DEFAULT 'My Resume' NOT NULL;
--> statement-breakpoint
ALTER TABLE "resumes"
ALTER COLUMN "is_primary" SET DEFAULT false;
--> statement-breakpoint
UPDATE "resumes"
SET "is_primary" = false;
--> statement-breakpoint
WITH first_resumes AS (
	SELECT DISTINCT ON ("user_id") "id"
	FROM "resumes"
	ORDER BY "user_id", "created_at", "id"
)
UPDATE "resumes"
SET "is_primary" = true
WHERE "id" IN (SELECT "id" FROM first_resumes);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"company" text,
	"raw_description" text NOT NULL,
	"extracted" jsonb NOT NULL,
	"embedding" vector(1536),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"resume_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"analysis" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
