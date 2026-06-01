import { Request, Response, NextFunction } from 'express'

export interface Medicao {
  timestamp: number
  rota: string
  metodo: string
  statusCode: number
  tempoProcesamento: number
}

const medicoes: Medicao[] = []
const MAX_MEDICOES = 500

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const inicio = Date.now()

  const jsonOriginal = res.json.bind(res)
  res.json = function (body: unknown) {
    const tempoProcesamento = Date.now() - inicio

    if (medicoes.length >= MAX_MEDICOES) medicoes.shift()
    medicoes.push({
      timestamp: inicio,
      rota: req.route?.path ?? req.path,
      metodo: req.method,
      statusCode: res.statusCode,
      tempoProcesamento,
    })

    res.setHeader('X-Processing-Time-Ms', tempoProcesamento)
    return jsonOriginal(body)
  }

  next()
}

export function obterMedicoes(): Medicao[] {
  return [...medicoes]
}

export function limparMedicoes(): void {
  medicoes.splice(0, medicoes.length)
}
