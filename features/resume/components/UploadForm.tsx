"use client";

import { useState, useTransition } from "react";
import { uploadResume } from "../actions";

export function UploadForm() {
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleSubmit(formData: FormData) {
        setError(null);
        startTransition(async () => {
            const result = await uploadResume(formData);
            if ("error" in result) setError(result.error);
        });
    }

    return (
        <form action={handleSubmit} className="mt-6 rounded-xl border p-6">
            <label htmlFor="resume-file" className="block text-sm font-medium">
                Upload your resume (PDF, max 5MB)
            </label>
            <div className="mt-3 flex items-center gap-3">
                <input
                    id="resume-file"
                    type="file"
                    name="file"
                    accept="application/pdf"
                    required
                    className="text-sm"
                />
                <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                    {isPending ? "Analyzing…" : "Upload"}
                </button>
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </form>
    );
}
