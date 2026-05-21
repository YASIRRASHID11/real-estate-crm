import { z } from "zod";

export const createLeadSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Enter a valid phone number"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  city: z.string().optional(),
  budget: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  propertyType: z.enum(["APARTMENT","VILLA","PLOT","COMMERCIAL","OFFICE","SHOP","WAREHOUSE","PENTHOUSE","STUDIO"]).optional(),
  preferredLocation: z.string().optional(),
  source: z.enum(["WEBSITE","REFERRAL","FACEBOOK","INSTAGRAM","GOOGLE_ADS","WALK_IN","PHONE","EMAIL","WHATSAPP","PORTAL","OTHER"]).default("OTHER"),
  status: z.enum(["NEW","CONTACTED","QUALIFIED","SITE_VISIT_SCHEDULED","SITE_VISIT_DONE","NEGOTIATION","BOOKING","CLOSED","LOST"]).default("NEW"),
  agentId: z.string().uuid().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  followUpDate: z.string().optional(),
});

export const updateLeadSchema = createLeadSchema.partial();

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
