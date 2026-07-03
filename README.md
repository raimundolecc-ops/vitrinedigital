# Vitrine Digital / LocalMarket

Plataforma web para divulgacao de lojas locais, produtos e ofertas, com area publica
para clientes e area interna para comerciantes e administradores.

## Visao geral

Aplicacao full-stack:

- **Frontend** multipagina em HTML, CSS e JavaScript
  - paginas publicas com **Tailwind CSS**
  - area interna (dashboard/admin/cadastro/pedidos) com **Bootstrap**
  - toda a logica em um unico arquivo: `js/script.js`
- **Backend** REST em **FastAPI** (`backend/main.py`)
- **Banco** de dados **PostgreSQL** (base chamada `vitrine`)

> Para uma visao tecnica detalhada (tecnologias, atores, entidades, CRUD e seguranca
> com trechos de codigo), veja **[RESUMO_SISTEMA.md](RESUMO_SISTEMA.md)**.

## Pre-requisitos

Instale antes de comecar:

- [Python 3.11+](https://www.python.org/downloads/) (testado com 3.13)
- [PostgreSQL 14+](https://www.postgresql.org/download/) rodando localmente
- Um navegador moderno (Chrome, Edge, Firefox)

## Primeira execucao (passo a passo)

Os comandos abaixo sao para **Windows (cmd/PowerShell)**. Em Linux/macOS troque
`vitrine\Scripts\activate` por `source vitrine/bin/activate`.

### 1. Clonar o repositorio

```cmd
git clone https://github.com/raimundolecc-ops/vitrinedigital.git
cd vitrinedigital
```

### 2. Criar e ativar o ambiente virtual

```cmd
python -m venv vitrine
vitrine\Scripts\activate
```

### 3. Instalar as dependencias do backend

```cmd
pip install -r backend\requirements.txt
```

### 4. Criar o banco de dados `vitrine`

O sistema espera um banco PostgreSQL chamado **`vitrine`**. Crie-o uma vez:

```cmd
createdb -U postgres vitrine
```

Se o comando `createdb` nao existir no PATH, abra o `psql` e rode:

```sql
CREATE DATABASE vitrine;
```

### 5. Conferir as credenciais do banco

Por padrao o projeto conecta com o usuario `postgres` e senha `1234`. Se a sua senha
do PostgreSQL for diferente, ajuste a linha `DB_PARAMS` **nos dois arquivos**:

- `backend/database.py`
- `backend/db_setup.py`

```python
DB_PARAMS = "dbname=vitrine user=postgres password=SUA_SENHA host=localhost port=5432"
```

### 6. Criar as tabelas e popular os dados iniciais

```cmd
python backend\db_setup.py
```

> **Atencao:** este script apaga (DROP) e recria todas as tabelas. Rode apenas na
> primeira vez ou quando quiser zerar o banco. Ele cria as tabelas e injeta as contas
> de teste, 3 lojas, categorias e 4 produtos de exemplo.

Saida esperada: `Banco de dados configurado e populado com sucesso!`

### 7. Iniciar o backend (API)

```cmd
python backend\main.py
```

A API sobe em `http://localhost:8000` (documentacao interativa em
`http://localhost:8000/docs`). Deixe este terminal aberto.

### 8. Servir o frontend

Em **outro terminal**, na raiz do projeto:

```cmd
python -m http.server 5500
```

Abra no navegador: **http://localhost:5500/Index.html**

> Abrir o `Index.html` direto pelo disco (file://) tende a falhar por causa do CORS
> e dos caminhos. Use sempre o servidor local acima.

## Contas de teste

Criadas automaticamente pelo `db_setup.py`.

### Administrador
- `admin@localmarket.com.br` / `admin123`

### Comerciantes
- `green@valley.com.br` / `green123`
- `pao@loft.com.br` / `pao123`
- `bloom@stem.com.br` / `bloom123`

### Cliente
Crie uma conta nova pela pagina de cadastro (`register.html`) ou finalize um pedido.

## Seguranca

O sistema conta com autenticacao baseada em **hash de senha** e **token JWT**.

- **Senhas criptografadas (bcrypt):** as senhas nunca sao gravadas em texto puro.
  No cadastro, no login e ao criar/editar lojistas, a senha e convertida em um hash
  bcrypt antes de ir para o banco (`backend/security.py`). As contas de teste ja sao
  semeadas com hash pelo `db_setup.py`.
- **Compatibilidade retroativa:** se voce ja tinha um banco com senhas antigas em
  texto puro, o login continua funcionando e a senha e migrada para hash
  automaticamente no primeiro acesso bem-sucedido.
- **Token de acesso (JWT):** no login e no registro o backend emite um token JWT
  assinado (valido por 12h). O frontend guarda o token na sessao e o envia
  automaticamente no cabecalho `Authorization: Bearer <token>` em todas as chamadas
  da API.
- **Rotas protegidas:** as operacoes da area interna exigem token valido:
  - **Somente admin:** criar, editar, excluir e alterar status de lojas.
  - **Comerciante ou admin:** criar/editar/excluir produtos, categorias, cupons e
    atualizar o status de pedidos.
  - As paginas publicas (vitrine, catalogo, mapa) e a leitura de dados continuam
    abertas, assim como o fluxo de compra do cliente.
- **Validacao de sessao:** o endpoint `GET /api/auth/me` confere o token atual e
  devolve os dados do usuario logado.

### Chave secreta do token

O token e assinado com uma chave secreta. Em desenvolvimento ha uma chave padrao, mas
em producao defina a sua na variavel de ambiente `VITRINE_SECRET` antes de iniciar o
backend:

```cmd
set VITRINE_SECRET=uma-chave-bem-grande-e-secreta
python backend\main.py
```

> Ao ativar a seguranca, sessoes antigas (feitas antes desta versao) nao possuem token.
> Basta sair e entrar novamente para receber um token valido.

## Sessao e navegacao

- **Login por papel:** na tela de login o usuario escolhe o tipo de acesso
  (cliente, comerciante ou admin). Apos autenticar, e redirecionado para a area certa
  (admin -> `admin.html`, lojista -> `dashboard.html`, cliente -> carrinho).
- **Sessao persistente:** os dados da sessao e o token JWT ficam no `localStorage` do
  navegador. O token e enviado automaticamente em todas as chamadas da API.
- **Menu do usuario logado:** em qualquer pagina publica, o botao "Entrar" e substituido
  por um menu que mostra **quem esta logado** e o seu papel. O menu se adapta:
  - **Cliente:** "Meus Pedidos" e "Sair".
  - **Lojista / Admin:** botao **"Painel"** (volta para `dashboard.html` / `admin.html`),
    "Pedidos" e "Sair".
  Assim o lojista/admin nunca "se perde" ao navegar pela area publica.
- **Carrinho preservado no login:** se um visitante monta o carrinho sem estar logado e
  depois faz login (ou se cadastra) para finalizar a compra, os itens do carrinho local
  sao transferidos para a conta automaticamente, sem perder nada.

## Estrutura do projeto

```text
vitrinedigital/
|-- backend/
|   |-- main.py            # API FastAPI (todos os endpoints)
|   |-- database.py        # conexao com o PostgreSQL
|   |-- security.py        # hash de senha (bcrypt) e token JWT
|   |-- db_setup.py        # cria tabelas e popula dados iniciais
|   `-- requirements.txt   # dependencias Python
|-- css/
|   `-- styles.css         # estilos proprios
|-- js/
|   `-- script.js          # toda a logica do frontend
|-- Index.html             # home publica (vitrine de lojas)
|-- login.html             # login (cliente/comerciante/admin)
|-- register.html          # cadastro de cliente
|-- loja.html              # pagina de uma loja e seus produtos
|-- catalogo.html          # catalogo de produtos
|-- carrinho.html          # carrinho e finalizacao de pedido
|-- pedidos.html           # pedidos (cliente e gestao)
|-- ofertas.html           # ofertas em destaque
|-- mapa.html / mapas.html # lojas no mapa
|-- contato.html           # contato
|-- privacidade.html       # politica de privacidade
|-- termos.html            # termos de uso
|-- dashboard.html         # painel do comerciante
|-- cadastro.html          # cadastro/edicao de produto
|-- admin.html             # painel do administrador
|-- README.md              # este guia
`-- RESUMO_SISTEMA.md      # resumo tecnico (tecnologias, atores, CRUD, seguranca)
```

## Stack

**Frontend:** HTML, CSS, JavaScript, Tailwind CSS, Bootstrap
**Backend:** Python, FastAPI, Psycopg 3, Uvicorn
**Banco:** PostgreSQL

## Problemas comuns

| Sintoma | Causa provavel | Solucao |
| --- | --- | --- |
| `Erro ao configurar banco de dados` no passo 6 | Senha do PostgreSQL diferente de `1234` ou banco `vitrine` nao criado | Refaca os passos 4 e 5 |
| `connection refused` / porta 5432 | PostgreSQL nao esta rodando | Inicie o servico do PostgreSQL |
| A pagina abre mas nao lista lojas/produtos | Backend nao esta rodando ou frontend aberto via `file://` | Confirme o passo 7 e acesse via `http://localhost:5500` |
| `ModuleNotFoundError` ao rodar o backend | Ambiente virtual nao ativado ou dependencias nao instaladas | Refaca os passos 2 e 3 |

## Observacoes

- As senhas sao armazenadas com hash bcrypt e a autenticacao usa token JWT
  (veja a secao **Seguranca**).
- O backend usa CORS liberado (`allow_origins=["*"]`) para facilitar o uso local.
- As credenciais do banco ainda ficam no codigo e o CORS e aberto; para um ambiente
  de producao, mova segredos para variaveis de ambiente e restrinja as origens.
