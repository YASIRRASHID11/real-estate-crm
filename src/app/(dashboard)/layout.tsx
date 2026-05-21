"use client";

import Sidebar from "@/components/layout/sidebar";
import { useUIStore } from "@/store/ui.store";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <div className="flex h-full min-h-screen bg-slate-50">
      <Sidebar />
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          sidebarOpen ? "lg:ml-64" : "lg:ml-16"
        )}
      >
        {children}
      </div>
    </div>
  );
}
