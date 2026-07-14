"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { extractText } from "unpdf";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { resumes } from "@/db/schema";
import { analyzeResume, type ResumeAnalysis } from "./analyze";
import { getLatestResume } from "./queries";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadResume(
    formData: FormData
): Promise<{ error: string } | { success: true }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You must be signed in to upload a resume." };

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
        return { error: "Please choose a file to upload." };
    }
    if (file.type !== "application/pdf") {
        return { error: "Only PDF files are supported." };
    }
    if (file.size > MAX_FILE_SIZE) {
        return { error: "File is too large — the limit is 5MB." };
    }

    // 1. Upload the original PDF to private storage
    const path = `${user.id}/${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(path, file, { contentType: "application/pdf" });
    if (uploadError) {
        return { error: `Upload failed: ${uploadError.message}` };
    }

    // 2. Extract text
    let text: string;
    try {
        const buffer = new Uint8Array(await file.arrayBuffer());
        const result = await extractText(buffer, { mergePages: true });
        text = result.text;
    } catch {
        return { error: "Could not read that PDF. Is it corrupted?" };
    }
    if (text.trim().length < 100) {
        return {
            error: "Couldn't extract enough text from that PDF. Is it a scanned image?",
        };
    }

    // 3. Analyze with Claude
    let analysis: ResumeAnalysis | null = null;
    try {
        analysis = await analyzeResume(text);
    } catch (e) {
        console.error("Analysis failed:", e);
        // still save the resume — user can retry analysis later
    }

    // 4. Save the row
    await db.insert(resumes).values({
        userId: user.id,
        fileUrl: path,
        rawText: text,
        analysis,
    });

    revalidatePath("/resume");
    return { success: true };
}

export async function retryAnalysis(): Promise<
    { error: string } | { success: true }
> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You must be signed in to retry analysis." };

    const resume = await getLatestResume(user.id);
    if (!resume) return { error: "No resume uploaded yet." };
    if (!resume.rawText || resume.rawText.trim().length < 100) {
        return { error: "This resume has no extracted text to analyze." };
    }

    let analysis: ResumeAnalysis;
    try {
        analysis = await analyzeResume(resume.rawText);
    } catch (e) {
        console.error("Analysis retry failed:", e);
        const message = e instanceof Error ? e.message : "Unknown error";
        return { error: `Analysis failed: ${message}` };
    }

    await db
        .update(resumes)
        .set({ analysis })
        .where(eq(resumes.id, resume.id));

    revalidatePath("/resume");
    return { success: true };
}
