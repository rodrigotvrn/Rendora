'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

/* ========== SIDEBAR ========== */
function Sidebar({ activeModule, setActiveModule, perfil, onLogout }) {
  const modules = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "ingredientes", label: "Ingredientes", icon: "🌾" },
    { id: "preparacoes", label: "Preparacoes", icon: "🍳" },
    { id: "cardapios", label: "Cardapios", icon: "📅" },
    { id: "ordens", label: "Ordens Producao", icon: "📋" },
    { id: "compras", label: "Compras", icon: "🛒" },
    { id: "estoque", label: "Estoque", icon: "📦" },
    { id: "configuracoes", label: "Configuracoes", icon: "⚙️" }
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
      .select('id, nome, codigo, unidade_padrao, grupo_id')
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
      .select('*, ingredientes(nome, codigo, unidade_padrao)')
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
                  <option key={ing.id} value={ing.id}>{ing.codigo} - {ing.nome} ({ing.unidade_padrao})</option>
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
      case 'cardapios': return <ModPlaceholder title="Cardapios" />;
      case 'ordens': return <ModPlaceholder title="Ordens de Producao" />;
      case 'compras': return <ModPlaceholder title="Compras" />;
      case 'estoque': return <ModPlaceholder title="Estoque" />;
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
