import type { QRStyle } from "./data";
const NS = "http://www.w3.org/2000/svg";
function element(
  name: string,
  attrs: Record<string, string | number>,
  text?: string,
) {
  const e = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, String(v)));
  if (text) e.textContent = text;
  return e;
}
function logoSVG(name: string, white: boolean) {
  const bg = white ? '<rect width="64" height="64" rx="12" fill="white"/>' : "";
  const paths: Record<string, string> = {
    Instagram:
      '<rect x="13" y="13" width="38" height="38" rx="11" fill="none" stroke="#c13584" stroke-width="4"/><circle cx="32" cy="32" r="9" fill="none" stroke="#c13584" stroke-width="4"/><circle cx="44" cy="20" r="3" fill="#c13584"/>',
    WhatsApp:
      '<path d="M15 49l3-10a20 20 0 1 1 9 11z" fill="#25a65b"/><path d="M25 22q-4 8 6 16t12-2l-7-5-3 4-5-5 2-3z" fill="white"/>',
    Google:
      '<text x="32" y="46" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="42" fill="#4285f4">G</text>',
    Facebook:
      '<text x="32" y="50" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="54" fill="#1877f2">f</text>',
    Website:
      '<circle cx="32" cy="32" r="21" fill="none" stroke="#17243d" stroke-width="3"/><ellipse cx="32" cy="32" rx="9" ry="21" fill="none" stroke="#17243d" stroke-width="3"/><path d="M11 32h42M15 21h34M15 43h34" stroke="#17243d" stroke-width="3"/>',
  };
  return `data:image/svg+xml;base64,${btoa(`<svg xmlns="${NS}" width="64" height="64" viewBox="0 0 64 64">${bg}${paths[name] || ""}</svg>`)}`;
}
async function getLogo(s: QRStyle) {
  if (!s.logo) return "";
  if (s.logo === "NFC PRO") {
    const text = await fetch("/nfc-pro-icon.svg").then((r) => r.text());
    return `data:image/svg+xml;base64,${btoa(text)}`;
  }
  if (!s.logo.startsWith("data:")) return logoSVG(s.logo, s.logoWhite);
  if (!s.logoWhite) return s.logo;
  const img = await loadImage(s.logo);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, 256, 256);
  const scale = Math.min(224 / img.width, 224 / img.height);
  ctx.drawImage(
    img,
    (256 - img.width * scale) / 2,
    (256 - img.height * scale) / 2,
    img.width * scale,
    img.height * scale,
  );
  return canvas.toDataURL("image/png");
}
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Não foi possível carregar a imagem."));
    i.src = src;
  });
}
export async function renderQR(
  data: string,
  s: QRStyle,
): Promise<SVGSVGElement> {
  const [{ default: QRCodeStyling }, { default: qrGenerator }] =
    await Promise.all([import("qr-code-styling"), import("qrcode-generator")]);
  // The engine consumes byte strings; encode Unicode explicitly to preserve accents and emoji.
  const bytes = Array.from(new TextEncoder().encode(data), (b) =>
    String.fromCharCode(b),
  ).join("");
  const countQR = qrGenerator(0, "H");
  countQR.addData(bytes, "Byte");
  countQR.make();
  const count = countQR.getModuleCount();
  const margin = (400 * s.margin) / (count + 2 * s.margin);
  const colors = [s.color, s.color2, ...(s.color3 ? [s.color3] : [])];
  const qr = new QRCodeStyling({
    type: "svg",
    width: 400,
    height: 400,
    data: bytes,
    margin,
    qrOptions: { errorCorrectionLevel: "H", mode: "Byte" },
    dotsOptions: {
      type: s.dots,
      color: s.color,
      gradient:
        s.gradient === "solid"
          ? undefined
          : {
              type: s.gradient,
              rotation: (s.rotation * Math.PI) / 180,
              colorStops: colors.map((color, i) => ({
                color,
                offset: i / (colors.length - 1),
              })),
            },
    },
    cornersSquareOptions: { type: s.eye, color: s.eyeColor },
    cornersDotOptions: { type: s.center, color: s.centerColor },
    backgroundOptions: { color: s.transparent ? "transparent" : s.background },
    image: await getLogo(s),
    imageOptions: {
      imageSize: s.logoSize,
      margin: s.logoMargin,
      hideBackgroundDots: s.hideDots,
      saveAsBlob: true,
    },
  });
  const blob = (await qr.getRawData("svg")) as Blob;
  if (!blob) throw new Error("Não foi possível renderizar o QR.");
  const svg = new DOMParser().parseFromString(
    await blob.text(),
    "image/svg+xml",
  ).documentElement as unknown as SVGSVGElement;
  const plate = s.preview !== "QR isolado",
    framed = s.frame !== "Sem moldura";
  const w = 500,
    h = plate ? 600 : framed ? 550 : 500;
  const out = element("svg", {
    xmlns: NS,
    width: w,
    height: h,
    viewBox: `0 0 ${w} ${h}`,
  }) as SVGSVGElement;
  if (!s.transparent)
    out.append(element("rect", { width: w, height: h, fill: s.background }));
  if (plate) {
    out.append(
      element(
        "text",
        {
          x: 250,
          y: 60,
          "text-anchor": "middle",
          "font-family": "Arial, sans-serif",
          "font-size": 16,
          "font-weight": 700,
          fill: s.color,
        },
        s.preview === "Placa 10 × 12 cm"
          ? "CONECTE-SE"
          : s.preview.replace("Placa ", ""),
      ),
    );
    out.append(
      element(
        "text",
        {
          x: 250,
          y: 89,
          "text-anchor": "middle",
          "font-family": "Arial, sans-serif",
          "font-size": 12,
          fill: s.color,
        },
        "Aproxime o celular ou escaneie o QR",
      ),
    );
  }
  svg.setAttribute("x", "50");
  svg.setAttribute("y", plate ? "115" : "50");
  svg.setAttribute("width", "400");
  svg.setAttribute("height", "400");
  out.append(svg);
  if (framed) {
    out.append(
      element("rect", {
        x: 25,
        y: plate ? 105 : 25,
        width: 450,
        height: plate ? 480 : 500,
        rx: 18,
        fill: "none",
        stroke: s.color,
        "stroke-width": 2,
      }),
    );
  }
  if (framed || plate) {
    const t = element(
      "text",
      {
        x: 250,
        y: plate ? 555 : 495,
        "text-anchor": "middle",
        "font-family": "Arial, sans-serif",
        "font-size": 16,
        "font-weight": 700,
        fill: s.color,
      },
      s.cta || "APONTE A CÂMERA",
    );
    if (s.cta.length > 28) {
      t.setAttribute("textLength", "410");
      t.setAttribute("lengthAdjust", "spacingAndGlyphs");
    }
    out.append(t);
  }
  return out;
}
export async function rasterize(
  svg: SVGSVGElement,
  width: number,
  white = false,
) {
  const source = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(
    new Blob([source], { type: "image/svg+xml" }),
  );
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = Math.round(
      (width * Number(svg.getAttribute("height"))) /
        Number(svg.getAttribute("width")),
    );
    const ctx = canvas.getContext("2d")!;
    if (white) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}
export function contrast(a: string, b: string) {
  const lum = (s: string) => {
    const rgb = s.match(/\w\w/g)?.map((v) => parseInt(v, 16) / 255) || [
      1, 1, 1,
    ];
    const c = rgb.map((v) =>
      v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
    );
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const x = lum(a),
    y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
// PNG physical resolution metadata (pHYs), in pixels per metre.
export async function pngWithDPI(canvas: HTMLCanvasElement, dpi: number) {
  const blob = await new Promise<Blob>((r, j) =>
    canvas.toBlob(
      (b) => (b ? r(b) : j(new Error("Export impossible"))),
      "image/png",
    ),
  );
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const chunk = new Uint8Array(21);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, 9);
  chunk.set([112, 72, 89, 115], 4);
  view.setUint32(8, Math.round(dpi / 0.0254));
  view.setUint32(12, Math.round(dpi / 0.0254));
  chunk[16] = 1;
  let crc = 0xffffffff;
  for (const b of chunk.slice(4, 17)) {
    crc ^= b;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  view.setUint32(17, (crc ^ 0xffffffff) >>> 0);
  const out = new Uint8Array(bytes.length + chunk.length);
  out.set(bytes.slice(0, 33));
  out.set(chunk, 33);
  out.set(bytes.slice(33), 54);
  return new Blob([out], { type: "image/png" });
}
