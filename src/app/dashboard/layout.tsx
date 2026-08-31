import Link from "next/link";
import { CreatorSidebar, MobileNav } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper">
      <CreatorSidebar />
      <header className="lg:hidden h-16 px-5 flex items-center border-b border-hairline bg-paper">
        <Link href="/dashboard" aria-label="Dropcue dashboard" className="block h-10 w-[132px] overflow-hidden rounded-md">
          <img
            src="/logo.png"
            alt="Dropcue"
            className="h-full w-full object-cover object-center"
          />
        </Link>
      </header>
      <MobileNav />
      <main className="lg:ml-[260px] min-h-screen pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}
