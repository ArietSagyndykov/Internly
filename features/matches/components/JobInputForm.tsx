"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { analyzeJob } from "../actions";

type ResumeOption = {
    id: string;
    label: string;
    isPrimary: boolean;
};

export function JobInputForm({ resumeOptions }: { resumeOptions: ResumeOption[] }) {
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const primary = resumeOptions.find((r) => r.isPrimary) ?? resumeOptions[0];

    function handleSubmit(formData: FormData) {
        setError(null);
        startTransition(async () => {
            const result = await analyzeJob(formData);
            if ("error" in result) setError(result.error);
            else router.push(`/matches/${result.matchId}`);
        });
    }

    return (
        <form action={handleSubmit} className="mt-6 rounded-xl border p-6">
            <div className="flex gap-3">
                <input
                    type="text"
                    name="title"
                    placeholder="Job title (optional)"
                    className="w-1/2 rounded-lg border px-3 py-2 text-sm"
                />
                <input
                    type="text"
                    name="company"
                    placeholder="Company (optional)"
                    className="w-1/2 rounded-lg border px-3 py-2 text-sm"
                />
            </div>
            <textarea
                name="description"
                required
                rows={10}
                placeholder="Paste the job description here…"
                className="mt-3 w-full rounded-lg border px-3 py-2 text-sm"
            />
            <div className="mt-3 flex items-center gap-3">
                <label htmlFor="match-resume" className="text-sm text-gray-600">
                    Match against
                </label>
                <select
                    id="match-resume"
                    name="resumeId"
                    defaultValue={primary?.id}
                    className="rounded-lg border px-3 py-2 text-sm"
                >
                    {resumeOptions.map((r) => (
                        <option key={r.id} value={r.id}>
                            {r.label}
                            {r.isPrimary ? " (primary)" : ""}
                        </option>
                    ))}
                </select>
                <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                    {isPending ? "Analyzing… (~20s)" : "Analyze match"}
                </button>
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </form>
    );
}
