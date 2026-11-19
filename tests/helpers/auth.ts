import { type Page, type Browser, type BrowserContext, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

export const AUTH_DIR = path.join(__dirname, "../.auth");

export const CREDENTIALS = {
  admin: { email: "admin@example.com", password: "password123", role: "admin" },
  agent: { email: "agent@example.com", password: "password123", role: "agent" },
  customer: {
    email: "customer@example.com",
    password: "password123",
    role: "customer",
  },
} as const;

export function storageStatePath(role: keyof typeof CREDENTIALS): string {
  return path.join(AUTH_DIR, `${role}.json`);
}

export async function loginAndSaveState(
  context: BrowserContext,
  role: keyof typeof CREDENTIALS,
): Promise<void> {
  const page = await context.newPage();
  const { email, password } = CREDENTIALS[role];

  // Collect errors for debugging
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  try {
    await page.goto("/login", { waitUntil: "networkidle" });
    
    // Wait for form to be ready
    await page.waitForSelector('[placeholder="Email"]', { timeout: 10000 });
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    const expected = role === "customer" ? "**/tickets**" : "**/dashboard**";
    await page.waitForURL(expected, { timeout: 15000 });

    const state = await context.storageState();
    fs.mkdirSync(AUTH_DIR, { recursive: true });
    fs.writeFileSync(storageStatePath(role), JSON.stringify(state));

    await page.close();
  } catch (error) {
    console.error(`\n❌ Login failed for ${role}:`);
    console.error(`Current URL: ${page.url()}`);
    console.error(`Errors: ${errors.join("\n")}`);
    if (errors.length === 0) {
      console.error("No page errors captured. Check if the page loaded correctly.");
    }
    await page.screenshot({ path: `test-results/login-failed-${role}.png` });
    await page.close();
    throw error;
  }
}

export async function getLoggedInPage(
  browser: Browser,
  role: keyof typeof CREDENTIALS,
): Promise<Page> {
  const context = await browser.newContext({
    storageState: storageStatePath(role),
  });
  return await context.newPage();
}

export async function assertNoRuntimeErrors(page: Page): Promise<void> {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (
      msg.type() === "error" &&
      !msg.text().includes("favicon") &&
      !msg.text().includes("WebSocket")
    ) {
      errors.push(msg.text());
    }
  });
  expect(errors).toEqual([]);
}