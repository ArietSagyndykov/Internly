import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPrimaryResume, listResumes } from "@/features/resume/queries";
import { UploadForm } from "@/features/resume/components/UploadForm";
import { ResumeList } from "@/features/resume/components/ResumeList";
import { AnalysisResults } from "@/features/resume/components/AnalysisResults";
import { RetryAnalysisButton } from "@/features/resume/components/RetryAnalysisButton";
import { ResumeAnalysisSchema } from "@/features/resume/analyze";

export default async function ResumePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const [resumeList, primary] = await Promise.all([
        listResumes(user.id),
        getPrimaryResume(user.id),
    ]);

    // Rows analyzed under an older prompt/schema fail parsing and fall
    // back to the retry button rather than rendering broken results.
    const analysis = ResumeAnalysisSchema.safeParse(primary?.analysis);

    return (
        <main className="p-10">
            <h1 className="text-2xl font-semibold">My resumes</h1>

            <UploadForm />

            <ResumeList
                items={resumeList.map((r) => ({
                    id: r.id,
                    label: r.label,
                    isPrimary: r.isPrimary,
                    createdAt: r.createdAt.toLocaleDateString(),
                }))}
            />

            {primary && (
                <div className="mt-6 rounded-xl border p-4">
                    <p className="text-sm text-gray-500">
                        Primary resume: {primary.label} — uploaded{" "}
                        {primary.createdAt.toLocaleDateString()}
                    </p>
                    <p className="mt-2 text-sm text-gray-700">
                        {primary.rawText?.slice(0, 200)}…
                    </p>
                </div>
            )}

            {analysis.success ? (
                <AnalysisResults analysis={analysis.data} />
            ) : primary ? (
                <RetryAnalysisButton resumeId={primary.id} />
            ) : null}
        </main>
    );
}
