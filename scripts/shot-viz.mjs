import { chromium } from "playwright-core";
import { mkdirSync, copyFileSync } from "fs";

mkdirSync("/tmp/viz-shots", { recursive: true });
mkdirSync("/opt/cursor/artifacts/screenshots", { recursive: true });

const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
});

const page = await browser.newPage({ viewport: { width: 1400, height: 960 } });
await page.goto("http://localhost:3000/wycena-inwestor", {
  waitUntil: "networkidle",
  timeout: 45000,
});
await page.waitForSelector("text=Podgląd budynku", { timeout: 15000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: "/tmp/viz-shots/wizard-iso.png" });

await page.getByRole("button", { name: /Kopertowy/i }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: "/tmp/viz-shots/wizard-hip.png" });

await page.getByRole("button", { name: "Przekrój" }).click();
await page.waitForTimeout(700);
await page.screenshot({ path: "/tmp/viz-shots/wizard-section.png" });

await page.getByRole("button", { name: /Jednospadowy/i }).click();
await page.getByRole("button", { name: "3D", exact: true }).click();
await page.waitForTimeout(700);
await page.screenshot({ path: "/tmp/viz-shots/wizard-mono.png" });

await page.getByRole("button", { name: /Płaski/i }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: "/tmp/viz-shots/wizard-flat.png" });

// Change dimensions to show overlay updates
await page.locator('input[type="number"]').nth(0).fill("18");
await page.locator('input[type="number"]').nth(1).fill("10");
await page.waitForTimeout(400);
await page.screenshot({ path: "/tmp/viz-shots/wizard-dims.png" });

for (const name of [
  "wizard-iso",
  "wizard-hip",
  "wizard-section",
  "wizard-mono",
  "wizard-flat",
  "wizard-dims",
]) {
  copyFileSync(
    `/tmp/viz-shots/${name}.png`,
    `/opt/cursor/artifacts/screenshots/${name}.png`
  );
}

await browser.close();
console.log("OK shots");
