import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface TokenPayload {
  id: number
  usuario: string
  nivelPermissao: string
}

declare global {
  namespace Express {
    interface Request {
      usuario?: TokenPayload
    }
  }
}

const HIERARQUIA: Record<string, number> = {
  OPERADOR: 1,
  ENGENHEIRO: 2,
  ADMINISTRADOR: 3,
}

export function autenticar(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ mensagem: 'Token não fornecido' })
    return
  }

  try {
    const token = authHeader.slice(7)
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload
    req.usuario = payload
    next()
  } catch {
    res.status(401).json({ mensagem: 'Token inválido ou expirado' })
  }
}

export function exigirPermissao(nivelMinimo: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const nivel = req.usuario?.nivelPermissao
    if (!nivel || (HIERARQUIA[nivel] ?? 0) < (HIERARQUIA[nivelMinimo] ?? 999)) {
      res.status(403).json({ mensagem: `Requer nível ${nivelMinimo} ou superior` })
      return
    }
    next()
  }
}
