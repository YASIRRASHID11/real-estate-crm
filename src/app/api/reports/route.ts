import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";
import {
  startOfDay, endOfDay, subDays,
  startOfWeek, endOfWeek, subWeeks,
  startOfMonth, endOfMonth,
  startOfYear, endOfYear,
  format, getDaysInMonth,
} from "date-fns";

type Period = "daily" | "weekly" | "monthly" | "yearly";

function getPeriodRange(period: Period, month?: number, year?: number) {
  const now = new Date();
  if (period === "daily") return { start: startOfDay(now), end: endOfDay(now) };
  if (period === "weekly") return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
  if (period === "monthly") {
    const d = new Date(year ?? now.getFullYear(), (month ?? now.getMonth() + 1) - 1, 1);
    return { start: startOfMonth(d), end: endOfMonth(d) };
  }
  // yearly
  const d = new Date(year ?? now.getFullYear(), 0, 1);
  return { start: startOfYear(d), end: endOfYear(d) };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "dashboard";
    const period = (searchParams.get("period") || "monthly") as Period;
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;

    // Specific date (used for weekday selection)
    const specificDate = searchParams.get("date");
    let start: Date, end: Date;
    if (specificDate) {
      const d = new Date(specificDate);
      start = startOfDay(d);
      end = endOfDay(d);
    } else {
      ({ start, end } = getPeriodRange(period, month, year));
    }

    if (type === "dashboard") {
      const [
        newLeads, newCustomers, closedDeals, revenue,
        activeDeals, totalLeads, totalProperties, pendingFollowUps, overdueTask,
      ] = await Promise.all([
        db.lead.count({ where: { deletedAt: null, createdAt: { gte: start, lte: end } } }),
        db.customer.count({ where: { deletedAt: null, createdAt: { gte: start, lte: end } } }),
        db.deal.count({ where: { deletedAt: null, status: "CLOSED", closedAt: { gte: start, lte: end } } }),
        db.deal.aggregate({ where: { deletedAt: null, status: "CLOSED", closedAt: { gte: start, lte: end } }, _sum: { finalAmount: true } }),
        db.deal.count({ where: { deletedAt: null, status: { in: ["INITIATED","BOOKING","AGREEMENT","PAYMENT_PENDING"] } } }),
        db.lead.count({ where: { deletedAt: null } }),
        db.property.count({ where: { deletedAt: null } }),
        db.followUp.count({ where: { isDone: false, scheduledAt: { gte: start, lte: end } } }),
        db.task.count({ where: { status: "OVERDUE" } }),
      ]);

      return apiSuccess({ newLeads, newCustomers, closedDeals, revenue: revenue._sum.finalAmount || 0, activeDeals, totalLeads, totalProperties, pendingFollowUps, overdueTask, period });
    }

    if (type === "revenue") {
      const points: { label: string; revenue: number; deals: number }[] = [];
      const now = new Date();

      if (period === "daily") {
        for (let i = 13; i >= 0; i--) {
          const day = subDays(now, i);
          const result = await db.deal.aggregate({
            where: { status: "CLOSED", closedAt: { gte: startOfDay(day), lte: endOfDay(day) }, deletedAt: null },
            _sum: { finalAmount: true }, _count: true,
          });
          points.push({ label: format(day, "dd MMM"), revenue: result._sum.finalAmount || 0, deals: result._count });
        }
      } else if (period === "weekly") {
        for (let i = 7; i >= 0; i--) {
          const week = subWeeks(now, i);
          const result = await db.deal.aggregate({
            where: { status: "CLOSED", closedAt: { gte: startOfWeek(week, { weekStartsOn: 1 }), lte: endOfWeek(week, { weekStartsOn: 1 }) }, deletedAt: null },
            _sum: { finalAmount: true }, _count: true,
          });
          points.push({ label: `W${format(week, "w")}`, revenue: result._sum.finalAmount || 0, deals: result._count });
        }
      } else if (period === "monthly") {
        // Daily breakdown for the selected month
        const baseDate = new Date(year ?? now.getFullYear(), (month ?? now.getMonth() + 1) - 1, 1);
        const daysInMonth = getDaysInMonth(baseDate);
        for (let d = 1; d <= daysInMonth; d++) {
          const day = new Date(baseDate.getFullYear(), baseDate.getMonth(), d);
          const result = await db.deal.aggregate({
            where: { status: "CLOSED", closedAt: { gte: startOfDay(day), lte: endOfDay(day) }, deletedAt: null },
            _sum: { finalAmount: true }, _count: true,
          });
          points.push({ label: `${d}`, revenue: result._sum.finalAmount || 0, deals: result._count });
        }
      } else {
        // Monthly breakdown for the selected year
        const baseYear = year ?? now.getFullYear();
        for (let m = 0; m < 12; m++) {
          const monthDate = new Date(baseYear, m, 1);
          const result = await db.deal.aggregate({
            where: { status: "CLOSED", closedAt: { gte: startOfMonth(monthDate), lte: endOfMonth(monthDate) }, deletedAt: null },
            _sum: { finalAmount: true }, _count: true,
          });
          points.push({ label: format(monthDate, "MMM"), revenue: result._sum.finalAmount || 0, deals: result._count });
        }
      }

      return apiSuccess(points);
    }

    if (type === "lead_conversion") {
      const statuses = ["NEW","CONTACTED","QUALIFIED","SITE_VISIT_SCHEDULED","SITE_VISIT_DONE","NEGOTIATION","BOOKING","CLOSED","LOST"];
      const total = await db.lead.count({ where: { deletedAt: null } });
      const data = await Promise.all(
        statuses.map(async (status) => {
          const count = await db.lead.count({ where: { status: status as never, deletedAt: null } });
          return { status, count, percentage: total > 0 ? Math.round((count / total) * 100) : 0 };
        })
      );
      return apiSuccess(data);
    }

    if (type === "agent_performance") {
      const agents = await db.user.findMany({
        where: { role: "AGENT", status: "ACTIVE", deletedAt: null },
        select: { id: true, name: true, avatar: true, _count: { select: { assignedLeads: true, assignedDeals: true } } },
      });
      const performance = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        agents.map(async (agent: any) => {
          const rev = await db.deal.aggregate({ where: { agentId: agent.id, status: "CLOSED" }, _sum: { finalAmount: true } });
          return { agentName: agent.name, avatar: agent.avatar, leads: agent._count.assignedLeads, deals: agent._count.assignedDeals, revenue: rev._sum.finalAmount || 0 };
        })
      );
      return apiSuccess(performance);
    }

    return apiError("Invalid report type", 400);
  } catch (error) {
    console.error("[REPORTS_GET]", error);
    return apiError("Internal server error", 500);
  }
}
