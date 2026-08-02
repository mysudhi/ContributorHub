import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import { adminRouter } from "../routes/admin.js";
import { signToken } from "../auth/jwt.js";

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.tenant = { organizationId: "test-org" };
    next();
  });
  app.use("/api/admin", adminRouter);
  return app;
}

const adminToken = signToken({ userId: "admin-1", email: "admin@test.com", role: "OrgAdmin" });
const contributorToken = signToken({ userId: "user-1", email: "user@test.com", role: "Contributor" });
const superAdminToken = signToken({ userId: "super-1", email: "super@test.com", role: "SuperAdmin" });

describe("Admin Analytics API", () => {
  it("returns 401 without auth token", async () => {
    const app = createTestApp();
    const res = await request(app).get("/api/admin/analytics");
    expect(res.status).toBe(401);
  });

  it("returns 403 for Contributor role", async () => {
    const app = createTestApp();
    const res = await request(app)
      .get("/api/admin/analytics")
      .set("Authorization", `Bearer ${contributorToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Admin access required");
  });

  it("returns 200 for OrgAdmin role", async () => {
    const app = createTestApp();
    const res = await request(app)
      .get("/api/admin/analytics")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.overview).toBeDefined();
    expect(res.body.shifts).toBeDefined();
    expect(res.body.tasks).toBeDefined();
  });

  it("returns 200 for SuperAdmin role", async () => {
    const app = createTestApp();
    const res = await request(app)
      .get("/api/admin/analytics")
      .set("Authorization", `Bearer ${superAdminToken}`);
    expect(res.status).toBe(200);
  });

  it("returns correct analytics structure", async () => {
    const app = createTestApp();
    const res = await request(app)
      .get("/api/admin/analytics")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.body.overview).toEqual(expect.objectContaining({
      totalContributors: expect.any(Number),
      activeContributors: expect.any(Number),
      totalShifts: expect.any(Number),
      totalTasks: expect.any(Number),
      totalSignups: expect.any(Number),
      recentSignups: expect.any(Number)
    }));
    expect(res.body.shifts).toEqual(expect.objectContaining({
      open: expect.any(Number),
      filled: expect.any(Number),
      cancelled: expect.any(Number),
      draft: expect.any(Number),
      fillRate: expect.any(Number)
    }));
    expect(res.body.tasks).toEqual(expect.objectContaining({
      todo: expect.any(Number),
      inProgress: expect.any(Number),
      done: expect.any(Number),
      completionRate: expect.any(Number)
    }));
    expect(Array.isArray(res.body.upcomingShifts)).toBe(true);
    expect(Array.isArray(res.body.recentActivity)).toBe(true);
  });

  it("adminRequired middleware rejects missing auth", async () => {
    const app = createTestApp();
    const res = await request(app).get("/api/admin/analytics");
    expect(res.status).toBe(401);
  });
});
