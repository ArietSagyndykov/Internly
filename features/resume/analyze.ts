import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import {
    RESUME_ANALYSIS_SYSTEM_PROMPT,
    buildResumeAnalysisUserMessage,
} from "./prompts";

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY automatically

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
    const response = await anthropic.messages.parse({
        model: "claude-sonnet-4-6",
        max_tokens: 3000,
        system: RESUME_ANALYSIS_SYSTEM_PROMPT,
        messages: [
            {
                role: "user",
                content: buildResumeAnalysisUserMessage(resumeText, targetRole),
            },
        ],
        output_config: {
            format: zodOutputFormat(ResumeAnalysisSchema),
        },
    });

    if (!response.parsed_output) {
        throw new Error(
            `Analysis produced no parsable output (stop_reason: ${response.stop_reason})`
        );
    }
    return response.parsed_output;
}
