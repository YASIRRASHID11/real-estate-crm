"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import {
  LayoutDashboard, Users, Building2, UserCheck,
  Handshake, CheckSquare, BarChart3, Settings,
  FileText, X, ChevronLeft, LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/customers", label: "Customers", icon: UserCheck },
  { href: "/deals", label: "Deals", icon: Handshake },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/users", label: "Users", icon: Users, adminOnly: true },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { user, clearUser } = useAuthStore();

  const isAdmin = user?.role && ["SUPER_ADMIN", "ADMIN"].includes(user.role);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    clearUser();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const filteredNav = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full z-30 flex flex-col bg-slate-900 transition-all duration-300",
          sidebarOpen ? "w-64" : "w-0 lg:w-16",
          "overflow-hidden"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 flex-shrink-0">
          {sidebarOpen && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-white font-bold text-lg">ETSCRM</span>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition ml-auto"
          >
            {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronLeft size={20} className="rotate-180" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-hide">
          {filteredNav.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-slate-800 flex-shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                <p className="text-slate-400 text-xs truncate">{user?.role?.replace(/_/g, " ")}</p>
              </div>
              <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 p-1 rounded transition">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="flex items-center justify-center w-full p-2 text-slate-400 hover:text-red-400 rounded-xl hover:bg-slate-800 transition" title="Logout">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
