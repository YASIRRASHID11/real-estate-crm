import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== "seed-propcrm-2024") return apiError("Unauthorized", 401);

  try {
    const existing = await db.user.findUnique({ where: { email: "admin@propcrm.com" } });
    if (existing) return apiSuccess(null, "Database already seeded");

    const hashedPassword = await hashPassword("Admin@123");

    const admin = await db.user.create({
      data: { name: "Admin User", email: "admin@propcrm.com", password: hashedPassword, role: "ADMIN", status: "ACTIVE" },
    });

    const manager = await db.user.create({
      data: { name: "Sales Manager", email: "manager@propcrm.com", password: hashedPassword, role: "MANAGER", status: "ACTIVE" },
    });

    const agent1 = await db.user.create({
      data: { name: "Rahul Sharma", email: "agent1@propcrm.com", password: hashedPassword, role: "AGENT", status: "ACTIVE" },
    });

    const agent2 = await db.user.create({
      data: { name: "Priya Patel", email: "agent2@propcrm.com", password: hashedPassword, role: "AGENT", status: "ACTIVE" },
    });

    const prop1 = await db.property.create({
      data: {
        title: "3 BHK Luxury Apartment in Bandra West",
        slug: `3bhk-bandra-west-${Date.now()}`,
        propertyType: "APARTMENT",
        category: "RESIDENTIAL",
        description: "Spacious 3 BHK apartment with sea view in prime Bandra West location.",
        city: "Mumbai", state: "Maharashtra",
        address: "Carter Road, Bandra West, Mumbai - 400050",
        price: 28500000, area: 1450, bedrooms: 3, bathrooms: 3, parking: 2,
        furnishingStatus: "SEMI_FURNISHED",
        amenities: JSON.stringify(["Swimming Pool", "Gym", "Security", "Lift", "Parking"]),
        status: "AVAILABLE", featured: true,
      },
    });

    await db.property.create({
      data: {
        title: "2 BHK Apartment in Powai",
        slug: `2bhk-powai-${Date.now()}`,
        propertyType: "APARTMENT", category: "RESIDENTIAL",
        city: "Mumbai", state: "Maharashtra",
        address: "Hiranandani Gardens, Powai, Mumbai - 400076",
        price: 12500000, area: 950, bedrooms: 2, bathrooms: 2, parking: 1,
        status: "AVAILABLE",
        amenities: JSON.stringify(["Club House", "Park", "Security", "Power Backup"]),
      },
    });

    const customer1 = await db.customer.create({
      data: { name: "Amit Mehta", phone: "9876543210", email: "amit.mehta@gmail.com", city: "Mumbai", customerType: "BUYER", budget: 15000000, budgetMax: 30000000 },
    });

    const lead1 = await db.lead.create({
      data: {
        fullName: "Suresh Kumar", phone: "9988776655", email: "suresh@example.com",
        city: "Mumbai", budget: 20000000, budgetMax: 35000000,
        propertyType: "APARTMENT", preferredLocation: "Bandra, Andheri",
        source: "WEBSITE", status: "QUALIFIED",
        agentId: agent1.id, customerId: customer1.id, score: 75,
      },
    });

    const lead2 = await db.lead.create({
      data: {
        fullName: "Kavita Singh", phone: "9911223344", city: "Pune",
        budget: 8000000, propertyType: "VILLA",
        source: "REFERRAL", status: "NEW", agentId: agent2.id,
      },
    });

    const deal = await db.deal.create({
      data: {
        title: "Bandra 3BHK Deal - Amit Mehta",
        leadId: lead1.id, customerId: customer1.id, propertyId: prop1.id, agentId: agent1.id,
        bookingAmount: 1000000, finalAmount: 28500000, commissionRate: 2, commissionAmount: 570000,
        status: "BOOKING",
      },
    });

    await db.task.createMany({
      data: [
        { title: "Follow up with Suresh Kumar", priority: "HIGH", status: "PENDING", assignedToId: agent1.id, leadId: lead1.id, dueDate: new Date(Date.now() + 86400000), createdById: manager.id },
        { title: "Prepare agreement for Bandra deal", priority: "URGENT", status: "IN_PROGRESS", assignedToId: agent1.id, dealId: deal.id, dueDate: new Date(Date.now() + 259200000), createdById: admin.id },
        { title: "Schedule site visit for Kavita Singh", priority: "MEDIUM", status: "PENDING", assignedToId: agent2.id, leadId: lead2.id, createdById: manager.id },
      ],
    });

    await db.followUp.createMany({
      data: [
        { title: "Call Suresh about Bandra property", leadId: lead1.id, agentId: agent1.id, scheduledAt: new Date(Date.now() + 172800000) },
        { title: "Site visit with Kavita", leadId: lead2.id, agentId: agent2.id, scheduledAt: new Date(Date.now() + 432000000) },
      ],
    });

    await db.leadActivity.createMany({
      data: [
        { leadId: lead1.id, userId: agent1.id, action: "CREATED", description: "Lead created via website" },
        { leadId: lead1.id, userId: agent1.id, action: "STATUS_CHANGED", description: "Status updated to QUALIFIED" },
      ],
    });

    return apiSuccess(null, "Database seeded successfully");
  } catch (error) {
    console.error("[SEED]", error);
    return apiError("Seed failed", 500);
  }
}
