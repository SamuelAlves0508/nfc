"use client";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import {
  House,
  Users,
  ScanLine,
  Plus,
  Ellipsis,
  QrCode,
  Link,
  Sun,
  Moon,
  ArrowUpRight,
  ChevronRight,
  Radio,
  Activity,
  Download,
  Settings,
  Copy,
  ExternalLink,
  Trash2,
  Pencil,
  Check,
  ShieldCheck,
  Smartphone,
  Monitor,
  MapPin,
  Globe,
  ChartNoAxesCombined,
} from "lucide-react";
import {
  Button,
  Field,
  Select,
  Search,
  Title,
  Section,
  Badge,
  Empty,
  Modal,
  Toggle,
} from "./ui";
import {
  repository,
  initialStore,
  blankClient,
  uid,
  initials,
  safeUrl,
  downloadBlob,
  type Store,
  type Client,
  type Plate,
} from "@/lib/data";
const QRStudio = dynamic(() => import("./QRStudio"), {
  ssr: false,
  loading: () => <div className="skeleton">Preparando o QR Studio…</div>,
});
type View =
  "home" | "clients" | "plates" | "qr" | "links" | "analytics" | "more";
type Sheet = {
  kind:
    | "menu"
    | "client"
    | "plate"
    | "detail"
    | "delete-client"
    | "delete-plate"
    | "integrations"
    | "install";
  id?: string;
  clientId?: string;
} | null;
const nav = [
  { id: "home", name: "Início", icon: House },
  { id: "clients", name: "Clientes", icon: Users },
  { id: "plates", name: "Placas", icon: ScanLine },
  { id: "qr", name: "QR Studio", icon: QrCode },
  { id: "links", name: "Gerar link", icon: Link },
  { id: "analytics", name: "Analytics", icon: ChartNoAxesCombined },
  { id: "more", name: "Mais", icon: Settings },
] as const;
function Brand() {
  return (
    <div className="brand">
      <Image src="/nfc-pro-icon.svg" alt="" width={40} height={40} priority />
      <div>
        <b>
          NFC<span>PRO</span>
        </b>
        <small>Conexões que importam.</small>
      </div>
    </div>
  );
}
function Avatar({ name }: { name: string }) {
  return (
    <span className={`avatar tone-${name.length % 4}`}>{initials(name)}</span>
  );
}
const date = (s: string) => new Date(s).toLocaleDateString("pt-BR");

export default function App() {
  const [store, setStore] = useState<Store>(initialStore),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [view, setView] = useState<View>("home"),
    [sheet, setSheet] = useState<Sheet>(null),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("Todos"),
    [qrDestination, setQrDestination] = useState(""),
    [qrClient, setQrClient] = useState("");
  useEffect(() => {
    try {
      setStore(repository.load());
      setReady(true);
    } catch (e) {
      setError((e as Error).message);
    }
    const hash = location.hash.slice(1);
    if (nav.some((n) => n.id === hash)) setView(hash as View);
    const handle = () => {
      const v = location.hash.slice(1);
      if (nav.some((n) => n.id === v)) setView(v as View);
    };
    window.addEventListener("hashchange", handle);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production")
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => window.removeEventListener("hashchange", handle);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = store.dark ? "dark" : "light";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", store.dark ? "#10131b" : "#f6f7fb");
  }, [store.dark]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 4200);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const update = useCallback((fn: (s: Store) => Store) => {
    setStore((s) => {
      const next = fn(s);
      try {
        repository.save(next);
        setError("");
      } catch {
        setError(
          "Não foi possível salvar neste navegador. Exporte um backup antes de sair.",
        );
      }
      return next;
    });
  }, []);
  function go(v: View) {
    setView(v);
    setQuery("");
    setFilter("Todos");
    location.hash = v;
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function action(id: string) {
    setSheet(null);
    if (id === "qr" || id === "links") {
      setQrDestination("");
      setQrClient("");
      go(id);
    } else setSheet({ kind: id as "client" | "plate" });
  }
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setToast("Link copiado.");
    } catch {
      setToast(
        "Não foi possível copiar. Selecione o destino e copie manualmente.",
      );
    }
  }
  function openQR(destination: string, clientId = "") {
    setQrDestination(destination);
    setQrClient(clientId);
    setSheet(null);
    go("qr");
  }
  const selectedClient = store.clients.find((c) => c.id === sheet?.id),
    selectedPlate = store.plates.find((p) => p.id === sheet?.id);
  const clientPlates = (id: string) =>
    store.plates.filter((p) => p.clientId === id);
  const actions = [
    {
      id: "qr",
      label: "Gerar QR",
      sub: "Seu estilo. Seu destino.",
      icon: QrCode,
    },
    {
      id: "plate",
      label: "Nova placa",
      sub: "Uma nova conexão.",
      icon: ScanLine,
    },
    {
      id: "client",
      label: "Novo cliente",
      sub: "Tudo começa aqui.",
      icon: Users,
    },
    {
      id: "links",
      label: "Gerar link",
      sub: "Pronto para compartilhar.",
      icon: Link,
    },
  ];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <span className="nav-label">ESPAÇO DE TRABALHO</span>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => go(n.id)}
              className={view === n.id ? "selected" : ""}
            >
              <n.icon size={19} />
              {n.name}
              {n.id === "qr" && <small>STUDIO</small>}
            </button>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="local-indicator">
            <i /> Salvo neste dispositivo
          </div>
          <p>
            Seu trabalho, organizado.
            <br />
            Do primeiro QR à próxima placa.
          </p>
          <Button
            variant="secondary"
            onClick={() => setSheet({ kind: "install" })}
          >
            <Smartphone size={17} /> Instalar aplicativo
          </Button>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="mobile-brand">
            <Brand />
          </div>
          <div className="breadcrumb">
            Meu espaço <span>/</span>
            <b>{nav.find((n) => n.id === view)?.name}</b>
          </div>
          <div className="top-actions">
            <span className="local-pill">
              <i /> Espaço local
            </span>
            <button
              className="icon-button"
              aria-label="Alternar tema"
              onClick={() => update((s) => ({ ...s, dark: !s.dark }))}
            >
              {store.dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              className="profile"
              aria-label="Preferências do espaço"
              onClick={() => go("more")}
            >
              DP
            </button>
          </div>
        </header>
        <main className="page">
          {error && (
            <div role="alert" className="notice warning">
              {error}
            </div>
          )}
          {!ready ? (
            <div className="skeleton">Carregando seu espaço…</div>
          ) : (
            <>
              {view === "home" && (
                <>
                  <div className="welcome">
                    <div>
                      <span className="eyebrow">SEU ESPAÇO, CONECTADO</span>
                      <p className="greeting">
                        Boa tarde, Douglas <span>✦</span>
                      </p>
                      <h1>Vamos continuar?</h1>
                      <p>Gerencie suas placas NFC, QR Codes e clientes.</p>
                    </div>
                    <Button
                      className="desktop-create"
                      onClick={() => setSheet({ kind: "menu" })}
                    >
                      <Plus size={18} /> Criar novo
                    </Button>
                  </div>
                  <div className="overview">
                    <section className="hero">
                      <div className="hero-top">
                        <span>
                          <Radio size={19} /> Placas ativas
                        </span>
                        <span className="hero-tag">NFC + QR</span>
                      </div>
                      <strong>
                        {store.plates
                          .filter((p) => p.status === "ativa")
                          .length.toString()
                          .padStart(2, "0")}
                      </strong>
                      <div className="hero-footer">
                        <span>
                          {store.plates.some((p) => p.demo)
                            ? "Inclui placa de demonstração"
                            : `${store.plates.length} placas cadastradas`}
                        </span>
                        <button
                          aria-label="Ver placas"
                          onClick={() => go("plates")}
                        >
                          <ArrowUpRight size={20} />
                        </button>
                      </div>
                      <div className="hero-art" aria-hidden="true">
                        <div className="orbit" />
                        <div className="orbit second" />
                        <div className="art-plate">
                          <Radio size={38} />
                          <span>NFC PRO</span>
                          <i />
                        </div>
                      </div>
                    </section>
                    <div className="metrics">
                      <button className="metric" onClick={() => go("clients")}>
                        <span>
                          <Users size={18} /> Clientes
                          <ArrowUpRight size={16} />
                        </span>
                        <strong>
                          {store.clients.length.toString().padStart(2, "0")}
                        </strong>
                        <small>Relacionamentos em um só lugar</small>
                      </button>
                      <button className="metric" onClick={() => go("qr")}>
                        <span>
                          <QrCode size={18} /> QR Codes
                          <ArrowUpRight size={16} />
                        </span>
                        <strong>
                          {store.history.length.toString().padStart(2, "0")}
                        </strong>
                        <small>Salvos no seu histórico</small>
                      </button>
                      <button
                        className="access-metric"
                        onClick={() => go("analytics")}
                      >
                        <span className="icon-tile">
                          <Activity size={20} />
                        </span>
                        <div>
                          <b>Acessos e scans</b>
                          <small>Conecte o rastreamento para acompanhar</small>
                        </div>
                        <ArrowUpRight size={18} />
                      </button>
                    </div>
                  </div>
                  <section className="section">
                    <Section title="O que vamos criar?" />
                    <div className="quick-actions">
                      {actions.map((a) => (
                        <button key={a.id} onClick={() => action(a.id)}>
                          <span className="icon-tile">
                            <a.icon size={21} />
                          </span>
                          <ArrowUpRight className="action-arrow" size={17} />
                          <b>{a.label}</b>
                          <small>{a.sub}</small>
                        </button>
                      ))}
                    </div>
                  </section>
                  <section className="recent-panel">
                    <div className="section-title">
                      <div>
                        <span className="eyebrow">CONEXÕES</span>
                        <h2>Seus clientes, por perto.</h2>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => go("clients")}
                      >
                        Ver todos <ArrowUpRight size={17} />
                      </button>
                    </div>
                    <div className="recent-layout">
                      <div className="recent-rows">
                        {store.clients.slice(0, 3).map((c) => (
                          <button
                            className="recent-row"
                            key={c.id}
                            onClick={() =>
                              setSheet({ kind: "detail", id: c.id })
                            }
                          >
                            <Avatar name={c.name} />
                            <div>
                              <b>{c.name}</b>
                              <small>
                                {clientPlates(c.id).length} placa(s) ·{" "}
                                {c.demo ? "Demonstração" : "Cliente"}
                              </small>
                            </div>
                            <ChevronRight size={18} />
                          </button>
                        ))}
                        {!store.clients.length && (
                          <Empty title="Sua próxima conexão começa aqui">
                            Cadastre seu primeiro cliente.
                          </Empty>
                        )}
                      </div>
                      <div className="studio-promo">
                        <span className="promo-label">
                          <QrCode size={18} /> QR STUDIO
                        </span>
                        <h3>
                          Pequeno código.
                          <br />
                          Grandes possibilidades.
                        </h3>
                        <p>
                          Personalize cada detalhe.
                          <br />
                          Pronto para a tela e para a gráfica.
                        </p>
                        <Button onClick={() => go("qr")}>
                          Abrir o Studio <ArrowUpRight size={17} />
                        </Button>
                      </div>
                    </div>
                  </section>
                  <p className="footnote">
                    <ShieldCheck size={14} /> Dados de exemplo identificados.
                    Seus cadastros ficam neste navegador.
                  </p>
                </>
              )}
              {view === "clients" && (
                <>
                  <Title
                    eyebrow="RELACIONAMENTOS"
                    title="Clientes"
                    description="Cada conexão tem uma história."
                    action={
                      <Button onClick={() => setSheet({ kind: "client" })}>
                        <Plus size={18} /> Novo cliente
                      </Button>
                    }
                  />
                  <div className="list-toolbar">
                    <Search
                      value={query}
                      onChange={setQuery}
                      placeholder="Buscar nome, empresa ou contato"
                    />
                    <div className="segmented">
                      {["Todos", "Com placas", "Sem placas"].map((f) => (
                        <button
                          key={f}
                          className={filter === f ? "active" : ""}
                          onClick={() => setFilter(f)}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <section className="panel client-list">
                    <div className="table-heading">
                      <span>CLIENTE</span>
                      <span>PLACAS / QRS</span>
                      <span>CADASTRO</span>
                    </div>
                    {store.clients
                      .filter(
                        (c) =>
                          `${c.name} ${c.company} ${c.email}`
                            .toLowerCase()
                            .includes(query.toLowerCase()) &&
                          (filter === "Todos" ||
                            (filter === "Com placas"
                              ? clientPlates(c.id).length > 0
                              : !clientPlates(c.id).length)),
                      )
                      .map((c) => (
                        <button
                          className="client-row"
                          key={c.id}
                          onClick={() => setSheet({ kind: "detail", id: c.id })}
                        >
                          <Avatar name={c.name} />
                          <div>
                            <b>{c.name}</b>
                            <small>
                              {c.company || c.email || "Sem empresa informada"}
                              {c.demo ? " · Exemplo" : ""}
                            </small>
                          </div>
                          <span className="client-count">
                            {clientPlates(c.id).length} placas{" "}
                            <small>
                              {
                                store.history.filter((h) => h.clientId === c.id)
                                  .length
                              }{" "}
                              QRs
                            </small>
                          </span>
                          <span className="client-date">
                            {date(c.createdAt)}
                          </span>
                          <ChevronRight size={18} />
                        </button>
                      ))}
                    {!store.clients.some(
                      (c) =>
                        `${c.name} ${c.company} ${c.email}`
                          .toLowerCase()
                          .includes(query.toLowerCase()) &&
                        (filter === "Todos" ||
                          (filter === "Com placas"
                            ? clientPlates(c.id).length > 0
                            : !clientPlates(c.id).length)),
                    ) && (
                      <Empty title="Nenhum cliente encontrado">
                        Tente outra busca ou adicione um cliente.
                      </Empty>
                    )}
                  </section>
                </>
              )}
              {view === "plates" && (
                <>
                  <Title
                    eyebrow="NFC + QR"
                    title="Suas placas"
                    description="Cada destino, no lugar certo."
                    action={
                      <Button onClick={() => setSheet({ kind: "plate" })}>
                        <Plus size={18} /> Nova placa
                      </Button>
                    }
                  />
                  <div className="list-toolbar">
                    <Search
                      value={query}
                      onChange={setQuery}
                      placeholder="Buscar placa ou cliente"
                    />
                    <Select
                      label="Status"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      {["Todos", "ativa", "inativa", "não configurada"].map(
                        (f) => (
                          <option key={f}>{f}</option>
                        ),
                      )}
                    </Select>
                  </div>
                  <div className="plates-grid">
                    {store.plates
                      .filter(
                        (p) =>
                          (filter === "Todos" || p.status === filter) &&
                          `${p.name} ${store.clients.find((c) => c.id === p.clientId)?.name}`
                            .toLowerCase()
                            .includes(query.toLowerCase()),
                      )
                      .map((p) => (
                        <article className="panel plate-card" key={p.id}>
                          <div className="plate-card-head">
                            <span className="icon-tile">
                              <Radio size={23} />
                            </span>
                            <Badge
                              tone={
                                p.status === "ativa" ? "success" : "neutral"
                              }
                            >
                              {p.status}
                            </Badge>
                          </div>
                          <h3>{p.name}</h3>
                          <p>
                            {store.clients.find((c) => c.id === p.clientId)
                              ?.name || "Sem cliente"}{" "}
                            {p.demo ? "· Exemplo" : ""}
                          </p>
                          <div className="plate-tags">
                            <span>{p.type}</span>
                            {p.nfc && <span>NFC</span>}
                            {p.qr && <span>QR</span>}
                          </div>
                          <div className="destination">
                            <small>DESTINO</small>
                            <span>
                              {p.destination || "Ainda não configurado"}
                            </span>
                          </div>
                          <div className="plate-meta">
                            <span>Criada em {date(p.createdAt)}</span>
                            <span>
                              {p.scans === null
                                ? "Scans não monitorados"
                                : `${p.scans} scans`}
                            </span>
                            <span>
                              Último acesso:{" "}
                              {p.lastAccess
                                ? date(p.lastAccess)
                                : "não monitorado"}
                            </span>
                          </div>
                          <div className="plate-buttons">
                            <Button
                              variant="secondary"
                              onClick={() =>
                                setSheet({ kind: "plate", id: p.id })
                              }
                            >
                              <Pencil size={16} /> Editar
                            </Button>
                            <Button
                              variant="ghost"
                              disabled={!safeUrl(p.destination)}
                              aria-label={`Copiar link de ${p.name}`}
                              onClick={() => copy(p.destination)}
                            >
                              <Copy size={17} />
                            </Button>
                            {safeUrl(p.destination) && (
                              <a
                                className="btn ghost"
                                aria-label={`Abrir destino de ${p.name}`}
                                href={safeUrl(p.destination)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink size={17} />
                              </a>
                            )}
                            <Button
                              variant="ghost"
                              aria-label={`Excluir ${p.name}`}
                              onClick={() =>
                                setSheet({ kind: "delete-plate", id: p.id })
                              }
                            >
                              <Trash2 size={17} />
                            </Button>
                          </div>
                          <Button
                            variant="secondary"
                            disabled={!safeUrl(p.destination)}
                            onClick={() => openQR(p.destination, p.clientId)}
                          >
                            <QrCode size={17} /> Personalizar QR
                          </Button>
                        </article>
                      ))}
                  </div>
                  {!store.plates.length && (
                    <Empty title="Vamos criar sua primeira placa?">
                      Escolha um cliente e configure o destino.
                    </Empty>
                  )}
                </>
              )}
              {(view === "qr" || view === "links") && (
                <QRStudio
                  key={`${view}-${qrDestination}`}
                  linkOnly={view === "links"}
                  initialURL={qrDestination}
                  initialClient={qrClient}
                  store={store}
                  update={update}
                  notify={setToast}
                />
              )}
              {view === "analytics" && <Analytics />}
              {view === "more" && (
                <>
                  <Title
                    eyebrow="SEU ESPAÇO"
                    title="Do seu jeito."
                    description="Ferramentas, preferências e próximos passos."
                  />
                  <div className="settings-grid">
                    <section className="panel settings">
                      <h2>Ferramentas</h2>
                      {[
                        {
                          name: "QR Studio",
                          sub: "Cores, estilos e arquivos para impressão",
                          icon: QrCode,
                          fn: () => go("qr"),
                        },
                        {
                          name: "Gerar link",
                          sub: "Instagram, WhatsApp, Google e mais",
                          icon: Link,
                          fn: () => go("links"),
                        },
                        {
                          name: "Analytics",
                          sub: "Acompanhe o estado do rastreamento",
                          icon: Activity,
                          fn: () => go("analytics"),
                        },
                        {
                          name: "Integrações",
                          sub: "Google Places e QR dinâmico",
                          icon: Globe,
                          fn: () => setSheet({ kind: "integrations" }),
                        },
                      ].map((x) => (
                        <button
                          className="setting-row"
                          key={x.name}
                          onClick={x.fn}
                        >
                          <span className="icon-tile">
                            <x.icon size={20} />
                          </span>
                          <div>
                            <b>{x.name}</b>
                            <small>{x.sub}</small>
                          </div>
                          <ChevronRight size={18} />
                        </button>
                      ))}
                    </section>
                    <section className="panel settings">
                      <h2>Preferências</h2>
                      <Toggle
                        label="Modo escuro"
                        checked={store.dark}
                        onChange={(dark) => update((s) => ({ ...s, dark }))}
                      />
                      <button
                        className="setting-row"
                        onClick={() => setSheet({ kind: "install" })}
                      >
                        <span className="icon-tile">
                          <Smartphone size={20} />
                        </span>
                        <div>
                          <b>Instalar aplicativo</b>
                          <small>Tenha o NFC PRO na tela inicial</small>
                        </div>
                        <ChevronRight size={18} />
                      </button>
                      <button
                        className="setting-row"
                        onClick={() => {
                          downloadBlob(
                            new Blob([JSON.stringify(store, null, 2)], {
                              type: "application/json",
                            }),
                            "nfc-pro-backup.json",
                          );
                          setToast(
                            "Backup exportado. Guarde em um lugar seguro.",
                          );
                        }}
                      >
                        <span className="icon-tile">
                          <Download size={20} />
                        </span>
                        <div>
                          <b>Exportar meus dados</b>
                          <small>Clientes, placas, estilos e histórico</small>
                        </div>
                        <ChevronRight size={18} />
                      </button>
                      <div className="notice">
                        <ShieldCheck size={20} />
                        <p>
                          <b>Seu espaço é local.</b>
                          <br />
                          Dados salvos neste navegador. Eles não são
                          sincronizados entre dispositivos.
                        </p>
                      </div>
                    </section>
                  </div>
                </>
              )}
            </>
          )}
        </main>
        <nav className="bottom-nav" aria-label="Navegação principal">
          {[
            { id: "home", name: "Início", icon: House },
            { id: "clients", name: "Clientes", icon: Users },
            { id: "add", name: "Criar", icon: Plus },
            { id: "plates", name: "Placas", icon: ScanLine },
            { id: "more", name: "Mais", icon: Ellipsis },
          ].map((n) => (
            <button
              key={n.id}
              aria-label={n.name}
              className={`${n.id === "add" ? "nav-create" : ""} ${view === n.id ? "active" : ""}`}
              onClick={() =>
                n.id === "add" ? setSheet({ kind: "menu" }) : go(n.id as View)
              }
            >
              <n.icon size={22} />
              {n.id !== "add" && <span>{n.name}</span>}
            </button>
          ))}
        </nav>
      </div>
      {toast && (
        <div role="status" className="toast">
          <Check size={17} />
          {toast}
        </div>
      )}
      {sheet?.kind === "menu" && (
        <Modal title="O que vamos criar?" onClose={() => setSheet(null)}>
          <div className="create-menu">
            {actions.map((a) => (
              <button key={a.id} onClick={() => action(a.id)}>
                <span className="icon-tile">
                  <a.icon size={22} />
                </span>
                <div>
                  <b>{a.label}</b>
                  <small>{a.sub}</small>
                </div>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
        </Modal>
      )}
      {sheet?.kind === "client" && (
        <ClientForm
          client={selectedClient}
          close={() => setSheet(null)}
          save={(c) => {
            update((s) => ({
              ...s,
              clients: selectedClient
                ? s.clients.map((x) => (x.id === c.id ? c : x))
                : [c, ...s.clients],
            }));
            setSheet(null);
            setToast("Cliente salvo.");
            go("clients");
          }}
        />
      )}
      {sheet?.kind === "plate" && (
        <PlateForm
          plate={selectedPlate}
          clients={store.clients}
          initialClient={sheet.clientId}
          close={() => setSheet(null)}
          save={(p, c) => {
            update((s) => ({
              ...s,
              clients: c ? [c, ...s.clients] : s.clients,
              plates: selectedPlate
                ? s.plates.map((x) => (x.id === p.id ? p : x))
                : [p, ...s.plates],
            }));
            setSheet(null);
            setToast("Placa salva.");
            go("plates");
          }}
        />
      )}
      {sheet?.kind === "detail" && selectedClient && (
        <Modal title={selectedClient.name} onClose={() => setSheet(null)}>
          <div className="detail-header">
            <Avatar name={selectedClient.name} />
            <div>
              <b>{selectedClient.company || "Cliente"}</b>
              <small>
                Desde {date(selectedClient.createdAt)}
                {selectedClient.demo ? " · Demonstração" : ""}
              </small>
            </div>
          </div>
          <div className="detail-grid">
            {[
              ["Telefone", selectedClient.phone],
              ["E-mail", selectedClient.email],
              ["Instagram", selectedClient.instagram],
              ["WhatsApp", selectedClient.whatsapp],
              ["Google Place ID", selectedClient.googlePlaceId],
              ["Avaliações Google", selectedClient.googleReviewUrl],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k}>
                  <small>{k}</small>
                  <p>{v}</p>
                </div>
              ))}
          </div>
          {selectedClient.notes && (
            <p className="notice">{selectedClient.notes}</p>
          )}
          <Section
            title="Placas vinculadas"
            action="Vincular nova"
            onClick={() =>
              setSheet({ kind: "plate", clientId: selectedClient.id })
            }
          />
          {clientPlates(selectedClient.id).map((p) => (
            <button
              className="linked-row"
              key={p.id}
              onClick={() => setSheet({ kind: "plate", id: p.id })}
            >
              <ScanLine size={19} />
              <div>
                <b>{p.name}</b>
                <small>{p.destination}</small>
                <small>
                  {p.status} · Último acesso:{" "}
                  {p.lastAccess ? date(p.lastAccess) : "não monitorado"}
                </small>
              </div>
              <ChevronRight size={17} />
            </button>
          ))}
          {!clientPlates(selectedClient.id).length && (
            <p className="muted">Nenhuma placa vinculada.</p>
          )}
          <Section title="QR Codes associados" />
          {store.history
            .filter((h) => h.clientId === selectedClient.id)
            .map((h) => (
              <div className="linked-row" key={h.id}>
                <QrCode size={18} />
                <div>
                  <b>{h.name}</b>
                  <small>{h.data}</small>
                </div>
              </div>
            ))}
          {!store.history.some((h) => h.clientId === selectedClient.id) && (
            <p className="muted">Nenhum QR salvo para este cliente.</p>
          )}
          <div className="form-actions">
            <Button
              variant="secondary"
              onClick={() =>
                setSheet({ kind: "client", id: selectedClient.id })
              }
            >
              <Pencil size={16} /> Editar cliente
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                setSheet({ kind: "delete-client", id: selectedClient.id })
              }
            >
              <Trash2 size={16} /> Excluir
            </Button>
          </div>
        </Modal>
      )}
      {(sheet?.kind === "delete-client" || sheet?.kind === "delete-plate") && (
        <Modal title="Confirmar exclusão" onClose={() => setSheet(null)}>
          <p>
            Excluir {selectedClient?.name || selectedPlate?.name}?{" "}
            {sheet.kind === "delete-client"
              ? "As placas e QRs serão mantidos, sem vínculo com este cliente."
              : "O QR já impresso continuará abrindo o destino original."}
          </p>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setSheet(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                const id = sheet.id;
                update((s) =>
                  sheet.kind === "delete-client"
                    ? {
                        ...s,
                        clients: s.clients.filter((c) => c.id !== id),
                        plates: s.plates.map((p) =>
                          p.clientId === id ? { ...p, clientId: "" } : p,
                        ),
                        history: s.history.map((h) =>
                          h.clientId === id ? { ...h, clientId: "" } : h,
                        ),
                      }
                    : { ...s, plates: s.plates.filter((p) => p.id !== id) },
                );
                setSheet(null);
                setToast("Registro excluído.");
              }}
            >
              Excluir registro
            </Button>
          </div>
        </Modal>
      )}
      {sheet?.kind === "integrations" && (
        <Modal title="Integrações" onClose={() => setSheet(null)}>
          <div className="notice">
            <Globe />
            <p>
              <b>Google Places</b>
              <br />
              Ainda não conectado. No QR Studio, use um link de avaliação ou um
              Place ID existente.
            </p>
          </div>
          <div className="notice">
            <Activity />
            <p>
              <b>QR dinâmico e analytics</b>
              <br />
              Dependem de um servidor de redirecionamento. Os QRs atuais são
              estáticos: editar uma placa não altera o código que já foi
              impresso.
            </p>
          </div>
        </Modal>
      )}
      {sheet?.kind === "install" && (
        <Modal title="NFC PRO na tela inicial" onClose={() => setSheet(null)}>
          <div className="notice">
            <Smartphone />
            <p>
              <b>iPhone · Safari</b>
              <br />
              Toque em Compartilhar → Adicionar à Tela de Início.
            </p>
          </div>
          <div className="notice">
            <Smartphone />
            <p>
              <b>Android · Chrome</b>
              <br />
              Abra o menu ⋮ e escolha Instalar aplicativo ou Adicionar à tela
              inicial.
            </p>
          </div>
          <p className="muted">
            A instalação exige que o aplicativo esteja publicado em HTTPS. Os
            dados ficam no navegador em que você os cadastrou.
          </p>
        </Modal>
      )}
    </div>
  );
}
function ClientForm({
  client,
  close,
  save,
}: {
  client?: Client;
  close: () => void;
  save: (c: Client) => void;
}) {
  const [form, set] = useState(
    client || {
      ...blankClient,
      id: uid(),
      createdAt: new Date().toISOString(),
    },
  );
  const field = (key: keyof Client, label: string, type = "text") => (
    <Field
      label={label}
      type={type}
      value={String(form[key] || "")}
      onChange={(e) => set({ ...form, [key]: e.target.value })}
      required={key === "name"}
      maxLength={key === "notes" ? 1500 : 200}
    />
  );
  return (
    <Modal title={client ? "Editar cliente" : "Novo cliente"} onClose={close}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (form.name.trim()) save({ ...form, name: form.name.trim() });
        }}
        className="form"
      >
        <div className="form-grid">
          {field("name", "Nome do cliente")}
          {field("company", "Empresa")}
          {field("phone", "Telefone", "tel")}
          {field("email", "E-mail", "email")}
          {field("instagram", "Instagram")}
          {field("whatsapp", "WhatsApp", "tel")}
          {field("googlePlaceId", "Google Place ID")}
          {field("googleReviewUrl", "Link de avaliação", "url")}
        </div>
        {field("notes", "Observações")}
        <Button type="submit">Salvar cliente</Button>
      </form>
    </Modal>
  );
}
function PlateForm({
  plate,
  clients,
  initialClient,
  close,
  save,
}: {
  plate?: Plate;
  clients: Client[];
  initialClient?: string;
  close: () => void;
  save: (p: Plate, c?: Client) => void;
}) {
  const [form, set] = useState<Plate>(
    plate || {
      id: uid(),
      clientId: initialClient || "",
      name: "",
      type: "Instagram",
      destination: "",
      status: "ativa",
      nfc: true,
      qr: true,
      createdAt: new Date().toISOString(),
      lastAccess: null,
      scans: null,
      mode: "static",
    },
  );
  const [newName, setNewName] = useState("");
  return (
    <Modal title={plate ? "Editar placa" : "Nova placa"} onClose={close}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          let c: Client | undefined;
          if (form.clientId === "new")
            c = {
              ...blankClient,
              id: uid(),
              createdAt: new Date().toISOString(),
              name: newName.trim(),
            };
          if (!form.name.trim() || (form.clientId === "new" && !c?.name))
            return;
          save(
            {
              ...form,
              name: form.name.trim(),
              clientId: c?.id || form.clientId,
              destination: form.destination.trim(),
              status: form.destination ? form.status : "não configurada",
            },
            c,
          );
        }}
      >
        <Select
          label="1. Cliente"
          value={form.clientId}
          onChange={(e) => set({ ...form, clientId: e.target.value })}
        >
          <option value="">Sem cliente</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value="new">+ Criar cliente agora</option>
        </Select>
        {form.clientId === "new" && (
          <Field
            label="Nome do novo cliente"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        )}
        <div className="form-grid">
          <Field
            label="Nome da placa"
            required
            value={form.name}
            onChange={(e) => set({ ...form, name: e.target.value })}
          />
          <Select
            label="2. Tipo"
            value={form.type}
            onChange={(e) => set({ ...form, type: e.target.value })}
          >
            {["Instagram", "WhatsApp", "Google", "Website", "Outro"].map(
              (t) => (
                <option key={t}>{t}</option>
              ),
            )}
          </Select>
        </div>
        <Field
          label="3. Link de destino"
          type="url"
          placeholder="https://"
          required={form.status !== "não configurada"}
          value={form.destination}
          onChange={(e) => set({ ...form, destination: e.target.value })}
        />
        <Select
          label="Status"
          value={form.status}
          onChange={(e) =>
            set({ ...form, status: e.target.value as Plate["status"] })
          }
        >
          {["ativa", "inativa", "não configurada"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
        <div className="form-grid">
          <Toggle
            label="Possui NFC"
            checked={form.nfc}
            onChange={(nfc) => set({ ...form, nfc })}
          />
          <Toggle
            label="Possui QR"
            checked={form.qr}
            onChange={(qr) => set({ ...form, qr })}
          />
        </div>
        {safeUrl(form.destination) && (
          <div className="mini-qr">
            <QRSmall value={form.destination} />
            <p>
              QR pronto para este destino.
              <br />
              <small>Personalize e exporte no Studio após salvar.</small>
            </p>
          </div>
        )}
        <p className="notice">
          O status organiza seu cadastro. Ele não bloqueia um QR estático já
          impresso nem grava a tag NFC.
        </p>
        <Button type="submit">Salvar placa</Button>
      </form>
    </Modal>
  );
}
const QRSmall = dynamic(
  () =>
    import("qrcode.react").then((m) => ({
      default: ({ value }: { value: string }) => (
        <m.QRCodeSVG value={value} size={100} marginSize={4} level="H" />
      ),
    })),
  { ssr: false },
);
function Analytics() {
  const [period, setPeriod] = useState("7 dias");
  return (
    <>
      <Title
        eyebrow="RESULTADOS"
        title="Cada acesso conta."
        description="Tudo pronto para acompanhar suas conexões."
      />
      <div className="segmented analytics-period">
        {["Hoje", "7 dias", "30 dias"].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={period === p ? "active" : ""}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="analytics-grid">
        {[
          "Scans totais",
          `Scans · ${period}`,
          "QR mais acessado",
          "Placa mais acessada",
        ].map((t) => (
          <article className="panel analytic-metric" key={t}>
            <span>{t}</span>
            <strong>—</strong>
            <small>Rastreamento não conectado</small>
          </article>
        ))}
      </div>
      <section className="analytics-empty">
        <Activity size={32} />
        <h2>
          Os primeiros dados começam
          <br />
          com um QR dinâmico.
        </h2>
        <p>
          Seus QRs estáticos funcionam normalmente. Para contar scans e medir
          resultados, será necessário conectar o serviço de redirecionamento.
        </p>
        <Badge>Sem dados de demonstração</Badge>
      </section>
      <div className="analytics-grid">
        {[
          [Smartphone, "Dispositivos"],
          [Monitor, "Navegadores"],
          [MapPin, "Cidades"],
          [Globe, "Países"],
        ].map(([Icon, title]) => {
          const I = Icon as typeof Smartphone;
          return (
            <article className="panel analytics-breakdown" key={String(title)}>
              <I size={21} />
              <h3>{String(title)}</h3>
              <p>Nenhum dado disponível.</p>
            </article>
          );
        })}
      </div>
    </>
  );
}
