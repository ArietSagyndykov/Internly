import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listResumes } from "@/features/resume/queries";
import { listMatches } from "@/features/matches/queries";
import { JobInputForm } from "@/features/matches/components/JobInputForm";

export default async function MatchesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const [resumeOptions, matchList] = await Promise.all([
        listResumes(user.id),
        listMatches(user.id),
    ]);

    return (
        <main className="p-10">
            <h1 className="text-2xl font-semibold">Job matching</h1>

            {resumeOptions.length === 0 ? (
                <p className="mt-6 text-sm text-gray-600">
                    You need a resume first —{" "}
                    <Link href="/resume" className="underline">
                        upload one on the Resume page
                    </Link>
                    , then come back to match it against job postings.
                </p>
            ) : (
                <JobInputForm resumeOptions={resumeOptions} />
            )}

            {matchList.length > 0 && (
                <div className="mt-8 rounded-xl border p-6">
                    <h2 className="text-lg font-semibold">Past matches</h2>
                    <ul className="mt-3 divide-y">
                        {matchList.map((m) => (
                            <li key={m.id}>
                                <Link
                                    href={`/matches/${m.id}`}
                                    className="flex items-center justify-between py-2 text-sm hover:bg-gray-50"
                                >
                                    <span>
                                        {m.jobTitle}
                                        {m.company && (
                                            <span className="text-gray-500"> @ {m.company}</span>
                                        )}
                                        <span className="ml-2 text-xs text-gray-400">
                                            vs {m.resumeLabel} · {m.createdAt.toLocaleDateString()}
                                        </span>
                                    </span>
                                    <span className="font-semibold">{m.score}/100</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </main>
    );
}
