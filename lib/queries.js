import { supabase } from './supabase'

// PREPARACOES
export async function getPreparacoes() {
  const { data, error } = await supabase
    .from('preparacoes')
    .select(`
      *,
      preparacao_itens (
        id, pcb, pcl, fc,
        ingrediente:ingrediente_id (
          id, nome, un, custo, grupo
        )
      )
    `)
    .eq('ativo', true)
    .order('nome')
  if (error) throw error
  return data
}

export async function salvarPreparacao(prep) {
  const { id, preparacao_itens, ...dados } = prep
  if (id) {
    const { data, error } = await supabase
      .from('preparacoes').update(dados).eq('id', id).select().single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('preparacoes').insert(dados).select().single()
    if (error) throw error
    return data
  }
}

export async function salvarItensPreparacao(preparacaoId, itens) {
  await supabase.from('preparacao_itens').delete().eq('preparacao_id', preparacaoId)
  if (!itens || itens.length === 0) return
  const rows = itens.map(it => ({
    preparacao_id: preparacaoId,
    ingrediente_id: it.ingrediente_id || it.iId,
    pcb: it.pcb || it.pc,
    pcl: it.pcl || it.pc,
    fc: it.fc || 1
  }))
  const { error } = await supabase.from('preparacao_itens').insert(rows)
  if (error) throw error
}

export async function deletarPreparacao(id) {
  const { error } = await supabase.from('preparacoes').update({ ativo: false }).eq('id', id)
  if (error) throw error
}

// INSUMOS (ingredientes)
export async function getInsumos() {
  const { data, error } = await supabase
    .from('ingredientes')
    .select('*')
    .order('nome')
  if (error) throw error
  return data
}

export async function salvarInsumo(insumo) {
  const { id, ...dados } = insumo
  if (id) {
    const { data, error } = await supabase
      .from('ingredientes').update(dados).eq('id', id).select().single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('ingredientes').insert(dados).select().single()
    if (error) throw error
    return data
  }
}

// CLIENTES
export async function getClientes() {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nome')
  if (error) throw error
  return data
}

// SERVICOS
export async function getServicos(clienteId) {
  let query = supabase.from('servicos').select('*, clientes(nome)').eq('ativo', true)
  if (clienteId) query = query.eq('cliente_id', clienteId)
  const { data, error } = await query.order('nome')
  if (error) throw error
  return data
}

// CARDAPIOS
export async function getCardapios(mes, ano) {
  const inicio = `${ano}-${String(mes).padStart(2,'0')}-01`
  const fim = `${ano}-${String(mes).padStart(2,'0')}-31`
  const { data, error } = await supabase
    .from('cardapios')
    .select(`
      *,
      servicos (id, nome, tipo, slots, clientes(nome)),
      cardapio_slots (id, slot_nome, pcp, preparacao_id,
        preparacoes (id, nome, categoria)
      )
    `)
    .gte('data', inicio)
    .lte('data', fim)
    .order('data')
  if (error) throw error
  return data
}
