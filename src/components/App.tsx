"use client";

import Image from "next/image";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";
import {
  CardIcon, ChevronRight, CloseIcon, HomeIcon, LinkIcon, MoonIcon,
  MoreIcon, PlusIcon, QrIcon, SunIcon, UsersIcon
} from "./icons";

type View = "home" | "qr" | "clients" | "plates" | "more";
type Client = { id:number; name:string; channel:string; detail:string; initials:string; tone:string };
type Plate = { id:number; client:string; type:string; destination:string; active:boolean };

const initialClients: Client[] = [
  { id:1, name:"Andreia Paz", channel:"Instagram", detail:"QR + NFC", initials:"AP", tone:"pink" },
  { id:2, name:"Reuse Brechó", channel:"WhatsApp", detail:"NFC", initials:"RB", tone:"green" },
  { id:3, name:"Byfit Ibiporã", channel:"Google", detail:"Avaliações", initials:"BI", tone:"black" },
];

const initialPlates: Plate[] = [
  { id:1, client:"Andreia Paz", type:"Instagram", destination:"@andreiapaz_acessorios", active:true },
  { id:2, client:"Reuse Brechó", type:"WhatsApp", destination:"Grupo de vendas", active:true },
  { id:3, client:"Byfit Ibiporã", type:"Google", destination:"Avaliações Google", active:true },
  { id:4, client:"Reuse Brechó", type:"Instagram", destination:"Perfil comercial", active:true },
];

function Brand(){
  return <div className="brandMark">
    <Image src="/nfc-pro-icon.svg" width={42} height={42} alt="NFC PRO"/>
    <div><strong>NFC <b>PRO</b></strong><span>Smart links</span></div>
  </div>
}

function Topbar({dark,setDark}:{dark:boolean;setDark:(v:boolean)=>void}){
  return <header className="topbar">
    <Brand/>
    <div className="topActions">
      <button className="roundButton" aria-label="Alternar tema" onClick={()=>setDark(!dark)}>{dark?<SunIcon/>:<MoonIcon/>}</button>
      <button className="profileButton" aria-label="Perfil"><span>DP</span></button>
    </div>
  </header>
}

function BottomNav({view,setView,onAdd}:{view:View;setView:(v:View)=>void;onAdd:()=>void}){
  const Item=({id,label,Icon}:{id:View;label:string;Icon:typeof HomeIcon}) =>
    <button className={view===id?"navItem active":"navItem"} onClick={()=>setView(id)}><Icon/><span>{label}</span></button>;
  return <nav className="bottomNav">
    <Item id="home" label="Início" Icon={HomeIcon}/>
    <Item id="clients" label="Clientes" Icon={UsersIcon}/>
    <button className="navPlus" onClick={onAdd} aria-label="Criar"><PlusIcon/></button>
    <Item id="plates" label="Placas" Icon={CardIcon}/>
    <Item id="more" label="Mais" Icon={MoreIcon}/>
  </nav>
}

function Sidebar({view,setView}:{view:View;setView:(v:View)=>void}){
  const rows:[View,string,typeof HomeIcon][]=[
    ["home","Visão geral",HomeIcon],["clients","Clientes",UsersIcon],
    ["plates","Placas",CardIcon],["qr","QR Studio",QrIcon],["more","Configurações",MoreIcon]
  ];
  return <aside className="sidebar">
    <Brand/>
    <div className="sideMenu">{rows.map(([id,label,Icon])=>
      <button key={id} className={view===id?"sideItem active":"sideItem"} onClick={()=>setView(id)}><Icon/><span>{label}</span></button>
    )}</div>
    <div className="sideBottom"><span>NFC PRO</span><small>v0.2 · mobile first</small></div>
  </aside>
}

function SectionHeader({title,action,onAction}:{title:string;action?:string;onAction?:()=>void}){
  return <div className="sectionHeader"><h2>{title}</h2>{action&&<button onClick={onAction}>{action}<ChevronRight/></button>}</div>
}

function Home({clients,plates,setView,onAdd}:{clients:Client[];plates:Plate[];setView:(v:View)=>void;onAdd:()=>void}){
  const accesses=147, qrs=36;
  return <main className="page homePage">
    <section className="welcome">
      <span>Boa tarde,</span>
      <h1>Vamos continuar?</h1>
      <p>Gerencie suas placas NFC, QR Codes e clientes de forma simples e profissional.</p>
    </section>

    <section className="heroCard">
      <div className="heroCopy">
        <div className="heroLabel"><span className="glassIcon"><CardIcon/></span><strong>Placas ativas</strong></div>
        <div className="heroNumber">{plates.filter(p=>p.active).length}</div>
        <div className="heroGrowth"><span>↗</span> +3 este mês</div>
      </div>
      <div className="heroArtwork">
        <div className="signalRing r1"/><div className="signalRing r2"/><div className="signalRing r3"/>
        <div className="miniPlate"><Image src="/nfc-pro-icon.svg" width={82} height={82} alt=""/></div>
      </div>
      <button className="heroArrow" onClick={()=>setView("plates")}><ChevronRight/></button>
    </section>

    <section className="metricGrid">
      <button className="metricCard" onClick={()=>setView("clients")}>
        <span className="metricIcon"><UsersIcon/></span><small>Clientes</small><strong>{clients.length}</strong><em>↗ +2 este mês</em>
      </button>
      <article className="metricCard">
        <span className="metricIcon bars">▥</span><small>Acessos</small><strong>{accesses}</strong><em>↗ +18%</em>
      </article>
      <button className="metricCard" onClick={()=>setView("qr")}>
        <span className="metricIcon"><QrIcon/></span><small>QRs gerados</small><strong>{qrs}</strong><em>↗ +6 este mês</em>
      </button>
    </section>

    <section className="contentSection">
      <SectionHeader title="Ações rápidas" action="Ver tudo" onAction={onAdd}/>
      <div className="actionGrid">
        <button className="actionCard" onClick={()=>setView("qr")}><span><QrIcon/></span><b>Gerar QR</b><small>Crie um QR Code para seu cliente</small><i><ChevronRight/></i></button>
        <button className="actionCard" onClick={onAdd}><span><LinkIcon/></span><b>Nova placa</b><small>Cadastre uma nova placa NFC</small><i><ChevronRight/></i></button>
        <button className="actionCard" onClick={onAdd}><span><UsersIcon/></span><b>Novo cliente</b><small>Adicione um novo cliente</small><i><ChevronRight/></i></button>
      </div>
    </section>

    <section className="contentSection">
      <SectionHeader title="Recentes" action="Ver todos" onAction={()=>setView("clients")}/>
      <div className="recentList">{clients.slice(0,3).map(c=>
        <button className="recentItem" key={c.id} onClick={()=>setView("clients")}>
          <span className={"clientLogo "+c.tone}>{c.initials}</span>
          <span className="recentText"><b>{c.name}</b><small>{c.channel} · {c.detail}</small></span>
          <span className="activePill"><i/>Ativo</span><ChevronRight/>
        </button>
      )}</div>
    </section>
  </main>
}

function QRStudio(){
  const [value,setValue]=useState("https://instagram.com/andreiapaz_acessorios");
  const [color,setColor]=useState("#202020");
  const [bg,setBg]=useState("#ffffff");
  const [size,setSize]=useState(280);

  const download=()=>{
    const canvas=document.getElementById("nfc-pro-qr") as HTMLCanvasElement|null;
    if(!canvas) return;
    const a=document.createElement("a");
    a.download="nfc-pro-qr.png";
    a.href=canvas.toDataURL("image/png");
    a.click();
  };

  return <main className="page toolPage">
    <section className="pageTitle"><span>FERRAMENTA</span><h1>QR Studio</h1><p>Gere o QR real, ajuste as cores e exporte em alta qualidade.</p></section>
    <div className="qrWorkspace">
      <section className="panel controlsPanel">
        <label>Link de destino</label>
        <div className="field"><LinkIcon/><input value={value} onChange={e=>setValue(e.target.value)} placeholder="Cole um link"/></div>
        <div className="controlPair">
          <div><label>Cor do QR</label><div className="colorField"><input type="color" value={color} onChange={e=>setColor(e.target.value)}/><span>{color.toUpperCase()}</span></div></div>
          <div><label>Fundo</label><div className="colorField"><input type="color" value={bg} onChange={e=>setBg(e.target.value)}/><span>{bg.toUpperCase()}</span></div></div>
        </div>
        <label>Tamanho</label>
        <div className="rangeRow"><input type="range" min="200" max="600" step="20" value={size} onChange={e=>setSize(Number(e.target.value))}/><b>{size}px</b></div>
        <div className="tipBox"><span>✓</span><p><b>QR dinâmico na próxima etapa.</b><br/>Esta versão já gera QR funcional para links fixos.</p></div>
      </section>
      <section className="panel qrPreviewPanel">
        <div className="previewTitle"><div><b>Prévia</b><small>Escaneável em tempo real</small></div><span className="liveDot">● LIVE</span></div>
        <div className="qrStage" style={{background:bg}}>
          <QRCodeCanvas id="nfc-pro-qr" value={value || "https://nfcpro.app"} size={Math.min(size,340)} bgColor={bg} fgColor={color} level="H" marginSize={2}/>
        </div>
        <button className="mainCTA" onClick={download}>Baixar PNG</button>
        <div className="exportRow"><button onClick={()=>setSize(400)}>Alta resolução</button><span>•</span><button>PDF 10×12 em breve</button></div>
      </section>
    </div>
  </main>
}

function Clients({clients,onNew}:{clients:Client[];onNew:()=>void}){
  const [q,setQ]=useState("");
  const filtered=useMemo(()=>clients.filter(c=>c.name.toLowerCase().includes(q.toLowerCase())||c.channel.toLowerCase().includes(q.toLowerCase())),[clients,q]);
  return <main className="page listPage">
    <section className="pageTitle rowTitle"><div><span>GESTÃO</span><h1>Clientes</h1><p>{clients.length} clientes cadastrados.</p></div><button className="smallCTA" onClick={onNew}><PlusIcon/> Novo</button></section>
    <div className="searchBox">⌕<input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar cliente..."/></div>
    <div className="clientCards">{filtered.map(c=>
      <article className="clientCard" key={c.id}><span className={"clientLogo large "+c.tone}>{c.initials}</span><div><b>{c.name}</b><small>{c.channel} · {c.detail}</small></div><span className="activePill"><i/>Ativo</span><button><ChevronRight/></button></article>
    )}</div>
  </main>
}

function Plates({plates,onNew}:{plates:Plate[];onNew:()=>void}){
  return <main className="page listPage">
    <section className="pageTitle rowTitle"><div><span>GESTÃO</span><h1>Placas</h1><p>Acompanhe cada placa e seu destino.</p></div><button className="smallCTA" onClick={onNew}><PlusIcon/> Nova</button></section>
    <div className="plateGrid">{plates.map(p=>
      <article className="plateCard" key={p.id}><div className="plateTop"><span className="plateIcon"><CardIcon/></span><span className="activePill"><i/>Ativo</span></div><h3>{p.client}</h3><p>{p.type}</p><div className="plateDestination"><small>Destino</small><b>{p.destination}</b></div><button>Gerenciar <ChevronRight/></button></article>
    )}</div>
  </main>
}

function More({dark,setDark,setView}:{dark:boolean;setDark:(v:boolean)=>void;setView:(v:View)=>void}){
  return <main className="page listPage">
    <section className="pageTitle"><span>NFC PRO</span><h1>Mais</h1><p>Preferências e ferramentas.</p></section>
    <div className="settingsCard">
      <button onClick={()=>setView("qr")}><span className="settingIcon"><QrIcon/></span><div><b>QR Studio</b><small>Gerador profissional</small></div><ChevronRight/></button>
      <button onClick={()=>setDark(!dark)}><span className="settingIcon">{dark?<SunIcon/>:<MoonIcon/>}</span><div><b>Aparência</b><small>{dark?"Modo escuro":"Modo claro"}</small></div><span className={dark?"switch on":"switch"}><i/></span></button>
      <button><span className="settingIcon"><LinkIcon/></span><div><b>Integrações</b><small>Google Places em breve</small></div><ChevronRight/></button>
    </div>
  </main>
}

function CreateSheet({mode,onClose,onCreateClient,onCreatePlate}:{mode:"menu"|"client"|"plate";onClose:()=>void;onCreateClient:(name:string)=>void;onCreatePlate:(client:string)=>void}){
  const [name,setName]=useState("");
  return <div className="sheetBackdrop" onClick={onClose}><section className="bottomSheet" onClick={e=>e.stopPropagation()}>
    <div className="sheetHandle"/>
    <div className="sheetHeading"><div><b>{mode==="menu"?"Criar novo":mode==="client"?"Novo cliente":"Nova placa"}</b><small>{mode==="menu"?"Escolha uma ação":"Preencha o básico agora"}</small></div><button onClick={onClose}><CloseIcon/></button></div>
    {mode==="menu"?<div className="sheetActions"><button data-action="qr"><span><QrIcon/></span><div><b>Gerar QR Code</b><small>Abra o QR Studio</small></div><ChevronRight/></button><button data-action="client"><span><UsersIcon/></span><div><b>Novo cliente</b><small>Cadastre um negócio</small></div><ChevronRight/></button><button data-action="plate"><span><CardIcon/></span><div><b>Nova placa</b><small>Registre uma placa NFC</small></div><ChevronRight/></button></div>:
    <div className="simpleForm"><label>{mode==="client"?"Nome do cliente":"Cliente da placa"}</label><input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder={mode==="client"?"Ex: Studio Bella":"Ex: Andreia Paz"}/><button className="mainCTA" disabled={!name.trim()} onClick={()=>mode==="client"?onCreateClient(name.trim()):onCreatePlate(name.trim())}>Salvar</button></div>}
  </section></div>
}

export default function App(){
  const [view,setView]=useState<View>("home");
  const [dark,setDark]=useState(false);
  const [sheet,setSheet]=useState<null|"menu"|"client"|"plate">(null);
  const [clients,setClients]=useState(initialClients);
  const [plates,setPlates]=useState(initialPlates);

  useEffect(()=>{document.documentElement.dataset.theme=dark?"dark":"light"},[dark]);

  const createClient=(name:string)=>{
    const initials=name.split(" ").slice(0,2).map(x=>x[0]?.toUpperCase()).join("");
    setClients(v=>[{id:Date.now(),name,channel:"Novo cliente",detail:"Sem placa",initials:initials||"NC",tone:"blue"},...v]);
    setSheet(null); setView("clients");
  };
  const createPlate=(client:string)=>{
    setPlates(v=>[{id:Date.now(),client,type:"NFC",destination:"Não configurado",active:true},...v]);
    setSheet(null); setView("plates");
  };

  const render=()=>view==="home"?<Home clients={clients} plates={plates} setView={setView} onAdd={()=>setSheet("menu")}/>:
    view==="qr"?<QRStudio/>:view==="clients"?<Clients clients={clients} onNew={()=>setSheet("client")}/>:
    view==="plates"?<Plates plates={plates} onNew={()=>setSheet("plate")}/>:<More dark={dark} setDark={setDark} setView={setView}/>;

  return <div className="appShell">
    <Sidebar view={view} setView={setView}/>
    <div className="mainShell"><Topbar dark={dark} setDark={setDark}/>{render()}<BottomNav view={view} setView={setView} onAdd={()=>setSheet("menu")}/></div>
    {sheet&&<CreateSheet mode={sheet} onClose={()=>setSheet(null)} onCreateClient={createClient} onCreatePlate={createPlate}/>}
    {sheet==="menu"&&<div className="sheetClickLayer" onClick={(e)=>{
      const target=(e.target as HTMLElement).closest("button[data-action]") as HTMLButtonElement|null;
      if(!target)return;
      const action=target.dataset.action;
      if(action==="qr"){setSheet(null);setView("qr")}
      if(action==="client")setSheet("client");
      if(action==="plate")setSheet("plate");
    }}/>}
  </div>
}
