"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Header from "@/components/layout/header";
import DataTable from "@/components/shared/data-table";
import Badge from "@/components/shared/badge";
import { Plus, X, Loader2, CheckCircle2, ChevronDown } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { DEAL_STATUS_COLORS, DEAL_STATUS_LABELS } from "@/constants";
import { toast } from "sonner";
import { createDealSchema, type CreateDealInput } from "@/validations/deal";
import type { DealWithRelations } from "@/types";

export default function DealsPage() {
  const [deals, setDeals] = useState<DealWithRelations[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [closingId, setClosingId] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState<DealWithRelations | null>(null);
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CreateDealInput>({
    resolver: zodResolver(createDealSchema) as never,
    defaultValues: { commissionRate: 2 },
  });

  const finalAmount = watch("finalAmount") || 0;
  const commissionRate = watch("commissionRate") || 2;

  const fetchDeals = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/deals?${params}`);
    const json = await res.json();
    if (json.success) { setDeals(json.data.data); setPagination(json.data.pagination); }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  const onSubmit = async (data: CreateDealInput) => {
    setFormLoading(true);
    const res = await fetch("/api/deals", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.success) { toast.success("Deal created"); setShowForm(false); reset(); fetchDeals(); }
    else toast.error(json.message || "Failed");
    setFormLoading(false);
  };

  const updateStatus = async (dealId: string, status: string) => {
    setClosingId(dealId);
    setStatusMenuId(null);
    const res = await fetch(`/api/deals/${dealId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success(status === "CLOSED" ? "Deal marked as closed!" : `Status updated to ${DEAL_STATUS_LABELS[status]}`);
      fetchDeals();
    } else toast.error(json.message || "Failed to update");
    setClosingId(null);
    setConfirmClose(null);
  };

  const columns = [
    {
      header: "Deal",
      cell: (r: DealWithRelations) => (
        <div>
          <p className="font-semibold text-slate-900">{r.title}</p>
          <p className="text-xs text-slate-500">{r.lead?.fullName || r.customer?.name || "—"}</p>
        </div>
      ),
    },
    { header: "Property", cell: (r: DealWithRelations) => <span className="text-sm text-slate-600">{r.property?.title || "—"}</span> },
    { header: "Amount", cell: (r: DealWithRelations) => <span className="font-semibold text-slate-900">{formatCurrency(r.finalAmount)}</span> },
    { header: "Commission", cell: (r: DealWithRelations) => <span className="text-sm text-green-600 font-medium">{r.commissionAmount ? formatCurrency(r.commissionAmount) : "—"}</span> },
    {
      header: "Status",
      cell: (r: DealWithRelations) => (
        <div className="relative">
          <button
            onClick={() => setStatusMenuId(statusMenuId === r.id ? null : r.id)}
            className="flex items-center gap-1.5 group"
          >
            <Badge label={DEAL_STATUS_LABELS[r.status] || r.status} className={DEAL_STATUS_COLORS[r.status]} />
            {r.status !== "CLOSED" && r.status !== "CANCELLED" && (
              <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600" />
            )}
          </button>

          {/* Status dropdown */}
          {statusMenuId === r.id && (
            <div className="absolute left-0 top-8 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[180px]">
              {Object.entries(DEAL_STATUS_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    if (key === "CLOSED") {
                      setConfirmClose(r);
                      setStatusMenuId(null);
                    } else {
                      updateStatus(r.id, key);
                    }
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 ${r.status === key ? "font-semibold text-blue-600" : "text-slate-700"}`}
                >
                  {key === "CLOSED" && <CheckCircle2 size={14} className="text-green-600" />}
                  {label}
                  {r.status === key && <span className="ml-auto text-blue-400">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      ),
    },
    { header: "Agent", cell: (r: DealWithRelations) => <span className="text-sm text-slate-600">{r.agent?.name || "—"}</span> },
    {
      header: "Closed On",
      cell: (r: DealWithRelations) => (
        <span className="text-sm text-slate-500">{r.closedAt ? formatDate(r.closedAt) : "—"}</span>
      ),
    },
    {
      header: "Action",
      cell: (r: DealWithRelations) => {
        if (r.status === "CLOSED") {
          return <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 size={14} />Closed</span>;
        }
        if (r.status === "CANCELLED") {
          return <span className="text-xs text-slate-400">Cancelled</span>;
        }
        return (
          <button
            onClick={() => setConfirmClose(r)}
            disabled={closingId === r.id}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-xs font-semibold rounded-lg transition"
          >
            {closingId === r.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            Mark Closed
          </button>
        );
      },
    },
  ];

  const statusCounts = Object.fromEntries(
    ["INITIATED","BOOKING","AGREEMENT","PAYMENT_PENDING","CLOSED","CANCELLED"].map((s) => [s, deals.filter((d) => d.status === s).length])
  );

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Deals"
        subtitle={`${pagination.total} total deals`}
        action={
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition">
            <Plus size={16} /> New Deal
          </button>
        }
      />

      {/* Click outside to close status menu */}
      {statusMenuId && <div className="fixed inset-0 z-10" onClick={() => setStatusMenuId(null)} />}

      <main className="flex-1 p-4 lg:p-6 space-y-4 overflow-auto">
        {/* Pipeline cards */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {Object.entries(DEAL_STATUS_LABELS).map(([k, v]) => (
            <button key={k} onClick={() => setStatusFilter(statusFilter === k ? "" : k)}
              className={`p-3 rounded-xl border text-center transition ${statusFilter === k ? "border-blue-300 bg-blue-50" : "bg-white border-slate-100 hover:border-blue-200"}`}>
              <p className="text-2xl font-bold text-slate-900">{statusCounts[k] || 0}</p>
              <p className="text-xs text-slate-500 mt-0.5">{v}</p>
            </button>
          ))}
        </div>

        <DataTable
          columns={columns as never}
          data={deals as never}
          loading={loading}
          pagination={{ page: pagination.page, totalPages: pagination.totalPages, total: pagination.total, limit: pagination.limit, onPageChange: fetchDeals }}
          emptyMessage="No deals yet."
        />
      </main>

      {/* Confirm Close Modal */}
      {confirmClose && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-center w-14 h-14 bg-green-100 rounded-2xl mx-auto mb-4">
              <CheckCircle2 size={28} className="text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center">Mark Deal as Closed?</h3>
            <p className="text-slate-500 text-sm text-center mt-2 mb-1">
              <span className="font-semibold text-slate-700">{confirmClose.title}</span>
            </p>
            <p className="text-slate-400 text-xs text-center mb-6">
              Amount: {formatCurrency(confirmClose.finalAmount)} · Commission: {formatCurrency(confirmClose.commissionAmount || 0)}
            </p>
            <p className="text-slate-500 text-sm text-center mb-6">
              This will record today as the closing date and mark the deal as <span className="font-semibold text-green-600">CLOSED</span>. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmClose(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => updateStatus(confirmClose.id, "CLOSED")}
                disabled={closingId === confirmClose.id}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition"
              >
                {closingId === confirmClose.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Yes, Close Deal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Deal Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Create Deal</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit as never)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deal Title *</label>
                <input {...register("title")} placeholder="e.g. 3BHK Bandra Deal" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Final Amount (₹) *</label>
                  <input {...register("finalAmount", { valueAsNumber: true })} type="number" placeholder="5000000" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {errors.finalAmount && <p className="text-red-500 text-xs mt-1">{errors.finalAmount.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Booking Amount (₹)</label>
                  <input {...register("bookingAmount", { valueAsNumber: true })} type="number" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Commission Rate (%)</label>
                  <input {...register("commissionRate", { valueAsNumber: true })} type="number" step="0.1" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Commission Amount</label>
                  <div className="px-3 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-sm text-green-600 font-semibold">
                    {formatCurrency((finalAmount * commissionRate) / 100)}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select {...register("status")} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.entries(DEAL_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea {...register("notes")} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={formLoading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm flex items-center justify-center gap-2">
                  {formLoading && <Loader2 size={16} className="animate-spin" />} Create Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
