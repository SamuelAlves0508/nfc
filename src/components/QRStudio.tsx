"use client";
import { useEffect, useRef, useState } from "react";
import {
  QrCode,
  ArrowDownToLine,
  Check,
  Copy,
  FlaskConical,
  Save,
  Trash2,
  Plus,
  Upload,
  Palette,
  Shapes,
  Image as ImageIcon,
  Frame,
  Link,
  ChevronDown,
} from "lucide-react";
import {
  Button,
  Field,
  Select,
  Title,
  Badge,
  Toggle,
  Modal,
  Section,
} from "./ui";
import { content, qrTypes, type QRType, type Fields } from "@/lib/qr-content";
import {
  defaultStyle,
  uid,
  downloadBlob,
  type Store,
  type QRStyle,
} from "@/lib/data";
import { renderQR, rasterize, contrast, pngWithDPI } from "@/lib/qr-render";
type Props = {
  linkOnly?: boolean;
  initialURL: string;
  initialClient: string;
  store: Store;
  update: (fn: (s: Store) => Store) => void;
  notify: (s: string) => void;
};
const presetColors = [
  { name: "Preto", a: "#171b23", b: "#171b23" },
  { name: "NFC Blue", a: "#0755c8", b: "#2584f5" },
  { name: "Instagram", a: "#833ab4", b: "#c13584" },
  { name: "WhatsApp", a: "#126b3d", b: "#168d50" },
  { name: "Google", a: "#2459b5", b: "#248355" },
  { name: "Gold", a: "#786039", b: "#a18652" },
];
export default function QRStudio({
  linkOnly = false,
  initialURL,
  initialClient,
  store,
  update,
  notify,
}: Props) {
  const [type, setType] = useState<QRType>("URL"),
    [fields, setFields] = useState<Fields>({
      url: initialURL || "https://www.instagram.com/andreiapaz_acessorios/",
    }),
    [style, setStyle] = useState<QRStyle>(defaultStyle),
    [tab, setTab] = useState("Conteúdo"),
    [clientId, setClientId] = useState(initialClient),
    [name, setName] = useState(""),
    [presetName, setPresetName] = useState(""),
    [presetDialog, setPresetDialog] = useState(false),
    [saving, setSaving] = useState(false),
    [busy, setBusy] = useState(false),
    [renderError, setRenderError] = useState(""),
    [testResult, setTestResult] = useState(""),
    [format, setFormat] = useState("PNG"),
    [quality, setQuality] = useState("Alta resolução");
  const preview = useRef<HTMLDivElement>(null),
    svgRef = useRef<SVGSVGElement | null>(null),
    [rendered, setRendered] = useState("");
  const result = content(type, fields),
    key = JSON.stringify([result.data, style]);
  useEffect(() => {
    let active = true;
    svgRef.current = null;
    setRendered("");
    setTestResult("");
    if (!result.data) {
      preview.current?.replaceChildren();
      return;
    }
    const timer = setTimeout(() => {
      renderQR(result.data, style)
        .then((svg) => {
          if (active) {
            svgRef.current = svg;
            preview.current?.replaceChildren(svg);
            setRendered(key);
            setRenderError("");
          }
        })
        .catch(() => {
          if (active) {
            preview.current?.replaceChildren();
            setRenderError(
              "Conteúdo muito longo ou imagem inválida. Reduza o conteúdo e tente novamente.",
            );
          }
        });
    }, 140);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [key]); // The key includes all content and appearance controls.
  const change = <K extends keyof QRStyle>(k: K, v: QRStyle[K]) =>
    setStyle((s) => ({ ...s, [k]: v }));
  const f = (key: string, label: string, inputType = "text", hint?: string) => (
    <Field
      label={label}
      type={inputType}
      value={fields[key] || ""}
      onChange={(e) => setFields({ ...fields, [key]: e.target.value })}
      hint={hint}
      maxLength={key === "text" ? 1500 : 500}
    />
  );
  const bg = style.transparent ? "#ffffff" : style.background;
  const colors = [
    style.color,
    style.eyeColor,
    style.centerColor,
    ...(style.gradient !== "solid"
      ? [style.color2, ...(style.color3 ? [style.color3] : [])]
      : []),
  ];
  const ratio = Math.min(...colors.map((c) => contrast(c, bg)));
  const warnings = [
    ...(ratio < 4.5 ? ["Aumente o contraste entre o QR e o fundo."] : []),
    ...(style.margin < 4 ? ["Use pelo menos 4 módulos de margem."] : []),
    ...(style.logo && style.logoSize > 0.3
      ? ["O logo ocupa uma área grande. Reduza para facilitar a leitura."]
      : []),
    ...(style.transparent
      ? ["Fundo transparente: a leitura depende da superfície de aplicação."]
      : []),
    ...(style.logo && !style.hideDots
      ? ["Os módulos atrás do logo podem prejudicar a leitura."]
      : []),
  ];
  async function test() {
    if (!svgRef.current || rendered !== key) return;
    setBusy(true);
    try {
      const { default: jsQR } = await import("jsqr");
      const canvas = await rasterize(svgRef.current, 1000, true),
        ctx = canvas.getContext("2d")!,
        pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let decoded = jsQR(pixels.data, pixels.width, pixels.height, {
        inversionAttempts: "attemptBoth",
      });
      // Frames and CTA text can confuse whole-image detection. Also inspect the
      // actual rendered QR region, retaining its full quiet zone.
      if (!decoded) {
        const qrRegion = svgRef.current.querySelector("svg");
        if (qrRegion) {
          const scale =
            canvas.width / Number(svgRef.current.getAttribute("width"));
          const region = ctx.getImageData(
            Number(qrRegion.getAttribute("x")) * scale,
            Number(qrRegion.getAttribute("y")) * scale,
            400 * scale,
            400 * scale,
          );
          decoded = jsQR(region.data, region.width, region.height, {
            inversionAttempts: "attemptBoth",
          });
        }
      }
      setTestResult(
        decoded?.data === result.data
          ? "QR decodificado. Conteúdo confirmado."
          : "Não foi possível confirmar a leitura. Aumente contraste e margens ou reduza o logo.",
      );
    } catch {
      setTestResult("Falha ao testar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  async function exportQR(forcePDF = false) {
    if (!result.data) return;
    setBusy(true);
    try {
      const svg = forcePDF
        ? await renderQR(result.data, {
            ...style,
            preview:
              style.preview === "QR isolado"
                ? "Placa 10 × 12 cm"
                : style.preview,
          })
        : svgRef.current;
      if (!svg) throw new Error();
      if (forcePDF || format === "PDF") {
        const [{ jsPDF }] = await Promise.all([
          import("jspdf"),
          import("svg2pdf.js"),
        ]);
        const pdf = new jsPDF({
          unit: "mm",
          format: [100, 120],
          orientation: "portrait",
          compress: true,
        });
        const h =
          (100 * Number(svg.getAttribute("height"))) /
          Number(svg.getAttribute("width"));
        await pdf.svg(svg, { x: 0, y: (120 - h) / 2, width: 100, height: h });
        pdf.save("nfc-pro-10x12cm.pdf");
      } else if (format === "SVG") {
        downloadBlob(
          new Blob([new XMLSerializer().serializeToString(svg)], {
            type: "image/svg+xml",
          }),
          "nfc-pro.svg",
        );
      } else {
        const dpi =
          quality === "Impressão · 600 DPI"
            ? 600
            : quality === "Impressão · 300 DPI"
              ? 300
              : 96;
        const width =
          dpi > 96
            ? Math.round((100 / 25.4) * dpi)
            : quality === "Web"
              ? 600
              : style.size;
        const canvas = await rasterize(svg, width, format === "JPG");
        if (format === "JPG") {
          const blob = await new Promise<Blob | null>((r) =>
            canvas.toBlob(r, "image/jpeg", 0.98),
          );
          if (blob) downloadBlob(blob, "nfc-pro.jpg");
        } else downloadBlob(await pngWithDPI(canvas, dpi), "nfc-pro.png");
      }
      notify("Arquivo exportado. Faça uma leitura de teste antes de imprimir.");
    } catch {
      notify("Não foi possível exportar. Revise o conteúdo e tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  function saveQR() {
    if (!result.data || !name.trim()) return;
    update((s) => ({
      ...s,
      history: [
        {
          id: uid(),
          name: name.trim(),
          data: result.data,
          clientId,
          createdAt: new Date().toISOString(),
        },
        ...s.history,
      ],
    }));
    setSaving(false);
    setName("");
    notify("QR salvo no histórico.");
  }
  async function upload(file?: File) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      notify("Use PNG, JPG ou WebP com até 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => change("logo", String(reader.result));
    reader.readAsDataURL(file);
  }
  return (
    <>
      <Title
        eyebrow={linkOnly ? "FERRAMENTAS" : "CRIE. PERSONALIZE. CONECTE."}
        title={linkOnly ? "Gerar link" : "QR Studio"}
        description={
          linkOnly
            ? "Um destino pronto para compartilhar."
            : "Do primeiro pixel à sua próxima placa."
        }
        action={
          !linkOnly ? (
            <Button
              variant="secondary"
              disabled={!result.data}
              onClick={() => setSaving(true)}
            >
              <Save size={17} /> Salvar QR
            </Button>
          ) : undefined
        }
      />
      <div className={`studio-layout ${linkOnly ? "link-only" : ""}`}>
        <div className="studio-editor">
          <div
            className="studio-tabs"
            role="tablist"
            aria-label="Etapas do QR Studio"
          >
            {(linkOnly
              ? ["Conteúdo"]
              : ["Conteúdo", "Design", "Finalizar"]
            ).map((t, i) => (
              <button
                role="tab"
                aria-selected={t === tab}
                key={t}
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                {t}
              </button>
            ))}
          </div>
          {tab === "Conteúdo" && (
            <section className="panel editor-section">
              <div className="editor-heading">
                <span className="icon-tile">
                  <Link size={20} />
                </span>
                <div>
                  <h2>Para onde vamos?</h2>
                  <p>Escolha o conteúdo do seu QR Code.</p>
                </div>
              </div>
              <div className="type-grid">
                {(linkOnly
                  ? qrTypes.filter((t) =>
                      [
                        "URL",
                        "Instagram",
                        "WhatsApp",
                        "Google Avaliações",
                        "Telefone",
                        "E-mail",
                        "Localização",
                      ].includes(t),
                    )
                  : qrTypes
                ).map((t) => (
                  <button
                    key={t}
                    className={type === t ? "selected" : ""}
                    onClick={() => {
                      setType(t);
                      setTestResult("");
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="form content-fields">
                {["URL", "PDF", "Google Avaliações"].includes(type) &&
                  f(
                    "url",
                    type === "PDF" ? "Link público do PDF" : "Link de destino",
                    "url",
                    type === "PDF"
                      ? "Hospede o PDF e cole o link público. Arquivos locais não ficam acessíveis a quem escanear."
                      : undefined,
                  )}
                {type === "Google Avaliações" &&
                  f(
                    "placeId",
                    "Ou use um Google Place ID",
                    "text",
                    "Se informado, o Place ID tem prioridade sobre o link.",
                  )}
                {type === "Instagram" &&
                  f(
                    "username",
                    "Usuário do Instagram",
                    "text",
                    "Ex.: andreiapaz_acessorios",
                  )}
                {["WhatsApp", "Telefone", "vCard"].includes(type) &&
                  f(
                    "phone",
                    "Telefone com país e DDD",
                    "tel",
                    "Ex.: 5543999999999",
                  )}
                {["WhatsApp", "E-mail"].includes(type) &&
                  f("message", "Mensagem")}
                {["E-mail", "vCard"].includes(type) &&
                  f("email", "E-mail", "email")}
                {type === "E-mail" && f("subject", "Assunto")}
                {type === "Texto" && (
                  <label className="field">
                    <span>Seu texto</span>
                    <textarea
                      maxLength={1500}
                      rows={5}
                      value={fields.text || ""}
                      onChange={(e) =>
                        setFields({ ...fields, text: e.target.value })
                      }
                    />
                  </label>
                )}
                {type === "Wi-Fi" && (
                  <>
                    {f("ssid", "Nome da rede (SSID)")}
                    {f("password", "Senha", "password")}
                    <Select
                      label="Segurança"
                      value={fields.security || "WPA"}
                      onChange={(e) =>
                        setFields({ ...fields, security: e.target.value })
                      }
                    >
                      <option value="WPA">WPA / WPA2 / WPA3</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">Sem senha</option>
                    </Select>
                    <Toggle
                      label="Rede oculta"
                      checked={fields.hidden === "true"}
                      onChange={(v) =>
                        setFields({ ...fields, hidden: String(v) })
                      }
                    />
                  </>
                )}
                {type === "vCard" && (
                  <>
                    {f("name", "Nome completo")}
                    {f("company", "Empresa")}
                    {f("website", "Website", "url")}
                  </>
                )}
                {type === "Localização" && (
                  <div className="form-grid">
                    {f("lat", "Latitude", "number")}
                    {f("lng", "Longitude", "number")}
                  </div>
                )}
                {type === "Evento" && (
                  <>
                    {f("title", "Título do evento")}
                    {f("start", "Início", "datetime-local")}
                    {f("end", "Fim", "datetime-local")}
                    {f("location", "Local")}
                    <p className="muted">
                      Horários no fuso deste dispositivo; exportados em UTC.
                    </p>
                  </>
                )}
                {result.error && (
                  <p className="field-error" role="status">
                    {result.error}
                  </p>
                )}
                {!linkOnly && (
                  <>
                    <Select
                      label="Vincular a um cliente"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                    >
                      <option value="">Sem vínculo</option>
                      {store.clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                    <Button
                      disabled={!result.data}
                      onClick={() => setTab("Design")}
                    >
                      Personalizar design <Palette size={17} />
                    </Button>
                  </>
                )}
                {linkOnly && (
                  <>
                    <div className="destination">
                      <small>SEU LINK</small>
                      <span>{result.data || "Preencha os campos acima."}</span>
                    </div>
                    <Button
                      disabled={!result.data}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(result.data);
                          notify("Link copiado.");
                        } catch {
                          notify("Selecione e copie o link acima.");
                        }
                      }}
                    >
                      <Copy size={17} /> Copiar link
                    </Button>
                  </>
                )}
              </div>
            </section>
          )}
          {tab === "Design" && (
            <section className="panel editor-section design-controls">
              <div className="editor-heading">
                <span className="icon-tile">
                  <Palette size={20} />
                </span>
                <div>
                  <h2>Um QR com sua identidade.</h2>
                  <p>Os detalhes fazem a diferença.</p>
                </div>
              </div>
              <details open>
                <summary>
                  <Palette size={17} /> Cores e marca <ChevronDown size={16} />
                </summary>
                <div className="detail-body">
                  <div className="color-presets">
                    {presetColors.map((p) => (
                      <button
                        key={p.name}
                        onClick={() =>
                          setStyle((s) => ({
                            ...s,
                            color: p.a,
                            color2: p.b,
                            eyeColor: p.a,
                            centerColor: p.a,
                            gradient:
                              p.name === "Instagram" ? "linear" : "solid",
                          }))
                        }
                      >
                        <i style={{ background: p.a }} />
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                  <Select
                    label="Preenchimento"
                    value={style.gradient}
                    onChange={(e) =>
                      change("gradient", e.target.value as QRStyle["gradient"])
                    }
                  >
                    <option value="solid">Cor sólida</option>
                    <option value="linear">Gradiente linear</option>
                    <option value="radial">Gradiente radial</option>
                  </Select>
                  <div className="form-grid">
                    <Color
                      label="Módulos"
                      value={style.color}
                      change={(v) => change("color", v)}
                    />
                    <Color
                      label="Fundo"
                      value={style.background}
                      change={(v) => change("background", v)}
                    />
                    {style.gradient !== "solid" && (
                      <>
                        <Color
                          label="Segunda cor"
                          value={style.color2}
                          change={(v) => change("color2", v)}
                        />
                        <Color
                          label="Terceira cor"
                          value={style.color3 || style.color2}
                          change={(v) => change("color3", v)}
                        />
                      </>
                    )}
                    <Color
                      label="Olhos"
                      value={style.eyeColor}
                      change={(v) => change("eyeColor", v)}
                    />
                    <Color
                      label="Centro dos olhos"
                      value={style.centerColor}
                      change={(v) => change("centerColor", v)}
                    />
                  </div>
                  {style.gradient === "linear" && (
                    <Range
                      label="Ângulo do gradiente"
                      value={style.rotation}
                      min={0}
                      max={360}
                      unit="°"
                      change={(v) => change("rotation", v)}
                    />
                  )}
                  <Toggle
                    label="Fundo transparente"
                    checked={style.transparent}
                    onChange={(v) => change("transparent", v)}
                  />
                </div>
              </details>
              <details>
                <summary>
                  <Shapes size={17} /> Formas do QR <ChevronDown size={16} />
                </summary>
                <div className="detail-body">
                  <label className="control-label">Módulos</label>
                  <div className="style-picker">
                    {(
                      [
                        "square",
                        "rounded",
                        "dots",
                        "classy",
                        "classy-rounded",
                        "extra-rounded",
                      ] as const
                    ).map((d, i) => (
                      <button
                        key={d}
                        className={style.dots === d ? "selected" : ""}
                        onClick={() => change("dots", d)}
                      >
                        <span className={`dot-sample ${d}`}>
                          {Array.from({ length: 9 }, (_, i) => (
                            <i key={i} />
                          ))}
                        </span>
                        <small>
                          {
                            [
                              "Quadrado",
                              "Arredondado",
                              "Pontos",
                              "Clássico",
                              "Clássico suave",
                              "Extra suave",
                            ][i]
                          }
                        </small>
                      </button>
                    ))}
                  </div>
                  <div className="form-grid">
                    <Select
                      label="Olhos externos"
                      value={style.eye}
                      onChange={(e) =>
                        change("eye", e.target.value as QRStyle["eye"])
                      }
                    >
                      {[
                        ["square", "Quadrado"],
                        ["dot", "Círculo"],
                        ["extra-rounded", "Arredondado"],
                        ["classy", "Clássico"],
                      ].map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </Select>
                    <Select
                      label="Centro dos olhos"
                      value={style.center}
                      onChange={(e) =>
                        change("center", e.target.value as QRStyle["center"])
                      }
                    >
                      {[
                        ["square", "Quadrado"],
                        ["dot", "Círculo"],
                        ["rounded", "Arredondado"],
                      ].map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </details>
              <details>
                <summary>
                  <ImageIcon size={17} /> Logo central <ChevronDown size={16} />
                </summary>
                <div className="detail-body">
                  <Select
                    label="Logo"
                    value={
                      style.logo.startsWith("data:") ? "upload" : style.logo
                    }
                    onChange={(e) => change("logo", e.target.value)}
                  >
                    <option value="">Sem logo</option>
                    {[
                      "Instagram",
                      "WhatsApp",
                      "Google",
                      "Facebook",
                      "Website",
                      "NFC PRO",
                    ].map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                    {style.logo.startsWith("data:") && (
                      <option value="upload">Logo enviado</option>
                    )}
                  </Select>
                  <label className="upload">
                    <Upload size={20} />
                    <b>Enviar logo do cliente</b>
                    <small>PNG, JPG ou WebP · até 2 MB</small>
                    <input
                      type="file"
                      aria-label="Enviar logo"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => upload(e.target.files?.[0])}
                    />
                  </label>
                  {style.logo && (
                    <>
                      <Range
                        label="Tamanho do logo"
                        value={Math.round(style.logoSize * 100)}
                        min={10}
                        max={45}
                        unit="%"
                        change={(v) => change("logoSize", v / 100)}
                      />
                      <Range
                        label="Margem do logo"
                        value={style.logoMargin}
                        min={0}
                        max={20}
                        unit="px"
                        change={(v) => change("logoMargin", v)}
                      />
                      <Toggle
                        label="Fundo branco atrás do logo"
                        checked={style.logoWhite}
                        onChange={(v) => change("logoWhite", v)}
                      />
                      <Toggle
                        label="Remover módulos atrás"
                        checked={style.hideDots}
                        onChange={(v) => change("hideDots", v)}
                      />
                      <p className="muted">
                        Correção de erro H. Logo sempre centralizado.
                      </p>
                    </>
                  )}
                </div>
              </details>
              <details>
                <summary>
                  <Frame size={17} /> Moldura e margens{" "}
                  <ChevronDown size={16} />
                </summary>
                <div className="detail-body">
                  <Select
                    label="Moldura"
                    value={style.frame}
                    onChange={(e) => {
                      const frame = e.target.value;
                      const ctas: Record<string, string> = {
                        "Escaneie aqui": "APONTE A CÂMERA",
                        Instagram: "SIGA NO INSTAGRAM",
                        "Avalie-nos": "AVALIE NO GOOGLE",
                        WhatsApp: "ENTRE NO GRUPO",
                        "Visite nosso site": "VISITE NOSSO SITE",
                      };
                      setStyle((s) => ({
                        ...s,
                        frame,
                        cta: ctas[frame] || s.cta,
                      }));
                    }}
                  >
                    {[
                      "Sem moldura",
                      "Escaneie aqui",
                      "Instagram",
                      "Avalie-nos",
                      "WhatsApp",
                      "Visite nosso site",
                      "Personalizado",
                    ].map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </Select>
                  <Field
                    label="Texto da placa / moldura"
                    value={style.cta}
                    maxLength={48}
                    onChange={(e) => change("cta", e.target.value)}
                  />
                  <Range
                    label="Margem de segurança"
                    value={style.margin}
                    min={0}
                    max={10}
                    unit=" módulos"
                    change={(v) => change("margin", v)}
                  />
                  <p className="muted">
                    Recomendado: pelo menos 4 módulos livres ao redor do QR.
                  </p>
                </div>
              </details>
              <details>
                <summary>
                  <Save size={17} /> Estilos salvos <ChevronDown size={16} />
                </summary>
                <div className="detail-body">
                  <Button
                    variant="secondary"
                    onClick={() => setPresetDialog(true)}
                  >
                    <Plus size={17} /> Salvar estilo atual
                  </Button>
                  {store.presets.map((p) => (
                    <div className="preset-row" key={p.id}>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setStyle(p.style);
                          notify(`Estilo ${p.name} aplicado.`);
                        }}
                      >
                        {p.name}
                      </Button>
                      <Button
                        variant="ghost"
                        aria-label={`Duplicar ${p.name}`}
                        onClick={() => {
                          update((s) => ({
                            ...s,
                            presets: [
                              ...s.presets,
                              { ...p, id: uid(), name: `${p.name} · cópia` },
                            ],
                          }));
                          notify("Estilo duplicado.");
                        }}
                      >
                        <Copy size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        aria-label={`Excluir estilo ${p.name}`}
                        onClick={() => {
                          if (confirm(`Excluir o estilo ${p.name}?`))
                            update((s) => ({
                              ...s,
                              presets: s.presets.filter((x) => x.id !== p.id),
                            }));
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                  {!store.presets.length && (
                    <p className="muted">
                      Salve cores, logo e moldura para reutilizar.
                    </p>
                  )}
                </div>
              </details>
              <Button onClick={() => setTab("Finalizar")}>
                Preparar exportação <ArrowDownToLine size={17} />
              </Button>
            </section>
          )}
          {tab === "Finalizar" && (
            <section className="panel editor-section">
              <div className="editor-heading">
                <span className="icon-tile">
                  <ArrowDownToLine size={20} />
                </span>
                <div>
                  <h2>Pronto para conectar.</h2>
                  <p>O arquivo acompanha a prévia ao lado.</p>
                </div>
              </div>
              <div className="form">
                <Select
                  label="Formato"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                >
                  {["PNG", "SVG", "JPG", "PDF"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
                <Select
                  label="Qualidade"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                >
                  {[
                    "Web",
                    "Alta resolução",
                    "Impressão · 300 DPI",
                    "Impressão · 600 DPI",
                  ].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
                {quality === "Alta resolução" && (
                  <Range
                    label="Largura da imagem"
                    value={style.size}
                    min={600}
                    max={3000}
                    step={100}
                    unit="px"
                    change={(v) => change("size", v)}
                  />
                )}
                <p className="notice">
                  SVG e PDF preservam os módulos em vetor. PNG para impressão
                  usa largura física de 10 cm e a resolução escolhida. JPG
                  recebe fundo branco quando transparente.
                </p>
                <Button
                  disabled={busy || !result.data || rendered !== key}
                  onClick={() => exportQR()}
                >
                  <ArrowDownToLine size={18} />
                  {busy ? "Preparando…" : `Baixar ${format}`}
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy || !result.data || rendered !== key}
                  onClick={() => exportQR(true)}
                >
                  PDF para gráfica — 10 × 12 cm
                </Button>
                <p className="muted">
                  Página exata de 100 × 120 mm, sem sangria. A prévia de placa
                  mantém essa proporção.
                </p>
              </div>
            </section>
          )}
        </div>
        {!linkOnly && (
          <aside className="panel preview-panel">
            <div className="preview-heading">
              <div>
                <span className="eyebrow">SUA CRIAÇÃO</span>
                <h2>Prévia em tempo real</h2>
              </div>
              <span className="live">
                <i /> AO VIVO
              </span>
            </div>
            <Select
              label="Visualização"
              value={style.preview}
              onChange={(e) => change("preview", e.target.value)}
            >
              {[
                "QR isolado",
                "Placa 10 × 12 cm",
                "Placa Instagram",
                "Placa Google Reviews",
                "Placa WhatsApp",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
            <div
              className={`preview-stage ${style.transparent ? "checker" : ""}`}
            >
              <div className="qr-art" ref={preview} />
              {!result.data && (
                <div className="qr-placeholder">
                  <QrCode size={70} />
                  <p>
                    Seu QR aparece aqui.
                    <br />
                    Preencha o conteúdo para começar.
                  </p>
                </div>
              )}
            </div>
            <div className="scan-status">
              <Badge tone={warnings.length ? "warning" : "success"}>
                {ratio >= 7
                  ? "Excelente contraste"
                  : ratio >= 4.5
                    ? "Contraste médio"
                    : "Risco de leitura"}
              </Badge>
              <span>{ratio.toFixed(1)}:1</span>
            </div>
            {warnings.map((w) => (
              <p className="scan-warning" key={w}>
                {w}
              </p>
            ))}
            {renderError && (
              <p role="alert" className="field-error">
                {renderError}
              </p>
            )}
            <div className="preview-actions">
              <Button
                variant="secondary"
                disabled={busy || !result.data || rendered !== key}
                onClick={test}
              >
                <FlaskConical size={17} />
                {busy ? "Aguarde…" : "Testar QR"}
              </Button>
              <Button
                disabled={busy || !result.data || rendered !== key}
                onClick={() => {
                  if (tab === "Finalizar") exportQR();
                  else setTab("Finalizar");
                }}
              >
                <ArrowDownToLine size={17} /> Exportar
              </Button>
            </div>
            {testResult && (
              <p className="notice" role="status">
                {testResult}
              </p>
            )}
            <p className="preview-caption">
              QR estático · Correção de erro H<br />
              Teste também com a câmera antes de imprimir.
            </p>
          </aside>
        )}
      </div>
      {!linkOnly && store.history.length > 0 && (
        <section className="section">
          <Section title="Seus últimos QRs" />
          <div className="panel history-list">
            {store.history.slice(0, 10).map((h) => (
              <div key={h.id}>
                <span className="icon-tile">
                  <QrCode size={18} />
                </span>
                <div>
                  <b>{h.name}</b>
                  <small>{h.data}</small>
                </div>
                <Button
                  variant="ghost"
                  aria-label={`Copiar conteúdo de ${h.name}`}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(h.data);
                      notify("Conteúdo copiado.");
                    } catch {
                      notify("Selecione o conteúdo para copiar.");
                    }
                  }}
                >
                  <Copy size={17} />
                </Button>
                <Button
                  variant="ghost"
                  aria-label={`Excluir QR ${h.name}`}
                  onClick={() => {
                    if (confirm(`Excluir ${h.name} do histórico?`))
                      update((s) => ({
                        ...s,
                        history: s.history.filter((x) => x.id !== h.id),
                      }));
                  }}
                >
                  <Trash2 size={17} />
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
      {saving && (
        <Modal title="Salvar QR Code" onClose={() => setSaving(false)}>
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              saveQR();
            }}
          >
            <Field
              label="Nome do QR"
              value={name}
              required
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
            <Select
              label="Cliente"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">Sem cliente</option>
              {store.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Button type="submit">Salvar no histórico</Button>
          </form>
        </Modal>
      )}
      {presetDialog && (
        <Modal
          title="Salvar estilo de marca"
          onClose={() => setPresetDialog(false)}
        >
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!presetName.trim()) return;
              update((s) => ({
                ...s,
                presets: [
                  ...s.presets,
                  { id: uid(), name: presetName.trim(), style },
                ],
              }));
              setPresetDialog(false);
              setPresetName("");
              notify("Estilo salvo.");
            }}
          >
            <Field
              label="Nome do estilo"
              value={presetName}
              required
              maxLength={80}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Ex.: Andreia Paz · Gold"
            />
            <Button type="submit">Salvar estilo</Button>
          </form>
        </Modal>
      )}
    </>
  );
}
function Color({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: (v: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="color-field">
        <input
          type="color"
          aria-label={label}
          value={value}
          onChange={(e) => change(e.target.value)}
        />
        <span>{value.toUpperCase()}</span>
      </div>
    </label>
  );
}
function Range({
  label,
  value,
  min,
  max,
  unit,
  change,
  step = 1,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  change: (v: number) => void;
  step?: number;
}) {
  return (
    <label className="range">
      <span>
        {label}
        <b>
          {value}
          {unit}
        </b>
      </span>
      <input
        aria-label={label}
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => change(Number(e.target.value))}
      />
    </label>
  );
}
