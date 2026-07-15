"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { jobs, matches, projects } from "@/db/schema";
import { parseWithSchema } from "@/lib/claude";
import { getPrimaryResume, getResumeById } from "@/features/resume/queries";
import { JobExtractionSchema, MatchAnalysisSchema } from "./schema";
import {
    JOB_EXTRACTION_SYSTEM_PROMPT,
    MATCH_ANALYSIS_SYSTEM_PROMPT,
    buildExtractionUserMessage,
    buildMatchUserMessage,
    type ProjectSummary,
} from "./prompts";

const MIN_JD_LENGTH = 100;
const MAX_JD_LENGTH = 20_000;

export async function analyzeJob(
    formData: FormData
): Promise<{ error: string } | { success: true; matchId: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You must be signed in to analyze a job." };

    const rawDescription = formData.get("description");
    if (typeof rawDescription !== "string" || rawDescription.trim().length < MIN_JD_LENGTH) {
        return { error: "Please paste the full job description (at least a few sentences)." };
    }
    if (rawDescription.length > MAX_JD_LENGTH) {
        return { error: "That job description is too long — paste just the posting, not the whole page." };
    }

    const titleInput = formData.get("title");
    const companyInput = formData.get("company");
    const title = typeof titleInput === "string" && titleInput.trim() ? titleInput.trim() : undefined;
    const company = typeof companyInput === "string" && companyInput.trim() ? companyInput.trim() : undefined;

    // Resolve the resume to match against: explicit selection, else primary
    const resumeIdInput = formData.get("resumeId");
    const resume =
        typeof resumeIdInput === "string" && resumeIdInput
            ? await getResumeById(user.id, resumeIdInput)
            : await getPrimaryResume(user.id);
    if (!resume || !resume.rawText) {
        return { error: "No resume on file — upload one on the Resume page first." };
    }

    // Claude call 1: extract structured requirements from the JD
    let extraction;
    try {
        extraction = await parseWithSchema({
            system: JOB_EXTRACTION_SYSTEM_PROMPT,
            userMessage: buildExtractionUserMessage(rawDescription.trim(), title, company),
            schema: JobExtractionSchema,
            maxTokens: 1500,
        });
    } catch (e) {
        console.error("JD extraction failed:", e);
        return { error: "Couldn't analyze that job description. Please try again." };
    }

    const [job] = await db
        .insert(jobs)
        .values({
            userId: user.id,
            title: title ?? extraction.title,
            company: company ?? extraction.company,
            rawDescription: rawDescription.trim(),
            extracted: extraction,
            // embedding stays null in v1 — no embedding provider configured yet
        })
        .returning({ id: jobs.id });

    // Project library entries (empty until the projects feature ships)
    const projectRows = await db
        .select({
            name: projects.name,
            description: projects.description,
            languages: projects.languages,
        })
        .from(projects)
        .where(eq(projects.userId, user.id));

    const projectSummaries: ProjectSummary[] = projectRows.map((p) => ({
        name: p.name,
        description: p.description,
        techStack: Array.isArray(p.languages) ? (p.languages as string[]) : [],
    }));

    // Claude call 2: match analysis against the selected resume
    let analysis;
    try {
        analysis = await parseWithSchema({
            system: MATCH_ANALYSIS_SYSTEM_PROMPT,
            userMessage: buildMatchUserMessage({
                extractionJson: JSON.stringify(extraction, null, 2),
                resumeText: resume.rawText,
                projects: projectSummaries,
            }),
            schema: MatchAnalysisSchema,
            maxTokens: 2500,
        });
    } catch (e) {
        console.error("Match analysis failed:", e);
        return { error: "The job was saved but the match analysis failed. Please try again." };
    }

    const [match] = await db
        .insert(matches)
        .values({
            jobId: job.id,
            resumeId: resume.id,
            userId: user.id,
            score: analysis.score,
            analysis,
        })
        .returning({ id: matches.id });

    revalidatePath("/matches");
    return { success: true, matchId: match.id };
}
