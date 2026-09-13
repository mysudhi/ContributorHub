import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";

vi.mock("../email/email-service.js", () => ({
  getEmailEnabled: vi.fn(() => false),
  verifyConnection: vi.fn(async () => false),
  sendEmail: vi.fn(async () => false),
  initEmailService: vi.fn(),
  _resetForTesting: vi.fn(),
}));

vi.mock("../email/reminder-scheduler.js", () => ({
  isSchedulerRunning: vi.fn(() => false),
  startReminderScheduler: vi.fn(),
  stopReminderScheduler: vi.fn(),
}));

vi.mock("../email/notification-service.js", () => ({
  sendShiftReminders: vi.fn(async () => ({ sent: 0, failed: 0 })),
  notifyShiftAssignment: vi.fn(async () => false),
  notifyShiftSignupConfirmation: vi.fn(async () => false),
  notifyShiftCancellation: vi.fn(async () => false),
  notifyTaskAssignment: vi.fn(async () => false),
}));

const SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";

function makeToken(role: string = "Contributor") {
  return jwt.sign({ userId: "user-1", email: "test@example.com", role }, SECRET, { expiresIn: "1h" });
}

const app = createApp();

describe("Notification Routes", () => {
  describe("GET /api/notifications/status", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app).get("/api/notifications/status");
      expect(res.status).toBe(401);
    });

    it("returns status for authenticated user", async () => {
      const res = await request(app)
        .get("/api/notifications/status")
        .set("Authorization", `Bearer ${makeToken()}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("emailEnabled");
      expect(res.body).toHaveProperty("schedulerRunning");
    });
  });

  describe("GET /api/notifications/verify", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app).get("/api/notifications/verify");
      expect(res.status).toBe(401);
    });

    it("returns 403 for non-admin", async () => {
      const res = await request(app)
        .get("/api/notifications/verify")
        .set("Authorization", `Bearer ${makeToken("Contributor")}`);

      expect(res.status).toBe(403);
    });

    it("returns connection status for admin", async () => {
      const res = await request(app)
        .get("/api/notifications/verify")
        .set("Authorization", `Bearer ${makeToken("OrgAdmin")}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("connected");
      expect(res.body).toHaveProperty("reason");
    });
  });

  describe("POST /api/notifications/send-reminders", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app).post("/api/notifications/send-reminders");
      expect(res.status).toBe(401);
    });

    it("returns 403 for non-admin", async () => {
      const res = await request(app)
        .post("/api/notifications/send-reminders")
        .set("Authorization", `Bearer ${makeToken("Contributor")}`);

      expect(res.status).toBe(403);
    });

    it("returns 400 when email is not configured", async () => {
      const res = await request(app)
        .post("/api/notifications/send-reminders")
        .set("Authorization", `Bearer ${makeToken("OrgAdmin")}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("not configured");
    });
  });
});
