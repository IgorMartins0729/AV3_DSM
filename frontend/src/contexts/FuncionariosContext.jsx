import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../utils/api'

const FuncionariosContext = createContext(null)

export function FuncionariosProvider({ children }) {
  const [funcionarios, setFuncionarios] = useState([])
  const [erroCarregamento, setErroCarregamento] = useState(null)

  useEffect(() => {
    api.get('/funcionarios')
      .then(setFuncionarios)
      .catch(() => setErroCarregamento('Falha ao carregar funcionários. Verifique sua conexão.'))
  }, [])

  // Cria ou atualiza: se dados.id existir → PUT, senão → POST
  async function cadastrar(dados) {
    if (dados.id) {
      const { id, ...campos } = dados
      const result = await api.put(`/funcionarios/${id}`, campos)
      setFuncionarios((prev) => prev.map((f) => (f.id === result.id ? result : f)))
      return result
    }
    const result = await api.post('/funcionarios', dados)
    setFuncionarios((prev) => [...prev, result])
    return result
  }

  async function remover(id) {
    await api.delete(`/funcionarios/${id}`)
    setFuncionarios((prev) => prev.filter((f) => f.id !== id))
  }

  function obter(id) {
    return funcionarios.find((f) => f.id === id)
  }

  const valor = { funcionarios, erroCarregamento, cadastrar, remover, obter }

  return <FuncionariosContext.Provider value={valor}>{children}</FuncionariosContext.Provider>
}

export function useFuncionarios() {
  const ctx = useContext(FuncionariosContext)
  if (!ctx) throw new Error('useFuncionarios deve ser usado dentro de FuncionariosProvider')
  return ctx
}
