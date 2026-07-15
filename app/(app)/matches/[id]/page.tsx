import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMatch } from "@/features/matches/queries";
import { MatchAnalysisSchema } from "@/features/matches/schema";
import { MatchResultCard } from "@/features/matches/components/MatchResultCard";

export default async function MatchPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { id } = await params;
    const match = await getMatch(user.id, id);
    if (!match) notFound();

    const analysis = MatchAnalysisSchema.safeParse(match.analysis);

    return (
        <main className="p-10">
            <Link href="/matches" className="text-sm text-gray-500 underline">
                ← All matches
            </Link>

            {analysis.success ? (
                <MatchResultCard
                    analysis={analysis.data}
                    jobTitle={match.jobTitle}
                    company={match.company}
                    resumeLabel={match.resumeLabel}
                    createdAt={match.createdAt}
                />
            ) : (
                <p className="mt-6 text-sm text-red-600">
                    This match was stored in an unreadable format. Try analyzing the job again.
                </p>
            )}
        </main>
    );
}
