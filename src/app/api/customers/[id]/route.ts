import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const customer = await db.customer.findUnique({ where: { id } });
    if (!customer || customer.deletedAt) return apiError("Customer not found", 404);
    const updated = await db.customer.update({ where: { id }, data: body });
    return apiSuccess(updated, "Customer updated");
  } catch (error) {
    console.error("[CUSTOMER_PATCH]", error);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const customer = await db.customer.findUnique({ where: { id } });
    if (!customer || customer.deletedAt) return apiError("Customer not found", 404);
    await db.customer.update({ where: { id }, data: { deletedAt: new Date() } });
    return apiSuccess(null, "Customer deleted");
  } catch (error) {
    console.error("[CUSTOMER_DELETE]", error);
    return apiError("Internal server error", 500);
  }
}
