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

export default router
