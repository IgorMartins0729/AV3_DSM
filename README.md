# AeroCode

Sistema web de gestão de produção de aeronaves. Permite controlar o ciclo completo de fabricação, desde o cadastro da aeronave até a entrega final ao cliente, incluindo gerenciamento de peças, etapas de produção, testes e relatórios. O acesso ao sistema é controlado por autenticação JWT com três níveis de permissão.

---

## Requisitos

Antes de executar o projeto, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) v18 ou superior
- [MySQL](https://www.mysql.com/) 8.0 ou superior (servidor rodando localmente)
- npm v9 ou superior

---

## Estrutura do projeto

```
AV3/
├── backend/          Node.js + Express + TypeScript + Prisma
├── frontend/         React + Vite
│   └── AV2_DSM-main/ Código-fonte do frontend
└── README.md
```

---

## Configuração do banco de dados

Acesse o MySQL e crie o banco:

```sql
CREATE DATABASE aerocode;
```

Opcionalmente, crie um usuário dedicado:

```sql
CREATE USER 'aerocode'@'localhost' IDENTIFIED BY 'sua_senha';
GRANT ALL PRIVILEGES ON aerocode.* TO 'aerocode'@'localhost';
FLUSH PRIVILEGES;
```

---

## Configuração do backend

### 1. Instalar dependências

```bash
cd backend
npm install
```

### 2. Criar o arquivo de variáveis de ambiente

Crie o arquivo `backend/.env` com o seguinte conteúdo, ajustando usuário e senha conforme seu ambiente:

```env
DATABASE_URL="mysql://root:SUA_SENHA@localhost:3306/aerocode"
JWT_SECRET="troque_por_uma_string_aleatoria_longa"
PORT=3000
```

### 3. Executar as migrations

Cria todas as tabelas no banco:

```bash
npx prisma migrate dev --name init
```

### 4. Popular o banco com dados iniciais

Cria os três usuários padrão do sistema:

```bash
npm run db:seed
```

### 5. Iniciar o servidor

```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3000`.

---

## Configuração do frontend

Abra um segundo terminal:

```bash
cd frontend/AV2_DSM-main
npm install
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

---

## Credenciais de acesso

Após executar o seed, os seguintes usuários estarao disponíveis:

| Usuario     | Senha  | Nivel de permissao |
|-------------|--------|--------------------|
| admin       | 123456 | ADMINISTRADOR      |
| engenheiro  | 123456 | ENGENHEIRO         |
| operador    | 123456 | OPERADOR           |

---

## Niveis de permissao

| Nivel          | Permissoes                                                                 |
|----------------|----------------------------------------------------------------------------|
| ADMINISTRADOR  | Acesso total. Gerencia funcionarios, aeronaves, pecas, etapas e testes.    |
| ENGENHEIRO     | Cria e edita aeronaves, pecas, etapas e testes. Visualiza funcionarios.    |
| OPERADOR       | Somente leitura. Visualiza aeronaves, pecas, etapas e testes.              |

---

## Endpoints da API

### Autenticacao

| Metodo | Rota                  | Acesso   | Descricao                        |
|--------|-----------------------|----------|----------------------------------|
| POST   | /api/auth/login       | Publico  | Autenticacao com usuario e senha |
| POST   | /api/auth/register    | Publico  | Cria conta com nivel OPERADOR    |

### Aeronaves

| Metodo | Rota                                  | Permissao     |
|--------|---------------------------------------|---------------|
| GET    | /api/aeronaves                        | Autenticado   |
| POST   | /api/aeronaves                        | ENGENHEIRO+   |
| GET    | /api/aeronaves/:codigo                | Autenticado   |
| DELETE | /api/aeronaves/:codigo                | ENGENHEIRO+   |

### Pecas, Etapas, Testes, Relatorio

| Metodo          | Rota                                          | Permissao   |
|-----------------|-----------------------------------------------|-------------|
| GET             | /api/aeronaves/:codigo/pecas                  | Autenticado |
| POST            | /api/aeronaves/:codigo/pecas                  | ENGENHEIRO+ |
| PUT/DELETE      | /api/aeronaves/:codigo/pecas/:id              | ENGENHEIRO+ |
| GET             | /api/aeronaves/:codigo/etapas                 | Autenticado |
| POST            | /api/aeronaves/:codigo/etapas                 | ENGENHEIRO+ |
| PUT/DELETE      | /api/aeronaves/:codigo/etapas/:nome           | ENGENHEIRO+ |
| GET             | /api/aeronaves/:codigo/testes                 | Autenticado |
| POST            | /api/aeronaves/:codigo/testes                 | ENGENHEIRO+ |
| GET/POST        | /api/aeronaves/:codigo/relatorio              | Varia       |

### Funcionarios

| Metodo     | Rota                      | Permissao      |
|------------|---------------------------|----------------|
| GET        | /api/funcionarios         | ENGENHEIRO+    |
| POST       | /api/funcionarios         | ADMINISTRADOR  |
| PUT        | /api/funcionarios/:id     | ADMINISTRADOR  |
| DELETE     | /api/funcionarios/:id     | ADMINISTRADOR  |

### Metricas

| Metodo | Rota           | Permissao   |
|--------|----------------|-------------|
| GET    | /api/metricas  | Autenticado |

---

## Tecnologias utilizadas

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- MySQL
- JSON Web Token (JWT)
- bcryptjs

### Frontend
- React 19
- Vite
- React Router DOM v7
- Lucide React

---

## Comandos uteis

```bash
# Resetar banco e recriar tabelas
npx prisma migrate reset

# Recriar usuarios padrao (redefinir senhas)
npm run db:seed

# Abrir cliente visual do banco (rodar dentro de backend/)
npx prisma studio
```
