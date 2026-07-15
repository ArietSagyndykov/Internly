import Link from "next/link";
import type { GapInsight } from "../insights";

export function GapInsightsList({
    insights,
    totalJobs,
}: {
    insights: GapInsight[];
    totalJobs: number;
}) {
    return (
        <div>
            <h1 className="text-2xl font-semibold">
                Your gaps across {totalJobs} analyzed {totalJobs === 1 ? "job" : "jobs"}
            </h1>

            {totalJobs < 3 ? (
                <p className="mt-6 text-sm text-gray-600">
                    This view becomes useful after you analyze at least three jobs. You have{" "}
                    {totalJobs} so far.{" "}
                    <Link href="/matches" className="underline">
                        Analyze another job
                    </Link>
                    .
                </p>
            ) : insights.length === 0 ? (
                <p className="mt-6 text-sm text-gray-600">
                    No gaps were found in your analyzed jobs.
                </p>
            ) : (
                <ol className="mt-6 space-y-3">
                    {insights.map((insight, index) => (
                        <li key={insight.normalizedName} className="rounded-xl border p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="font-semibold">
                                        {index + 1}. {insight.displayName}
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Appears in {insight.jobCount} of {totalJobs} jobs
                                    </p>
                                </div>
                                <div className="flex flex-wrap justify-end gap-2 text-xs">
                                    {insight.severityBreakdown.critical > 0 && (
                                        <span className="rounded bg-red-100 px-2 py-1 text-red-700">
                                            critical in {insight.severityBreakdown.critical}
                                        </span>
                                    )}
                                    {insight.severityBreakdown.moderate > 0 && (
                                        <span className="rounded bg-orange-100 px-2 py-1 text-orange-700">
                                            moderate in {insight.severityBreakdown.moderate}
                                        </span>
                                    )}
                                    {insight.severityBreakdown.minor > 0 && (
                                        <span className="rounded bg-amber-100 px-2 py-1 text-amber-700">
                                            minor in {insight.severityBreakdown.minor}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {insight.sampleSuggestion && (
                                <p className="mt-3 text-sm text-gray-500">
                                    {insight.sampleSuggestion}
                                </p>
                            )}
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}
