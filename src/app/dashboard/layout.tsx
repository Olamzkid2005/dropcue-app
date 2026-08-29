import { CreatorSidebar, MobileNav } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper">
      <CreatorSidebar />
      <MobileNav />
      <main className="lg:ml-[260px] min-h-screen pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}
