import Link from "next/link";

const NAV_ITEMS = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/resume", label: "Resumes" },
    { href: "/matches", label: "Matches" },
    { href: "/insights", label: "Insights" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <nav className="flex gap-4 border-b px-10 py-4 text-sm">
                {NAV_ITEMS.map((item) => (
                    <Link key={item.href} href={item.href} className="hover:underline">
                        {item.label}
                    </Link>
                ))}
            </nav>
            {children}
        </>
    );
}
