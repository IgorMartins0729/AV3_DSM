import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'

const router = Router()

router.post('/login', async (req, res) => {
  try {
    const { usuario, senha } = req.body as { usuario: string; senha: string }
    if (!usuario || !senha) {
      res.status(400).json({ mensagem: 'Usuário e senha são obrigatórios' })
      return
    }

    const funcionario = await prisma.funcionario.findUnique({ where: { usuario } })
    if (!funcionario) {
      res.status(401).json({ mensagem: 'Credenciais inválidas' })
      return
    }

    const senhaCorreta = await bcrypt.compare(senha, funcionario.senha)
    if (!senhaCorreta) {
      res.status(401).json({ mensagem: 'Credenciais inválidas' })
      return
    }

    const token = jwt.sign(
      { id: funcionario.id, usuario: funcionario.usuario, nivelPermissao: funcionario.nivelPermissao },
      process.env.JWT_SECRET as string,
      { expiresIn: '8h' }
    )

    res.json({
      token,
      funcionario: {
        id: funcionario.id,
        nome: funcionario.nome,
        usuario: funcionario.usuario,
        nivelPermissao: funcionario.nivelPermissao,
      },
    })
  } catch {
    res.status(500).json({ mensagem: 'Erro interno do servidor' })
  }
})

router.post('/register', async (req, res) => {
  try {
    const { nome, telefone, endereco, usuario, senha } = req.body as {
      nome: string; telefone: string; endereco: string; usuario: string; senha: string
    }
    if (!nome || !usuario || !senha) {
      res.status(400).json({ mensagem: 'Campos obrigatórios: nome, usuario, senha' })
      return
    }
    if (senha.length < 6) {
      res.status(400).json({ mensagem: 'A senha deve ter pelo menos 6 caracteres' })
      return
    }
    const hash = await bcrypt.hash(senha, 10)
    const funcionario = await prisma.funcionario.create({
      data: {
        nome,
        usuario,
        senha: hash,
        telefone: telefone ?? '',
        endereco: endereco ?? '',
        nivelPermissao: 'OPERADOR',
      },
      select: { id: true, nome: true, usuario: true, nivelPermissao: true },
    })
    res.status(201).json(funcionario)
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ mensagem: 'Este usuário já está cadastrado' })
    } else {
      res.status(500).json({ mensagem: 'Erro ao criar conta' })
    }
  }
})

export default router
