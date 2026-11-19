import { test, expect } from "@playwright/test";
import {
  loginAndSaveState,
  getLoggedInPage,
} from "./helpers/auth";

// Run once per worker to set up auth states
test.beforeAll(async ({ browser }) => {
  for (const role of ["admin", "agent", "customer"] as const) {
    const context = await browser.newContext();
    await loginAndSaveState(context, role);
    await context.close();
  }
});

test.describe("Customer ticket lifecycle", () => {
  test("customer creates a ticket and sees it in their list", async ({ browser }) => {
    const page = await getLoggedInPage(browser, "customer");
    const uniqueSubject = `Browser test ticket ${Date.now()}`;

    await page.goto("/tickets/new");
    // Wait for form to be ready
    await page.waitForSelector('[placeholder="Subject"]');
    await page.getByPlaceholder("Subject").fill(uniqueSubject);
    await page.getByPlaceholder("Description").fill("This is an automated E2E test ticket with enough text.");
    await page.getByRole("button", { name: /create/i }).click();

    // Wait for redirect
    await page.waitForURL("**/tickets/*", { timeout: 10000 });
    await expect(page.getByText(uniqueSubject)).toBeVisible({ timeout: 5000 });

    // Verify it appears in list
    await page.goto("/tickets");
    await expect(page.getByText(uniqueSubject)).toBeVisible({ timeout: 5000 });
    await page.close();
  });

  test("customer can post a comment on their ticket", async ({ browser }) => {
    const page = await getLoggedInPage(browser, "customer");

    await page.goto("/tickets");
    await page.locator("table tbody tr").first().click();
    await page.waitForURL("**/tickets/*");

    const commentText = `Customer comment ${Date.now()}`;
    await page
      .getByPlaceholder(/write a reply|comment/i)
      .fill(commentText);
    await page.getByRole("button", { name: /post comment/i }).click();

    await expect(page.getByText(commentText)).toBeVisible();
    await page.close();
  });
});

test.describe("Agent ticket management", () => {
  test("agent can transition ticket from open to in_progress", async ({
    browser,
  }) => {
    const page = await getLoggedInPage(browser, "agent");

    await page.goto("/tickets");
    // Find an open ticket
    const openTicket = page
      .locator("table tbody tr")
      .filter({ hasText: /open/i })
      .first();
    await openTicket.click();
    await page.waitForURL("**/tickets/*");

    // Transition to in_progress
    const transitionButton = page.getByRole("button", {
      name: /mark in progress|→ in_progress/i,
    });
    await transitionButton.click();

    // Wait for UI update
    await expect(page.getByText(/in.progress/i)).toBeVisible();
    await page.close();
  });

  test("agent can transition in_progress to resolved", async ({ browser }) => {
    const page = await getLoggedInPage(browser, "agent");

    await page.goto("/tickets");
    const inProgressTicket = page
      .locator("table tbody tr")
      .filter({ hasText: /in.progress/i })
      .first();
    await inProgressTicket.click();
    await page.waitForURL("**/tickets/*");

    const resolveButton = page.getByRole("button", {
      name: /mark resolved|→ resolved/i,
    });
    if (await resolveButton.isVisible()) {
      await resolveButton.click();
      await expect(page.getByText(/resolved/i)).toBeVisible();
    }
    await page.close();
  });
});

test.describe("Admin CRUD operations", () => {
  test("admin can create a new user", async ({ browser }) => {
    const page = await getLoggedInPage(browser, "admin");

    const uniqueEmail = `testuser${Date.now()}@example.com`;

    await page.goto("/admin/users");
    await page.getByRole("button", { name: /add user/i }).click();
    await page.getByPlaceholder("Name").fill("Test User");
    await page.getByPlaceholder("Email").fill(uniqueEmail);
    await page.getByPlaceholder("Password").fill("password123");
    await page.locator("select").last().selectOption("customer");
    await page.getByRole("button", { name: /create user/i }).click();

    // User appears in table
    await expect(page.getByText(uniqueEmail)).toBeVisible();
    await page.close();
  });

  test("admin can create a new category", async ({ browser }) => {
    const page = await getLoggedInPage(browser, "admin");

    const categoryName = `Category ${Date.now()}`;

    await page.goto("/admin/categories");
    await page.getByRole("button", { name: /add category/i }).click();
    await page.getByPlaceholder("Category name").fill(categoryName);
    await page.getByPlaceholder("Description").fill("E2E test category");
    await page.getByRole("button", { name: /create category/i }).click();

    await expect(page.getByText(categoryName)).toBeVisible();
    await page.close();
  });

  test("admin can deactivate a user", async ({ browser }) => {
    const page = await getLoggedInPage(browser, "admin");

    await page.goto("/admin/users");
    // Find a user that is Active and not "You"
    const targetUser = page
      .locator("table tbody tr")
      .filter({ has: page.getByRole("button", { name: /active/i }) })
      .first();

    const toggleButton = targetUser.getByRole("button", { name: /active/i });
    await toggleButton.click();
    // Should now show Inactive
    await expect(targetUser.getByRole("button", { name: /inactive/i })).toBeVisible();

    // Re-activate to clean up
    await targetUser.getByRole("button", { name: /inactive/i }).click();
    await expect(targetUser.getByRole("button", { name: /active/i })).toBeVisible();

    await page.close();
  });
});

test.describe("State machine enforcement", () => {
  test("invalid status transition returns 422", async ({ request }) => {
    // Login as agent
    const loginRes = await request.post("/api/auth/login", {
      data: { email: "agent@example.com", password: "password123" },
    });
    expect(loginRes.ok()).toBeTruthy();

    // Get an open ticket
    const listRes = await request.get(
      "/api/tickets?status=open&per_page=1",
    );
    const list = await listRes.json();
    if (list.items?.length === 0) return; // skip if no open tickets

    const ticketId = list.items[0].id;

    // Try invalid transition: open → closed (agent not allowed)
    const res = await request.post(`/api/tickets/${ticketId}/status`, {
      data: { status: "closed" },
    });
    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("unprocessable");
    expect(body.error.details?.allowed).toBeDefined();
  });
});