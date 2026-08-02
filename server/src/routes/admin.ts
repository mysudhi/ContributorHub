import { Router } from "express";
import { prisma } from "../config/db.js";
import { authRequired, adminRequired } from "../middleware/auth.js";

export const adminRouter = Router();

adminRouter.use(authRequired, adminRequired);

adminRouter.get("/analytics", async (req, res) => {
  try {
    const orgId = req.tenant?.organizationId;
    const orgFilter: Record<string, unknown> = orgId ? { organizationId: orgId } : {};
    const orgFilterActive = { ...orgFilter, deletedAt: null };

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalContributors,
      activeContributors,
      totalShifts,
      openShifts,
      filledShifts,
      cancelledShifts,
      draftShifts,
      totalTasks,
      todoTasks,
      inProgressTasks,
      doneTasks,
      totalSignups,
      recentSignups,
      upcomingShifts,
      recentShifts
    ] = await Promise.all([
      prisma.user.count({ where: { ...orgFilterActive } }),
      prisma.user.count({ where: { ...orgFilterActive, isActive: true } }),
      prisma.shift.count({ where: { ...orgFilterActive } }),
      prisma.shift.count({ where: { ...orgFilterActive, status: "OPEN" } }),
      prisma.shift.count({ where: { ...orgFilterActive, status: "FILLED" } }),
      prisma.shift.count({ where: { ...orgFilterActive, status: "CANCELLED" } }),
      prisma.shift.count({ where: { ...orgFilterActive, status: "DRAFT" } }),
      prisma.task.count({ where: { ...orgFilterActive } }),
      prisma.task.count({ where: { ...orgFilterActive, status: "TODO" } }),
      prisma.task.count({ where: { ...orgFilterActive, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { ...orgFilterActive, status: "DONE" } }),
      prisma.shiftContributor.count({ where: orgId ? { shift: { organizationId: orgId } } : {} }),
      prisma.shiftContributor.count({
        where: {
          assignedAt: { gte: thirtyDaysAgo },
          ...(orgId ? { shift: { organizationId: orgId } } : {})
        }
      }),
      prisma.shift.findMany({
        where: { ...orgFilterActive, status: "OPEN", startsAt: { gte: now, lte: sevenDaysFromNow } },
        include: { contributorLinks: true },
        orderBy: { startsAt: "asc" },
        take: 5
      }),
      prisma.shift.findMany({
        where: { ...orgFilterActive, createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: "desc" },
        take: 10
      })
    ]);

    const fillRate = totalShifts > 0
      ? Math.round((filledShifts / totalShifts) * 100)
      : 0;

    const taskCompletionRate = totalTasks > 0
      ? Math.round((doneTasks / totalTasks) * 100)
      : 0;

    res.json({
      overview: {
        totalContributors,
        activeContributors,
        totalShifts,
        totalTasks,
        totalSignups,
        recentSignups
      },
      shifts: {
        open: openShifts,
        filled: filledShifts,
        cancelled: cancelledShifts,
        draft: draftShifts,
        fillRate
      },
      tasks: {
        todo: todoTasks,
        inProgress: inProgressTasks,
        done: doneTasks,
        completionRate: taskCompletionRate
      },
      upcomingShifts: upcomingShifts.map((s) => ({
        id: s.id,
        title: s.title,
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        capacity: s.capacity,
        signedUp: s.contributorLinks.length,
        spotsLeft: s.capacity - s.contributorLinks.length
      })),
      recentActivity: recentShifts.map((s) => ({
        id: s.id,
        title: s.title,
        status: s.status,
        createdAt: s.createdAt
      }))
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
