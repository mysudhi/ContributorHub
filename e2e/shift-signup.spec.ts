import { test, expect } from "@playwright/test";

const API = "http://localhost:4000";

let token: string;
let orgId: string;
let shiftId: string;

test.describe.serial("Contributor self-service shift signup flow", () => {
  test("setup: register user and create org + shift via API", async ({ request }) => {
    const regRes = await request.post(`${API}/api/auth/register`, {
      data: { email: "signup-test@test.com", password: "password123", firstName: "Signup", lastName: "Tester" }
    });
    const regBody = await regRes.json();
    if (regRes.ok()) {
      token = regBody.token;
    } else {
      const loginRes = await request.post(`${API}/api/auth/login`, {
        data: { email: "signup-test@test.com", password: "password123" }
      });
      const loginBody = await loginRes.json();
      token = loginBody.token;
    }
    expect(token).toBeTruthy();

    const orgRes = await request.post(`${API}/api/shifts`, {
      headers: { Authorization: `Bearer ${token}`, "x-org-id": "e2e-org-placeholder" },
      data: {
        title: "E2E Test Shift",
        description: "A shift for E2E testing",
        location: "Test Location",
        startsAt: "2026-08-01T09:00:00Z",
        endsAt: "2026-08-01T12:00:00Z",
        capacity: 3,
        status: "OPEN"
      }
    });

    if (orgRes.ok()) {
      const shiftBody = await orgRes.json();
      shiftId = shiftBody.shift.id;
    }
  });

  test("GET /api/shifts?status=OPEN returns open shifts", async ({ request }) => {
    const res = await request.get(`${API}/api/shifts?status=OPEN`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.shifts).toBeDefined();
    expect(Array.isArray(body.shifts)).toBe(true);
  });

  test("GET /api/shifts/my/signups returns empty initially", async ({ request }) => {
    const res = await request.get(`${API}/api/shifts/my/signups`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.shifts).toBeDefined();
  });

  test("POST /api/shifts/:id/signup signs up for a shift", async ({ request }) => {
    test.skip(!shiftId, "No shift created in setup");
    const res = await request.post(`${API}/api/shifts/${shiftId}/signup`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.signup).toBeDefined();
  });

  test("POST /api/shifts/:id/signup rejects duplicate signup", async ({ request }) => {
    test.skip(!shiftId, "No shift created in setup");
    const res = await request.post(`${API}/api/shifts/${shiftId}/signup`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("already signed up");
  });

  test("GET /api/shifts/my/signups includes the shift after signup", async ({ request }) => {
    test.skip(!shiftId, "No shift created in setup");
    const res = await request.get(`${API}/api/shifts/my/signups`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const found = body.shifts.some((s: { id: string }) => s.id === shiftId);
    expect(found).toBe(true);
  });

  test("DELETE /api/shifts/:id/signup cancels the signup", async ({ request }) => {
    test.skip(!shiftId, "No shift created in setup");
    const res = await request.delete(`${API}/api/shifts/${shiftId}/signup`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(res.status()).toBe(204);
  });

  test("DELETE /api/shifts/:id/signup returns 404 when not signed up", async ({ request }) => {
    test.skip(!shiftId, "No shift created in setup");
    const res = await request.delete(`${API}/api/shifts/${shiftId}/signup`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("not signed up");
  });

  test("POST /api/shifts/:id/signup returns 404 for non-existent shift", async ({ request }) => {
    const res = await request.post(`${API}/api/shifts/nonexistent-shift-id/signup`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(res.status()).toBe(404);
  });

  test("signup requires authentication", async ({ request }) => {
    const res = await request.post(`${API}/api/shifts/any-id/signup`);
    expect(res.status()).toBe(401);
  });
});
