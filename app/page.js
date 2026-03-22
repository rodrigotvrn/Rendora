"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

var C = {
  navy: "#192B47", navyLight: "#1E3250", navyMid: "#243A5C", surface: "#162842",
  border: "#2A4266", accent: "#00BDE4", green: "#2EAD4B", gold: "#E8A832",
  danger: "#E5484D", warning: "#F5A623", white: "#F1F5F9", text: "#CBD5E1",
  textMuted: "#8B9FC0", textDim: "#5A7194"
};

var sBtnGreen = { padding:"10px 20px", borderRadius:8, border:"none", background:C.green, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" };
var sBtnOutline = { padding:"8px 16px", borderRadius:8, border:"1px solid "+C.border, background:"transparent", color:C.textMuted, fontWeight:600, fontSize:12, cursor:"pointer" };
var sBtnDanger = { padding:"8px 16px", borderRadius:8, border:"none", background:C.danger, color:"#fff", fontWeight:600, fontSize:12, cursor:"pointer" };
var sInput = { width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid "+C.border, background:C.navy, color:C.white, fontSize:13, outline:"none", marginBottom:10 };

function Modal(props) {
  if (!props.aberto) return null;
  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999 }}>
      <div style={{ background:C.navyLight, borderRadius:16, padding:24, minWidth:400, maxWidth:500, border:"1px solid "+C.border }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ fontSize:18, fontWeight:700, color:C.white }}>{props.titulo}</div>
          <button onClick={props.onFechar} style={{ background:"none", border:"none", color:C.textMuted, fontSize:20, cursor:"pointer" }}>X</button>
        </div>
        {props.children}
      </div>
    </div>
  );
}

function Vazio(props) {
  return (
    <div style={{ textAlign:"center", padding:60, color:C.textDim }}>
      <div style={{ fontSize:48, marginBottom:16 }}>{props.icon || "📭"}</div>
      <div style={{ fontSize:16, fontWeight:700, color:C.textMuted, marginBottom:8 }}>{props.titulo}</div>
      <div style={{ fontSize:13, marginBottom:20 }}>{props.msg}</div>
      {props.children}
    </div>
  );
}

function ModDashboard(props) {
  var nc = props.totais.clientes;
  var ni = props.totais.ingredientes;
  var np = props.totais.preparacoes;
  return (
    <div>
      <div style={{ fontSize:20, fontWeight:800, color:C.white, marginBottom:4 }}>Dashboard Operacional</div>
      <div style={{ fontSize:12, color:C.textMuted, marginBottom:20 }}>Visao geral da operacao</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
        {[
          { label:"RECEITAS", valor:String(np), icon:"📋", cor:C.accent },
          { label:"INGREDIENTES", valor:String(ni), icon:"🥕", cor:C.green },
          { label:"CLIENTES ATIVOS", valor:String(nc), icon:"🏢", cor:C.gold },
          { label:"CARDAPIOS/MES", valor:"0", icon:"📅", cor:C.warning },
          { label:"CUSTO MEDIO", valor:"R$ 0,00", icon:"💰", cor:C.green },
          { label:"COMENSAIS/DIA", valor:"0", icon:"👥", cor:C.accent }
        ].map(function(k){
          return (
            <div key={k.label} style={{ background:k.cor+"08", borderRadius:14, padding:"16px 18px", border:"1px solid "+k.cor+"22" }}>
              <div style={{ fontSize:9, color:C.textDim, fontWeight:700 }}>{k.label}</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:26, fontWeight:800, color:k.cor, marginTop:4 }}>{k.valor}</div>
                <span style={{ fontSize:28, opacity:0.4 }}>{k.icon}</span>
              </div>
            </div>
          );
        })}
      </div>
      <Vazio icon="🚀" titulo="Bem-vindo ao Rendora!" msg="Comece cadastrando seus clientes, receitas e ingredientes para usar o sistema." />
    </div>
  );
}

function ModClientes(props) {
  var _m = useState(false); var modal = _m[0]; var setModal = _m[1];
  var _n = useState(""); var nome = _n[0]; var setNome = _n[1];
  var _t = useState("empresa"); var tipo = _t[0]; var setTipo = _t[1];
  var _s = useState(false); var salvando = _s[0]; var setSalvando = _s[1];
  var _e = useState(""); var erro = _e[0]; var setErro = _e[1];

  function salvar() {
    if (!nome.trim()) { setErro("Preencha o nome"); return; }
    setSalvando(true); setErro("");
    supabase.from("clientes").insert({ empresa_id: props.empresaId, nome: nome.trim(), tipo: tipo, ativo: true })
      .then(function(res) {
        setSalvando(false);
        if (res.error) { setErro(res.error.message); return; }
        setNome(""); setTipo("empresa"); setModal(false);
        props.recarregar();
      });
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div><div style={{ fontSize:20, fontWeight:800, color:C.white }}>Clientes</div><div style={{ fontSize:12, color:C.textMuted }}>{props.dados.length} clientes</div></div>
        <button style={sBtnGreen} onClick={function(){setModal(true); setErro("");}}>+ Novo Cliente</button>
      </div>
      {props.dados.length === 0 ? (
        <Vazio icon="🏢" titulo="Nenhum cliente cadastrado" msg="Cadastre seu primeiro cliente para comecar." />
      ) : (
        <div style={{ display:"grid", gap:8 }}>
          {props.dados.map(function(c){
            return (
              <div key={c.id} style={{ background:C.surface, borderRadius:10, padding:"14px 18px", border:"1px solid "+C.border, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:700, color:C.white, fontSize:14 }}>{c.nome}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{c.tipo} {c.ativo ? "• Ativo" : "• Inativo"}</div>
                </div>
                <button style={sBtnDanger} onClick={function(){
                  supabase.from("clientes").delete().eq("id", c.id).then(function(){ props.recarregar(); });
                }}>Excluir</button>
              </div>
            );
          })}
        </div>
      )}
      <Modal aberto={modal} titulo="Novo Cliente" onFechar={function(){setModal(false);}}>
        <div>
          <label style={{ fontSize:12, color:C.textMuted, marginBottom:4, display:"block" }}>Nome do Cliente</label>
          <input style={sInput} placeholder="Ex: Hospital ABC" value={nome} onChange={function(e){setNome(e.target.value);}} />
          <label style={{ fontSize:12, color:C.textMuted, marginBottom:4, display:"block" }}>Tipo</label>
          <select style={sInput} value={tipo} onChange={function(e){setTipo(e.target.value);}}>
            <option value="empresa">Empresa</option>
            <option value="hospital">Hospital</option>
            <option value="escola">Escola</option>
            <option value="restaurante">Restaurante</option>
            <option value="outro">Outro</option>
          </select>
          {erro && <div style={{ color:C.danger, fontSize:12, marginBottom:8 }}>{erro}</div>}
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <button style={sBtnOutline} onClick={function(){setModal(false);}}>Cancelar</button>
            <button style={sBtnGreen} onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ModIngredientes(props) {
  var _m = useState(false); var modal = _m[0]; var setModal = _m[1];
  var _n = useState(""); var nome = _n[0]; var setNome = _n[1];
  var _u = useState("kg"); var unidade = _u[0]; var setUnidade = _u[1];
  var _c = useState(""); var custo = _c[0]; var setCusto = _c[1];
  var _s = useState(false); var salvando = _s[0]; var setSalvando = _s[1];
  var _e = useState(""); var erro = _e[0]; var setErro = _e[1];

  function salvar() {
    if (!nome.trim()) { setErro("Preencha o nome"); return; }
    setSalvando(true); setErro("");
    supabase.from("ingredientes").insert({ empresa_id: props.empresaId, nome: nome.trim(), unidade: unidade, custo_medio: parseFloat(custo) || 0, ativo: true })
      .then(function(res) {
        setSalvando(false);
        if (res.error) { setErro(res.error.message); return; }
        setNome(""); setUnidade("kg"); setCusto(""); setModal(false);
        props.recarregar();
      });
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div><div style={{ fontSize:20, fontWeight:800, color:C.white }}>Ingredientes</div><div style={{ fontSize:12, color:C.textMuted }}>{props.dados.length} ingredientes</div></div>
        <button style={sBtnGreen} onClick={function(){setModal(true); setErro("");}}>+ Novo Ingrediente</button>
      </div>
      {props.dados.length === 0 ? (
        <Vazio icon="🥕" titulo="Nenhum ingrediente cadastrado" msg="Cadastre ingredientes para montar suas receitas." />
      ) : (
        <div style={{ display:"grid", gap:8 }}>
          {props.dados.map(function(i){
            return (
              <div key={i.id} style={{ background:C.surface, borderRadius:10, padding:"14px 18px", border:"1px solid "+C.border, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:700, color:C.white, fontSize:14 }}>{i.nome}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{i.unidade} • R$ {(i.custo_medio||0).toFixed(2)}</div>
                </div>
                <button style={sBtnDanger} onClick={function(){
                  supabase.from("ingredientes").delete().eq("id", i.id).then(function(){ props.recarregar(); });
                }}>Excluir</button>
              </div>
            );
          })}
        </div>
      )}
      <Modal aberto={modal} titulo="Novo Ingrediente" onFechar={function(){setModal(false);}}>
        <div>
          <label style={{ fontSize:12, color:C.textMuted, marginBottom:4, display:"block" }}>Nome</label>
          <input style={sInput} placeholder="Ex: Arroz branco" value={nome} onChange={function(e){setNome(e.target.value);}} />
          <label style={{ fontSize:12, color:C.textMuted, marginBottom:4, display:"block" }}>Unidade</label>
          <select style={sInput} value={unidade} onChange={function(e){setUnidade(e.target.value);}}>
            <option value="kg">kg</option>
            <option value="g">g</option>
            <option value="L">L</option>
            <option value="ml">ml</option>
            <option value="un">un</option>
          </select>
          <label style={{ fontSize:12, color:C.textMuted, marginBottom:4, display:"block" }}>Custo Medio (R$)</label>
          <input style={sInput} type="number" step="0.01" placeholder="0.00" value={custo} onChange={function(e){setCusto(e.target.value);}} />
          {erro && <div style={{ color:C.danger, fontSize:12, marginBottom:8 }}>{erro}</div>}
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <button style={sBtnOutline} onClick={function(){setModal(false);}}>Cancelar</button>
            <button style={sBtnGreen} onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ModPreparacoes(props) {
  var _m = useState(false); var modal = _m[0]; var setModal = _m[1];
  var _n = useState(""); var nome = _n[0]; var setNome = _n[1];
  var _f = useState(""); var fcc = _f[0]; var setFcc = _f[1];
  var _st = useState("cozinha_producao"); var setor = _st[0]; var setSetor = _st[1];
  var _s = useState(false); var salvando = _s[0]; var setSalvando = _s[1];
  var _e = useState(""); var erro = _e[0]; var setErro = _e[1];

  function salvar() {
    if (!nome.trim()) { setErro("Preencha o nome"); return; }
    setSalvando(true); setErro("");
    supabase.from("preparacoes").insert({ empresa_id: props.empresaId, nome: nome.trim(), fcc: parseFloat(fcc) || 1, setor: setor })
      .then(function(res) {
        setSalvando(false);
        if (res.error) { setErro(res.error.message); return; }
        setNome(""); setFcc(""); setSetor("cozinha_producao"); setModal(false);
        props.recarregar();
      });
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div><div style={{ fontSize:20, fontWeight:800, color:C.white }}>Preparacoes / Receitas</div><div style={{ fontSize:12, color:C.textMuted }}>{props.dados.length} receitas</div></div>
        <button style={sBtnGreen} onClick={function(){setModal(true); setErro("");}}>+ Nova Receita</button>
      </div>
      {props.dados.length === 0 ? (
        <Vazio icon="📋" titulo="Nenhuma receita cadastrada" msg="Cadastre suas fichas tecnicas e receitas." />
      ) : (
        <div style={{ display:"grid", gap:8 }}>
          {props.dados.map(function(p){
            return (
              <div key={p.id} style={{ background:C.surface, borderRadius:10, padding:"14px 18px", border:"1px solid "+C.border, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:700, color:C.white, fontSize:14 }}>{p.nome}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>FCC: {p.fcc || "-"} • {p.setor || ""}</div>
                </div>
                <button style={sBtnDanger} onClick={function(){
                  supabase.from("preparacoes").delete().eq("id", p.id).then(function(){ props.recarregar(); });
                }}>Excluir</button>
              </div>
            );
          })}
        </div>
      )}
      <Modal aberto={modal} titulo="Nova Receita" onFechar={function(){setModal(false);}}>
        <div>
          <label style={{ fontSize:12, color:C.textMuted, marginBottom:4, display:"block" }}>Nome da Receita</label>
          <input style={sInput} placeholder="Ex: Arroz cozido" value={nome} onChange={function(e){setNome(e.target.value);}} />
          <label style={{ fontSize:12, color:C.textMuted, marginBottom:4, display:"block" }}>FCC (Fator de Correcao)</label>
          <input style={sInput} type="number" step="0.01" placeholder="1.00" value={fcc} onChange={function(e){setFcc(e.target.value);}} />
          <label style={{ fontSize:12, color:C.textMuted, marginBottom:4, display:"block" }}>Setor</label>
          <select style={sInput} value={setor} onChange={function(e){setSetor(e.target.value);}}>
            <option value="cozinha_producao">Cozinha Producao</option>
            <option value="saladas">Saladas</option>
            <option value="sucos">Sucos</option>
            <option value="pastelaria">Pastelaria</option>
            <option value="panificacao">Panificacao</option>
          </select>
          {erro && <div style={{ color:C.danger, fontSize:12, marginBottom:8 }}>{erro}</div>}
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <button style={sBtnOutline} onClick={function(){setModal(false);}}>Cancelar</button>
            <button style={sBtnGreen} onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ModEstoque(props) {
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div><div style={{ fontSize:20, fontWeight:800, color:C.white }}>Estoque</div></div>
        <div style={{ display:"flex", gap:8 }}><button style={sBtnOutline}>Entrada NF</button><button style={sBtnGreen}>+ Novo Item</button></div>
      </div>
      <Vazio icon="📦" titulo="Estoque vazio" msg="Cadastre itens no estoque para controlar suas compras." />
    </div>
  );
}

function ModCompras() {
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div><div style={{ fontSize:20, fontWeight:800, color:C.white }}>Compras</div></div>
        <button style={sBtnGreen}>+ Nova Solicitacao</button>
      </div>
      <Vazio icon="🛒" titulo="Nenhum pedido de compra" msg="Os pedidos de compra aparecerao aqui." />
    </div>
  );
}

function ModPlanejamento() {
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div><div style={{ fontSize:20, fontWeight:800, color:C.white }}>Planejamento de Cardapios</div></div>
        <button style={sBtnGreen}>+ Novo Cardapio</button>
      </div>
      <Vazio icon="📅" titulo="Nenhum cardapio planejado" msg="Crie cardapios mensais para seus clientes." />
    </div>
  );
}

function ModIntegracao() {
  return (
    <div>
      <div style={{ fontSize:20, fontWeight:800, color:C.white, marginBottom:16 }}>Integracao Compras x Estoque</div>
      <Vazio icon="🔗" titulo="Nenhuma integracao ativa" msg="Configure a integracao apos cadastrar clientes e cardapios." />
    </div>
  );
}

function ModBaixa() {
  return (
    <div>
      <div style={{ fontSize:20, fontWeight:800, color:C.white, marginBottom:16 }}>Baixa de Producao</div>
      <Vazio icon="✅" titulo="Nenhuma producao pendente" msg="As producoes aparecerao aqui quando houver cardapios aprovados." />
    </div>
  );
}

var NAV = [
  { id:"dash", nome:"Dashboard", icon:"📊" },
  { id:"clie", nome:"Clientes", icon:"🏢" },
  { id:"ingr", nome:"Ingredientes", icon:"🥕" },
  { id:"prep", nome:"Preparacoes", icon:"📋" },
  { id:"plan", nome:"Planejamento", icon:"📅" },
  { id:"comp", nome:"Compras", icon:"🛒" },
  { id:"esto", nome:"Estoque", icon:"📦" },
  { id:"intg", nome:"Integracao", icon:"🔗" },
  { id:"baix", nome:"Baixa Prod.", icon:"✅" }
];

export default function RendoraApp() {
  var router = useRouter();
  var _p = useState("dash"); var page = _p[0]; var setPage = _p[1];
  var _c = useState(false); var collapsed = _c[0]; var setCollapsed = _c[1];
  var _u = useState(null); var user = _u[0]; var setUser = _u[1];
  var _pf = useState(null); var perfil = _pf[0]; var setPerfil = _pf[1];
  var _load = useState(true); var loading = _load[0]; var setLoading = _load[1];
  var _clientes = useState([]); var clientes = _clientes[0]; var setClientes = _clientes[1];
  var _ingredientes = useState([]); var ingredientes = _ingredientes[0]; var setIngredientes = _ingredientes[1];
  var _preparacoes = useState([]); var preparacoes = _preparacoes[0]; var setPreparacoes = _preparacoes[1];
  var _empresaId = useState(null); var empresaId = _empresaId[0]; var setEmpresaId = _empresaId[1];

  function carregarDados(eid) {
    supabase.from("clientes").select("*").eq("empresa_id", eid).order("created_at", { ascending: false }).then(function(r){ if(r.data) setClientes(r.data); });
    supabase.from("ingredientes").select("*").eq("empresa_id", eid).order("created_at", { ascending: false }).then(function(r){ if(r.data) setIngredientes(r.data); });
    supabase.from("preparacoes").select("*").eq("empresa_id", eid).order("id", { ascending: false }).then(function(r){ if(r.data) setPreparacoes(r.data); });
  }

  useEffect(function(){
    supabase.auth.getUser().then(function(res){
      if (!res.data.user) { router.push("/login"); return; }
      setUser(res.data.user);
      supabase.from("perfis").select("*, empresas(id, nome)").eq("id", res.data.user.id).single().then(function(r){
        setPerfil(r.data);
        if (r.data && r.data.empresas) {
          setEmpresaId(r.data.empresas.id);
          carregarDados(r.data.empresas.id);
        }
        setLoading(false);
      });
    });
  }, []);

  function handleLogout(){ supabase.auth.signOut().then(function(){ router.push("/login"); }); }

  function recarregarDados(){ if(empresaId) carregarDados(empresaId); }

  if (loading) {
    return (<div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:C.navy, color:C.accent, fontSize:18, fontWeight:700 }}>Carregando...</div>);
  }

  var nomeEmpresa = perfil && perfil.empresas ? perfil.empresas.nome : "Minha Empresa";
  var nomeUser = perfil ? perfil.nome : "";
  var iniciais = nomeUser ? nomeUser.split(" ").map(function(n){return n[0]}).join("").substring(0,2).toUpperCase() : "U";

  var totais = { clientes: clientes.length, ingredientes: ingredientes.length, preparacoes: preparacoes.length };

  var content = null;
  if (page === "dash") content = <ModDashboard totais={totais} />;
  else if (page === "clie") content = <ModClientes dados={clientes} empresaId={empresaId} recarregar={recarregarDados} />;
  else if (page === "ingr") content = <ModIngredientes dados={ingredientes} empresaId={empresaId} recarregar={recarregarDados} />;
  else if (page === "prep") content = <ModPreparacoes dados={preparacoes} empresaId={empresaId} recarregar={recarregarDados} />;
  else if (page === "plan") content = <ModPlanejamento />;
  else if (page === "comp") content = <ModCompras />;
  else if (page === "esto") content = <ModEstoque />;
  else if (page === "intg") content = <ModIntegracao />;
  else if (page === "baix") content = <ModBaixa />;

  return (
    <div style={{ fontFamily:"'DM Sans', sans-serif", display:"flex", height:"100vh", background:C.navy, color:C.text, overflow:"hidden" }}>
      <div style={{ width:collapsed?60:220, background:C.navyLight, borderRight:"1px solid "+C.border, display:"flex", flexDirection:"column", transition:"width 0.2s", flexShrink:0, overflow:"hidden" }}>
        <div style={{ padding:collapsed?"16px 12px":"16px 18px", borderBottom:"1px solid "+C.border, display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={function(){ setCollapsed(!collapsed); }}>
          <svg width="28" height="28" viewBox="0 0 100 100"><polygon points="20,80 50,20 80,80" fill="#2EAD4B" opacity="0.9" /><path d="M 60 35 A 30 30 0 0 1 85 65" stroke="#00BDE4" strokeWidth="8" fill="none" strokeLinecap="round" /></svg>
          {!collapsed && <div><div style={{ fontSize:16, fontWeight:800, color:C.white, letterSpacing:1 }}>RENDORA</div><div style={{ fontSize:8, color:C.textDim, letterSpacing:2 }}>GESTAO DE REFEICOES</div></div>}
        </div>
        <div style={{ flex:1, padding:"8px 6px", overflowY:"auto" }}>
          {NAV.map(function(item){
            var active = page === item.id;
            return (
              <div key={item.id} onClick={function(){ setPage(item.id); }} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, cursor:"pointer", marginBottom:2, background:active?C.accent+"15":"transparent", borderLeft:active?"3px solid "+C.accent:"3px solid transparent" }}>
                <span style={{ fontSize:16 }}>{item.icon}</span>
                {!collapsed && <span style={{ fontSize:13, fontWeight:active?700:500, color:active?C.accent:C.textMuted, whiteSpace:"nowrap" }}>{item.nome}</span>}
              </div>
            );
          })}
        </div>
        {!collapsed && <div style={{ padding:"12px 16px", borderTop:"1px solid "+C.border }}>
          <div style={{ fontSize:10, color:C.textDim }}>{nomeEmpresa}</div>
          <button onClick={handleLogout} style={{ marginTop:8, padding:"6px 12px", borderRadius:6, border:"1px solid "+C.danger+"44", background:"transparent", color:C.danger, fontSize:11, cursor:"pointer", fontWeight:600 }}>Sair</button>
        </div>}
      </div>
      <div style={{ flex:1, overflow:"auto", padding:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          {NAV.map(function(item){ if(item.id!==page) return null; return <span key={item.id} style={{ fontSize:11, color:C.accent, fontWeight:700, textTransform:"uppercase", letterSpacing:1 }}>{item.icon} {item.nome}</span>; })}
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:11, color:C.textDim }}>{new Date().toLocaleDateString("pt-BR")}</span>
            <div style={{ width:32, height:32, borderRadius:"50%", background:C.accent+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:C.accent }}>{iniciais}</div>
          </div>
        </div>
        {content}
      </div>
    </div>
  );
}