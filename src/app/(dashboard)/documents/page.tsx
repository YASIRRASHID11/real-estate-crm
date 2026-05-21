"use client";

import { useState } from "react";
import Header from "@/components/layout/header";
import { FileText, Upload, Search, Download, Trash2, File, FileImage } from "lucide-react";
import EmptyState from "@/components/shared/empty-state";

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Documents" subtitle="Agreements, KYC, and payment receipts" action={
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition">
          <Upload size={16} /> Upload
        </button>
      } />

      <main className="flex-1 p-4 lg:p-6 space-y-4 overflow-auto">
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1">
            <Search size={16} className="text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents..." className="bg-transparent text-sm outline-none flex-1" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none">
            <option value="">All Types</option>
            <option value="AGREEMENT">Agreement</option>
            <option value="KYC">KYC</option>
            <option value="PAYMENT_RECEIPT">Payment Receipt</option>
            <option value="PROPERTY_DOCUMENT">Property Document</option>
          </select>
        </div>

        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload agreements, KYC documents, and payment receipts here."
          action={
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl">
              <Upload size={16} /> Upload Document
            </button>
          }
        />
      </main>
    </div>
  );
}
