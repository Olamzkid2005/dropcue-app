import Link from "next/link";
import Image from "next/image";
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
        <Link href="/dashboard" aria-label="Dropcue dashboard" className="block h-10 w-[160px] rounded-md overflow-visible">
          <Image
            src="/logo.png"
            alt="Dropcue"
            width={1024}
            height={1024}
            priority
            className="h-full w-full object-cover object-center scale-[1.35]"
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
