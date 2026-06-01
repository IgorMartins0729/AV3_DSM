import { Router } from 'express'
import prisma from '../lib/prisma'
import { autenticar, exigirPermissao } from '../middleware/auth'

const router = Router()
router.use(autenticar)

function dataParaString(d: Date | string | null | undefined): string | null {
  if (!d) return null
  const dt = d instanceof Date ? d : new Date(d)
  return dt.toISOString().split('T')[0]
}

function formatarEtapa(etapa: any) {
  return {
    id: etapa.id,
    nome: etapa.nome,
    prazo: dataParaString(etapa.prazo),
    status: etapa.status,
    funcionariosIds: etapa.funcionarios?.map((f: any) => f.id) ?? [],
  }
}

function formatarAeronave(aeronave: any) {
  return {
    codigo: aeronave.codigo,
    modelo: aeronave.modelo,
    tipo: aeronave.tipo,
    capacidade: aeronave.capacidade,
    alcance: aeronave.alcance,
    pecas: aeronave.pecas ?? [],
    etapas: aeronave.etapas?.map(formatarEtapa) ?? [],
    testes: aeronave.testes ?? [],
    relatorio: aeronave.relatorio
      ? {
          nomeCliente: aeronave.relatorio.nomeCliente,
          dataEntrega: dataParaString(aeronave.relatorio.dataEntrega),
          geradoEm: aeronave.relatorio.geradoEm,
        }
      : null,
  }
}

const incluirTudo = {
  pecas: true,
  etapas: { include: { funcionarios: true }, orderBy: { id: 'asc' as const } },
  testes: true,
  relatorio: true,
}

// ── Aeronaves ──────────────────────────────────────────────────────────────

router.get('/', async (_req, res) => {
  try {
    const aeronaves = await prisma.aeronave.findMany({ include: incluirTudo })
    res.json(aeronaves.map(formatarAeronave))
  } catch {
    res.status(500).json({ mensagem: 'Erro ao listar aeronaves' })
  }
})

router.post('/', exigirPermissao('ENGENHEIRO'), async (req, res) => {
  try {
    const { codigo, modelo, tipo, capacidade, alcance } = req.body
    if (!codigo || !modelo || !tipo) {
      res.status(400).json({ mensagem: 'Campos obrigatórios: codigo, modelo, tipo' })
      return
    }
    const aeronave = await prisma.aeronave.create({
      data: { codigo, modelo, tipo, capacidade: Number(capacidade), alcance: Number(alcance) },
      include: incluirTudo,
    })
    res.status(201).json(formatarAeronave(aeronave))
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ mensagem: 'Código de aeronave já existe' })
    } else {
      res.status(500).json({ mensagem: 'Erro ao cadastrar aeronave' })
    }
  }
})

router.get('/:codigo', async (req, res) => {
  try {
    const aeronave = await prisma.aeronave.findUnique({
      where: { codigo: req.params.codigo },
      include: incluirTudo,
    })
    if (!aeronave) {
      res.status(404).json({ mensagem: 'Aeronave não encontrada' })
      return
    }
    res.json(formatarAeronave(aeronave))
  } catch {
    res.status(500).json({ mensagem: 'Erro ao obter aeronave' })
  }
})

router.delete('/:codigo', exigirPermissao('ENGENHEIRO'), async (req, res) => {
  try {
    await prisma.aeronave.delete({ where: { codigo: req.params.codigo } })
    res.status(204).send()
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ mensagem: 'Aeronave não encontrada' })
    } else {
      res.status(500).json({ mensagem: 'Erro ao remover aeronave' })
    }
  }
})

// ── Peças ──────────────────────────────────────────────────────────────────

router.get('/:codigo/pecas', async (req, res) => {
  try {
    const pecas = await prisma.peca.findMany({ where: { aeronaveCodigo: req.params.codigo } })
    res.json(pecas)
  } catch {
    res.status(500).json({ mensagem: 'Erro ao listar peças' })
  }
})

router.post('/:codigo/pecas', exigirPermissao('ENGENHEIRO'), async (req, res) => {
  try {
    const { nome, tipo, fornecedor, status } = req.body
    if (!nome || !tipo || !fornecedor) {
      res.status(400).json({ mensagem: 'Campos obrigatórios: nome, tipo, fornecedor' })
      return
    }
    const peca = await prisma.peca.create({
      data: {
        nome,
        tipo,
        fornecedor,
        status: status ?? 'EM_PRODUCAO',
        aeronaveCodigo: req.params.codigo,
      },
    })
    res.status(201).json(peca)
  } catch {
    res.status(500).json({ mensagem: 'Erro ao cadastrar peça' })
  }
})

router.put('/:codigo/pecas/:id', async (req, res) => {
  try {
    const { nome, tipo, fornecedor, status } = req.body
    const dados: Record<string, unknown> = { nome, tipo, fornecedor, status }
    Object.keys(dados).forEach((k) => dados[k] === undefined && delete dados[k])

    const peca = await prisma.peca.update({
      where: { id: Number(req.params.id) },
      data: dados as any,
    })
    res.json(peca)
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ mensagem: 'Peça não encontrada' })
    } else {
      res.status(500).json({ mensagem: 'Erro ao atualizar peça' })
    }
  }
})

router.delete('/:codigo/pecas/:id', exigirPermissao('ENGENHEIRO'), async (req, res) => {
  try {
    await prisma.peca.delete({ where: { id: Number(req.params.id) } })
    res.status(204).send()
  } catch {
    res.status(500).json({ mensagem: 'Erro ao remover peça' })
  }
})

// ── Etapas ─────────────────────────────────────────────────────────────────

router.get('/:codigo/etapas', async (req, res) => {
  try {
    const etapas = await prisma.etapa.findMany({
      where: { aeronaveCodigo: req.params.codigo },
      include: { funcionarios: true },
      orderBy: { id: 'asc' },
    })
    res.json(etapas.map(formatarEtapa))
  } catch {
    res.status(500).json({ mensagem: 'Erro ao listar etapas' })
  }
})

router.post('/:codigo/etapas', exigirPermissao('ENGENHEIRO'), async (req, res) => {
  try {
    const { nome, prazo, status } = req.body
    if (!nome || !prazo) {
      res.status(400).json({ mensagem: 'Campos obrigatórios: nome, prazo' })
      return
    }
    const etapa = await prisma.etapa.create({
      data: {
        nome,
        prazo: new Date(prazo),
        status: status ?? 'PENDENTE',
        aeronaveCodigo: req.params.codigo,
      },
      include: { funcionarios: true },
    })
    res.status(201).json(formatarEtapa(etapa))
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ mensagem: 'Etapa com este nome já existe nessa aeronave' })
    } else {
      res.status(500).json({ mensagem: 'Erro ao cadastrar etapa' })
    }
  }
})

// Atualiza status e/ou funcionários de uma etapa (identificada pelo nome)
router.put('/:codigo/etapas/:nome', async (req, res) => {
  try {
    const nomeEtapa = decodeURIComponent(req.params.nome)
    const { status, funcionariosIds } = req.body as {
      status?: string
      funcionariosIds?: number[]
    }

    const etapaAtual = await prisma.etapa.findUnique({
      where: { aeronaveCodigo_nome: { aeronaveCodigo: req.params.codigo, nome: nomeEtapa } },
    })
    if (!etapaAtual) {
      res.status(404).json({ mensagem: 'Etapa não encontrada' })
      return
    }

    const etapa = await prisma.etapa.update({
      where: { id: etapaAtual.id },
      data: {
        ...(status ? { status: status as any } : {}),
        ...(funcionariosIds !== undefined
          ? { funcionarios: { set: funcionariosIds.map((id) => ({ id })) } }
          : {}),
      },
      include: { funcionarios: true },
    })
    res.json(formatarEtapa(etapa))
  } catch {
    res.status(500).json({ mensagem: 'Erro ao atualizar etapa' })
  }
})

router.delete('/:codigo/etapas/:nome', exigirPermissao('ENGENHEIRO'), async (req, res) => {
  try {
    const nomeEtapa = decodeURIComponent(req.params.nome)
    const etapa = await prisma.etapa.findUnique({
      where: { aeronaveCodigo_nome: { aeronaveCodigo: req.params.codigo, nome: nomeEtapa } },
    })
    if (!etapa) {
      res.status(404).json({ mensagem: 'Etapa não encontrada' })
      return
    }
    await prisma.etapa.delete({ where: { id: etapa.id } })
    res.status(204).send()
  } catch {
    res.status(500).json({ mensagem: 'Erro ao remover etapa' })
  }
})

// ── Testes ─────────────────────────────────────────────────────────────────

router.get('/:codigo/testes', async (req, res) => {
  try {
    const testes = await prisma.teste.findMany({ where: { aeronaveCodigo: req.params.codigo } })
    res.json(testes)
  } catch {
    res.status(500).json({ mensagem: 'Erro ao listar testes' })
  }
})

router.post('/:codigo/testes', exigirPermissao('ENGENHEIRO'), async (req, res) => {
  try {
    const { tipo, resultado } = req.body
    if (!tipo || !resultado) {
      res.status(400).json({ mensagem: 'Campos obrigatórios: tipo, resultado' })
      return
    }
    const teste = await prisma.teste.upsert({
      where: { aeronaveCodigo_tipo: { aeronaveCodigo: req.params.codigo, tipo } },
      update: { resultado },
      create: { tipo, resultado, aeronaveCodigo: req.params.codigo },
    })
    res.status(201).json(teste)
  } catch {
    res.status(500).json({ mensagem: 'Erro ao registrar teste' })
  }
})

router.delete('/:codigo/testes/:tipo', exigirPermissao('ENGENHEIRO'), async (req, res) => {
  try {
    await prisma.teste.deleteMany({
      where: { aeronaveCodigo: req.params.codigo, tipo: req.params.tipo as any },
    })
    res.status(204).send()
  } catch {
    res.status(500).json({ mensagem: 'Erro ao remover teste' })
  }
})

// ── Relatório ──────────────────────────────────────────────────────────────

router.get('/:codigo/relatorio', async (req, res) => {
  try {
    const relatorio = await prisma.relatorio.findUnique({ where: { aeronaveCodigo: req.params.codigo } })
    if (!relatorio) {
      res.status(404).json({ mensagem: 'Relatório não encontrado' })
      return
    }
    res.json({
      nomeCliente: relatorio.nomeCliente,
      dataEntrega: dataParaString(relatorio.dataEntrega),
      geradoEm: relatorio.geradoEm,
    })
  } catch {
    res.status(500).json({ mensagem: 'Erro ao obter relatório' })
  }
})

router.post('/:codigo/relatorio', exigirPermissao('ENGENHEIRO'), async (req, res) => {
  try {
    const { nomeCliente, dataEntrega } = req.body
    if (!nomeCliente || !dataEntrega) {
      res.status(400).json({ mensagem: 'Campos obrigatórios: nomeCliente, dataEntrega' })
      return
    }
    const relatorio = await prisma.relatorio.upsert({
      where: { aeronaveCodigo: req.params.codigo },
      update: { nomeCliente, dataEntrega: new Date(dataEntrega), geradoEm: new Date() },
      create: { nomeCliente, dataEntrega: new Date(dataEntrega), aeronaveCodigo: req.params.codigo },
    })
    res.status(201).json({
      nomeCliente: relatorio.nomeCliente,
      dataEntrega: dataParaString(relatorio.dataEntrega),
      geradoEm: relatorio.geradoEm,
    })
  } catch {
    res.status(500).json({ mensagem: 'Erro ao gerar relatório' })
  }
})

router.delete('/:codigo/relatorio', exigirPermissao('ENGENHEIRO'), async (req, res) => {
  try {
    await prisma.relatorio.delete({ where: { aeronaveCodigo: req.params.codigo } })
    res.status(204).send()
  } catch {
    res.status(500).json({ mensagem: 'Erro ao remover relatório' })
  }
})

export default router
