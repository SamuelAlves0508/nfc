export type Client = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  instagram: string;
  whatsapp: string;
  googlePlaceId: string;
  googleReviewUrl: string;
  notes: string;
  createdAt: string;
  demo?: boolean;
};
export type Plate = {
  id: string;
  clientId: string;
  name: string;
  type: string;
  destination: string;
  status: "ativa" | "inativa" | "não configurada";
  nfc: boolean;
  qr: boolean;
  createdAt: string;
  lastAccess: string | null;
  scans: number | null;
  mode: "static" | "dynamic";
  slug?: string;
  demo?: boolean;
};
export type QRRecord = {
  id: string;
  name: string;
  data: string;
  clientId: string;
  createdAt: string;
};
export type Preset = { id: string; name: string; style: QRStyle };
export type QRStyle = {
  dots:
    | "square"
    | "rounded"
    | "dots"
    | "classy"
    | "classy-rounded"
    | "extra-rounded";
  eye: "square" | "dot" | "extra-rounded" | "classy";
  center: "square" | "dot" | "rounded";
  color: string;
  color2: string;
  color3: string;
  background: string;
  eyeColor: string;
  centerColor: string;
  gradient: "solid" | "linear" | "radial";
  rotation: number;
  transparent: boolean;
  logo: string;
  logoSize: number;
  logoMargin: number;
  logoWhite: boolean;
  hideDots: boolean;
  margin: number;
  frame: string;
  cta: string;
  preview: string;
  size: number;
};
export type Store = {
  version: 1;
  clients: Client[];
  plates: Plate[];
  history: QRRecord[];
  presets: Preset[];
  dark: boolean;
};
export const blankClient: Omit<Client, "id" | "createdAt"> = {
  name: "",
  company: "",
  phone: "",
  email: "",
  instagram: "",
  whatsapp: "",
  googlePlaceId: "",
  googleReviewUrl: "",
  notes: "",
};
const date = "2026-10-04T12:00:00.000Z";
export const initialStore: Store = {
  version: 1,
  dark: false,
  history: [],
  presets: [],
  clients: ["Andreia Paz", "Reuse Brechó", "Byfit Ibiporã"].map((name, i) => ({
    ...blankClient,
    id: `demo-${i}`,
    name,
    company: name,
    instagram: i === 0 ? "andreiapaz_acessorios" : "",
    createdAt: date,
    demo: true,
  })),
  plates: [
    {
      id: "demo-p",
      clientId: "demo-0",
      name: "Instagram · Andreia",
      type: "Instagram",
      destination: "https://www.instagram.com/andreiapaz_acessorios/",
      status: "ativa",
      nfc: true,
      qr: true,
      createdAt: date,
      lastAccess: null,
      scans: null,
      mode: "static",
      demo: true,
    },
  ],
};
export const defaultStyle: QRStyle = {
  dots: "rounded",
  eye: "extra-rounded",
  center: "dot",
  color: "#17243d",
  color2: "#0b6df6",
  color3: "",
  background: "#ffffff",
  eyeColor: "#17243d",
  centerColor: "#17243d",
  gradient: "solid",
  rotation: 45,
  transparent: false,
  logo: "",
  logoSize: 0.22,
  logoMargin: 5,
  logoWhite: true,
  hideDots: true,
  margin: 4,
  frame: "Sem moldura",
  cta: "APONTE A CÂMERA",
  preview: "QR isolado",
  size: 1200,
};
export const repository = {
  load(): Store {
    const raw = localStorage.getItem("nfcpro:v1");
    if (!raw) return structuredClone(initialStore);
    const s = JSON.parse(raw);
    if (
      s.version !== 1 ||
      !Array.isArray(s.clients) ||
      !Array.isArray(s.plates) ||
      !Array.isArray(s.history) ||
      !Array.isArray(s.presets)
    )
      throw new Error(
        "Os dados salvos não puderam ser lidos. Exporte uma cópia antes de continuar.",
      );
    return s;
  },
  save(s: Store) {
    localStorage.setItem("nfcpro:v1", JSON.stringify(s));
  },
};
export const uid = () => crypto.randomUUID();
export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
export function safeUrl(value: string) {
  try {
    const u = new URL(value);
    return ["https:", "http:"].includes(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
