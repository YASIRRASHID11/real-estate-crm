"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/layout/header";
import StatCard from "@/components/dashboard/stat-card";
import {
  Users, Building2, Handshake, IndianRupee,
  UserPlus, Clock, TrendingUp, CheckCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell, Legend,
} from "recharts";

type Mode = "today" | "weekday" | "monthly" | "yearly";

interface DashboardStats {
  newLeads: number; newCustomers: number; closedDeals: number; revenue: number;
  activeDeals: number; totalLeads: number; totalProperties: number;
  pendingFollowUps: number; overdueTask: number;
}

const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#ec4899","#6b7280"];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const YEARS  = Array.from({ length: 25 }, (_, i) => 2026 + i);
const WEEKDAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

// Returns the date of a given weekday (0=Mon … 6=Sun) in the current week
function getWeekdayDate(dayIndex: number): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun,1=Mon…
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setDate(monday.getDate() + dayIndex);
  return monday;
}

export default function DashboardPage() {
  const now = new Date();
  const [mode, setMode] = useState<Mode>("monthly");
  const [selectedWeekday, setSelectedWeekday] = useState<number>(now.getDay() === 0 ? 6 : now.getDay() - 1); // 0=Mon
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<{ label: string; revenue: number; deals: number }[]>([]);
  const [conversionData, setConversionData] = useState<{ status: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const buildParams = useCallback(() => {
    if (mode === "today")   return `period=daily`;
    if (mode === "weekday") {
      const d = getWeekdayDate(selectedWeekday);
      return `period=daily&date=${d.toISOString().split("T")[0]}`;
    }
    if (mode === "monthly") return `period=monthly&month=${selectedMonth}&year=${selectedYear}`;
    return `period=yearly&year=${selectedYear}`;
  }, [mode, selectedWeekday, selectedMonth, selectedYear]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildParams();
      const [sRes, rRes, cRes] = await Promise.all([
        fetch(`/api/reports?type=dashboard&${params}`),
        fetch(`/api/reports?type=revenue&${params}`),
        fetch(`/api/reports?type=lead_conversion`),
      ]);
      const [s, r, c] = await Promise.all([sRes.json(), rRes.json(), cRes.json()]);
      if (s.success) setStats(s.data);
      if (r.success) setRevenueData(r.data);
      if (c.success) setConversionData(c.data.filter((d: { count: number }) => d.count > 0));
    } catch {}
    setLoading(false);
  }, [buildParams]);

  useEffect(() => { load(); }, [load]);

  // Label shown in the badge
  const activeLabel =
    mode === "today"   ? "Today" :
    mode === "weekday" ? `${WEEKDAYS[selectedWeekday]} (this week)` :
    mode === "monthly" ? `${MONTHS[selectedMonth - 1]} ${selectedYear}` :
    `Year ${selectedYear}`;

  const chartSubtitle =
    mode === "today" || mode === "weekday" ? "Last 14 days" :
    mode === "monthly" ? `Daily — ${MONTHS[selectedMonth - 1]} ${selectedYear}` :
    `Monthly — ${selectedYear}`;

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Dashboard" subtitle="Track your real estate business performance" />

      <main className="flex-1 p-4 lg:p-6 space-y-6 overflow-auto">

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Today button */}
          <button
            onClick={() => setMode("today")}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition ${
              mode === "today"
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            Today
          </button>

          {/* Weekday dropdown */}
          <select
            value={selectedWeekday}
            onChange={(e) => {
              setSelectedWeekday(Number(e.target.value));
              setMode("weekday");
            }}
            className="px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:border-blue-300 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {WEEKDAYS.map((day, i) => (
              <option key={i} value={i}>{day}</option>
            ))}
          </select>

          {/* Month dropdown */}
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(Number(e.target.value));
              setMode("monthly");
            }}
            className="px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:border-blue-300 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MONTHS.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>

          {/* Year dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(Number(e.target.value));
              if (mode === "today" || mode === "weekday") setMode("yearly");
            }}
            className="px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:border-blue-300 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

        </div>

        {/* KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse">
                <div className="w-11 h-11 bg-slate-200 rounded-xl mb-4" />
                <div className="h-7 bg-slate-200 rounded w-16 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-24" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="New Leads"       value={stats?.newLeads ?? 0}                icon={Users}       color="blue"   />
            <StatCard title="New Customers"   value={stats?.newCustomers ?? 0}            icon={UserPlus}    color="green"  />
            <StatCard title="Deals Closed"    value={stats?.closedDeals ?? 0}             icon={CheckCircle} color="teal"   />
            <StatCard title="Revenue"         value={formatCurrency(stats?.revenue ?? 0)} icon={IndianRupee} color="purple" />
            <StatCard title="Active Deals"    value={stats?.activeDeals ?? 0}             icon={Handshake}   color="orange" />
            <StatCard title="Total Leads"     value={stats?.totalLeads ?? 0}              icon={TrendingUp}  color="blue"   />
            <StatCard title="Total Properties" value={stats?.totalProperties ?? 0}        icon={Building2}   color="green"  />
            <StatCard title="Follow-ups Due"  value={stats?.pendingFollowUps ?? 0}        icon={Clock}       color="red"    />
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900">Revenue Trend</h3>
                <p className="text-sm text-slate-500">{chartSubtitle}</p>
              </div>
              <TrendingUp size={20} className="text-blue-600" />
            </div>
            {loading ? (
              <div className="h-[220px] bg-slate-50 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 100000 ? `₹${(v/100000).toFixed(0)}L` : `₹${v}`} />
                  <Tooltip formatter={(v) => [formatCurrency(Number(v)), "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="mb-4">
              <h3 className="font-semibold text-slate-900">Lead Pipeline</h3>
              <p className="text-sm text-slate-500">Overall status distribution</p>
            </div>
            {loading ? (
              <div className="h-[220px] bg-slate-50 rounded-xl animate-pulse" />
            ) : conversionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={conversionData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="count" nameKey="status" paddingAngle={2}>
                    {conversionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend formatter={(v) => v.replace(/_/g, " ")} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No lead data yet</div>
            )}
          </div>
        </div>

        {/* Deals Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-900">Deals Closed</h3>
            <p className="text-sm text-slate-500">{chartSubtitle}</p>
          </div>
          {loading ? (
            <div className="h-[200px] bg-slate-50 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueData} barSize={mode === "monthly" ? 10 : 28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={mode === "monthly" ? 2 : 0} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="deals" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Add Lead",     href: "/leads",      color: "bg-blue-600" },
            { label: "Add Property", href: "/properties", color: "bg-green-600" },
            { label: "Add Deal",     href: "/deals",      color: "bg-orange-600" },
            { label: "View Reports", href: "/reports",    color: "bg-purple-600" },
          ].map((item) => (
            <a key={item.label} href={item.href} className={`${item.color} text-white rounded-xl p-4 text-center font-medium text-sm hover:opacity-90 transition`}>
              {item.label}
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
