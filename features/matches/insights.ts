import { desc, eq } from "drizzle-orm";
import { matches } from "@/db/schema";
import { db } from "@/lib/db";
import { MatchAnalysisSchema, type MatchAnalysis } from "./schema";

type GapSeverity = MatchAnalysis["gaps"][number]["severity"];

export type GapInsight = {
    normalizedName: string;
    displayName: string;
    jobCount: number;
    severityBreakdown: Record<GapSeverity, number>;
    weight: number;
    sampleSuggestion: string;
};

type MatchGapRow = {
    jobId: string;
    analysis: unknown;
    createdAt: Date;
};

const SEVERITY_WEIGHT: Record<GapSeverity, number> = {
    critical: 3,
    moderate: 2,
    minor: 1,
};

function normalizeRequirement(requirement: string) {
    const trimmed = requirement.trim();
    const withoutParenthetical = trimmed.replace(/\s*\([^)]*\)\s*$/, "").trim();
    return (withoutParenthetical || trimmed).toLowerCase();
}

/**
 * Aggregates validated match gaps. Each gap contributes at most once per job,
 * using its highest severity when duplicate entries exist for the same job.
 */
export function aggregateGapInsights(rows: MatchGapRow[]): GapInsight[] {
    const groups = new Map<
        string,
        {
            displayNames: Map<string, number>;
            jobs: Map<string, GapSeverity>;
            latestSuggestion: { value: string; createdAt: Date } | null;
        }
    >();

    for (const row of rows) {
        const parsed = MatchAnalysisSchema.safeParse(row.analysis);
        if (!parsed.success) continue;

        for (const gap of parsed.data.gaps) {
            const originalName = gap.requirement.trim();
            const normalizedName = normalizeRequirement(originalName);
            if (!normalizedName) continue;

            const group = groups.get(normalizedName) ?? {
                displayNames: new Map<string, number>(),
                jobs: new Map<string, GapSeverity>(),
                latestSuggestion: null,
            };

            group.displayNames.set(
                originalName,
                (group.displayNames.get(originalName) ?? 0) + 1
            );

            const currentSeverity = group.jobs.get(row.jobId);
            if (
                !currentSeverity ||
                SEVERITY_WEIGHT[gap.severity] > SEVERITY_WEIGHT[currentSeverity]
            ) {
                group.jobs.set(row.jobId, gap.severity);
            }

            if (
                !group.latestSuggestion ||
                row.createdAt > group.latestSuggestion.createdAt
            ) {
                group.latestSuggestion = {
                    value: gap.suggestion,
                    createdAt: row.createdAt,
                };
            }

            groups.set(normalizedName, group);
        }
    }

    return Array.from(groups, ([normalizedName, group]) => {
        const severityBreakdown: Record<GapSeverity, number> = {
            critical: 0,
            moderate: 0,
            minor: 0,
        };

        for (const severity of group.jobs.values()) {
            severityBreakdown[severity] += 1;
        }

        const displayName = Array.from(group.displayNames.entries()).sort(
            ([nameA, countA], [nameB, countB]) =>
                countB - countA || nameA.localeCompare(nameB)
        )[0]?.[0] ?? normalizedName;

        return {
            normalizedName,
            displayName,
            jobCount: group.jobs.size,
            severityBreakdown,
            weight:
                severityBreakdown.critical * SEVERITY_WEIGHT.critical +
                severityBreakdown.moderate * SEVERITY_WEIGHT.moderate +
                severityBreakdown.minor * SEVERITY_WEIGHT.minor,
            sampleSuggestion: group.latestSuggestion?.value ?? "",
        };
    }).sort(
        (a, b) =>
            b.weight - a.weight ||
            b.jobCount - a.jobCount ||
            a.displayName.localeCompare(b.displayName)
    );
}

/** Returns the user's gap ranking, ready for UI or future advisor context. */
export async function getGapInsights(userId: string): Promise<GapInsight[]> {
    const rows = await db
        .select({
            jobId: matches.jobId,
            analysis: matches.analysis,
            createdAt: matches.createdAt,
        })
        .from(matches)
        .where(eq(matches.userId, userId))
        .orderBy(desc(matches.createdAt));

    return aggregateGapInsights(rows);
}
