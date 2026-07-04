import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { authRequired } from "../middleware/auth.js";

export const shiftsRouter = Router();

shiftsRouter.use(authRequired);

const createShiftSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  capacity: z.number().int().min(1).default(1),
  status: z.enum(["DRAFT", "OPEN", "FILLED", "CANCELLED"]).default("OPEN")
});

const updateShiftSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  capacity: z.number().int().min(1).optional(),
  status: z.enum(["DRAFT", "OPEN", "FILLED", "CANCELLED"]).optional()
});

shiftsRouter.get("/", async (req, res) => {
  try {
    const orgId = req.tenant?.organizationId;
    const status = req.query.status as string | undefined;

    const where: Record<string, unknown> = { deletedAt: null };
    if (orgId) where.organizationId = orgId;
    if (status) where.status = status;

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        tasks: { where: { deletedAt: null }, select: { id: true, title: true, status: true } },
        contributorLinks: {
          include: { contributor: { select: { id: true, firstName: true, lastName: true, email: true } } }
        }
      },
      orderBy: { startsAt: "asc" }
    });

    res.json({ shifts });
  } catch (err) {
    console.error("List shifts error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

shiftsRouter.get("/:id", async (req, res) => {
  try {
    const shift = await prisma.shift.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        tasks: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
        requiredSkills: { include: { skill: true } },
        contributorLinks: {
          include: { contributor: { select: { id: true, firstName: true, lastName: true, email: true } } }
        }
      }
    });

    if (!shift) {
      res.status(404).json({ error: "Shift not found" });
      return;
    }

    res.json({ shift });
  } catch (err) {
    console.error("Get shift error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

shiftsRouter.post("/", async (req, res) => {
  try {
    const orgId = req.tenant?.organizationId;
    if (!orgId) {
      res.status(400).json({ error: "x-org-id header is required" });
      return;
    }

    const body = createShiftSchema.parse(req.body);

    const shift = await prisma.shift.create({
      data: {
        organizationId: orgId,
        createdById: req.user!.userId,
        title: body.title,
        description: body.description,
        location: body.location,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
        capacity: body.capacity,
        status: body.status
      }
    });

    res.status(201).json({ shift });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: err.issues });
      return;
    }
    console.error("Create shift error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

shiftsRouter.patch("/:id", async (req, res) => {
  try {
    const existing = await prisma.shift.findFirst({
      where: { id: req.params.id, deletedAt: null }
    });

    if (!existing) {
      res.status(404).json({ error: "Shift not found" });
      return;
    }

    const body = updateShiftSchema.parse(req.body);
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.location !== undefined) data.location = body.location;
    if (body.startsAt !== undefined) data.startsAt = new Date(body.startsAt);
    if (body.endsAt !== undefined) data.endsAt = new Date(body.endsAt);
    if (body.capacity !== undefined) data.capacity = body.capacity;
    if (body.status !== undefined) data.status = body.status;

    const shift = await prisma.shift.update({
      where: { id: req.params.id },
      data
    });

    res.json({ shift });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: err.issues });
      return;
    }
    console.error("Update shift error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

shiftsRouter.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.shift.findFirst({
      where: { id: req.params.id, deletedAt: null }
    });

    if (!existing) {
      res.status(404).json({ error: "Shift not found" });
      return;
    }

    await prisma.shift.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() }
    });

    res.status(204).send();
  } catch (err) {
    console.error("Delete shift error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

shiftsRouter.post("/:id/contributors", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const shift = await prisma.shift.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: { contributorLinks: true }
    });

    if (!shift) {
      res.status(404).json({ error: "Shift not found" });
      return;
    }

    if (shift.contributorLinks.length >= shift.capacity) {
      res.status(409).json({ error: "Shift is at full capacity" });
      return;
    }

    const link = await prisma.shiftContributor.create({
      data: { shiftId: req.params.id, userId },
      include: { contributor: { select: { id: true, firstName: true, lastName: true, email: true } } }
    });

    res.status(201).json({ assignment: link });
  } catch (err) {
    console.error("Assign contributor error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

shiftsRouter.delete("/:id/contributors/:userId", async (req, res) => {
  try {
    await prisma.shiftContributor.delete({
      where: { shiftId_userId: { shiftId: req.params.id, userId: req.params.userId } }
    });
    res.status(204).send();
  } catch (err) {
    console.error("Remove contributor error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

shiftsRouter.post("/:id/signup", async (req, res) => {
  try {
    const userId = req.user!.userId;
    const shift = await prisma.shift.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: { contributorLinks: true }
    });

    if (!shift) {
      res.status(404).json({ error: "Shift not found" });
      return;
    }

    if (shift.status !== "OPEN") {
      res.status(409).json({ error: "Shift is not open for signups" });
      return;
    }

    const alreadySignedUp = shift.contributorLinks.some((l) => l.userId === userId);
    if (alreadySignedUp) {
      res.status(409).json({ error: "You are already signed up for this shift" });
      return;
    }

    if (shift.contributorLinks.length >= shift.capacity) {
      res.status(409).json({ error: "Shift is at full capacity" });
      return;
    }

    const link = await prisma.shiftContributor.create({
      data: { shiftId: req.params.id, userId },
      include: { contributor: { select: { id: true, firstName: true, lastName: true, email: true } } }
    });

    const updatedCount = shift.contributorLinks.length + 1;
    if (updatedCount >= shift.capacity) {
      await prisma.shift.update({
        where: { id: req.params.id },
        data: { status: "FILLED" }
      });
    }

    res.status(201).json({ signup: link });
  } catch (err) {
    console.error("Self-signup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

shiftsRouter.delete("/:id/signup", async (req, res) => {
  try {
    const userId = req.user!.userId;
    const shift = await prisma.shift.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: { contributorLinks: true }
    });

    if (!shift) {
      res.status(404).json({ error: "Shift not found" });
      return;
    }

    const existing = shift.contributorLinks.find((l) => l.userId === userId);
    if (!existing) {
      res.status(404).json({ error: "You are not signed up for this shift" });
      return;
    }

    await prisma.shiftContributor.delete({
      where: { shiftId_userId: { shiftId: req.params.id, userId } }
    });

    if (shift.status === "FILLED") {
      await prisma.shift.update({
        where: { id: req.params.id },
        data: { status: "OPEN" }
      });
    }

    res.status(204).send();
  } catch (err) {
    console.error("Cancel signup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

shiftsRouter.get("/my/signups", async (req, res) => {
  try {
    const userId = req.user!.userId;
    const assignments = await prisma.shiftContributor.findMany({
      where: { userId },
      include: {
        shift: {
          include: {
            tasks: { where: { deletedAt: null, assignedContributorId: userId }, select: { id: true, title: true, status: true } },
            contributorLinks: {
              include: { contributor: { select: { id: true, firstName: true, lastName: true } } }
            }
          }
        }
      },
      orderBy: { shift: { startsAt: "asc" } }
    });

    const shifts = assignments
      .map((a) => a.shift)
      .filter((s) => !s.deletedAt);

    res.json({ shifts });
  } catch (err) {
    console.error("My signups error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
