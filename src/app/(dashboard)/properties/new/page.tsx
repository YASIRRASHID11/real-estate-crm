"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Header from "@/components/layout/header";
import { Loader2, ArrowLeft } from "lucide-react";
import { createPropertySchema, type CreatePropertyInput } from "@/validations/property";
import { PROPERTY_TYPE_LABELS, AMENITIES_LIST, INDIAN_STATES } from "@/constants";
import { toast } from "sonner";

export default function NewPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreatePropertyInput>({
    resolver: zodResolver(createPropertySchema) as any,
    defaultValues: { status: "AVAILABLE", featured: false, areaUnit: "sqft", amenities: [] },
  });

  const toggleAmenity = (a: string) => {
    const updated = selectedAmenities.includes(a) ? selectedAmenities.filter((x) => x !== a) : [...selectedAmenities, a];
    setSelectedAmenities(updated);
    setValue("amenities", updated);
  };

  const onSubmit = async (data: unknown) => {
    const propertyData = data as CreatePropertyInput;
    setLoading(true);
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...propertyData, amenities: selectedAmenities }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Property created!");
        router.push("/properties");
      } else {
        toast.error(json.message || "Failed to create property");
      }
    } catch { toast.error("Network error"); }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Add Property" subtitle="List a new property" action={
        <button onClick={() => router.back()} className="flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-700 text-sm rounded-xl hover:bg-slate-50 transition">
          <ArrowLeft size={16} /> Back
        </button>
      } />

      <main className="flex-1 p-4 lg:p-6 overflow-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Property Title *</label>
                <input {...register("title")} placeholder="3 BHK Apartment in Bandra West" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Property Type *</label>
                <select {...register("propertyType")} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Select type</option>
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                {errors.propertyType && <p className="text-red-500 text-xs mt-1">{errors.propertyType.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select {...register("category")} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Select category</option>
                  {["RESIDENTIAL","COMMERCIAL","INDUSTRIAL","LAND"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹) *</label>
                <input {...register("price", { valueAsNumber: true })} type="number" placeholder="5000000" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Area *</label>
                  <input {...register("area", { valueAsNumber: true })} type="number" placeholder="1200" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                  <select {...register("areaUnit")} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="sqft">sqft</option>
                    <option value="sqm">sqm</option>
                    <option value="acres">acres</option>
                    <option value="guntha">guntha</option>
                  </select>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea {...register("description")} rows={3} placeholder="Describe the property..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                <input {...register("city")} placeholder="Mumbai" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
                <select {...register("state")} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
                <input {...register("address")} placeholder="Full address" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Property Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bedrooms</label>
                <input {...register("bedrooms", { valueAsNumber: true })} type="number" min={0} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bathrooms</label>
                <input {...register("bathrooms", { valueAsNumber: true })} type="number" min={0} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Parking</label>
                <input {...register("parking", { valueAsNumber: true })} type="number" min={0} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Furnishing</label>
                <select {...register("furnishingStatus")} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Select</option>
                  <option value="UNFURNISHED">Unfurnished</option>
                  <option value="SEMI_FURNISHED">Semi-furnished</option>
                  <option value="FULLY_FURNISHED">Fully furnished</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select {...register("status")} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="AVAILABLE">Available</option>
                  <option value="SOLD">Sold</option>
                  <option value="RENTED">Rented</option>
                  <option value="UNDER_CONSTRUCTION">Under Construction</option>
                  <option value="OFF_MARKET">Off Market</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Builder</label>
                <input {...register("builderName")} placeholder="Builder name" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                <input {...register("projectName")} placeholder="Project name" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">RERA ID</label>
                <input {...register("reraId")} placeholder="RERA registration" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input {...register("featured")} type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">Mark as Featured Property</span>
              </label>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_LIST.map((a) => (
                <button key={a} type="button" onClick={() => toggleAmenity(a)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${selectedAmenities.includes(a) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()} className="px-6 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2">
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? "Creating..." : "Create Property"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
