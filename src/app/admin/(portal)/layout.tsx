"use client";

import { AdminSidebar, AdminMobileHeader, SidebarProvider, useSidebar } from "@/components/admin/sidebar";
import { ToastProvider } from "@/components/ui/components";
import { cn } from "@/utils/cn";

function AdminContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div
      className={cn(
        "min-h-screen transition-[margin] duration-200 ease-out",
        "pt-14 lg:pt-0", // Account for mobile header
        collapsed ? "lg:ml-[60px]" : "lg:ml-[240px]",
      )}
    >
      <main className="p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SidebarProvider>
        <AdminSidebar />
        <AdminMobileHeader />
        <AdminContent>{children}</AdminContent>
      </SidebarProvider>
    </ToastProvider>
  );
}
