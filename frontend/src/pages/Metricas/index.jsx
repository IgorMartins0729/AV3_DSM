import React, { useState } from 'react'
import { Activity } from 'lucide-react'
import PageStub from '../../components/PageStub'
import styles from './styles.module.css'

const CENARIOS = [1, 5, 10]
const ITERACOES = { 1: 10, 5: 6, 10: 4 }

async function medirCenario(numUsuarios, iteracoes) {
  const amostras = []
  for (let i = 0; i < iteracoes; i++) {
    const lote = Array.from({ length: numUsuarios }, async () => {
      const inicio = performance.now()
      const res = await fetch('/api/metricas/ping')
      const fim = performance.now()
      const resposta = Math.round(fim - inicio)
      const processamento = parseInt(res.headers.get('X-Processing-Time-Ms') || '1', 10)
      const latencia = Math.max(0, resposta - processamento)
      return { resposta, processamento, latencia }
    })
    const resultados = await Promise.all(lote)
    amostras.push(...resultados)
  }
  const media = (fn) => Math.round(amostras.reduce((s, m) => s + fn(m), 0) / amostras.length)
  return {
    latencia: media((m) => m.latencia),
    processamento: media((m) => m.processamento),
    resposta: media((m) => m.resposta),
    amostras: amostras.length,
  }
}

function GraficoBarras({ titulo, descricao, cor, dados, campo }) {
  const valores = dados.map((d) => d[campo])
  const maximo = Math.max(...valores, 1)

  return (
    <div className={styles.cardGrafico}>
      <h3 className={styles.tituloGrafico}>{titulo}</h3>
      <p className={styles.descricaoGrafico}>{descricao}</p>
      <div className={styles.grafico}>
        <div className={styles.eixoY}>
          {[maximo, Math.round(maximo * 0.5), 0].map((v) => (
            <span key={v} className={styles.marcaY}>{v}ms</span>
          ))}
        </div>
        <div className={styles.areaBarras}>
          {dados.map((d) => {
            const pct = maximo > 0 ? (d[campo] / maximo) * 100 : 0
            return (
              <div key={d.label} className={styles.coluna}>
                <span className={styles.valorBarra}>{d[campo]}ms</span>
                <div className={styles.barraWrapper}>
                  <div
                    className={styles.barra}
                    style={{ height: `${pct}%`, backgroundColor: cor }}
                  />
                </div>
                <span className={styles.labelBarra}>{d.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Metricas() {
  const [dados, setDados] = useState(null)
  const [executando, setExecutando] = useState(false)
  const [progresso, setProgresso] = useState('')

  async function executarTestes() {
    setDados(null)
    setExecutando(true)
    const resultados = {}
    for (const n of CENARIOS) {
      setProgresso(`Testando ${n} usuário${n > 1 ? 's' : ''} simultâneo${n > 1 ? 's' : ''}...`)
      resultados[n] = await medirCenario(n, ITERACOES[n])
    }
    setDados(
      CENARIOS.map((n) => ({
        label: `${n} usuário${n > 1 ? 's' : ''}`,
        latencia: resultados[n].latencia,
        processamento: resultados[n].processamento,
        resposta: resultados[n].resposta,
        amostras: resultados[n].amostras,
      }))
    )
    setExecutando(false)
    setProgresso('')
  }

  return (
    <PageStub
      title="Métricas de Qualidade"
      description="Latência, tempo de processamento e tempo de resposta para 1, 5 e 10 usuários simultâneos."
    >
      <div className={styles.controles}>
        <button
          type="button"
          className={styles.botaoExecutar}
          onClick={executarTestes}
          disabled={executando}
        >
          <Activity size={16} />
          {executando ? progresso : 'Executar Testes'}
        </button>
      </div>

      {executando && (
        <div className={styles.carregando}>
          <div className={styles.spinner} />
          <span>{progresso}</span>
        </div>
      )}

      {dados && (
        <>
          <p className={styles.metodo}>
            Método: cada cenário dispara N requisições simultâneas via <code>Promise.all</code> para{' '}
            <code>/api/metricas/ping</code>, repetidas {Object.values(ITERACOES).join('/')} vezes (1/5/10 usuários).
            O tempo de resposta é medido com <code>performance.now()</code> no cliente.
            O tempo de processamento vem do cabeçalho <code>X-Processing-Time-Ms</code> do servidor.
            A latência é calculada como: tempo de resposta − tempo de processamento.
            Todos os valores são médias aritméticas em milissegundos.
          </p>

          <div className={styles.graficos}>
            <GraficoBarras
              titulo="Latência (ms)"
              descricao="Atraso de rede: tempo de transmissão entre cliente e servidor, excluindo o processamento."
              cor="#3b82f6"
              dados={dados}
              campo="latencia"
            />
            <GraficoBarras
              titulo="Tempo de Processamento (ms)"
              descricao="Tempo que o servidor levou para processar a requisição, medido pelo middleware interno."
              cor="#10b981"
              dados={dados}
              campo="processamento"
            />
            <GraficoBarras
              titulo="Tempo de Resposta (ms)"
              descricao="Tempo total percebido pelo cliente: latência de ida + processamento + latência de volta."
              cor="#f59e0b"
              dados={dados}
              campo="resposta"
            />
          </div>

          <div className={styles.tabelaWrap}>
            <h3 className={styles.tituloTabela}>Resumo</h3>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Cenário</th>
                  <th>Amostras</th>
                  <th>Latência (ms)</th>
                  <th>Processamento (ms)</th>
                  <th>Resposta (ms)</th>
                </tr>
              </thead>
              <tbody>
                {dados.map((d) => (
                  <tr key={d.label}>
                    <td>{d.label}</td>
                    <td>{d.amostras}</td>
                    <td>{d.latencia}</td>
                    <td>{d.processamento}</td>
                    <td>{d.resposta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!dados && !executando && (
        <p className={styles.vazio}>
          Clique em "Executar Testes" para coletar as métricas de desempenho.
        </p>
      )}
    </PageStub>
  )
}
