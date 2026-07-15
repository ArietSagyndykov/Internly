import { z } from "zod";

export const JobExtractionSchema = z.object({
    title: z.string(),
    company: z.string().nullable(),
    requiredSkills: z.array(z.string()),
    niceToHaveSkills: z.array(z.string()),
    responsibilities: z.array(z.string()),
    experienceLevel: z.enum(["internship", "entry", "mid", "senior", "unclear"]),
    summary: z.string(),
});

export type JobExtraction = z.infer<typeof JobExtractionSchema>;

export const MatchAnalysisSchema = z.object({
    score: z.number().min(0).max(100),
    verdict: z.string(),
    matchedRequirements: z.array(
        z.object({
            requirement: z.string(),
            evidence: z.string(),
        })
    ),
    gaps: z.array(
        z.object({
            requirement: z.string(),
            severity: z.enum(["critical", "moderate", "minor"]),
            suggestion: z.string(),
        })
    ),
    projectsToEmphasize: z.array(
        z.object({
            projectName: z.string(),
            reason: z.string(),
        })
    ),
});

export type MatchAnalysis = z.infer<typeof MatchAnalysisSchema>;
