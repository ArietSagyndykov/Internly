"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
    const signInWithGithub = async () => {
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    return (
        <main className="flex min-h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-6 rounded-xl border p-10">
                <h1 className="text-2xl font-semibold">Internly</h1>
                <p className="text-sm text-gray-500">
                    Land your tech internship
                </p>
                <button
                    onClick={signInWithGithub}
                    className="rounded-lg bg-black px-6 py-2.5 text-sm text-white hover:bg-gray-800"
                >
                    Continue with GitHub
                </button>
            </div>
        </main>
    );
}
