import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";
import { updatePropertySchema } from "@/validations/property";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const property = await db.property.findUnique({
      where: { id, deletedAt: null },
      include: { images: { orderBy: { order: "asc" } }, documents: true, notes: { include: { author: { select: { name: true } } } } },
    });
    if (!property) return apiError("Property not found", 404);
    return apiSuccess(property);
  } catch (error) {
    console.error("[PROPERTY_GET]", error);
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updatePropertySchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten());

    const { amenities, ...rest } = parsed.data;
    const property = await db.property.update({
      where: { id },
      data: { ...rest, ...(amenities !== undefined && { amenities: JSON.stringify(amenities) }) },
      include: { images: true },
    });
    return apiSuccess(property, "Property updated");
  } catch (error) {
    console.error("[PROPERTY_PATCH]", error);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const role = _.headers.get("x-user-role");
    if (role === "AGENT") return apiError("Unauthorized", 403);
    await db.property.update({ where: { id }, data: { deletedAt: new Date() } });
    return apiSuccess(null, "Property deleted");
  } catch (error) {
    console.error("[PROPERTY_DELETE]", error);
    return apiError("Internal server error", 500);
  }
}
