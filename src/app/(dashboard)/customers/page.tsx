"use client";

import { useEffect, useState, useCallback } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useForm } from "react-hook-form";
import Header from "@/components/layout/header";
import DataTable from "@/components/shared/data-table";
import Badge from "@/components/shared/badge";
import { Plus, Search, X, Loader2, UserCheck, Phone, Mail, Trash2 } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Customer } from "@/types";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().optional(),
  customerType: z.enum(["BUYER","SELLER","INVESTOR","TENANT"]).default("BUYER"),
  budget: z.number().positive().optional(),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const TYPE_COLORS: Record<string, string> = {
  BUYER: "bg-blue-100 text-blue-800",
  SELLER: "bg-green-100 text-green-800",
  INVESTOR: "bg-purple-100 text-purple-800",
  TENANT: "bg-orange-100 text-orange-800",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [typeFilter, setTypeFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) as any });

  const fetchCustomers = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (typeFilter) params.set("customerType", typeFilter);
    const res = await fetch(`/api/customers?${params}`);
    const json = await res.json();
    if (json.success) { setCustomers(json.data.data); setPagination(json.data.pagination); }
    setLoading(false);
  }, [debouncedSearch, typeFilter]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const onSubmit = async (data: FormData) => {
    setFormLoading(true);
    const res = await fetch("/api/customers", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.success) { toast.success("Customer added"); setShowForm(false); reset(); fetchCustomers(); }
    else toast.error(json.message || "Failed");
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/customers/${deleteTarget.id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) { toast.success("Customer deleted"); setDeleteTarget(null); fetchCustomers(); }
    else toast.error(json.message || "Failed to delete");
    setDeleting(false);
  };

  const columns = [
    { header: "Name", cell: (r: Customer) => <div><p className="font-semibold text-slate-900">{r.name}</p><p className="text-xs text-slate-500">{r.city || "—"}</p></div> },
    { header: "Contact", cell: (r: Customer) => <div className="flex items-center gap-2"><Phone size={13} className="text-slate-400" /><span className="text-sm">{r.phone}</span></div> },
    { header: "Type", cell: (r: Customer) => <Badge label={r.customerType} className={TYPE_COLORS[r.customerType]} /> },
    { header: "Email", cell: (r: Customer) => <span className="text-sm text-slate-600">{r.email || "—"}</span> },
    { header: "KYC", cell: (r: Customer) => <span className={cn("text-xs font-medium", r.kycVerified ? "text-green-600" : "text-slate-400")}>{r.kycVerified ? "Verified" : "Pending"}</span> },
    { header: "Added", cell: (r: Customer) => <span className="text-sm text-slate-500">{formatDate(r.createdAt)}</span> },
    { header: "", cell: (r: Customer) => <button onClick={() => setDeleteTarget(r)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={15} /></button> },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Customers" subtitle={`${pagination.total} customers`} action={
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition">
          <Plus size={16} /> Add Customer
        </button>
      } />

      <main className="flex-1 p-4 lg:p-6 space-y-4 overflow-auto">
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1">
            <Search size={16} className="text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." className="bg-transparent text-sm outline-none flex-1" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none">
            <option value="">All Types</option>
            {["BUYER","SELLER","INVESTOR","TENANT"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <DataTable columns={columns as never} data={customers as never} loading={loading}
          pagination={{ page: pagination.page, totalPages: pagination.totalPages, total: pagination.total, limit: pagination.limit, onPageChange: fetchCustomers }}
          emptyMessage="No customers yet. Add your first customer!" />
      </main>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-2xl mx-auto mb-4"><Trash2 size={22} className="text-red-600" /></div>
            <h3 className="text-lg font-bold text-slate-900 text-center">Delete Customer?</h3>
            <p className="text-slate-500 text-sm text-center mt-2 mb-6"><span className="font-semibold text-slate-700">{deleteTarget.name}</span> will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Add Customer</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit as never)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                  <input {...register("name")} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                  <input {...register("phone")} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input {...register("email")} type="email" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input {...register("city")} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select {...register("customerType")} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {["BUYER","SELLER","INVESTOR","TENANT"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Budget (₹)</label>
                  <input {...register("budget", { valueAsNumber: true })} type="number" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <textarea {...register("notes")} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={formLoading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm flex items-center justify-center gap-2">
                  {formLoading && <Loader2 size={16} className="animate-spin" />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
