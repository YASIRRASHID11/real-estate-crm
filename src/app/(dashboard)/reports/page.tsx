"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/header";
import { formatCurrency } from "@/lib/utils";
import { LEAD_STATUS_LABELS } from "@/constants";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { Download, TrendingUp, Users, Handshake, IndianRupee } from "lucide-react";

interface AgentPerf { agentName: string; leads: number; deals: number; revenue: number }
interface ConversionData { status: string; count: number; percentage: number }
interface RevenueData { month: string; revenue: number; deals: number }

const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#ec4899","#6b7280"];

export default function ReportsPage() {
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [conversion, setConversion] = useState<ConversionData[]>([]);
  const [agentPerf, setAgentPerf] = useState<AgentPerf[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("revenue");

  useEffect(() => {
    Promise.all([
      fetch("/api/reports?type=revenue").then((r) => r.json()),
      fetch("/api/reports?type=lead_conversion").then((r) => r.json()),
      fetch("/api/reports?type=agent_performance").then((r) => r.json()),
    ]).then(([r, c, a]) => {
      if (r.success) setRevenue(r.data);
      if (c.success) setConversion(c.data);
      if (a.success) setAgentPerf(a.data);
    }).finally(() => setLoading(false));
  }, []);

  const totalRevenue = revenue.reduce((sum, r) => sum + r.revenue, 0);
  const totalDeals = revenue.reduce((sum, r) => sum + r.deals, 0);

  const tabs = ["revenue", "conversion", "agents"];

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Reports & Analytics" subtitle="Business performance insights" action={
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition">
          <Download size={16} /> Export
        </button>
      } />

      <main className="flex-1 p-4 lg:p-6 space-y-6 overflow-auto">
        {/* KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue (6M)", value: formatCurrency(totalRevenue), icon: IndianRupee, color: "bg-blue-600" },
            { label: "Deals Closed (6M)", value: totalDeals, icon: Handshake, color: "bg-green-600" },
            { label: "Avg Deal Size", value: totalDeals > 0 ? formatCurrency(totalRevenue / totalDeals) : "—", icon: TrendingUp, color: "bg-purple-600" },
            { label: "Active Agents", value: agentPerf.length, icon: Users, color: "bg-orange-600" },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className={`${item.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                <item.icon size={20} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{item.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {tabs.map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${activeTab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t === "conversion" ? "Lead Pipeline" : t === "agents" ? "Agent Performance" : "Revenue"}
            </button>
          ))}
        </div>

        {activeTab === "revenue" && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Revenue & Deals — Last 6 Months</h3>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={revenue}>
                <defs>
                  <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v, name) => [name === "revenue" ? formatCurrency(v as number) : v, name === "revenue" ? "Revenue" : "Deals"]} />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#gr)" />
                <Bar yAxisId="right" dataKey="deals" fill="#10b981" radius={[4, 4, 0, 0]} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === "conversion" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Lead Status Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={conversion.filter((c) => c.count > 0)} cx="50%" cy="50%" outerRadius={100} dataKey="count" nameKey="status" labelLine={false}>
                    {conversion.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, name) => [v, (name as string).replace(/_/g, " ")]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Lead Funnel</h3>
              <div className="space-y-3">
                {conversion.map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{LEAD_STATUS_LABELS[item.status] || item.status}</span>
                      <span className="font-semibold text-slate-800">{item.count} ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${item.percentage}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "agents" && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Agent Performance</h3>
            {agentPerf.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No agent data yet</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={agentPerf}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="agentName" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="leads" fill="#3b82f6" radius={[4,4,0,0]} name="Leads" />
                    <Bar dataKey="deals" fill="#10b981" radius={[4,4,0,0]} name="Deals" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-slate-500 border-b border-slate-100">
                      {["Agent","Leads","Deals","Revenue","Commission (2%)"].map((h) => <th key={h} className="pb-2 font-medium">{h}</th>)}
                    </tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {agentPerf.map((a, i) => (
                        <tr key={i}>
                          <td className="py-2 font-medium text-slate-900">{a.agentName}</td>
                          <td className="py-2 text-slate-600">{a.leads}</td>
                          <td className="py-2 text-slate-600">{a.deals}</td>
                          <td className="py-2 text-slate-900 font-semibold">{formatCurrency(a.revenue)}</td>
                          <td className="py-2 text-green-600 font-medium">{formatCurrency(a.revenue * 0.02)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
