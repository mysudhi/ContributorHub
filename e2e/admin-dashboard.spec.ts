import { test, expect } from "@playwright/test";

const API = "http://localhost:4000";

test.describe("Admin Dashboard", () => {
  test("GET /api/admin/analytics returns 401 without auth", async ({ request }) => {
    const res = await request.get(`${API}/api/admin/analytics`);
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/analytics returns 403 for Contributor role", async ({ request }) => {
    const regRes = await request.post(`${API}/api/auth/register`, {
      data: { email: "contrib-admin-test@test.com", password: "password123", firstName: "Contrib", lastName: "Test" }
    });
    let token: string;
    if (regRes.ok()) {
      token = (await regRes.json()).token;
    } else {
      const loginRes = await request.post(`${API}/api/auth/login`, {
        data: { email: "contrib-admin-test@test.com", password: "password123" }
      });
      token = (await loginRes.json()).token;
    }

    const res = await request.get(`${API}/api/admin/analytics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(res.status()).toBe(403);
  });

  test("GET /api/admin/analytics returns data for OrgAdmin", async ({ request }) => {
    const regRes = await request.post(`${API}/api/auth/register`, {
      data: { email: "orgadmin-e2e@test.com", password: "password123", firstName: "Org", lastName: "Admin" }
    });
    let token: string;
    if (regRes.ok()) {
      token = (await regRes.json()).token;
    } else {
      const loginRes = await request.post(`${API}/api/auth/login`, {
        data: { email: "orgadmin-e2e@test.com", password: "password123" }
      });
      token = (await loginRes.json()).token;
    }

    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    await prisma.user.updateMany({
      where: { email: "orgadmin-e2e@test.com" },
      data: { role: "OrgAdmin" }
    });
    await prisma.$disconnect();

    const loginRes = await request.post(`${API}/api/auth/login`, {
      data: { email: "orgadmin-e2e@test.com", password: "password123" }
    });
    token = (await loginRes.json()).token;

    const res = await request.get(`${API}/api/admin/analytics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.overview).toBeDefined();
    expect(body.overview.totalContributors).toBeGreaterThanOrEqual(0);
    expect(body.shifts).toBeDefined();
    expect(body.shifts.fillRate).toBeGreaterThanOrEqual(0);
    expect(body.tasks).toBeDefined();
    expect(Array.isArray(body.upcomingShifts)).toBe(true);
    expect(Array.isArray(body.recentActivity)).toBe(true);
  });
});
