"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

function Sidebar({ activeModule, setActiveModule, perfil, onLogout }) {
  const modules = [
    { id: "dashboard", label: "Dashboard", icon: "D" },
    { id: "ingredientes", label: "Ingredientes", icon: "I" },
    { id: "preparacoes", label: "Preparacoes", icon: "P" },
    { id: "cardapios", label: "Cardapios", icon: "C" },
    { id: "ordens", label: "Ordens Producao", icon: "O" },
    { id: "compras", label: "Compras", icon: "Co" },
    { id: "estoque", label: "Estoque", icon: "E" },
    { id: "configuracoes", label: "Configuracoes", icon: "Cf" },
  ];
  return (
    <div style={{ width: 240, background: "#1a1a2e", color: "#fff", minHeight: "100vh", padding: "20px 0", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "0 20px 20px", borderBottom: "1px solid #333" }}>
        <h2 style={{ margin: 0, fontSize: 22, color: "#4fc3f7" }}>Rendora</h2>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>{perfil?.nome || ""}</p>
        <p style={{ margin: 0, fontSize: 11, color: "#666" }}>{perfil?.empresas?.nome || ""}</p>
      </div>
      <div style={{ flex: 1, paddingTop: 10 }}>
        {modules.map((m) => (
          <div key={m.id} onClick={() => setActiveModule(m.id)} style={{ padding: "12px 20px", cursor: "pointer", background: activeModule === m.id ? "#16213e" : "transparent", borderLeft: activeModule === m.id ? "3px solid #4fc3f7" : "3px solid transparent", fontSize: 14 }}>
            {m.label}
          </div>
        ))}
      </div>
      <div style={{ padding: "10px 20px", borderTop: "1px solid #333" }}>
        <button onClick={onLogout} style={{ width: "100%", padding: "8px", background: "#e74c3c", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>Sair</button>
      </div>
    </div>
  );
}

function ModIngredientes({ empresaId }) {
  const [ingredientes, setIngredientes] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState({ nome: "", grupo_id: "", unidade: "kg", estado: "In natura" });
  const [saving, setSaving] = useState(false);
  const [pg, setPg] = useState(0);
  const PS = 30;
  const estados = ["In natura","Congelado","Em po","Em conserva","Enlatado","Concentrado","Tablete","Salgado/Preservado","Desidratado","UHT"];

  const loadData = useCallback(async () => {
    setLoading(true);
    const [gR, iR] = await Promise.all([
      supabase.from("grupos_ingredientes").select("*").eq("empresa_id", empresaId).order("prefixo"),
      supabase.from("ingredientes").select("*, grupos_ingredientes(prefixo, nome)").eq("empresa_id", empresaId).order("codigo"),
    ]);
    if (gR.data) setGrupos(gR.data);
    if (iR.data) setIngredientes(iR.data);
    setLoading(false);
  }, [empresaId]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = ingredientes.filter((i) => {
    if (filtroGrupo && i.grupo_id !== filtroGrupo) return false;
    if (busca && !i.nome.toLowerCase().includes(busca.toLowerCase()) && !(i.codigo||"").toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });
  const paged = filtered.slice(pg*PS, (pg+1)*PS);
  const tp = Math.ceil(filtered.length / PS);

  const openNew = () => { setEditItem(null); setForm({ nome:"", grupo_id: grupos[0]?.id||"", unidade:"kg", estado:"In natura" }); setShowModal(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ nome:item.nome, grupo_id:item.grupo_id||"", unidade:item.unidade||"kg", estado:item.estado||"In natura" }); setShowModal(true); };

  const genCode = async (gid) => {
    const g = grupos.find(x=>x.id===gid);
    if(!g) return "ING-0001";
    const {data} = await supabase.from("ingredientes").select("codigo").eq("empresa_id",empresaId).like("codigo",g.prefixo+"-%").order("codigo",{ascending:false}).limit(1);
    if(data&&data.length>0){ const n=parseInt(data[0].codigo.split("-")[1])||0; return g.prefixo+"-"+String(n+1).padStart(4,"0"); }
    return g.prefixo+"-0001";
  };

  const handleSave = async () => {
    if(!form.nome.trim()) return alert("Nome obrigatorio");
    setSaving(true);
    if(editItem){
      const {error}=await supabase.from("ingredientes").update({nome:form.nome,grupo_id:form.grupo_id||null,unidade:form.unidade,estado:form.estado}).eq("id",editItem.id);
      if(error) alert("Erro: "+error.message);
    } else {
      const codigo = await genCode(form.grupo_id);
      const {error}=await supabase.from("ingredientes").insert({empresa_id:empresaId,codigo,nome:form.nome,grupo_id:form.grupo_id||null,unidade:form.unidade,estado:form.estado});
      if(error) alert("Erro: "+error.message);
    }
    setSaving(false); setShowModal(false); loadData();
  };

  const handleDeact = async (item) => {
    if(!confirm("Desativar: "+item.nome+"?")) return;
    await supabase.from("ingredientes").update({ativo:false}).eq("id",item.id);
    loadData();
  };

  if(loading) return <div style={{padding:40,textAlign:"center"}}>Carregando ingredientes...</div>;

  return (
    <div style={{padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><h2 style={{margin:0,color:"#1a1a2e"}}>Cadastro de Ingredientes</h2><p style={{margin:"4px 0 0",color:"#888",fontSize:14}}>{filtered.length} ingredientes</p></div>
        <button onClick={openNew} style={{padding:"10px 20px",background:"#4fc3f7",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600}}>+ Novo Ingrediente</button>
      </div>
      <div style={{display:"flex",gap:12,marginBottom:16}}>
        <input value={busca} onChange={e=>{setBusca(e.target.value);setPg(0);}} placeholder="Buscar por nome ou codigo..." style={{flex:1,padding:"10px 14px",border:"1px solid #ddd",borderRadius:8,fontSize:14}} />
        <select value={filtroGrupo} onChange={e=>{setFiltroGrupo(e.target.value);setPg(0);}} style={{padding:"10px 14px",border:"1px solid #ddd",borderRadius:8,fontSize:14,minWidth:200}}>
          <option value="">Todos os grupos</option>
          {grupos.map(g=><option key={g.id} value={g.id}>{g.prefixo} - {g.nome}</option>)}
        </select>
      </div>
      <div style={{background:"#fff",borderRadius:8,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.1)"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:"#f8f9fa"}}>
            <th style={{padding:"12px 16px",textAlign:"left",fontSize:13,color:"#666",fontWeight:600}}>Codigo</th>
            <th style={{padding:"12px 16px",textAlign:"left",fontSize:13,color:"#666",fontWeight:600}}>Nome</th>
            <th style={{padding:"12px 16px",textAlign:"left",fontSize:13,color:"#666",fontWeight:600}}>Grupo</th>
            <th style={{padding:"12px 16px",textAlign:"center",fontSize:13,color:"#666",fontWeight:600}}>Und</th>
            <th style={{padding:"12px 16px",textAlign:"left",fontSize:13,color:"#666",fontWeight:600}}>Estado</th>
            <th style={{padding:"12px 16px",textAlign:"center",fontSize:13,color:"#666",fontWeight:600}}>Acoes</th>
          </tr></thead>
          <tbody>
            {paged.map(item=>(
              <tr key={item.id} style={{borderBottom:"1px solid #eee",opacity:item.ativo===false?0.5:1}}>
                <td style={{padding:"10px 16px",fontSize:13,fontFamily:"monospace",color:"#4fc3f7"}}>{item.codigo}</td>
                <td style={{padding:"10px 16px",fontSize:14}}>{item.nome}</td>
                <td style={{padding:"10px 16px",fontSize:13,color:"#888"}}>{item.grupos_ingredientes?.nome||"-"}</td>
                <td style={{padding:"10px 16px",fontSize:13,textAlign:"center"}}>{item.unidade}</td>
                <td style={{padding:"10px 16px",fontSize:13,color:"#888"}}>{item.estado||"In natura"}</td>
                <td style={{padding:"10px 16px",textAlign:"center"}}>
                  <button onClick={()=>openEdit(item)} style={{padding:"4px 10px",background:"#e3f2fd",color:"#1976d2",border:"none",borderRadius:4,cursor:"pointer",fontSize:12,marginRight:4}}>Editar</button>
                  {item.ativo!==false&&<button onClick={()=>handleDeact(item)} style={{padding:"4px 10px",background:"#fce4ec",color:"#c62828",border:"none",borderRadius:4,cursor:"pointer",fontSize:12}}>Desativar</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tp>1&&<div style={{display:"flex",justifyContent:"center",gap:8,marginTop:16}}>
        <button disabled={pg===0} onClick={()=>setPg(pg-1)} style={{padding:"6px 12px",border:"1px solid #ddd",borderRadius:6,background:"#fff",cursor:pg===0?"default":"pointer"}}>Anterior</button>
        <span style={{fontSize:14,color:"#666",lineHeight:"32px"}}>Pg {pg+1} de {tp}</span>
        <button disabled={pg>=tp-1} onClick={()=>setPg(pg+1)} style={{padding:"6px 12px",border:"1px solid #ddd",borderRadius:6,background:"#fff",cursor:pg>=tp-1?"default":"pointer"}}>Proxima</button>
      </div>}
      {showModal&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
        <div style={{background:"#fff",borderRadius:12,padding:24,width:480}}>
          <h3 style={{margin:"0 0 20px"}}>{editItem?"Editar Ingrediente":"Novo Ingrediente"}</h3>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Nome *</label><input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:8,fontSize:14,boxSizing:"border-box"}} /></div>
            <div><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Grupo</label><select value={form.grupo_id} onChange={e=>setForm({...form,grupo_id:e.target.value})} style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:8,fontSize:14}}><option value="">Selecione...</option>{grupos.map(g=><option key={g.id} value={g.id}>{g.prefixo} - {g.nome}</option>)}</select></div>
            <div style={{display:"flex",gap:12}}>
              <div style={{flex:1}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Unidade</label><select value={form.unidade} onChange={e=>setForm({...form,unidade:e.target.value})} style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:8,fontSize:14}}><option value="kg">kg</option><option value="L">L</option><option value="un">un</option></select></div>
              <div style={{flex:1}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Estado</label><select value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})} style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:8,fontSize:14}}>{estados.map(e2=><option key={e2} value={e2}>{e2}</option>)}</select></div>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:20}}>
            <button onClick={()=>setShowModal(false)} style={{padding:"10px 20px",background:"#eee",border:"none",borderRadius:8,cursor:"pointer"}}>Cancelar</button>
            <button onClick={handleSave} disabled={saving} style={{padding:"10px 20px",background:"#4fc3f7",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600}}>{saving?"Salvando...":"Salvar"}</button>
          </div>
        </div>
      </div>}
    </div>
  );
}

function ModDashboard({ empresaId }) {
  const [stats,setStats]=useState({ingredientes:0,preparacoes:0,cardapios:0});
  useEffect(()=>{(async()=>{
    const [i,p,c]=await Promise.all([
      supabase.from("ingredientes").select("id",{count:"exact",head:true}).eq("empresa_id",empresaId).eq("ativo",true),
      supabase.from("preparacoes").select("id",{count:"exact",head:true}).eq("empresa_id",empresaId),
      supabase.from("cardapios").select("id",{count:"exact",head:true}).eq("empresa_id",empresaId),
    ]);
    setStats({ingredientes:i.count||0,preparacoes:p.count||0,cardapios:c.count||0});
  })();},[empresaId]);
  return (
    <div style={{padding:24}}>
      <h2 style={{marginBottom:24,color:"#1a1a2e"}}>Dashboard</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:16}}>
        {[{l:"Ingredientes Ativos",v:stats.ingredientes,c:"#4fc3f7"},{l:"Preparacoes",v:stats.preparacoes,c:"#81c784"},{l:"Cardapios",v:stats.cardapios,c:"#ffb74d"}].map(s=>(
          <div key={s.l} style={{background:"#fff",borderRadius:12,padding:20,boxShadow:"0 1px 3px rgba(0,0,0,0.1)",borderLeft:"4px solid "+s.c}}>
            <div style={{fontSize:28,fontWeight:700,color:"#1a1a2e"}}>{s.v}</div>
            <div style={{fontSize:13,color:"#888",marginTop:4}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:32,background:"#fff",borderRadius:12,padding:24,boxShadow:"0 1px 3px rgba(0,0,0,0.1)"}}>
        <h3 style={{margin:"0 0 12px",color:"#1a1a2e"}}>Bem-vindo ao Rendora</h3>
        <p style={{color:"#666",lineHeight:1.6}}>Plataforma de gestao operacional para Unidades de Alimentacao e Nutricao.</p>
      </div>
    </div>
  );
}

function ModPlaceholder({title}){return(<div style={{padding:24}}><h2 style={{color:"#1a1a2e"}}>{title}</h2><div style={{background:"#fff",borderRadius:12,padding:40,textAlign:"center",boxShadow:"0 1px 3px rgba(0,0,0,0.1)",marginTop:16}}><p style={{color:"#888",fontSize:16}}>Modulo em desenvolvimento</p></div></div>);}

export default function Home() {
  const [user,setUser]=useState(null);
  const [perfil,setPerfil]=useState(null);
  const [loading,setLoading]=useState(true);
  const [activeModule,setActiveModule]=useState("dashboard");
  const router=useRouter();
  useEffect(()=>{(async()=>{
    const {data:{session}}=await supabase.auth.getSession();
    if(!session){router.push("/login");return;}
    setUser(session.user);
    const {data:p}=await supabase.from("perfis").select("*, empresas(id, nome)").eq("id",session.user.id).single();
    if(p) setPerfil(p);
    setLoading(false);
  })();},[router]);
  const handleLogout=async()=>{await supabase.auth.signOut();router.push("/login");};
  if(loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#f0f2f5"}}><div style={{textAlign:"center"}}><h2 style={{color:"#4fc3f7"}}>Rendora</h2><p style={{color:"#888"}}>Carregando...</p></div></div>;
  const empresaId=perfil?.empresa_id;
  if(!empresaId) return <div style={{padding:40,textAlign:"center"}}><p>Perfil nao encontrado.</p><button onClick={handleLogout}>Sair</button></div>;
  const renderMod=()=>{
    switch(activeModule){
      case "dashboard": return <ModDashboard empresaId={empresaId}/>;
      case "ingredientes": return <ModIngredientes empresaId={empresaId}/>;
      case "preparacoes": return <ModPlaceholder title="Preparacoes (Fichas Tecnicas)"/>;
      case "cardapios": return <ModPlaceholder title="Cardapios e Planejamento"/>;
      case "ordens": return <ModPlaceholder title="Ordens de Producao"/>;
      case "compras": return <ModPlaceholder title="Lista de Compras"/>;
      case "estoque": return <ModPlaceholder title="Estoque"/>;
      case "configuracoes": return <ModPlaceholder title="Configuracoes"/>;
      default: return <ModDashboard empresaId={empresaId}/>;
    }
  };
  return (<div style={{display:"flex",minHeight:"100vh",background:"#f0f2f5"}}><Sidebar activeModule={activeModule} setActiveModule={setActiveModule} perfil={perfil} onLogout={handleLogout}/><div style={{flex:1,overflow:"auto"}}>{renderMod()}</div></div>);
}
