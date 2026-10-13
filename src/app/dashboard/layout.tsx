import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { demoTenant, getCurrentTenant } from "@/lib/tenant";

export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { tenant, isDemo } = await getCurrentTenant();
  const company = tenant?.name || demoTenant().name;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <DashboardSidebar company={company} isDemo={isDemo || !tenant} />
      <div className="flex-1 bg-[var(--rf-bg)]">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
