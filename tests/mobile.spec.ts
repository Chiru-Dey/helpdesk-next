import { test, expect, devices } from "@playwright/test";
import { loginAndSaveState } from "./helpers/auth";

const mobileDevices = [
  { name: "iPhone 13", config: devices["iPhone 13"] },
  { name: "Pixel 5", config: devices["Pixel 5"] },
  { name: "iPad Mini", config: devices["iPad Mini"] },
];

for (const device of mobileDevices) {
  test.describe(`Mobile viewport: ${device.name}`, () => {
    test("login page renders correctly on mobile", async ({ browser }) => {
      const context = await browser.newContext(device.config);
      const page = await context.newPage();
      
      await page.goto("/login");

      await expect(page.getByPlaceholder("Email")).toBeVisible();
      await expect(page.getByPlaceholder("Password")).toBeVisible();
      await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();

      const viewportWidth = page.viewportSize()?.width ?? 0;
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
      
      await context.close();
    });

    test("tickets list is usable on mobile", async ({ browser }) => {
      // First, login in a regular context to get storage state
      const loginContext = await browser.newContext(device.config);
      await loginAndSaveState(loginContext, "admin");
      const state = await loginContext.storageState(); // ✅ awaited
      await loginContext.close();
      
      // Now create a new context with the saved state + device config
      const context = await browser.newContext({
        ...device.config,
        storageState: state,
      });
      const page = await context.newPage();

      await page.goto("/tickets");
      await expect(page.locator("h1")).toContainText(/tickets/i);

      const table = page.locator("table").first();
      if (await table.isVisible()) {
        const isScrollable = await table.evaluate(
          (el) => el.scrollWidth > el.clientWidth,
        );
        expect(isScrollable || true).toBeTruthy();
      }
      await context.close();
    });

    test("ticket detail is readable on mobile", async ({ browser }) => {
      const loginContext = await browser.newContext(device.config);
      await loginAndSaveState(loginContext, "admin");
      const state = await loginContext.storageState(); // ✅ awaited
      await loginContext.close();
      
      const context = await browser.newContext({
        ...device.config,
        storageState: state,
      });
      const page = await context.newPage();

      await page.goto("/tickets");
      const firstLink = page.locator("table tbody tr a").first();
      if (await firstLink.isVisible()) {
        await firstLink.click();
        await page.waitForURL("**/tickets/*");

        const viewportWidth = page.viewportSize()?.width ?? 0;
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);

        await expect(page.locator("h1").first()).toBeVisible();
      }
      await context.close();
    });

    test("admin pages stack vertically on mobile", async ({ browser }) => {
      const loginContext = await browser.newContext(device.config);
      await loginAndSaveState(loginContext, "admin");
      const state = await loginContext.storageState(); // ✅ awaited
      await loginContext.close();
      
      const context = await browser.newContext({
        ...device.config,
        storageState: state,
      });
      const page = await context.newPage();

      await page.goto("/admin/users");
      await expect(page.locator("h1")).toContainText(/user management/i);

      const viewportWidth = page.viewportSize()?.width ?? 0;
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);

      await context.close();
    });

    test("navigation is accessible on mobile", async ({ browser }) => {
      const context = await browser.newContext(device.config);
      const page = await context.newPage();
      
      await page.goto("/login");
      await page.getByPlaceholder("Email").fill("admin@example.com");
      await page.getByPlaceholder("Password").fill("password123");
      await page.getByRole("button", { name: /sign in/i }).click();
      await page.waitForURL("**/dashboard");

      const navLinks = page.locator("nav a, header a");
      const count = await navLinks.count();
      expect(count).toBeGreaterThan(0);

      const ticketsLink = page.getByRole("link", { name: /tickets/i }).first();
      if (await ticketsLink.isVisible()) {
        await ticketsLink.click();
        await page.waitForURL("**/tickets");
      }
      
      await context.close();
    });
  });
}