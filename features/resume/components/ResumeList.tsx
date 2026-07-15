"use client";

import { useState, useTransition } from "react";
import { setPrimaryResume } from "../actions";

type ResumeListItem = {
    id: string;
    label: string;
    isPrimary: boolean;
    createdAt: string; // serialized for the client boundary
};

export function ResumeList({ items }: { items: ResumeListItem[] }) {
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleSetPrimary(id: string) {
        setError(null);
        startTransition(async () => {
            const result = await setPrimaryResume(id);
            if ("error" in result) setError(result.error);
        });
    }

    if (items.length === 0) return null;

    return (
        <div className="mt-6 rounded-xl border p-6">
            <h2 className="text-lg font-semibold">Resume library</h2>
            <ul className="mt-3 divide-y">
                {items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                        <span>
                            {item.label}
                            <span className="ml-2 text-gray-400">{item.createdAt}</span>
                            {item.isPrimary && (
                                <span className="ml-2 rounded bg-black px-2 py-0.5 text-xs text-white">
                                    primary
                                </span>
                            )}
                        </span>
                        {!item.isPrimary && (
                            <button
                                onClick={() => handleSetPrimary(item.id)}
                                disabled={isPending}
                                className="rounded-lg border px-3 py-1 text-xs font-medium disabled:opacity-50"
                            >
                                Set primary
                            </button>
                        )}
                    </li>
                ))}
            </ul>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
    );
}
