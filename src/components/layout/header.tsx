"use client";

import { Menu, Bell, Search, Plus } from "lucide-react";
import { useUIStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { getInitials } from "@/lib/utils";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function Header({ title, subtitle, action }: HeaderProps) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-200 h-16 flex items-center px-4 lg:px-6 gap-4">
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-slate-900 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
      </div>

      <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-64">
        <Search size={16} className="text-slate-400 flex-shrink-0" />
        <input
          placeholder="Search..."
          className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none flex-1"
        />
      </div>

      <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition">
        <Bell size={20} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
      </button>

      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
        {user?.name ? getInitials(user.name) : "U"}
      </div>

      {action && <div className="flex-shrink-0">{action}</div>}
    </header>
  );
}
