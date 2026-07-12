import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    return (
        <main className="p-10">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="mt-2 text-gray-500">
                Signed in as {user.user_metadata.user_name}
            </p>
        </main>
    );
}