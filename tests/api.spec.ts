import { test, expect } from "@playwright/test";

test("all API endpoints return expected status codes", async ({ request }) => {
  // Login and get cookies
  const loginRes = await request.post("/api/auth/login", {
    data: { email: "admin@example.com", password: "password123" },
  });
  expect(loginRes.ok()).toBeTruthy();

  // Test GET endpoints
  const endpoints = [
    "/api/tickets",
    "/api/categories",
    "/api/users",
    "/api/dashboard",
    "/api/auth/me",
  ];

  for (const endpoint of endpoints) {
    const res = await request.get(endpoint);
    expect(res.ok(), `${endpoint} should return 200`).toBeTruthy();
  }
});

test("revalidation does not cause 500 errors", async ({ request }) => {
  // Login
  await request.post("/api/auth/login", {
    data: { email: "admin@example.com", password: "password123" },
  });

  // Create a category (this triggers revalidateTag)
  const createRes = await request.post("/api/categories", {
    data: { name: `Test ${Date.now()}`, description: "test" },
  });
  expect(createRes.status()).toBe(201);

  // Create a user (this also triggers revalidateTag)
  const userRes = await request.post("/api/users", {
    data: {
      name: `Test User ${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: "password123",
      role: "customer",
    },
  });
  expect(userRes.status()).toBe(201);
});