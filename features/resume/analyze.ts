import { z } from "zod";
import { parseWithSchema } from "@/lib/claude";
import {
    RESUME_ANALYSIS_SYSTEM_PROMPT,
    buildResumeAnalysisUserMessage,
} from "./prompts";

export const ResumeAnalysisSchema = z.object({
    overallScore: z.number().min(0).max(100),
    summary: z.string(),
    sections: z.array(
        z.object({
            id: z.enum(["education", "skills", "experience", "projects"]),
            title: z.string(),
            score: z.number().min(0).max(100),
            strengths: z.array(z.string()),
            improvements: z.array(
                z.object({
                    issue: z.string(),
                    suggestedRewrite: z.string().nullable(),
                })
            ),
        })
    ),
    missingSections: z.array(z.string()),
});

export type ResumeAnalysis = z.infer<typeof ResumeAnalysisSchema>;

export async function analyzeResume(
    resumeText: string,
    targetRole?: string
): Promise<ResumeAnalysis> {
    return parseWithSchema({
        system: RESUME_ANALYSIS_SYSTEM_PROMPT,
        userMessage: buildResumeAnalysisUserMessage(resumeText, targetRole),
        schema: ResumeAnalysisSchema,
        maxTokens: 3000,
    });
}
