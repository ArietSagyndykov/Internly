# Feature: Job–Resume Matching (v1)

## Context
Internly is a Next.js 16 (App Router) app with Supabase (Postgres + pgvector), Drizzle ORM, Zod for LLM output validation, and the Anthropic SDK (`@anthropic-ai/sdk`). The resume analysis feature is complete and lives in `features/resume/`. Follow the same patterns established there: feature-folder structure, Zod-validated Claude calls, server-side API key usage.

This feature lets a user paste a job description, extracts structured requirements with Claude, and produces a match analysis against the user's stored resume and project library.

## Scope for v1
- Job input is paste-only (textarea). NO scraping, NO job board APIs.
- One job at a time. No batch processing.
- Resume library: users can store multiple resumes. One is marked primary. Matching defaults to the primary resume with a dropdown to select another.
- UI is functional only — plain forms and cards, no polish. Do not spend effort on styling.

## Out of scope (do not build)
- Job URL fetching/scraping
- Editing a saved job
- Re-running a match automatically when the resume changes
- Any advisor-chat integration
- Ranking the resume library against a job ("which resume fits best")
- Generating tailored resume variants

## Database (Drizzle schema, schema-first)
Add to the existing schema:

### `resumes` table (refactor)
The app currently assumes a single resume per user. Refactor to a library:
- `id` uuid pk default random
- `userId` uuid fk -> users, not null
- `label` text not null — user-facing name, e.g. "ML-focused v2"
- `content` text not null — the resume text
- `analysis` jsonb — latest resume analysis result (nullable until analyzed)
- `isPrimary` boolean not null default false — exactly one primary per user; enforce in application logic (set new primary -> unset old)
- `createdAt` timestamptz default now

Migrate existing resume data into this table (first resume becomes primary, label "My Resume"). Update the existing resume feature (`features/resume/`) to read/write this table; the resume page displays the primary resume's analysis. Keep this refactor minimal — no library management UI beyond upload, list, select primary. All library management UI (list, upload, set primary, view a resume's analysis) lives in `features/resume/` on the `/resume` page. The matches feature only reads the library via a selector dropdown — no management UI in `/matches`.

### `jobs` table
- `id` uuid pk default random
- `userId` uuid fk -> users, not null
- `title` text not null
- `company` text
- `rawDescription` text not null
- `extracted` jsonb not null — the Zod-validated extraction result
- `embedding` vector(1536) — embedding of the extracted requirements summary
- `createdAt` timestamptz default now

### `matches` table
- `id` uuid pk default random
- `jobId` uuid fk -> jobs, not null
- `resumeId` uuid fk -> resumes, not null — the resume this match was run against
- `userId` uuid fk -> users, not null
- `score` integer not null — 0-100 overall match
- `analysis` jsonb not null — the Zod-validated match analysis
- `createdAt` timestamptz default now

Generate and include the Drizzle migration.

## Feature folder: `features/matches/`
Mirror the structure of `features/resume/`:
- `schema.ts` — Zod schemas (extraction + match analysis)
- `prompts.ts` — system prompts + user message builders
- `actions.ts` (or route handlers, matching whatever `features/resume/` uses) — server-side logic
- `components/` — JobInputForm, MatchResultCard (functional only)

## Claude call 1: JD extraction
Model: use the same model as the resume pipeline.
Input: raw pasted job description (+ optional title/company from the form).
Output (Zod-validated JSON):
```
{
  title: string,              // inferred if not provided
  company: string | null,
  requiredSkills: string[],
  niceToHaveSkills: string[],
  responsibilities: string[],
  experienceLevel: "internship" | "entry" | "mid" | "senior" | "unclear",
  summary: string             // 1-2 sentence role summary
}
```
Prompt rules: JSON only, no fences; if input is clearly not a job description, return experienceLevel "unclear" with empty arrays and a summary explaining the problem.

## Claude call 2: match analysis
Input: the extraction result + the user's stored resume text + project library entries (name, description, tech stack).
Output (Zod-validated JSON):
```
{
  score: number,                    // 0-100
  verdict: string,                  // 2-3 sentence honest assessment
  matchedRequirements: [
    { requirement: string, evidence: string }   // evidence cites the specific resume bullet or project
  ],
  gaps: [
    { requirement: string, severity: "critical" | "moderate" | "minor", suggestion: string }
  ],
  projectsToEmphasize: [
    { projectName: string, reason: string }
  ]
}
```
Scoring rubric (put in the prompt): 85+ strong match / 70-84 good match with addressable gaps / 50-69 stretch / <50 significant mismatch. Be honest — do not inflate scores.

## Embeddings
- Embed a text summary of `requiredSkills + niceToHaveSkills + responsibilities` into `jobs.embedding` using the same embedding model/util already used for advisor memory chunks (check `features/advisor/` or shared lib for the existing embedding helper — reuse it, do not create a second one).
- v1 does not need similarity search UI; storing the embedding is enough (it will power future features).

## Flow
1. `/matches` page: textarea + optional title/company fields + resume selector (dropdown, defaults to primary resume) + submit
2. On submit (server): extraction call -> validate with Zod -> insert into `jobs` (with embedding)
3. Then: fetch the selected resume + projects -> match analysis call -> validate -> insert into `matches` (with `resumeId`)
4. Render: score, verdict, matched requirements (green), gaps grouped by severity (red/orange), projects to emphasize; show which resume the match used
5. `/matches` also lists previously analyzed jobs (title, company, score, resume label, date) linking to their results

## Error handling
- Zod parse failure: retry the Claude call once with the validation error appended to the prompt; if it fails again, surface a friendly error. (Reuse the retry helper from the resume feature if one exists; if not, create it in a shared location and refactor the resume feature to use it.)
- No resume on file: block submission with a message directing the user to upload a resume first.

## Definition of done
- Migration applies cleanly, including migrating existing resume data into `resumes` with `isPrimary = true`
- Existing resume feature works unchanged from the user's perspective (displays primary resume analysis)
- Pasting a real JD produces a stored job + match analysis end to end
- Both Claude calls are Zod-validated with the retry-once behavior
- Lint and typecheck pass
- Brief manual test instructions in the PR/summary
