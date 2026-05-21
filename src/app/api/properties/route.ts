import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, paginate, createPaginatedResponse, generateSlug } from "@/lib/utils";
import { createPropertySchema } from "@/validations/property";
import { DEFAULT_PAGE_SIZE } from "@/constants";
type PropertyType = string;
type PropertyCategory = string;
type PropertyStatus = string;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE)));
    const search = searchParams.get("search") || "";
    const propertyType = searchParams.get("propertyType") as PropertyType | null;
    const category = searchParams.get("category") as PropertyCategory | null;
    const status = searchParams.get("status") as PropertyStatus | null;
    const city = searchParams.get("city");
    const featured = searchParams.get("featured");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    const where: Record<string, unknown> = { deletedAt: null };
    if (propertyType) where.propertyType = propertyType;
    if (category) where.category = category;
    if (status) where.status = status;
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (featured === "true") where.featured = true;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) (where.price as Record<string, number>).gte = parseFloat(minPrice);
      if (maxPrice) (where.price as Record<string, number>).lte = parseFloat(maxPrice);
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { builderName: { contains: search, mode: "insensitive" } },
      ];
    }

    const { skip, take } = paginate(page, limit);
    const [properties, total] = await Promise.all([
      db.property.findMany({
        where,
        skip,
        take,
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          _count: { select: { deals: true } },
        },
      }),
      db.property.count({ where }),
    ]);

    return apiSuccess(createPaginatedResponse(properties, total, page, limit));
  } catch (error) {
    console.error("[PROPERTIES_GET]", error);
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createPropertySchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten());

    const slug = `${generateSlug(parsed.data.title)}-${Date.now()}`;

    const property = await db.property.create({
      data: { ...parsed.data, slug, amenities: JSON.stringify(parsed.data.amenities || []) },
      include: { images: true },
    });

    return apiSuccess(property, "Property created", 201);
  } catch (error) {
    console.error("[PROPERTIES_POST]", error);
    return apiError("Internal server error", 500);
  }
}
