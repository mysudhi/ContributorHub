import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import { shiftsRouter } from "../routes/shifts.js";
import { signToken } from "../auth/jwt.js";

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.tenant = { organizationId: "test-org", userId: "test-user" };
    next();
  });
  app.use("/api/shifts", shiftsRouter);
  return app;
}

const token = signToken({ userId: "user-1", email: "user@test.com", role: "Contributor" });
const auth = { Authorization: `Bearer ${token}` };

describe("Self-service shift signup", () => {
  describe("POST /api/shifts/:id/signup", () => {
    it("returns 401 without auth token", async () => {
      const app = createTestApp();
      const res = await request(app).post("/api/shifts/some-id/signup");
      expect(res.status).toBe(401);
    });

    it("returns 404 for non-existent shift", async () => {
      const app = createTestApp();
      const res = await request(app).post("/api/shifts/nonexistent/signup").set(auth);
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Shift not found");
    });
  });

  describe("DELETE /api/shifts/:id/signup", () => {
    it("returns 401 without auth token", async () => {
      const app = createTestApp();
      const res = await request(app).delete("/api/shifts/some-id/signup");
      expect(res.status).toBe(401);
    });

    it("returns 404 for non-existent shift", async () => {
      const app = createTestApp();
      const res = await request(app).delete("/api/shifts/nonexistent/signup").set(auth);
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Shift not found");
    });
  });

  describe("GET /api/shifts/my/signups", () => {
    it("returns 401 without auth token", async () => {
      const app = createTestApp();
      const res = await request(app).get("/api/shifts/my/signups");
      expect(res.status).toBe(401);
    });

    it("returns an array of shifts", async () => {
      const app = createTestApp();
      const res = await request(app).get("/api/shifts/my/signups").set(auth);
      expect(res.status).toBe(200);
      expect(res.body.shifts).toBeDefined();
      expect(Array.isArray(res.body.shifts)).toBe(true);
    });
  });
});
