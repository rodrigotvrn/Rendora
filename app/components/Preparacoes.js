"use client";
import { useState, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════
   RENDORA — MÓDULO PREPARAÇÕES v15
   Formato FTP das nutricionistas
   ═══════════════════════════════════════════════════════════════ */

var C = {
  navy: "#192B47", navyLight: "#1E3250", navyMid: "#243A5C",
  surface: "#162842", border: "#2A4266", accent: "#00BDE4",
  green: "#2EAD4B", gold: "#E8A832", text: "#E4E9F0",
  textMuted: "#8B9DB3", textDim: "#5D7490", white: "#FFFFFF",
  danger: "#E5484D", warning: "#F5A623",
};

function uid() { return Math.random().toString(36).slice(2, 9); }
function fmt(n) { return Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtBRL(n) { return "R$ " + fmt(n); }
function fmtG(n) { return (n * 1000).toFixed(0) + "g"; }
function nowISO() { return new Date().toISOString(); }
function fmtDT(iso) { if (!iso) return "—"; return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); }

var USUARIOS = [
  { id: "usr1", nome: "Rodrigo Dantas", cargo: "Gestor" },
  { id: "usr2", nome: "Ana Nutricionista", cargo: "Nutricionista RT" },
  { id: "usr3", nome: "Maria Cozinha", cargo: "Chefe de Cozinha" },
  { id: "usr4", nome: "Carlos Compras", cargo: "Comprador" },
];

var GRUPOS_INGREDIENTES = [
  "Cereais", "Massas", "Farináceos", "Leguminosas",
  "Carnes", "Ovos", "Laticínios",
  "Hortaliças", "Tubérculos", "Frutas",
  "Óleos", "Temperos",
  "Doces", "Conservas", "Outros",
];

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

function Modal(props) {
  if (!props.open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: C.navy + "DD", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={props.onClose}>
      <div style={{ background: C.navyLight, borderRadius: 16, border: "1px solid " + C.border, width: props.w || 620, maxWidth: "94vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }} onClick={function (e) { e.stopPropagation(); }}>
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

/* ─── impressão ───────────────────────────────────────────── */
function printFicha(rec, ings, cats) {
  var cat = cats.find(function (c) { return c.id === rec.catId; });
  var nPor = rec.porcoes || 50;
  /* Tabela 1: Per Capita */
  var rows1 = rec.itens.map(function (it) {
    var ig = ings.find(function (x) { return x.id === it.iId; });
    if (!ig) return "";
    var pcBruto = (parseFloat(it.pcb) || ((parseFloat(it.pc) || 0) * (parseFloat(it.fc) || ig.fc)));
    var porcaoPronta = it.pc * rec.fcCoccao;
    return "<tr><td>" + ig.nome + "</td><td>" + ig.un + "</td><td>" + (it.pc * 1000).toFixed(0) + "g</td><td>" + ig.fc.toFixed(2) + "</td><td>" + (pcBruto * 1000).toFixed(0) + "g</td><td style='color:#2EAD4B;font-weight:600'>" + (porcaoPronta * 1000).toFixed(0) + "g</td></tr>";
  }).join("");
  /* Tabela 2: Totais e Custos */
  var custoTotal = 0;
  var rows2 = rec.itens.map(function (it) {
    var ig = ings.find(function (x) { return x.id === it.iId; });
    if (!ig) return "";
    var pcBruto = (parseFloat(it.pcb) || ((parseFloat(it.pc) || 0) * (parseFloat(it.fc) || ig.fc)));
    var pesoLiqT = (it.pc * nPor * 1000).toFixed(0);
    var pesoBrtT = (pcBruto * nPor * 1000).toFixed(0);
    var custoPor = pcBruto * ig.custo;
    var custoTot = custoPor * nPor;
    custoTotal += custoTot;
    return "<tr><td>" + ig.nome + "</td><td>" + pesoLiqT + "g</td><td>" + pesoBrtT + "g</td><td>R$ " + ig.custo.toFixed(2) + "</td><td>R$ " + custoPor.toFixed(2) + "</td><td style='font-weight:700'>R$ " + custoTot.toFixed(2) + "</td></tr>";
  }).join("");
  var custoPorcao = calcCusto(rec, ings);
  var html = '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:14px;border-bottom:3px solid #192B47"><div><h1 style="margin:0;font-size:22px;color:#192B47;font-weight:800">Ficha Técnica de Preparação</h1><p style="margin:4px 0 0;font-size:14px;color:#333;font-weight:600">' + rec.nome + '</p></div><div style="text-align:right;font-size:12px;color:#5D7490"><div style="font-weight:800;color:#192B47;font-size:14px;letter-spacing:2px">RENDORA</div></div></div>';
  html += '<p><strong>Categoria:</strong> ' + (cat ? cat.nome : "—") + ' · <strong>Fc Cocção:</strong> ' + rec.fcCoccao + ' · <strong>Comensais:</strong> ' + nPor + '</p>';
  html += '<h3 style="color:#00BDE4;font-size:13px;margin:16px 0 8px;text-transform:uppercase;letter-spacing:1px">Per Capita — Valores por Pessoa</h3>';
  html += '<table><thead><tr><th>Ingrediente</th><th>Un.</th><th>PC Líquido</th><th>FC</th><th>PC Bruto</th><th>PCP (Pronto)</th></tr></thead><tbody>' + rows1 + '</tbody></table>';
  html += '<h3 style="color:#E8A832;font-size:13px;margin:20px 0 8px;text-transform:uppercase;letter-spacing:1px">Totais e Custos — ' + nPor + ' Comensais</h3>';
  html += '<table><thead><tr><th>Ingrediente</th><th>Peso Líq. Total</th><th>Peso Bruto Total</th><th>Custo Un.</th><th>Custo/Comensal</th><th>Custo Total</th></tr></thead><tbody>' + rows2 + '</tbody></table>';
  html += '<div style="display:flex;justify-content:space-between;margin-top:16px;padding:12px;border:2px solid #2EAD4B;border-radius:8px"><div><strong>Custo por comensal:</strong> R$ ' + custoPorcao.toFixed(2) + '</div><div><strong>Custo total (' + nPor + ' comensais):</strong> <span style="color:#2EAD4B;font-size:16px;font-weight:800">R$ ' + custoTotal.toFixed(2) + '</span></div></div>';
  html += '<div style="text-align:center;margin-top:30px;padding-top:12px;border-top:2px solid #2EAD4B;font-size:11px;color:#888">Rendora · ' + new Date().toLocaleDateString("pt-BR") + '</div>';

  var f = document.createElement("iframe"); f.style.display = "none"; document.body.appendChild(f);
  f.contentDocument.open();
  f.contentDocument.write('<!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>body{font-family:"DM Sans",sans-serif;color:#1E3250;padding:30px;max-width:900px;margin:0 auto}table{width:100%;border-collapse:collapse;margin:8px 0}th{text-align:left;padding:7px 8px;border-bottom:2px solid #192B47;font-size:10px;text-transform:uppercase;color:#5D7490}td{padding:7px 8px;border-bottom:1px solid #eee;font-size:12px}</style></head><body>' + html + '</body></html>');
  f.contentDocument.close(); f.contentWindow.focus(); f.contentWindow.print();
  setTimeout(function () { document.body.removeChild(f); }, 2000);
}

function calcCusto(rec, ings) {
  if (!rec) return 0;
  return rec.itens.reduce(function (sum, it) {
    var ig = ings.find(function (x) { return x.id === it.iId; });
    if (!ig) return sum;
    return sum + (parseFloat(it.pcb) || ((parseFloat(it.pc) || 0) * (parseFloat(it.fc) || ig.fc))) * ig.custo;
  }, 0);
}

/* ═══ SEED ═══════════════════════════════════════════════════ */
var SETORES = [
  { id: "set1", nome: "Saladas", icon: "🥗", cor: "#2EAD4B", desc: "Saladas cruas e cozidas" },
  { id: "set2", nome: "Sucos", icon: "🧃", cor: "#F97316", desc: "Sucos, vitaminas, coqueteis" },
  { id: "set3", nome: "Cozinha de Producao", icon: "🍳", cor: "#E5484D", desc: "Arroz, feijao, carnes, guisados" },
  { id: "set4", nome: "Confeitaria", icon: "🎉", cor: "#A855F7", desc: "Eventos, lanches, coqueteis" },
  { id: "set5", nome: "Panificacao", icon: "🍞", cor: "#D4A574", desc: "Bolos, paes, croissants, salgados" },
];

var initialCategorias = [
  { id: "cat1", nome: "Prato proteico", cor: "#E5484D", desc: "Carnes, aves, peixes, ovos" },
  { id: "cat2", nome: "Guarnição", cor: "#F5A623", desc: "Acompanhamentos quentes complementares" },
  { id: "cat3", nome: "Acompanhamento", cor: "#8B9DB3", desc: "Arroz, feijão, farofa, cuscuz" },
  { id: "cat4", nome: "Salada", cor: "#2EAD4B", desc: "Saladas cruas e cozidas" },
  { id: "cat5", nome: "Sobremesa", cor: "#E8A832", desc: "Frutas, doces, gelatinas" },
  { id: "cat6", nome: "Suco", cor: "#F97316", desc: "Sucos naturais e polpa" },
  { id: "cat7", nome: "Bebida", cor: "#00BDE4", desc: "Vitaminas, achocolatados, chás" },
  { id: "cat8", nome: "Salgado/Doce", cor: "#A855F7", desc: "Bolos, salgados, biscoitos" },
  { id: "cat9", nome: "Biscoito/Fruta", cor: "#D4A574", desc: "Biscoitos e frutas in natura" },
  { id: "cat10", nome: "Fruta", cor: "#F43F5E", desc: "Frutas fatiadas e porcionadas" },
  { id: "cat11", nome: "Sopa", cor: "#65A30D", desc: "Sopas, caldos e canjas" },
  { id: "cat12", nome: "Prato leve", cor: "#93C5FD", desc: "Preparações leves para jantar/ceia" },
  { id: "cat13", nome: "Pão", cor: "#D4A574", desc: "Pães e similares" },
  { id: "cat14", nome: "Bebida quente", cor: "#86EFAC", desc: "Chás, cafés, leite quente" },
  { id: "cat15", nome: "Arroz", cor: "#E4E9F0", desc: "Arroz branco e variações" },
  { id: "cat16", nome: "Feijão", cor: "#A0522D", desc: "Feijões e leguminosas" },
  { id: "cat17", nome: "Entrada", cor: "#00BDE4", desc: "Entradas para eventos" },
  { id: "cat18", nome: "Prato principal", cor: "#E5484D", desc: "Pratos principais para eventos" },
];

var initialIngredientes = [
  /* Cereais e Massas — FC 1.0 (sem perda no pré-preparo) */
  { id: "i1", nome: "Arroz branco tipo 1", un: "kg", fc: 1.00, custo: 5.80, grupo: "Cereais" },
  { id: "i13", nome: "Macarrão espaguete", un: "kg", fc: 1.00, custo: 6.20, grupo: "Massas" },
  { id: "i25", nome: "Flocão de milho", un: "kg", fc: 1.00, custo: 4.80, grupo: "Cereais" },
  { id: "i26", nome: "Farinha de trigo", un: "kg", fc: 1.00, custo: 5.50, grupo: "Farináceos" },
  /* Leguminosas — FC 1.0 */
  { id: "i2", nome: "Feijão carioca", un: "kg", fc: 1.00, custo: 8.50, grupo: "Leguminosas" },
  { id: "i27", nome: "Feijão preto", un: "kg", fc: 1.00, custo: 9.20, grupo: "Leguminosas" },
  /* Carnes — FC conforme Ornellas/UFPR */
  { id: "i3", nome: "Peito de frango s/osso", un: "kg", fc: 1.00, custo: 18.90, grupo: "Carnes" },
  { id: "i4", nome: "Carne bovina acém", un: "kg", fc: 1.20, custo: 32.00, grupo: "Carnes" },
  { id: "i21", nome: "Carne moída bovina", un: "kg", fc: 1.00, custo: 28.00, grupo: "Carnes" },
  { id: "i28", nome: "Coxa/sobrecoxa frango", un: "kg", fc: 1.10, custo: 14.50, grupo: "Carnes" },
  { id: "i29", nome: "Músculo bovino", un: "kg", fc: 1.30, custo: 34.00, grupo: "Carnes" },
  { id: "i30", nome: "Filé de peixe (tilápia)", un: "kg", fc: 1.00, custo: 29.00, grupo: "Carnes" },
  { id: "i31", nome: "Linguiça calabresa", un: "kg", fc: 1.00, custo: 22.00, grupo: "Carnes" },
  /* Hortaliças — FC conforme Ornellas/UFJF/UFPR */
  { id: "i5", nome: "Alface crespa", un: "kg", fc: 1.60, custo: 8.00, grupo: "Hortaliças" },
  { id: "i6", nome: "Tomate", un: "kg", fc: 1.25, custo: 7.50, grupo: "Hortaliças" },
  { id: "i7", nome: "Cebola", un: "kg", fc: 1.10, custo: 5.20, grupo: "Hortaliças" },
  { id: "i9", nome: "Cenoura", un: "kg", fc: 1.17, custo: 5.50, grupo: "Hortaliças" },
  { id: "i20", nome: "Pimentão verde", un: "kg", fc: 1.22, custo: 9.00, grupo: "Hortaliças" },
  { id: "i32", nome: "Repolho", un: "kg", fc: 1.72, custo: 4.50, grupo: "Hortaliças" },
  { id: "i33", nome: "Beterraba", un: "kg", fc: 1.47, custo: 6.00, grupo: "Hortaliças" },
  { id: "i34", nome: "Couve manteiga", un: "kg", fc: 1.78, custo: 7.00, grupo: "Hortaliças" },
  { id: "i35", nome: "Brócolis", un: "kg", fc: 2.12, custo: 12.00, grupo: "Hortaliças" },
  { id: "i36", nome: "Vagem", un: "kg", fc: 1.30, custo: 10.00, grupo: "Hortaliças" },
  { id: "i37", nome: "Abobrinha", un: "kg", fc: 1.18, custo: 6.50, grupo: "Hortaliças" },
  { id: "i38", nome: "Cheiro-verde", un: "kg", fc: 1.50, custo: 15.00, grupo: "Hortaliças" },
  /* Tubérculos — FC conforme Ornellas */
  { id: "i8", nome: "Batata inglesa", un: "kg", fc: 1.16, custo: 6.30, grupo: "Tubérculos" },
  { id: "i39", nome: "Batata doce", un: "kg", fc: 1.13, custo: 5.80, grupo: "Tubérculos" },
  { id: "i40", nome: "Mandioca/Aipim", un: "kg", fc: 1.25, custo: 5.00, grupo: "Tubérculos" },
  /* Frutas — FC conforme Ornellas */
  { id: "i15", nome: "Banana prata", un: "kg", fc: 1.30, custo: 6.00, grupo: "Frutas" },
  { id: "i16", nome: "Laranja pera", un: "kg", fc: 1.50, custo: 4.50, grupo: "Frutas" },
  { id: "i41", nome: "Melancia", un: "kg", fc: 1.81, custo: 2.50, grupo: "Frutas" },
  { id: "i42", nome: "Mamão formosa", un: "kg", fc: 1.34, custo: 5.00, grupo: "Frutas" },
  { id: "i43", nome: "Maçã nacional", un: "kg", fc: 1.09, custo: 9.50, grupo: "Frutas" },
  { id: "i44", nome: "Manga", un: "kg", fc: 1.95, custo: 5.50, grupo: "Frutas" },
  { id: "i45", nome: "Abacaxi", un: "kg", fc: 1.89, custo: 4.80, grupo: "Frutas" },
  /* Temperos e Óleos — FC 1.0 */
  { id: "i10", nome: "Óleo de soja", un: "L", fc: 1.00, custo: 7.90, grupo: "Óleos" },
  { id: "i11", nome: "Sal refinado", un: "kg", fc: 1.00, custo: 2.50, grupo: "Temperos" },
  { id: "i12", nome: "Alho", un: "kg", fc: 1.08, custo: 35.00, grupo: "Temperos" },
  { id: "i46", nome: "Extrato de tomate", un: "kg", fc: 1.00, custo: 18.00, grupo: "Temperos" },
  { id: "i47", nome: "Louro (folha)", un: "kg", fc: 1.00, custo: 80.00, grupo: "Temperos" },
  { id: "i48", nome: "Colorau/Urucum", un: "kg", fc: 1.00, custo: 16.00, grupo: "Temperos" },
  { id: "i49", nome: "Pimenta de cheiro", un: "kg", fc: 1.22, custo: 25.00, grupo: "Temperos" },
  { id: "i50", nome: "Limão taiti", un: "kg", fc: 1.30, custo: 6.00, grupo: "Frutas" },
  /* Farináceos */
  { id: "i14", nome: "Farinha de mandioca", un: "kg", fc: 1.00, custo: 7.00, grupo: "Farináceos" },
  /* Laticínios e Ovos */
  { id: "i17", nome: "Leite integral", un: "L", fc: 1.00, custo: 5.80, grupo: "Laticínios" },
  { id: "i23", nome: "Creme de leite", un: "L", fc: 1.00, custo: 14.00, grupo: "Laticínios" },
  { id: "i19", nome: "Ovo de galinha", un: "un", fc: 1.00, custo: 0.75, grupo: "Ovos" },
  { id: "i51", nome: "Queijo muçarela", un: "kg", fc: 1.00, custo: 38.00, grupo: "Laticínios" },
  { id: "i52", nome: "Margarina", un: "kg", fc: 1.00, custo: 12.00, grupo: "Laticínios" },
  /* Doces e Conservas */
  { id: "i18", nome: "Açúcar cristal", un: "kg", fc: 1.00, custo: 4.90, grupo: "Doces" },
  { id: "i24", nome: "Gelatina em pó", un: "kg", fc: 1.00, custo: 22.00, grupo: "Doces" },
  { id: "i22", nome: "Milho verde lata", un: "kg", fc: 1.00, custo: 12.00, grupo: "Conservas" },
  { id: "i53", nome: "Achocolatado em pó", un: "kg", fc: 1.00, custo: 16.00, grupo: "Doces" },
];

var initialReceitas = [
  /* ═══ PRATOS PROTEICOS ═══ */
  { id: "r1", nome: "Frango Grelhado ao Alho", catId: "cat1", setor: "set3", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 0.75, obs: "Grelhar em chapa bem quente. Porção: ~90g pronto (120g cru perde 25%)", itens: [
    { iId: "i3", pc: 0.120 }, { iId: "i12", pc: 0.003 }, { iId: "i10", pc: 0.005 }, { iId: "i11", pc: 0.002 }, { iId: "i50", pc: 0.005 }] },
  { id: "r7", nome: "Carne de Panela c/ Legumes", catId: "cat1", setor: "set3", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 0.65, obs: "Cozinhar em panela de pressão 40min + fogo baixo 30min. Porção: ~130g pronto", itens: [
    { iId: "i4", pc: 0.120 }, { iId: "i8", pc: 0.040 }, { iId: "i9", pc: 0.030 }, { iId: "i7", pc: 0.010 }, { iId: "i10", pc: 0.005 }, { iId: "i11", pc: 0.002 }] },
  { id: "r11", nome: "Strogonoff de Frango", catId: "cat1", setor: "set3", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 0.70, obs: "Finalizar com creme de leite fora do fogo. Porção: ~120g pronto", itens: [
    { iId: "i3", pc: 0.120 }, { iId: "i7", pc: 0.010 }, { iId: "i23", pc: 0.015 }, { iId: "i17", pc: 0.020 }, { iId: "i46", pc: 0.005 }, { iId: "i11", pc: 0.002 }] },
  { id: "r15", nome: "Escondidinho de Charque", catId: "cat1", setor: "set3", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 0.80, obs: "Gratinar no forno a 200°C por 20min. Porção: ~180g (carne + purê)", itens: [
    { iId: "i4", pc: 0.100 }, { iId: "i8", pc: 0.080 }, { iId: "i17", pc: 0.020 }, { iId: "i7", pc: 0.008 }, { iId: "i11", pc: 0.002 }] },
  { id: "r54", nome: "Carne Moída Refogada", catId: "cat1", setor: "set3", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 0.75, obs: "Refogar bem para dourar. Porção: ~100g pronto", itens: [
    { iId: "i21", pc: 0.120 }, { iId: "i7", pc: 0.010 }, { iId: "i6", pc: 0.020 }, { iId: "i10", pc: 0.005 }, { iId: "i11", pc: 0.002 }, { iId: "i48", pc: 0.001 }] },
  { id: "r55", nome: "Peixe Grelhado c/ Ervas", catId: "cat1", setor: "set3", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 0.80, obs: "Grelhar com pouco óleo, finalizar com limão", itens: [
    { iId: "i30", pc: 0.120 }, { iId: "i50", pc: 0.005 }, { iId: "i10", pc: 0.005 }, { iId: "i11", pc: 0.002 }, { iId: "i12", pc: 0.002 }] },
  { id: "r56", nome: "Frango ao Creme c/ Milho", catId: "cat1", setor: "set3", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 0.70, obs: "Preparação macia, ideal para público escolar", itens: [
    { iId: "i3", pc: 0.120 }, { iId: "i23", pc: 0.020 }, { iId: "i22", pc: 0.015 }, { iId: "i7", pc: 0.008 }, { iId: "i11", pc: 0.002 }] },
  { id: "r57", nome: "Isca de Carne Acebolada", catId: "cat1", setor: "set3", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 0.70, obs: "Cortar em tiras finas, grelhar em alta temperatura", itens: [
    { iId: "i29", pc: 0.120 }, { iId: "i7", pc: 0.020 }, { iId: "i20", pc: 0.015 }, { iId: "i10", pc: 0.005 }, { iId: "i11", pc: 0.002 }] },
  /* ═══ GUARNIÇÕES ═══ */
  { id: "r5", nome: "Purê de Batata", catId: "cat2", setor: "set3", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 0.90, obs: "Amassar ainda quente, adicionar leite morno. Porção: ~100g", itens: [
    { iId: "i8", pc: 0.100 }, { iId: "i17", pc: 0.030 }, { iId: "i11", pc: 0.002 }, { iId: "i52", pc: 0.005 }] },
  { id: "r8", nome: "Macarrão ao Molho", catId: "cat2", setor: "set3", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 2.00, obs: "Cozinhar al dente 8-10min, molho à parte. Porção: ~150g pronto", itens: [
    { iId: "i13", pc: 0.080 }, { iId: "i6", pc: 0.040 }, { iId: "i7", pc: 0.010 }, { iId: "i10", pc: 0.005 }, { iId: "i11", pc: 0.002 }] },
  { id: "r12", nome: "Legumes Salteados", catId: "cat2", setor: "set3", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 0.85, obs: "Cortar em cubos uniformes, saltear em fogo alto", itens: [
    { iId: "i9", pc: 0.050 }, { iId: "i20", pc: 0.030 }, { iId: "i37", pc: 0.030 }, { iId: "i7", pc: 0.010 }, { iId: "i10", pc: 0.005 }, { iId: "i11", pc: 0.001 }] },
  { id: "r21", nome: "Batata Doce Assada", catId: "cat2", setor: "set3", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 0.85, obs: "Assar a 200°C por 40min. Porção: ~100g", itens: [
    { iId: "i39", pc: 0.120 }, { iId: "i10", pc: 0.003 }, { iId: "i11", pc: 0.001 }] },
  { id: "r58", nome: "Mandioca Cozida", catId: "cat2", setor: "set3", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 0.90, obs: "Cozinhar em pressão 20min. Porção: ~100g", itens: [
    { iId: "i40", pc: 0.100 }, { iId: "i11", pc: 0.001 }] },
  { id: "r59", nome: "Brócolis no Vapor", catId: "cat2", setor: "set3", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 0.90, obs: "Vapor por 5-7min, manter al dente", itens: [
    { iId: "i35", pc: 0.060 }, { iId: "i10", pc: 0.003 }, { iId: "i11", pc: 0.001 }] },
  /* ═══ ACOMPANHAMENTOS ═══ */
  { id: "r2", nome: "Arroz Branco", catId: "cat15", setor: "set3", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 2.50, obs: "Proporção 1:2 (arroz:água). Lavar 3x. Porção: ~200g pronto (80g cru)", itens: [
    { iId: "i1", pc: 0.080 }, { iId: "i10", pc: 0.003 }, { iId: "i12", pc: 0.001 }, { iId: "i11", pc: 0.002 }] },
  { id: "r3", nome: "Feijão Carioca Temperado", catId: "cat16", setor: "set3", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 2.20, obs: "Pressão 30min. Temperar com louro e cominho. Porção: ~130g pronto (60g cru)", itens: [
    { iId: "i2", pc: 0.060 }, { iId: "i7", pc: 0.008 }, { iId: "i12", pc: 0.002 }, { iId: "i11", pc: 0.002 }, { iId: "i47", pc: 0.0002 }] },
  { id: "r10", nome: "Farofa Temperada", catId: "cat3", setor: "set3", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 1.00, obs: "Refogar cebola antes, adicionar farinha no final. Porção: ~30g", itens: [
    { iId: "i14", pc: 0.030 }, { iId: "i7", pc: 0.008 }, { iId: "i10", pc: 0.005 }, { iId: "i11", pc: 0.001 }] },
  { id: "r16", nome: "Cuscuz Nordestino", catId: "cat3", setor: "set3", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 1.80, obs: "Hidratar flocão, cozinhar na cuscuzeira 15min. Porção: ~100g pronto (60g cru)", itens: [
    { iId: "i25", pc: 0.060 }, { iId: "i10", pc: 0.005 }, { iId: "i11", pc: 0.001 }] },
  /* ═══ SALADAS ═══ */
  { id: "r4", nome: "Salada Alface c/ Tomate", catId: "cat4", setor: "set1", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 1.00, obs: "Lavar em solução clorada 15min, enxaguar. Porção: ~60g", itens: [
    { iId: "i5", pc: 0.030 }, { iId: "i6", pc: 0.030 }] },
  { id: "r13", nome: "Salada Tropical", catId: "cat4", setor: "set1", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 1.00, obs: "Servir gelada. Porção: ~60g", itens: [
    { iId: "i5", pc: 0.020 }, { iId: "i9", pc: 0.015 }, { iId: "i6", pc: 0.015 }, { iId: "i33", pc: 0.010 }] },
  { id: "r60", nome: "Salada de Repolho c/ Cenoura", catId: "cat4", setor: "set1", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 1.00, obs: "Cortar fino, temperar com limão. Porção: ~50g", itens: [
    { iId: "i32", pc: 0.030 }, { iId: "i9", pc: 0.020 }, { iId: "i50", pc: 0.003 }] },
  /* ═══ SOBREMESAS ═══ */
  { id: "r6", nome: "Banana Prata", catId: "cat5", setor: "set3", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 1.00, obs: "Selecionar maduras firmes. ~1 un/pessoa (~80g líq.)", itens: [
    { iId: "i15", pc: 0.080 }] },
  { id: "r14", nome: "Gelatina", catId: "cat5", setor: "set3", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 1.00, obs: "120ml por comensal. Preparar com 1 dia de antecedência", itens: [
    { iId: "i24", pc: 0.015 }, { iId: "i18", pc: 0.010 }] },
  { id: "r20", nome: "Melancia Fatiada", catId: "cat10", setor: "set1", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 1.00, obs: "~200g bruto por comensal (FC 1.81 — casca e sementes). Porção: ~110g líq.", itens: [
    { iId: "i41", pc: 0.110 }] },
  { id: "r61", nome: "Mamão Formosa", catId: "cat10", setor: "set1", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 1.00, obs: "~100g líq. por comensal", itens: [
    { iId: "i42", pc: 0.100 }] },
  { id: "r62", nome: "Salada de Frutas", catId: "cat5", setor: "set3", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 1.00, obs: "Porção: ~120g. Cortar em cubos uniformes", itens: [
    { iId: "i15", pc: 0.030 }, { iId: "i42", pc: 0.030 }, { iId: "i43", pc: 0.030 }, { iId: "i16", pc: 0.030 }] },
  /* ═══ SUCOS E BEBIDAS ═══ */
  { id: "r9", nome: "Suco de Laranja Natural", catId: "cat6", setor: "set2", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 1.00, obs: "250ml por comensal. Espremer na hora ou usar polpa", itens: [
    { iId: "i16", pc: 0.150 }, { iId: "i18", pc: 0.020 }] },
  { id: "r17", nome: "Vitamina de Banana", catId: "cat7", setor: "set2", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 1.00, obs: "300ml por comensal. Bater no liquidificador com gelo", itens: [
    { iId: "i15", pc: 0.080 }, { iId: "i17", pc: 0.150 }, { iId: "i18", pc: 0.015 }] },
  { id: "r63", nome: "Achocolatado", catId: "cat7", setor: "set2", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 1.00, obs: "200ml por comensal", itens: [
    { iId: "i17", pc: 0.180 }, { iId: "i53", pc: 0.020 }] },
  /* ═══ SOPAS ═══ */
  { id: "r19", nome: "Canja de Galinha", catId: "cat11", setor: "set3", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 3.00, obs: "Servir quente ~300ml. Desosssar frango após cozimento", itens: [
    { iId: "i3", pc: 0.060 }, { iId: "i1", pc: 0.030 }, { iId: "i9", pc: 0.020 }, { iId: "i7", pc: 0.008 }, { iId: "i11", pc: 0.002 }, { iId: "i38", pc: 0.002 }] },
  { id: "r64", nome: "Sopa de Legumes c/ Macarrão", catId: "cat11", setor: "set3", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 2.50, obs: "300ml por comensal. Legumes em cubos pequenos", itens: [
    { iId: "i8", pc: 0.040 }, { iId: "i9", pc: 0.030 }, { iId: "i37", pc: 0.020 }, { iId: "i13", pc: 0.020 }, { iId: "i7", pc: 0.008 }, { iId: "i11", pc: 0.002 }] },
  /* ═══ LANCHES / SALGADOS ═══ */
  { id: "r18", nome: "Bolo de Cenoura", catId: "cat8", setor: "set5", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 0.90, obs: "Com cobertura de chocolate. Porção: ~80g", itens: [
    { iId: "i9", pc: 0.050 }, { iId: "i18", pc: 0.040 }, { iId: "i19", pc: 0.030 }, { iId: "i10", pc: 0.010 }, { iId: "i26", pc: 0.040 }] },
  { id: "r65", nome: "Bolo de Fubá", catId: "cat8", setor: "set5", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 0.90, obs: "Porção: ~80g. Tradicional nordestino", itens: [
    { iId: "i25", pc: 0.050 }, { iId: "i18", pc: 0.035 }, { iId: "i19", pc: 0.025 }, { iId: "i17", pc: 0.040 }, { iId: "i10", pc: 0.008 }] },
  /* ═══ PRATOS LEVES (Jantar/Ceia) ═══ */
  { id: "r66", nome: "Frango Desfiado ao Creme", catId: "cat12", setor: "set3", criadoEm: "2025-12-01T10:00:00Z", criadoPor: "usr2", atualizadoEm: "2025-12-01T10:00:00Z", atualizadoPor: "usr2", porcoes: 50, fcCoccao: 0.65, obs: "Cozinhar, desfiar, finalizar com creme. Porção: ~100g", itens: [
    { iId: "i3", pc: 0.100 }, { iId: "i23", pc: 0.020 }, { iId: "i17", pc: 0.030 }, { iId: "i7", pc: 0.008 }, { iId: "i11", pc: 0.002 }] },
];

/* seed audit log */
var initialAuditLog = [
  { id: "log1", recId: "r1", tipo: "criacao", user: "usr2", data: "2025-12-01T10:00:00Z", detalhe: "Ficha técnica criada" },
  { id: "log2", recId: "r1", tipo: "per_capita", user: "usr2", data: "2025-12-15T14:30:00Z", detalhe: "Peito de frango: PC 100g → 120g" },
  { id: "log3", recId: "r11", tipo: "fc_coccao", user: "usr3", data: "2026-01-10T09:15:00Z", detalhe: "Fc Cocção: 0.65 → 0.70 (teste em produção)" },
  { id: "log4", recId: "r2", tipo: "criacao", user: "usr2", data: "2025-12-01T10:05:00Z", detalhe: "Ficha técnica criada" },
  { id: "log5", recId: "r7", tipo: "per_capita", user: "usr1", data: "2026-02-20T11:00:00Z", detalhe: "Carne bovina acém: PC 100g → 120g (ajuste contratual)" },
];

/* ═══ APP ════════════════════════════════════════════════════ */
export default function PreparacoesRendora() {
  var _cats = useState(initialCategorias); var categorias = _cats[0]; var setCategorias = _cats[1];
  var _ings = useState(initialIngredientes); var ingredientes = _ings[0]; var setIngredientes = _ings[1];
  var _recs = useState(initialReceitas); var receitas = _recs[0]; var setReceitas = _recs[1];
  var _logs = useState(initialAuditLog); var auditLog = _logs[0]; var setAuditLog = _logs[1];
  var _user = useState("usr1"); var currentUser = _user[0]; var setCurrentUser = _user[1];

  var _fCat = useState(""); var fCat = _fCat[0]; var setFCat = _fCat[1];
  var _fSetor = useState(""); var fSetor = _fSetor[0]; var setFSetor = _fSetor[1];
  var _q = useState(""); var searchQ = _q[0]; var setSearchQ = _q[1];
  var _selRec = useState(null); var selRecId = _selRec[0]; var setSelRecId = _selRec[1];
  var _vPor = useState(50); var viewPorcoes = _vPor[0]; var setViewPorcoes = _vPor[1];

  /* Modais */
  var _catM = useState(false); var catModal = _catM[0]; var setCatModal = _catM[1];
  var _catF = useState(null); var catForm = _catF[0]; var setCatForm = _catF[1];
  var _recM = useState(false); var recModal = _recM[0]; var setRecModal = _recM[1];
  var _recF = useState(null); var recForm = _recF[0]; var setRecForm = _recF[1];
  var _ingM = useState(false); var ingModal = _ingM[0]; var setIngModal = _ingM[1];
  var _kpiM = useState(null); var kpiModal = _kpiM[0]; var setKpiModal = _kpiM[1];
  var _ingF = useState(null); var ingForm = _ingF[0]; var setIngForm = _ingF[1];

  /* Filtros */
  var receitasFiltradas = useMemo(function () {
    var r = receitas.slice();
    if (fCat) r = r.filter(function (rec) { return rec.catId === fCat; });
    if (fSetor) r = r.filter(function (rec) { return rec.setor === fSetor; });
    if (searchQ) {
      var q = searchQ.toLowerCase();
      r = r.filter(function (rec) { return rec.nome.toLowerCase().indexOf(q) >= 0; });
    }
    return r;
  }, [receitas, fCat, fSetor, searchQ]);

  var selRec = selRecId ? receitas.find(function (r) { return r.id === selRecId; }) : null;
  var selCat = selRec ? categorias.find(function (c) { return c.id === selRec.catId; }) : null;

  function selectRec(id) {
    setSelRecId(id);
    var rec = receitas.find(function (r) { return r.id === id; });
    setViewPorcoes(rec ? rec.porcoes || 50 : 50);
  }

  /* KPIs */
  var recsPorCat = useMemo(function () {
    var map = {};
    categorias.forEach(function (c) { map[c.id] = 0; });
    receitas.forEach(function (r) { if (map[r.catId] !== undefined) map[r.catId]++; });
    return map;
  }, [receitas, categorias]);

  /* Receita mais cara e mais barata */
  var receitaMaisCara = useMemo(function () {
    if (receitas.length === 0) return null;
    var best = null; var bestCusto = -1;
    receitas.forEach(function (r) {
      var c = calcCusto(r, ingredientes);
      if (c > bestCusto) { bestCusto = c; best = r; }
    });
    return best ? { nome: best.nome, custo: bestCusto } : null;
  }, [receitas, ingredientes]);

  var receitaMaisBarata = useMemo(function () {
    if (receitas.length === 0) return null;
    var best = null; var bestCusto = 999999;
    receitas.forEach(function (r) {
      var c = calcCusto(r, ingredientes);
      if (r.itens.length > 0 && c < bestCusto) { bestCusto = c; best = r; }
    });
    return best ? { nome: best.nome, custo: bestCusto } : null;
  }, [receitas, ingredientes]);

  /* Fichas sem ingrediente */
  var fichasIncompletas = useMemo(function () {
    return receitas.filter(function (r) { return r.itens.length === 0; });
  }, [receitas]);

  /* Ingredientes mais usados (top 5) */
  var topIngredientes = useMemo(function () {
    var contagem = {};
    receitas.forEach(function (r) {
      r.itens.forEach(function (it) {
        if (!contagem[it.iId]) contagem[it.iId] = 0;
        contagem[it.iId]++;
      });
    });
    var lista = Object.keys(contagem).map(function (iId) {
      var ig = ingredientes.find(function (x) { return x.id === iId; });
      return { id: iId, nome: ig ? ig.nome : iId, count: contagem[iId] };
    });
    lista.sort(function (a, b) { return b.count - a.count; });
    return lista.slice(0, 5);
  }, [receitas, ingredientes]);

  /* Ficha mais antiga sem revisão */
  var fichaAntiga = useMemo(function () {
    if (receitas.length === 0) return null;
    var mais = null; var maisData = null;
    receitas.forEach(function (r) {
      var dt = r.atualizadoEm || r.criadoEm;
      if (!maisData || (dt && dt < maisData)) { maisData = dt; mais = r; }
    });
    if (!mais || !maisData) return null;
    var dias = Math.ceil((new Date() - new Date(maisData)) / 86400000);
    return { nome: mais.nome, dias: dias, data: maisData };
  }, [receitas]);

  /* ── CRUD Categorias ── */
  function openNewCat() {
    setCatForm({ id: "", nome: "", cor: "#00BDE4", desc: "" });
    setCatModal(true);
  }
  function openEditCat(cat) {
    setCatForm(Object.assign({}, cat));
    setCatModal(true);
  }
  function saveCat() {
    if (!catForm.nome) return alert("Nome obrigatório.");
    if (catForm.id) {
      setCategorias(categorias.map(function (c) { return c.id === catForm.id ? Object.assign({}, catForm) : c; }));
    } else {
      setCategorias(categorias.concat(Object.assign({}, catForm, { id: "cat" + uid() })));
    }
    setCatModal(false);
  }
  function deleteCat(id) {
    var count = receitas.filter(function (r) { return r.catId === id; }).length;
    if (count > 0) return alert("Não é possível excluir: " + count + " receita(s) vinculada(s) a esta categoria.");
    if (!confirm("Excluir categoria?")) return;
    setCategorias(categorias.filter(function (c) { return c.id !== id; }));
  }

  /* ── CRUD Receitas ── */
  function openNewRec() {
    setRecForm({ id: "", nome: "", catId: fCat || (categorias.length > 0 ? categorias[0].id : ""), setor: "", porcoes: "50", fcCoccao: "1.0", obs: "", itens: [] });
    setRecModal(true);
  }
  function openEditRec(rec) {
    setRecForm(Object.assign({}, rec, { porcoes: String(rec.porcoes || 50), fcCoccao: String(rec.fcCoccao), itens: rec.itens.map(function (it) {
      var ig = ingredientes.find(function (x) { return x.id === it.iId; });
      var itemFc = parseFloat(it.fc) || (ig ? ig.fc : 1);
      var pcl = parseFloat(it.pcl || it.pc) || 0;
      var pcb = parseFloat(it.pcb) || (pcl * itemFc);
      return Object.assign({}, it, { pcl: String(pcl), pcb: String(pcb > 0 ? pcb.toFixed(4) : ""), fc: String(itemFc) });
    }) }));
    setRecModal(true);
  }
  function saveRec() {
    if (!recForm.nome || !recForm.catId || !recForm.setor) return alert("Nome, categoria e setor obrigatorios.");
    var agora = nowISO();
    var newItens = recForm.itens.map(function (it) {
      var pcl = parseFloat(it.pcl) || 0;
      var pcb = parseFloat(it.pcb) || 0;
      var fc = parseFloat(it.fc) || 1;
      return { iId: it.iId, pc: pcl, pcl: pcl, pcb: pcb, fc: fc };
    });
    var obj = Object.assign({}, recForm, {
      porcoes: parseInt(recForm.porcoes) || 50,
      fcCoccao: parseFloat(recForm.fcCoccao) || 1.0,
      itens: newItens,
      atualizadoEm: agora,
      atualizadoPor: currentUser,
    });

    if (recForm.id) {
      /* ── Detectar mudanças e gerar logs ── */
      var oldRec = receitas.find(function (r) { return r.id === recForm.id; });
      var newLogs = [];
      if (oldRec) {
        /* Fc Cocção */
        if (oldRec.fcCoccao !== obj.fcCoccao) {
          newLogs.push({ id: "log" + uid(), recId: recForm.id, tipo: "fc_coccao", user: currentUser, data: agora, detalhe: "Fc Cocção: " + oldRec.fcCoccao + " → " + obj.fcCoccao });
        }
        /* Per Capita de cada ingrediente */
        oldRec.itens.forEach(function (oldIt) {
          var newIt = newItens.find(function (n) { return n.iId === oldIt.iId; });
          if (newIt && newIt.pc !== oldIt.pc) {
            var ig = ingredientes.find(function (x) { return x.id === oldIt.iId; });
            var nome = ig ? ig.nome : oldIt.iId;
            newLogs.push({ id: "log" + uid(), recId: recForm.id, tipo: "per_capita", user: currentUser, data: agora, detalhe: nome + ": PC " + fmtG(oldIt.pc) + " → " + fmtG(newIt.pc) });
          }
        });
        /* Ingredientes adicionados */
        newItens.forEach(function (newIt) {
          if (!newIt.iId) return;
          var existed = oldRec.itens.find(function (o) { return o.iId === newIt.iId; });
          if (!existed) {
            var ig = ingredientes.find(function (x) { return x.id === newIt.iId; });
            newLogs.push({ id: "log" + uid(), recId: recForm.id, tipo: "ingrediente_add", user: currentUser, data: agora, detalhe: "Ingrediente adicionado: " + (ig ? ig.nome : newIt.iId) + " (PC " + fmtG(newIt.pc) + ")" });
          }
        });
        /* Ingredientes removidos */
        oldRec.itens.forEach(function (oldIt) {
          var still = newItens.find(function (n) { return n.iId === oldIt.iId; });
          if (!still) {
            var ig = ingredientes.find(function (x) { return x.id === oldIt.iId; });
            newLogs.push({ id: "log" + uid(), recId: recForm.id, tipo: "ingrediente_rem", user: currentUser, data: agora, detalhe: "Ingrediente removido: " + (ig ? ig.nome : oldIt.iId) });
          }
        });
        /* Nome ou categoria */
        if (oldRec.nome !== obj.nome) {
          newLogs.push({ id: "log" + uid(), recId: recForm.id, tipo: "nome", user: currentUser, data: agora, detalhe: "Nome: \"" + oldRec.nome + "\" → \"" + obj.nome + "\"" });
        }
        if (oldRec.catId !== obj.catId) {
          var catOld = categorias.find(function (c) { return c.id === oldRec.catId; });
          var catNew = categorias.find(function (c) { return c.id === obj.catId; });
          newLogs.push({ id: "log" + uid(), recId: recForm.id, tipo: "categoria", user: currentUser, data: agora, detalhe: "Categoria: " + (catOld ? catOld.nome : "—") + " → " + (catNew ? catNew.nome : "—") });
        }
      }
      if (newLogs.length > 0) { setAuditLog(auditLog.concat(newLogs)); }
      setReceitas(receitas.map(function (r) { return r.id === recForm.id ? obj : r; }));
    } else {
      /* Nova receita */
      var novoId = "r" + uid();
      var novaRec = Object.assign({}, obj, { id: novoId, criadoEm: agora, criadoPor: currentUser });
      setReceitas(receitas.concat(novaRec));
      setAuditLog(auditLog.concat({ id: "log" + uid(), recId: novoId, tipo: "criacao", user: currentUser, data: agora, detalhe: "Ficha técnica criada: " + obj.nome }));
      selectRec(novoId);
    }
    setRecModal(false);
  }
  function deleteRec(id) {
    if (!confirm("Excluir esta receita?")) return;
    setReceitas(receitas.filter(function (r) { return r.id !== id; }));
    if (selRecId === id) selectRec(null);
  }
  function addItemToRec() {
    if (!recForm) return;
    setRecForm(Object.assign({}, recForm, { itens: recForm.itens.concat({ iId: "", pcb: "", pcl: "", fc: "" }) }));
  }
  function removeItemFromRec(idx) {
    var newItens = recForm.itens.filter(function (_, i) { return i !== idx; });
    setRecForm(Object.assign({}, recForm, { itens: newItens }));
  }
  function updateRecItem(idx, field, value) {
    var newItens = recForm.itens.map(function (it, i) {
      if (i !== idx) return it;
      var updated = Object.assign({}, it);
      updated[field] = value;
      return updated;
    });
    setRecForm(Object.assign({}, recForm, { itens: newItens }));
  }
  function updateRecItemMulti(idx, fields) {
    var newItens = recForm.itens.map(function (it, i) {
      if (i !== idx) return it;
      return Object.assign({}, it, fields);
    });
    setRecForm(Object.assign({}, recForm, { itens: newItens }));
  }

  /* ── CRUD Ingredientes ── */
  function openNewIng() {
    setIngForm({ id: "", nome: "", un: "kg", fc: "1.0", custo: "", grupo: "Cereais" });
    setIngModal(true);
  }
  function openEditIng(ig) {
    setIngForm(Object.assign({}, ig, { fc: String(ig.fc), custo: String(ig.custo) }));
    setIngModal(true);
  }
  function saveIng() {
    if (!ingForm.nome || !ingForm.custo) return alert("Nome e custo obrigatórios.");
    var obj = Object.assign({}, ingForm, { fc: parseFloat(ingForm.fc) || 1.0, custo: parseFloat(ingForm.custo) || 0 });
    if (ingForm.id) {
      var oldIng = ingredientes.find(function (i) { return i.id === ingForm.id; });
      if (oldIng && oldIng.fc !== obj.fc) {
        /* Log FC change em todas as receitas que usam esse ingrediente */
        var agora = nowISO();
        var newLogs = [];
        receitas.forEach(function (rec) {
          var usaIng = rec.itens.some(function (it) { return it.iId === ingForm.id; });
          if (usaIng) {
            newLogs.push({ id: "log" + uid(), recId: rec.id, tipo: "fc_correcao", user: currentUser, data: agora, detalhe: obj.nome + ": FC " + oldIng.fc.toFixed(2) + " → " + obj.fc.toFixed(2) });
          }
        });
        if (newLogs.length > 0) setAuditLog(auditLog.concat(newLogs));
      }
      setIngredientes(ingredientes.map(function (i) { return i.id === ingForm.id ? obj : i; }));
    } else {
      setIngredientes(ingredientes.concat(Object.assign({}, obj, { id: "i" + uid() })));
    }
    setIngModal(false);
  }

  return (
    <div style={{ background: C.navy, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{"::selection{background:" + C.accent + "33} ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:" + C.navy + "} ::-webkit-scrollbar-thumb{background:" + C.border + ";border-radius:3px} input:focus,select:focus,textarea:focus{border-color:" + C.accent + "!important;box-shadow:0 0 0 3px " + C.accent + "18} button:hover{opacity:0.9}"}</style>

      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "24px 28px" }}>

        {/* ═══ HEADER ═══ */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <RendoraLogo size={38} />
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: C.white }}>Preparações</h1>
              <p style={{ color: C.textMuted, fontSize: 13, margin: "3px 0 0" }}>Fichas técnicas, categorias, ingredientes e custos</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: C.surface, borderRadius: 8, padding: "4px 10px", border: "1px solid " + C.border }}>
              <span style={{ fontSize: 10, color: C.textDim }}>👤</span>
              <select style={Object.assign({}, sSelect, { border: "none", background: "transparent", padding: "4px 6px", fontSize: 12 })} value={currentUser} onChange={function (e) { setCurrentUser(e.target.value); }}>
                {USUARIOS.map(function (u) { return <option key={u.id} value={u.id}>{u.nome}</option>; })}
              </select>
            </div>
            <button style={Object.assign({}, sBtnOutline, sBtnSm)} onClick={openNewIng}>+ Ingrediente</button>
            <button style={Object.assign({}, sBtnOutline, sBtnSm)} onClick={openNewCat}>+ Categoria</button>
            <button style={sBtn} onClick={openNewRec}>+ Nova Receita</button>
          </div>
        </div>

        {/* ═══ KPIs — LINHA 1: VISÃO GERAL (CLICÁVEIS) ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 10 }}>
          {[
            { l: "RECEITAS", v: receitas.length, sub: "fichas técnicas", c: C.accent, icon: "📋", action: function () {
              var sorted = receitas.slice().sort(function (a, b) { return calcCusto(b, ingredientes) - calcCusto(a, ingredientes); });
              setKpiModal({ title: "📋 Todas as Receitas (" + receitas.length + ")", sub: "Ordenadas por custo (maior → menor)", content: (
                <div style={{ maxHeight: 400, overflowY: "auto" }}>
                  {sorted.map(function (r) { var cat = categorias.find(function (c) { return c.id === r.catId; }); var custo = calcCusto(r, ingredientes); return (
                    <div key={r.id} onClick={function () { setKpiModal(null); selectRec(r.id); }} style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", marginBottom: 4, background: C.surface, borderRadius: 8, cursor: "pointer", alignItems: "center" }}>
                      <div><div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{r.nome}</div><div style={{ fontSize: 10, color: C.textDim }}>{cat ? cat.nome : "—"} · {r.itens.length} ing.</div></div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: C.green }}>{fmtBRL(custo)}</div>
                    </div>
                  ); })}
                </div>
              ) });
            } },
            { l: "CATEGORIAS", v: categorias.length, sub: "tipos", c: C.green, icon: "🏷", action: function () {
              setKpiModal({ title: "🏷 Categorias (" + categorias.length + ")", sub: "Receitas por categoria", content: (
                <div style={{ maxHeight: 400, overflowY: "auto" }}>
                  {categorias.map(function (cat) { var count = recsPorCat[cat.id] || 0; return (
                    <div key={cat.id} onClick={function () { setKpiModal(null); setFCat(cat.id); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 4, background: C.surface, borderRadius: 8, cursor: "pointer" }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: cat.cor }} />
                      <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{cat.nome}</div><div style={{ fontSize: 10, color: C.textDim }}>{cat.desc}</div></div>
                      <span style={{ fontSize: 16, fontWeight: 800, color: cat.cor }}>{count}</span>
                    </div>
                  ); })}
                </div>
              ) });
            } },
            { l: "INGREDIENTES", v: ingredientes.length, sub: "cadastrados", c: C.gold, icon: "🧂", action: function () {
              var grouped = {}; ingredientes.forEach(function (ig) { if (!grouped[ig.grupo]) grouped[ig.grupo] = []; grouped[ig.grupo].push(ig); });
              setKpiModal({ title: "🧂 Ingredientes (" + ingredientes.length + ")", sub: "Agrupados por tipo", content: (
                <div style={{ maxHeight: 400, overflowY: "auto" }}>
                  {Object.keys(grouped).sort().map(function (g) { return (
                    <div key={g} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 4 }}>{g} ({grouped[g].length})</div>
                      {grouped[g].map(function (ig) { return (
                        <div key={ig.id} onClick={function () { setKpiModal(null); openEditIng(ig); }} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", marginBottom: 2, background: C.surface, borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
                          <span style={{ fontWeight: 500 }}>{ig.nome} <span style={{ color: C.textDim }}>({ig.un})</span></span>
                          <span style={{ color: C.textMuted }}>FC {ig.fc.toFixed(2)} · {fmtBRL(ig.custo)}/{ig.un}</span>
                        </div>
                      ); })}
                    </div>
                  ); })}
                </div>
              ) });
            } },
            { l: "MAIS CARA", v: receitaMaisCara ? fmtBRL(receitaMaisCara.custo) : "—", sub: receitaMaisCara ? receitaMaisCara.nome : "", c: C.danger, icon: "📈", action: function () {
              if (receitaMaisCara) { var r = receitas.find(function (x) { return x.nome === receitaMaisCara.nome; }); if (r) selectRec(r.id); }
            } },
            { l: "MAIS BARATA", v: receitaMaisBarata ? fmtBRL(receitaMaisBarata.custo) : "—", sub: receitaMaisBarata ? receitaMaisBarata.nome : "", c: C.green, icon: "📉", action: function () {
              if (receitaMaisBarata) { var r = receitas.find(function (x) { return x.nome === receitaMaisBarata.nome; }); if (r) selectRec(r.id); }
            } },
            { l: "INCOMPLETAS", v: fichasIncompletas.length, sub: fichasIncompletas.length > 0 ? "sem ingrediente" : "tudo ok", c: fichasIncompletas.length > 0 ? C.danger : C.green, icon: fichasIncompletas.length > 0 ? "⚠️" : "✅", action: function () {
              if (fichasIncompletas.length === 0) return;
              setKpiModal({ title: "⚠️ Fichas Incompletas (" + fichasIncompletas.length + ")", sub: "Receitas sem ingrediente cadastrado", content: (
                <div>{fichasIncompletas.map(function (r) { var cat = categorias.find(function (c) { return c.id === r.catId; }); return (
                  <div key={r.id} onClick={function () { setKpiModal(null); openEditRec(r); }} style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", marginBottom: 4, background: C.surface, borderRadius: 8, cursor: "pointer", alignItems: "center" }}>
                    <div><div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{r.nome}</div><div style={{ fontSize: 10, color: C.textDim }}>{cat ? cat.nome : "—"}</div></div>
                    <span style={{ fontSize: 11, color: C.danger, fontWeight: 700 }}>Editar →</span>
                  </div>
                ); })}</div>
              ) });
            } },
          ].map(function (k) {
            return (
              <div key={k.l} onClick={k.action} style={{ background: C.navyLight, borderRadius: 12, border: "1px solid " + C.border, padding: "12px 12px 10px", cursor: "pointer", transition: "all 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>{k.icon}</span>
                  <span style={{ fontSize: 9, color: C.textDim, fontWeight: 700, letterSpacing: "0.5px" }}>{k.l}</span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: k.c, lineHeight: 1 }}>{k.v}</div>
                <div style={{ fontSize: 9, color: C.textDim, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{k.sub}</div>
              </div>
            );
          })}
        </div>

        {/* ═══ KPIs — LINHA 2: OPERACIONAL ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {/* Top 5 Ingredientes */}
          <div style={{ background: C.navyLight, borderRadius: 12, border: "1px solid " + C.border, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, color: C.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>🧂 Top 5 Ingredientes Mais Usados</div>
            {topIngredientes.map(function (ti, idx) {
              var maxCount = topIngredientes.length > 0 ? topIngredientes[0].count : 1;
              var pct = (ti.count / maxCount) * 100;
              return (
                <div key={ti.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: C.textDim, width: 14, textAlign: "right", fontWeight: 700 }}>{idx + 1}.</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ti.nome}</span>
                      <span style={{ fontSize: 10, color: C.accent, fontWeight: 700, flexShrink: 0, marginLeft: 6 }}>{ti.count} fichas</span>
                    </div>
                    <div style={{ height: 4, background: C.surface, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: pct + "%", background: C.accent, borderRadius: 3 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Receitas por Categoria */}
          <div style={{ background: C.navyLight, borderRadius: 12, border: "1px solid " + C.border, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, color: C.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>🏷 Receitas por Categoria</div>
            <div style={{ maxHeight: 120, overflowY: "auto" }}>
              {categorias.filter(function (c) { return recsPorCat[c.id] > 0; }).sort(function (a, b) { return (recsPorCat[b.id] || 0) - (recsPorCat[a.id] || 0); }).map(function (cat) {
                var count = recsPorCat[cat.id] || 0;
                var maxCat = Math.max.apply(null, categorias.map(function (c) { return recsPorCat[c.id] || 0; }));
                var pct = maxCat > 0 ? (count / maxCat) * 100 : 0;
                return (
                  <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: cat.cor, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ fontSize: 11, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cat.nome}</span>
                        <span style={{ fontSize: 10, color: cat.cor, fontWeight: 700, flexShrink: 0, marginLeft: 6 }}>{count}</span>
                      </div>
                      <div style={{ height: 4, background: C.surface, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: pct + "%", background: cat.cor, borderRadius: 3 }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Última Atualização */}
          <div style={{ background: C.navyLight, borderRadius: 12, border: "1px solid " + C.border, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, color: C.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>📅 Revisão de Fichas</div>
            {fichaAntiga ? (
              <div>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>Ficha mais antiga sem revisão:</div>
                <div onClick={function () { var r = receitas.find(function (x) { return x.nome === fichaAntiga.nome; }); if (r) selectRec(r.id); }} style={{ background: (fichaAntiga.dias > 90 ? C.danger : fichaAntiga.dias > 30 ? C.warning : C.green) + "10", border: "1px solid " + (fichaAntiga.dias > 90 ? C.danger : fichaAntiga.dias > 30 ? C.warning : C.green) + "22", borderRadius: 8, padding: "10px 12px", cursor: "pointer" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>{fichaAntiga.nome}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: fichaAntiga.dias > 90 ? C.danger : fichaAntiga.dias > 30 ? C.warning : C.green, marginTop: 4 }}>{fichaAntiga.dias} dias</div>
                  <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>desde {fmtDT(fichaAntiga.data)}</div>
                </div>
                {fichaAntiga.dias > 90 && <div style={{ fontSize: 10, color: C.danger, marginTop: 6, fontWeight: 600 }}>⚠️ Recomendado revisar fichas a cada 90 dias</div>}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 16, color: C.textDim }}>Nenhuma ficha cadastrada</div>
            )}
            {fichasIncompletas.length > 0 && (
              <div style={{ marginTop: 10, background: C.danger + "0A", borderRadius: 8, padding: "8px 10px", border: "1px solid " + C.danger + "22" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.danger }}>⚠️ {fichasIncompletas.length} ficha{fichasIncompletas.length > 1 ? "s" : ""} sem ingrediente:</div>
                <div style={{ fontSize: 11, color: C.text, marginTop: 3 }}>
                  {fichasIncompletas.slice(0, 3).map(function (f) { return f.nome; }).join(", ")}
                  {fichasIncompletas.length > 3 ? " +" + (fichasIncompletas.length - 3) + " mais" : ""}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ CATEGORIAS STRIP ═══ */}
        <div style={Object.assign({}, sCard, { padding: 14 })}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Categorias</span>
            <button style={Object.assign({}, sBtnGhost, { fontSize: 11 })} onClick={function () { setFCat(""); }}>Todas ({receitas.length})</button>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {categorias.map(function (cat) {
              var isActive = fCat === cat.id;
              var count = recsPorCat[cat.id] || 0;
              return (
                <div
                  key={cat.id}
                  onClick={function () { setFCat(isActive ? "" : cat.id); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                    background: isActive ? cat.cor + "22" : C.surface,
                    border: isActive ? "1.5px solid " + cat.cor : "1.5px solid " + C.border,
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: cat.cor, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? cat.cor : C.textMuted }}>{cat.nome}</span>
                  <span style={{ fontSize: 10, color: C.textDim, marginLeft: 2 }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ FILTRO SETOR ═══ */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Setor da Cozinha</span>
            {fSetor && <button style={Object.assign({}, sBtnGhost, { fontSize: 11 })} onClick={function () { setFSetor(""); }}>Todos</button>}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SETORES.map(function (st) {
              var isA = fSetor === st.id;
              var count = receitas.filter(function (r) { return r.setor === st.id; }).length;
              return (
                <div key={st.id} onClick={function () { setFSetor(isA ? "" : st.id); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, cursor: "pointer", background: isA ? st.cor + "22" : C.surface, border: isA ? "1.5px solid " + st.cor : "1.5px solid " + C.border, transition: "all 0.15s" }}>
                  <span style={{ fontSize: 13 }}>{st.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: isA ? 700 : 500, color: isA ? st.cor : C.textMuted }}>{st.nome}</span>
                  <span style={{ fontSize: 10, color: C.textDim }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ BUSCA ═══ */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
          <input style={Object.assign({}, sInput, { maxWidth: 360 })} placeholder="Buscar receita..." value={searchQ} onChange={function (e) { setSearchQ(e.target.value); }} />
          <span style={{ fontSize: 12, color: C.textMuted, marginLeft: "auto" }}>{receitasFiltradas.length} receita{receitasFiltradas.length !== 1 ? "s" : ""}</span>
        </div>

        {/* ═══ LISTA DE RECEITAS — FULL WIDTH ═══ */}
        <div style={sCard}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10, maxHeight: "calc(100vh - 520px)", overflowY: "auto" }}>
            {receitasFiltradas.map(function (rec) {
              var cat = categorias.find(function (c) { return c.id === rec.catId; });
              var setor = SETORES.find(function (s) { return s.id === rec.setor; });
              var custo = calcCusto(rec, ingredientes);
              return (
                <div key={rec.id} onClick={function () { selectRec(rec.id); }}
                  style={{ background: C.navyMid, borderRadius: 10, border: "1px solid " + C.border, padding: "14px 16px", cursor: "pointer", transition: "all 0.15s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.white, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rec.nome}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
                        {cat && <span style={{ display: "flex", alignItems: "center", gap: 4, background: cat.cor + "18", color: cat.cor, padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: cat.cor }} />{cat.nome}
                        </span>}
                        {setor && <span style={{ background: setor.cor + "18", color: setor.cor, padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{setor.icon} {setor.nome}</span>}
                        <span style={{ fontSize: 10, color: C.textDim }}>{rec.itens.length} ing.</span>
                        {rec.itens.length === 0 && <span style={{ fontSize: 9, color: C.danger, fontWeight: 700 }}>⚠️</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 10 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.green }}>{fmtBRL(custo)}</div>
                      <div style={{ fontSize: 9, color: C.textDim }}>por comensal</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {receitasFiltradas.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>
              <div style={{ fontSize: 36, opacity: 0.3, marginBottom: 10 }}>📋</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Nenhuma receita encontrada</div>
            </div>
          )}
        </div>

        {/* ═══ MODAL: DETALHE DA RECEITA ═══ */}
        <Modal open={!!selRec} onClose={function () { selectRec(null); }} title={selRec ? selRec.nome : ""} sub={selRec ? (function () { var sc = selCat ? selCat.nome : ""; var st = SETORES.find(function (s) { return s.id === selRec.setor; }); return sc + " · " + (st ? st.icon + " " + st.nome : "Sem setor") + " · " + selRec.itens.length + " ingredientes · Fc Coccao: " + selRec.fcCoccao; })() : ""} w="75vw">
          {selRec && (
            <div>
              {/* Setor badge */}
              {(function () { var st = SETORES.find(function (s) { return s.id === selRec.setor; }); return st ? (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: st.cor + "15", border: "1px solid " + st.cor + "33", padding: "6px 12px", borderRadius: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 14 }}>{st.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: st.cor }}>{st.nome}</span>
                  <span style={{ fontSize: 10, color: C.textDim }}>{st.desc}</span>
                </div>
              ) : null; })()}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginBottom: 14 }}>
                <button style={Object.assign({}, sBtnGhost, { fontSize: 11 })} onClick={function () { printFicha(selRec, ingredientes, categorias); }}>🖨 Imprimir</button>
                <button style={Object.assign({}, sBtnOutline, sBtnSm)} onClick={function () { openEditRec(selRec); }}>✏️ Editar</button>
                <button style={Object.assign({}, sBtnGhost, { color: C.danger })} onClick={function () { deleteRec(selRec.id); }}>🗑 Excluir</button>
              </div>
              {selRec.obs && <div style={{ fontSize: 12, color: C.textDim, marginBottom: 12, fontStyle: "italic", background: C.surface, padding: "8px 12px", borderRadius: 8 }}>💡 {selRec.obs}</div>}

              {/* RESUMO UAN */}
              {(function () {
                var somaPCL = selRec.itens.reduce(function (s, it) { return s + (parseFloat(it.pc) || 0); }, 0);
                var somaPCB = selRec.itens.reduce(function (s, it) { var ig = ingredientes.find(function (x) { return x.id === it.iId; }); return s + ((parseFloat(it.pc) || 0) * (ig ? ig.fc : 1)); }, 0);
                var fcc = selRec.fcCoccao || 1;
                var pcp = somaPCL * fcc;
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 16 }}>
                    <div style={{ background: C.accent + "12", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 8, color: C.textDim, fontWeight: 700 }}>PCL (LIQUIDO)</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.accent }}>{fmtG(somaPCL)}</div>
                      <div style={{ fontSize: 8, color: C.textDim }}>por comensal</div>
                    </div>
                    <div style={{ background: C.warning + "12", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 8, color: C.textDim, fontWeight: 700 }}>FC (MEDIO)</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.warning }}>{somaPCL > 0 ? (somaPCB / somaPCL).toFixed(2) : "1.00"}</div>
                      <div style={{ fontSize: 8, color: C.textDim }}>correcao</div>
                    </div>
                    <div style={{ background: C.danger + "12", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 8, color: C.textDim, fontWeight: 700 }}>PCB (BRUTO)</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.danger }}>{fmtG(somaPCB)}</div>
                      <div style={{ fontSize: 8, color: C.textDim }}>para compra</div>
                    </div>
                    <div style={{ background: C.gold + "12", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 8, color: C.textDim, fontWeight: 700 }}>FCc (COCCAO)</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.gold }}>{fcc.toFixed(2)}</div>
                      <div style={{ fontSize: 8, color: C.textDim }}>{fcc > 1 ? "aumenta" : fcc < 1 ? "reduz" : "mantem"}</div>
                    </div>
                    <div style={{ background: C.green + "12", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 8, color: C.textDim, fontWeight: 700 }}>PCP (PRONTO)</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.green }}>{fmtG(pcp)}</div>
                      <div style={{ fontSize: 8, color: C.textDim }}>servido/comensal</div>
                    </div>
                  </div>
                );
              })()}

              {/* FORMULA */}
              <div style={{ background: C.accent + "08", borderRadius: 10, padding: "10px 14px", marginBottom: 16, border: "1px solid " + C.accent + "15", fontSize: 11, color: C.textMuted }}>
                <strong style={{ color: C.accent }}>Formula UAN:</strong> QBT = Comensais x ((PCP / FCc) x FC) | PCL = PCP / FCc | PCB = PCL x FC
              </div>

              {/* ═══ FICHA TECNICA DE PREPARO ═══ */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.5px" }}>Ficha Tecnica de Preparo</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>Comensais:</span>
                    <input style={Object.assign({}, sInput, { width: 80, textAlign: "center", padding: "6px 10px", fontSize: 15, fontWeight: 700, color: C.accent })} type="number" value={viewPorcoes} onChange={function (e) { setViewPorcoes(parseInt(e.target.value) || 1); }} min="1" />
                  </div>
                </div>

                {/* Tabela principal — formato nutricionista */}
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "8px 10px", borderBottom: "2px solid " + C.border, fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", textAlign: "left" }}>Componentes</th>
                      <th style={{ padding: "8px 10px", borderBottom: "2px solid " + C.border, fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", textAlign: "center", width: 60 }}>Un.</th>
                      <th style={{ padding: "8px 10px", borderBottom: "2px solid " + C.border, fontSize: 10, fontWeight: 700, color: C.accent, textTransform: "uppercase", textAlign: "right" }}>PL</th>
                      <th style={{ padding: "8px 10px", borderBottom: "2px solid " + C.border, fontSize: 10, fontWeight: 700, color: C.warning, textTransform: "uppercase", textAlign: "right", width: 60 }}>Fc</th>
                      <th style={{ padding: "8px 10px", borderBottom: "2px solid " + C.border, fontSize: 10, fontWeight: 700, color: C.danger, textTransform: "uppercase", textAlign: "right" }}>QT ({viewPorcoes})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selRec.itens.map(function (it, idx) {
                      var ig = ingredientes.find(function (x) { return x.id === it.iId; });
                      if (!ig) return null;
                      var pcl = parseFloat(it.pcl || it.pc) || 0;
                      var fc = parseFloat(it.fc) || ig.fc || 1;
                      var qt = pcl * fc * viewPorcoes;
                      var td = { padding: "8px 10px", borderBottom: "1px solid " + C.border + "44", fontSize: 13 };
                      return (<tr key={idx}>
                        <td style={Object.assign({}, td, { fontWeight: 600, color: C.white })}>{ig.nome}</td>
                        <td style={Object.assign({}, td, { textAlign: "center", color: C.textMuted, fontSize: 12 })}>{ig.un}</td>
                        <td style={Object.assign({}, td, { textAlign: "right", color: C.accent, fontWeight: 600 })}>{pcl.toFixed(3)}</td>
                        <td style={Object.assign({}, td, { textAlign: "right", color: fc > 1 ? C.warning : C.textMuted, fontWeight: 700 })}>{fc.toFixed(2)}</td>
                        <td style={Object.assign({}, td, { textAlign: "right", fontWeight: 800, color: C.danger, fontSize: 14 })}>{(qt * 1000).toFixed(0) !== "0" ? fmt(qt) : "--"}</td>
                      </tr>);
                    })}
                    {/* SOMA DOS PER CAPITAS LIQUIDOS */}
                    <tr style={{ background: C.navyMid }}>
                      <td colSpan="2" style={{ padding: "10px", fontWeight: 800, color: C.white, fontSize: 12 }}>SOMA DOS PER CAPITAS LIQUIDOS</td>
                      <td style={{ padding: "10px", textAlign: "right", fontWeight: 800, color: C.accent, fontSize: 14 }}>
                        {selRec.itens.reduce(function (s, it) { return s + (parseFloat(it.pcl || it.pc) || 0); }, 0).toFixed(3)}
                      </td>
                      <td style={{ padding: "10px" }}></td>
                      <td style={{ padding: "10px" }}></td>
                    </tr>
                  </tbody>
                </table>

                {/* Rendimento (FCc) */}
                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ padding: "10px 14px", background: C.gold + "0A", borderRadius: 8, border: "1px solid " + C.gold + "22" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.gold }}>RENDIMENTO (FCc)</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: C.gold }}>{(selRec.fcCoccao || 1).toFixed(2)}</div>
                    <div style={{ fontSize: 10, color: C.textDim }}>{selRec.fcCoccao > 1 ? "Ganha peso/volume no preparo" : selRec.fcCoccao < 1 ? "Perde peso/volume no preparo" : "Mantem peso"}</div>
                  </div>
                  <div style={{ padding: "10px 14px", background: C.green + "0A", borderRadius: 8, border: "1px solid " + C.green + "22" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.green }}>PCP (PORCAO PRONTA SERVIDA)</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: C.green }}>
                      {fmtG(selRec.itens.reduce(function (s, it) { return s + (parseFloat(it.pcl || it.pc) || 0); }, 0) * (selRec.fcCoccao || 1))}
                    </div>
                    <div style={{ fontSize: 10, color: C.textDim }}>por comensal</div>
                  </div>
                </div>
              </div>

              {/* MODO DE PREPARO */}
              {selRec.obs && (
                <div style={{ background: C.surface, borderRadius: 10, padding: 14, marginBottom: 16, border: "1px solid " + C.border }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", marginBottom: 6 }}>Modo de Preparo</div>
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{selRec.obs}</div>
                </div>
              )}

              {/* CUSTOS — {viewPorcoes} comensais */}
              <div style={{ background: C.surface, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Custos — {viewPorcoes} Comensais</div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>
                    <th style={{ textAlign: "left", padding: "8px 10px", borderBottom: "2px solid " + C.border, color: C.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Componente</th>
                    <th style={{ textAlign: "right", padding: "8px 10px", borderBottom: "2px solid " + C.border, color: C.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Custo Un.</th>
                    <th style={{ textAlign: "right", padding: "8px 10px", borderBottom: "2px solid " + C.border, color: C.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Custo/Comensal</th>
                    <th style={{ textAlign: "right", padding: "8px 10px", borderBottom: "2px solid " + C.border, color: C.gold, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Custo Total</th>
                  </tr></thead>
                  <tbody>
                    {selRec.itens.map(function (it, idx) {
                      var ig = ingredientes.find(function (x) { return x.id === it.iId; });
                      if (!ig) return null;
                      var pcl = parseFloat(it.pcl || it.pc) || 0;
                      var fc = parseFloat(it.fc) || ig.fc || 1;
                      var pcb = pcl * fc;
                      var custoUn = pcb * ig.custo;
                      var td = { padding: "8px 10px", borderBottom: "1px solid " + C.border + "44", fontSize: 13 };
                      return (<tr key={idx}>
                        <td style={Object.assign({}, td, { fontWeight: 600, color: C.white })}>{ig.nome}</td>
                        <td style={Object.assign({}, td, { textAlign: "right", color: C.textMuted })}>{fmtBRL(ig.custo)}/{ig.un}</td>
                        <td style={Object.assign({}, td, { textAlign: "right", fontWeight: 600, color: C.green })}>{fmtBRL(custoUn)}</td>
                        <td style={Object.assign({}, td, { textAlign: "right", fontWeight: 700, color: C.gold })}>{fmtBRL(custoUn * viewPorcoes)}</td>
                      </tr>);
                    })}
                  </tbody>
                </table>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                  <div style={{ padding: "12px 16px", background: C.green + "0A", borderRadius: 10, border: "1px solid " + C.green + "22", textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim }}>CUSTO / COMENSAL</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: C.green }}>{fmtBRL(calcCusto(selRec, ingredientes))}</div>
                  </div>
                  <div style={{ padding: "12px 16px", background: C.gold + "0A", borderRadius: 10, border: "1px solid " + C.gold + "22", textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim }}>CUSTO TOTAL ({viewPorcoes})</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: C.gold }}>{fmtBRL(calcCusto(selRec, ingredientes) * viewPorcoes)}</div>
                  </div>
                </div>
              </div>
              {/* HISTÓRICO */}
              {(function () {
                var recLogs = auditLog.filter(function (l) { return l.recId === selRec.id; }).sort(function (a, b) { return b.data.localeCompare(a.data); });
                var criadoPorUser = USUARIOS.find(function (u) { return u.id === selRec.criadoPor; });
                var atualizadoPorUser = USUARIOS.find(function (u) { return u.id === selRec.atualizadoPor; });
                var TC = { criacao: C.green, per_capita: C.accent, fc_coccao: C.warning, fc_correcao: C.warning, ingrediente_add: C.green, ingrediente_rem: C.danger, nome: C.textMuted, categoria: C.gold };
                var TI = { criacao: "🆕", per_capita: "📏", fc_coccao: "🔥", fc_correcao: "✂️", ingrediente_add: "➕", ingrediente_rem: "➖", nome: "✏️", categoria: "🏷" };
                return (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", marginBottom: 10 }}>📜 Histórico ({recLogs.length})</div>
                    <div style={{ display: "flex", gap: 10, marginBottom: 10, padding: "10px 14px", background: C.green + "08", borderRadius: 8, border: "1px solid " + C.green + "22" }}>
                      <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: C.textDim, fontWeight: 700 }}>CRIADO POR</div><div style={{ fontSize: 13, fontWeight: 600 }}>{criadoPorUser ? criadoPorUser.nome : "—"}</div><div style={{ fontSize: 10, color: C.textDim }}>{fmtDT(selRec.criadoEm)}</div></div>
                      <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: C.textDim, fontWeight: 700 }}>ÚLTIMA ALTERAÇÃO</div><div style={{ fontSize: 13, fontWeight: 600 }}>{atualizadoPorUser ? atualizadoPorUser.nome : "—"}</div><div style={{ fontSize: 10, color: C.textDim }}>{fmtDT(selRec.atualizadoEm)}</div></div>
                    </div>
                    <div style={{ maxHeight: 160, overflowY: "auto" }}>
                      {recLogs.map(function (l) {
                        var usr = USUARIOS.find(function (u) { return u.id === l.user; });
                        var cor = TC[l.tipo] || C.textMuted;
                        return (
                          <div key={l.id} style={{ display: "flex", gap: 10, padding: "8px 12px", marginBottom: 4, background: C.navyMid, borderRadius: 8, borderLeft: "3px solid " + cor, alignItems: "center" }}>
                            <span style={{ fontSize: 14, flexShrink: 0 }}>{TI[l.tipo] || "📝"}</span>
                            <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{l.detalhe}</div><div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>{usr ? usr.nome : l.user} · {fmtDT(l.data)}</div></div>
                            <span style={{ fontSize: 9, color: cor, fontWeight: 700, background: cor + "15", padding: "2px 6px", borderRadius: 4 }}>{l.tipo.replace("_", " ")}</span>
                          </div>
                        );
                      })}
                      {recLogs.length === 0 && <div style={{ textAlign: "center", padding: 12, color: C.textDim, fontSize: 12 }}>Sem alterações</div>}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </Modal>

        {/* ═══ MODAL: KPI DETALHE ═══ */}
        <Modal open={!!kpiModal} onClose={function () { setKpiModal(null); }} title={kpiModal ? kpiModal.title : ""} sub={kpiModal ? kpiModal.sub : ""} w={620}>
          {kpiModal && kpiModal.content}
        </Modal>

        {/* ═══ MODAL: CATEGORIA ═══ */}
        <Modal open={catModal} onClose={function () { setCatModal(false); }} title={catForm && catForm.id ? "Editar Categoria" : "Nova Categoria"} w={480}>
          {catForm && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 14, marginBottom: 14 }}>
                <div><label style={sLabel}>Nome *</label><input style={sInput} value={catForm.nome} onChange={function (e) { setCatForm(Object.assign({}, catForm, { nome: e.target.value })); }} placeholder="Ex: Prato proteico" /></div>
                <div><label style={sLabel}>Cor</label><input style={Object.assign({}, sInput, { padding: 4, height: 44 })} type="color" value={catForm.cor} onChange={function (e) { setCatForm(Object.assign({}, catForm, { cor: e.target.value })); }} /></div>
              </div>
              <div style={{ marginBottom: 16 }}><label style={sLabel}>Descrição</label><input style={sInput} value={catForm.desc} onChange={function (e) { setCatForm(Object.assign({}, catForm, { desc: e.target.value })); }} placeholder="Opcional..." /></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>{catForm.id && <button style={Object.assign({}, sBtnGhost, { color: C.danger })} onClick={function () { deleteCat(catForm.id); setCatModal(false); }}>🗑 Excluir</button>}</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button style={sBtnOutline} onClick={function () { setCatModal(false); }}>Cancelar</button>
                  <button style={sBtn} onClick={saveCat}>💾 Salvar</button>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* ═══ MODAL: RECEITA ═══ */}
        <Modal open={recModal} onClose={function () { setRecModal(false); }} title={recForm && recForm.id ? "Editar Receita" : "Nova Receita"} sub="Ficha técnica com per capita e custo" w={780}>
          {recForm && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div><label style={sLabel}>Nome da Receita *</label><input style={sInput} value={recForm.nome} onChange={function (e) { setRecForm(Object.assign({}, recForm, { nome: e.target.value })); }} /></div>
                <div><label style={sLabel}>Categoria *</label>
                  <select style={Object.assign({}, sSelect, { width: "100%" })} value={recForm.catId} onChange={function (e) { setRecForm(Object.assign({}, recForm, { catId: e.target.value })); }}>
                    <option value="">Selecione...</option>
                    {categorias.map(function (c) { return <option key={c.id} value={c.id}>{c.nome}</option>; })}
                  </select>
                </div>
                <div><label style={sLabel}>Setor da Cozinha *</label>
                  <select style={Object.assign({}, sSelect, { width: "100%" })} value={recForm.setor || ""} onChange={function (e) { setRecForm(Object.assign({}, recForm, { setor: e.target.value })); }}>
                    <option value="">Selecione...</option>
                    {SETORES.map(function (s) { return <option key={s.id} value={s.id}>{s.icon} {s.nome}</option>; })}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 14, marginBottom: 14 }}>
                <div><label style={sLabel}>Comensais</label><input style={sInput} type="number" value={recForm.porcoes} onChange={function (e) { setRecForm(Object.assign({}, recForm, { porcoes: e.target.value })); }} /></div>
                <div><label style={sLabel}>Fc Cocção (info)</label><input style={sInput} type="number" step="0.01" value={recForm.fcCoccao} onChange={function (e) { setRecForm(Object.assign({}, recForm, { fcCoccao: e.target.value })); }} /></div>
                <div><label style={sLabel}>Observações</label><input style={sInput} value={recForm.obs} onChange={function (e) { setRecForm(Object.assign({}, recForm, { obs: e.target.value })); }} placeholder="Modo de preparo, dicas..." /></div>
              </div>

              {/* Ingredientes da receita */}
              <div style={{ background: C.surface, borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Ingredientes ({recForm.itens.length})</span>
                  <button style={Object.assign({}, sBtnOutline, sBtnSm)} onClick={addItemToRec}>+ Ingrediente</button>
                </div>
                {recForm.itens.length === 0 && <div style={{ textAlign: "center", padding: 20, color: C.textDim, fontSize: 13 }}>Nenhum ingrediente — clique em "+ Ingrediente" para adicionar</div>}
                {recForm.itens.map(function (it, idx) {
                  var ig = ingredientes.find(function (x) { return x.id === it.iId; });
                  var pcb = parseFloat(it.pcb) || 0;
                  var pcl = parseFloat(it.pcl) || 0;
                  var itemFc = parseFloat(it.fc) || (ig ? ig.fc : 1);
                  var fcc = parseFloat(recForm.fcCoccao) || 1;
                  var pcp = pcl * fcc;
                  var custo = pcb * (ig ? ig.custo : 0);
                  return (
                    <div key={idx} style={{ background: C.navyMid, borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 40px", gap: 8, alignItems: "center", marginBottom: 8 }}>
                        <select style={Object.assign({}, sSelect, { width: "100%", fontSize: 12, padding: 8 })} value={it.iId} onChange={function (e) { updateRecItem(idx, "iId", e.target.value); }}>
                          <option value="">Selecione ingrediente...</option>
                          {ingredientes.map(function (i) { return <option key={i.id} value={i.id}>{i.nome} ({i.un})</option>; })}
                        </select>
                        <button style={Object.assign({}, sBtnGhost, { color: C.danger, padding: "4px 6px" })} onClick={function () { removeItemFromRec(idx); }}>X</button>
                      </div>
                      {ig && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 1fr 80px 80px", gap: 8, alignItems: "flex-end" }}>
                          <div>
                            <div style={{ fontSize: 9, color: C.danger, fontWeight: 700 }}>PCB (bruto) kg</div>
                            <input style={Object.assign({}, sInput, { fontSize: 14, padding: "7px 10px", fontWeight: 700, color: C.danger })} type="number" step="0.001" value={it.pcb} placeholder="0.000" onChange={function (e) {
                              var novoPCB = e.target.value;
                              var fc = parseFloat(it.fc) || 1;
                              var novoPCL = fc > 0 ? (parseFloat(novoPCB) || 0) / fc : 0;
                              updateRecItemMulti(idx, { pcb: novoPCB, pcl: novoPCL > 0 ? novoPCL.toFixed(4) : "" });
                            }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 9, color: C.warning, fontWeight: 700 }}>FC</div>
                            <input style={Object.assign({}, sInput, { fontSize: 14, padding: "7px 10px", fontWeight: 800, color: C.warning, textAlign: "center" })} type="number" step="0.01" value={it.fc} placeholder="1.00" onChange={function (e) {
                              var novoFc = e.target.value;
                              var pcbAtual = parseFloat(it.pcb) || 0;
                              var novoPCL = (parseFloat(novoFc) || 1) > 0 ? pcbAtual / (parseFloat(novoFc) || 1) : 0;
                              updateRecItemMulti(idx, { fc: novoFc, pcl: novoPCL > 0 ? novoPCL.toFixed(4) : it.pcl });
                            }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 9, color: C.accent, fontWeight: 700 }}>PCL (liquido) kg</div>
                            <input style={Object.assign({}, sInput, { fontSize: 14, padding: "7px 10px", fontWeight: 700, color: C.accent })} type="number" step="0.001" value={it.pcl} placeholder="0.000" onChange={function (e) {
                              var novoPCL = e.target.value;
                              var fc = parseFloat(it.fc) || 1;
                              var novoPCB = (parseFloat(novoPCL) || 0) * fc;
                              updateRecItemMulti(idx, { pcl: novoPCL, pcb: novoPCB > 0 ? novoPCB.toFixed(4) : "" });
                            }} />
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 9, color: C.green, fontWeight: 700 }}>PCP</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: C.green, padding: "7px 0" }}>{pcl > 0 ? fmtG(pcp) : "--"}</div>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 9, color: C.gold, fontWeight: 700 }}>CUSTO</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: C.gold, padding: "7px 0" }}>{pcb > 0 ? fmtBRL(custo) : "--"}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {recForm.itens.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, padding: "10px 14px", background: C.gold + "0A", borderRadius: 8, border: "1px solid " + C.gold + "22", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: C.textMuted }}>
                      PCL total: <strong style={{ color: C.accent }}>{fmtG(recForm.itens.reduce(function (s, it) { return s + (parseFloat(it.pcl) || 0); }, 0))}</strong> |
                      PCB total: <strong style={{ color: C.danger }}>{fmtG(recForm.itens.reduce(function (s, it) { return s + (parseFloat(it.pcb) || 0); }, 0))}</strong> |
                      PCP: <strong style={{ color: C.green }}>{fmtG(recForm.itens.reduce(function (s, it) { return s + (parseFloat(it.pcl) || 0); }, 0) * (parseFloat(recForm.fcCoccao) || 1))}</strong>
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: C.gold }}>
                      {fmtBRL(recForm.itens.reduce(function (sum, it) {
                        var ig = ingredientes.find(function (x) { return x.id === it.iId; });
                        if (!ig) return sum;
                        return sum + (parseFloat(it.pcb) || 0) * ig.custo;
                      }, 0))}/comensal
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button style={sBtnOutline} onClick={function () { setRecModal(false); }}>Cancelar</button>
                <button style={sBtnGreen} onClick={saveRec}>💾 Salvar Receita</button>
              </div>
            </div>
          )}
        </Modal>

        {/* ═══ MODAL: INGREDIENTE ═══ */}
        <Modal open={ingModal} onClose={function () { setIngModal(false); }} title={ingForm && ingForm.id ? "Editar Ingrediente" : "Novo Ingrediente"} sub="Cadastro de insumo" w={560}>
          {ingForm && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div><label style={sLabel}>Nome *</label><input style={sInput} value={ingForm.nome} onChange={function (e) { setIngForm(Object.assign({}, ingForm, { nome: e.target.value })); }} placeholder="Ex: Peito de frango" /></div>
                <div><label style={sLabel}>Unidade</label>
                  <select style={Object.assign({}, sSelect, { width: "100%" })} value={ingForm.un} onChange={function (e) { setIngForm(Object.assign({}, ingForm, { un: e.target.value })); }}>
                    <option value="kg">kg</option><option value="L">L</option><option value="un">un</option>
                  </select>
                </div>
                <div><label style={sLabel}>Grupo *</label>
                  <select style={Object.assign({}, sSelect, { width: "100%" })} value={ingForm.grupo} onChange={function (e) { setIngForm(Object.assign({}, ingForm, { grupo: e.target.value })); }}>
                    {GRUPOS_INGREDIENTES.map(function (g) { return <option key={g} value={g}>{g}</option>; })}
                  </select>
                </div>
              </div>
              {/* Custo — futuro automático via Estoque */}
              <div style={{ marginBottom: 16 }}>
                <label style={sLabel}>Custo Atual (R$/un)</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input style={Object.assign({}, sInput, { maxWidth: 180, background: C.navyMid })} type="number" step="0.01" value={ingForm.custo} onChange={function (e) { setIngForm(Object.assign({}, ingForm, { custo: e.target.value })); }} />
                  <div style={{ background: C.gold + "10", border: "1px solid " + C.gold + "22", borderRadius: 8, padding: "8px 12px", flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.gold }}>⚠️ CAMPO PROVISÓRIO</div>
                    <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>Este valor será preenchido automaticamente pelo módulo Compras/Estoque com o preço médio ponderado.</div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button style={sBtnOutline} onClick={function () { setIngModal(false); }}>Cancelar</button>
                <button style={sBtn} onClick={saveIng}>💾 Salvar</button>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </div>
  );
}
