"use client";
import { useState, useMemo, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════
   RENDORA — MÓDULO PLANEJAMENTO v16
   Ordem: PCP editavel por cliente no cardapio
   ═══════════════════════════════════════════════════════════════ */

var C = {
  navy: "#192B47", navyLight: "#1E3250", navyMid: "#243A5C",
  surface: "#162842", border: "#2A4266", accent: "#00BDE4",
  green: "#2EAD4B", gold: "#E8A832", text: "#E4E9F0",
  textMuted: "#8B9DB3", textDim: "#5D7490", white: "#FFFFFF",
  danger: "#E5484D", warning: "#F5A623",
};

/* ─── helpers ─────────────────────────────────────────────── */
function fmt(n) { return Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtInt(n) { return Number(n || 0).toLocaleString("pt-BR"); }
function fmtBRL(n) { return "R$ " + fmt(n); }
function uid() { return Math.random().toString(36).slice(2, 9); }
function nowISO() { return new Date().toISOString(); }
function dateFull(d) { return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }); }
function custoReceita(rec, ings) {
  if (!rec) return 0;
  return rec.itens.reduce(function (sum, it) {
    var ig = ings.find(function (x) { return x.id === it.i; });
    return sum + (ig ? it.pc * ig.fc * ig.custo : 0);
  }, 0);
}
/* Custo com PCP customizado (g pronto) — recalcula proporcionalmente */
function custoComPCP(rec, ings, pcpGramas) {
  if (!rec) return 0;
  if (!pcpGramas || pcpGramas <= 0) return custoReceita(rec, ings);
  var fcc = rec.fcc || 1;
  var somaPCL = rec.itens.reduce(function (s, it) { return s + it.pc; }, 0);
  var pcpPadrao = somaPCL * fcc * 1000;
  if (pcpPadrao <= 0) return custoReceita(rec, ings);
  var escala = pcpGramas / pcpPadrao;
  return rec.itens.reduce(function (sum, it) {
    var ig = ings.find(function (x) { return x.id === it.i; });
    return sum + (ig ? it.pc * escala * ig.fc * ig.custo : 0);
  }, 0);
}
/* Categorias liquidas: resultado em litros (L) */
var CATS_LIQUIDAS = ["Suco", "Bebida", "Bebida quente", "Sopa"];
function isLiquido(rc) { return rc && CATS_LIQUIDAS.indexOf(rc.cat) >= 0; }
function unPrep(rc) { return isLiquido(rc) ? "L" : "kg"; }
var SETORES = [
  { id: "set1", nome: "Saladas", icon: "🥗", cor: "#2EAD4B" },
  { id: "set2", nome: "Sucos", icon: "🧃", cor: "#F97316" },
  { id: "set3", nome: "Cozinha de Producao", icon: "🍳", cor: "#E5484D" },
  { id: "set4", nome: "Pastelaria", icon: "🎉", cor: "#A855F7" },
  { id: "set5", nome: "Panificacao", icon: "🍞", cor: "#D4A574" },
];
function setorDaReceita(rc) {
  if (!rc) return "set3";
  if (rc.setor) return rc.setor;
  var c = (rc.cat || "").toLowerCase();
  if (c === "salada" || c === "fruta") return "set1";
  if (c === "suco" || c === "bebida" || c === "bebida quente") return "set2";
  if (c === "salgado/doce" || c === "biscoito/fruta" || c === "pao") return "set5";
  if (c === "entrada" || c === "prato principal") return "set4";
  return "set3";
}

/* Mapeia o nome do slot para a(s) categoria(s) permitida(s) de receita */
function receitasParaSlot(slotName, todasReceitas) {
  var slotLower = slotName.toLowerCase();
  /* mapa direto: nome do slot → categoria da receita */
  var mapExato = {
    "prato proteico": ["Prato proteico"],
    "guarnição": ["Guarnição"],
    "acompanhamento": ["Acompanhamento"],
    "salada": ["Salada"],
    "sobremesa": ["Sobremesa"],
    "bebida": ["Bebida"],
    "suco": ["Suco"],
    "salgado/doce": ["Salgado/Doce"],
    "biscoito/fruta": ["Biscoito/Fruta"],
    "fruta": ["Fruta"],
    "sopa": ["Sopa"],
    "prato leve": ["Prato leve"],
    "arroz": ["Acompanhamento"],
    "feijão": ["Acompanhamento"],
    "pão": ["Pão"],
    "bebida quente": ["Bebida quente"],
    "entrada": ["Salada", "Sopa"],
    "prato principal": ["Prato proteico"],
  };
  var cats = mapExato[slotLower];
  if (cats) {
    return todasReceitas.filter(function (r) {
      return cats.indexOf(r.cat) >= 0;
    });
  }
  /* fallback: mostra tudo se não encontrar mapeamento */
  return todasReceitas;
}
function diasUteisNoMes(ano, mes) {
  var count = 0;
  var d = new Date(ano, mes, 1);
  while (d.getMonth() === mes) {
    var dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}
function diasNoMes(ano, mes) {
  return new Date(ano, mes + 1, 0).getDate();
}

/* ─── impressão ───────────────────────────────────────────── */
function printHTML(html) {
  var f = document.createElement("iframe");
  f.style.display = "none";
  document.body.appendChild(f);
  f.contentDocument.open();
  f.contentDocument.write('<!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>body{font-family:"DM Sans",sans-serif;color:#1E3250;padding:30px;max-width:900px;margin:0 auto}table{width:100%;border-collapse:collapse;margin:12px 0}th{text-align:left;padding:8px 10px;border-bottom:2px solid #192B47;font-size:11px;text-transform:uppercase;color:#5D7490}td{padding:8px 10px;border-bottom:1px solid #eee;font-size:13px}h2{font-size:15px;margin:18px 0 8px;color:#192B47}</style></head><body>' + html + '<div style="text-align:center;margin-top:30px;padding-top:12px;border-top:2px solid #2EAD4B;font-size:11px;color:#888">Rendora · ' + new Date().toLocaleDateString("pt-BR") + '</div></body></html>');
  f.contentDocument.close();
  f.contentWindow.focus();
  f.contentWindow.print();
  setTimeout(function () { document.body.removeChild(f); }, 2000);
}

/* ─── estilos ─────────────────────────────────────────────── */
var sCard = { background: C.navyLight, borderRadius: 14, border: "1px solid " + C.border, padding: 20, marginBottom: 14 };
var sBtn = { background: C.accent, color: C.navy, border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 };
var sBtnGreen = Object.assign({}, sBtn, { background: C.green, color: C.white });
var sBtnDanger = Object.assign({}, sBtn, { background: C.danger, color: C.white });
var sBtnOutline = Object.assign({}, sBtn, { background: "transparent", color: C.accent, border: "1.5px solid " + C.accent, fontWeight: 600 });
var sBtnGhost = { background: "transparent", color: C.textMuted, border: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 5 };
var sBtnSm = { padding: "6px 14px", fontSize: 12 };
var sInput = { background: C.surface, color: C.text, border: "1px solid " + C.border, borderRadius: 8, padding: "10px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 14, width: "100%", boxSizing: "border-box", outline: "none" };
var sSelect = { background: C.surface, color: C.text, border: "1px solid " + C.border, borderRadius: 8, padding: "10px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: "pointer", outline: "none" };
var sLabel = { display: "block", marginBottom: 5, fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" };

/* ─── logo ────────────────────────────────────────────────── */
function RendoraLogo(props) {
  var sz = props.size || 32;
  return (
    <svg width={sz} height={sz} viewBox="0 0 100 100" fill="none">
      <polygon points="5,10 45,35 5,35" fill="#2EAD4B" />
      <path d="M50,10 A30,30 0 0,1 80,35 L50,35 Z" fill="#00BDE4" />
      <polygon points="5,42 45,42 50,65 25,90 0,65" fill="#192B47" />
      <polygon points="55,42 95,42 70,65 95,65 70,90" fill="#192B47" />
    </svg>
  );
}

/* ═══ SEED ═══════════════════════════════════════════════════ */
var unidades = [
  { id: "u1", nome: "Matriz Natal", uf: "RN", tipo: "matriz" },
  { id: "u2", nome: "Filial Parnamirim", uf: "RN", tipo: "filial" },
  { id: "u3", nome: "Filial Mossoró", uf: "RN", tipo: "filial" },
  { id: "u4", nome: "Filial Aracaju", uf: "SE", tipo: "filial" },
  { id: "u5", nome: "Filial Caicó", uf: "RN", tipo: "filial" },
  { id: "u6", nome: "Filial São Gonçalo", uf: "RN", tipo: "filial" },
  { id: "u7", nome: "Filial Macaíba", uf: "RN", tipo: "filial" },
  { id: "u8", nome: "Filial Ceará-Mirim", uf: "RN", tipo: "filial" },
  { id: "u9", nome: "Filial Currais Novos", uf: "RN", tipo: "filial" },
  { id: "u10", nome: "Filial Açu", uf: "RN", tipo: "filial" },
  { id: "u11", nome: "Filial Aracaju Sul", uf: "SE", tipo: "filial" },
  { id: "u12", nome: "Filial Lagarto", uf: "SE", tipo: "filial" },
];

var clientes = [
  { id: "c1", nome: "Prefeitura de Natal", tipo: "publico", uId: "u1", renovacao: "2025-12-31", reajuste: "2025-06-01" },
  { id: "c2", nome: "Escola Estadual Flores", tipo: "publico", uId: "u2", renovacao: "2025-02-28", reajuste: "2025-03-01" },
  { id: "c3", nome: "Hospital Regional Mossoró", tipo: "publico", uId: "u3", renovacao: "2025-05-31", reajuste: "2025-06-01" },
  { id: "c4", nome: "Indústria TecnoForge", tipo: "privado", uId: "u4", renovacao: "2025-12-31", reajuste: "2025-01-01" },
  { id: "c5", nome: "Construtora RN Obras", tipo: "privado", uId: "u5", renovacao: "2025-01-31", reajuste: "2025-02-01" },
  { id: "c6", nome: "Escola Municipal Esperança", tipo: "publico", uId: "u6", renovacao: "2025-03-31", reajuste: "2025-04-01" },
  { id: "c7", nome: "CRAS Macaíba", tipo: "publico", uId: "u7", renovacao: "2025-04-30", reajuste: "2025-05-01" },
  { id: "c8", nome: "Creche Arco-Íris", tipo: "publico", uId: "u8", renovacao: "2025-06-30", reajuste: "2025-07-01" },
  { id: "c9", nome: "Prefeitura Currais Novos", tipo: "publico", uId: "u9", renovacao: "2025-07-31", reajuste: "2025-08-01" },
  { id: "c10", nome: "Frigorífico Boi Norte", tipo: "privado", uId: "u10", renovacao: "2025-02-28", reajuste: "2025-03-01" },
  { id: "c11", nome: "Hospital São Luiz SE", tipo: "publico", uId: "u11", renovacao: "2025-05-31", reajuste: "2025-06-01" },
  { id: "c12", nome: "Metalúrgica Sergipe", tipo: "privado", uId: "u12", renovacao: "2025-12-31", reajuste: "2025-01-01" },
];

var servicos = [
  { id: "sv1", cId: "c1", nome: "Almoço Escolar", tipo: "Almoço", slots: ["Prato proteico", "Guarnição", "Acompanhamento", "Salada", "Sobremesa"], ref: 800 },
  { id: "sv2", cId: "c1", nome: "Lanche da Tarde", tipo: "Lanche", slots: ["Bebida", "Salgado/Doce"], ref: 800 },
  { id: "sv3", cId: "c2", nome: "Almoço EE Flores", tipo: "Almoço", slots: ["Prato proteico", "Guarnição", "Acompanhamento", "Salada", "Sobremesa"], ref: 450 },
  { id: "sv4", cId: "c3", nome: "Almoço Hospitalar", tipo: "Almoço", slots: ["Prato proteico", "Guarnição", "Acompanhamento", "Salada", "Sobremesa", "Suco"], ref: 600 },
  { id: "sv5", cId: "c3", nome: "Jantar Hospitalar", tipo: "Jantar", slots: ["Sopa", "Prato leve", "Acompanhamento", "Sobremesa"], ref: 400 },
  { id: "sv6", cId: "c4", nome: "Almoço Industrial", tipo: "Almoço", slots: ["Prato proteico", "Guarnição", "Arroz", "Feijão", "Salada", "Sobremesa"], ref: 350 },
  { id: "sv7", cId: "c5", nome: "Almoço Obra", tipo: "Almoço", slots: ["Prato proteico", "Guarnição", "Arroz", "Feijão", "Salada"], ref: 200 },
  { id: "sv8", cId: "c6", nome: "Merenda Escolar", tipo: "Lanche", slots: ["Bebida", "Salgado/Doce", "Fruta"], ref: 320 },
  { id: "sv9", cId: "c7", nome: "Almoço CRAS", tipo: "Almoço", slots: ["Prato proteico", "Guarnição", "Acompanhamento", "Salada"], ref: 180 },
  { id: "sv10", cId: "c8", nome: "Lanche Creche", tipo: "Lanche", slots: ["Bebida", "Biscoito/Fruta"], ref: 150 },
  { id: "sv11", cId: "c9", nome: "Almoço Escolar C.Novos", tipo: "Almoço", slots: ["Prato proteico", "Guarnição", "Acompanhamento", "Salada", "Sobremesa"], ref: 280 },
  { id: "sv12", cId: "c10", nome: "Almoço Frigorífico", tipo: "Almoço", slots: ["Prato proteico", "Guarnição", "Arroz", "Feijão", "Salada", "Sobremesa"], ref: 260 },
  { id: "sv13", cId: "c11", nome: "Almoço Hosp. SE", tipo: "Almoço", slots: ["Prato proteico", "Guarnição", "Acompanhamento", "Salada", "Sobremesa", "Suco"], ref: 520 },
  { id: "sv14", cId: "c12", nome: "Almoço Metalúrgica", tipo: "Almoço", slots: ["Prato proteico", "Guarnição", "Arroz", "Feijão", "Salada"], ref: 190 },
  { id: "sv15", cId: "c4", nome: "Evento Corporativo", tipo: "Evento", slots: ["Entrada", "Prato principal", "Acompanhamento", "Sobremesa", "Bebida"], ref: 120 },
];

var ingredientes = [
  { id: "i1", nome: "Arroz branco", un: "kg", fc: 1.0, custo: 5.8 },
  { id: "i2", nome: "Feijão carioca", un: "kg", fc: 1.0, custo: 8.5 },
  { id: "i3", nome: "Peito de frango", un: "kg", fc: 1.0, custo: 18.9 },
  { id: "i4", nome: "Carne bovina acém", un: "kg", fc: 1.15, custo: 32.0 },
  { id: "i5", nome: "Alface crespa", un: "kg", fc: 1.5, custo: 8.0 },
  { id: "i6", nome: "Tomate", un: "kg", fc: 1.25, custo: 7.5 },
  { id: "i7", nome: "Cebola", un: "kg", fc: 1.15, custo: 5.2 },
  { id: "i8", nome: "Batata inglesa", un: "kg", fc: 1.2, custo: 6.3 },
  { id: "i9", nome: "Cenoura", un: "kg", fc: 1.18, custo: 5.5 },
  { id: "i13", nome: "Macarrão espaguete", un: "kg", fc: 1.0, custo: 6.2 },
  { id: "i14", nome: "Farinha de mandioca", un: "kg", fc: 1.0, custo: 7.0 },
  { id: "i15", nome: "Banana prata", un: "kg", fc: 1.3, custo: 6.0 },
  { id: "i16", nome: "Laranja", un: "kg", fc: 1.5, custo: 4.5 },
  { id: "i17", nome: "Leite integral", un: "L", fc: 1.0, custo: 5.8 },
  { id: "i18", nome: "Açúcar cristal", un: "kg", fc: 1.0, custo: 4.9 },
];

var receitas = [
  { id: "r1", nome: "Frango Grelhado ao Alho", cat: "Prato proteico", fcc: 0.75, itens: [{ i: "i3", pc: 0.12 }] },
  { id: "r2", nome: "Arroz Branco", cat: "Acompanhamento", fcc: 2.50, itens: [{ i: "i1", pc: 0.08 }] },
  { id: "r3", nome: "Feijao Carioca", cat: "Acompanhamento", fcc: 2.20, itens: [{ i: "i2", pc: 0.06 }] },
  { id: "r4", nome: "Salada Alface c/ Tomate", cat: "Salada", fcc: 1.00, itens: [{ i: "i5", pc: 0.04 }, { i: "i6", pc: 0.03 }] },
  { id: "r5", nome: "Pure de Batata", cat: "Guarnicao", fcc: 0.90, itens: [{ i: "i8", pc: 0.10 }, { i: "i17", pc: 0.03 }] },
  { id: "r6", nome: "Banana Prata", cat: "Sobremesa", fcc: 1.00, itens: [{ i: "i15", pc: 0.08 }] },
  { id: "r7", nome: "Carne de Panela c/ Legumes", cat: "Prato proteico", fcc: 0.65, itens: [{ i: "i4", pc: 0.12 }, { i: "i8", pc: 0.04 }] },
  { id: "r8", nome: "Macarrao ao Molho", cat: "Guarnicao", fcc: 2.00, itens: [{ i: "i13", pc: 0.08 }, { i: "i6", pc: 0.04 }] },
  { id: "r9", nome: "Suco de Laranja", cat: "Suco", fcc: 1.00, itens: [{ i: "i16", pc: 0.15 }, { i: "i18", pc: 0.02 }] },
  { id: "r10", nome: "Farofa Temperada", cat: "Acompanhamento", fcc: 1.00, itens: [{ i: "i14", pc: 0.03 }] },
  { id: "r11", nome: "Strogonoff de Frango", cat: "Prato proteico", fcc: 0.70, itens: [{ i: "i3", pc: 0.12 }, { i: "i17", pc: 0.02 }] },
  { id: "r12", nome: "Legumes Salteados", cat: "Guarnicao", fcc: 0.85, itens: [{ i: "i9", pc: 0.05 }] },
  { id: "r13", nome: "Salada Tropical", cat: "Salada", fcc: 1.00, itens: [{ i: "i5", pc: 0.03 }, { i: "i6", pc: 0.02 }] },
  { id: "r14", nome: "Gelatina", cat: "Sobremesa", fcc: 5.00, itens: [{ i: "i18", pc: 0.03 }] },
  { id: "r15", nome: "Canja de Galinha", cat: "Sopa", fcc: 3.00, itens: [{ i: "i3", pc: 0.06 }, { i: "i1", pc: 0.03 }] },
  { id: "r16", nome: "Frango ao Creme", cat: "Prato leve", fcc: 0.70, itens: [{ i: "i3", pc: 0.10 }, { i: "i17", pc: 0.03 }] },
  { id: "r17", nome: "Vitamina de Banana", cat: "Bebida", fcc: 1.00, itens: [{ i: "i15", pc: 0.10 }, { i: "i17", pc: 0.15 }] },
  { id: "r18", nome: "Bolo de Cenoura", cat: "Salgado/Doce", fcc: 1.20, itens: [{ i: "i9", pc: 0.05 }, { i: "i18", pc: 0.04 }] },
  { id: "r19", nome: "Biscoito Integral", cat: "Biscoito/Fruta", fcc: 1.00, itens: [{ i: "i14", pc: 0.04 }] },
  { id: "r20", nome: "Escondidinho de Charque", cat: "Prato proteico", fcc: 0.80, itens: [{ i: "i4", pc: 0.10 }, { i: "i8", pc: 0.08 }] },
  { id: "r21", nome: "Cuscuz Nordestino", cat: "Acompanhamento", fcc: 1.80, itens: [{ i: "i14", pc: 0.06 }] },
  { id: "r22", nome: "Melancia Fatiada", cat: "Fruta", fcc: 1.00, itens: [{ i: "i15", pc: 0.10 }] },
  { id: "r23", nome: "Batata Doce Assada", cat: "Guarnicao", fcc: 0.85, itens: [{ i: "i8", pc: 0.12 }] },
];

/* gera cardápios semente p/ março 2025 */
function buildSeedCards() {
  var cards = [];
  var n = 1;
  var combos = [
    { "Prato proteico": "r1", "Guarnição": "r5", "Acompanhamento": "r2", "Salada": "r4", "Sobremesa": "r6" },
    { "Prato proteico": "r7", "Guarnição": "r8", "Acompanhamento": "r2", "Salada": "r13", "Sobremesa": "r14" },
    { "Prato proteico": "r11", "Guarnição": "r12", "Acompanhamento": "r21", "Salada": "r4", "Sobremesa": "r6" },
    { "Prato proteico": "r20", "Guarnição": "r23", "Acompanhamento": "r2", "Salada": "r13", "Sobremesa": "r14" },
    { "Prato proteico": "r1", "Guarnição": "r8", "Acompanhamento": "r10", "Salada": "r4", "Sobremesa": "r6" },
  ];
  servicos.forEach(function (sv) {
    if (sv.tipo === "Evento") return;
    for (var day = 3; day <= 21; day++) {
      var dt = new Date(2025, 2, day);
      var dateStr = "2025-03-" + String(day).padStart(2, "0");
      var ci = (day + servicos.indexOf(sv)) % 5;
      var combo = combos[ci];
      var sl = {};
      sv.slots.forEach(function (sn) {
        if (combo[sn]) { sl[sn] = combo[sn]; }
        else if (sn === "Arroz") { sl[sn] = "r2"; }
        else if (sn === "Feijão") { sl[sn] = "r3"; }
        else if (sn === "Suco") { sl[sn] = "r9"; }
        else if (sn === "Bebida") { sl[sn] = "r17"; }
        else if (sn === "Salgado/Doce") { sl[sn] = "r18"; }
        else if (sn === "Biscoito/Fruta") { sl[sn] = "r19"; }
        else if (sn === "Fruta") { sl[sn] = "r22"; }
        else if (sn === "Sopa") { sl[sn] = "r15"; }
        else if (sn === "Prato leve") { sl[sn] = "r16"; }
        else { sl[sn] = null; }
      });
      var isSent = day <= 14;
      cards.push({
        id: "m" + n, svId: sv.id, cId: sv.cId, data: dateStr,
        status: isSent ? "sent" : "draft", slots: sl,
        plan: sv.ref, served: isSent ? Math.round(sv.ref * (0.93 + Math.random() * 0.07)) : null,
        updatedAt: nowISO(),
      });
      n++;
    }
  });
  return cards;
}
var initialCards = buildSeedCards();

/* ─── Modal ───────────────────────────────────────────────── */
function Modal(props) {
  if (!props.open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: C.navy + "DD", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={props.onClose}>
      <div style={{ background: C.navyLight, borderRadius: 16, border: "1px solid " + C.border, width: props.w || 560, maxWidth: "94vw", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }} onClick={function (e) { e.stopPropagation(); }}>
        <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid " + C.border, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.white }}>{props.title}</h3>
            {props.sub && <p style={{ margin: "3px 0 0", fontSize: 12, color: C.textMuted }}>{props.sub}</p>}
          </div>
          <button style={sBtnGhost} onClick={props.onClose}>✕</button>
        </div>
        <div style={{ padding: "18px 24px 24px" }}>{props.children}</div>
      </div>
    </div>
  );
}

function StatusBadge(props) {
  var map = { sent: { c: C.green, l: "✓ Aprovado" }, draft: { c: C.warning, l: "● Rascunho" } };
  var m = map[props.status] || { c: C.textMuted, l: props.status };
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: m.c + "20", color: m.c, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{m.l}</span>;
}

/* ═══════════════════════════════════════════════════════════ */
/*  APP PRINCIPAL                                             */
/* ═══════════════════════════════════════════════════════════ */
export default function PlanejamentoRendora() {
  var _cards = useState(initialCards);
  var cards = _cards[0]; var setCards = _cards[1];
  var _log = useState([]);
  var auditLog = _log[0]; var setAuditLog = _log[1];

  /* ── Filtros hierárquicos ── */
  var _fUn = useState(""); var fUnidade = _fUn[0]; var setFUnidade = _fUn[1];
  var _fCl = useState(""); var fCliente = _fCl[0]; var setFCliente = _fCl[1];
  var _fSv = useState(""); var fServico = _fSv[0]; var setFServico = _fSv[1];

  /* ── Mês/ano ── */
  var _mes = useState(2); var mesAtual = _mes[0]; var setMesAtual = _mes[1]; // 0-indexed, 2=março
  var _ano = useState(2025); var anoAtual = _ano[0]; var setAnoAtual = _ano[1];
  var _view = useState("grid"); var viewMode = _view[0]; var setViewMode = _view[1];

  /* ── Dia selecionado ── */
  var _selDay = useState(null); var selDay = _selDay[0]; var setSelDay = _selDay[1];

  /* ── Modais ── */
  var _createM = useState(false); var createModal = _createM[0]; var setCreateModal = _createM[1];
  var _createF = useState({ svId: "", data: "", plan: "" }); var createForm = _createF[0]; var setCreateForm = _createF[1];
  var _editM = useState(null); var editModal = _editM[0]; var setEditModal = _editM[1];
  var _editS = useState({}); var editSlots = _editS[0]; var setEditSlots = _editS[1];
  var _editP = useState(""); var editPlan = _editP[0]; var setEditPlan = _editP[1];
  var _editPcps = useState({}); var editPcps = _editPcps[0]; var setEditPcps = _editPcps[1];
  var _unlockM = useState(null); var unlockModal = _unlockM[0]; var setUnlockModal = _unlockM[1];
  var _unlockR = useState(""); var unlockR = _unlockR[0]; var setUnlockR = _unlockR[1];
  var _viewM = useState(null); var viewModal = _viewM[0]; var setViewModal = _viewM[1];
  var _ordemM = useState(false); var ordemModal = _ordemM[0]; var setOrdemModal = _ordemM[1];
  var _ordemS = useState(null);

  // Carregar dados do localStorage na montagem
  useEffect(function() {
    try {
      var savedCards = localStorage.getItem("rendora_planejamento_cards");
      if (savedCards) setCards(JSON.parse(savedCards));
    } catch(e) { console.log("Erro ao carregar planejamento", e); }
  }, []);

  // Salvar cards no localStorage quando mudam
  useEffect(function() {
    try { localStorage.setItem("rendora_planejamento_cards", JSON.stringify(cards)); } catch(e) {}
  }, [cards]);
 var ordemSetor = _ordemS[0]; var setOrdemSetor = _ordemS[1];

  /* ── Clientes filtrados por unidade ── */
  var clientesFiltrados = useMemo(function () {
    if (!fUnidade) return clientes;
    return clientes.filter(function (c) { return c.uId === fUnidade; });
  }, [fUnidade]);

  /* ── Serviços do cliente ── */
  var servicosCliente = useMemo(function () {
    if (!fCliente) return [];
    return servicos.filter(function (sv) { return sv.cId === fCliente; });
  }, [fCliente]);

  /* ── Cardápios filtrados ── */
  var mesStr = String(mesAtual + 1).padStart(2, "0");
  var prefixMes = anoAtual + "-" + mesStr;

  var cardsFiltrados = useMemo(function () {
    var result = cards.filter(function (c) { return c.data.startsWith(prefixMes); });
    if (fCliente) result = result.filter(function (c) { return c.cId === fCliente; });
    else if (fUnidade) {
      var cIds = clientes.filter(function (cl) { return cl.uId === fUnidade; }).map(function (cl) { return cl.id; });
      result = result.filter(function (c) { return cIds.indexOf(c.cId) >= 0; });
    }
    if (fServico) result = result.filter(function (c) { return c.svId === fServico; });
    return result;
  }, [cards, prefixMes, fCliente, fUnidade, fServico]);

  /* ── KPIs ── */
  var kpis = useMemo(function () {
    var total = cardsFiltrados.length;
    var aprovados = cardsFiltrados.filter(function (c) { return c.status === "sent"; }).length;
    var rascunhos = cardsFiltrados.filter(function (c) { return c.status === "draft"; }).length;
    var comensais = cardsFiltrados.reduce(function (a, c) { return a + (c.plan || 0); }, 0);
    var diasComPlan = [];
    cardsFiltrados.forEach(function (c) { if (diasComPlan.indexOf(c.data) < 0) diasComPlan.push(c.data); });
    var totalDiasMes = diasNoMes(anoAtual, mesAtual);
    return { total: total, aprovados: aprovados, rascunhos: rascunhos, comensais: comensais, diasPlan: diasComPlan.length, totalDiasMes: totalDiasMes };
  }, [cardsFiltrados, anoAtual, mesAtual]);

  /* ── Mapa de dias ── */
  var diasMap = useMemo(function () {
    var map = {};
    cardsFiltrados.forEach(function (c) {
      if (!map[c.data]) map[c.data] = { sent: 0, draft: 0, total: 0, comensais: 0 };
      map[c.data].total++;
      if (c.status === "sent") map[c.data].sent++;
      else map[c.data].draft++;
      map[c.data].comensais += c.plan || 0;
    });
    return map;
  }, [cardsFiltrados]);

  /* ── Cards do dia selecionado ── */
  var cardsDia = useMemo(function () {
    if (!selDay) return [];
    return cardsFiltrados.filter(function (c) { return c.data === selDay; });
  }, [cardsFiltrados, selDay]);

  /* ── Mês label ── */
  var meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  var mesLabel = meses[mesAtual] + " " + anoAtual;

  function mesAnterior() {
    if (mesAtual === 0) { setMesAtual(11); setAnoAtual(anoAtual - 1); }
    else setMesAtual(mesAtual - 1);
    setSelDay(null);
  }
  function mesSeguinte() {
    if (mesAtual === 11) { setMesAtual(0); setAnoAtual(anoAtual + 1); }
    else setMesAtual(mesAtual + 1);
    setSelDay(null);
  }

  /* ── CRUD ── */
  function doCreate() {
    var sv = servicos.find(function (x) { return x.id === createForm.svId; });
    if (!sv || !createForm.data) return alert("Preencha servico e data.");
    var novaData = createForm.data;
    var sl = {}; sv.slots.forEach(function (sn) { sl[sn] = null; });
    var novoCard = {
      id: "m" + uid(), svId: sv.id, cId: sv.cId, data: novaData,
      status: "draft", slots: sl, plan: parseInt(createForm.plan) || sv.ref,
      served: null, updatedAt: nowISO(),
    };
    setCards(cards.concat(novoCard));
    setCreateModal(false); setCreateForm({ svId: "", data: "", plan: "" });
    setSelDay(novaData);
    /* Abre direto o modal de edicao para selecionar preparacoes */
    setEditModal(novoCard);
    setEditSlots(Object.assign({}, sl));
    setEditPlan(String(novoCard.plan));
    setEditPcps({});
    if (fCliente && sv.cId !== fCliente) { setFCliente(""); }
  }
  function doEditSave() {
    if (!editModal) return;
    setCards(cards.map(function (c) {
      if (c.id !== editModal.id) return c;
      return Object.assign({}, c, { slots: Object.assign({}, editSlots), pcps: Object.assign({}, editPcps), plan: parseInt(editPlan) || c.plan, updatedAt: nowISO() });
    }));
    setEditModal(null);
  }

  /* Historico de PCPs usados para um cliente+receita */
  function getPcpHistory(cId, rId) {
    var hist = [];
    cards.forEach(function (c) {
      if (c.cId !== cId || !c.pcps) return;
      Object.keys(c.slots).forEach(function (sl) {
        if (c.slots[sl] === rId && c.pcps[sl]) {
          var val = parseFloat(c.pcps[sl]);
          if (val > 0 && hist.indexOf(val) < 0) hist.push(val);
        }
      });
    });
    hist.sort(function (a, b) { return b - a; });
    return hist.slice(0, 3);
  }
  function doSend(card) {
    setCards(cards.map(function (c) { return c.id === card.id ? Object.assign({}, c, { status: "sent", updatedAt: nowISO() }) : c; }));
    setAuditLog(auditLog.concat({ id: uid(), mId: card.id, action: "send", reason: "Envio aprovado", user: "Operador", date: nowISO() }));
  }
  function doUnlock() {
    if (!unlockR.trim()) return alert("Motivo obrigatório.");
    setCards(cards.map(function (c) { return c.id === unlockModal.id ? Object.assign({}, c, { status: "draft", updatedAt: nowISO() }) : c; }));
    setAuditLog(auditLog.concat({ id: uid(), mId: unlockModal.id, action: "unlock", reason: unlockR, user: "Operador", date: nowISO() }));
    setUnlockModal(null); setUnlockR("");
  }
  function doDelete(card) {
    if (!confirm("Excluir este cardápio rascunho?")) return;
    setCards(cards.filter(function (c) { return c.id !== card.id; }));
  }
  function doDuplicate(card) {
    setCards(cards.concat(Object.assign({}, card, { id: "m" + uid(), status: "draft", served: null, updatedAt: nowISO() })));
  }

  /* ── Ordem de Producao da Cozinha ── */
  function printOrdemProducao() {
    if (!selDay || cardsDia.length === 0) return;
    setOrdemModal(true);
  }

  /* ── Gera grade do calendário ── */
  function buildCalGrid() {
    var totalDias = diasNoMes(anoAtual, mesAtual);
    var primeiroDia = new Date(anoAtual, mesAtual, 1).getDay(); // 0=dom
    var cells = [];
    for (var i = 0; i < primeiroDia; i++) cells.push(null);
    for (var d = 1; d <= totalDias; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }
  var calGrid = buildCalGrid();

  /* ── Render ── */
  return (
    <div style={{ background: C.navy, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{"::selection{background:" + C.accent + "33} ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:" + C.navy + "} ::-webkit-scrollbar-thumb{background:" + C.border + ";border-radius:3px} input:focus,select:focus,textarea:focus{border-color:" + C.accent + "!important;box-shadow:0 0 0 3px " + C.accent + "18} button:hover{opacity:0.9}"}</style>

      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "24px 28px" }}>

        {/* ═══ HEADER ═══ */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <RendoraLogo size={38} />
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: C.white }}>Planejamento de Cardápios</h1>
              <p style={{ color: C.textMuted, fontSize: 13, margin: "3px 0 0" }}>Unidade → Cliente → Serviço → Calendário Mensal</p>
            </div>
          </div>
          <button style={sBtn} onClick={function () {
            setCreateModal(true);
            var defaultDate = selDay || (anoAtual + "-" + mesStr + "-" + String(new Date().getDate()).padStart(2, "0"));
            setCreateForm({ svId: "", data: defaultDate, plan: "" });
          }}>+ Novo Cardápio</button>
        </div>

        {/* ═══ FILTROS HIERÁRQUICOS ═══ */}
        <div style={Object.assign({}, sCard, { padding: 16, display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" })}>
          <div style={{ minWidth: 200, flex: 1 }}>
            <label style={sLabel}>Unidade (Matriz/Filial)</label>
            <select style={Object.assign({}, sSelect, { width: "100%" })} value={fUnidade} onChange={function (e) { setFUnidade(e.target.value); setFCliente(""); setFServico(""); }}>
              <option value="">Todas as unidades</option>
              {unidades.map(function (u) { return <option key={u.id} value={u.id}>{u.tipo === "matriz" ? "★ " : ""}{u.nome} ({u.uf})</option>; })}
            </select>
          </div>
          <div style={{ minWidth: 220, flex: 1 }}>
            <label style={sLabel}>Cliente</label>
            <select style={Object.assign({}, sSelect, { width: "100%" })} value={fCliente} onChange={function (e) { setFCliente(e.target.value); setFServico(""); }}>
              <option value="">Todos os clientes{fUnidade ? " desta unidade" : ""}</option>
              {clientesFiltrados.map(function (c) {
                var un = unidades.find(function (u) { return u.id === c.uId; });
                return <option key={c.id} value={c.id}>{c.nome} · {un ? un.nome : ""}</option>;
              })}
            </select>
          </div>
          <div style={{ minWidth: 200, flex: 1 }}>
            <label style={sLabel}>Serviço</label>
            <select style={Object.assign({}, sSelect, { width: "100%" })} value={fServico} onChange={function (e) { setFServico(e.target.value); }} disabled={!fCliente}>
              <option value="">Todos os serviços</option>
              {servicosCliente.map(function (sv) { return <option key={sv.id} value={sv.id}>{sv.nome} ({sv.tipo})</option>; })}
            </select>
          </div>
        </div>

        {/* ═══ KPIs DO CLIENTE — FIXOS ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, margin: "12px 0" }}>
          {[
            { l: "PLANEJAMENTOS", v: fmtInt(kpis.total), c: C.accent },
            { l: "APROVADOS", v: fmtInt(kpis.aprovados), c: C.green },
            { l: "RASCUNHO", v: fmtInt(kpis.rascunhos), c: C.warning },
            { l: "COMENSAIS TOTAIS", v: fmtInt(kpis.comensais), c: C.text },
            { l: "DIAS COM PLANO", v: kpis.diasPlan + "/" + kpis.totalDiasMes, c: C.accent },
            { l: "APROVAÇÃO", v: (kpis.total > 0 ? ((kpis.aprovados / kpis.total) * 100).toFixed(0) : 0) + "%", c: kpis.total > 0 && kpis.aprovados === kpis.total ? C.green : C.warning },
          ].map(function (k) {
            return (
              <div key={k.l} style={{ background: C.navyLight, borderRadius: 10, border: "1px solid " + C.border, padding: "14px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: C.textMuted, fontWeight: 700, letterSpacing: "0.6px", marginBottom: 4 }}>{k.l}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: k.c }}>{k.v}</div>
              </div>
            );
          })}
        </div>

        {/* ── Barra de progresso: aprovados (verde) + rascunhos (amarelo) ── */}
        <div style={Object.assign({}, sCard, { padding: "12px 18px" })}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>Progresso de Aprovação — {mesLabel}</span>
            <div style={{ display: "flex", gap: 14, fontSize: 12, fontWeight: 700 }}>
              <span style={{ color: C.green }}>✓ {kpis.aprovados} aprovados</span>
              <span style={{ color: C.warning }}>● {kpis.rascunhos} rascunhos</span>
              <span style={{ color: C.textMuted }}>{kpis.total} total</span>
            </div>
          </div>
          <div style={{ height: 10, background: C.surface, borderRadius: 6, overflow: "hidden", display: "flex" }}>
            <div style={{ height: "100%", width: (kpis.total > 0 ? (kpis.aprovados / kpis.total) * 100 : 0) + "%", background: C.green, transition: "width 0.5s ease" }} />
            <div style={{ height: "100%", width: (kpis.total > 0 ? (kpis.rascunhos / kpis.total) * 100 : 0) + "%", background: C.warning, transition: "width 0.5s ease" }} />
          </div>
        </div>

        {/* ═══ NAVEGAÇÃO MÊS + TOGGLE VIEW ═══ */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button style={sBtnGhost} onClick={mesAnterior}>◀</button>
            <span style={{ fontSize: 18, fontWeight: 800, color: C.white, minWidth: 180, textAlign: "center" }}>{mesLabel}</span>
            <button style={sBtnGhost} onClick={mesSeguinte}>▶</button>
          </div>
          <div style={{ display: "flex", background: C.surface, borderRadius: 8, padding: 3 }}>
            <button style={Object.assign({}, sBtnGhost, { padding: "6px 14px", background: viewMode === "grid" ? C.navyMid : "transparent", borderRadius: 6, color: viewMode === "grid" ? C.accent : C.textDim, fontWeight: 700 })} onClick={function () { setViewMode("grid"); }}>📅 Grade</button>
            <button style={Object.assign({}, sBtnGhost, { padding: "6px 14px", background: viewMode === "list" ? C.navyMid : "transparent", borderRadius: 6, color: viewMode === "list" ? C.accent : C.textDim, fontWeight: 700 })} onClick={function () { setViewMode("list"); }}>📋 Lista</button>
          </div>
        </div>

        {/* ═══ CALENDÁRIO GRADE ═══ */}
        {viewMode === "grid" && (
          <div style={Object.assign({}, sCard, { padding: 16 })}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 6 }}>
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(function (d) {
                return <div key={d} style={{ textAlign: "center", fontSize: 10, color: C.textDim, fontWeight: 700, padding: "6px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>{d}</div>;
              })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
              {calGrid.map(function (day, idx) {
                if (day === null) return <div key={"e" + idx} style={{ minHeight: 70 }} />;
                var dateStr = anoAtual + "-" + mesStr + "-" + String(day).padStart(2, "0");
                var info = diasMap[dateStr];
                var isSelected = selDay === dateStr;
                var dt = new Date(anoAtual, mesAtual, day);
                var isToday = dateStr === new Date().toISOString().slice(0, 10);
                var isWE = dt.getDay() === 0 || dt.getDay() === 6;
                return (
                  <div
                    key={day}
                    onClick={function () { setSelDay(isSelected ? null : dateStr); }}
                    style={{
                      minHeight: 72, padding: "6px 8px", borderRadius: 8, cursor: "pointer",
                      background: isSelected ? C.accent + "18" : (isToday ? C.green + "0A" : C.surface),
                      border: isSelected ? "2px solid " + C.accent : (isToday ? "2px solid " + C.green + "33" : "1px solid " + C.border + "66"),
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: isSelected ? C.accent : (isToday ? C.green : C.text) }}>{day}</span>
                      {isWE && <span style={{ fontSize: 8, color: C.textDim, fontWeight: 600 }}>FDS</span>}
                    </div>
                    {info ? (
                      <div>
                        {info.sent > 0 && <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 2 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green }} /><span style={{ fontSize: 9, color: C.green, fontWeight: 600 }}>{info.sent} aprov.</span></div>}
                        {info.draft > 0 && <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 2 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: C.warning }} /><span style={{ fontSize: 9, color: C.warning, fontWeight: 600 }}>{info.draft} rasc.</span></div>}
                        <div style={{ fontSize: 8, color: C.textDim, marginTop: 2 }}>{fmtInt(info.comensais)} comensais</div>
                      </div>
                    ) : (<div style={{ fontSize: 9, color: C.textDim + "88", marginTop: 6 }}>Sem plano</div>)}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ LISTA MENSAL ═══ */}
        {viewMode === "list" && (
          <div style={sCard}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid " + C.border, color: C.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Dia</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid " + C.border, color: C.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid " + C.border, color: C.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Cardápios</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid " + C.border, color: C.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Comensais</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid " + C.border, color: C.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: diasNoMes(anoAtual, mesAtual) }, function (_, i) { return i + 1; }).map(function (day) {
                  var dateStr = anoAtual + "-" + mesStr + "-" + String(day).padStart(2, "0");
                  var dt = new Date(anoAtual, mesAtual, day);
                  var info = diasMap[dateStr];
                  var isWE = dt.getDay() === 0 || dt.getDay() === 6;
                  var dayLabel = dt.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
                  return (
                    <tr key={day} style={{ opacity: info ? 1 : 0.5, cursor: "pointer", background: selDay === dateStr ? C.accent + "0C" : "transparent" }} onClick={function () { setSelDay(dateStr); }}>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid " + C.border + "44", fontSize: 13, fontWeight: 600 }}>
                        {dayLabel}
                        {isWE && <span style={{ marginLeft: 6, fontSize: 9, color: C.textDim, background: C.surface, padding: "1px 5px", borderRadius: 3 }}>FDS</span>}
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid " + C.border + "44" }}>
                        {info ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            {info.sent > 0 && <span style={{ background: C.green + "20", color: C.green, padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700 }}>✓ {info.sent}</span>}
                            {info.draft > 0 && <span style={{ background: C.warning + "20", color: C.warning, padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700 }}>● {info.draft}</span>}
                          </div>
                        ) : <span style={{ fontSize: 12, color: C.textDim }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid " + C.border + "44", fontSize: 13 }}>{info ? info.total : 0}</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid " + C.border + "44", fontSize: 13, fontWeight: 600 }}>{info ? fmtInt(info.comensais) : "—"}</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid " + C.border + "44" }}>
                        <button style={Object.assign({}, sBtnGhost, { fontSize: 11, padding: "4px 8px" })} onClick={function (e) { e.stopPropagation(); setSelDay(dateStr); }}>Ver dia →</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ═══ DETALHE DO DIA SELECIONADO ═══ */}
        {selDay && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: C.white }}>{dateFull(selDay)}</h2>
                <p style={{ color: C.textMuted, fontSize: 12, margin: "2px 0 0" }}>{cardsDia.length} cardápio{cardsDia.length !== 1 ? "s" : ""} neste dia</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {cardsDia.length > 0 && (
                  <button style={Object.assign({}, sBtn, { background: C.gold, color: C.navy })} onClick={printOrdemProducao}>🍳 Ordem da Cozinha</button>
                )}
                <button style={Object.assign({}, sBtnOutline, sBtnSm)} onClick={function () {
                  var body = "<h2>" + dateFull(selDay) + "</h2>";
                  cardsDia.forEach(function (c) {
                    var sv = servicos.find(function (x) { return x.id === c.svId; });
                    body += "<h2>" + (sv ? sv.nome : "—") + " (" + c.status + ")</h2><table><thead><tr><th>Slot</th><th>Receita</th></tr></thead><tbody>";
                    Object.entries(c.slots).forEach(function (p) { var rc = receitas.find(function (r) { return r.id === p[1]; }); body += "<tr><td>" + p[0] + "</td><td>" + (rc ? rc.nome : "—") + "</td></tr>"; });
                    body += "</tbody></table>";
                  });
                  printHTML('<div style="display:flex;justify-content:space-between;margin-bottom:20px;padding-bottom:14px;border-bottom:3px solid #192B47"><div><h1 style="margin:0;font-size:22px;font-weight:800;color:#192B47">Cardápios do Dia</h1></div><div style="font-weight:800;color:#192B47;font-size:14px;letter-spacing:2px">RENDORA</div></div>' + body);
                }}>🖨 Imprimir</button>
                <button style={sBtn} onClick={function () {
                  setCreateModal(true);
                  setCreateForm({ svId: "", data: selDay, plan: "" });
                }}>+ Novo neste dia</button>
              </div>
            </div>

            {cardsDia.length === 0 ? (
              <div style={Object.assign({}, sCard, { textAlign: "center", padding: 40 })}>
                <div style={{ fontSize: 40, opacity: 0.3, marginBottom: 10 }}>📋</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>Nenhum cardápio planejado</div>
                <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>Crie um cardápio para este dia.</div>
                <button style={sBtn} onClick={function () { setCreateModal(true); setCreateForm({ svId: "", data: selDay, plan: "" }); }}>+ Criar Cardápio</button>
              </div>
            ) : (
              cardsDia.map(function (card) {
                var sv = servicos.find(function (x) { return x.id === card.svId; });
                var cl = clientes.find(function (x) { return x.id === card.cId; });
                var un = cl ? unidades.find(function (u) { return u.id === cl.uId; }) : null;
                var filledCount = Object.values(card.slots).filter(Boolean).length;
                var totalSlots = Object.keys(card.slots).length;
                var custoTotal = Object.keys(card.slots).reduce(function (sum, sl) {
                  var rId = card.slots[sl]; var rc = receitas.find(function (r) { return r.id === rId; });
                  var pcpG = card.pcps && card.pcps[sl] ? parseFloat(card.pcps[sl]) : 0;
                  return sum + custoComPCP(rc, ingredientes, pcpG) * card.plan;
                }, 0);

                return (
                  <div key={card.id} style={Object.assign({}, sCard, { borderLeft: "4px solid " + (card.status === "sent" ? C.green : C.warning) })}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <strong style={{ fontSize: 15, color: C.white }}>{sv ? sv.nome : "—"}</strong>
                          <StatusBadge status={card.status} />
                          <span style={{ background: (sv && sv.tipo === "Evento" ? C.gold : C.accent) + "15", color: sv && sv.tipo === "Evento" ? C.gold : C.accent, padding: "1px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{sv ? sv.tipo : ""}</span>
                        </div>
                        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
                          {cl ? cl.nome : ""} · {un ? un.nome : ""} · {filledCount}/{totalSlots} slots
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: C.accent }}>{fmtInt(card.plan)}</div>
                        <div style={{ fontSize: 9, color: C.textDim, fontWeight: 600 }}>COMENSAIS</div>
                      </div>
                    </div>

                    {/* Slots */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8, margin: "12px 0" }}>
                      {Object.entries(card.slots).map(function (pair) {
                        var slot = pair[0]; var rId = pair[1];
                        var rc = receitas.find(function (r) { return r.id === rId; });
                        var pcpG = card.pcps && card.pcps[slot] ? parseFloat(card.pcps[slot]) : 0;
                        var cost = custoComPCP(rc, ingredientes, pcpG);
                        return (
                          <div key={slot} style={{ background: rc ? C.accent + "0A" : C.surface, borderRadius: 8, padding: 10, border: "1px solid " + (rc ? C.accent + "22" : C.border) }}>
                            <div style={{ fontSize: 9, color: C.textDim, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{slot}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: rc ? C.text : C.textDim }}>{rc ? rc.nome : "— vazio —"}</div>
                            {rc && pcpG > 0 && <div style={{ fontSize: 10, color: C.accent, marginTop: 2 }}>PCP: {pcpG}g</div>}
                            {rc && <div style={{ fontSize: 10, color: C.green, fontWeight: 700, marginTop: 2 }}>{fmtBRL(cost)}/comensal</div>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Custo */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: C.green + "0A", borderRadius: 8, border: "1px solid " + C.green + "15", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: C.textMuted }}>💰 Custo estimado:</span>
                      <strong style={{ color: C.green, fontSize: 14 }}>{fmtBRL(custoTotal)}</strong>
                      <span style={{ fontSize: 11, color: C.textDim, marginLeft: "auto" }}>({fmtBRL(custoTotal / (card.plan || 1))}/comensal)</span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid " + C.border + "33" }}>
                      <button style={sBtnGhost} onClick={function () { setViewModal(card); }} title="Ver detalhes">👁 Detalhes</button>
                      <button style={sBtnGhost} onClick={function () { doDuplicate(card); }} title="Duplicar">📋 Duplicar</button>
                      {card.status === "sent" ? (
                        <button style={Object.assign({}, sBtnOutline, sBtnSm)} onClick={function () { setUnlockModal(card); }}>🔓 Desbloquear</button>
                      ) : (
                        <>
                          <button style={Object.assign({}, sBtnGhost, { color: C.danger })} onClick={function () { doDelete(card); }}>🗑</button>
                          <button style={Object.assign({}, sBtnOutline, sBtnSm)} onClick={function () { setEditModal(card); setEditSlots(Object.assign({}, card.slots)); setEditPlan(String(card.plan)); setEditPcps(Object.assign({}, card.pcps || {})); }}>✏️ Editar</button>
                          <button style={Object.assign({}, sBtnGreen, sBtnSm, { opacity: filledCount < totalSlots ? 0.5 : 1 })} onClick={function () { if (filledCount === totalSlots) doSend(card); else alert("Preencha todos os slots."); }}>📨 Aprovar</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ═══ MODAL: CRIAR ═══ */}
        <Modal open={createModal} onClose={function () { setCreateModal(false); }} title="Novo Cardápio" sub={fCliente ? "Cliente: " + (clientes.find(function (c) { return c.id === fCliente; }) || {}).nome : "Selecione o serviço"}>
          <div style={{ marginBottom: 14 }}>
            <label style={sLabel}>Serviço *</label>
            <select style={Object.assign({}, sSelect, { width: "100%" })} value={createForm.svId} onChange={function (e) {
              var sv = servicos.find(function (x) { return x.id === e.target.value; });
              setCreateForm(Object.assign({}, createForm, { svId: e.target.value, plan: sv ? String(sv.ref) : "" }));
            }}>
              <option value="">Selecione...</option>
              {(fCliente ? servicosCliente : servicos).map(function (sv) {
                var cl = clientes.find(function (c) { return c.id === sv.cId; });
                return <option key={sv.id} value={sv.id}>{sv.nome} ({sv.tipo}) · {cl ? cl.nome : ""}</option>;
              })}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div><label style={sLabel}>Data *</label><input style={sInput} type="date" value={createForm.data} onChange={function (e) { setCreateForm(Object.assign({}, createForm, { data: e.target.value })); }} /></div>
            <div><label style={sLabel}>Comensais</label><input style={sInput} type="number" value={createForm.plan} onChange={function (e) { setCreateForm(Object.assign({}, createForm, { plan: e.target.value })); }} placeholder="Ref. do serviço" /></div>
          </div>
          {createForm.svId && (
            <div style={{ background: C.surface, borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6, fontWeight: 600 }}>SLOTS QUE SERÃO CRIADOS:</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(servicos.find(function (x) { return x.id === createForm.svId; }) || { slots: [] }).slots.map(function (sl) {
                  return <span key={sl} style={{ background: C.accent + "15", color: C.accent, padding: "3px 9px", borderRadius: 5, fontSize: 11, fontWeight: 700 }}>{sl}</span>;
                })}
              </div>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button style={sBtnOutline} onClick={function () { setCreateModal(false); }}>Cancelar</button>
            <button style={sBtn} onClick={doCreate}>+ Criar</button>
          </div>
        </Modal>

        {/* ═══ MODAL: EDITAR ═══ */}
        <Modal open={!!editModal} onClose={function () { setEditModal(null); }} title={editModal && Object.values(editSlots).every(function (v) { return !v; }) ? "Montar Cardapio" : "Editar Cardapio"} sub={editModal ? (function () { var sv = servicos.find(function (x) { return x.id === editModal.svId; }); var cl = clientes.find(function (x) { return x.id === editModal.cId; }); return (sv ? sv.nome : "") + (cl ? " | " + cl.nome : "") + " | " + dateFull(editModal.data); })() : ""} w={720}>
          {editModal && (function () {
            var sv = servicos.find(function (x) { return x.id === editModal.svId; });
            return (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <label style={sLabel}>Comensais Planejadas</label>
                  <input style={Object.assign({}, sInput, { width: 200 })} type="number" value={editPlan} onChange={function (e) { setEditPlan(e.target.value); }} />
                </div>
                <label style={sLabel}>Composicao do Cardapio — Defina a porcao pronta (PCP) por preparacao</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginBottom: 16 }}>
                  {(sv ? sv.slots : []).map(function (slotName) {
                    var rId = editSlots[slotName] || null;
                    var rc = receitas.find(function (r) { return r.id === rId; });
                    var opcoesSlot = receitasParaSlot(slotName, receitas);
                    var pcpVal = editPcps[slotName] || "";
                    var pcpNum = parseFloat(pcpVal) || 0;
                    var fcc = rc ? (rc.fcc || 1) : 1;
                    var pcl = pcpNum > 0 ? pcpNum / fcc : 0;
                    var hist = rc && editModal ? getPcpHistory(editModal.cId, rId) : [];
                    var comensais = parseInt(editPlan) || 0;

                    return (
                      <div key={slotName} style={{ background: C.navyMid, borderRadius: 10, padding: 14, border: "1px solid " + (rId ? C.accent + "33" : C.border) }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                          {/* Slot + Receita */}
                          <div style={{ flex: 2 }}>
                            <div style={{ fontSize: 10, color: C.textDim, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>{slotName}</div>
                            <select style={Object.assign({}, sSelect, { width: "100%", fontSize: 12, padding: 8 })} value={rId || ""} onChange={function (e) {
                              var ns = Object.assign({}, editSlots); ns[slotName] = e.target.value || null; setEditSlots(ns);
                              if (!e.target.value) { var np = Object.assign({}, editPcps); delete np[slotName]; setEditPcps(np); }
                            }}>
                              <option value="">— vazio —</option>
                              {opcoesSlot.map(function (r) { return <option key={r.id} value={r.id}>{r.nome}</option>; })}
                            </select>
                          </div>
                          {/* PCP */}
                          {rc && (
                            <div style={{ flex: 1, minWidth: 120 }}>
                              <div style={{ fontSize: 10, color: C.green, fontWeight: 700, marginBottom: 6 }}>PCP (g pronto)</div>
                              <input style={Object.assign({}, sInput, { fontSize: 15, fontWeight: 700, padding: "8px 10px", color: C.green, textAlign: "center" })} type="number" step="1" value={pcpVal} placeholder="g" onChange={function (e) { var np = Object.assign({}, editPcps); np[slotName] = e.target.value; setEditPcps(np); }} />
                            </div>
                          )}
                          {/* Calculos */}
                          {rc && pcpNum > 0 && (
                            <div style={{ flex: 1, minWidth: 140 }}>
                              <div style={{ fontSize: 10, color: C.textDim, fontWeight: 700, marginBottom: 6 }}>CALCULADO</div>
                              <div style={{ fontSize: 11, color: C.textMuted }}>PCL: <strong style={{ color: C.accent }}>{(pcl * 1000).toFixed(0)}g</strong></div>
                              <div style={{ fontSize: 11, color: C.textMuted }}>FCc: <strong style={{ color: C.warning }}>{fcc.toFixed(2)}</strong></div>
                              {comensais > 0 && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Total pronto: <strong style={{ color: C.green }}>{fmt(pcpNum / 1000 * comensais)} {unPrep(rc)}</strong></div>}
                              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Custo: <strong style={{ color: C.gold }}>{fmtBRL(custoComPCP(rc, ingredientes, pcpNum))}/comensal</strong></div>
                              {comensais > 0 && <div style={{ fontSize: 10, color: C.gold }}>Total: {fmtBRL(custoComPCP(rc, ingredientes, pcpNum) * comensais)}</div>}
                            </div>
                          )}
                        </div>
                        {/* Historico PCP */}
                        {rc && hist.length > 0 && (
                          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 9, color: C.textDim }}>Ultimos PCP usados:</span>
                            {hist.map(function (h, idx) {
                              return <button key={idx} style={Object.assign({}, sBtnGhost, { fontSize: 11, padding: "3px 8px", background: C.surface, borderRadius: 6 })} onClick={function () { var np = Object.assign({}, editPcps); np[slotName] = String(h); setEditPcps(np); }}>{h}g</button>;
                            })}
                          </div>
                        )}
                        {rc && hist.length === 0 && !pcpVal && (
                          <div style={{ marginTop: 6, fontSize: 10, color: C.warning }}>Primeiro uso — defina a porcao pronta para este cliente</div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {(function () {
                  var totalSlots = sv ? sv.slots.length : 0;
                  var preenchidos = Object.values(editSlots).filter(function (v) { return !!v; }).length;
                  return (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 12, color: preenchidos === totalSlots ? C.green : C.warning, fontWeight: 600 }}>
                        {preenchidos}/{totalSlots} slots preenchidos {preenchidos === totalSlots ? "- Completo!" : ""}
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button style={sBtnOutline} onClick={function () { setEditModal(null); }}>Cancelar</button>
                        <button style={sBtnGreen} onClick={doEditSave}>{preenchidos === 0 ? "Salvar Rascunho" : "Salvar Cardapio"}</button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}
        </Modal>

        {/* ═══ MODAL: DESBLOQUEAR ═══ */}
        <Modal open={!!unlockModal} onClose={function () { setUnlockModal(null); setUnlockR(""); }} title="Desbloquear Cardápio Aprovado" sub="Registro obrigatório no log de auditoria">
          <div style={{ background: C.danger + "12", border: "1px solid " + C.danger + "33", borderRadius: 10, padding: 14, marginBottom: 16, display: "flex", gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div style={{ fontSize: 13 }}><strong>Atenção:</strong> Este cardápio já foi aprovado. Ao desbloquear, voltará a rascunho.</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={sLabel}>Motivo *</label>
            <textarea style={Object.assign({}, sInput, { minHeight: 90, resize: "vertical" })} value={unlockR} onChange={function (e) { setUnlockR(e.target.value); }} placeholder="Ex: Substituição de proteína..." />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button style={sBtnOutline} onClick={function () { setUnlockModal(null); setUnlockR(""); }}>Cancelar</button>
            <button style={sBtnDanger} onClick={doUnlock}>🔓 Confirmar</button>
          </div>
        </Modal>

        {/* ═══ MODAL: VISUALIZAR ═══ */}
        <Modal open={!!viewModal} onClose={function () { setViewModal(null); }} title="Detalhes do Cardápio" w={700}>
          {viewModal && (function () {
            var sv = servicos.find(function (x) { return x.id === viewModal.svId; });
            var cl = clientes.find(function (x) { return x.id === viewModal.cId; });
            var un = cl ? unidades.find(function (u) { return u.id === cl.uId; }) : null;
            var custoTotal = Object.keys(viewModal.slots).reduce(function (sum, sl) {
              var rId = viewModal.slots[sl]; var rc = receitas.find(function (r) { return r.id === rId; });
              var pcpG = viewModal.pcps && viewModal.pcps[sl] ? parseFloat(viewModal.pcps[sl]) : 0;
              return sum + custoComPCP(rc, ingredientes, pcpG) * viewModal.plan;
            }, 0);
            var cardLogs = auditLog.filter(function (l) { return l.mId === viewModal.id; });
            return (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
                  {[
                    { l: "Serviço", v: sv ? sv.nome + " (" + sv.tipo + ")" : "—" },
                    { l: "Cliente", v: cl ? cl.nome : "—" },
                    { l: "Unidade", v: un ? un.nome + " (" + un.uf + ")" : "—" },
                    { l: "Data", v: dateFull(viewModal.data) },
                    { l: "Status", v: viewModal.status === "sent" ? "Aprovado" : "Rascunho" },
                    { l: "Comensais", v: fmtInt(viewModal.plan) + (viewModal.served ? " / " + fmtInt(viewModal.served) + " serv." : "") },
                    { l: "Renovação", v: cl ? cl.renovacao : "—" },
                    { l: "Reajuste", v: cl ? cl.reajuste : "—" },
                    { l: "Custo Total", v: fmtBRL(custoTotal) },
                  ].map(function (item) {
                    return (
                      <div key={item.l} style={{ background: C.surface, borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 9, color: C.textDim, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{item.l}</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{item.v}</div>
                      </div>
                    );
                  })}
                </div>
                <label style={sLabel}>Slots com Custo</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8, marginBottom: 12 }}>
                  {Object.entries(viewModal.slots).map(function (pair) {
                    var rc = receitas.find(function (r) { return r.id === pair[1]; });
                    var pcpG = viewModal.pcps && viewModal.pcps[pair[0]] ? parseFloat(viewModal.pcps[pair[0]]) : 0;
                    var cost = custoComPCP(rc, ingredientes, pcpG);
                    return (
                      <div key={pair[0]} style={{ background: rc ? C.accent + "0A" : C.surface, borderRadius: 8, padding: 10, border: "1px solid " + (rc ? C.accent + "22" : C.border) }}>
                        <div style={{ fontSize: 9, color: C.textDim, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{pair[0]}</div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{rc ? rc.nome : "— vazio —"}</div>
                        {rc && pcpG > 0 && <div style={{ fontSize: 10, color: C.accent, marginTop: 2 }}>PCP: {pcpG}g</div>}
                        {rc && <div style={{ fontSize: 10, color: C.green, fontWeight: 700, marginTop: 2 }}>{fmtBRL(cost)}/comensal | {fmtBRL(cost * viewModal.plan)} total</div>}
                      </div>
                    );
                  })}
                </div>
                {cardLogs.length > 0 && (
                  <div>
                    <label style={sLabel}>Auditoria</label>
                    {cardLogs.map(function (l) {
                      return (
                        <div key={l.id} style={{ background: C.surface, borderRadius: 8, padding: 10, marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                          <span>{l.action === "unlock" ? "🔓" : "📨"} {l.reason}</span>
                          <span style={{ fontSize: 10, color: C.textDim }}>{new Date(l.date).toLocaleString("pt-BR")}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </Modal>




        {/* MODAL: ORDEM DE PRODUCAO DA COZINHA */}
        <Modal open={ordemModal} onClose={function () { setOrdemModal(false); }} title={"Ordem de Producao da Cozinha"} sub={selDay ? dateFull(selDay) : ""} w="90vw">
          {selDay && cardsDia.length > 0 && (function () {
            var totalCom = cardsDia.reduce(function (s, c) { return s + (c.plan || 0); }, 0);
            var porSetor = {};
            var porTurno = {};
            var porCliente = [];

            cardsDia.forEach(function (card) {
              var sv = servicos.find(function (x) { return x.id === card.svId; });
              var cl = clientes.find(function (x) { return x.id === card.cId; });
              var turno = sv ? sv.tipo : "Outro";
              if (!porTurno[turno]) porTurno[turno] = { preps: {}, com: 0 };
              porTurno[turno].com += (card.plan || 0);
              var prepsC = [];
              if (sv) {
                sv.slots.forEach(function (slotName) {
                  var rId = card.slots[slotName];
                  var rc = receitas.find(function (r) { return r.id === rId; });
                  if (!rc) return;
                  var fcc = rc.fcc || 1;
                  var somaPCL = rc.itens.reduce(function (s, it) { return s + it.pc; }, 0);
                  var pcpCustom = card.pcps && card.pcps[slotName] ? parseFloat(card.pcps[slotName]) : 0;
                  var escala = pcpCustom > 0 ? (pcpCustom / 1000) / (somaPCL * fcc) : 1;
                  var pesoPronto = pcpCustom > 0 ? (pcpCustom / 1000) * (card.plan || 0) : somaPCL * fcc * (card.plan || 0);
                  var pesoCru = rc.itens.reduce(function (s, it) { var ig = ingredientes.find(function (x) { return x.id === it.i; }); return s + (it.pc * escala * (ig ? ig.fc : 1)); }, 0) * (card.plan || 0);
                  var sId = setorDaReceita(rc);
                  prepsC.push({ rc: rc, slot: slotName, pesoPronto: pesoPronto, pesoCru: pesoCru, setorId: sId });
                  /* Por turno */
                  if (!porTurno[turno].preps[rId]) porTurno[turno].preps[rId] = { rc: rc, slot: slotName, pesoPronto: 0, pesoCru: 0, com: 0 };
                  porTurno[turno].preps[rId].pesoPronto += pesoPronto;
                  porTurno[turno].preps[rId].pesoCru += pesoCru;
                  porTurno[turno].preps[rId].com += (card.plan || 0);
                  /* Por setor */
                  if (!porSetor[sId]) porSetor[sId] = { preps: {}, totalIngs: {} };
                  if (!porSetor[sId].preps[rId]) porSetor[sId].preps[rId] = { rc: rc, slot: slotName, pesoPronto: 0, pesoCru: 0, com: 0, ings: {} };
                  porSetor[sId].preps[rId].pesoPronto += pesoPronto;
                  porSetor[sId].preps[rId].pesoCru += pesoCru;
                  porSetor[sId].preps[rId].com += (card.plan || 0);
                  rc.itens.forEach(function (it) {
                    var ig = ingredientes.find(function (x) { return x.id === it.i; });
                    if (!ig) return;
                    var bruto = it.pc * escala * ig.fc * (card.plan || 0);
                    if (!porSetor[sId].preps[rId].ings[it.i]) porSetor[sId].preps[rId].ings[it.i] = { ig: ig, bruto: 0 };
                    porSetor[sId].preps[rId].ings[it.i].bruto += bruto;
                    if (!porSetor[sId].totalIngs[it.i]) porSetor[sId].totalIngs[it.i] = { ig: ig, bruto: 0 };
                    porSetor[sId].totalIngs[it.i].bruto += bruto;
                  });
                });
              }
              porCliente.push({ card: card, sv: sv, cl: cl, preps: prepsC });
            });

            var setoresAtivos = SETORES.filter(function (s) { return !!porSetor[s.id]; });
            var turnoOrdem = ["Almoço", "Lanche", "Jantar", "Evento", "Café", "Outro"];
            var turnosAtivos = Object.keys(porTurno).sort(function (a, b) { var ia = turnoOrdem.indexOf(a); var ib = turnoOrdem.indexOf(b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
            var turnoIcon = { "Almoço": "☀️", "Lanche": "🥤", "Jantar": "🌙", "Evento": "🎉", "Café": "☕" };
            var td = { padding: "8px 10px", borderBottom: "1px solid " + C.border + "33", fontSize: 12 };
            var th = { padding: "8px 10px", borderBottom: "2px solid " + C.border, fontSize: 9, fontWeight: 700, color: C.textDim, textTransform: "uppercase" };

            return (
              <div>
                {/* KPIs */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
                  <div style={{ background: C.accent + "12", borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: C.textDim, fontWeight: 700 }}>CARDAPIOS</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: C.accent }}>{cardsDia.length}</div>
                  </div>
                  <div style={{ background: C.gold + "12", borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: C.textDim, fontWeight: 700 }}>COMENSAIS TOTAIS</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: C.gold }}>{fmtInt(totalCom)}</div>
                  </div>
                  <div style={{ background: C.green + "12", borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: C.textDim, fontWeight: 700 }}>SETORES / TURNOS</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: C.green }}>{setoresAtivos.length} / {turnosAtivos.length}</div>
                  </div>
                </div>

                {/* ═══ 1. RESUMO POR TURNO ═══ */}
                <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, marginBottom: 10, borderBottom: "2px solid " + C.gold + "33", paddingBottom: 6 }}>1. Resumo por Turno</div>

                {turnosAtivos.map(function (turno) {
                  var tData = porTurno[turno];
                  var pList = Object.keys(tData.preps).sort(function (a, b) { return tData.preps[b].pesoPronto - tData.preps[a].pesoPronto; }).map(function (k) { return tData.preps[k]; });
                  return (
                    <div key={turno} style={{ background: C.surface, borderRadius: 12, padding: 14, marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{turnoIcon[turno] || "📋"}</span>
                          <span style={{ fontSize: 15, fontWeight: 800, color: C.white }}>{turno}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>{fmtInt(tData.com)} comensais</span>
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead><tr>
                          <th style={th}>Preparacao</th>
                          <th style={th}>Setor</th>
                          <th style={Object.assign({}, th, { textAlign: "right" })}>Comensais</th>
                          <th style={Object.assign({}, th, { textAlign: "right" })}>FCc</th>
                          <th style={Object.assign({}, th, { textAlign: "right", color: C.green })}>Peso Pronto</th>
                          <th style={Object.assign({}, th, { textAlign: "right", color: C.danger })}>Peso Cru</th>
                        </tr></thead>
                        <tbody>
                          {pList.map(function (p) {
                            var un = unPrep(p.rc);
                            var sId = setorDaReceita(p.rc);
                            var st = SETORES.find(function (s) { return s.id === sId; });
                            return (
                              <tr key={p.rc.id}>
                                <td style={Object.assign({}, td, { fontWeight: 700, color: C.white, fontSize: 13 })}>{p.rc.nome}</td>
                                <td style={Object.assign({}, td, { fontSize: 11 })}>{st ? <span style={{ color: st.cor }}>{st.icon} {st.nome}</span> : "--"}</td>
                                <td style={Object.assign({}, td, { textAlign: "right", color: C.textMuted })}>{fmtInt(p.com)}</td>
                                <td style={Object.assign({}, td, { textAlign: "right", color: C.warning, fontSize: 11 })}>{(p.rc.fcc || 1).toFixed(2)}</td>
                                <td style={Object.assign({}, td, { textAlign: "right", fontWeight: 800, color: C.green, fontSize: 14 })}>{fmt(p.pesoPronto)} {un}</td>
                                <td style={Object.assign({}, td, { textAlign: "right", fontWeight: 700, color: C.danger, fontSize: 13 })}>{fmt(p.pesoCru)} kg</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}

                {/* ═══ 2. ABAS POR SETOR + CARDS ═══ */}
                <div style={{ fontSize: 14, fontWeight: 700, color: C.accent, marginTop: 8, marginBottom: 10, borderBottom: "2px solid " + C.accent + "33", paddingBottom: 6 }}>2. Detalhe por Setor</div>

                {/* Abas */}
                <div style={{ display: "flex", gap: 4, marginBottom: 14, background: C.surface, borderRadius: 12, padding: 4, flexWrap: "wrap" }}>
                  {setoresAtivos.map(function (setor) {
                    var isA = (ordemSetor || setoresAtivos[0].id) === setor.id;
                    var nPreps = Object.keys(porSetor[setor.id].preps).length;
                    return (
                      <div key={setor.id} onClick={function () { setOrdemSetor(setor.id); }} style={{ padding: "10px 16px", borderRadius: 10, cursor: "pointer", background: isA ? setor.cor + "22" : "transparent", border: isA ? "1.5px solid " + setor.cor : "1.5px solid transparent", textAlign: "center", flex: 1, minWidth: 100 }}>
                        <div style={{ fontSize: 18 }}>{setor.icon}</div>
                        <div style={{ fontSize: 11, fontWeight: isA ? 800 : 500, color: isA ? setor.cor : C.textMuted }}>{setor.nome}</div>
                        <div style={{ fontSize: 9, color: C.textDim }}>{nPreps} prep.</div>
                      </div>
                    );
                  })}
                </div>

                {/* Cards da aba selecionada */}
                {(function () {
                  var sId = ordemSetor || (setoresAtivos.length > 0 ? setoresAtivos[0].id : null);
                  if (!sId || !porSetor[sId]) return null;
                  var setor = SETORES.find(function (s) { return s.id === sId; });
                  var dados = porSetor[sId];
                  var pList = Object.keys(dados.preps).sort(function (a, b) { return dados.preps[b].pesoPronto - dados.preps[a].pesoPronto; }).map(function (k) { return dados.preps[k]; });

                  return (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 22 }}>{setor.icon}</span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: setor.cor }}>{setor.nome}</span>
                        <span style={{ fontSize: 11, color: C.textDim }}>— {pList.length} preparacoes</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 10, marginBottom: 16 }}>
                        {pList.map(function (p) {
                          var iList = Object.keys(p.ings).sort(function (a, b) { return p.ings[b].bruto - p.ings[a].bruto; });
                          var un = unPrep(p.rc);
                          return (
                            <div key={p.rc.id} style={{ background: C.navyMid, borderRadius: 12, padding: 14, border: "1px solid " + setor.cor + "33" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                <div>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>{p.rc.nome}</div>
                                  <div style={{ fontSize: 10, color: C.textDim }}>{p.slot} | {fmtInt(p.com)} comensais | FCc: <span style={{ color: C.warning }}>{(p.rc.fcc || 1).toFixed(2)}</span></div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <div style={{ fontSize: 16, fontWeight: 800, color: C.green }}>{fmt(p.pesoPronto)} {un}</div>
                                  <div style={{ fontSize: 9, color: C.textDim }}>pronto</div>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: C.danger }}>{fmt(p.pesoCru)} kg</div>
                                  <div style={{ fontSize: 9, color: C.textDim }}>cru (bruto)</div>
                                </div>
                              </div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: C.accent, marginBottom: 6, textTransform: "uppercase" }}>Ingredientes (peso bruto/cru)</div>
                              {iList.map(function (iId) {
                                var x = p.ings[iId];
                                return (
                                  <div key={iId} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid " + C.border + "22", alignItems: "center" }}>
                                    <div>
                                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{x.ig.nome}</span>
                                      {x.ig.fc > 1 && <span style={{ fontSize: 9, color: C.warning, marginLeft: 6 }}>FC {x.ig.fc.toFixed(2)}</span>}
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: C.danger }}>{fmt(x.bruto)} {x.ig.un}</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* ═══ 3. POR CLIENTE ═══ */}
                <div style={{ fontSize: 14, fontWeight: 700, color: C.textMuted, marginTop: 8, marginBottom: 10, borderBottom: "2px solid " + C.border + "33", paddingBottom: 6 }}>3. Por Cliente</div>
                {porCliente.map(function (pc) {
                  return (
                    <div key={pc.card.id} style={{ background: C.navyMid, borderRadius: 12, padding: 14, marginBottom: 8, border: "1px solid " + C.border }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: C.white }}>{pc.cl ? pc.cl.nome : "--"}</span>
                          <span style={{ fontSize: 11, color: C.textDim, marginLeft: 8 }}>{pc.sv ? pc.sv.nome : ""}</span>
                        </div>
                        <span style={{ background: C.gold + "18", color: C.gold, padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>{pc.card.plan} comensais</span>
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead><tr>
                          <th style={th}>Preparacao</th>
                          <th style={th}>Setor</th>
                          <th style={Object.assign({}, th, { textAlign: "right" })}>Qtd Pronto</th>
                        </tr></thead>
                        <tbody>
                          {pc.preps.map(function (p, idx) {
                            var un = unPrep(p.rc);
                            var st = SETORES.find(function (s) { return s.id === p.setorId; });
                            return (
                              <tr key={idx}>
                                <td style={Object.assign({}, td, { fontWeight: 600, color: C.white })}>{p.rc.nome}</td>
                                <td style={Object.assign({}, td, { fontSize: 11 })}>{st ? <span style={{ color: st.cor }}>{st.icon} {st.nome}</span> : "--"}</td>
                                <td style={Object.assign({}, td, { textAlign: "right", fontWeight: 700, color: C.green, fontSize: 13 })}>{fmt(p.pesoPronto)} {un}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}

                <div style={{ marginTop: 16, padding: "10px 14px", background: C.surface, borderRadius: 8, display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textDim }}>
                  <span>Rendora | {new Date().toLocaleString("pt-BR")}</span>
                  <span>{dateFull(selDay)} | {fmtInt(totalCom)} comensais</span>
                </div>
              </div>
            );
          })()}
        </Modal>





      </div>
    </div>
  );
}
