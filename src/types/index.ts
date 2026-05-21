import type {
  User,
  Lead,
  Property,
  Customer,
  Deal,
  Task,
  FollowUp,
  Note,
  Payment,
  Document,
  Notification,
  AuditLog,
  LeadActivity,
  PropertyImage,
} from "@prisma/client";

export type {
  User,
  Lead,
  Property,
  Customer,
  Deal,
  Task,
  FollowUp,
  Note,
  Payment,
  Document,
  Notification,
  AuditLog,
  LeadActivity,
  PropertyImage,
};

export type UserRole = "ADMIN" | "MANAGER" | "AGENT";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "SITE_VISIT_SCHEDULED" | "SITE_VISIT_DONE" | "NEGOTIATION" | "BOOKING" | "CLOSED" | "LOST";
export type LeadSource = "WEBSITE" | "REFERRAL" | "FACEBOOK" | "INSTAGRAM" | "GOOGLE_ADS" | "WALK_IN" | "PHONE" | "EMAIL" | "WHATSAPP" | "PORTAL" | "OTHER";
export type PropertyType = "APARTMENT" | "VILLA" | "PLOT" | "COMMERCIAL" | "OFFICE" | "SHOP" | "WAREHOUSE" | "PENTHOUSE" | "STUDIO";
export type PropertyCategory = "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL" | "LAND";
export type PropertyStatus = "AVAILABLE" | "SOLD" | "RENTED" | "UNDER_CONSTRUCTION" | "OFF_MARKET";
export type FurnishingStatus = "UNFURNISHED" | "SEMI_FURNISHED" | "FULLY_FURNISHED";
export type DealStatus = "INITIATED" | "BOOKING" | "AGREEMENT" | "PAYMENT_PENDING" | "CLOSED" | "CANCELLED";
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type CustomerType = "BUYER" | "SELLER" | "INVESTOR" | "TENANT";
export type PaymentStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
export type DocumentType = "AGREEMENT" | "KYC" | "PAYMENT_RECEIPT" | "LEGAL" | "OTHER";

// Extended types with relations
export type LeadWithRelations = Lead & {
  assignedAgent?: Pick<User, "id" | "name" | "email" | "avatar"> | null;
  customer?: Pick<Customer, "id" | "name"> | null;
  activities?: LeadActivity[];
  followUps?: FollowUp[];
  _count?: { activities: number; followUps: number };
};

export type PropertyWithImages = Property & {
  images: PropertyImage[];
  _count?: { deals: number };
};

export type DealWithRelations = Deal & {
  lead?: Pick<Lead, "id" | "fullName" | "phone"> | null;
  customer?: Pick<Customer, "id" | "name" | "phone"> | null;
  property?: Pick<Property, "id" | "title" | "city"> | null;
  agent?: Pick<User, "id" | "name" | "avatar"> | null;
  payments?: Payment[];
};

export type TaskWithRelations = Task & {
  assignedTo?: Pick<User, "id" | "name" | "avatar"> | null;
  lead?: Pick<Lead, "id" | "fullName"> | null;
  deal?: Pick<Deal, "id" | "title"> | null;
};

export type CustomerWithRelations = Customer & {
  leads?: Lead[];
  deals?: DealWithRelations[];
  documents?: Document[];
};

export type UserWithStats = User & {
  _count: {
    assignedLeads: number;
    assignedDeals: number;
    assignedTasks: number;
  };
};

// Dashboard types
export interface DashboardStats {
  totalLeads: number;
  newLeadsToday: number;
  totalCustomers: number;
  activeDeals: number;
  closedDealsThisMonth: number;
  totalRevenue: number;
  revenueThisMonth: number;
  pendingFollowUps: number;
  siteVisitsToday: number;
  tasksOverdue: number;
}

export interface RevenueChartData {
  month: string;
  revenue: number;
  deals: number;
}

export interface LeadConversionData {
  status: string;
  count: number;
  percentage: number;
}

export interface AgentPerformanceData {
  agentName: string;
  leads: number;
  deals: number;
  revenue: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedApiResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

// Filter types
export interface LeadFilters {
  status?: LeadStatus;
  source?: LeadSource;
  agentId?: string;
  propertyType?: PropertyType;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface PropertyFilters {
  propertyType?: PropertyType;
  category?: PropertyCategory;
  status?: PropertyStatus;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  featured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface DealFilters {
  status?: DealStatus;
  agentId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface Session {
  user: AuthUser;
  accessToken: string;
}
