import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import fs from "node:fs";
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
  { stdio: ["ignore", "pipe", "pipe"] },
);
let logs = "";
server.stdout.on("data", (d) => (logs += d));
server.stderr.on("data", (d) => (logs += d));
let browser;
const cases = [
  ["URL", { "Link de destino": "https://example.com/" }],
  ["Instagram", { "Usuário do Instagram": "andreiapaz_acessorios" }],
  [
    "WhatsApp",
    {
      "Telefone com país e DDD": "5543999999999",
      Mensagem: "Olá! Quero conhecer 🙂",
    },
  ],
  ["Google Avaliações", { "Ou use um Google Place ID": "ChIJTEST" }],
  ["Telefone", { "Telefone com país e DDD": "+5543999999999" }],
  [
    "E-mail",
    {
      "E-mail": "teste@example.com",
      Assunto: "Olá, conexão!",
      Mensagem: "Informações sobre a placa",
    },
  ],
  ["Texto", { "Seu texto": "Olá, João! Conexões à distância 🙂" }],
  [
    "Wi-Fi",
    { "Nome da rede (SSID)": "Minha Rede;Casa", Senha: "a:b;c,d\\test" },
  ],
  [
    "vCard",
    {
      "Nome completo": "João da Silva",
      Empresa: "Conexão NFC",
      "E-mail": "joao@example.com",
      Website: "https://example.com",
    },
  ],
  ["PDF", { "Link público do PDF": "https://example.com/document.pdf" }],
  ["Localização", { Latitude: "-23.27", Longitude: "-51.05" }],
  [
    "Evento",
    {
      "Título do evento": "Reunião com João",
      Início: "2026-11-01T10:00",
      Fim: "2026-11-01T11:00",
      Local: "Ibiporã, Paraná",
    },
  ],
];
try {
  await new Promise((r, j) => {
    const start = Date.now(),
      i = setInterval(() => {
        if (logs.includes("Ready")) {
          clearInterval(i);
          r();
        } else if (Date.now() - start > 25000) {
          clearInterval(i);
          j(Error(logs));
        }
      }, 200);
  });
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:3012/#qr");
  await page.locator(".qr-art>svg").waitFor();
  for (const [type, fields] of process.env.FINAL_ONLY ? [] : cases) {
    await page
      .locator(".type-grid")
      .getByRole("button", { name: type, exact: true })
      .click();
    for (const [label, value] of Object.entries(fields))
      await page
        .locator(".content-fields")
        .getByLabel(label, { exact: true })
        .fill(value);
    await page.getByRole("button", { name: "Testar QR", exact: true }).click();
    await page
      .getByText("QR decodificado. Conteúdo confirmado.", { exact: true })
      .waitFor();
    console.log(`${type}: decoded`);
  }
  await page
    .locator(".type-grid")
    .getByRole("button", { name: "URL", exact: true })
    .click();
  await page.getByRole("tab", { name: "02 Design" }).click();
  await page
    .getByLabel("Preenchimento", { exact: true })
    .selectOption("linear");
  await page.getByLabel("Segunda cor", { exact: true }).fill("#244788");
  await page.getByLabel("Terceira cor", { exact: true }).fill("#273c61");
  await page.getByText("Formas do QR", { exact: true }).click();
  for (const name of process.env.FINAL_ONLY
    ? ["Extra suave"]
    : [
        "Quadrado",
        "Arredondado",
        "Pontos",
        "Clássico",
        "Clássico suave",
        "Extra suave",
      ]) {
    await page
      .locator(".style-picker")
      .getByRole("button", { name, exact: true })
      .click();
    await page.getByRole("button", { name: "Testar QR", exact: true }).click();
    await page
      .getByText("QR decodificado. Conteúdo confirmado.", { exact: true })
      .waitFor();
    console.log(`Style ${name}: decoded`);
  }
  await page
    .getByLabel("Preenchimento", { exact: true })
    .selectOption("radial");
  await page.getByText("Moldura e margens", { exact: true }).click();
  await page.getByLabel("Moldura", { exact: true }).selectOption("Instagram");
  await page
    .getByLabel("Visualização", { exact: true })
    .selectOption("Placa Instagram");
  await page.getByRole("button", { name: "Testar QR", exact: true }).click();
  await page
    .getByText("QR decodificado. Conteúdo confirmado.", { exact: true })
    .waitFor();
  await page.getByText("Estilos salvos", { exact: true }).click();
  await page
    .getByRole("button", { name: "Salvar estilo atual", exact: true })
    .click();
  await page.getByLabel("Nome do estilo", { exact: true }).fill("Teste marca");
  await page
    .getByRole("button", { name: "Salvar estilo", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Duplicar Teste marca", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Teste marca · cópia", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Salvar QR", exact: true }).click();
  await page
    .getByLabel("Nome do QR", { exact: true })
    .fill("QR salvo no teste");
  await page
    .getByRole("button", { name: "Salvar no histórico", exact: true })
    .click();
  await page.reload();
  await page.getByText("QR salvo no teste", { exact: true }).waitFor();
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "All QR content, Unicode, styling, preset and history tests passed.",
  );
} catch (e) {
  console.error(e);
  console.error(logs.slice(-2000));
  process.exitCode = 1;
} finally {
  await browser?.close();
  server.kill();
}
