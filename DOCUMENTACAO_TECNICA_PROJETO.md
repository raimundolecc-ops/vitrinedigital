# Documentacao Tecnica - Vitrine Digital / LocalMarket

Data da analise: 2026-06-27

## Sumario

- [1. Visao geral](#1-visao-geral)
- [2. Stack e tecnologias](#2-stack-e-tecnologias)
- [3. Guia de primeira execucao](#3-guia-de-primeira-execucao)
- [4. Estrutura principal do repositorio](#4-estrutura-principal-do-repositorio)
- [5. Arquitetura da aplicacao](#5-arquitetura-da-aplicacao)
- [6. Paginas e responsabilidades](#6-paginas-e-responsabilidades)
- [7. Fluxos principais do sistema](#7-fluxos-principais-do-sistema)
- [8. Modelo de dados](#8-modelo-de-dados)
- [9. Endpoints principais da API](#9-endpoints-principais-da-api)
- [10. Dados de seed e ambiente local](#10-dados-de-seed-e-ambiente-local)
- [11. Decisoes tecnicas observadas](#11-decisoes-tecnicas-observadas)
- [12. Problemas, riscos e limitacoes atuais](#12-problemas-riscos-e-limitacoes-atuais)
- [13. Recomendacoes priorizadas](#13-recomendacoes-priorizadas)
- [14. Conclusao](#14-conclusao)

## 1. Visao geral

O projeto `Vitrine Digital`, tambem apresentado na interface como `LocalMarket`, e uma plataforma web para divulgacao de lojas locais, produtos e ofertas, com area publica para clientes e area interna para comerciantes e administradores.

Na pratica, o repositorio hoje funciona como uma aplicacao full-stack, composta por:

- frontend multipagina em HTML estatico
- logica de interface centralizada em JavaScript
- backend REST em FastAPI
- banco de dados PostgreSQL

O sistema cobre cadastro e login, catalogo, carrinho, favoritos, pedidos, painel do comerciante, gestao administrativa de lojas e criacao de cupons.

## 2. Stack e tecnologias

### Frontend

- HTML estatico
- CSS proprio em `css/styles.css`
- JavaScript centralizado em `js/script.js`
- Tailwind CSS via CDN nas paginas publicas
- Bootstrap na area interna de gestao
- Google Fonts `Manrope`
- Material Symbols
- VLibras para acessibilidade

### Backend

- Python
- FastAPI
- Pydantic
- Psycopg 3
- Uvicorn

### Banco de dados

- PostgreSQL

## 3. Guia de primeira execucao

O passo a passo completo de primeira execucao esta em:

- [GUIA_PRIMEIRA_EXECUCAO.md](GUIA_PRIMEIRA_EXECUCAO.md)

Resumo operacional:

1. Criar e ativar o ambiente virtual.
2. Instalar as dependencias com `pip install -r backend\requirements.txt`.
3. Garantir que o PostgreSQL esteja instalado, rodando e com o banco `vitrine` criado.
4. Ajustar as credenciais em `backend/database.py` e `backend/db_setup.py` se a maquina local usar configuracao diferente.
5. Rodar `python backend\db_setup.py` para criar tabelas e popular os dados iniciais.
6. Rodar `python backend\main.py` para subir a API.
7. Abrir o frontend via `Index.html` ou por um servidor estatico local.

## 4. Estrutura principal do repositorio

```text
vitrinedigital/
|-- backend/
|   |-- main.py
|   |-- database.py
|   |-- db_setup.py
|   |-- requirements.txt
|   `-- test_main_import.py
|-- css/
|   `-- styles.css
|-- js/
|   `-- script.js
|-- Index.html
|-- loja.html
|-- ofertas.html
|-- mapa.html
|-- mapas.html
|-- catalogo.html
|-- carrinho.html
|-- login.html
|-- register.html
|-- pedidos.html
|-- dashboard.html
|-- cadastro.html
|-- admin.html
|-- README.md
|-- GUIA_PRIMEIRA_EXECUCAO.md
`-- DOCUMENTACAO_TECNICA_PROJETO.md
```

## 5. Arquitetura da aplicacao

### 5.1 Frontend

O frontend nao usa framework SPA. A aplicacao e organizada como um conjunto de paginas HTML independentes, e o arquivo `js/script.js` detecta a pagina atual por meio do atributo `data-page` no elemento `<body>`.

No carregamento da pagina, o script:

- inicializa armazenamento local
- configura links e contadores globais
- configura logout e menu mobile
- protege paginas privadas
- chama a rotina especifica da pagina atual

Esse modelo deixa a aplicacao simples de entender, mas concentra bastante responsabilidade em um unico arquivo JavaScript.

### 5.2 Backend

O backend em `backend/main.py` expoe endpoints REST para:

- autenticacao
- usuarios
- lojas
- produtos
- carrinho
- favoritos
- cupons
- pedidos

A conexao com o banco e fornecida por injecao de dependencia do FastAPI usando `get_db_connection()`.

### 5.3 Banco de dados

O banco relacional sustenta os dados persistentes da aplicacao. A criacao das tabelas e os seeds iniciais ficam em `backend/db_setup.py`.

## 6. Paginas e responsabilidades

### Publicas / experiencia do cliente

- `Index.html`: pagina inicial com vitrine, busca e navegacao principal
- `loja.html`: lista todas as lojas ou mostra produtos de uma loja especifica
- `ofertas.html`: pagina promocional de ofertas
- `mapa.html`: pagina de mapa e localizacao
- `mapas.html`: versao adicional da experiencia de mapas
- `login.html`: login para cliente, comerciante e admin
- `register.html`: cadastro de cliente
- `carrinho.html`: resumo da compra, cupom e finalizacao do pedido
- `pedidos.html`: historico de pedidos
- `contato.html`, `privacidade.html`, `termos.html`: paginas institucionais

### Internas / gestao

- `dashboard.html`: painel do comerciante/admin com metricas e lista de itens
- `cadastro.html`: formulario para criar ou editar produtos
- `catalogo.html`: catalogo com busca, filtros, favoritos e adicionar ao carrinho
- `admin.html`: painel administrativo para gerenciar lojas, clientes e cupons

## 7. Fluxos principais do sistema

### 7.1 Autenticacao

O login envia email, senha e perfil para o backend. O retorno da API e salvo no `localStorage` como sessao do usuario.

Perfis suportados:

- `cliente`
- `comerciante`
- `admin`

Redirecionamentos atuais:

- cliente -> `carrinho.html`
- comerciante -> `dashboard.html`
- admin -> `admin.html`

### 7.2 Cadastro de cliente

O cadastro cria usuarios com funcao `cliente` no backend e faz login automatico apos sucesso.

### 7.3 Catalogo e descoberta

O catalogo busca produtos via API, aplica:

- filtro por termo
- filtro por categoria
- ordenacao por nome, preco ou data

Tambem permite:

- adicionar ao carrinho
- favoritar produtos

Visitantes usam `localStorage`. Usuarios autenticados usam persistencia no backend.

### 7.4 Carrinho

O carrinho funciona em dois modos:

- visitante: dados salvos no navegador
- usuario autenticado: dados salvos na tabela `carrinhos`

O checkout:

- valida cupom opcional
- cria pedido
- baixa estoque
- limpa carrinho
- abre uma janela de impressao com um cupom/comprovante

### 7.5 Dashboard do comerciante

O painel permite:

- listar produtos visiveis para o usuario atual
- pesquisar produtos
- exportar CSV
- excluir produto
- importar produtos da Fake Store API

Para comerciantes, o filtro principal e `storeSlug`. Para admin, todos os itens ficam visiveis.

### 7.6 Cadastro e edicao de produto

O formulario `cadastro.html` atende criacao e edicao. Ele monta o payload para `POST /api/produtos` ou `PUT /api/produtos/{id}`.

O status do item e recalculado com base na quantidade:

- `Rascunho`
- `Indisponivel`
- `Baixo estoque`
- `Ativo`

### 7.7 Administracao

O admin pode:

- listar lojas
- criar nova loja
- alternar status da loja
- excluir loja
- visualizar clientes cadastrados
- visualizar volume total de produtos
- criar cupons

### 7.8 Cupons

O sistema suporta cupons:

- percentuais
- valor fixo

Escopo possivel:

- global
- por loja
- por categoria

O backend valida aplicabilidade do cupom item a item no carrinho.

### 7.9 Pedidos

Na criacao do pedido, o backend:

- valida o cliente
- confere cupom ativo
- calcula desconto aplicavel
- verifica estoque
- cria registro em `pedidos`
- cria itens em `pedido_items`
- reduz quantidade dos produtos

## 8. Modelo de dados

As tabelas principais sao:

### `usuarios`

- email
- senha
- nome
- funcao
- slug_loja
- data_criacao

### `lojas`

- id
- nome
- categoria
- localizacao
- status
- slug_loja
- data_criacao

### `produtos`

- id
- slug_dono
- nome_loja
- nome
- categoria
- descricao
- preco
- quantidade
- status
- imagem
- destaque
- data_criacao

### `carrinhos`

- usuario_email
- produto_id
- quantidade
- adicionado_em

### `pedidos`

- usuario_email
- total
- desconto_total
- cupom_codigo
- status
- criado_em

### `pedido_items`

- pedido_id
- produto_id
- quantidade
- preco_unitario

### `cupons`

- codigo
- descricao
- tipo
- valor
- loja_slug
- categoria
- ativo
- criado_por
- data_criacao

### `favoritos`

- usuario_email
- produto_id

## 9. Endpoints principais da API

### Autenticacao

- `POST /api/auth/login`
- `POST /api/auth/register`

### Usuarios

- `GET /api/usuarios`

### Lojas

- `GET /api/lojas`
- `POST /api/lojas`
- `PUT /api/lojas/{loja_id}/status`
- `DELETE /api/lojas/{loja_id}`

### Produtos

- `GET /api/produtos`
- `GET /api/produtos/{prod_id}`
- `POST /api/produtos`
- `PUT /api/produtos/{prod_id}`
- `DELETE /api/produtos/{prod_id}`

### Carrinho

- `GET /api/carrinho`
- `POST /api/carrinho`
- `DELETE /api/carrinho/{prod_id}`
- `POST /api/carrinho/limpar`

### Favoritos

- `GET /api/favoritos`
- `POST /api/favoritos`

### Cupons

- `GET /api/cupons`
- `POST /api/cupons`
- `POST /api/cupons/validar`

### Pedidos

- `POST /api/pedidos`
- `GET /api/pedidos`
- `GET /api/pedidos/{pedido_id}`

## 10. Dados de seed e ambiente local

O repositorio inclui seeds de demonstracao com:

- 1 usuario admin
- 3 comerciantes
- 3 lojas
- 4 produtos

Credenciais documentadas no projeto:

- `admin@localmarket.com.br / admin123`
- `green@valley.com.br / green123`
- `pao@loft.com.br / pao123`
- `bloom@stem.com.br / bloom123`

Configuracao atual de banco no codigo:

- banco: `vitrine`
- usuario: `postgres`
- senha: `1234`
- host: `localhost`
- porta: `5432`

## 11. Decisoes tecnicas observadas

### Pontos positivos

- arquitetura simples para demonstracao e aprendizado
- backend ja estruturado por dominios funcionais
- uso de seeds facilita testes e apresentacao
- suporte a favoritos, cupons e pedidos aumenta o valor do MVP
- acessibilidade com VLibras e modo de alto contraste

### Trade-offs atuais

- um unico `script.js` concentra muita regra de negocio
- mistura de Tailwind e Bootstrap aumenta a heterogeneidade visual
- controle de acesso depende fortemente do frontend
- parte das paginas publicas parece mais estatica do que integrada a dados reais

## 12. Problemas, riscos e limitacoes atuais

### 12.1 Seguranca

- senhas armazenadas em texto puro
- conexao do banco hardcoded no codigo
- CORS aberto para qualquer origem
- endpoints sensiveis sem autenticacao real por token
- autorizacao baseada principalmente em `localStorage`

### 12.2 Manutenibilidade

- arquivo `js/script.js` muito grande e centralizado
- responsabilidades de UI, negocio e integracao misturadas
- documentacao principal ainda descreve o sistema como frontend, apesar do backend existente

### 12.3 Consistencia funcional

- `pedidos.html` possui area de detalhes iniciando com classe `hidden`, e a rotina de exibicao nao remove essa classe
- o arquivo principal de entrada se chama `Index.html`, o que pode causar inconsistencias em ambientes case-sensitive
- existe variacao forte entre paginas publicas e paginas internas em tecnologia e estilo

### 12.4 Ambiente

- o ambiente precisa de Python, PostgreSQL e dependencias Python antes da primeira execucao
- sem `fastapi` e `psycopg`, o backend nao pode ser importado ou rodado diretamente

## 13. Recomendacoes priorizadas

### Curto prazo

- manter `README.md` como pagina inicial do GitHub e documentos tecnicos em arquivos dedicados
- corrigir a exibicao de detalhes em `pedidos.html`
- mover `DB_PARAMS` para variaveis de ambiente
- padronizar o nome de `Index.html` para `index.html`

### Medio prazo

- aplicar hash de senha
- adicionar autenticacao por token ou sessao real
- dividir `js/script.js` por modulos ou por area funcional
- padronizar melhor a camada visual

### Longo prazo

- migrar o frontend para uma arquitetura componente ou modular
- incluir testes automatizados de API e fluxos criticos
- criar permissoes robustas por perfil no backend

## 14. Conclusao

O projeto ja ultrapassou o escopo de um frontend simples e hoje representa um marketplace local em formato MVP full-stack. Ele tem boa cobertura funcional para demonstracao, incluindo autenticacao, catalogo, carrinho, pedidos, cupons e painel administrativo.

Ao mesmo tempo, o proximo salto de maturidade passa por seguranca, modularizacao do frontend, fortalecimento da autorizacao no backend e atualizacao da documentacao oficial do repositorio.
