import type { MatchAnalysis } from "../schema";

const SEVERITY_ORDER = ["critical", "moderate", "minor"] as const;

const SEVERITY_STYLES: Record<(typeof SEVERITY_ORDER)[number], string> = {
    critical: "text-red-700",
    moderate: "text-orange-600",
    minor: "text-amber-600",
};

export function MatchResultCard({
    analysis,
    jobTitle,
    company,
    resumeLabel,
    createdAt,
}: {
    analysis: MatchAnalysis;
    jobTitle: string;
    company: string | null;
    resumeLabel: string;
    createdAt: Date;
}) {
    return (
        <div className="mt-8 space-y-6">
            <div className="rounded-xl border p-6">
                <div className="flex items-baseline justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">
                            {jobTitle}
                            {company && <span className="text-gray-500"> @ {company}</span>}
                        </h2>
                        <p className="mt-1 text-xs text-gray-400">
                            Matched against “{resumeLabel}” on {createdAt.toLocaleDateString()}
                        </p>
                    </div>
                    <span className="text-3xl font-bold">
                        {analysis.score}
                        <span className="text-base font-normal text-gray-400">/100</span>
                    </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{analysis.verdict}</p>
            </div>

            {analysis.matchedRequirements.length > 0 && (
                <div className="rounded-xl border p-6">
                    <h3 className="font-semibold">What you match</h3>
                    <ul className="mt-3 space-y-2">
                        {analysis.matchedRequirements.map((m, i) => (
                            <li key={i} className="text-sm">
                                <p className="text-green-700">✓ {m.requirement}</p>
                                <p className="mt-0.5 pl-5 text-gray-500">{m.evidence}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {analysis.gaps.length > 0 && (
                <div className="rounded-xl border p-6">
                    <h3 className="font-semibold">Gaps</h3>
                    <ul className="mt-3 space-y-3">
                        {SEVERITY_ORDER.flatMap((severity) =>
                            analysis.gaps
                                .filter((g) => g.severity === severity)
                                .map((gap, i) => (
                                    <li key={`${severity}-${i}`} className="text-sm">
                                        <p className={SEVERITY_STYLES[severity]}>
                                            [{severity}] {gap.requirement}
                                        </p>
                                        <p className="mt-0.5 pl-5 text-gray-600">{gap.suggestion}</p>
                                    </li>
                                ))
                        )}
                    </ul>
                </div>
            )}

            {analysis.projectsToEmphasize.length > 0 && (
                <div className="rounded-xl border p-6">
                    <h3 className="font-semibold">Projects to emphasize</h3>
                    <ul className="mt-3 space-y-2">
                        {analysis.projectsToEmphasize.map((p, i) => (
                            <li key={i} className="text-sm">
                                <span className="font-medium">{p.projectName}</span>
                                <span className="text-gray-600"> — {p.reason}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
