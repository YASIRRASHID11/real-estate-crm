export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  SITE_VISIT_SCHEDULED: "Site Visit Scheduled",
  SITE_VISIT_DONE: "Site Visit Done",
  NEGOTIATION: "Negotiation",
  BOOKING: "Booking",
  CLOSED: "Closed",
  LOST: "Lost",
};

export const LEAD_STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-yellow-100 text-yellow-800",
  QUALIFIED: "bg-purple-100 text-purple-800",
  SITE_VISIT_SCHEDULED: "bg-orange-100 text-orange-800",
  SITE_VISIT_DONE: "bg-indigo-100 text-indigo-800",
  NEGOTIATION: "bg-pink-100 text-pink-800",
  BOOKING: "bg-teal-100 text-teal-800",
  CLOSED: "bg-green-100 text-green-800",
  LOST: "bg-red-100 text-red-800",
};

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  WEBSITE: "Website",
  REFERRAL: "Referral",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  GOOGLE_ADS: "Google Ads",
  WALK_IN: "Walk In",
  PHONE: "Phone",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  PORTAL: "Portal",
  OTHER: "Other",
};

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Apartment",
  VILLA: "Villa",
  PLOT: "Plot",
  COMMERCIAL: "Commercial",
  OFFICE: "Office",
  SHOP: "Shop",
  WAREHOUSE: "Warehouse",
  PENTHOUSE: "Penthouse",
  STUDIO: "Studio",
};

export const PROPERTY_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  SOLD: "bg-gray-100 text-gray-800",
  RENTED: "bg-blue-100 text-blue-800",
  UNDER_CONSTRUCTION: "bg-yellow-100 text-yellow-800",
  OFF_MARKET: "bg-red-100 text-red-800",
};

export const DEAL_STATUS_LABELS: Record<string, string> = {
  INITIATED: "Initiated",
  BOOKING: "Booking",
  AGREEMENT: "Agreement",
  PAYMENT_PENDING: "Payment Pending",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

export const DEAL_STATUS_COLORS: Record<string, string> = {
  INITIATED: "bg-blue-100 text-blue-800",
  BOOKING: "bg-yellow-100 text-yellow-800",
  AGREEMENT: "bg-purple-100 text-purple-800",
  PAYMENT_PENDING: "bg-orange-100 text-orange-800",
  CLOSED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

export const TASK_PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  SALES_MANAGER: "Sales Manager",
  AGENT: "Agent",
  ACCOUNTANT: "Accountant",
};

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: ["leads.*", "properties.*", "customers.*", "deals.*", "users.*", "reports.*"],
  SALES_MANAGER: ["leads.*", "properties.read", "customers.*", "deals.*", "reports.read"],
  AGENT: ["leads.read", "leads.create", "leads.update", "properties.read", "customers.read", "tasks.*"],
  ACCOUNTANT: ["deals.read", "payments.*", "reports.read"],
};

export const AMENITIES_LIST = [
  "Swimming Pool", "Gym", "Club House", "Park", "Security",
  "Power Backup", "Lift", "Parking", "Garden", "Terrace",
  "24x7 Water Supply", "Intercom", "Fire Safety", "CCTV",
  "Rainwater Harvesting", "Solar Power", "Modular Kitchen",
];

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Chandigarh",
];

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
