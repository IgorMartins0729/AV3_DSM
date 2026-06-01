import { Router } from 'express'
import authRouter from './auth'
import aeronavesRouter from './aeronaves'
import funcionariosRouter from './funcionarios'
import metricasRouter from './metricas'

const router = Router()

router.use('/auth', authRouter)
router.use('/aeronaves', aeronavesRouter)
router.use('/funcionarios', funcionariosRouter)
router.use('/metricas', metricasRouter)

export default router
