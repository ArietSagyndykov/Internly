# Feature: Gap Aggregation View (v1)

## Context
Internly stores every job–resume match in the `matches` table, with the Zod-validated
match analysis in `matches.analysis` (jsonb). That analysis contains a `gaps` array:

```
gaps: [
  { requirement: string, severity: "critical" | "moderate" | "minor", suggestion: string }
]
```

This feature aggregates gaps across ALL of a user's matches to show which missing
skills appear most often — a personalized "what to learn next" ranking derived from
the user's actual saved jobs.

## Scope for v1
- One new page: `/insights` (nav label "Insights")
- Read-only. No new Claude calls, no new tables, no embeddings, no migrations.
- Aggregation logic lives in `features/matches/` (it is derived from match data) —
  a server-side function plus a page component. Do not create a new feature folder.

## Out of scope (do not build)
- LLM-based canonicalization of skill names
- Filtering by date range, job, or resume
- Charts/visualizations — a ranked list is enough
- Any advisor integration

## Aggregation logic
Server-side (SQL over jsonb, or fetch + aggregate in TS if the jsonb query gets
ugly with Drizzle — either is acceptable for v1, prefer whichever is simpler and
readable):

1. Collect all `gaps` entries across the current user's matches.
2. Normalize requirement names for grouping: trim, lowercase, strip trailing
   parentheticals — e.g. "Deep Learning (PyTorch / JAX)" -> "deep learning".
   Keep the most common original casing as the display name.
3. Group by normalized name. For each group compute:
   - `jobCount`: number of DISTINCT jobs the gap appears in (not raw entry count)
   - `severityBreakdown`: counts per severity
   - `weight`: jobCount weighted by severity (critical=3, moderate=2, minor=1;
     use the max severity per job for that gap)
   - `sampleSuggestion`: one representative suggestion string (most recent)
4. Sort by weight descending.

Known limitation (accept it): fuzzy variants like "PyTorch" vs "Deep Learning
(PyTorch/JAX)" may still group separately. Do not build anything clever for this.

## Page: /insights
- Header: "Your gaps across N analyzed jobs" (N = user's match count)
- Ranked list, each row: display name, "appears in X of N jobs", severity badges
  (e.g. "critical in 3"), and the sample suggestion as secondary text
- Empty state if the user has fewer than 3 matches: message explaining the view
  gets useful as they analyze more jobs, with a link to /matches
- Functional UI only, consistent with the rest of the app. No styling effort.

## Definition of done
- /insights renders correct aggregates for a user with multiple matches
- Distinct-job counting verified (a gap appearing twice for one job counts once)
- Empty state works
- Lint and typecheck pass
- The aggregation function is exported cleanly so it can later be reused as
  advisor context (single function returning the sorted aggregate array)
