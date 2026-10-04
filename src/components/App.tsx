"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CardIcon, ChevronRight, CloseIcon, HomeIcon, LinkIcon, MoonIcon, MoreIcon, PlusIcon, QrIcon, SunIcon, UsersIcon } from "./icons";

type View = "home" | "qr" | "clients" | "plates" | "more";

const recent = [
  { name: "Andreia Paz", detail: "Instagram · QR + NFC", status: "Ativo", initials: "AP" },
  { name: "Reuse Brechó", detail: "WhatsApp · NFC", status: "Ativo", initials: "RB" },
  { name: "Byfit Ibiporã", detail: "Google · Avaliações", status: "Ativo", initials: "BI" }
];

function BottomNav({ view, setView, openAdd }: { view: View; setView: (v: View)=>void; openAdd:()=>void }) {
  const item=(key:View,label:string,Icon:typeof HomeIcon)=><button className={view===key?"navItem active":"navItem"} onClick={()=>setView(key)}><Icon/><span>{label}</span></button>;
  return <nav className="bottomNav">
    {item("home","Início",HomeIcon)}
    {item("clients","Clientes",UsersIcon)}
    <button className="addNav" onClick={openAdd} aria-label="Adicionar"><PlusIcon/></button>
    {item("plates","Placas",CardIcon)}
    {item("more","Mais",MoreIcon)}
  </nav>
}

function Sidebar({view,setView}: {view:View;setView:(v:View)=>void}) {
  const rows:[View,string,typeof HomeIcon][]=[["home","Visão geral",HomeIcon],["clients","Clientes",UsersIcon],["plates","Placas",CardIcon],["qr","QR Studio",QrIcon],["more","Mais",MoreIcon]];
  return <aside className="sidebar">
    <div className="brand"><Image src="/nfc-pro-icon.svg" width={38} height={38} alt="NFC PRO"/><strong>NFC PRO</strong></div>
    <div className="sideMenu">{rows.map(([k,l,I])=><button key={k} className={view===k?"sideItem active":"sideItem"} onClick={()=>setView(k)}><I/><span>{l}</span></button>)}</div>
    <div className="sideFoot">v0.1 · interface</div>
  </aside>
}

function Header({dark,setDark}: {dark:boolean;setDark:(v:boolean)=>void}) {
  return <header className="topbar">
    <div className="mobileBrand"><Image src="/nfc-pro-icon.svg" width={34} height={34} alt="NFC PRO"/><strong>NFC PRO</strong></div>
    <div className="spacer"/>
    <button className="iconButton" onClick={()=>setDark(!dark)} aria-label="Alternar tema">{dark?<SunIcon/>:<MoonIcon/>}</button>
    <div className="avatar">DP</div>
  </header>
}

function Home({setView}:{setView:(v:View)=>void}) {
  return <main className="page homePage">
    <section className="hello"><p className="eyebrow">VISÃO GERAL</p><h1>Boa tarde 👋</h1><p>Gerencie seus clientes e placas em um só lugar.</p></section>
    <section className="stats">
      <article className="statCard primaryStat"><div className="statTop"><span>Placas ativas</span><span className="trend">+3 este mês</span></div><strong>18</strong><div className="progress"><i style={{width:"82%"}}/></div></article>
      <article className="statCard"><span>Clientes</span><strong>12</strong><small>+2 este mês</small></article>
      <article className="statCard"><span>Acessos</span><strong>147</strong><small>+23 esta semana</small></article>
    </section>
    <section className="sectionBlock"><div className="sectionTitle"><h2>Ações rápidas</h2></div><div className="quickGrid">
      <button className="quickCard" onClick={()=>setView("qr")}><span className="quickIcon blue"><QrIcon/></span><div><strong>Gerar QR</strong><small>Personalize e exporte</small></div><ChevronRight/></button>
      <button className="quickCard"><span className="quickIcon"><CardIcon/></span><div><strong>Nova placa</strong><small>Cadastre uma placa NFC</small></div><ChevronRight/></button>
      <button className="quickCard"><span className="quickIcon"><UsersIcon/></span><div><strong>Novo cliente</strong><small>Adicione um negócio</small></div><ChevronRight/></button>
    </div></section>
    <section className="sectionBlock recentBlock"><div className="sectionTitle"><h2>Recentes</h2><button>Ver todos</button></div><div className="listCard">{recent.map((r,i)=><button className="recentRow" key={r.name}><div className="clientAvatar">{r.initials}</div><div className="clientText"><strong>{r.name}</strong><span>{r.detail}</span></div><div className="status"><i/> {r.status}</div><ChevronRight className="chev"/>{i<recent.length-1&&<span className="divider"/>}</button>)}</div></section>
  </main>
}

function QrStudio(){
  const [color,setColor]=useState("#202020"); const [style,setStyle]=useState("Suave");
  return <main className="page qrPage"><section className="hello"><p className="eyebrow">FERRAMENTAS</p><h1>QR Studio</h1><p>Crie QR Codes bonitos e prontos para suas placas.</p></section>
    <div className="studioLayout"><section className="editorCard"><label>Destino</label><div className="inputWrap"><LinkIcon/><input defaultValue="https://instagram.com/cliente"/></div><label>Estilo</label><div className="segments">{["Clássico","Pontos","Suave"].map(s=><button key={s} className={style===s?"selected":""} onClick={()=>setStyle(s)}>{s}</button>)}</div><label>Cor</label><div className="colorRow">{["#202020","#2563eb","#a36a16","#7c3aed"].map(c=><button aria-label={c} key={c} className={color===c?"colorSwatch selected":"colorSwatch"} style={{background:c}} onClick={()=>setColor(c)}/>)}</div><label>Centro</label><div className="logoChoices"><button className="selected">Sem logo</button><button>Instagram</button><button>WhatsApp</button></div></section>
      <section className="previewCard"><div className="previewHead"><span>Prévia</span><small>Atualização em tempo real</small></div><div className="fakeQr" style={{color}}><div className="finder a"/><div className="finder b"/><div className="finder c"/>{Array.from({length:46}).map((_,i)=><i key={i} style={{left:`${12+(i*17)%76}%`,top:`${11+(i*29)%76}%`,borderRadius:style==="Clássico"?"1px":style==="Pontos"?"50%":"4px"}}/>)}</div><button className="primaryButton">Baixar PNG</button><div className="exportLinks"><button>SVG</button><span>•</span><button>PDF</button><span>•</span><button>10 × 12 cm</button></div></section></div>
  </main>
}

function Placeholder({title,subtitle}:{title:string;subtitle:string}){return <main className="page placeholder"><div className="placeholderIcon"><CardIcon/></div><h1>{title}</h1><p>{subtitle}</p><span>Interface reservada para a próxima etapa.</span></main>}

export default function App(){
  const [view,setView]=useState<View>("home"); const [dark,setDark]=useState(false); const [sheet,setSheet]=useState(false);
  useEffect(()=>{document.documentElement.dataset.theme=dark?"dark":"light"},[dark]);
  return <div className="appShell"><Sidebar view={view} setView={setView}/><div className="mainShell"><Header dark={dark} setDark={setDark}/>{view==="home"?<Home setView={setView}/>:view==="qr"?<QrStudio/>:view==="clients"?<Placeholder title="Clientes" subtitle="Organize negócios, contatos e destinos de cada placa."/>:view==="plates"?<Placeholder title="Placas" subtitle="Acompanhe configuração, status e destino das placas NFC."/>:<Placeholder title="Mais" subtitle="Configurações, integrações, aparência e conta."/>}<BottomNav view={view} setView={setView} openAdd={()=>setSheet(true)}/></div>
    {sheet&&<div className="sheetBackdrop" onClick={()=>setSheet(false)}><section className="bottomSheet" onClick={e=>e.stopPropagation()}><div className="sheetHandle"/><div className="sheetTitle"><div><strong>Criar novo</strong><span>O que você quer fazer?</span></div><button className="iconButton" onClick={()=>setSheet(false)}><CloseIcon/></button></div><button onClick={()=>{setView("qr");setSheet(false)}}><span className="quickIcon blue"><QrIcon/></span><div><strong>Gerar QR Code</strong><small>Crie e personalize um QR</small></div><ChevronRight/></button><button><span className="quickIcon"><CardIcon/></span><div><strong>Nova placa</strong><small>Cadastre uma placa NFC</small></div><ChevronRight/></button><button><span className="quickIcon"><UsersIcon/></span><div><strong>Novo cliente</strong><small>Cadastre um negócio</small></div><ChevronRight/></button></section></div>}
  </div>
}
