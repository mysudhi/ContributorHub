import { test, expect } from "@playwright/test";

const API_BASE = "http://localhost:4000";

test.describe("Full Stack - Frontend and Backend Integration", () => {
  test("frontend and backend are both reachable", async ({ page, request }) => {
    const frontendResponse = await page.goto("/");
    expect(frontendResponse?.status()).toBe(200);

    const backendResponse = await request.get(`${API_BASE}/health`);
    expect(backendResponse.status()).toBe(200);
  });

  test("frontend renders login page when not authenticated", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("page loads quickly (under 3 seconds)", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    await expect(page.getByText("Welcome back")).toBeVisible();
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(3000);
  });

  test("page has no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForTimeout(1000);

    expect(errors).toHaveLength(0);
  });
});
