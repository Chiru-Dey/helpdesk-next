import { test, expect } from "@playwright/test";

test("no hydration mismatches on login page", async ({ page }) => {
  const hydrationErrors: string[] = [];

  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("hydration") || text.includes("Hydration failed")) {
      hydrationErrors.push(text);
    }
  });

  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  // Give React time to hydrate
  await page.waitForTimeout(500);

  expect(hydrationErrors).toEqual([]);
});

test("all authenticated pages load without runtime errors", async ({ page }) => {
  const errors: string[] = [];

  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error" && !msg.text().includes("favicon")) {
      errors.push(msg.text());
    }
  });

  // Login
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("admin@example.com");
  await page.getByPlaceholder("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");

  // Visit every admin page
  const pages = ["/dashboard", "/tickets", "/tickets/new", "/admin/users", "/admin/categories"];
  for (const path of pages) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
  }

  expect(errors).toEqual([]);
});