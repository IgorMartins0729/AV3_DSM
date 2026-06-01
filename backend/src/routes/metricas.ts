import { Router } from 'express'
import { autenticar } from '../middleware/auth'
import { obterMedicoes, limparMedicoes } from '../middleware/metrics'

const router = Router()
router.use(autenticar)

router.get('/', (_req, res) => {
  const medicoes = obterMedicoes()

  if (medicoes.length === 0) {
    res.json({ total: 0, media: 0, minimo: 0, maximo: 0, medicoes: [] })
    return
  }

  const tempos = medicoes.map((m) => m.tempoProcesamento)
  const total = medicoes.length
  const media = Math.round(tempos.reduce((a, b) => a + b, 0) / total)
  const minimo = Math.min(...tempos)
  const maximo = Math.max(...tempos)

  const porRota: Record<string, { count: number; totalMs: number }> = {}
  for (const m of medicoes) {
    const chave = `${m.metodo} ${m.rota}`
    if (!porRota[chave]) porRota[chave] = { count: 0, totalMs: 0 }
    porRota[chave].count++
    porRota[chave].totalMs += m.tempoProcesamento
  }

  const resumoPorRota = Object.entries(porRota).map(([rota, dados]) => ({
    rota,
    requisicoes: dados.count,
    mediaProcesamentoMs: Math.round(dados.totalMs / dados.count),
  }))

  res.json({
    total,
    mediaProcesamentoMs: media,
    minimoProcesamentoMs: minimo,
    maximoProcesamentoMs: maximo,
    resumoPorRota,
    medicoes: medicoes.slice(-100),
  })
})

router.delete('/', (_req, res) => {
  limparMedicoes()
  res.status(204).send()
})

export default router
