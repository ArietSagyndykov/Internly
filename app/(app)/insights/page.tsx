import { redirect } from "next/navigation";
import { GapInsightsList } from "@/features/matches/components/GapInsightsList";
import { getGapInsights } from "@/features/matches/insights";
import { listMatches } from "@/features/matches/queries";
import { createClient } from "@/lib/supabase/server";

export default async function InsightsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const [insights, matchList] = await Promise.all([
        getGapInsights(user.id),
        listMatches(user.id),
    ]);

    return (
        <main className="p-10">
            <GapInsightsList insights={insights} totalJobs={matchList.length} />
        </main>
    );
}
