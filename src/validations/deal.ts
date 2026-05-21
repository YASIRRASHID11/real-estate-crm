import { z } from "zod";

export const createDealSchema = z.object({
  title: z.string().min(2, "Title is required"),
  leadId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  agentId: z.string().uuid().optional(),
  bookingAmount: z.number().positive().optional(),
  finalAmount: z.number().positive("Final amount is required"),
  commissionRate: z.number().min(0).max(100).default(2),
  status: z.enum(["INITIATED","BOOKING","AGREEMENT","PAYMENT_PENDING","CLOSED","CANCELLED"]).default("INITIATED"),
  notes: z.string().optional(),
});

export const updateDealSchema = createDealSchema.partial();

export const createPaymentSchema = z.object({
  dealId: z.string().uuid(),
  amount: z.number().positive(),
  dueDate: z.string().optional(),
  description: z.string().optional(),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
