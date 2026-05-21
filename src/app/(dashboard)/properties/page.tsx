"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/layout/header";
import Badge from "@/components/shared/badge";
import EmptyState from "@/components/shared/empty-state";
import { Plus, Search, Building2, BedDouble, Bath, SquareDot, Star, Trash2, Loader2 } from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { PROPERTY_TYPE_LABELS, PROPERTY_STATUS_COLORS } from "@/constants";
import { toast } from "sonner";
import type { PropertyWithImages } from "@/types";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<PropertyWithImages[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 12 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteTarget, setDeleteTarget] = useState<PropertyWithImages | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProperties = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "12" });
      if (search) params.set("search", search);
      if (typeFilter) params.set("propertyType", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/properties?${params}`);
      const json = await res.json();
      if (json.success) {
        setProperties(json.data.data);
        setPagination(json.data.pagination);
      }
    } catch { toast.error("Failed to load properties"); }
    setLoading(false);
  }, [search, typeFilter, statusFilter]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/properties/${deleteTarget.id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) { toast.success("Property deleted"); setDeleteTarget(null); fetchProperties(); }
    else toast.error(json.message || "Failed to delete");
    setDeleting(false);
  };

  const propertyCard = (p: PropertyWithImages) => {
    const primaryImage = p.images?.[0]?.url;
    return (
      <div key={p.id} className="group relative">
        <button onClick={() => setDeleteTarget(p)} className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg shadow transition opacity-0 group-hover:opacity-100">
          <Trash2 size={14} />
        </button>
        <a href={`/properties/${p.id}`} className="block">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <div className="relative h-48 bg-slate-200">
            {primaryImage ? (
              <img src={primaryImage} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <Building2 size={40} />
              </div>
            )}
            {p.featured && (
              <div className="absolute top-3 left-3 flex items-center gap-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                <Star size={10} /> Featured
              </div>
            )}
            <div className="absolute top-3 right-3">
              <Badge label={p.status.replace(/_/g, " ")} className={PROPERTY_STATUS_COLORS[p.status]} />
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2">{p.title}</h3>
            </div>
            <p className="text-xs text-slate-500 mb-2">{p.city}, {p.state}</p>
            <p className="text-lg font-bold text-blue-600 mb-3">{formatCurrency(p.price)}</p>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              {p.bedrooms && <span className="flex items-center gap-1"><BedDouble size={12} /> {p.bedrooms} BHK</span>}
              {p.bathrooms && <span className="flex items-center gap-1"><Bath size={12} /> {p.bathrooms}</span>}
              <span className="flex items-center gap-1"><SquareDot size={12} /> {p.area} {p.areaUnit}</span>
              <span className="ml-auto text-slate-400">{PROPERTY_TYPE_LABELS[p.propertyType]}</span>
            </div>
          </div>
        </div>
        </a>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Properties"
        subtitle={`${pagination.total} properties`}
        action={
          <a href="/properties/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition">
            <Plus size={16} /> Add Property
          </a>
        }
      />

      <main className="flex-1 p-4 lg:p-6 space-y-4 overflow-auto">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1">
            <Search size={16} className="text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search properties..." className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none flex-1" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none">
            <option value="">All Types</option>
            {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none">
            <option value="">All Status</option>
            {["AVAILABLE","SOLD","RENTED","UNDER_CONSTRUCTION","OFF_MARKET"].map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                <div className="h-48 bg-slate-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-5 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <EmptyState icon={Building2} title="No properties found" description="Add your first property to get started." action={<a href="/properties/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl">Add Property</a>} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {properties.map(propertyCard)}
          </div>
        )}

        {deleteTarget && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-2xl mx-auto mb-4"><Trash2 size={22} className="text-red-600" /></div>
              <h3 className="text-lg font-bold text-slate-900 text-center">Delete Property?</h3>
              <p className="text-slate-500 text-sm text-center mt-2 mb-6"><span className="font-semibold text-slate-700">{deleteTarget.title}</span> will be permanently removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium">Cancel</button>
                <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                  {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-4">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => fetchProperties(p)} className={cn("w-9 h-9 rounded-xl text-sm font-medium", pagination.page === p ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")}>
                {p}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
