"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import Header from "@/components/layout/header";
import Badge from "@/components/shared/badge";
import DataTable from "@/components/shared/data-table";
import { Plus, X, Loader2, CheckSquare, Trash2 } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { TASK_STATUS_COLORS, TASK_PRIORITY_COLORS } from "@/constants";
import { toast } from "sonner";
import type { TaskWithRelations } from "@/types";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  priority: z.enum(["LOW","MEDIUM","HIGH","URGENT"]).default("MEDIUM"),
  status: z.enum(["PENDING","IN_PROGRESS","COMPLETED","OVERDUE","CANCELLED"]).default("PENDING"),
  dueDate: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TaskWithRelations | null>(null);
  const [deleting, setDeleting] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, reset } = useForm<FormData>({ resolver: zodResolver(schema) as any });

  const fetchTasks = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (statusFilter) params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    const res = await fetch(`/api/tasks?${params}`);
    const json = await res.json();
    if (json.success) { setTasks(json.data.data); setPagination(json.data.pagination); }
    setLoading(false);
  }, [statusFilter, priorityFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const markComplete = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED", completedAt: new Date().toISOString() }),
    });
    if (res.ok) { toast.success("Task completed!"); fetchTasks(); }
  };

  const onSubmit = async (data: FormData) => {
    setFormLoading(true);
    const res = await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.success) { toast.success("Task created"); setShowForm(false); reset(); fetchTasks(); }
    else toast.error(json.message || "Failed");
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/tasks/${deleteTarget.id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) { toast.success("Task deleted"); setDeleteTarget(null); fetchTasks(); }
    else toast.error(json.message || "Failed to delete");
    setDeleting(false);
  };

  const columns = [
    {
      header: "Task", cell: (r: TaskWithRelations) => (
        <div className="flex items-start gap-2">
          <button onClick={(e) => { e.stopPropagation(); markComplete(r.id); }} className={cn("mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center", r.status === "COMPLETED" ? "bg-green-500 border-green-500 text-white" : "border-slate-300 hover:border-blue-400")}>
            {r.status === "COMPLETED" && <span className="text-white text-xs">✓</span>}
          </button>
          <div>
            <p className={cn("font-medium text-slate-900", r.status === "COMPLETED" && "line-through text-slate-400")}>{r.title}</p>
            {r.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{r.description}</p>}
          </div>
        </div>
      )
    },
    { header: "Priority", cell: (r: TaskWithRelations) => <Badge label={r.priority} className={TASK_PRIORITY_COLORS[r.priority]} /> },
    { header: "Status", cell: (r: TaskWithRelations) => <Badge label={r.status.replace(/_/g, " ")} className={TASK_STATUS_COLORS[r.status]} /> },
    { header: "Assigned To", cell: (r: TaskWithRelations) => <span className="text-sm text-slate-600">{r.assignedTo?.name || "—"}</span> },
    { header: "Due Date", cell: (r: TaskWithRelations) => <span className={cn("text-sm", r.dueDate && new Date(r.dueDate) < new Date() && r.status !== "COMPLETED" ? "text-red-500 font-medium" : "text-slate-500")}>{r.dueDate ? formatDate(r.dueDate) : "—"}</span> },
    { header: "Linked To", cell: (r: TaskWithRelations) => <span className="text-sm text-slate-500">{r.lead?.fullName || r.deal?.title || "—"}</span> },
    { header: "", cell: (r: TaskWithRelations) => <button onClick={() => setDeleteTarget(r)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={15} /></button> },
  ];

  const statCards = [
    { label: "Pending", count: tasks.filter((t) => t.status === "PENDING").length, color: "text-yellow-600" },
    { label: "In Progress", count: tasks.filter((t) => t.status === "IN_PROGRESS").length, color: "text-blue-600" },
    { label: "Overdue", count: tasks.filter((t) => t.status === "OVERDUE").length, color: "text-red-600" },
    { label: "Completed", count: tasks.filter((t) => t.status === "COMPLETED").length, color: "text-green-600" },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Tasks" subtitle="Manage your daily tasks and follow-ups" action={
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition">
          <Plus size={16} /> Add Task
        </button>
      } />

      <main className="flex-1 p-4 lg:p-6 space-y-4 overflow-auto">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map((c) => (
            <div key={c.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <p className={`text-2xl font-bold ${c.color}`}>{c.count}</p>
              <p className="text-sm text-slate-500 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          {["PENDING","IN_PROGRESS","COMPLETED","OVERDUE","CANCELLED"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? "" : s)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition", statusFilter === s ? TASK_STATUS_COLORS[s] : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
              {s.replace(/_/g, " ")}
            </button>
          ))}
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-600 outline-none ml-auto">
            <option value="">All Priorities</option>
            {["LOW","MEDIUM","HIGH","URGENT"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <DataTable columns={columns as never} data={tasks as never} loading={loading}
          pagination={{ page: pagination.page, totalPages: pagination.totalPages, total: pagination.total, limit: pagination.limit, onPageChange: fetchTasks }}
          emptyMessage="No tasks yet." />
      </main>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-2xl mx-auto mb-4"><Trash2 size={22} className="text-red-600" /></div>
            <h3 className="text-lg font-bold text-slate-900 text-center">Delete Task?</h3>
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

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Add Task</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit as never)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title *</label>
                <input {...register("title")} placeholder="Follow up with lead" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea {...register("description")} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select {...register("priority")} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {["LOW","MEDIUM","HIGH","URGENT"].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                  <input {...register("dueDate")} type="date" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={formLoading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm flex items-center justify-center gap-2">
                  {formLoading && <Loader2 size={16} className="animate-spin" />} Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
