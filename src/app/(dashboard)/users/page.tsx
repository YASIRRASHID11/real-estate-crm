"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import Header from "@/components/layout/header";
import DataTable from "@/components/shared/data-table";
import Badge from "@/components/shared/badge";
import { Plus, X, Loader2, Search } from "lucide-react";
import { formatDate, getInitials, cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/constants";
import { toast } from "sonner";
import type { UserWithStats } from "@/types";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  role: z.enum(["SUPER_ADMIN","ADMIN","SALES_MANAGER","AGENT","ACCOUNTANT"]).default("AGENT"),
});
type FormData = z.infer<typeof schema>;

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-800",
  ADMIN: "bg-purple-100 text-purple-800",
  SALES_MANAGER: "bg-blue-100 text-blue-800",
  AGENT: "bg-green-100 text-green-800",
  ACCOUNTANT: "bg-yellow-100 text-yellow-800",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) as any });

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/users?${params}`);
    const json = await res.json();
    if (json.success) { setUsers(json.data.data); setPagination(json.data.pagination); }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const onSubmit = async (data: FormData) => {
    setFormLoading(true);
    const res = await fetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.success) { toast.success("User added"); setShowForm(false); reset(); fetchUsers(); }
    else toast.error(json.message || "Failed");
    setFormLoading(false);
  };

  const columns = [
    {
      header: "User", cell: (r: UserWithStats) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {getInitials(r.name)}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{r.name}</p>
            <p className="text-xs text-slate-500">{r.email}</p>
          </div>
        </div>
      )
    },
    { header: "Role", cell: (r: UserWithStats) => <Badge label={ROLE_LABELS[r.role]} className={ROLE_COLORS[r.role]} /> },
    { header: "Status", cell: (r: UserWithStats) => <span className={cn("text-xs font-medium", r.status === "ACTIVE" ? "text-green-600" : "text-red-500")}>{r.status}</span> },
    { header: "Leads", cell: (r: UserWithStats) => <span className="text-sm font-semibold text-slate-700">{r._count?.assignedLeads ?? 0}</span> },
    { header: "Deals", cell: (r: UserWithStats) => <span className="text-sm font-semibold text-slate-700">{r._count?.assignedDeals ?? 0}</span> },
    { header: "Last Login", cell: (r: UserWithStats) => <span className="text-sm text-slate-500">{r.lastLogin ? formatDate(r.lastLogin) : "Never"}</span> },
    { header: "Joined", cell: (r: UserWithStats) => <span className="text-sm text-slate-500">{formatDate(r.createdAt)}</span> },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <Header title="User Management" subtitle={`${pagination.total} users`} action={
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition">
          <Plus size={16} /> Add User
        </button>
      } />

      <main className="flex-1 p-4 lg:p-6 space-y-4 overflow-auto">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 max-w-sm">
          <Search size={16} className="text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="bg-transparent text-sm outline-none flex-1" />
        </div>

        <DataTable columns={columns as never} data={users as never} loading={loading}
          pagination={{ page: pagination.page, totalPages: pagination.totalPages, total: pagination.total, limit: pagination.limit, onPageChange: fetchUsers }}
          emptyMessage="No users found." />
      </main>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Add User</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit as never)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input {...register("name")} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input {...register("email")} type="email" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input {...register("phone")} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                <select {...register("role")} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                <input {...register("password")} type="password" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={formLoading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm flex items-center justify-center gap-2">
                  {formLoading && <Loader2 size={16} className="animate-spin" />} Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
