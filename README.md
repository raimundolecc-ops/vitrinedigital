# Vitrine Digital / LocalMarket

Plataforma web para divulgacao de lojas locais, produtos e ofertas, com area publica para clientes e area interna para comerciantes e administradores.

## Visao rapida

Hoje o projeto funciona como uma aplicacao full-stack com:

- frontend multipagina em HTML, CSS e JavaScript
- paginas publicas com Tailwind CSS
- area interna com Bootstrap
- backend REST em FastAPI
- persistencia em PostgreSQL

## Documentacao

Para deixar o repositorio organizado no GitHub, a documentacao foi separada em:

- [Guia de Primeira Execucao](GUIA_PRIMEIRA_EXECUCAO.md)
- [Documentacao Tecnica do Projeto](DOCUMENTACAO_TECNICA_PROJETO.md)
- [Plano de Melhorias do Sistema](PLANO_MELHORIAS_SISTEMA.md)
- [Checklist de Execucao - Nivel 1](CHECKLIST_EXECUCAO_NIVEL_1.md)

## Como iniciar pela primeira vez

Resumo curto do fluxo inicial:

1. Criar o ambiente virtual.
2. Ativar o ambiente.
3. Instalar as dependencias do backend.
4. Garantir que o PostgreSQL esteja rodando e com o banco `vitrine` criado.
5. Executar o setup inicial do banco.
6. Iniciar o backend.
7. Abrir o frontend.

### Comandos principais

```cmd
python -m venv vitrine
vitrine\Scripts\activate
pip install -r backend\requirements.txt
python backend\db_setup.py
python backend\main.py
```

Para o passo a passo detalhado, incluindo PostgreSQL, validacao e problemas comuns, consulte:

- [GUIA_PRIMEIRA_EXECUCAO.md](GUIA_PRIMEIRA_EXECUCAO.md)

## Estrutura principal

```text
vitrinedigital/
|-- backend/
|-- css/
|-- js/
|-- Index.html
|-- dashboard.html
|-- cadastro.html
|-- admin.html
|-- GUIA_PRIMEIRA_EXECUCAO.md
`-- DOCUMENTACAO_TECNICA_PROJETO.md
```

## Contas de teste

### Admin

- `admin@localmarket.com.br / admin123`

### Comerciantes

- `green@valley.com.br / green123`
- `pao@loft.com.br / pao123`
- `bloom@stem.com.br / bloom123`

## Stack

### Frontend

- HTML estatico
- CSS proprio
- JavaScript
- Tailwind CSS
- Bootstrap

### Backend

- Python
- FastAPI
- Psycopg 3
- Uvicorn

### Banco

- PostgreSQL

## Observacoes

- O backend espera uma base PostgreSQL chamada `vitrine`.
- As configuracoes atuais de banco estao em `backend/database.py` e `backend/db_setup.py`.
- O frontend pode ser aberto diretamente por `Index.html`, mas um servidor local simples costuma ser mais estavel para testes.

## Proximos documentos

- [Guia de Primeira Execucao](GUIA_PRIMEIRA_EXECUCAO.md)
- [Documentacao Tecnica do Projeto](DOCUMENTACAO_TECNICA_PROJETO.md)
- [Plano de Melhorias do Sistema](PLANO_MELHORIAS_SISTEMA.md)
- [Checklist de Execucao - Nivel 1](CHECKLIST_EXECUCAO_NIVEL_1.md)
