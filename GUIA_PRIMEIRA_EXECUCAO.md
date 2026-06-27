# Guia de Primeira Execucao

Este documento mostra o passo a passo recomendado para rodar o sistema `Vitrine Digital / LocalMarket` pela primeira vez em uma maquina Windows.

## Sumario

- [1. O que voce precisa ter instalado](#1-o-que-voce-precisa-ter-instalado)
- [2. Abrir o projeto](#2-abrir-o-projeto)
- [3. Criar o ambiente virtual](#3-criar-o-ambiente-virtual)
- [4. Ativar o ambiente virtual](#4-ativar-o-ambiente-virtual)
- [5. Instalar as dependencias](#5-instalar-as-dependencias)
- [6. Preparar o PostgreSQL](#6-preparar-o-postgresql)
- [7. Criar as tabelas e os dados iniciais](#7-criar-as-tabelas-e-os-dados-iniciais)
- [8. Iniciar o backend](#8-iniciar-o-backend)
- [9. Iniciar o frontend](#9-iniciar-o-frontend)
- [10. Contas de teste](#10-contas-de-teste)
- [11. Validacao rapida](#11-validacao-rapida)
- [12. Problemas comuns](#12-problemas-comuns)

## 1. O que voce precisa ter instalado

Antes de comecar, confirme que sua maquina possui:

- Python 3 instalado
- PostgreSQL instalado
- terminal `cmd` ou PowerShell

Se quiser verificar o Python:

```cmd
python --version
```

Se quiser verificar o `pip`:

```cmd
pip --version
```

## 2. Abrir o projeto

Abra o terminal dentro da pasta do projeto:

```cmd
cd C:\Users\ti0301\Documents\GitHub\vitrinedigital
```

## 3. Criar o ambiente virtual

Crie o ambiente virtual com o nome `vitrine`:

```cmd
python -m venv vitrine
```

## 4. Ativar o ambiente virtual

### No Prompt de Comando (`cmd`)

```cmd
vitrine\Scripts\activate
```

### No PowerShell

```powershell
.\vitrine\Scripts\Activate.ps1
```

Quando o ambiente estiver ativo, o terminal deve mostrar algo parecido com:

```text
(vitrine) C:\Users\...\vitrinedigital>
```

## 5. Instalar as dependencias

Instale as dependencias do backend usando o arquivo do projeto:

```cmd
pip install -r backend\requirements.txt
```

Esse passo instala, entre outras bibliotecas:

- `fastapi`
- `uvicorn`
- `psycopg[binary]`
- `python-dotenv`

## 6. Preparar o PostgreSQL

O projeto espera encontrar um banco com esta configuracao:

| Item | Valor atual no codigo |
| --- | --- |
| Banco | `vitrine` |
| Usuario | `postgres` |
| Senha | `1234` |
| Host | `localhost` |
| Porta | `5432` |

Essas configuracoes estao hoje em:

- `backend/database.py`
- `backend/db_setup.py`

### 6.1 Verifique se o PostgreSQL esta rodando

O servico do PostgreSQL precisa estar ativo antes de seguir.

### 6.2 Crie o banco `vitrine`

Se o banco ainda nao existir, crie-o no PostgreSQL.

Exemplo usando `psql`:

```sql
CREATE DATABASE vitrine;
```

Se sua senha, usuario ou nome do banco forem diferentes, ajuste os arquivos abaixo antes de continuar:

- `backend/database.py`
- `backend/db_setup.py`

## 7. Criar as tabelas e os dados iniciais

Na primeira execucao, rode o script de setup:

```cmd
python backend\db_setup.py
```

Esse script faz o seguinte:

- recria as tabelas do projeto
- insere usuarios iniciais
- insere lojas iniciais
- insere produtos iniciais

> Importante: esse script foi pensado para ambiente local de desenvolvimento e recria a estrutura do banco do projeto.

## 8. Iniciar o backend

Com o ambiente ativo e o banco preparado, suba a API:

```cmd
python backend\main.py
```

Se tudo estiver certo, a API ficara disponivel em:

```text
http://localhost:8000
```

Base da API:

```text
http://localhost:8000/api
```

## 9. Iniciar o frontend

Voce tem duas formas simples de abrir o frontend.

### Opcao A - Abrir o arquivo principal diretamente

Abra o arquivo:

```text
Index.html
```

### Opcao B - Recomendado: servir os arquivos localmente

No diretorio raiz do projeto, rode:

```cmd
python -m http.server 5500
```

Depois abra no navegador:

```text
http://localhost:5500/Index.html
```

Essa opcao costuma deixar o comportamento mais previsivel para testes locais.

## 10. Contas de teste

Depois do setup inicial, voce pode usar estas contas:

### Admin

- email: `admin@localmarket.com.br`
- senha: `admin123`

### Comerciantes

- `green@valley.com.br / green123`
- `pao@loft.com.br / pao123`
- `bloom@stem.com.br / bloom123`

## 11. Validacao rapida

Depois de subir tudo, valide este fluxo:

1. Abrir `http://localhost:5500/Index.html` ou o arquivo `Index.html`.
2. Abrir a tela de login.
3. Entrar com uma conta de teste.
4. Conferir se o dashboard ou admin carregou.
5. Acessar catalogo, carrinho e pedidos.

## 12. Problemas comuns

### Erro: `No module named fastapi`

As dependencias ainda nao foram instaladas.

Rode:

```cmd
pip install -r backend\requirements.txt
```

### Erro: `No module named psycopg`

O pacote do PostgreSQL para Python nao foi instalado.

Rode:

```cmd
pip install -r backend\requirements.txt
```

### Erro de conexao com banco

Verifique:

- se o PostgreSQL esta rodando
- se o banco `vitrine` existe
- se usuario e senha batem com `backend/database.py`
- se `backend/db_setup.py` usa a mesma configuracao

### O backend sobe, mas o frontend nao carrega dados

Verifique:

- se a API esta rodando em `http://localhost:8000`
- se o navegador conseguiu acessar os endpoints
- se o banco foi inicializado com `python backend\db_setup.py`

### O login nao funciona

Verifique:

- se o banco foi populado com os usuarios iniciais
- se o perfil selecionado na tela de login corresponde ao usuario
- se voce esta usando as credenciais de teste corretas

## Proximo documento

Para entender a arquitetura do sistema, consulte:

- [DOCUMENTACAO_TECNICA_PROJETO.md](DOCUMENTACAO_TECNICA_PROJETO.md)
