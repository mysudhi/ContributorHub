import { test, expect } from "@playwright/test";

test.describe("Frontend - Page Load", () => {
  test("loads the application successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ContributorHub/i);
  });

  test("returns HTTP 200", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
  });

  test("renders the root element", async ({ page }) => {
    await page.goto("/");
    const root = page.locator("#root");
    await expect(root).toBeAttached();
  });
});

test.describe("Frontend - Login Page", () => {
  test("displays the Welcome back heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Welcome back")).toBeVisible();
  });

  test("displays email and password fields", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder("Email address")).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });

  test("displays the Sign in button", async ({ page }) => {
    await page.goto("/");
    const button = page.getByRole("button", { name: /sign in/i });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
  });
});

test.describe("Frontend - Desktop Header", () => {
  test("displays ContributorHub branding", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "ContributorHub" })).toBeAttached();
  });
});

test.describe("Frontend - Mobile Tab Bar", () => {
  test("has Schedule, Shifts, and Profile tabs when authenticated", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Schedule" })).toBeAttached();
    await expect(page.getByRole("button", { name: "Shifts" })).toBeAttached();
    await expect(page.getByRole("button", { name: "Profile" })).toBeAttached();
  });
});

test.describe("Frontend - Responsive Layout", () => {
  test("shows desktop header on wide viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    const header = page.locator("header");
    await expect(header).toBeAttached();
  });

  test("renders mobile tab bar on narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const nav = page.getByLabel("Primary navigation");
    await expect(nav).toBeVisible();
  });
});
