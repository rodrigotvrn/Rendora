"use client";
import { useState, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════
   RENDORA — APP UNIFICADO v1
   Todos os modulos com navegacao lateral
   ═══════════════════════════════════════════════════════════════ */

/* ── SHARED: Colors, Styles, Helpers ── */
var C = {
  navy: "#192B47", navyLight: "#1E3250", navyMid: "#243A5C",
  surface: "#162842", border: "#2A4266", accent: "#00BDE4",
  green: "#2EAD4B", gold: "#E8A832", danger: "#E5484D",
  warning: "#F5A623", white: "#F1F5F9", text: "#CBD5E1",
  textMuted: "#8B9FC0", textDim: "#5A7194",
};
var sInput = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid " + C.border, background: C.surface, color: C.text, fontSize: 13, outline: "none" };
var sSelect = { padding: "8px 12px", borderRadius: 8, border: "1px solid " + C.border, background: C.surface, color: C.text, fontSize: 13, outline: "none" };
var sLabel = { display: "block", fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" };
var sBtnGreen = { padding: "10px 20px", borderRadius: 8, border: "none", background: C.green, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" };
var sBtnOutline = { padding: "8px 16px", borderRadius: 8, border: "1px solid " + C.border, background: "transparent", color: C.textMuted, fontWeight: 600, fontSize: 12, cursor: "pointer" };
var sBtnGhost = { padding: "6px 12px", borderRadius: 6, border: "none", background: "transparent", color: C.textMuted, fontWeight: 600, fontSize: 12, cursor: "pointer" };
var sBtnSm = { padding: "5px 10px", fontSize: 11 };
var sCard = { background: C.navyMid, borderRadius: 12, padding: "14px 16px", marginBottom: 8 };

function fmtBRL(v) { return "R$ " + (v || 0).toFixed(2).replace(".", ","); }
function fmtInt(v) { return (v || 0).toLocaleString("pt-BR"); }
function fmt(v) { return (v || 0).toFixed(2).replace(".", ","); }
function fmtG(v) { return ((v || 0) * 1000).toFixed(0) + "g"; }
function fmtDT(d) { if (!d) return "—"; return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }); }
function nowISO() { return new Date().toISOString(); }

function Modal(props) {
  if (!props.open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "30px 20px", overflowY: "auto" }} onClick={function (e) { if (e.target === e.currentTarget) props.onClose(); }}>
      <div style={{ background: C.navyLight, borderRadius: 16, width: props.w || 640, maxWidth: "95vw", padding: "24px 28px", position: "relative", border: "1px solid " + C.border }}>
        <button onClick={props.onClose} style={{ position: "absolute", top: 12, right: 16, background: "none", border: "none", color: C.textDim, fontSize: 20, cursor: "pointer" }}>×</button>
        {props.title && <div style={{ fontSize: 18, fontWeight: 800, color: C.white, marginBottom: 2 }}>{props.title}</div>}
        {props.sub && <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>{props.sub}</div>}
        <div style={{ maxHeight: "75vh", overflowY: "auto" }}>{props.children}</div>
      </div>
    </div>
  );
}

/* Logo Rendora */
function RendoraLogo(props) {
  var s = props.size || 32;
  return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <polygon points="20,80 50,20 80,80" fill="#2EAD4B" opacity="0.9" />
      <path d="M 60 35 A 30 30 0 0 1 85 65" stroke="#00BDE4" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M 15 55 L 40 55 L 28 75 Z" fill="#192B47" opacity="0.7" />
    </svg>
  );
}

/* ── NAVIGATION ITEMS ── */
var NAV_ITEMS = [
  { id: "dash", nome: "Dashboard", icon: "📊" },
  { id: "prep", nome: "Preparacoes", icon: "📋" },
  { id: "plan", nome: "Planejamento", icon: "📅" },
  { id: "clie", nome: "Clientes", icon: "🏢" },
  { id: "comp", nome: "Compras", icon: "🛒" },
  { id: "esto", nome: "Estoque", icon: "📦" },
  { id: "intg", nome: "Integracao", icon: "🔗" },
  { id: "baix", nome: "Baixa Prod.", icon: "✅" },
];


/* ═══════════════════════════════════════════════════════════════
   MÓDULO: DASHBOARD
   ═══════════════════════════════════════════════════════════════ */
function ModDashboard() {
  var kpis = [
    { label: "RECEITAS CADASTRADAS", valor: "34", icon: "📋", cor: C.accent },
    { label: "INGREDIENTES", valor: "53", icon: "🥕", cor: C.green },
    { label: "CLIENTES ATIVOS", valor: "8", icon: "🏢", cor: C.gold },
    { label: "CARDAPIOS DO MES", valor: "127", icon: "📅", cor: C.warning },
    { label: "CUSTO MEDIO/COMENSAL", valor: "R$ 8,42", icon: "💰", cor: C.green },
    { label: "COMENSAIS/DIA", valor: "3.850", icon: "👥", cor: C.accent },
  ];
  var alertas = [
    { tipo: "warning", msg: "Estoque de Peito de Frango abaixo do minimo (12kg restantes)" },
    { tipo: "danger", msg: "3 cardapios pendentes de aprovacao para amanha" },
    { tipo: "info", msg: "Novo pedido de compras #PC-0045 aguardando cotacao" },
    { tipo: "success", msg: "Baixa de producao do almoco concluida — 19 unidades" },
  ];
  var alertCor = { warning: C.gold, danger: C.danger, info: C.accent, success: C.green };
  var alertIcon = { warning: "⚠️", danger: "🚨", info: "💡", success: "✅" };

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.white, marginBottom: 4 }}>Dashboard Operacional</div>
      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 20 }}>Visao geral da operacao — Leve Refeicoes Coletivas</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {kpis.map(function (k) {
          return (
            <div key={k.label} style={{ background: k.cor + "08", borderRadius: 14, padding: "16px 18px", border: "1px solid " + k.cor + "22" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 9, color: C.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{k.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: k.cor, marginTop: 4 }}>{k.valor}</div>
                </div>
                <span style={{ fontSize: 28, opacity: 0.4 }}>{k.icon}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 10 }}>Alertas e Notificacoes</div>
      {alertas.map(function (a, i) {
        return (
          <div key={i} style={{ background: alertCor[a.tipo] + "08", borderRadius: 10, padding: "12px 16px", marginBottom: 8, border: "1px solid " + alertCor[a.tipo] + "22", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>{alertIcon[a.tipo]}</span>
            <span style={{ fontSize: 13, color: C.text }}>{a.msg}</span>
          </div>
        );
      })}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24 }}>
        <div style={{ background: C.navyMid, borderRadius: 14, padding: 18, border: "1px solid " + C.border }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, marginBottom: 12 }}>Custos por Turno (Hoje)</div>
          {[{ turno: "Almoco", com: 2400, custo: 19200 }, { turno: "Lanche", com: 800, custo: 4800 }, { turno: "Jantar", com: 650, custo: 5850 }].map(function (t) {
            return (
              <div key={t.turno} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid " + C.border + "33" }}>
                <span style={{ fontSize: 13, color: C.text }}>{t.turno}</span>
                <div style={{ display: "flex", gap: 16 }}>
                  <span style={{ fontSize: 12, color: C.textDim }}>{fmtInt(t.com)} com.</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>{fmtBRL(t.custo)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ background: C.navyMid, borderRadius: 14, padding: 18, border: "1px solid " + C.border }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.danger, marginBottom: 12 }}>Estoque Critico</div>
          {[{ nome: "Peito de Frango", qtd: 12, min: 30, un: "kg" }, { nome: "Oleo de Soja", qtd: 8, min: 20, un: "L" }, { nome: "Arroz Tipo 1", qtd: 45, min: 80, un: "kg" }].map(function (e) {
            var pct = (e.qtd / e.min * 100);
            return (
              <div key={e.nome} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: C.text }}>{e.nome}</span>
                  <span style={{ color: C.danger, fontWeight: 700 }}>{e.qtd}/{e.min} {e.un}</span>
                </div>
                <div style={{ height: 6, background: C.surface, borderRadius: 3, marginTop: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: pct + "%", background: pct < 50 ? C.danger : C.warning, borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   MÓDULOS PLACEHOLDER (funcional simplificado)
   ═══════════════════════════════════════════════════════════════ */

function ModClientes() {
  var clientes = [
    { id: 1, nome: "Prefeitura de Natal", tipo: "Publico", unidades: 6, comensais: 1200, contrato: "Pregao 012/2024", valor: "R$ 1.450.000" },
    { id: 2, nome: "Hospital Regional", tipo: "Publico", unidades: 2, comensais: 800, contrato: "Pregao 008/2024", valor: "R$ 680.000" },
    { id: 3, nome: "Grupo Escola Viva", tipo: "Privado", unidades: 4, comensais: 600, contrato: "Contrato 2024-15", valor: "R$ 420.000" },
    { id: 4, nome: "Construtora Norberto", tipo: "Privado", unidades: 3, comensais: 450, contrato: "Contrato 2024-22", valor: "R$ 310.000" },
    { id: 5, nome: "Tribunal de Justica", tipo: "Publico", unidades: 1, comensais: 350, contrato: "Pregao 015/2024", valor: "R$ 280.000" },
    { id: 6, nome: "UFRN", tipo: "Publico", unidades: 3, comensais: 450, contrato: "Pregao 020/2024", valor: "R$ 520.000" },
  ];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div><div style={{ fontSize: 20, fontWeight: 800, color: C.white }}>Clientes</div><div style={{ fontSize: 12, color: C.textMuted }}>{clientes.length} clientes ativos</div></div>
        <button style={sBtnGreen}>+ Novo Cliente</button>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {clientes.map(function (cl) {
          return (
            <div key={cl.id} style={{ background: C.navyMid, borderRadius: 12, padding: "14px 18px", border: "1px solid " + C.border, cursor: "pointer", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 10, alignItems: "center" }}>
              <div><div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>{cl.nome}</div><div style={{ fontSize: 11, color: C.textDim }}>{cl.contrato}</div></div>
              <span style={{ fontSize: 11, color: cl.tipo === "Publico" ? C.accent : C.gold, background: cl.tipo === "Publico" ? C.accent + "15" : C.gold + "15", padding: "3px 10px", borderRadius: 6, fontWeight: 700, textAlign: "center" }}>{cl.tipo}</span>
              <span style={{ fontSize: 12, color: C.textMuted, textAlign: "center" }}>{cl.unidades} un.</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.accent, textAlign: "center" }}>{fmtInt(cl.comensais)}/dia</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.green, textAlign: "right" }}>{cl.valor}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModCompras() {
  var pedidos = [
    { id: "PC-0045", data: "18/03/2026", unidade: "CD Natal", itens: 23, status: "cotacao", valor: 12450 },
    { id: "PC-0044", data: "17/03/2026", unidade: "Unidade Parnamirim", itens: 15, status: "aprovado", valor: 8300 },
    { id: "PC-0043", data: "16/03/2026", unidade: "CD Natal", itens: 31, status: "entregue", valor: 18720 },
    { id: "PC-0042", data: "15/03/2026", unidade: "Unidade Aracaju", itens: 18, status: "entregue", valor: 9540 },
  ];
  var statusCor = { cotacao: C.gold, aprovado: C.accent, entregue: C.green, cancelado: C.danger };
  var statusNome = { cotacao: "Em cotacao", aprovado: "Aprovado", entregue: "Entregue", cancelado: "Cancelado" };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div><div style={{ fontSize: 20, fontWeight: 800, color: C.white }}>Compras</div><div style={{ fontSize: 12, color: C.textMuted }}>Solicitacoes e pedidos de compra</div></div>
        <button style={sBtnGreen}>+ Nova Solicitacao</button>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {pedidos.map(function (p) {
          return (
            <div key={p.id} style={{ background: C.navyMid, borderRadius: 12, padding: "14px 18px", border: "1px solid " + C.border, display: "grid", gridTemplateColumns: "100px 1fr 1fr 80px 1fr 100px", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{p.id}</span>
              <span style={{ fontSize: 12, color: C.textMuted }}>{p.data}</span>
              <span style={{ fontSize: 12, color: C.text }}>{p.unidade}</span>
              <span style={{ fontSize: 11, color: C.textDim }}>{p.itens} itens</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: statusCor[p.status], background: statusCor[p.status] + "15", padding: "3px 10px", borderRadius: 6, textAlign: "center" }}>{statusNome[p.status]}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.green, textAlign: "right" }}>{fmtBRL(p.valor)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModEstoque() {
  var itens = [
    { nome: "Arroz Tipo 1", qtd: 45, min: 80, max: 200, un: "kg", grupo: "Cereais", cor: C.danger },
    { nome: "Feijao Carioca", qtd: 62, min: 50, max: 150, un: "kg", grupo: "Leguminosas", cor: C.green },
    { nome: "Peito de Frango", qtd: 12, min: 30, max: 100, un: "kg", grupo: "Carnes", cor: C.danger },
    { nome: "Oleo de Soja", qtd: 8, min: 20, max: 60, un: "L", grupo: "Oleos", cor: C.danger },
    { nome: "Batata Inglesa", qtd: 95, min: 40, max: 120, un: "kg", grupo: "Tuberculos", cor: C.green },
    { nome: "Leite Integral", qtd: 32, min: 25, max: 80, un: "L", grupo: "Laticinios", cor: C.green },
    { nome: "Macarrao", qtd: 28, min: 30, max: 80, un: "kg", grupo: "Massas", cor: C.warning },
    { nome: "Carne Bovina", qtd: 18, min: 25, max: 80, un: "kg", grupo: "Carnes", cor: C.warning },
  ];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div><div style={{ fontSize: 20, fontWeight: 800, color: C.white }}>Estoque</div><div style={{ fontSize: 12, color: C.textMuted }}>{itens.length} SKUs monitorados</div></div>
        <div style={{ display: "flex", gap: 8 }}><button style={sBtnOutline}>Entrada NF</button><button style={sBtnGreen}>+ Novo Item</button></div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>
          {["Item", "Grupo", "Qtd Atual", "Min", "Max", "Status"].map(function (h) {
            return <th key={h} style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid " + C.border, fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: "uppercase" }}>{h}</th>;
          })}
        </tr></thead>
        <tbody>
          {itens.map(function (it) {
            var pct = it.qtd / it.max * 100;
            var status = it.qtd < it.min ? "CRITICO" : it.qtd < it.min * 1.5 ? "ALERTA" : "OK";
            var sCor = it.qtd < it.min ? C.danger : it.qtd < it.min * 1.5 ? C.warning : C.green;
            return (<tr key={it.nome}>
              <td style={{ padding: "10px 12px", borderBottom: "1px solid " + C.border + "33", fontWeight: 600, color: C.white, fontSize: 13 }}>{it.nome}</td>
              <td style={{ padding: "10px 12px", borderBottom: "1px solid " + C.border + "33", fontSize: 11, color: C.textDim }}>{it.grupo}</td>
              <td style={{ padding: "10px 12px", borderBottom: "1px solid " + C.border + "33" }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: sCor }}>{it.qtd}</span><span style={{ fontSize: 11, color: C.textDim }}> {it.un}</span>
              </td>
              <td style={{ padding: "10px 12px", borderBottom: "1px solid " + C.border + "33", fontSize: 12, color: C.textDim }}>{it.min}</td>
              <td style={{ padding: "10px 12px", borderBottom: "1px solid " + C.border + "33", fontSize: 12, color: C.textDim }}>{it.max}</td>
              <td style={{ padding: "10px 12px", borderBottom: "1px solid " + C.border + "33" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: sCor, background: sCor + "15", padding: "3px 10px", borderRadius: 6 }}>{status}</span>
              </td>
            </tr>);
          })}
        </tbody>
      </table>
    </div>
  );
}

function ModIntegracao() {
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.white, marginBottom: 4 }}>Integracao Compras ↔ Estoque</div>
      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 20 }}>Lista automatica de compra por unidade/CD</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: C.navyMid, borderRadius: 14, padding: 20, border: "1px solid " + C.accent + "22" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.accent, marginBottom: 12 }}>Visao Compras</div>
          <div style={{ fontSize: 12, color: C.textMuted }}>Gera lista de compras automaticamente a partir dos cardapios aprovados × fichas tecnicas × comensais, comparando com estoque atual.</div>
          <button style={Object.assign({}, sBtnGreen, { marginTop: 16, width: "100%" })}>Gerar Lista Automatica</button>
        </div>
        <div style={{ background: C.navyMid, borderRadius: 14, padding: 20, border: "1px solid " + C.gold + "22" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, marginBottom: 12 }}>Visao CD / Estoque</div>
          <div style={{ fontSize: 12, color: C.textMuted }}>Recebe pedidos, separa, confirma envio. Kit Diario por unidade.</div>
          <button style={Object.assign({}, sBtnOutline, { marginTop: 16, width: "100%", borderColor: C.gold, color: C.gold })}>Ver Pedidos Pendentes</button>
        </div>
      </div>
    </div>
  );
}

function ModBaixaProducao() {
  var turnos = [
    { nome: "Almoco", icon: "☀️", status: "concluido", com: 2400, baixado: 2380 },
    { nome: "Lanche", icon: "🥤", status: "em_andamento", com: 800, baixado: 0 },
    { nome: "Jantar", icon: "🌙", status: "pendente", com: 650, baixado: 0 },
  ];
  var stCor = { concluido: C.green, em_andamento: C.gold, pendente: C.textDim };
  var stNome = { concluido: "Concluido", em_andamento: "Em andamento", pendente: "Pendente" };
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.white, marginBottom: 4 }}>Baixa de Producao</div>
      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 20 }}>Confirma refeicoes servidas → baixa ingredientes do estoque</div>
      <div style={{ display: "grid", gap: 12 }}>
        {turnos.map(function (t) {
          return (
            <div key={t.nome} style={{ background: C.navyMid, borderRadius: 14, padding: "18px 20px", border: "2px solid " + stCor[t.status] + "33", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28 }}>{t.icon}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.white }}>{t.nome}</div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: stCor[t.status], background: stCor[t.status] + "15", padding: "2px 8px", borderRadius: 4 }}>{stNome[t.status]}</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.accent }}>{fmtInt(t.com)}</div>
                <div style={{ fontSize: 10, color: C.textDim }}>comensais planejados</div>
              </div>
              {t.status === "pendente" && <button style={sBtnGreen}>Iniciar Baixa</button>}
              {t.status === "em_andamento" && <button style={Object.assign({}, sBtnGreen, { background: C.gold })}>Continuar</button>}
              {t.status === "concluido" && <span style={{ fontSize: 12, color: C.green, fontWeight: 700 }}>✅ {fmtInt(t.baixado)} servidos</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModPreparacoes() {
  return (
    <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>
      <div style={{ fontSize: 48, opacity: 0.3, marginBottom: 12 }}>📋</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.white }}>Modulo Preparacoes</div>
      <div style={{ fontSize: 13, color: C.textMuted, marginTop: 6 }}>34 receitas | 53 ingredientes | 5 setores | Fichas tecnicas UAN</div>
      <div style={{ fontSize: 12, color: C.textDim, marginTop: 10 }}>Para testar o modulo completo, abra o arquivo rendora-mod-preparacoes-v15.jsx</div>
    </div>
  );
}

function ModPlanejamento() {
  return (
    <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>
      <div style={{ fontSize: 48, opacity: 0.3, marginBottom: 12 }}>📅</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.white }}>Modulo Planejamento</div>
      <div style={{ fontSize: 13, color: C.textMuted, marginTop: 6 }}>Calendario | PCP editavel por cliente | Ordem de Producao por setor</div>
      <div style={{ fontSize: 12, color: C.textDim, marginTop: 10 }}>Para testar o modulo completo, abra o arquivo rendora-mod-planejamento-v16.jsx</div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   APP PRINCIPAL — Navegacao + Roteamento
   ═══════════════════════════════════════════════════════════════ */
export default function RendoraApp() {
  var _page = useState("dash"); var page = _page[0]; var setPage = _page[1];
  var _collapsed = useState(false); var collapsed = _collapsed[0]; var setCollapsed = _collapsed[1];

  var PAGES = {
    dash: ModDashboard,
    prep: ModPreparacoes,
    plan: ModPlanejamento,
    clie: ModClientes,
    comp: ModCompras,
    esto: ModEstoque,
    intg: ModIntegracao,
    baix: ModBaixaProducao,
  };
  var PageComponent = PAGES[page] || ModDashboard;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", display: "flex", height: "100vh", background: C.navy, color: C.text, overflow: "hidden" }}>
      {/* ═══ SIDEBAR ═══ */}
      <div style={{ width: collapsed ? 60 : 220, background: C.navyLight, borderRight: "1px solid " + C.border, display: "flex", flexDirection: "column", transition: "width 0.2s", flexShrink: 0, overflow: "hidden" }}>
        {/* Logo */}
        <div style={{ padding: collapsed ? "16px 8px" : "16px 18px", borderBottom: "1px solid " + C.border, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={function () { setCollapsed(!collapsed); }}>
          <RendoraLogo size={28} />
          {!collapsed && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.white, letterSpacing: 1 }}>RENDORA</div>
              <div style={{ fontSize: 8, color: C.textDim, letterSpacing: 2 }}>GESTAO DE REFEICOES</div>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <div style={{ flex: 1, padding: "8px 6px", overflowY: "auto" }}>
          {NAV_ITEMS.map(function (item) {
            var active = page === item.id;
            return (
              <div
                key={item.id}
                onClick={function () { setPage(item.id); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: collapsed ? "10px 14px" : "10px 14px",
                  borderRadius: 10, cursor: "pointer", marginBottom: 2,
                  background: active ? C.accent + "15" : "transparent",
                  borderLeft: active ? "3px solid " + C.accent : "3px solid transparent",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? C.accent : C.textMuted }}>{item.nome}</span>}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {!collapsed && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid " + C.border }}>
            <div style={{ fontSize: 10, color: C.textDim }}>Leve Refeicoes Coletivas</div>
            <div style={{ fontSize: 9, color: C.textDim }}>19 unidades | RN + SE</div>
          </div>
        )}
      </div>

      {/* ═══ CONTEUDO ═══ */}
      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {NAV_ITEMS.map(function (item) {
              if (item.id !== page) return null;
              return <span key={item.id} style={{ fontSize: 11, color: C.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{item.icon} {item.nome}</span>;
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: C.textDim }}>{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.accent + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: C.accent }}>RD</div>
          </div>
        </div>

        <PageComponent />
      </div>
    </div>
  );
}
