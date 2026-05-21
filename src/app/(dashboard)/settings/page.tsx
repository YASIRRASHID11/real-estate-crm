"use client";

import { useState } from "react";
import Header from "@/components/layout/header";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import { Building2, Bell, Shield, User, Palette, Mail } from "lucide-react";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "company", label: "Company", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Settings saved successfully");
    setSaving(false);
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Settings" subtitle="Manage your account and company preferences" />

      <main className="flex-1 p-4 lg:p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-6">
            {/* Sidebar tabs */}
            <div className="w-48 flex-shrink-0">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === tab.id ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"}`}>
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-6">
              {activeTab === "profile" && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h3 className="font-semibold text-slate-900 mb-6">Profile Information</h3>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <button className="px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-xl hover:bg-blue-100 transition">
                        Change Photo
                      </button>
                      <p className="text-xs text-slate-400 mt-1">JPG, PNG max 2MB</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                      <input defaultValue={user?.name} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <input defaultValue={user?.email} type="email" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                      <input value={user?.role?.replace(/_/g, " ")} readOnly className="w-full px-3 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-sm text-slate-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                      <input placeholder="+91 98765 43210" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <button onClick={handleSave} disabled={saving} className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-xl transition">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}

              {activeTab === "company" && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h3 className="font-semibold text-slate-900 mb-6">Company Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Company Name", placeholder: "ETSCRM Realty Pvt Ltd" },
                      { label: "GSTIN", placeholder: "29ABCDE1234F1Z5" },
                      { label: "Company Email", placeholder: "info@etscrm.com" },
                      { label: "Company Phone", placeholder: "+91 22 1234 5678" },
                      { label: "RERA License No.", placeholder: "MH/RERA/2024/001" },
                      { label: "Website", placeholder: "https://etscrm.com" },
                    ].map((f) => (
                      <div key={f.label}>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                        <input placeholder={f.placeholder} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    ))}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                      <textarea rows={2} placeholder="Company full address" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                    </div>
                  </div>
                  <button onClick={handleSave} disabled={saving} className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-xl transition">
                    {saving ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h3 className="font-semibold text-slate-900 mb-6">Notification Preferences</h3>
                  <div className="space-y-4">
                    {[
                      { label: "New Lead Assigned", desc: "Get notified when a lead is assigned to you" },
                      { label: "Follow-up Reminders", desc: "Daily reminders for pending follow-ups" },
                      { label: "Deal Updates", desc: "Get notified when deal status changes" },
                      { label: "Task Due Reminders", desc: "Reminders for overdue or due-today tasks" },
                      { label: "Payment Reminders", desc: "Alerts for upcoming payment due dates" },
                      { label: "Weekly Report", desc: "Receive weekly performance summary" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{item.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                        <div className="flex gap-4">
                          {["Email", "WhatsApp", "SMS"].map((ch) => (
                            <label key={ch} className="flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox" defaultChecked={ch === "Email"} className="rounded" />
                              <span className="text-xs text-slate-500">{ch}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleSave} disabled={saving} className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-xl transition">
                    {saving ? "Saving..." : "Save Preferences"}
                  </button>
                </div>
              )}

              {activeTab === "security" && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h3 className="font-semibold text-slate-900 mb-6">Security Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                      <input type="password" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                      <input type="password" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                      <input type="password" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <button onClick={handleSave} disabled={saving} className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-xl transition">
                    {saving ? "Updating..." : "Update Password"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
