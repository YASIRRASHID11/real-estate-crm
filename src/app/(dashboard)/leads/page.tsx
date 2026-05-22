"use client";

import { useEffect, useState, useCallback } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import Header from "@/components/layout/header";
import DataTable from "@/components/shared/data-table";
import Badge from "@/components/shared/badge";
import EmptyState from "@/components/shared/empty-state";
import LeadForm from "@/components/leads/lead-form";
import { Plus, Search, Filter, MessageCircle, Phone, Users, Trash2, Loader2 } from "lucide-react";
import { formatDate, formatCurrency, whatsappUrl, cn } from "@/lib/utils";
import { LEAD_STATUS_COLORS, LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS } from "@/constants";
import { toast } from "sonner";
import type { LeadWithRelations } from "@/types";
import type { CreateLeadInput } from "@/validations/lead";

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadWithRelations[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<LeadWithRelations | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLeads = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/leads?${params}`);
      const json = await res.json();
      if (json.success) {
        setLeads(json.data.data);
        setPagination(json.data.pagination);
      }
    } catch {
      toast.error("Failed to load leads");
    }
    setLoading(false);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleCreate = async (data: CreateLeadInput) => {
    setFormLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Lead created successfully");
        setShowForm(false);
        fetchLeads();
      } else {
        toast.error(json.message || "Failed to create lead");
      }
    } catch {
      toast.error("Network error");
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/leads/${deleteTarget.id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) { toast.success("Lead deleted"); setDeleteTarget(null); fetchLeads(); }
    else toast.error(json.message || "Failed to delete");
    setDeleting(false);
  };

  const columns = [
    {
      header: "Lead",
      cell: (row: LeadWithRelations) => (
        <div>
          <p className="font-semibold text-slate-900">{row.fullName}</p>
          <p className="text-xs text-slate-500">{row.city || "—"}</p>
        </div>
      ),
    },
    {
      header: "Contact",
      cell: (row: LeadWithRelations) => (
        <div className="flex items-center gap-2">
          <a href={`tel:${row.phone}`} className="text-slate-600 hover:text-blue-600" onClick={(e) => e.stopPropagation()}>
            <Phone size={14} />
          </a>
          <a href={whatsappUrl(row.phone)} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-green-600" onClick={(e) => e.stopPropagation()}>
            <MessageCircle size={14} />
          </a>
          <span className="text-sm text-slate-600">{row.phone}</span>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (row: LeadWithRelations) => (
        <Badge label={LEAD_STATUS_LABELS[row.status] || row.status} className={LEAD_STATUS_COLORS[row.status]} />
      ),
    },
    {
      header: "Source",
      cell: (row: LeadWithRelations) => (
        <span className="text-sm text-slate-600">{LEAD_SOURCE_LABELS[row.source] || row.source}</span>
      ),
    },
    {
      header: "Budget",
      cell: (row: LeadWithRelations) => (
        <span className="text-sm text-slate-700">
          {row.budget ? formatCurrency(row.budget) : "—"}
        </span>
      ),
    },
    {
      header: "Agent",
      cell: (row: LeadWithRelations) => (
        <span className="text-sm text-slate-600">{row.assignedAgent?.name || "Unassigned"}</span>
      ),
    },
    {
      header: "Follow-up",
      cell: (row: LeadWithRelations) => (
        <span className={cn("text-sm", row.followUpDate && new Date(row.followUpDate) < new Date() ? "text-red-500 font-medium" : "text-slate-600")}>
          {row.followUpDate ? formatDate(row.followUpDate) : "—"}
        </span>
      ),
    },
    {
      header: "Date",
      cell: (row: LeadWithRelations) => (
        <span className="text-sm text-slate-500">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      header: "",
      cell: (row: LeadWithRelations) => (
        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
          <Trash2 size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Leads"
        subtitle={`${pagination.total} total leads`}
        action={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition"
          >
            <Plus size={16} />
            Add Lead
          </button>
        }
      />

      <main className="flex-1 p-4 lg:p-6 space-y-4 overflow-auto">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads..."
              className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none flex-1"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {/* Status Pills */}
        <div className="flex gap-2 flex-wrap">
          {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setStatusFilter(statusFilter === k ? "" : k)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition",
                statusFilter === k ? LEAD_STATUS_COLORS[k] : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {v}
            </button>
          ))}
        </div>

        <DataTable
          columns={columns as never}
          data={leads as never}
          loading={loading}
          pagination={{
            page: pagination.page,
            totalPages: pagination.totalPages,
            total: pagination.total,
            limit: pagination.limit,
            onPageChange: fetchLeads,
          }}
          emptyMessage="No leads found. Add your first lead!"
        />
      </main>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-2xl mx-auto mb-4"><Trash2 size={22} className="text-red-600" /></div>
            <h3 className="text-lg font-bold text-slate-900 text-center">Delete Lead?</h3>
            <p className="text-slate-500 text-sm text-center mt-2 mb-6"><span className="font-semibold text-slate-700">{deleteTarget.fullName}</span> will be permanently removed.</p>
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
        <LeadForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          loading={formLoading}
        />
      )}
    </div>
  );
}
