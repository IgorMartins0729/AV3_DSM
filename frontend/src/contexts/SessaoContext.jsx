import React, { createContext, useCallback, useContext, useState } from 'react'
import { NivelPermissao, NIVEIS_DISPONIVEIS, pode as podeAcao } from '../utils/permissoes'
import { api } from '../utils/api'

const TOKEN_CHAVE = 'aerocode:token'
const PAPEL_CHAVE = 'aerocode:sessao'

const SessaoContext = createContext(null)

function lerPapelInicial() {
  try {
    const guardado = localStorage.getItem(PAPEL_CHAVE)
    if (guardado && NIVEIS_DISPONIVEIS.includes(guardado)) return guardado
  } catch {
    // ignore
  }
  return NivelPermissao.ENGENHEIRO
}

export function SessaoProvider({ children }) {
  const [papelAtual, definirPapel] = useState(lerPapelInicial)
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    try {
      const raw = localStorage.getItem('aerocode:usuario')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [erroLogin, setErroLogin] = useState(null)
  const [carregandoLogin, setCarregandoLogin] = useState(false)

  async function login(usuario, senha) {
    setCarregandoLogin(true)
    setErroLogin(null)
    try {
      const data = await api.post('/auth/login', { usuario, senha })
      localStorage.setItem(TOKEN_CHAVE, data.token)
      localStorage.setItem('aerocode:usuario', JSON.stringify(data.funcionario))
      const nivel = data.funcionario.nivelPermissao
      localStorage.setItem(PAPEL_CHAVE, nivel)
      definirPapel(nivel)
      setUsuarioLogado(data.funcionario)
      return data.funcionario
    } catch (err) {
      setErroLogin(err.message ?? 'Erro ao realizar login')
      throw err
    } finally {
      setCarregandoLogin(false)
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_CHAVE)
    localStorage.removeItem('aerocode:usuario')
    localStorage.removeItem(PAPEL_CHAVE)
    setUsuarioLogado(null)
    definirPapel(NivelPermissao.ENGENHEIRO)
  }

  const setPapelAtual = useCallback((novo) => {
    if (NIVEIS_DISPONIVEIS.includes(novo)) {
      definirPapel(novo)
      localStorage.setItem(PAPEL_CHAVE, novo)
    }
  }, [])

  const pode = useCallback((acao) => podeAcao(papelAtual, acao), [papelAtual])

  const valor = {
    papelAtual,
    setPapelAtual,
    pode,
    usuarioLogado,
    login,
    logout,
    erroLogin,
    carregandoLogin,
  }

  return <SessaoContext.Provider value={valor}>{children}</SessaoContext.Provider>
}

export function useSessao() {
  const ctx = useContext(SessaoContext)
  if (!ctx) throw new Error('useSessao deve ser usado dentro de SessaoProvider')
  return ctx
}
