'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

/* ========== SIDEBAR ========== */
function Sidebar({ activeModule, setActiveModule, perfil, onLogout }) {
  const modules = [
    { id: "dashboard", label: "Dashboard", icon: "Ã°ÂÂÂ" },
    { id: "ingredientes", label: "Ingredientes", icon: "Ã°ÂÂÂ¾" },
    { id: "preparacoes", label: "Preparacoes", icon: "Ã°ÂÂÂ³" },
    { id: "cardapios", label: "Cardapios", icon: "Ã°ÂÂÂ" },
    { id: "ordens", label: "Ordens Producao", icon: "Ã°ÂÂÂ" },
    { id: "compras", label: "Compras", icon: "Ã°ÂÂÂ" },
    { id: "estoque", label: "Estoque", icon: "Ã°ÂÂÂ¦" },
    { id: "configuracoes", label: "Configuracoes", icon: "Ã¢ÂÂÃ¯Â¸Â" }
  ];
  return (
    <div style={{width:220,minHeight:'100vh',background:'#1a1a2e',color:'#fff',display:'flex',flexDirection:'column'}}>
      <div style={{padding:'20px 16px',borderBottom:'1px solid #333'}}>
        <h2 style={{margin:0,fontSize:20,color:'#e94560'}}>Rendora</h2>
        <p style={{margin:'4px 0 0',fontSize:11,color:'#aaa'}}>{perfil?.empresa_nome || ''}</p>
        <p style={{margin:'2px 0 0',fontSize:11,color:'#888'}}>{perfil?.nome || ''}</p>
      </div>
      <nav style={{flex:1,padding:'8px 0'}}>
        {modules.map(m => (
          <div key={m.id} onClick={() => setActiveModule(m.id)}
            style={{padding:'10px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:8,
              background: activeModule === m.id ? '#16213e' : 'transparent',
              borderLeft: activeModule === m.id ? '3px solid #e94560' : '3px solid transparent',
              color: activeModule === m.id ? '#fff' : '#aaa',fontSize:14}}>
            <span>{m.icon}</span><span>{m.label}</span>
          </div>
        ))}
      </nav>
      <div style={{padding:16,borderTop:'1px solid #333'}}>
        <button onClick={onLogout} style={{width:'100%',padding:'8px',background:'#e94560',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}>Sair</button>
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


/* ========== MOD PREPARACOES (Fichas Tecnicas) ========== */
function ModPreparacoes({ empresaId }) {
  const [preparacoes, setPreparacoes] = useState([]);
  const [ingredientesDisponiveis, setIngredientesDisponiveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showFicha, setShowFicha] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroSetor, setFiltroSetor] = useState('todos');
  const [form, setForm] = useState({ nome:'', setor:'cozinha_producao', modo_preparo:'', observacoes:'', rendimento_porcoes:1 });
  const [fichaItens, setFichaItens] = useState([]);
  const [novoItem, setNovoItem] = useState({ ingrediente_id:'', pcl:0, fc:1, fcc:1, custo_provisorio:0 });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const setores = [
    { value:'saladas', label:'Saladas' },
    { value:'sucos', label:'Sucos' },
    { value:'cozinha_producao', label:'Cozinha Producao' },
    { value:'confeitaria', label:'Confeitaria' },
    { value:'panificacao', label:'Panificacao' }
  ];

  const carregarPreparacoes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('preparacoes')
      .select('*, preparacao_itens(id, ingrediente_id, pcl, pcb, fc, fcc, pcp_padrao, custo_provisorio, ordem)')
      .eq('empresa_id', empresaId)
      .eq('ativo', true)
      .order('codigo', { ascending: true });
    if (!error) setPreparacoes(data || []);
    setLoading(false);
  }, [empresaId]);

  const carregarIngredientes = useCallback(async () => {
    const { data } = await supabase
      .from('ingredientes')
      .select('id, nome, codigo, unidade, grupo_id')
      .eq('empresa_id', empresaId)
      .eq('ativo', true)
      .order('nome');
    if (data) setIngredientesDisponiveis(data);
  }, [empresaId]);

  useEffect(() => { carregarPreparacoes(); carregarIngredientes(); }, [carregarPreparacoes, carregarIngredientes]);

  const gerarCodigo = async () => {
    const { data } = await supabase.from('preparacoes').select('codigo').eq('empresa_id', empresaId).not('codigo', 'is', null).order('codigo', { ascending: false }).limit(1);
    if (data && data.length > 0 && data[0].codigo) {
      const last = data[0].codigo;
      const match = last.match(/\d+/);
      const num = match ? parseInt(match[0]) + 1 : 1;
      return 'PREP-' + String(num).padStart(4,'0');
    }
    return 'PREP-0001';
  };

  const salvar = async () => {
    setSaving(true); setMsg('');
    try {
      if (editId) {
        const { error } = await supabase.from('preparacoes').update({
          nome: form.nome, setor: form.setor, modo_preparo: form.modo_preparo,
          observacoes: form.observacoes, rendimento_porcoes: form.rendimento_porcoes
        }).eq('id', editId);
        if (error) throw error;
        setMsg('Preparacao atualizada!');
      } else {
        const codigo = await gerarCodigo();
        const { data, error } = await supabase.from('preparacoes').insert({
          empresa_id: empresaId, codigo, nome: form.nome, setor: form.setor,
          modo_preparo: form.modo_preparo, observacoes: form.observacoes,
          rendimento_porcoes: form.rendimento_porcoes, ativo: true
        }).select().single();
        if (error) throw error;
        setMsg('Preparacao criada: ' + codigo);
        setEditId(data.id);
      }
      carregarPreparacoes();
    } catch(e) { setMsg('Erro: ' + e.message); }
    setSaving(false);
  };

  const desativar = async (id) => {
    await supabase.from('preparacoes').update({ ativo: false }).eq('id', id);
    carregarPreparacoes();
  };

  // === FICHA TECNICA ITENS ===
  const carregarItens = async (prepId) => {
    const { data } = await supabase
      .from('preparacao_itens')
      .select('*, ingredientes(nome, codigo, unidade)')
      .eq('preparacao_id', prepId)
      .order('ordem');
    setFichaItens(data || []);
  };

  const adicionarItem = async (prepId) => {
    if (!novoItem.ingrediente_id) return;
    const pcl = parseFloat(novoItem.pcl) || 0;
    const fc = parseFloat(novoItem.fc) || 1;
    const fcc = parseFloat(novoItem.fcc) || 1;
    const pcb = pcl * fc;
    const pcp_padrao = pcl * fcc;
    const custo = parseFloat(novoItem.custo_provisorio) || 0;
    const { error } = await supabase.from('preparacao_itens').insert({
      preparacao_id: prepId, ingrediente_id: novoItem.ingrediente_id,
      pcl, fc, fcc, pcb, pcp_padrao, custo_provisorio: custo,
      ordem: fichaItens.length + 1
    });
    if (!error) {
      carregarItens(prepId);
      setNovoItem({ ingrediente_id:'', pcl:0, fc:1, fcc:1, custo_provisorio:0 });
    }
  };

  const removerItem = async (itemId, prepId) => {
    await supabase.from('preparacao_itens').delete().eq('id', itemId);
    carregarItens(prepId);
  };

  const abrirFicha = (prep) => {
    setShowFicha(prep);
    carregarItens(prep.id);
  };

  const abrirEdicao = (prep) => {
    setForm({ nome: prep.nome, setor: prep.setor, modo_preparo: prep.modo_preparo || '',
      observacoes: prep.observacoes || '', rendimento_porcoes: prep.rendimento_porcoes || 1 });
    setEditId(prep.id);
    setShowForm(true);
    setShowFicha(null);
  };

  const novaPreparacao = () => {
    setForm({ nome:'', setor:'cozinha_producao', modo_preparo:'', observacoes:'', rendimento_porcoes:1 });
    setEditId(null);
    setShowForm(true);
    setShowFicha(null);
    setMsg('');
  };

  const filtradas = preparacoes.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase()) || p.codigo.toLowerCase().includes(busca.toLowerCase());
    const matchSetor = filtroSetor === 'todos' || p.setor === filtroSetor;
    return matchBusca && matchSetor;
  });

  // === FICHA TECNICA VIEW ===
  if (showFicha) {
    const custoTotal = fichaItens.reduce((acc, item) => acc + ((parseFloat(item.custo_provisorio)||0) * (parseFloat(item.pcb)||0)), 0);
    return (
      <div style={{padding:24}}>
        <button onClick={() => { setShowFicha(null); setFichaItens([]); }} style={{marginBottom:16,padding:'6px 16px',background:'#555',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}>Voltar</button>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div>
            <h2 style={{color:'#e94560',margin:0}}>{showFicha.codigo} - {showFicha.nome}</h2>
            <p style={{color:'#aaa',margin:'4px 0'}}>Setor: {showFicha.setor} | Rendimento: {showFicha.rendimento_porcoes} porcoes</p>
          </div>
          <button onClick={() => abrirEdicao(showFicha)} style={{padding:'6px 16px',background:'#0f3460',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}>Editar</button>
        </div>

        {showFicha.modo_preparo && <div style={{background:'#1a1a2e',padding:12,borderRadius:8,marginBottom:16}}>
          <strong style={{color:'#e94560'}}>Modo de Preparo:</strong>
          <p style={{color:'#ccc',whiteSpace:'pre-wrap',margin:'8px 0 0'}}>{showFicha.modo_preparo}</p>
        </div>}

        <h3 style={{color:'#e94560',marginBottom:8}}>Ingredientes da Ficha</h3>
        <table style={{width:'100%',borderCollapse:'collapse',marginBottom:16}}>
          <thead>
            <tr style={{background:'#16213e'}}>
              <th style={{padding:8,textAlign:'left',color:'#aaa',fontSize:12}}>Ingrediente</th>
              <th style={{padding:8,textAlign:'center',color:'#aaa',fontSize:12}}>PCL (kg)</th>
              <th style={{padding:8,textAlign:'center',color:'#aaa',fontSize:12}}>FC</th>
              <th style={{padding:8,textAlign:'center',color:'#aaa',fontSize:12}}>FCc</th>
              <th style={{padding:8,textAlign:'center',color:'#aaa',fontSize:12}}>PCB (kg)</th>
              <th style={{padding:8,textAlign:'center',color:'#aaa',fontSize:12}}>PCP (kg)</th>
              <th style={{padding:8,textAlign:'center',color:'#aaa',fontSize:12}}>Custo Prov.</th>
              <th style={{padding:8,textAlign:'center',color:'#aaa',fontSize:12}}>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {fichaItens.map(item => (
              <tr key={item.id} style={{borderBottom:'1px solid #333'}}>
                <td style={{padding:8,color:'#fff'}}>{item.ingredientes?.codigo} - {item.ingredientes?.nome}</td>
                <td style={{padding:8,textAlign:'center',color:'#ccc'}}>{parseFloat(item.pcl).toFixed(3)}</td>
                <td style={{padding:8,textAlign:'center',color:'#ccc'}}>{parseFloat(item.fc).toFixed(2)}</td>
                <td style={{padding:8,textAlign:'center',color:'#ccc'}}>{parseFloat(item.fcc).toFixed(2)}</td>
                <td style={{padding:8,textAlign:'center',color:'#4ecca3'}}>{(parseFloat(item.pcl) * parseFloat(item.fc)).toFixed(3)}</td>
                <td style={{padding:8,textAlign:'center',color:'#4ecca3'}}>{(parseFloat(item.pcl) * parseFloat(item.fcc)).toFixed(3)}</td>
                <td style={{padding:8,textAlign:'center',color:'#f0a500'}}>{item.custo_provisorio > 0 ? 'R$ ' + parseFloat(item.custo_provisorio).toFixed(2) : '-'}</td>
                <td style={{padding:8,textAlign:'center'}}>
                  <button onClick={() => removerItem(item.id, showFicha.id)} style={{padding:'4px 8px',background:'#e94560',color:'#fff',border:'none',borderRadius:4,cursor:'pointer',fontSize:11}}>Remover</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {custoTotal > 0 && <p style={{color:'#f0a500',marginBottom:16}}>Custo Total Provisorio: R$ {custoTotal.toFixed(2)} <span style={{background:'#f0a500',color:'#000',padding:'2px 6px',borderRadius:4,fontSize:10,marginLeft:8}}>Campo Provisorio</span></p>}

        <div style={{background:'#16213e',padding:16,borderRadius:8}}>
          <h4 style={{color:'#e94560',margin:'0 0 12px'}}>Adicionar Ingrediente</h4>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'flex-end'}}>
            <div style={{flex:2,minWidth:200}}>
              <label style={{color:'#aaa',fontSize:11,display:'block',marginBottom:4}}>Ingrediente</label>
              <select value={novoItem.ingrediente_id} onChange={e => setNovoItem({...novoItem, ingrediente_id: e.target.value})}
                style={{width:'100%',padding:8,background:'#0f3460',color:'#fff',border:'1px solid #333',borderRadius:4}}>
                <option value="">Selecione...</option>
                {ingredientesDisponiveis.map(ing => (
                  <option key={ing.id} value={ing.id}>{ing.codigo} - {ing.nome} ({ing.unidade})</option>
                ))}
              </select>
            </div>
            <div style={{flex:1,minWidth:80}}>
              <label style={{color:'#aaa',fontSize:11,display:'block',marginBottom:4}}>PCL (kg)</label>
              <input type="number" step="0.001" value={novoItem.pcl} onChange={e => setNovoItem({...novoItem, pcl: e.target.value})}
                style={{width:'100%',padding:8,background:'#0f3460',color:'#fff',border:'1px solid #333',borderRadius:4}} />
            </div>
            <div style={{flex:1,minWidth:80}}>
              <label style={{color:'#aaa',fontSize:11,display:'block',marginBottom:4}}>FC</label>
              <input type="number" step="0.01" value={novoItem.fc} onChange={e => setNovoItem({...novoItem, fc: e.target.value})}
                style={{width:'100%',padding:8,background:'#0f3460',color:'#fff',border:'1px solid #333',borderRadius:4}} />
            </div>
            <div style={{flex:1,minWidth:80}}>
              <label style={{color:'#aaa',fontSize:11,display:'block',marginBottom:4}}>FCc</label>
              <input type="number" step="0.01" value={novoItem.fcc} onChange={e => setNovoItem({...novoItem, fcc: e.target.value})}
                style={{width:'100%',padding:8,background:'#0f3460',color:'#fff',border:'1px solid #333',borderRadius:4}} />
            </div>
            <div style={{flex:1,minWidth:80}}>
              <label style={{color:'#aaa',fontSize:11,display:'block',marginBottom:4}}>Custo Prov. (R$)</label>
              <input type="number" step="0.01" value={novoItem.custo_provisorio} onChange={e => setNovoItem({...novoItem, custo_provisorio: e.target.value})}
                style={{width:'100%',padding:8,background:'#0f3460',color:'#fff',border:'1px solid #333',borderRadius:4}} />
            </div>
            <button onClick={() => adicionarItem(showFicha.id)} style={{padding:'8px 16px',background:'#4ecca3',color:'#000',border:'none',borderRadius:4,cursor:'pointer',fontWeight:'bold'}}>+ Adicionar</button>
          </div>
          <p style={{color:'#888',fontSize:11,marginTop:8}}>PCB = PCL x FC | PCP = PCL x FCc | QBT = Comensais x PCB</p>
        </div>
      </div>
    );
  }

  // === FORM VIEW ===
  if (showForm) {
    return (
      <div style={{padding:24}}>
        <button onClick={() => { setShowForm(false); setEditId(null); setMsg(''); }} style={{marginBottom:16,padding:'6px 16px',background:'#555',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}>Voltar</button>
        <h2 style={{color:'#e94560',marginBottom:16}}>{editId ? 'Editar Preparacao' : 'Nova Preparacao'}</h2>
        {msg && <p style={{color: msg.includes('Erro') ? '#e94560' : '#4ecca3',marginBottom:12}}>{msg}</p>}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,maxWidth:600}}>
          <div style={{gridColumn:'1/3'}}>
            <label style={{color:'#aaa',fontSize:12,display:'block',marginBottom:4}}>Nome da Preparacao *</label>
            <input value={form.nome} onChange={e => setForm({...form, nome:e.target.value})}
              style={{width:'100%',padding:10,background:'#16213e',color:'#fff',border:'1px solid #333',borderRadius:4}} placeholder="Ex: Arroz branco" />
          </div>
          <div>
            <label style={{color:'#aaa',fontSize:12,display:'block',marginBottom:4}}>Setor *</label>
            <select value={form.setor} onChange={e => setForm({...form, setor:e.target.value})}
              style={{width:'100%',padding:10,background:'#16213e',color:'#fff',border:'1px solid #333',borderRadius:4}}>
              {setores.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{color:'#aaa',fontSize:12,display:'block',marginBottom:4}}>Rendimento (porcoes)</label>
            <input type="number" value={form.rendimento_porcoes} onChange={e => setForm({...form, rendimento_porcoes: parseInt(e.target.value) || 1})}
              style={{width:'100%',padding:10,background:'#16213e',color:'#fff',border:'1px solid #333',borderRadius:4}} />
          </div>
          <div style={{gridColumn:'1/3'}}>
            <label style={{color:'#aaa',fontSize:12,display:'block',marginBottom:4}}>Modo de Preparo</label>
            <textarea value={form.modo_preparo} onChange={e => setForm({...form, modo_preparo:e.target.value})} rows={4}
              style={{width:'100%',padding:10,background:'#16213e',color:'#fff',border:'1px solid #333',borderRadius:4,resize:'vertical'}} placeholder="Descreva o modo de preparo..." />
          </div>
          <div style={{gridColumn:'1/3'}}>
            <label style={{color:'#aaa',fontSize:12,display:'block',marginBottom:4}}>Observacoes</label>
            <textarea value={form.observacoes} onChange={e => setForm({...form, observacoes:e.target.value})} rows={2}
              style={{width:'100%',padding:10,background:'#16213e',color:'#fff',border:'1px solid #333',borderRadius:4,resize:'vertical'}} />
          </div>
        </div>
        <div style={{marginTop:16,display:'flex',gap:8}}>
          <button onClick={salvar} disabled={saving || !form.nome}
            style={{padding:'10px 24px',background: !form.nome ? '#555' : '#e94560',color:'#fff',border:'none',borderRadius:4,cursor: !form.nome ? 'default' : 'pointer',fontWeight:'bold'}}>
            {saving ? 'Salvando...' : (editId ? 'Atualizar' : 'Criar Preparacao')}
          </button>
          {editId && <button onClick={() => abrirFicha({...form, id: editId, codigo: preparacoes.find(p=>p.id===editId)?.codigo || ''})}
            style={{padding:'10px 24px',background:'#0f3460',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}>Ver Ficha Tecnica</button>}
        </div>
      </div>
    );
  }

  // === LIST VIEW (default) ===
  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h2 style={{color:'#e94560',margin:0}}>Preparacoes / Fichas Tecnicas</h2>
        <button onClick={novaPreparacao} style={{padding:'8px 20px',background:'#e94560',color:'#fff',border:'none',borderRadius:4,cursor:'pointer',fontWeight:'bold'}}>+ Nova Preparacao</button>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou codigo..."
          style={{flex:1,padding:10,background:'#16213e',color:'#fff',border:'1px solid #333',borderRadius:4}} />
        <select value={filtroSetor} onChange={e => setFiltroSetor(e.target.value)}
          style={{padding:10,background:'#16213e',color:'#fff',border:'1px solid #333',borderRadius:4}}>
          <option value="todos">Todos os Setores</option>
          {setores.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      {loading ? <p style={{color:'#aaa'}}>Carregando...</p> : (
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'#16213e'}}>
              <th style={{padding:10,textAlign:'left',color:'#aaa',fontSize:12}}>Codigo</th>
              <th style={{padding:10,textAlign:'left',color:'#aaa',fontSize:12}}>Nome</th>
              <th style={{padding:10,textAlign:'center',color:'#aaa',fontSize:12}}>Setor</th>
              <th style={{padding:10,textAlign:'center',color:'#aaa',fontSize:12}}>Ingredientes</th>
              <th style={{padding:10,textAlign:'center',color:'#aaa',fontSize:12}}>Rendimento</th>
              <th style={{padding:10,textAlign:'center',color:'#aaa',fontSize:12}}>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map(prep => (
              <tr key={prep.id} style={{borderBottom:'1px solid #333'}}>
                <td style={{padding:10,color:'#4ecca3',fontFamily:'monospace'}}>{prep.codigo}</td>
                <td style={{padding:10,color:'#fff'}}>{prep.nome}</td>
                <td style={{padding:10,textAlign:'center',color:'#ccc'}}>{prep.setor}</td>
                <td style={{padding:10,textAlign:'center',color:'#ccc'}}>{prep.preparacao_itens?.length || 0}</td>
                <td style={{padding:10,textAlign:'center',color:'#ccc'}}>{prep.rendimento_porcoes || 1} porc.</td>
                <td style={{padding:10,textAlign:'center'}}>
                  <div style={{display:'flex',gap:4,justifyContent:'center'}}>
                    <button onClick={() => abrirFicha(prep)} style={{padding:'4px 10px',background:'#0f3460',color:'#fff',border:'none',borderRadius:4,cursor:'pointer',fontSize:12}}>Ficha</button>
                    <button onClick={() => abrirEdicao(prep)} style={{padding:'4px 10px',background:'#f0a500',color:'#000',border:'none',borderRadius:4,cursor:'pointer',fontSize:12}}>Editar</button>
                    <button onClick={() => desativar(prep.id)} style={{padding:'4px 10px',background:'#e94560',color:'#fff',border:'none',borderRadius:4,cursor:'pointer',fontSize:12}}>Desativar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && filtradas.length === 0 && <p style={{color:'#888',textAlign:'center',padding:24}}>Nenhuma preparacao encontrada.</p>}
      <p style={{color:'#888',fontSize:12,marginTop:12}}>Total: {filtradas.length} preparacoes</p>
    </div>
  );
}


/* ========== MOD CARDAPIOS (Planejamento Semanal) ========== */
function ModCardapios({ empresaId }) {
  const [cardapios, setCardapios] = useState([]);
  const [preparacoesDisp, setPreparacoesDisp] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showGrade, setShowGrade] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nome:'', data_inicio:'', data_fim:'', comensais_planejados:50 });
  const [slots, setSlots] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const turnos = ['cafe_manha','almoco','lanche','jantar','ceia'];
  const turnoLabels = { cafe_manha:'Cafe da Manha', almoco:'Almoco', lanche:'Lanche', jantar:'Jantar', ceia:'Ceia' };

  const carregarCardapios = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('cardapios').select('*, cardapio_slots(id, preparacao_id, turno, data, pcp, comensais, preparacoes:preparacao_id(nome,codigo))').eq('empresa_id', empresaId).order('created_at', { ascending: false });
    if (data) setCardapios(data);
    setLoading(false);
  }, [empresaId]);

  const carregarPreparacoes = useCallback(async () => {
    const { data } = await supabase.from('preparacoes').select('id, nome, codigo').eq('empresa_id', empresaId).eq('ativo', true).order('nome');
    if (data) setPreparacoesDisp(data);
  }, [empresaId]);

  useEffect(() => { carregarCardapios(); carregarPreparacoes(); }, [carregarCardapios, carregarPreparacoes]);

  const salvarCardapio = async () => {
    setSaving(true); setMsg('');
    try {
      if (editId) {
        const { error } = await supabase.from('cardapios').update({ nome: form.nome, data_inicio: form.data_inicio || null, data_fim: form.data_fim || null, comensais_planejados: form.comensais_planejados }).eq('id', editId);
        if (error) throw error;
        setMsg('Cardapio atualizado!');
      } else {
        const { data, error } = await supabase.from('cardapios').insert({ empresa_id: empresaId, nome: form.nome, data_inicio: form.data_inicio || null, data_fim: form.data_fim || null, comensais_planejados: form.comensais_planejados, status: 'rascunho', ativo: true }).select().single();
        if (error) throw error;
        setMsg('Cardapio criado!');
        setEditId(data.id);
      }
      carregarCardapios();
    } catch(e) { setMsg('Erro: ' + e.message); }
    setSaving(false);
  };

  // Grade functions
  const abrirGrade = (cardapio) => {
    setShowGrade(cardapio);
    carregarSlots(cardapio.id);
    setShowForm(false);
  };

  const carregarSlots = async (cardapioId) => {
    const { data } = await supabase.from('cardapio_slots').select('*, preparacoes:preparacao_id(nome, codigo)').eq('cardapio_id', cardapioId).order('data').order('turno');
    setSlots(data || []);
  };

  const adicionarSlot = async (data, turno) => {
    if (!showGrade) return;
    const { error } = await supabase.from('cardapio_slots').insert({ cardapio_id: showGrade.id, data, turno, pcp: 0, comensais: showGrade.comensais_planejados || 50 });
    if (!error) carregarSlots(showGrade.id);
  };

  const atualizarSlot = async (slotId, field, value) => {
    await supabase.from('cardapio_slots').update({ [field]: value }).eq('id', slotId);
    carregarSlots(showGrade.id);
  };

  const removerSlot = async (slotId) => {
    await supabase.from('cardapio_slots').delete().eq('id', slotId);
    carregarSlots(showGrade.id);
  };

  const novoCardapio = () => {
    setForm({ nome:'', data_inicio:'', data_fim:'', comensais_planejados:50 });
    setEditId(null); setShowForm(true); setShowGrade(null); setMsg('');
  };

  const editarCardapio = (c) => {
    setForm({ nome: c.nome || '', data_inicio: c.data_inicio || '', data_fim: c.data_fim || '', comensais_planejados: c.comensais_planejados || 50 });
    setEditId(c.id); setShowForm(true); setShowGrade(null); setMsg('');
  };

  // Get days between data_inicio and data_fim
  const getDias = () => {
    if (!showGrade?.data_inicio || !showGrade?.data_fim) return [];
    const dias = [];
    const start = new Date(showGrade.data_inicio + 'T12:00:00');
    const end = new Date(showGrade.data_fim + 'T12:00:00');
    const current = new Date(start);
    while (current <= end) {
      dias.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dias;
  };

  const diasSemana = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];
  const formatDia = (d) => {
    const dt = new Date(d + 'T12:00:00');
    return diasSemana[dt.getDay()] + ' ' + d.split('-')[2] + '/' + d.split('-')[1];
  };

  // === GRADE VIEW ===
  if (showGrade) {
    const dias = getDias();
    return (
      <div style={{padding:24}}>
        <button onClick={() => { setShowGrade(null); setSlots([]); }} style={{marginBottom:16,padding:'6px 16px',background:'#555',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}>Voltar</button>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div>
            <h2 style={{color:'#e94560',margin:0}}>{showGrade.nome || 'Cardapio'}</h2>
            <p style={{color:'#aaa',margin:'4px 0'}}>
              {showGrade.data_inicio} a {showGrade.data_fim} | Comensais: {showGrade.comensais_planejados} | Status: {showGrade.status}
            </p>
          </div>
          <button onClick={() => editarCardapio(showGrade)} style={{padding:'6px 16px',background:'#0f3460',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}>Editar</button>
        </div>

        {dias.length === 0 ? (
          <p style={{color:'#f0a500'}}>Defina data_inicio e data_fim para ver a grade semanal.</p>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',minWidth:800}}>
              <thead>
                <tr style={{background:'#16213e'}}>
                  <th style={{padding:8,textAlign:'left',color:'#aaa',fontSize:12,width:100}}>Turno</th>
                  {dias.map(d => <th key={d} style={{padding:8,textAlign:'center',color:'#aaa',fontSize:11,minWidth:120}}>{formatDia(d)}</th>)}
                </tr>
              </thead>
              <tbody>
                {turnos.map(turno => (
                  <tr key={turno} style={{borderBottom:'1px solid #333'}}>
                    <td style={{padding:8,color:'#e94560',fontWeight:'bold',fontSize:12}}>{turnoLabels[turno]}</td>
                    {dias.map(dia => {
                      const cellSlots = slots.filter(s => s.data === dia && s.turno === turno);
                      return (
                        <td key={dia} style={{padding:4,verticalAlign:'top',minHeight:60}}>
                          {cellSlots.map(slot => (
                            <div key={slot.id} style={{background:'#1a1a2e',padding:4,borderRadius:4,marginBottom:2,fontSize:11}}>
                              <div style={{color:'#4ecca3'}}>{slot.preparacoes?.nome || 'Sem prep.'}</div>
                              <div style={{display:'flex',gap:4,marginTop:2}}>
                                <select value={slot.preparacao_id || ''} onChange={e => atualizarSlot(slot.id, 'preparacao_id', e.target.value || null)} style={{flex:1,padding:2,background:'#0f3460',color:'#fff',border:'1px solid #333',borderRadius:2,fontSize:10}}>
                                  <option value="">-</option>
                                  {preparacoesDisp.map(p => <option key={p.id} value={p.id}>{p.codigo}</option>)}
                                </select>
                                <button onClick={() => removerSlot(slot.id)} style={{padding:'0 4px',background:'#e94560',color:'#fff',border:'none',borderRadius:2,fontSize:10,cursor:'pointer'}}>x</button>
                              </div>
                              <input type="number" value={slot.pcp || 0} onChange={e => atualizarSlot(slot.id, 'pcp', parseFloat(e.target.value) || 0)} style={{width:'100%',padding:2,background:'#0f3460',color:'#fff',border:'1px solid #333',borderRadius:2,fontSize:10,marginTop:2}} placeholder="PCP" />
                            </div>
                          ))}
                          <button onClick={() => adicionarSlot(dia, turno)} style={{width:'100%',padding:2,background:'#16213e',color:'#4ecca3',border:'1px dashed #333',borderRadius:2,fontSize:10,cursor:'pointer',marginTop:2}}>+</button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p style={{color:'#888',fontSize:11,marginTop:12}}>Total de itens: {slots.length} | Clique + para adicionar preparacao ao turno/dia</p>
      </div>
    );
  }

  // === FORM VIEW ===
  if (showForm) {
    return (
      <div style={{padding:24}}>
        <button onClick={() => { setShowForm(false); setEditId(null); setMsg(''); }} style={{marginBottom:16,padding:'6px 16px',background:'#555',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}>Voltar</button>
        <h2 style={{color:'#e94560',marginBottom:16}}>{editId ? 'Editar Cardapio' : 'Novo Cardapio'}</h2>
        {msg && <p style={{color: msg.includes('Erro') ? '#e94560' : '#4ecca3',marginBottom:12}}>{msg}</p>}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,maxWidth:600}}>
          <div style={{gridColumn:'1/3'}}>
            <label style={{color:'#aaa',fontSize:12,display:'block',marginBottom:4}}>Nome do Cardapio *</label>
            <input value={form.nome} onChange={e => setForm({...form, nome:e.target.value})} style={{width:'100%',padding:10,background:'#16213e',color:'#fff',border:'1px solid #333',borderRadius:4}} placeholder="Ex: Semana 1 - Marco" />
          </div>
          <div>
            <label style={{color:'#aaa',fontSize:12,display:'block',marginBottom:4}}>Data Inicio</label>
            <input type="date" value={form.data_inicio} onChange={e => setForm({...form, data_inicio:e.target.value})} style={{width:'100%',padding:10,background:'#16213e',color:'#fff',border:'1px solid #333',borderRadius:4}} />
          </div>
          <div>
            <label style={{color:'#aaa',fontSize:12,display:'block',marginBottom:4}}>Data Fim</label>
            <input type="date" value={form.data_fim} onChange={e => setForm({...form, data_fim:e.target.value})} style={{width:'100%',padding:10,background:'#16213e',color:'#fff',border:'1px solid #333',borderRadius:4}} />
          </div>
          <div>
            <label style={{color:'#aaa',fontSize:12,display:'block',marginBottom:4}}>Comensais Planejados</label>
            <input type="number" value={form.comensais_planejados} onChange={e => setForm({...form, comensais_planejados: parseInt(e.target.value) || 0})} style={{width:'100%',padding:10,background:'#16213e',color:'#fff',border:'1px solid #333',borderRadius:4}} />
          </div>
        </div>
        <div style={{marginTop:16,display:'flex',gap:8}}>
          <button onClick={salvarCardapio} disabled={saving || !form.nome} style={{padding:'10px 24px',background: !form.nome ? '#555' : '#e94560',color:'#fff',border:'none',borderRadius:4,cursor: !form.nome ? 'default' : 'pointer',fontWeight:'bold'}}>{saving ? 'Salvando...' : (editId ? 'Atualizar' : 'Criar Cardapio')}</button>
          {editId && <button onClick={() => { const c = cardapios.find(x=>x.id===editId); if(c) abrirGrade(c); }} style={{padding:'10px 24px',background:'#0f3460',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}>Ver Grade</button>}
        </div>
      </div>
    );
  }

  // === LIST VIEW ===
  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h2 style={{color:'#e94560',margin:0}}>Cardapios / Planejamento</h2>
        <button onClick={novoCardapio} style={{padding:'8px 20px',background:'#e94560',color:'#fff',border:'none',borderRadius:4,cursor:'pointer',fontWeight:'bold'}}>+ Novo Cardapio</button>
      </div>
      {loading ? <p style={{color:'#aaa'}}>Carregando...</p> : (
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'#16213e'}}>
              <th style={{padding:10,textAlign:'left',color:'#aaa',fontSize:12}}>Nome</th>
              <th style={{padding:10,textAlign:'center',color:'#aaa',fontSize:12}}>Periodo</th>
              <th style={{padding:10,textAlign:'center',color:'#aaa',fontSize:12}}>Comensais</th>
              <th style={{padding:10,textAlign:'center',color:'#aaa',fontSize:12}}>Itens</th>
              <th style={{padding:10,textAlign:'center',color:'#aaa',fontSize:12}}>Status</th>
              <th style={{padding:10,textAlign:'center',color:'#aaa',fontSize:12}}>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {cardapios.map(c => (
              <tr key={c.id} style={{borderBottom:'1px solid #333'}}>
                <td style={{padding:10,color:'#fff'}}>{c.nome || 'Sem nome'}</td>
                <td style={{padding:10,textAlign:'center',color:'#ccc',fontSize:12}}>{c.data_inicio || '-'} a {c.data_fim || '-'}</td>
                <td style={{padding:10,textAlign:'center',color:'#ccc'}}>{c.comensais_planejados}</td>
                <td style={{padding:10,textAlign:'center',color:'#ccc'}}>{c.cardapio_slots?.length || 0}</td>
                <td style={{padding:10,textAlign:'center'}}><span style={{padding:'2px 8px',borderRadius:4,fontSize:11,background: c.status === 'aprovado' ? '#4ecca3' : c.status === 'enviado' ? '#0f3460' : '#f0a500',color: c.status === 'aprovado' ? '#000' : '#fff'}}>{c.status}</span></td>
                <td style={{padding:10,textAlign:'center'}}>
                  <div style={{display:'flex',gap:4,justifyContent:'center'}}>
                    <button onClick={() => abrirGrade(c)} style={{padding:'4px 10px',background:'#0f3460',color:'#fff',border:'none',borderRadius:4,cursor:'pointer',fontSize:12}}>Grade</button>
                    <button onClick={() => editarCardapio(c)} style={{padding:'4px 10px',background:'#f0a500',color:'#000',border:'none',borderRadius:4,cursor:'pointer',fontSize:12}}>Editar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && cardapios.length === 0 && <p style={{color:'#888',textAlign:'center',padding:24}}>Nenhum cardapio encontrado.</p>}
      <p style={{color:'#888',fontSize:12,marginTop:12}}>Total: {cardapios.length} cardapios</p>
    </div>
  );
}


/* ========== ORDENS DE PRODUCAO ========== */
function ModOrdensProducao({ empresaId }) {
  const [ordens, setOrdens] = useState([]);
  const [cardapios, setCardapios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [detailItens, setDetailItens] = useState([]);
  const [form, setForm] = useState({ data: "", cardapio_id: "" });
  const [msg, setMsg] = useState("");
  const turnoLabels = { cafe_manha: "Cafe da Manha", almoco: "Almoco", lanche: "Lanche", jantar: "Jantar", ceia: "Ceia" };
  const statusColors = { rascunho: "#f59e0b", confirmada: "#10b981", executada: "#6366f1" };
  useEffect(() => { if (empresaId) carregarDados(); }, [empresaId]);
  const carregarDados = async () => {
    setLoading(true);
    const { data: ords } = await supabase.from("ordens_producao").select("*, cardapios:cardapio_id(nome), ordens_producao_itens(id)").eq("empresa_id", empresaId).order("data", { ascending: false });
    setOrdens(ords || []);
    const { data: cards } = await supabase.from("cardapios").select("id, nome, data_inicio, data_fim, comensais_planejados").eq("empresa_id", empresaId).eq("ativo", true).order("created_at", { ascending: false });
    setCardapios(cards || []);
    setLoading(false);
  };
  const carregarItens = async (ordemId) => {
    const { data } = await supabase.from("ordens_producao_itens").select("*, preparacoes:preparacao_id(nome, codigo, setor)").eq("ordem_id", ordemId).order("turno").order("created_at");
    setDetailItens(data || []);
  };
  const gerarOrdem = async () => {
    if (!form.data) { setMsg("Informe a data"); return; }
    setMsg("");
    const insertData = { empresa_id: empresaId, data: form.data };
    if (form.cardapio_id) {
      insertData.cardapio_id = form.cardapio_id;
      const cardapio = cardapios.find(c => c.id === form.cardapio_id);
      const { data: slots } = await supabase.from("cardapio_slots").select("*, preparacoes:preparacao_id(nome, codigo, setor)").eq("cardapio_id", form.cardapio_id);
      const { data: ordem, error } = await supabase.from("ordens_producao").insert(insertData).select().single();
      if (error) { setMsg("Erro: " + error.message); return; }
      if (slots && slots.length > 0) {
        const itens = slots.filter(s => s.preparacao_id).map(slot => ({
          ordem_id: ordem.id, preparacao_id: slot.preparacao_id,
          turno: slot.turno || "almoco", setor: slot.preparacoes?.setor || null,
          comensais: slot.comensais || cardapio?.comensais_planejados || 0,
          pcp: slot.pcp || 0,
          qbt: ((slot.comensais || cardapio?.comensais_planejados || 0) * (slot.pcp || 0)).toFixed(3) * 1,
          cardapio_slot_id: slot.id
        }));
        if (itens.length > 0) { await supabase.from("ordens_producao_itens").insert(itens); }
      }
      setMsg("Ordem gerada com " + (slots?.filter(s => s.preparacao_id).length || 0) + " itens!");
    } else {
      const { error } = await supabase.from("ordens_producao").insert(insertData);
      if (error) { setMsg("Erro: " + error.message); return; }
      setMsg("Ordem criada (vazia)!");
    }
    setShowForm(false); setForm({ data: "", cardapio_id: "" }); carregarDados();
  };
  const atualizarStatus = async (ordemId, novoStatus) => {
    await supabase.from("ordens_producao").update({ status: novoStatus }).eq("id", ordemId);
    carregarDados();
    if (showDetail?.id === ordemId) setShowDetail({ ...showDetail, status: novoStatus });
  };
  const abrirDetalhe = (ordem) => { setShowDetail(ordem); carregarItens(ordem.id); setShowForm(false); };
  const atualizarItem = async (itemId, field, value) => {
    const updates = { [field]: value };
    const item = detailItens.find(i => i.id === itemId);
    if (item) {
      const c = field === "comensais" ? Number(value) : item.comensais;
      const p = field === "pcp" ? Number(value) : item.pcp;
      updates.qbt = (c * p).toFixed(3) * 1;
    }
    await supabase.from("ordens_producao_itens").update(updates).eq("id", itemId);
    carregarItens(showDetail.id);
  };
  const removerItem = async (itemId) => {
    await supabase.from("ordens_producao_itens").delete().eq("id", itemId);
    carregarItens(showDetail.id);
  };
  if (loading) return (<div style={{padding:40,color:"#888"}}>Carregando ordens...</div>);
  if (showDetail) {
    const itensByTurno = {};
    detailItens.forEach(item => { const t = item.turno || "sem_turno"; if (!itensByTurno[t]) itensByTurno[t] = []; itensByTurno[t].push(item); });
    return (
      <div style={{padding:20}}>
        <button onClick={() => { setShowDetail(null); carregarDados(); }} style={{padding:"8px 16px",background:"#4361ee",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",marginBottom:16}}>Voltar</button>
        <h2 style={{color:"#e94560",margin:"0 0 8px"}}>Ordem de Producao - {showDetail.data}</h2>
        <p style={{color:"#888",fontSize:13,margin:"0 0 8px"}}>{showDetail.cardapios?.nome ? "Cardapio: " + showDetail.cardapios.nome + " | " : ""}Status: <span style={{background:statusColors[showDetail.status]||"#666",color:"#fff",padding:"2px 8px",borderRadius:4,fontSize:11}}>{showDetail.status}</span></p>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {showDetail.status === "rascunho" && (<button onClick={() => atualizarStatus(showDetail.id, "confirmada")} style={{padding:"6px 12px",background:"#10b981",color:"#fff",border:"none",borderRadius:4,cursor:"pointer",fontSize:12}}>Confirmar</button>)}
          {showDetail.status === "confirmada" && (<button onClick={() => atualizarStatus(showDetail.id, "executada")} style={{padding:"6px 12px",background:"#6366f1",color:"#fff",border:"none",borderRadius:4,cursor:"pointer",fontSize:12}}>Marcar Executada</button>)}
        </div>
        {Object.keys(itensByTurno).length === 0 ? (<p style={{color:"#888"}}>Nenhum item nesta ordem.</p>) : (
          Object.entries(itensByTurno).map(([turno, itens]) => (
            <div key={turno} style={{marginBottom:16}}>
              <h3 style={{color:"#4ecca3",fontSize:14,margin:"0 0 8px",textTransform:"capitalize"}}>{turnoLabels[turno] || turno}</h3>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr style={{background:"#16213e"}}><th style={{padding:6,textAlign:"left",color:"#4ecca3"}}>Preparacao</th><th style={{padding:6,textAlign:"left",color:"#4ecca3"}}>Setor</th><th style={{padding:6,textAlign:"center",color:"#4ecca3"}}>Comensais</th><th style={{padding:6,textAlign:"center",color:"#4ecca3"}}>PCP</th><th style={{padding:6,textAlign:"center",color:"#4ecca3"}}>QBT</th><th style={{padding:6,textAlign:"center",color:"#4ecca3"}}>Obs</th><th style={{padding:6,textAlign:"center",color:"#4ecca3"}}>Acoes</th></tr></thead>
                <tbody>{itens.map(item => (
                  <tr key={item.id} style={{borderBottom:"1px solid #1a1a2e"}}>
                    <td style={{padding:6}}>{item.preparacoes?.codigo} - {item.preparacoes?.nome || "Sem prep"}</td>
                    <td style={{padding:6,textTransform:"capitalize"}}>{item.setor || "-"}</td>
                    <td style={{padding:6,textAlign:"center"}}><input type="number" value={item.comensais||0} onChange={e => atualizarItem(item.id,"comensais",e.target.value)} style={{width:60,padding:4,background:"#16213e",color:"#fff",border:"1px solid #333",borderRadius:4,textAlign:"center"}} /></td>
                    <td style={{padding:6,textAlign:"center"}}><input type="number" value={item.pcp||0} step="0.001" onChange={e => atualizarItem(item.id,"pcp",e.target.value)} style={{width:70,padding:4,background:"#16213e",color:"#fff",border:"1px solid #333",borderRadius:4,textAlign:"center"}} /></td>
                    <td style={{padding:6,textAlign:"center",fontWeight:"bold",color:"#4ecca3"}}>{((item.comensais||0)*(item.pcp||0)).toFixed(3)}</td>
                    <td style={{padding:6,textAlign:"center"}}><input type="text" value={item.observacao||""} onChange={e => atualizarItem(item.id,"observacao",e.target.value)} placeholder="..." style={{width:80,padding:4,background:"#16213e",color:"#fff",border:"1px solid #333",borderRadius:4,fontSize:11}} /></td>
                    <td style={{padding:6,textAlign:"center"}}><button onClick={() => removerItem(item.id)} style={{background:"#e94560",color:"#fff",border:"none",borderRadius:4,padding:"2px 8px",cursor:"pointer",fontSize:11}}>x</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ))
        )}
        <p style={{color:"#888",fontSize:11,marginTop:12}}>Total: {detailItens.length} itens</p>
      </div>
    );
  }
  if (showForm) {
    return (
      <div style={{padding:20}}>
        <button onClick={() => setShowForm(false)} style={{padding:"8px 16px",background:"#4361ee",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",marginBottom:16}}>Voltar</button>
        <h2 style={{color:"#e94560",margin:"0 0 16px"}}>Gerar Ordem de Producao</h2>
        {msg && <p style={{color:msg.startsWith("Erro")?"#e94560":"#4ecca3",fontSize:13,marginBottom:8}}>{msg}</p>}
        <div style={{marginBottom:12}}>
          <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Data da Producao *</label>
          <input type="date" value={form.data} onChange={e => setForm({...form, data: e.target.value})} style={{width:250,padding:10,background:"#16213e",color:"#fff",border:"1px solid #333",borderRadius:8}} />
        </div>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Cardapio (opcional)</label>
          <select value={form.cardapio_id} onChange={e => setForm({...form, cardapio_id: e.target.value})} style={{width:400,padding:10,background:"#16213e",color:"#fff",border:"1px solid #333",borderRadius:8}}>
            <option value="">Sem cardapio (ordem vazia)</option>
            {cardapios.map(c => (<option key={c.id} value={c.id}>{c.nome} ({c.data_inicio} a {c.data_fim})</option>))}
          </select>
        </div>
        <button onClick={gerarOrdem} style={{padding:"10px 24px",background:"#e94560",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:"bold"}}>Gerar Ordem</button>
      </div>
    );
  }
  return (
    <div style={{padding:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{color:"#e94560",margin:0}}>Ordens de Producao</h2>
        <button onClick={() => { setShowForm(true); setMsg(""); }} style={{padding:"10px 20px",background:"#e94560",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:"bold"}}>+ Gerar Ordem</button>
      </div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr style={{background:"#16213e"}}><th style={{padding:8,textAlign:"left",color:"#4ecca3"}}>Data</th><th style={{padding:8,textAlign:"left",color:"#4ecca3"}}>Cardapio</th><th style={{padding:8,textAlign:"center",color:"#4ecca3"}}>Itens</th><th style={{padding:8,textAlign:"center",color:"#4ecca3"}}>Status</th><th style={{padding:8,textAlign:"center",color:"#4ecca3"}}>Acoes</th></tr></thead>
        <tbody>
          {ordens.length === 0 ? (<tr><td colSpan={5} style={{textAlign:"center",padding:20,color:"#888"}}>Nenhuma ordem encontrada.</td></tr>) : ordens.map(o => (
            <tr key={o.id} style={{borderBottom:"1px solid #1a1a2e"}}>
              <td style={{padding:8}}>{o.data}</td>
              <td style={{padding:8}}>{o.cardapios?.nome || "-"}</td>
              <td style={{padding:8,textAlign:"center"}}>{o.ordens_producao_itens?.length || 0}</td>
              <td style={{padding:8,textAlign:"center"}}><span style={{background:statusColors[o.status]||"#666",color:"#fff",padding:"2px 10px",borderRadius:4,fontSize:11}}>{o.status}</span></td>
              <td style={{padding:8,textAlign:"center"}}><button onClick={() => abrirDetalhe(o)} style={{padding:"4px 12px",background:"#4361ee",color:"#fff",border:"none",borderRadius:4,cursor:"pointer",fontSize:11}}>Detalhar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{color:"#888",fontSize:11,marginTop:8}}>Total: {ordens.length} ordens</p>
    </div>
  );
}


/* ========== ESTOQUE ========== */
function ModEstoque({ empresaId }) {
  const [tab, setTab] = useState("saldos");
  const [saldos, setSaldos] = useState([]);
  const [entradas, setEntradas] = useState([]);
  const [ingredientes, setIngredientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ingrediente_id:"", qtd:"", custo_unitario:"", fornecedor:"", nota_fiscal:"", data:"" });
  const [msg, setMsg] = useState("");
  useEffect(() => { if (empresaId) carregarDados(); }, [empresaId]);
  const carregarDados = async () => {
    setLoading(true);
    const { data: sal } = await supabase.from("estoque_atual").select("*, ingredientes:ingrediente_id(nome, codigo, unidade)").eq("empresa_id", empresaId).order("ingredientes(nome)");
    setSaldos(sal || []);
    const { data: ent } = await supabase.from("entradas_estoque").select("*, ingredientes:ingrediente_id(nome, codigo, unidade)").eq("empresa_id", empresaId).order("data", { ascending: false }).limit(100);
    setEntradas(ent || []);
    const { data: ing } = await supabase.from("ingredientes").select("id, nome, codigo, unidade").eq("empresa_id", empresaId).eq("ativo", true).order("nome");
    setIngredientes(ing || []);
    setLoading(false);
  };
  const registrarEntrada = async () => {
    if (!form.ingrediente_id || !form.qtd || Number(form.qtd) <= 0) { setMsg("Preencha ingrediente e quantidade"); return; }
    setMsg("");
    const qtd = Number(form.qtd);
    const custoUnit = Number(form.custo_unitario) || 0;
    const { error } = await supabase.from("entradas_estoque").insert({
      empresa_id: empresaId, ingrediente_id: form.ingrediente_id,
      qtd, custo_unitario: custoUnit, fornecedor: form.fornecedor || null,
      nota_fiscal: form.nota_fiscal || null, data: form.data || new Date().toISOString().split("T")[0]
    });
    if (error) { setMsg("Erro: " + error.message); return; }
    const { data: atual } = await supabase.from("estoque_atual")
      .select("*").eq("empresa_id", empresaId).eq("ingrediente_id", form.ingrediente_id).single();
    if (atual) {
      const oldQtd = Number(atual.qtd_disponivel) || 0;
      const oldCMP = Number(atual.custo_medio_ponderado) || 0;
      const newQtd = oldQtd + qtd;
      const newCMP = newQtd > 0 ? ((oldQtd * oldCMP) + (qtd * custoUnit)) / newQtd : custoUnit;
      await supabase.from("estoque_atual").update({ qtd_disponivel: newQtd, custo_medio_ponderado: Math.round(newCMP * 100) / 100, atualizado_em: new Date().toISOString() })
        .eq("id", atual.id);
    } else {
      await supabase.from("estoque_atual").insert({
        empresa_id: empresaId, ingrediente_id: form.ingrediente_id,
        qtd_disponivel: qtd, custo_medio_ponderado: custoUnit
      });
    }
    setMsg("Entrada registrada! CMP atualizado.");
    setForm({ ingrediente_id:"", qtd:"", custo_unitario:"", fornecedor:"", nota_fiscal:"", data:"" });
    setShowForm(false);
    carregarDados();
  };
  if (loading) return (<div style={{padding:40,color:"#888"}}>Carregando estoque...</div>);
  if (showForm) {
    return (
      <div style={{padding:20}}>
        <button onClick={() => setShowForm(false)} style={{padding:"8px 16px",background:"#4361ee",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",marginBottom:16}}>Voltar</button>
        <h2 style={{color:"#e94560",margin:"0 0 16px"}}>Nova Entrada de Estoque</h2>
        {msg && <p style={{color:msg.startsWith("Erro")?"#e94560":"#4ecca3",fontSize:13,marginBottom:8}}>{msg}</p>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,maxWidth:600}}>
          <div style={{gridColumn:"1/3"}}>
            <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Ingrediente *</label>
            <select value={form.ingrediente_id} onChange={e => setForm({...form, ingrediente_id:e.target.value})} style={{width:"100%",padding:10,background:"#16213e",color:"#fff",border:"1px solid #333",borderRadius:8}}>
              <option value="">Selecione...</option>
              {ingredientes.map(i => (<option key={i.id} value={i.id}>{i.codigo} - {i.nome} ({i.unidade})</option>))}
            </select>
          </div>
          <div>
            <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Quantidade *</label>
            <input type="number" value={form.qtd} onChange={e => setForm({...form, qtd:e.target.value})} step="0.01" placeholder="0.00" style={{width:"100%",padding:10,background:"#16213e",color:"#fff",border:"1px solid #333",borderRadius:8,boxSizing:"border-box"}} />
          </div>
          <div>
            <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Custo Unitario (R$)</label>
            <input type="number" value={form.custo_unitario} onChange={e => setForm({...form, custo_unitario:e.target.value})} step="0.01" placeholder="0.00" style={{width:"100%",padding:10,background:"#16213e",color:"#fff",border:"1px solid #333",borderRadius:8,boxSizing:"border-box"}} />
          </div>
          <div>
            <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Data</label>
            <input type="date" value={form.data} onChange={e => setForm({...form, data:e.target.value})} style={{width:"100%",padding:10,background:"#16213e",color:"#fff",border:"1px solid #333",borderRadius:8,boxSizing:"border-box"}} />
          </div>
          <div>
            <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Fornecedor</label>
            <input type="text" value={form.fornecedor} onChange={e => setForm({...form, fornecedor:e.target.value})} placeholder="Nome do fornecedor" style={{width:"100%",padding:10,background:"#16213e",color:"#fff",border:"1px solid #333",borderRadius:8,boxSizing:"border-box"}} />
          </div>
          <div>
            <label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Nota Fiscal</label>
            <input type="text" value={form.nota_fiscal} onChange={e => setForm({...form, nota_fiscal:e.target.value})} placeholder="Numero NF" style={{width:"100%",padding:10,background:"#16213e",color:"#fff",border:"1px solid #333",borderRadius:8,boxSizing:"border-box"}} />
          </div>
        </div>
        <button onClick={registrarEntrada} style={{marginTop:16,padding:"10px 24px",background:"#e94560",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:"bold"}}>Registrar Entrada</button>
      </div>
    );
  }
  return (
    <div style={{padding:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{color:"#e94560",margin:0}}>Estoque</h2>
        <button onClick={() => { setShowForm(true); setMsg(""); }} style={{padding:"10px 20px",background:"#e94560",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:"bold"}}>+ Nova Entrada</button>
      </div>
      {msg && <p style={{color:"#4ecca3",fontSize:13,marginBottom:8}}>{msg}</p>}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <button onClick={() => setTab("saldos")} style={{padding:"8px 16px",background:tab==="saldos"?"#4361ee":"#16213e",color:"#fff",border:"1px solid #333",borderRadius:6,cursor:"pointer"}}>Saldos Atuais</button>
        <button onClick={() => setTab("entradas")} style={{padding:"8px 16px",background:tab==="entradas"?"#4361ee":"#16213e",color:"#fff",border:"1px solid #333",borderRadius:6,cursor:"pointer"}}>Entradas</button>
      </div>
      {tab === "saldos" && (
        <div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:"#16213e"}}>
              <th style={{padding:8,textAlign:"left",color:"#4ecca3"}}>Ingrediente</th>
              <th style={{padding:8,textAlign:"center",color:"#4ecca3"}}>Qtd Disponivel</th>
              <th style={{padding:8,textAlign:"center",color:"#4ecca3"}}>Unidade</th>
              <th style={{padding:8,textAlign:"center",color:"#4ecca3"}}>CMP (R$)</th>
              <th style={{padding:8,textAlign:"center",color:"#4ecca3"}}>Valor Total</th>
              <th style={{padding:8,textAlign:"center",color:"#4ecca3"}}>Atualizado</th>
            </tr></thead>
            <tbody>
              {saldos.length === 0 ? (<tr><td colSpan={6} style={{textAlign:"center",padding:20,color:"#888"}}>Nenhum saldo de estoque.</td></tr>) :
                saldos.map(s => (
                  <tr key={s.id} style={{borderBottom:"1px solid #1a1a2e"}}>
                    <td style={{padding:8}}>{s.ingredientes?.codigo} - {s.ingredientes?.nome}</td>
                    <td style={{padding:8,textAlign:"center",fontWeight:"bold",color: Number(s.qtd_disponivel) <= 0 ? "#e94560" : "#4ecca3"}}>{Number(s.qtd_disponivel).toFixed(2)}</td>
                    <td style={{padding:8,textAlign:"center"}}>{s.ingredientes?.unidade || "-"}</td>
                    <td style={{padding:8,textAlign:"center"}}>R$ {Number(s.custo_medio_ponderado).toFixed(2)}</td>
                    <td style={{padding:8,textAlign:"center"}}>R$ {(Number(s.qtd_disponivel) * Number(s.custo_medio_ponderado)).toFixed(2)}</td>
                    <td style={{padding:8,textAlign:"center",fontSize:11,color:"#888"}}>{s.atualizado_em ? new Date(s.atualizado_em).toLocaleDateString("pt-BR") : "-"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <p style={{color:"#888",fontSize:11,marginTop:8}}>Total: {saldos.length} itens em estoque</p>
        </div>
      )}
      {tab === "entradas" && (
        <div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:"#16213e"}}>
              <th style={{padding:8,textAlign:"left",color:"#4ecca3"}}>Data</th>
              <th style={{padding:8,textAlign:"left",color:"#4ecca3"}}>Ingrediente</th>
              <th style={{padding:8,textAlign:"center",color:"#4ecca3"}}>Qtd</th>
              <th style={{padding:8,textAlign:"center",color:"#4ecca3"}}>Custo Unit</th>
              <th style={{padding:8,textAlign:"center",color:"#4ecca3"}}>Total</th>
              <th style={{padding:8,textAlign:"left",color:"#4ecca3"}}>Fornecedor</th>
              <th style={{padding:8,textAlign:"left",color:"#4ecca3"}}>NF</th>
            </tr></thead>
            <tbody>
              {entradas.length === 0 ? (<tr><td colSpan={7} style={{textAlign:"center",padding:20,color:"#888"}}>Nenhuma entrada registrada.</td></tr>) :
                entradas.map(e => (
                  <tr key={e.id} style={{borderBottom:"1px solid #1a1a2e"}}>
                    <td style={{padding:8}}>{e.data}</td>
                    <td style={{padding:8}}>{e.ingredientes?.codigo} - {e.ingredientes?.nome}</td>
                    <td style={{padding:8,textAlign:"center"}}>{Number(e.qtd).toFixed(2)}</td>
                    <td style={{padding:8,textAlign:"center"}}>R$ {Number(e.custo_unitario).toFixed(2)}</td>
                    <td style={{padding:8,textAlign:"center",fontWeight:"bold"}}>R$ {(Number(e.qtd) * Number(e.custo_unitario)).toFixed(2)}</td>
                    <td style={{padding:8}}>{e.fornecedor || "-"}</td>
                    <td style={{padding:8}}>{e.nota_fiscal || "-"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <p style={{color:"#888",fontSize:11,marginTop:8}}>Total: {entradas.length} entradas</p>
        </div>
      )}
    </div>
  );
}

function ModCompras({ empresaId }) {
  const [listas, setListas] = useState([]);
  const [view, setView] = useState('list');
  const [listaAtual, setListaAtual] = useState(null);
  const [itens, setItens] = useState([]);
  const [ordensConfirmadas, setOrdensConfirmadas] = useState([]);
  const [ordemSelecionada, setOrdemSelecionada] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => { carregarListas(); carregarOrdensConfirmadas(); }, []);

  async function carregarListas() {
    setLoading(true);
    const { data } = await supabase.from('listas_compra').select('*').eq('empresa_id', empresaId).order('gerada_em', { ascending: false });
    setListas(data || []);
    setLoading(false);
  }

  async function carregarOrdensConfirmadas() {
    const { data } = await supabase.from('ordens_producao').select('id, data, status, cardapio_id').eq('empresa_id', empresaId).eq('status', 'confirmada');
    setOrdensConfirmadas(data || []);
  }

  async function gerarLista() {
    if (!ordemSelecionada) { setMsg('Selecione uma ordem de producao'); return; }
    setMsg('Gerando lista...');
    const { data: ordemItens } = await supabase.from('ordens_producao_itens').select('preparacao_id, qbt').eq('ordem_id', ordemSelecionada);
    if (!ordemItens || ordemItens.length === 0) { setMsg('Ordem sem itens'); return; }
    const prepIds = [...new Set(ordemItens.map(o => o.preparacao_id))];
    const { data: prepItens } = await supabase.from('preparacao_itens').select('preparacao_id, ingrediente_id, fc').in('preparacao_id', prepIds);
    const ingredMap = {};
    for (const oi of ordemItens) {
      const fichaItens = (prepItens || []).filter(pi => pi.preparacao_id === oi.preparacao_id);
      for (const fi of fichaItens) {
        const qbt = parseFloat(oi.qbt) || 0;
        const fc = parseFloat(fi.fc) || 1;
        const qtdBruta = qbt * fc;
        if (!ingredMap[fi.ingrediente_id]) ingredMap[fi.ingrediente_id] = 0;
        ingredMap[fi.ingrediente_id] += qtdBruta;
      }
    }
    const ingredIds = Object.keys(ingredMap);
    if (ingredIds.length === 0) { setMsg('Nenhum ingrediente encontrado nas fichas tecnicas'); return; }
    const { data: estoques } = await supabase.from('estoque_atual').select('ingrediente_id, qtd_disponivel').eq('empresa_id', empresaId).in('ingrediente_id', ingredIds);
    const estoqueMap = {};
    (estoques || []).forEach(e => { estoqueMap[e.ingrediente_id] = parseFloat(e.qtd_disponivel) || 0; });
    const ordemInfo = ordensConfirmadas.find(o => o.id === ordemSelecionada);
    const { data: novaLista, error: errLista } = await supabase.from('listas_compra').insert({ empresa_id: empresaId, nome: 'Lista - Ordem ' + (ordemInfo ? ordemInfo.data : ''), status: 'gerada', ordem_id: ordemSelecionada }).select().single();
    if (errLista) { setMsg('Erro: ' + errLista.message); return; }
    const itensInsert = ingredIds.map(ingId => {
      const qtdNec = Math.round(ingredMap[ingId] * 1000) / 1000;
      const qtdEst = estoqueMap[ingId] || 0;
      const qtdComp = Math.max(0, Math.round((qtdNec - qtdEst) * 1000) / 1000);
      return { lista_id: novaLista.id, ingrediente_id: ingId, qtd_necessaria: qtdNec, qtd_estoque: qtdEst, qtd_comprar: qtdComp, status: qtdComp <= 0 ? 'comprado' : 'pendente' };
    });
    await supabase.from('listas_compra_itens').insert(itensInsert);
    setMsg('Lista gerada com ' + itensInsert.length + ' ingredientes!');
    carregarListas();
  }

  async function abrirDetalhes(lista) {
    setListaAtual(lista);
    setView('detalhes');
    const { data: listaItens } = await supabase.from('listas_compra_itens').select('*, ingredientes(nome, codigo, unidade)').eq('lista_id', lista.id);
    setItens(listaItens || []);
  }

  async function atualizarStatusItem(itemId, novoStatus) {
    await supabase.from('listas_compra_itens').update({ status: novoStatus }).eq('id', itemId);
    const updated = itens.map(i => i.id === itemId ? { ...i, status: novoStatus } : i);
    setItens(updated);
  }

  async function atualizarStatusLista(listaId, novoStatus) {
    await supabase.from('listas_compra').update({ status: novoStatus }).eq('id', listaId);
    setMsg('Status atualizado para ' + novoStatus);
    carregarListas();
    if (listaAtual && listaAtual.id === listaId) setListaAtual({ ...listaAtual, status: novoStatus });
  }

  if (view === 'detalhes' && listaAtual) {
    const pendentes = itens.filter(i => i.status === 'pendente').length;
    const comprados = itens.filter(i => i.status === 'comprado').length;
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <button onClick={() => { setView('list'); setListaAtual(null); }} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 8 }}>\u2190 Voltar</button>
            <h2 style={{ margin: 0 }}>{listaAtual.nome || 'Lista de Compras'}</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {listaAtual.status === 'gerada' && <button onClick={() => atualizarStatusLista(listaAtual.id, 'enviada')} style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Enviar Lista</button>}
            {listaAtual.status === 'enviada' && <button onClick={() => atualizarStatusLista(listaAtual.id, 'parcial')} style={{ padding: '8px 16px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Marcar Parcial</button>}
            {(listaAtual.status === 'enviada' || listaAtual.status === 'parcial') && <button onClick={() => atualizarStatusLista(listaAtual.id, 'concluida')} style={{ padding: '8px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Concluir</button>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ padding: '12px 20px', background: '#fef3c7', borderRadius: 8 }}><strong>{pendentes}</strong> pendentes</div>
          <div style={{ padding: '12px 20px', background: '#dcfce7', borderRadius: 8 }}><strong>{comprados}</strong> comprados</div>
          <div style={{ padding: '12px 20px', background: '#e0e7ff', borderRadius: 8 }}><strong>{itens.length}</strong> total</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: 10, textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Codigo</th>
              <th style={{ padding: 10, textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Ingrediente</th>
              <th style={{ padding: 10, textAlign: 'right', borderBottom: '2px solid #e2e8f0' }}>Necessario</th>
              <th style={{ padding: 10, textAlign: 'right', borderBottom: '2px solid #e2e8f0' }}>Estoque</th>
              <th style={{ padding: 10, textAlign: 'right', borderBottom: '2px solid #e2e8f0' }}>Comprar</th>
              <th style={{ padding: 10, textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Unid</th>
              <th style={{ padding: 10, textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {itens.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: 10, fontFamily: 'monospace', fontSize: 13 }}>{item.ingredientes ? item.ingredientes.codigo : '-'}</td>
                <td style={{ padding: 10 }}>{item.ingredientes ? item.ingredientes.nome : item.ingrediente_id}</td>
                <td style={{ padding: 10, textAlign: 'right', fontWeight: 600 }}>{parseFloat(item.qtd_necessaria).toFixed(3)}</td>
                <td style={{ padding: 10, textAlign: 'right', color: '#6b7280' }}>{parseFloat(item.qtd_estoque).toFixed(3)}</td>
                <td style={{ padding: 10, textAlign: 'right', fontWeight: 700, color: parseFloat(item.qtd_comprar) > 0 ? '#dc2626' : '#16a34a' }}>{parseFloat(item.qtd_comprar).toFixed(3)}</td>
                <td style={{ padding: 10, textAlign: 'center', fontSize: 13 }}>{item.ingredientes ? item.ingredientes.unidade : '-'}</td>
                <td style={{ padding: 10, textAlign: 'center' }}>
                  <select value={item.status} onChange={(e) => atualizarStatusItem(item.id, e.target.value)} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 13 }}>
                    <option value="pendente">Pendente</option>
                    <option value="parcial">Parcial</option>
                    <option value="comprado">Comprado</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Listas de Compras</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={ordemSelecionada} onChange={(e) => setOrdemSelecionada(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}>
            <option value="">Selecione uma ordem...</option>
            {ordensConfirmadas.map(o => <option key={o.id} value={o.id}>{'Ordem ' + o.data + ' (' + o.status + ')'}</option>)}
          </select>
          <button onClick={gerarLista} style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>+ Gerar Lista</button>
        </div>
      </div>
      {msg && <div style={{ padding: 12, background: msg.includes('Erro') ? '#fef2f2' : '#f0fdf4', borderRadius: 8, marginBottom: 16, color: msg.includes('Erro') ? '#dc2626' : '#16a34a' }}>{msg}</div>}
      {loading ? <p>Carregando...</p> :
       listas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
          <p style={{ fontSize: 48 }}>\ud83d\uded2</p>
          <p>Nenhuma lista de compras gerada</p>
          <p style={{ fontSize: 14 }}>Selecione uma ordem confirmada e clique em Gerar Lista</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {listas.map(lista => (
            <div key={lista.id} onClick={() => abrirDetalhes(lista)} style={{ padding: 16, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: 16 }}>{lista.nome || 'Lista de Compras'}</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{'Gerada em: ' + new Date(lista.gerada_em).toLocaleDateString('pt-BR')}</p>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, background: lista.status === 'concluida' ? '#dcfce7' : lista.status === 'enviada' ? '#dbeafe' : lista.status === 'parcial' ? '#fef3c7' : '#f1f5f9', color: lista.status === 'concluida' ? '#16a34a' : lista.status === 'enviada' ? '#2563eb' : lista.status === 'parcial' ? '#d97706' : '#64748b' }}>{lista.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModPlaceholder({title}){return(<div style={{padding:24}}><h2 style={{color:'#e94560'}}>{title}</h2><p style={{color:'#aaa'}}>Modulo em construcao...</p></div>);}

export default function Home() {
  const router = useRouter();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState('dashboard');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data: perfilData } = await supabase
        .from('perfis')
        .select('*, empresas:empresa_id(nome)')
        .eq('id', session.user.id)
        .single();
      if (!perfilData) { setLoading(false); return; }
      setPerfil({ ...perfilData, empresa_nome: perfilData.empresas?.nome || '' });
      setLoading(false);
    })();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',background:'#0a0a23',color:'#fff'}}><p>Carregando...</p></div>;
  if (!perfil) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',background:'#0a0a23',color:'#fff'}}><p>Perfil nao encontrado. <a href="/login" style={{color:'#e94560'}}>Fazer login</a></p></div>;

  const empresaId = perfil.empresa_id;
  const renderModule = () => {
    switch(activeModule) {
      case 'dashboard': return <ModDashboard empresaId={empresaId} />;
      case 'ingredientes': return <ModIngredientes empresaId={empresaId} />;
      case 'preparacoes': return <ModPreparacoes empresaId={empresaId} />;
      case 'cardapios': return <ModCardapios empresaId={empresaId} />;
      case 'ordens': return <ModOrdensProducao empresaId={empresaId} />;
      case 'compras': return <ModCompras empresaId={empresaId} />;
      case 'estoque': return <ModEstoque empresaId={empresaId} />;
      case 'configuracoes': return <ModPlaceholder title="Configuracoes" />;
      default: return <ModDashboard empresaId={empresaId} />;
    }
  };

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#0a0a23',color:'#fff'}}>
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} perfil={perfil} onLogout={handleLogout} />
      <main style={{flex:1,overflow:'auto'}}>{renderModule()}</main>
    </div>
  );
}
