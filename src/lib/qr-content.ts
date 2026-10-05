export const qrTypes = [
  "URL",
  "Instagram",
  "WhatsApp",
  "Google Avaliações",
  "Telefone",
  "E-mail",
  "Texto",
  "Wi-Fi",
  "vCard",
  "PDF",
  "Localização",
  "Evento",
] as const;
export type QRType = (typeof qrTypes)[number];
export type Fields = Record<string, string>;
const escape = (v = "") =>
  v
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/([;,:])/g, "\\$1");
const digits = (v = "") => v.replace(/\D/g, "");
export function content(
  type: QRType,
  f: Fields,
): { data: string; error: string } {
  const fail = (error: string) => ({ data: "", error });
  const ok = (data: string) => ({ data, error: "" });
  const url = (value: string) => {
    try {
      const u = new URL(value);
      return ["http:", "https:"].includes(u.protocol) ? u.href : "";
    } catch {
      return "";
    }
  };
  switch (type) {
    case "URL":
    case "PDF":
    case "Google Avaliações": {
      const v =
        type === "Google Avaliações" && f.placeId
          ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(f.placeId)}`
          : url(f.url || "");
      return v
        ? ok(v)
        : fail("Informe um link completo, começando com https://.");
    }
    case "Instagram": {
      const name = (f.username || "").trim().replace(/^@/, "");
      return /^[\w.]{1,30}$/.test(name)
        ? ok(`https://www.instagram.com/${name}/`)
        : fail("Informe o @ do Instagram, sem espaços.");
    }
    case "WhatsApp":
      return digits(f.phone).length >= 10
        ? ok(
            `https://wa.me/${digits(f.phone)}?text=${encodeURIComponent(f.message || "")}`,
          )
        : fail("Inclua o código do país e o DDD.");
    case "Telefone":
      return digits(f.phone).length >= 8
        ? ok(`tel:${f.phone.replace(/[^+\d]/g, "")}`)
        : fail("Informe um telefone válido.");
    case "E-mail":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email || "")
        ? ok(
            `mailto:${f.email}?subject=${encodeURIComponent(f.subject || "")}&body=${encodeURIComponent(f.message || "")}`,
          )
        : fail("Informe um e-mail válido.");
    case "Texto":
      return f.text?.trim() ? ok(f.text) : fail("Escreva o conteúdo do QR.");
    case "Wi-Fi":
      return f.ssid
        ? ok(
            `WIFI:T:${f.security || "WPA"};S:${escape(f.ssid)};P:${escape(f.password)};H:${f.hidden === "true"};;`,
          )
        : fail("Informe o nome da rede.");
    case "vCard":
      return f.name
        ? ok(
            `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${escape(f.name)}\r\nN:${escape(f.name)};;;;\r\nORG:${escape(f.company)}\r\nTEL:${escape(f.phone)}\r\nEMAIL:${escape(f.email)}\r\nURL:${escape(f.website)}\r\nEND:VCARD`,
          )
        : fail("Informe o nome do contato.");
    case "Localização": {
      const lat = Number(f.lat),
        lng = Number(f.lng);
      return f.lat &&
        f.lng &&
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180
        ? ok(`https://maps.google.com/?q=${lat},${lng}`)
        : fail("Use latitude entre −90 e 90 e longitude entre −180 e 180.");
    }
    case "Evento": {
      if (!f.title || !f.start || !f.end)
        return fail("Preencha título, início e fim.");
      const start = new Date(f.start),
        end = new Date(f.end);
      if (!Number.isFinite(+start) || end <= start)
        return fail("O fim deve ser depois do início.");
      const stamp = (d: Date) =>
        d
          .toISOString()
          .replace(/[-:]/g, "")
          .replace(/\.\d{3}/, "");
      return ok(
        `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//NFC PRO//QR Studio//PT\r\nBEGIN:VEVENT\r\nUID:${stamp(start)}-${encodeURIComponent(f.title)}@nfcpro.local\r\nDTSTAMP:${stamp(start)}\r\nDTSTART:${stamp(start)}\r\nDTEND:${stamp(end)}\r\nSUMMARY:${escape(f.title)}\r\nLOCATION:${escape(f.location)}\r\nEND:VEVENT\r\nEND:VCALENDAR`,
      );
    }
  }
}
