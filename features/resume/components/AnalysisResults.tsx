import type { ResumeAnalysis } from "../analyze";

export function AnalysisResults({ analysis }: { analysis: ResumeAnalysis }) {
    return (
        <div className="mt-8 space-y-6">
            <div className="rounded-xl border p-6">
                <div className="flex items-baseline justify-between">
                    <h2 className="text-lg font-semibold">Overall score</h2>
                    <span className="text-3xl font-bold">{analysis.overallScore}<span className="text-base font-normal text-gray-400">/100</span></span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{analysis.summary}</p>
            </div>

            {analysis.missingSections.length > 0 && (
                <div className="rounded-xl border p-6">
                    <h2 className="text-lg font-semibold">Missing from your resume</h2>
                    <ul className="mt-3 space-y-2">
                        {analysis.missingSections.map((item, i) => (
                            <li key={i} className="flex gap-3 text-sm text-amber-700">
                                <span aria-hidden>⚠</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {analysis.sections.map((section) => (
                <div key={section.id} className="rounded-xl border p-6">
                    <div className="flex items-baseline justify-between">
                        <h3 className="font-semibold">{section.title}</h3>
                        <span className="text-sm text-gray-500">{section.score}/100</span>
                    </div>
                    {section.strengths.length > 0 && (
                        <ul className="mt-3 space-y-1">
                            {section.strengths.map((s, i) => (
                                <li key={i} className="text-sm text-green-700">✓ {s}</li>
                            ))}
                        </ul>
                    )}
                    {section.improvements.length > 0 && (
                        <ul className="mt-2 space-y-3">
                            {section.improvements.map((improvement, i) => (
                                <li key={i} className="text-sm">
                                    <p className="text-amber-700">→ {improvement.issue}</p>
                                    {improvement.suggestedRewrite && (
                                        <p className="mt-1 rounded-md bg-gray-50 p-2 text-gray-700">
                                            <span className="font-medium text-gray-500">Try: </span>
                                            {improvement.suggestedRewrite}
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
        </div>
    );
}
