import React from 'react'
import { useOutletContext } from 'react-router-dom'
import { Trash2, Download } from 'lucide-react'
import BotaoCadastrar from '../../../components/BotaoCadastrar'
import { useAeronaves } from '../../../contexts/AeronavesContext'
import { useSessao } from '../../../contexts/SessaoContext'
import { AcaoSistema, nivelMinimo } from '../../../utils/permissoes'
import tabela from '../../../styles/tabela.module.css'
import styles from './styles.module.css'

function ItemInfo({ rotulo, valor }) {
  return (
    <div className={styles.itemInfo}>
      <span className={styles.rotuloItem}>{rotulo}</span>
      <p className={styles.valorItem}>{valor}</p>
    </div>
  )
}

function SecaoRelatorio({ titulo, children }) {
  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
        {titulo}
      </h3>
      {children}
    </div>
  )
}

function gerarTextoRelatorio(aeronave) {
  const r = aeronave.relatorio
  const sep = '='.repeat(50)
  const linha = '-'.repeat(50)

  const linhas = [
    sep,
    `RELATORIO FINAL - AERONAVE ${aeronave.codigo}`,
    sep,
    `Gerado em: ${r.geradoEm ? new Date(r.geradoEm).toLocaleString('pt-BR') : '—'}`,
    '',
    'DADOS DA AERONAVE',
    linha,
    `Codigo:     ${aeronave.codigo}`,
    `Modelo:     ${aeronave.modelo}`,
    `Tipo:       ${aeronave.tipo}`,
    `Capacidade: ${aeronave.capacidade} passageiros`,
    `Alcance:    ${aeronave.alcance} km`,
    '',
    'CLIENTE',
    linha,
    `Nome:            ${r.nomeCliente}`,
    `Data de Entrega: ${r.dataEntrega ?? '—'}`,
    '',
    `PECAS UTILIZADAS (${aeronave.pecas.length})`,
    linha,
  ]

  if (aeronave.pecas.length === 0) {
    linhas.push('Nenhuma peca cadastrada.')
  } else {
    aeronave.pecas.forEach((p, i) => {
      linhas.push(`${i + 1}. ${p.nome} | Tipo: ${p.tipo} | Fornecedor: ${p.fornecedor} | Status: ${p.status}`)
    })
  }

  linhas.push('')
  linhas.push(`ETAPAS DE PRODUCAO (${aeronave.etapas.length})`)
  linhas.push(linha)

  if (aeronave.etapas.length === 0) {
    linhas.push('Nenhuma etapa cadastrada.')
  } else {
    aeronave.etapas.forEach((e, i) => {
      linhas.push(`${i + 1}. ${e.nome} | Prazo: ${e.prazo ?? '—'} | Status: ${e.status}`)
    })
  }

  linhas.push('')
  linhas.push(`TESTES REALIZADOS (${aeronave.testes.length})`)
  linhas.push(linha)

  if (aeronave.testes.length === 0) {
    linhas.push('Nenhum teste registrado.')
  } else {
    aeronave.testes.forEach((t) => {
      linhas.push(`- ${t.tipo}: ${t.resultado}`)
    })
  }

  linhas.push('')
  linhas.push(sep)

  return linhas.join('\n')
}

function baixarTxt(aeronave) {
  const texto = gerarTextoRelatorio(aeronave)
  const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `relatorio_${aeronave.codigo}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

function AeronaveRelatorio() {
  const { aeronave } = useOutletContext()
  const { removerRelatorio } = useAeronaves()
  const { pode } = useSessao()
  const podeGerar = pode(AcaoSistema.GERAR_RELATORIO_FINAL)
  const tituloSemPermissao = `Requer ${nivelMinimo(AcaoSistema.GERAR_RELATORIO_FINAL)} ou superior`

  function aoRemover() {
    if (window.confirm('Remover o relatório desta aeronave?')) {
      removerRelatorio(aeronave.codigo)
    }
  }

  if (!aeronave.relatorio) {
    return (
      <div>
        <div className={styles.cabecalhoTab}>
          <h2 className={styles.tituloTab}>Relatório final</h2>
          <BotaoCadastrar to="gerar" disabled={!podeGerar} tituloDesabilitado={tituloSemPermissao}>
            Gerar Relatório
          </BotaoCadastrar>
        </div>
        <p className={tabela.vazio}>Relatório ainda não gerado.</p>
      </div>
    )
  }

  const r = aeronave.relatorio

  return (
    <div>
      <div className={styles.cabecalhoTab}>
        <h2 className={styles.tituloTab}>Relatório final</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={tabela.botaoAcao}
            onClick={() => baixarTxt(aeronave)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Download size={14} /> Baixar .txt
          </button>
          <button
            type="button"
            className={tabela.botaoRemover}
            onClick={aoRemover}
            disabled={!podeGerar}
            title={!podeGerar ? tituloSemPermissao : undefined}
          >
            <Trash2 size={14} /> Remover relatório
          </button>
        </div>
      </div>

      <SecaoRelatorio titulo="Dados da aeronave">
        <div className={styles.cardInfo}>
          <dl className={styles.gridInfo}>
            <ItemInfo rotulo="Código" valor={aeronave.codigo} />
            <ItemInfo rotulo="Modelo" valor={aeronave.modelo} />
            <ItemInfo rotulo="Tipo" valor={aeronave.tipo} />
            <ItemInfo rotulo="Capacidade" valor={`${aeronave.capacidade} passageiros`} />
            <ItemInfo rotulo="Alcance" valor={`${aeronave.alcance} km`} />
          </dl>
        </div>
      </SecaoRelatorio>

      <SecaoRelatorio titulo="Cliente">
        <div className={styles.cardInfo}>
          <dl className={styles.gridInfo}>
            <ItemInfo rotulo="Nome do cliente" valor={r.nomeCliente ?? '—'} />
            <ItemInfo rotulo="Data de entrega" valor={r.dataEntrega ?? '—'} />
            <ItemInfo
              rotulo="Gerado em"
              valor={r.geradoEm ? new Date(r.geradoEm).toLocaleString('pt-BR') : '—'}
            />
          </dl>
        </div>
      </SecaoRelatorio>

      <SecaoRelatorio titulo={`Pecas utilizadas (${aeronave.pecas.length})`}>
        {aeronave.pecas.length === 0 ? (
          <p className={tabela.vazio}>Nenhuma peça cadastrada.</p>
        ) : (
          <div className={tabela.containerTabela}>
            <table className={tabela.tabela}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Fornecedor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {aeronave.pecas.map((p) => (
                  <tr key={p.id ?? p.nome}>
                    <td>{p.nome}</td>
                    <td>{p.tipo}</td>
                    <td>{p.fornecedor}</td>
                    <td><span className={tabela.badge}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SecaoRelatorio>

      <SecaoRelatorio titulo={`Etapas de producao (${aeronave.etapas.length})`}>
        {aeronave.etapas.length === 0 ? (
          <p className={tabela.vazio}>Nenhuma etapa cadastrada.</p>
        ) : (
          <div className={tabela.containerTabela}>
            <table className={tabela.tabela}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nome</th>
                  <th>Prazo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {aeronave.etapas.map((e, i) => (
                  <tr key={e.nome}>
                    <td>{i + 1}</td>
                    <td>{e.nome}</td>
                    <td>{e.prazo ?? '—'}</td>
                    <td><span className={tabela.badge}>{e.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SecaoRelatorio>

      <SecaoRelatorio titulo={`Testes realizados (${aeronave.testes.length})`}>
        {aeronave.testes.length === 0 ? (
          <p className={tabela.vazio}>Nenhum teste registrado.</p>
        ) : (
          <div className={tabela.containerTabela}>
            <table className={tabela.tabela}>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {aeronave.testes.map((t) => (
                  <tr key={t.tipo}>
                    <td>{t.tipo}</td>
                    <td>
                      <span className={tabela.badge} style={{ color: t.resultado === 'APROVADO' ? '#1a7a3a' : '#c0392b', background: t.resultado === 'APROVADO' ? '#e6f7ed' : '#fdecea' }}>
                        {t.resultado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SecaoRelatorio>
    </div>
  )
}

export default AeronaveRelatorio
