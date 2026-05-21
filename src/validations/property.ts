import { z } from "zod";

export const createPropertySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  propertyType: z.enum(["APARTMENT","VILLA","PLOT","COMMERCIAL","OFFICE","SHOP","WAREHOUSE","PENTHOUSE","STUDIO"]),
  category: z.enum(["RESIDENTIAL","COMMERCIAL","INDUSTRIAL","LAND"]),
  description: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  address: z.string().min(5, "Address is required"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  price: z.number().positive("Price must be positive"),
  area: z.number().positive("Area must be positive"),
  areaUnit: z.string().default("sqft"),
  bedrooms: z.number().int().positive().optional(),
  bathrooms: z.number().int().positive().optional(),
  parking: z.number().int().nonnegative().optional(),
  furnishingStatus: z.enum(["UNFURNISHED","SEMI_FURNISHED","FULLY_FURNISHED"]).optional(),
  amenities: z.array(z.string()).optional(),
  status: z.enum(["AVAILABLE","SOLD","RENTED","UNDER_CONSTRUCTION","OFF_MARKET"]).default("AVAILABLE"),
  featured: z.boolean().default(false),
  builderName: z.string().optional(),
  projectName: z.string().optional(),
  reraId: z.string().optional(),
  floorNumber: z.number().int().optional(),
  totalFloors: z.number().int().optional(),
  facing: z.string().optional(),
  ageOfProperty: z.number().int().nonnegative().optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
