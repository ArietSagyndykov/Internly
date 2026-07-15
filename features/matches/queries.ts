import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, matches, resumes } from "@/db/schema";

export async function listMatches(userId: string) {
    return db
        .select({
            id: matches.id,
            score: matches.score,
            createdAt: matches.createdAt,
            jobTitle: jobs.title,
            company: jobs.company,
            resumeLabel: resumes.label,
        })
        .from(matches)
        .innerJoin(jobs, eq(matches.jobId, jobs.id))
        .innerJoin(resumes, eq(matches.resumeId, resumes.id))
        .where(eq(matches.userId, userId))
        .orderBy(desc(matches.createdAt));
}

export async function getMatch(userId: string, matchId: string) {
    const [row] = await db
        .select({
            id: matches.id,
            score: matches.score,
            analysis: matches.analysis,
            createdAt: matches.createdAt,
            jobTitle: jobs.title,
            company: jobs.company,
            resumeLabel: resumes.label,
        })
        .from(matches)
        .innerJoin(jobs, eq(matches.jobId, jobs.id))
        .innerJoin(resumes, eq(matches.resumeId, resumes.id))
        // userId check doubles as authorization
        .where(and(eq(matches.id, matchId), eq(matches.userId, userId)))
        .limit(1);

    return row ?? null;
}
