import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Lock, Phone, MapPin } from 'lucide-react'
import { api } from '../../utils/api'
import styles from '../Login/styles.module.css'
import background from '../../assets/background.png'
import logo from '../../assets/gemini-generated.png'

const valoresIniciais = {
  nome: '',
  telefone: '',
  endereco: '',
  usuario: '',
  senha: '',
  confirmarSenha: '',
}

function Register() {
  const navigate = useNavigate()
  const [valores, setValores] = useState(valoresIniciais)
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState(null)
  const [carregando, setCarregando] = useState(false)

  function atualizar(e) {
    const { name, value } = e.target
    setValores((prev) => ({ ...prev, [name]: value }))
    if (erros[name]) setErros((prev) => ({ ...prev, [name]: undefined }))
    if (erroGeral) setErroGeral(null)
  }

  function validar() {
    const novosErros = {}
    if (!valores.nome.trim()) novosErros.nome = 'Informe o nome.'
    if (!valores.usuario.trim()) novosErros.usuario = 'Informe o usuário.'
    if (!valores.senha) novosErros.senha = 'Informe a senha.'
    else if (valores.senha.length < 6) novosErros.senha = 'A senha deve ter pelo menos 6 caracteres.'
    if (!valores.confirmarSenha) novosErros.confirmarSenha = 'Confirme a senha.'
    else if (valores.senha !== valores.confirmarSenha) novosErros.confirmarSenha = 'As senhas não coincidem.'
    return novosErros
  }

  async function aoRegistrar(e) {
    e.preventDefault()
    const novosErros = validar()
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros)
      return
    }
    setCarregando(true)
    setErroGeral(null)
    try {
      await api.post('/auth/register', {
        nome: valores.nome.trim(),
        telefone: valores.telefone.trim(),
        endereco: valores.endereco.trim(),
        usuario: valores.usuario.trim(),
        senha: valores.senha,
      })
      navigate('/login')
    } catch (err) {
      const msg = err.message ?? 'Erro ao criar conta'
      if (msg.toLowerCase().includes('usuário')) {
        setErros((prev) => ({ ...prev, usuario: msg }))
      } else {
        setErroGeral(msg)
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className={styles.tela} style={{ backgroundImage: `url(${background})` }}>
      <form className={styles.card} onSubmit={aoRegistrar} noValidate autoComplete="off">
        <div className={styles.logoWrapper}>
          <img src={logo} alt="AeroCode" className={styles.logo} />
        </div>

        <h1 className={styles.titulo}>Criar Conta</h1>
        <p className={styles.subtitulo}>Preencha os dados para criar sua conta.</p>

        {erroGeral && (
          <p style={{ color: '#c0392b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            {erroGeral}
          </p>
        )}

        <div className={styles.campo}>
          <label className={styles.label} htmlFor="reg-nome">Nome:</label>
          <div className={styles.inputWrapper}>
            <User size={16} className={styles.inputIcone} />
            <input
              id="reg-nome"
              name="nome"
              type="text"
              className={styles.input}
              value={valores.nome}
              onChange={atualizar}
              placeholder="Ex: João da Silva"
            />
          </div>
          {erros.nome && <span style={{ color: '#c0392b', fontSize: '0.8rem' }}>{erros.nome}</span>}
        </div>

        <div className={styles.campo}>
          <label className={styles.label} htmlFor="reg-telefone">Telefone:</label>
          <div className={styles.inputWrapper}>
            <Phone size={16} className={styles.inputIcone} />
            <input
              id="reg-telefone"
              name="telefone"
              type="tel"
              className={styles.input}
              value={valores.telefone}
              onChange={atualizar}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>

        <div className={styles.campo}>
          <label className={styles.label} htmlFor="reg-endereco">Endereço:</label>
          <div className={styles.inputWrapper}>
            <MapPin size={16} className={styles.inputIcone} />
            <input
              id="reg-endereco"
              name="endereco"
              type="text"
              className={styles.input}
              value={valores.endereco}
              onChange={atualizar}
              placeholder="Rua, número, cidade"
            />
          </div>
        </div>

        <div className={styles.campo}>
          <label className={styles.label} htmlFor="reg-usuario">Usuário:</label>
          <div className={styles.inputWrapper}>
            <User size={16} className={styles.inputIcone} />
            <input
              id="reg-usuario"
              name="usuario"
              type="text"
              className={styles.input}
              value={valores.usuario}
              onChange={atualizar}
              placeholder="Ex: joao.silva"
            />
          </div>
          {erros.usuario && <span style={{ color: '#c0392b', fontSize: '0.8rem' }}>{erros.usuario}</span>}
        </div>

        <div className={styles.campo}>
          <label className={styles.label} htmlFor="reg-senha">Senha:</label>
          <div className={styles.inputWrapper}>
            <Lock size={16} className={styles.inputIcone} />
            <input
              id="reg-senha"
              name="senha"
              type="password"
              className={styles.input}
              value={valores.senha}
              onChange={atualizar}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          {erros.senha && <span style={{ color: '#c0392b', fontSize: '0.8rem' }}>{erros.senha}</span>}
        </div>

        <div className={styles.campo}>
          <label className={styles.label} htmlFor="reg-confirmar">Confirmar senha:</label>
          <div className={styles.inputWrapper}>
            <Lock size={16} className={styles.inputIcone} />
            <input
              id="reg-confirmar"
              name="confirmarSenha"
              type="password"
              className={styles.input}
              value={valores.confirmarSenha}
              onChange={atualizar}
              placeholder="••••••••"
            />
          </div>
          {erros.confirmarSenha && <span style={{ color: '#c0392b', fontSize: '0.8rem' }}>{erros.confirmarSenha}</span>}
        </div>

        <button type="submit" className={styles.botao} disabled={carregando}>
          {carregando ? 'Criando conta...' : 'Cadastrar'}
        </button>

        <p className={styles.linkRodape}>
          Já tem uma conta? <Link to="/login">Faça login aqui</Link>.
        </p>
      </form>
    </div>
  )
}

export default Register
