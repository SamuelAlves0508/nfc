import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import fs from "node:fs";
const root = process.cwd(),
  out = process.env.TEST_OUTPUT || "test-results";
fs.mkdirSync(out, { recursive: true });
if (fs.existsSync(".next/dev/lock")) fs.unlinkSync(".next/dev/lock");
const server = spawn(
  "node",
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3012",
  ],
  { cwd: root, stdio: ["ignore", "pipe", "pipe"] },
);
let logs = "";
server.stdout.on("data", (d) => (logs += d));
server.stderr.on("data", (d) => (logs += d));
let browser;
try {
  await new Promise((resolve, reject) => {
    const start = Date.now();
    const poll = setInterval(() => {
      if (logs.includes("Ready")) {
        clearInterval(poll);
        resolve();
      } else if (Date.now() - start > 25000) {
        clearInterval(poll);
        reject(Error(logs));
      }
    }, 200);
  });
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    acceptDownloads: true,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:3012");
  await page.getByRole("heading", { name: "Vamos continuar?" }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${out}/home-390.png`, fullPage: true });
  await page
    .getByRole("button", { name: "Novo cliente", exact: false })
    .click();
  await page
    .getByLabel("Nome do cliente", { exact: true })
    .fill("Cliente de teste");
  await page.getByLabel("Empresa", { exact: true }).fill("Teste NFC");
  await page
    .getByRole("button", { name: "Salvar cliente", exact: true })
    .click();
  console.log("Client saved");
  await page.reload();
  await page
    .getByRole("button")
    .filter({ hasText: "Cliente de teste" })
    .first()
    .waitFor();
  await page
    .locator(".bottom-nav")
    .getByRole("button", { name: "Criar", exact: true })
    .click();
  await page
    .locator("dialog")
    .getByRole("button", { name: "Nova placa" })
    .click();
  await page
    .getByLabel("1. Cliente", { exact: true })
    .selectOption({ label: "Cliente de teste" });
  await page
    .getByLabel("Nome da placa", { exact: true })
    .fill("Placa de teste");
  await page
    .getByLabel("3. Link de destino", { exact: true })
    .fill("https://example.com/test");
  await page.getByRole("button", { name: "Salvar placa", exact: true }).click();
  console.log("Plate saved");
  await page
    .getByRole("heading", { name: "Placa de teste", exact: true })
    .waitFor();
  await page
    .locator(".bottom-nav")
    .getByRole("button", { name: "Início", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Gerar QR", exact: false })
    .first()
    .click();
  await page.locator(".qr-art>svg").waitFor();
  console.log("QR rendered");
  await page.getByRole("button", { name: "Testar QR", exact: true }).click();
  await page
    .getByText("QR decodificado. Conteúdo confirmado.", { exact: true })
    .waitFor({ timeout: 30000 });
  await page.screenshot({ path: `${out}/qr-390.png`, fullPage: true });
  await page.getByRole("tab", { name: "02 Design" }).click();
  await page.getByText("Formas do QR", { exact: true }).click();
  await page.getByRole("button", { name: "Pontos", exact: true }).click();
  await page.getByText("Logo central", { exact: true }).click();
  await page.getByLabel("Logo", { exact: true }).selectOption("Instagram");
  await page.getByRole("button", { name: "Testar QR", exact: true }).click();
  await page
    .getByText("QR decodificado. Conteúdo confirmado.", { exact: true })
    .waitFor({ timeout: 30000 });
  await page.getByRole("tab", { name: "03 Finalizar" }).click();
  for (const format of ["PNG", "SVG", "JPG", "PDF"]) {
    await page.getByLabel("Formato", { exact: true }).selectOption(format);
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: `Baixar ${format}`, exact: true })
      .click();
    await (await download).saveAs(`${out}/export.${format.toLowerCase()}`);
  }
  const printDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "PDF para gráfica — 10 × 12 cm", exact: true })
    .click();
  await (await printDownload).saveAs(`${out}/plate-10x12.pdf`);
  const results = [];
  for (const width of [360, 375, 390, 393, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width >= 768 ? 1000 : 844 });
    for (const view of ["home", "clients", "plates", "qr", "more"]) {
      await page.goto(`http://127.0.0.1:3012/#${view}`);
      await page.waitForTimeout(view === "qr" ? 900 : 180);
      const overflow = await page.evaluate(() => ({
        viewport: innerWidth,
        document: document.documentElement.scrollWidth,
        offenders: [...document.querySelectorAll("main *")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1);
          })
          .slice(0, 8)
          .map((el) => el.className),
      }));
      results.push({ width, view, ...overflow });
      if (width === 1440 || width === 390)
        await page.screenshot({
          path: `${out}/${view}-${width}-final.png`,
          fullPage: true,
        });
    }
  }
  await page
    .getByRole("button", { name: "Alternar tema", exact: true })
    .click();
  await page.waitForTimeout(260);
  await page.screenshot({ path: `${out}/dark-1440.png`, fullPage: true });
  await page.reload();
  await page.waitForFunction(
    () => document.documentElement.dataset.theme === "dark",
  );
  fs.writeFileSync(
    `${out}/results.json`,
    JSON.stringify({ errors, results }, null, 2),
  );
  console.log(
    JSON.stringify(
      { errors, overflow: results.filter((r) => r.document > r.viewport) },
      null,
      2,
    ),
  );
  if (errors.length || results.some((r) => r.document > r.viewport))
    throw Error("Browser issues found");
} catch (e) {
  console.error(e);
  console.error(logs.slice(-4000));
  process.exitCode = 1;
} finally {
  await browser?.close();
  server.kill();
}
