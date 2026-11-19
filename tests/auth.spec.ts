import { test, expect } from "@playwright/test";

const ROLES = [
  { email: "admin@example.com", password: "password123", expected: "/dashboard" },
  { email: "agent@example.com", password: "password123", expected: "/dashboard" },
  { email: "customer@example.com", password: "password123", expected: "/tickets" },
];

for (const { email, password, expected } of ROLES) {
  test(`${email} can login and reach ${expected}`, async ({ page }) => {
    await page.goto("/login");

    // Fill login form
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    // Wait for redirect to expected page
    await page.waitForURL(`**${expected}**`);
    expect(page.url()).toContain(expected);

    // Verify no runtime errors
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    // Navigate around to trigger potential issues
    await page.goto("/tickets");
    await page.goto("/tickets/new");
    if (expected === "/dashboard") {
      await page.goto("/dashboard");
    }

    expect(errors).toEqual([]);
  });
}

test("admin cannot deactivate themselves", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("admin@example.com");
  await page.getByPlaceholder("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard**");

  await page.goto("/admin/users");

  // Admin's own row should show "You" instead of toggle button
  const selfRow = page.locator("tr", { has: page.getByText("admin@example.com") });
  await expect(selfRow.getByText("You")).toBeVisible();

  // Other users should still have toggle buttons
  const otherRow = page.locator("tr", { has: page.getByText("agent@example.com") });
  await expect(otherRow.getByRole("button", { name: /Active|Inactive/ })).toBeVisible();
});