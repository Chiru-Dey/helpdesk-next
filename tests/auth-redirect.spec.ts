import { test, expect } from "@playwright/test";

test("unauthenticated users are redirected to login", async ({ page }) => {
  const protectedRoutes = [
    "/dashboard",
    "/tickets",
    "/tickets/new",
    "/admin/users",
    "/admin/categories",
  ];

  for (const route of protectedRoutes) {
    await page.goto(route);
    await page.waitForURL("**/login");
    expect(page.url()).toContain("/login");
  }
});

test("session persists across page navigations", async ({ page }) => {
  // Login
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("admin@example.com");
  await page.getByPlaceholder("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");

  // Navigate to multiple pages
  await page.goto("/tickets");
  await expect(page.locator("h1")).toContainText("Tickets");

  await page.goto("/admin/users");
  await expect(page.locator("h1")).toContainText("User Management");

  // Should still be logged in (no redirect to /login)
  expect(page.url()).not.toContain("/login");
});