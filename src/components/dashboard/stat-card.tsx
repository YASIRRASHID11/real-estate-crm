import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: "blue" | "green" | "orange" | "red" | "purple" | "teal";
}

const colorMap = {
  blue: { bg: "bg-blue-50", icon: "bg-blue-600", text: "text-blue-600" },
  green: { bg: "bg-green-50", icon: "bg-green-600", text: "text-green-600" },
  orange: { bg: "bg-orange-50", icon: "bg-orange-600", text: "text-orange-600" },
  red: { bg: "bg-red-50", icon: "bg-red-600", text: "text-red-600" },
  purple: { bg: "bg-purple-50", icon: "bg-purple-600", text: "text-purple-600" },
  teal: { bg: "bg-teal-50", icon: "bg-teal-600", text: "text-teal-600" },
};

export default function StatCard({ title, value, subtitle, icon: Icon, trend, color = "blue" }: StatCardProps) {
  const colors = colorMap[color];
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", colors.icon)}>
          <Icon size={22} className="text-white" />
        </div>
        {trend && (
          <span className={cn("text-xs font-semibold px-2 py-1 rounded-full", trend.value >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
            {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm font-medium text-slate-600 mt-0.5">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
