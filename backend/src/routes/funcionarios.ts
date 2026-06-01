import { Router } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma'
import { autenticar, exigirPermissao } from '../middleware/auth'

const router = Router()
router.use(autenticar)

router.get('/', exigirPermissao('ENGENHEIRO'), async (_req, res) => {
  try {
    const funcionarios = await prisma.funcionario.findMany({
      select: { id: true, nome: true, usuario: true, telefone: true, endereco: true, nivelPermissao: true },
    })
    res.json(funcionarios)
  } catch {
    res.status(500).json({ mensagem: 'Erro ao listar funcionários' })
  }
})

router.get('/:id', exigirPermissao('ENGENHEIRO'), async (req, res) => {
  try {
    const funcionario = await prisma.funcionario.findUnique({
      where: { id: Number(req.params.id) },
      select: { id: true, nome: true, usuario: true, telefone: true, endereco: true, nivelPermissao: true },
    })
    if (!funcionario) {
      res.status(404).json({ mensagem: 'Funcionário não encontrado' })
      return
    }
    res.json(funcionario)
  } catch {
    res.status(500).json({ mensagem: 'Erro ao obter funcionário' })
  }
})

router.post('/', exigirPermissao('ADMINISTRADOR'), async (req, res) => {
  try {
    const { nome, usuario, senha, telefone, endereco, nivelPermissao } = req.body
    if (!nome || !usuario || !senha || !nivelPermissao) {
      res.status(400).json({ mensagem: 'Campos obrigatórios: nome, usuario, senha, nivelPermissao' })
      return
    }
    const hash = await bcrypt.hash(senha, 10)
    const funcionario = await prisma.funcionario.create({
      data: { nome, usuario, senha: hash, telefone: telefone ?? '', endereco: endereco ?? '', nivelPermissao },
      select: { id: true, nome: true, usuario: true, telefone: true, endereco: true, nivelPermissao: true },
    })
    res.status(201).json(funcionario)
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ mensagem: 'Usuário já existe' })
    } else {
      res.status(500).json({ mensagem: 'Erro ao cadastrar funcionário' })
    }
  }
})

router.put('/:id', exigirPermissao('ADMINISTRADOR'), async (req, res) => {
  try {
    const { nome, usuario, senha, telefone, endereco, nivelPermissao } = req.body
    const dados: Record<string, unknown> = { nome, usuario, telefone, endereco, nivelPermissao }
    if (senha) dados.senha = await bcrypt.hash(senha, 10)
    Object.keys(dados).forEach((k) => dados[k] === undefined && delete dados[k])

    const funcionario = await prisma.funcionario.update({
      where: { id: Number(req.params.id) },
      data: dados as any,
      select: { id: true, nome: true, usuario: true, telefone: true, endereco: true, nivelPermissao: true },
    })
    res.json(funcionario)
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ mensagem: 'Funcionário não encontrado' })
    } else {
      res.status(500).json({ mensagem: 'Erro ao atualizar funcionário' })
    }
  }
})

router.delete('/:id', exigirPermissao('ADMINISTRADOR'), async (req, res) => {
  try {
    await prisma.funcionario.delete({ where: { id: Number(req.params.id) } })
    res.status(204).send()
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ mensagem: 'Funcionário não encontrado' })
    } else {
      res.status(500).json({ mensagem: 'Erro ao remover funcionário' })
    }
  }
})

export default router
