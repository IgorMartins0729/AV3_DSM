import express from 'express'
import cors from 'cors'
import { metricsMiddleware } from './middleware/metrics'
import routes from './routes'

const app = express()

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'], credentials: true }))
app.use(express.json())
app.use(metricsMiddleware)

app.use('/api', routes)

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

export default app
