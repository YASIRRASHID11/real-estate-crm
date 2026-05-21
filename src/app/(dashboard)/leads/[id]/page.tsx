"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/header";
import Badge from "@/components/shared/badge";
import { Phone, MessageCircle, Mail, ArrowLeft, Edit, Clock, FileText } from "lucide-react";
import { formatDate, formatCurrency, whatsappUrl, cn } from "@/lib/utils";
import { LEAD_STATUS_COLORS, LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS } from "@/constants";
import { toast } from "sonner";
import type { LeadWithRelations } from "@/types";

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<LeadWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    fetch(`/api/leads/${id}`)
      .then((r) => r.json())
      .then((j: { success: boolean; data: LeadWithRelations }) => { if (j.success) setLead(j.data); })
      .catch(() => toast.error("Failed to load lead"))
      .finally(() => setLoading(false));
  }, [id]);

  const addNote = async () => {
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: note }),
      });
      if (res.ok) {
        toast.success("Note added");
        setNote("");
        setLead((prev) => prev ? { ...prev, notes: note } : null);
      }
    } finally { setSavingNote(false); }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!lead) return <div className="flex-1 flex items-center justify-center text-slate-400">Lead not found</div>;

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title={lead.fullName}
        subtitle="Lead Detail"
        action={
          <button onClick={() => router.back()} className="flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-700 text-sm rounded-xl hover:bg-slate-50 transition">
            <ArrowLeft size={16} /> Back
          </button>
        }
      />

      <main className="flex-1 p-4 lg:p-6 space-y-6 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{lead.fullName}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge label={LEAD_STATUS_LABELS[lead.status]} className={LEAD_STATUS_COLORS[lead.status]} />
                    <span className="text-slate-400 text-sm">{LEAD_SOURCE_LABELS[lead.source]}</span>
                  </div>
                </div>
                <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"><Edit size={18} /></button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Phone", value: lead.phone },
                  { label: "Email", value: lead.email || "—" },
                  { label: "City", value: lead.city || "—" },
                  { label: "Min Budget", value: lead.budget ? formatCurrency(lead.budget) : "—" },
                  { label: "Max Budget", value: lead.budgetMax ? formatCurrency(lead.budgetMax) : "—" },
                  { label: "Property Type", value: lead.propertyType?.replace(/_/g, " ") || "—" },
                  { label: "Preferred Location", value: lead.preferredLocation || "—" },
                  { label: "Assigned Agent", value: lead.assignedAgent?.name || "Unassigned" },
                  { label: "Follow-up Date", value: lead.followUpDate ? formatDate(lead.followUpDate) : "—" },
                  { label: "Created", value: formatDate(lead.createdAt) },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs font-medium text-slate-400 mb-0.5">{item.label}</p>
                    <p className="text-sm font-medium text-slate-800">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100">
                <a href={`tel:${lead.phone}`} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition">
                  <Phone size={16} /> Call
                </a>
                <a href={whatsappUrl(lead.phone)} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-medium hover:bg-green-100 transition">
                  <MessageCircle size={16} /> WhatsApp
                </a>
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-100 transition">
                    <Mail size={16} /> Email
                  </a>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><FileText size={18} className="text-blue-600" /> Notes</h3>
              {lead.notes && <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 mb-4">{lead.notes}</p>}
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Add a note..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2" />
              <button onClick={addNote} disabled={savingNote || !note.trim()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-xl transition">
                {savingNote ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Clock size={18} className="text-blue-600" /> Activity Timeline</h3>
              {lead.activities && lead.activities.length > 0 ? (
                <div className="space-y-3">
                  {lead.activities.map((a: { action: string; description?: string | null; createdAt: string | Date; user?: { name: string } | null }, i: number) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">
                        {a.user?.name?.charAt(0) || "S"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{a.action}</p>
                        {a.description && <p className="text-xs text-slate-500">{a.description}</p>}
                        <p className="text-xs text-slate-400 mt-0.5">{formatDate(a.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">No activity yet</p>
              )}
            </div>

            {/* Follow-ups */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Follow-ups</h3>
              {lead.followUps && lead.followUps.length > 0 ? (
                <div className="space-y-2">
                  {lead.followUps.map((f: { title: string; scheduledAt: string | Date; isDone: boolean }, i: number) => (
                    <div key={i} className={cn("p-3 rounded-xl", f.isDone ? "bg-green-50 border border-green-100" : "bg-slate-50 border border-slate-100")}>
                      <p className="text-sm font-medium text-slate-800">{f.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatDate(f.scheduledAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">No follow-ups scheduled</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
