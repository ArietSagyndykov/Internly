import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { resumes } from "@/db/schema";

export async function getPrimaryResume(userId: string) {
    const [resume] = await db
        .select()
        .from(resumes)
        .where(and(eq(resumes.userId, userId), eq(resumes.isPrimary, true)))
        .limit(1);

    return resume ?? null;
}

export async function getResumeById(userId: string, resumeId: string) {
    const [resume] = await db
        .select()
        .from(resumes)
        // userId check doubles as authorization — never return another user's resume
        .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
        .limit(1);

    return resume ?? null;
}

export async function listResumes(userId: string) {
    return db
        .select({
            id: resumes.id,
            label: resumes.label,
            isPrimary: resumes.isPrimary,
            createdAt: resumes.createdAt,
        })
        .from(resumes)
        .where(eq(resumes.userId, userId))
        .orderBy(desc(resumes.createdAt));
}
