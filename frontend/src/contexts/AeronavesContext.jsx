import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../utils/api'

const AeronavesContext = createContext(null)

export function AeronavesProvider({ children }) {
  const [aeronaves, setAeronaves] = useState([])
  const [erroCarregamento, setErroCarregamento] = useState(null)

  useEffect(() => {
    api.get('/aeronaves')
      .then(setAeronaves)
      .catch(() => setErroCarregamento('Falha ao carregar aeronaves. Verifique sua conexão.'))
  }, [])

  function atualizar(codigo, fn) {
    setAeronaves((prev) => prev.map((a) => (a.codigo === codigo ? fn(a) : a)))
  }

  // ── Aeronaves ──────────────────────────────────────────────────────────

  async function cadastrar(dados) {
    const nova = await api.post('/aeronaves', dados)
    setAeronaves((prev) => {
      const idx = prev.findIndex((a) => a.codigo === nova.codigo)
      if (idx >= 0) {
        const copia = [...prev]
        copia[idx] = nova
        return copia
      }
      return [...prev, nova]
    })
  }

  async function remover(codigo) {
    await api.delete(`/aeronaves/${codigo}`)
    setAeronaves((prev) => prev.filter((a) => a.codigo !== codigo))
  }

  function obter(codigo) {
    return aeronaves.find((a) => a.codigo === codigo)
  }

  // ── Peças ──────────────────────────────────────────────────────────────

  async function adicionarPeca(codigoAeronave, peca) {
    const nova = await api.post(`/aeronaves/${codigoAeronave}/pecas`, peca)
    atualizar(codigoAeronave, (a) => {
      const idx = a.pecas.findIndex((p) => p.nome === nova.nome)
      if (idx >= 0) {
        const novas = [...a.pecas]
        novas[idx] = nova
        return { ...a, pecas: novas }
      }
      return { ...a, pecas: [...a.pecas, nova] }
    })
  }

  async function removerPeca(codigoAeronave, nomePeca) {
    const aeronave = aeronaves.find((a) => a.codigo === codigoAeronave)
    const peca = aeronave?.pecas?.find((p) => p.nome === nomePeca)
    if (peca?.id) await api.delete(`/aeronaves/${codigoAeronave}/pecas/${peca.id}`)
    atualizar(codigoAeronave, (a) => ({ ...a, pecas: a.pecas.filter((p) => p.nome !== nomePeca) }))
  }

  async function atualizarPeca(codigoAeronave, nomePeca, dadosParciais) {
    const aeronave = aeronaves.find((a) => a.codigo === codigoAeronave)
    const peca = aeronave?.pecas?.find((p) => p.nome === nomePeca)
    if (peca?.id) {
      const atualizada = await api.put(`/aeronaves/${codigoAeronave}/pecas/${peca.id}`, dadosParciais)
      atualizar(codigoAeronave, (a) => ({
        ...a,
        pecas: a.pecas.map((p) => (p.id === atualizada.id ? atualizada : p)),
      }))
    }
  }

  // ── Etapas ─────────────────────────────────────────────────────────────

  async function adicionarEtapa(codigoAeronave, etapa) {
    const nova = await api.post(`/aeronaves/${codigoAeronave}/etapas`, etapa)
    atualizar(codigoAeronave, (a) => {
      const idx = a.etapas.findIndex((e) => e.nome === nova.nome)
      if (idx >= 0) {
        const novas = [...a.etapas]
        novas[idx] = nova
        return { ...a, etapas: novas }
      }
      return { ...a, etapas: [...a.etapas, nova] }
    })
  }

  async function removerEtapa(codigoAeronave, nomeEtapa) {
    await api.delete(`/aeronaves/${codigoAeronave}/etapas/${encodeURIComponent(nomeEtapa)}`)
    atualizar(codigoAeronave, (a) => ({ ...a, etapas: a.etapas.filter((e) => e.nome !== nomeEtapa) }))
  }

  async function atualizarEtapa(codigoAeronave, nomeEtapa, dadosParciais) {
    const atualizada = await api.put(
      `/aeronaves/${codigoAeronave}/etapas/${encodeURIComponent(nomeEtapa)}`,
      dadosParciais
    )
    atualizar(codigoAeronave, (a) => ({
      ...a,
      etapas: a.etapas.map((e) => (e.nome === nomeEtapa ? atualizada : e)),
    }))
  }

  // ── Testes ─────────────────────────────────────────────────────────────

  async function adicionarTeste(codigoAeronave, teste) {
    const novo = await api.post(`/aeronaves/${codigoAeronave}/testes`, teste)
    atualizar(codigoAeronave, (a) => {
      const idx = a.testes.findIndex((t) => t.tipo === novo.tipo)
      if (idx >= 0) {
        const novos = [...a.testes]
        novos[idx] = novo
        return { ...a, testes: novos }
      }
      return { ...a, testes: [...a.testes, novo] }
    })
  }

  async function removerTeste(codigoAeronave, tipoTeste) {
    await api.delete(`/aeronaves/${codigoAeronave}/testes/${tipoTeste}`)
    atualizar(codigoAeronave, (a) => ({ ...a, testes: a.testes.filter((t) => t.tipo !== tipoTeste) }))
  }

  // ── Relatório ──────────────────────────────────────────────────────────

  async function definirRelatorio(codigoAeronave, relatorio) {
    const criado = await api.post(`/aeronaves/${codigoAeronave}/relatorio`, relatorio)
    atualizar(codigoAeronave, (a) => ({ ...a, relatorio: criado }))
  }

  async function removerRelatorio(codigoAeronave) {
    await api.delete(`/aeronaves/${codigoAeronave}/relatorio`)
    atualizar(codigoAeronave, (a) => ({ ...a, relatorio: null }))
  }

  const valor = {
    aeronaves,
    erroCarregamento,
    cadastrar,
    remover,
    obter,
    adicionarPeca,
    removerPeca,
    atualizarPeca,
    adicionarEtapa,
    removerEtapa,
    atualizarEtapa,
    adicionarTeste,
    removerTeste,
    definirRelatorio,
    removerRelatorio,
  }

  return <AeronavesContext.Provider value={valor}>{children}</AeronavesContext.Provider>
}

export function useAeronaves() {
  const ctx = useContext(AeronavesContext)
  if (!ctx) throw new Error('useAeronaves deve ser usado dentro de AeronavesProvider')
  return ctx
}
