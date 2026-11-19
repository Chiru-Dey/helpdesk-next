import { test, expect } from "@playwright/test";
import { getLoggedInPage, loginAndSaveState } from "./helpers/auth";

test.beforeAll(async ({ browser }) => {
  for (const role of ["admin", "agent", "customer"] as const) {
    const context = await browser.newContext();
    await loginAndSaveState(context, role);
    await context.close();
  }
});

test.describe("Customer access restrictions", () => {
  test("customer cannot access /dashboard", async ({ browser }) => {
    const page = await getLoggedInPage(browser, "customer");
    await page.goto("/dashboard");
    await page.waitForURL("**/tickets");
    expect(page.url()).not.toContain("/dashboard");
    await page.close();
  });

  test("customer cannot access /admin/users", async ({ browser }) => {
    const page = await getLoggedInPage(browser, "customer");
    await page.goto("/admin/users");
    await page.waitForURL("**/tickets");
    expect(page.url()).not.toContain("/admin");
    await page.close();
  });

  test("customer cannot access /admin/categories", async ({ browser }) => {
    const page = await getLoggedInPage(browser, "customer");
    await page.goto("/admin/categories");
    await page.waitForURL("**/tickets");
    expect(page.url()).not.toContain("/admin");
    await page.close();
  });

  test("customer cannot change ticket status via API", async ({
    request,
  }) => {
    const loginRes = await request.post("/api/auth/login", {
      data: { email: "customer@example.com", password: "password123" },
    });
    expect(loginRes.ok()).toBeTruthy();

    const listRes = await request.get("/api/tickets?per_page=1");
    const list = await listRes.json();
    if (list.items?.length === 0) return;

    const res = await request.post(`/api/tickets/${list.items[0].id}/status`, {
      data: { status: "in_progress" },
    });
    expect(res.status()).toBe(403);
  });

  test("customer cannot delete tickets via API", async ({ request }) => {
    const loginRes = await request.post("/api/auth/login", {
      data: { email: "customer@example.com", password: "password123" },
    });
    expect(loginRes.ok()).toBeTruthy();

    const listRes = await request.get("/api/tickets?per_page=1");
    const list = await listRes.json();
    if (!list.items || list.items.length === 0) return;

    const res = await request.delete(`/api/tickets/${list.items[0].id}`);
    // Should be 403 (forbidden) or 404 (not found if scoped)
    expect([403, 404]).toContain(res.status());
  });
  
  test("customer cannot access admin API endpoints", async ({ request }) => {
    const loginRes = await request.post("/api/auth/login", {
      data: { email: "customer@example.com", password: "password123" },
    });
    expect(loginRes.ok()).toBeTruthy();

    const usersRes = await request.get("/api/users");
    expect(usersRes.status()).toBe(403);

    const categoriesCreateRes = await request.post("/api/categories", {
      data: { name: "Test" },
    });
    expect(categoriesCreateRes.status()).toBe(403);
  });
});

test.describe("Agent access restrictions", () => {
  test("agent cannot access /admin/users", async ({ browser }) => {
    const page = await getLoggedInPage(browser, "agent");
    await page.goto("/admin/users");
    await page.waitForURL("**/tickets");
    expect(page.url()).not.toContain("/admin");
    await page.close();
  });

  test("agent cannot access /admin/categories", async ({ browser }) => {
    const page = await getLoggedInPage(browser, "agent");
    await page.goto("/admin/categories");
    await page.waitForURL("**/tickets");
    expect(page.url()).not.toContain("/admin");
    await page.close();
  });

  test("agent cannot assign tickets via API", async ({ request }) => {
    const loginRes = await request.post("/api/auth/login", {
      data: { email: "agent@example.com", password: "password123" },
    });
    expect(loginRes.ok()).toBeTruthy();

    const listRes = await request.get("/api/tickets?per_page=1");
    const list = await listRes.json();
    if (list.items?.length === 0) return;

    const res = await request.post(`/api/tickets/${list.items[0].id}/assign`, {
      data: { assignee_id: 1 },
    });
    expect(res.status()).toBe(403);
  });

  test("agent cannot delete tickets via API", async ({ request }) => {
    const loginRes = await request.post("/api/auth/login", {
      data: { email: "agent@example.com", password: "password123" },
    });
    expect(loginRes.ok()).toBeTruthy();

    const listRes = await request.get("/api/tickets?per_page=1");
    const list = await listRes.json();
    if (list.items?.length === 0) return;

    const res = await request.delete(`/api/tickets/${list.items[0].id}`);
    expect(res.status()).toBe(403);
  });

  test("agent can access /dashboard", async ({ browser }) => {
    const page = await getLoggedInPage(browser, "agent");
    await page.goto("/dashboard");
    await expect(page.locator("h1")).toContainText(/dashboard/i);
    await page.close();
  });
});

test.describe("Admin privileges", () => {
  test("admin can access all routes", async ({ browser }) => {
    const page = await getLoggedInPage(browser, "admin");

    const routes = [
      "/dashboard",
      "/tickets",
      "/tickets/new",
      "/admin/users",
      "/admin/categories",
    ];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain(route);
    }
    await page.close();
  });

  test("admin can access all admin API endpoints", async ({ request }) => {
    const loginRes = await request.post("/api/auth/login", {
      data: { email: "admin@example.com", password: "password123" },
    });
    expect(loginRes.ok()).toBeTruthy();

    const usersRes = await request.get("/api/users");
    expect(usersRes.ok()).toBeTruthy();

    const categoriesRes = await request.get("/api/categories");
    expect(categoriesRes.ok()).toBeTruthy();

    const dashboardRes = await request.get("/api/dashboard");
    expect(dashboardRes.ok()).toBeTruthy();
  });
});

test.describe("Cross-user data isolation", () => {
  test("customer cannot see another customer's tickets", async ({
    request,
  }) => {
    // Create a second customer
    const regRes = await request.post("/api/auth/register", {
      data: {
        name: "Other Customer",
        email: `other${Date.now()}@example.com`,
        password: "password123",
      },
    });
    expect(regRes.status()).toBe(201);
    const newUser = await regRes.json();

    // Login as new customer, create ticket
    const loginRes = await request.post("/api/auth/login", {
      data: { email: newUser.email, password: "password123" },
    });
    expect(loginRes.ok()).toBeTruthy();

    const createRes = await request.post("/api/tickets", {
      data: {
        subject: `Private ticket ${Date.now()}`,
        description: "This should only be visible to the owner and staff",
      },
    });
    expect(createRes.status()).toBe(201);
    const ticket = await createRes.json();

    // Login as original customer
    const originalLogin = await request.post("/api/auth/login", {
      data: { email: "customer@example.com", password: "password123" },
    });
    expect(originalLogin.ok()).toBeTruthy();

    // Try to access the other customer's ticket
    const accessRes = await request.get(`/api/tickets/${ticket.id}`);
    expect(accessRes.status()).toBe(404);
  });
});