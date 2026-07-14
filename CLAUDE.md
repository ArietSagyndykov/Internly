# Internly

A web app that helps CS students land tech internships. Solo project by a
student, built for learning + portfolio. Currently in early development.

## Features (build order)
1. **Resume review** — upload PDF → extract text → Claude analyzes → score +
   suggestions (DONE: upload → parse → Claude analysis → results UI, with
   retry for failed analyses)
2. **Project library** — sync repos from GitHub, Claude enriches each with
   summary/skills/resume bullets (NOT STARTED)
3. **Job matching** — paste job description → compare vs resume + project
   library → match score, gaps, hidden strengths (NOT STARTED)
4. **Advisor chat** — RAG-powered mentor chat. Context = full structured
   profile (injected directly) + retrieved memories from past chats
   (pgvector). Memories are Claude-generated summaries, not raw messages
   (NOT STARTED)
5. **Dashboard** — aggregates all of the above (LAST — after data exists)

## Stack
- Next.js 16 (App Router), TypeScript, Tailwind v4
- Supabase: Postgres + pgvector, Auth (GitHub OAuth only), Storage
- Drizzle ORM (schema in db/schema.ts — source of truth)
- Claude API (@anthropic-ai/sdk) for all AI features
- Zod to validate every piece of LLM output
- unpdf for PDF text extraction
- Vercel AI SDK (later, for advisor chat streaming)
- NO LangChain/LlamaIndex — RAG is hand-rolled deliberately

## Architecture rules
- Feature-based structure: features/{resume,projects,matches,advisor}/
  each with components/, actions.ts, queries.ts
- features/X must NEVER import from features/Y — shared logic goes to lib/
  or the owning feature exports it one-way
- app/ routes are thin: fetch via feature queries, render feature components
- Route groups: (marketing) public, (auth) login/callback, (app) protected
  with sidebar layout
- Mutations = server actions in features/*/actions.ts. API routes only
  where required (streaming chat: app/api/chat/route.ts)
- Server-side only for: Claude API calls, DATABASE_URL, service keys.
  Never expose in client components
- proxy.ts (Next 16 middleware) handles Supabase session refresh — don't
  remove the getUser() call

## Conventions
- Server actions return { error: string } | { success: true, ... } —
  no throwing for expected failures
- Claude responses: always request JSON, always Zod-parse before DB writes
- Drizzle for all DB access (not supabase-js query builder);
  supabase-js only for auth + storage
- Storage: resumes bucket (private), path = {userId}/{timestamp}.pdf

## Environment (.env.local — never commit, never print values)
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL,
ANTHROPIC_API_KEY

## Current state
Foundation complete: auth flow works end-to-end, schema pushed (6 tables:
profiles, resumes, projects, job_matches, chat_messages, memories —
memories has vector(1536) + HNSW index). Resume feature complete and
verified working: upload → unpdf extraction → Claude analysis
(features/resume/analyze.ts, Zod-validated) → results UI, retry button
for failed analyses. Analysis failures are non-fatal (resume still saved).
NEXT UP: Project library — GitHub repo sync + Claude enrichment.
Cost guardrails to bake in: per-user daily quotas (resume + job match),
enrich only on sync (skip unchanged repos via pushed_at), cache job
matches by JD hash, never call Claude on page load.