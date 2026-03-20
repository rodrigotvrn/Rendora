"use client";
import { useState } from "react";
import PreparacoesRendora from "./components/Preparacoes";
import PlanejamentoRendora from "./components/Planejamento";

var C = {
  navy: "#192B47", navyLight: "#1E3250", navyMid: "#243A5C",
  surface: "#162842", border: "#2A4266", accent: "#00BDE4",
  green: "#2EAD4B", gold: "#E8A832", danger: "#E5484D",
  warning: "#F5A623", white: "#F1F5F9", text: "#CBD5E1",
  textMuted: "#8B9FC0", textDim: "#5A7194",
};
var sBtnGreen = { padding: "10px 20px", borderRadius: 8, border: "none", background: C.green, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" };
var sBtnOutline = { padding: "8px 16px", borderRadius: 8, border: "1px solid " + C.border, background: "transparent", color: C.textMuted, fontWeight: 600, fontSize: 12, cursor: "pointer" };
function fmtBRL(v) { return "R$ " + (v || 0).toFixed(2).replace(".", ","); }
function fmtInt(v) { return (v || 0).toLocaleString("pt-BR"); }

/* ═══ DASHBOARD ═══ */
function ModDashboard() {
  var kpis = [
    { label: "RECEITAS", valor: "34", icon: "📋", cor: C.accent },
    { label: "INGREDIENTES", valor: "53", icon: "🥕", cor: C.green },
    { label: "CLIENTES ATIVOS", valor: "8", icon: "🏢", cor: C.gold },
    { label: "CARDAPIOS/MES", valor: "127", icon: "📅", cor: C.warning },
    { label: "CUSTO MEDIO", valor: "R$ 8,42", icon: "💰", cor: C.green },
    { label: "COMENSAIS/DIA", valor: "3.850", icon: "👥", cor: C.accent },
  ];
  var alertas = [
    { tipo: "warning", msg: "Estoque de Peito de Frango abaixo do minimo (12kg restantes)", cor: C.gold, icon: "⚠️" },
    { tipo: "danger", msg: "3 cardapios pendentes de aprovacao para amanha", cor: C.danger, icon: "🚨" },
    { tipo: "info", msg: "Novo pedido de compras #PC-0045 aguardando cotacao", cor: C.accent, icon: "💡" },
    { tipo: "success", msg: "Baixa de producao do almoco concluida — 19 unidades", cor: C.green, icon: "✅" },
  ];
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.white, marginBottom: 4 }}>Dashboard Operacional</div>
      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 20 }}>Visao geral da operacao</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {kpis.map(function (k) {
          return (<div key={k.label} style={{ background: k.cor + "08", borderRadius: 14, padding: "16px 18px", border: "1px solid " + k.cor + "22" }}>
            <div style={{ fontSize: 9, color: C.textDim, fontWeight: 700 }}>{k.label}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: k.cor, marginTop: 4 }}>{k.valor}</div>
              <span style={{ fontSize: 28, opacity: 0.4 }}>{k.icon}</span>
            </div>
          </div>);
        })}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 10 }}>Alertas</div>
      {alertas.map(function (a, i) {
        return (<div key={i} style={{ background: a.cor + "08", borderRadius: 10, padding: "12px 16px", marginBottom: 8, border: "1px solid " + a.cor + "22", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>{a.icon}</span>
          <span style={{ fontSize: 13, color: C.text }}>{a.msg}</span>
        </div>);
      })}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24 }}>
        <div style={{ background: C.navyMid, borderRadius: 14, padding: 18, border: "1px solid " + C.border }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, marginBottom: 12 }}>Custos por Turno (Hoje)</div>
          {[{ turno: "Almoco", com: 2400, custo: 19200 }, { turno: "Lanche", com: 800, custo: 4800 }, { turno: "Jantar", com: 650, custo: 5850 }].map(function (t) {
            return (<div key={t.turno} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid " + C.border + "33" }}>
              <span style={{ fontSize: 13, color: C.text }}>{t.turno}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>{fmtBRL(t.custo)}</span>
            </div>);
          })}
        </div>
        <div style={{ background: C.navyMid, borderRadius: 14, padding: 18, border: "1px solid " + C.border }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.danger, marginBottom: 12 }}>Estoque Critico</div>
          {[{ nome: "Peito de Frango", qtd: 12, min: 30, un: "kg" }, { nome: "Oleo de Soja", qtd: 8, min: 20, un: "L" }, { nome: "Arroz Tipo 1", qtd: 45, min: 80, un: "kg" }].map(function (e) {
            return (<div key={e.nome} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: C.text }}>{e.nome}</span>
                <span style={{ color: C.danger, fontWeight: 700 }}>{e.qtd}/{e.min} {e.un}</span>
              </div>
              <div style={{ height: 6, background: C.surface, borderRadius: 3, marginTop: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: (e.qtd / e.min * 100) + "%", background: e.qtd < e.min ? C.danger : C.green, borderRadius: 3 }} />
              </div>
            </div>);
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══ CLIENTES ═══ */
function ModClientes() {
  var cls = [
    { nome: "Prefeitura de Natal", tipo: "Publico", un: 6, com: 1200, valor: "R$ 1.450.000" },
    { nome: "Hospital Regional", tipo: "Publico", un: 2, com: 800, valor: "R$ 680.000" },
    { nome: "Grupo Escola Viva", tipo: "Privado", un: 4, com: 600, valor: "R$ 420.000" },
    { nome: "Construtora Norberto", tipo: "Privado", un: 3, com: 450, valor: "R$ 310.000" },
    { nome: "Tribunal de Justica", tipo: "Publico", un: 1, com: 350, valor: "R$ 280.000" },
    { nome: "UFRN", tipo: "Publico", un: 3, com: 450, valor: "R$ 520.000" },
  ];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div><div style={{ fontSize: 20, fontWeight: 800, color: C.white }}>Clientes</div><div style={{ fontSize: 12, color: C.textMuted }}>{cls.length} clientes ativos</div></div>
        <button style={sBtnGreen}>+ Novo Cliente</button>
      </div>
      {cls.map(function (cl) {
        return (<div key={cl.nome} style={{ background: C.navyMid, borderRadius: 12, padding: "14px 18px", border: "1px solid " + C.border, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>{cl.nome}</div><span style={{ fontSize: 11, color: cl.tipo === "Publico" ? C.accent : C.gold, fontWeight: 600 }}>{cl.tipo} | {cl.un} unidades</span></div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 15, fontWeight: 700, color: C.accent }}>{fmtInt(cl.com)}/dia</div><div style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>{cl.valor}</div></div>
        </div>);
      })}
    </div>
  );
}

/* ═══ COMPRAS ═══ */
function ModCompras() {
  var ped = [
    { id: "PC-0045", data: "18/03", un: "CD Natal", itens: 23, st: "cotacao", valor: 12450 },
    { id: "PC-0044", data: "17/03", un: "Parnamirim", itens: 15, st: "aprovado", valor: 8300 },
    { id: "PC-0043", data: "16/03", un: "CD Natal", itens: 31, st: "entregue", valor: 18720 },
  ];
  var stC = { cotacao: C.gold, aprovado: C.accent, entregue: C.green };
  var stN = { cotacao: "Em cotacao", aprovado: "Aprovado", entregue: "Entregue" };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div><div style={{ fontSize: 20, fontWeight: 800, color: C.white }}>Compras</div></div>
        <button style={sBtnGreen}>+ Nova Solicitacao</button>
      </div>
      {ped.map(function (p) {
        return (<div key={p.id} style={{ background: C.navyMid, borderRadius: 12, padding: "14px 18px", border: "1px solid " + C.border, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><span style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{p.id}</span><span style={{ fontSize: 12, color: C.textMuted, marginLeft: 10 }}>{p.data} | {p.un} | {p.itens} itens</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontSize: 11, fontWeight: 700, color: stC[p.st], background: stC[p.st] + "15", padding: "3px 10px", borderRadius: 6 }}>{stN[p.st]}</span><span style={{ fontSize: 14, fontWeight: 700, color: C.green }}>{fmtBRL(p.valor)}</span></div>
        </div>);
      })}
    </div>
  );
}

/* ═══ ESTOQUE ═══ */
function ModEstoque() {
  var itens = [
    { nome: "Arroz Tipo 1", qtd: 45, min: 80, un: "kg", g: "Cereais" },
    { nome: "Feijao Carioca", qtd: 62, min: 50, un: "kg", g: "Leguminosas" },
    { nome: "Peito de Frango", qtd: 12, min: 30, un: "kg", g: "Carnes" },
    { nome: "Oleo de Soja", qtd: 8, min: 20, un: "L", g: "Oleos" },
    { nome: "Batata Inglesa", qtd: 95, min: 40, un: "kg", g: "Tuberculos" },
    { nome: "Leite Integral", qtd: 32, min: 25, un: "L", g: "Laticinios" },
    { nome: "Macarrao", qtd: 28, min: 30, un: "kg", g: "Massas" },
    { nome: "Carne Bovina", qtd: 18, min: 25, un: "kg", g: "Carnes" },
  ];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div><div style={{ fontSize: 20, fontWeight: 800, color: C.white }}>Estoque</div></div>
        <div style={{ display: "flex", gap: 8 }}><button style={sBtnOutline}>Entrada NF</button><button style={sBtnGreen}>+ Novo Item</button></div>
      </div>
      {itens.map(function (it) {
        var ok = it.qtd >= it.min;
        return (<div key={it.nome} style={{ background: C.navyMid, borderRadius: 10, padding: "12px 16px", border: "1px solid " + C.border, marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{it.nome}</div><div style={{ fontSize: 10, color: C.textDim }}>{it.g}</div></div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 100, height: 6, background: C.surface, borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: Math.min(it.qtd / it.min * 100, 100) + "%", background: ok ? C.green : C.danger, borderRadius: 3 }} /></div>
            <span style={{ fontSize: 15, fontWeight: 800, color: ok ? C.green : C.danger, minWidth: 70, textAlign: "right" }}>{it.qtd} {it.un}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: ok ? C.green : C.danger, background: (ok ? C.green : C.danger) + "15", padding: "3px 8px", borderRadius: 4 }}>{ok ? "OK" : "CRITICO"}</span>
          </div>
        </div>);
      })}
    </div>
  );
}

/* ═══ INTEGRACAO ═══ */
function ModIntegracao() {
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.white, marginBottom: 16 }}>Integracao Compras x Estoque</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: C.navyMid, borderRadius: 14, padding: 20, border: "1px solid " + C.accent + "22" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.accent, marginBottom: 12 }}>Visao Compras</div>
          <div style={{ fontSize: 12, color: C.textMuted }}>Gera lista automatica a partir dos cardapios aprovados x fichas tecnicas x comensais.</div>
          <button style={Object.assign({}, sBtnGreen, { marginTop: 16, width: "100%" })}>Gerar Lista Automatica</button>
        </div>
        <div style={{ background: C.navyMid, borderRadius: 14, padding: 20, border: "1px solid " + C.gold + "22" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, marginBottom: 12 }}>Visao CD / Estoque</div>
          <div style={{ fontSize: 12, color: C.textMuted }}>Recebe pedidos, separa, confirma envio. Kit Diario por unidade.</div>
          <button style={Object.assign({}, sBtnOutline, { marginTop: 16, width: "100%", borderColor: C.gold, color: C.gold })}>Ver Pedidos</button>
        </div>
      </div>
    </div>
  );
}

/* ═══ BAIXA PRODUCAO ═══ */
function ModBaixa() {
  var turnos = [
    { nome: "Almoco", icon: "☀️", st: "ok", com: 2400, bx: 2380 },
    { nome: "Lanche", icon: "🥤", st: "and", com: 800, bx: 0 },
    { nome: "Jantar", icon: "🌙", st: "pen", com: 650, bx: 0 },
  ];
  var stC = { ok: C.green, and: C.gold, pen: C.textDim };
  var stN = { ok: "Concluido", and: "Em andamento", pen: "Pendente" };
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.white, marginBottom: 16 }}>Baixa de Producao</div>
      {turnos.map(function (t) {
        return (<div key={t.nome} style={{ background: C.navyMid, borderRadius: 14, padding: "18px 20px", border: "2px solid " + stC[t.st] + "33", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>{t.icon}</span>
            <div><div style={{ fontSize: 16, fontWeight: 700, color: C.white }}>{t.nome}</div><span style={{ fontSize: 10, fontWeight: 700, color: stC[t.st], background: stC[t.st] + "15", padding: "2px 8px", borderRadius: 4 }}>{stN[t.st]}</span></div>
          </div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 22, fontWeight: 800, color: C.accent }}>{fmtInt(t.com)}</div><div style={{ fontSize: 10, color: C.textDim }}>comensais</div></div>
          {t.st === "pen" && <button style={sBtnGreen}>Iniciar</button>}
          {t.st === "and" && <button style={Object.assign({}, sBtnGreen, { background: C.gold })}>Continuar</button>}
          {t.st === "ok" && <span style={{ fontSize: 12, color: C.green, fontWeight: 700 }}>✅ {fmtInt(t.bx)}</span>}
        </div>);
      })}
    </div>
  );
}

/* ═══ NAV + LOGO ═══ */
var NAV = [
  { id: "dash", nome: "Dashboard", icon: "📊" },
  { id: "prep", nome: "Preparacoes", icon: "📋" },
  { id: "plan", nome: "Planejamento", icon: "📅" },
  { id: "clie", nome: "Clientes", icon: "🏢" },
  { id: "comp", nome: "Compras", icon: "🛒" },
  { id: "esto", nome: "Estoque", icon: "📦" },
  { id: "intg", nome: "Integracao", icon: "🔗" },
  { id: "baix", nome: "Baixa Prod.", icon: "✅" },
];

export default function RendoraApp() {
  var _p = useState("dash"); var page = _p[0]; var setPage = _p[1];
  var _c = useState(false); var collapsed = _c[0]; var setCollapsed = _c[1];

  var content = null;
  if (page === "dash") content = <ModDashboard />;
  else if (page === "prep") content = <PreparacoesRendora />;
  else if (page === "plan") content = <PlanejamentoRendora />;
  else if (page === "clie") content = <ModClientes />;
  else if (page === "comp") content = <ModCompras />;
  else if (page === "esto") content = <ModEstoque />;
  else if (page === "intg") content = <ModIntegracao />;
  else if (page === "baix") content = <ModBaixa />;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", display: "flex", height: "100vh", background: C.navy, color: C.text, overflow: "hidden" }}>
      {/* SIDEBAR */}
      <div style={{ width: collapsed ? 60 : 220, background: C.navyLight, borderRight: "1px solid " + C.border, display: "flex", flexDirection: "column", transition: "width 0.2s", flexShrink: 0, overflow: "hidden" }}>
        <div style={{ padding: collapsed ? "16px 12px" : "16px 18px", borderBottom: "1px solid " + C.border, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={function () { setCollapsed(!collapsed); }}>
          <svg width="28" height="28" viewBox="0 0 100 100"><polygon points="20,80 50,20 80,80" fill="#2EAD4B" opacity="0.9" /><path d="M 60 35 A 30 30 0 0 1 85 65" stroke="#00BDE4" strokeWidth="8" fill="none" strokeLinecap="round" /></svg>
          {!collapsed && <div><div style={{ fontSize: 16, fontWeight: 800, color: C.white, letterSpacing: 1 }}>RENDORA</div><div style={{ fontSize: 8, color: C.textDim, letterSpacing: 2 }}>GESTAO DE REFEICOES</div></div>}
        </div>
        <div style={{ flex: 1, padding: "8px 6px", overflowY: "auto" }}>
          {NAV.map(function (item) {
            var active = page === item.id;
            return (
              <div key={item.id} onClick={function () { setPage(item.id); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, cursor: "pointer", marginBottom: 2, background: active ? C.accent + "15" : "transparent", borderLeft: active ? "3px solid " + C.accent : "3px solid transparent" }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {!collapsed && <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? C.accent : C.textMuted, whiteSpace: "nowrap" }}>{item.nome}</span>}
              </div>
            );
          })}
        </div>
        {!collapsed && <div style={{ padding: "12px 16px", borderTop: "1px solid " + C.border }}><div style={{ fontSize: 10, color: C.textDim }}>Leve Refeicoes Coletivas</div><div style={{ fontSize: 9, color: C.textDim }}>19 unidades | RN + SE</div></div>}
      </div>

      {/* CONTEUDO */}
      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          {NAV.map(function (item) { if (item.id !== page) return null; return <span key={item.id} style={{ fontSize: 11, color: C.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{item.icon} {item.nome}</span>; })}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: C.textDim }}>{new Date().toLocaleDateString("pt-BR")}</span>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.accent + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: C.accent }}>RD</div>
          </div>
        </div>
        {content}
      </div>
    </div>
  );
}
