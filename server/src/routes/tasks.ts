import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { authRequired } from "../middleware/auth.js";
import { notifyTaskAssignment } from "../email/notification-service.js";

export const tasksRouter = Router();

tasksRouter.use(authRequired);

const createTaskSchema = z.object({
  shiftId: z.string().min(1),
  title: z.string().min(1),
  details: z.string().optional(),
  sortOrder: z.number().int().default(0),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  dueAt: z.string().datetime().optional(),
  assignedContributorId: z.string().optional()
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  details: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  dueAt: z.string().datetime().nullable().optional(),
  assignedContributorId: z.string().nullable().optional()
});

tasksRouter.get("/", async (req, res) => {
  try {
    const orgId = req.tenant?.organizationId;
    const shiftId = req.query.shiftId as string | undefined;
    const status = req.query.status as string | undefined;

    const where: Record<string, unknown> = { deletedAt: null };
    if (orgId) where.organizationId = orgId;
    if (shiftId) where.shiftId = shiftId;
    if (status) where.status = status;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        shift: { select: { id: true, title: true, startsAt: true, endsAt: true } },
        assignedContributor: { select: { id: true, firstName: true, lastName: true, email: true } }
      },
      orderBy: [{ shiftId: "asc" }, { sortOrder: "asc" }]
    });

    res.json({ tasks });
  } catch (err) {
    console.error("List tasks error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

tasksRouter.get("/:id", async (req, res) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        shift: { select: { id: true, title: true, startsAt: true, endsAt: true, status: true } },
        assignedContributor: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    res.json({ task });
  } catch (err) {
    console.error("Get task error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

tasksRouter.post("/", async (req, res) => {
  try {
    const orgId = req.tenant?.organizationId;
    if (!orgId) {
      res.status(400).json({ error: "x-org-id header is required" });
      return;
    }

    const body = createTaskSchema.parse(req.body);

    const shift = await prisma.shift.findFirst({
      where: { id: body.shiftId, organizationId: orgId, deletedAt: null }
    });

    if (!shift) {
      res.status(404).json({ error: "Shift not found in this organization" });
      return;
    }

    const task = await prisma.task.create({
      data: {
        organizationId: orgId,
        shiftId: body.shiftId,
        title: body.title,
        details: body.details,
        sortOrder: body.sortOrder,
        status: body.status,
        dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
        assignedContributorId: body.assignedContributorId
      }
    });

    if (body.assignedContributorId) {
      notifyTaskAssignment(task.id, body.assignedContributorId).catch(() => {});
    }

    res.status(201).json({ task });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: err.issues });
      return;
    }
    console.error("Create task error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

tasksRouter.patch("/:id", async (req, res) => {
  try {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, deletedAt: null }
    });

    if (!existing) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const body = updateTaskSchema.parse(req.body);
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.details !== undefined) data.details = body.details;
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
    if (body.status !== undefined) data.status = body.status;
    if (body.dueAt !== undefined) data.dueAt = body.dueAt ? new Date(body.dueAt) : null;
    if (body.assignedContributorId !== undefined) data.assignedContributorId = body.assignedContributorId;

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data
    });

    if (body.assignedContributorId && body.assignedContributorId !== existing.assignedContributorId) {
      notifyTaskAssignment(task.id, body.assignedContributorId).catch(() => {});
    }

    res.json({ task });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: err.issues });
      return;
    }
    console.error("Update task error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

tasksRouter.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, deletedAt: null }
    });

    if (!existing) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    await prisma.task.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() }
    });

    res.status(204).send();
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
