"use client";

import { useState, useTransition } from "react";
import { retryAnalysis } from "../actions";

export function RetryAnalysisButton({ resumeId }: { resumeId: string }) {
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleClick() {
        setError(null);
        startTransition(async () => {
            const result = await retryAnalysis(resumeId);
            if ("error" in result) setError(result.error);
        });
    }

    return (
        <div className="mt-4">
            <button
                onClick={handleClick}
                disabled={isPending}
                className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
                {isPending ? "Analyzing…" : "Retry analysis"}
            </button>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
    );
}
