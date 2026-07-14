import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { resumes } from "@/db/schema";

export async function getLatestResume(userId: string) {
    const [resume] = await db
        .select()
        .from(resumes)
        .where(eq(resumes.userId, userId))
        .orderBy(desc(resumes.createdAt))
        .limit(1);

    return resume ?? null;
}
