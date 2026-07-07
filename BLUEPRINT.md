# Blueprint de Arquitetura — Web Full-Stack (reutilizavel)

Playbook dos padroes usados no projeto Vitrine Digital / LocalMarket, escrito para ser
**reaproveitado em outro projeto** de stack parecida (web full-stack). Cada secao tem os
padroes e um bloco **"Como adaptar"** para quando voce trocar alguma tecnologia.

> **Como usar este documento:** copie este arquivo para o novo repositorio e, na primeira
> conversa com o Claude Code, diga: *"Siga os padroes do BLUEPRINT.md"*. Veja o
> **Prompt inicial sugerido** no fim.

---

## 1. Visao da arquitetura

Tres camadas, com o frontend falando com o backend por uma API REST em JSON:

```
Cliente (navegador)  <-->  API REST  <-->  Banco de dados
   HTML/CSS/JS            FastAPI/Python       PostgreSQL
```

Principios que valem para qualquer stack:
- **Separacao clara**: o frontend nunca fala direto com o banco; sempre via API.
- **API sem estado (stateless)**: cada requisicao carrega o token de autenticacao.
- **Validacao no servidor**: nunca confie apenas no que o frontend envia (precos,
  permissoes e totais sao conferidos no backend).

**Como adaptar:** se trocar o backend (Node/Express, Django, .NET) os conceitos sao os
mesmos — camada de rotas, camada de acesso a dados, camada de seguranca. Se trocar o
frontend por React/Vue, a comunicacao com a API continua igual (fetch/axios + token).

---

## 2. Estrutura de pastas recomendada

```text
projeto/
|-- backend/
|   |-- main.py            # rotas da API (ou dividido por modulos quando crescer)
|   |-- database.py        # conexao com o banco (injecao de dependencia)
|   |-- security.py        # hash de senha + token JWT
|   |-- db_setup.py        # cria tabelas e popula dados iniciais (seed)
|   `-- requirements.txt
|-- frontend/ (ou raiz)
|   |-- css/
|   |-- js/
|   `-- *.html
|-- .gitignore            # ignora venv, __pycache__, .env, node_modules
|-- README.md             # como rodar
|-- BLUEPRINT.md          # este arquivo
`-- CLAUDE.md             # contexto para o Claude Code (recomendado)
```

Regra pratica: **um arquivo por responsabilidade**. Quando `main.py` passar de ~800
linhas, quebre por dominio (`routes_produtos.py`, `routes_auth.py`, etc.).

---

## 3. Backend — padroes

### 3.1 Conexao com o banco por injecao de dependencia
Uma unica funcao abre/fecha a conexao; as rotas a recebem via `Depends`.

```python
# database.py
import psycopg
from psycopg.rows import dict_row

DB_PARAMS = "dbname=... user=... password=... host=localhost port=5432"

def get_db_connection():
    conn = psycopg.connect(DB_PARAMS, row_factory=dict_row)  # linhas viram dict
    try:
        yield conn
    finally:
        conn.close()
```

**Como adaptar:** com outro banco (MySQL/SQLite) troque o driver e a string de conexao.
O padrao "abrir no inicio, fechar no fim, injetar na rota" continua.

### 3.2 Schemas de entrada e saida (Pydantic)
Modele o corpo das requisicoes e das respostas. Isso valida os dados de graca.

```python
class ProdutoCreate(BaseModel):
    nome: str
    preco: float
    quantidade: int

class ProdutoResponse(ProdutoCreate):
    id: str
    data_criacao: Optional[str] = None
```

### 3.3 Template de CRUD
Um endpoint por operacao, sempre com SQL parametrizado (`%s`) — nunca concatene strings.

```python
@app.post("/api/produtos", response_model=ProdutoResponse)
def create_produto(prod: ProdutoCreate, conn = Depends(get_db_connection),
                   user: dict = Depends(require_management)):   # rota protegida
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO produtos (id, nome, preco, quantidade) VALUES (%s,%s,%s,%s) "
            "RETURNING id, nome, preco, quantidade, data_criacao",
            (prod.id, prod.nome, prod.preco, prod.quantidade)   # parametros = anti SQL Injection
        )
        novo = cur.fetchone()
        conn.commit()
        return novo

@app.get("/api/produtos")       # READ
@app.put("/api/produtos/{id}")  # UPDATE
@app.delete("/api/produtos/{id}")  # DELETE (sempre checar se existia -> 404)
```

### 3.4 Migracao leve de schema no runtime
Para adicionar colunas sem quebrar bancos ja existentes, use `ADD COLUMN IF NOT EXISTS`
chamado no inicio das rotas relevantes:

```python
def ensure_produtos_schema(conn):
    with conn.cursor() as cur:
        cur.execute("ALTER TABLE produtos ADD COLUMN IF NOT EXISTS imagem TEXT")
    conn.commit()
```

Isso evita ter que rodar o `db_setup.py` (destrutivo) toda vez que o schema evolui.

### 3.5 CORS (durante o desenvolvimento)
Libere o CORS para o frontend local funcionar; **restrinja as origens em producao**.

```python
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
```

---

## 4. Seguranca (o padrao mais importante para reaproveitar)

### 4.1 Senha com hash bcrypt (nunca texto puro)
```python
import bcrypt

def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode()[:72], bcrypt.gensalt()).decode()

def verify_password(p: str, stored: str) -> bool:
    if stored.startswith(("$2a$", "$2b$", "$2y$")):     # ja e hash
        return bcrypt.checkpw(p.encode()[:72], stored.encode())
    return p == stored   # compatibilidade com banco antigo em texto puro
```

Truque util: no login, se a senha estava em texto puro, **regrave como hash** no primeiro
acesso bem-sucedido (migracao transparente, sem perder os usuarios existentes).

### 4.2 Token de acesso JWT
```python
import jwt, datetime
SECRET = os.getenv("APP_SECRET", "troque-em-producao")

def create_access_token(email, role):
    exp = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=12)
    return jwt.encode({"sub": email, "role": role, "exp": exp}, SECRET, algorithm="HS256")

def decode_access_token(token):
    return jwt.decode(token, SECRET, algorithms=["HS256"])   # lanca erro se invalido/expirado
```
A chave secreta vem de **variavel de ambiente**, nunca fixa no codigo.

### 4.3 Rotas protegidas por token e por papel
```python
def get_current_user(authorization: Optional[str] = Header(default=None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Autenticacao necessaria.")
    try:
        return decode_access_token(authorization.split(" ", 1)[1])
    except jwt.PyJWTError:
        raise HTTPException(401, "Token invalido ou expirado.")

def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(403, "Acesso apenas para administradores.")
    return user
```
Regra: **leituras publicas ficam abertas; escritas exigem token** (e o papel certo).

**Como adaptar:** em Node/Express isso vira um middleware `authenticate` + `authorize(role)`.
O desenho (validar token -> extrair papel -> checar permissao) e identico.

---

## 5. Frontend — padroes

### 5.1 Sessao no navegador
Guarde a sessao (dados do usuario + token) no `localStorage`:
```javascript
function saveSession(u) { localStorage.setItem("userSession", JSON.stringify(u)); }
function getSession()   { return JSON.parse(localStorage.getItem("userSession") || "null"); }
```

### 5.2 Injetar o token em toda chamada da API (wrapper de fetch)
Evita ter que adicionar o cabecalho manualmente em cada requisicao:
```javascript
const _fetch = window.fetch.bind(window);
window.fetch = function (url, options = {}) {
    const s = getSession();
    if (s?.token && typeof url === "string" && url.startsWith(API_BASE)) {
        options.headers = { ...(options.headers || {}), Authorization: `Bearer ${s.token}` };
    }
    return _fetch(url, options);
};
```

**Como adaptar:** em React use um interceptor do `axios` (ou um wrapper de `fetch` num
modulo `api.js`). A sessao pode ficar em Context + localStorage.

### 5.3 Roteamento simples por pagina (JS puro, multipagina)
Cada HTML declara `data-page="..."`; um unico `script.js` decide o que rodar:
```javascript
const page = document.body.dataset.page;
if (page === "produtos") setupProdutosPage();
```
**Como adaptar:** num SPA (React/Vue) isso vira o roteador do framework (React Router etc.).

### 5.4 Guardas de rota no cliente
Redirecione para o login se nao houver sessao, e cheque o papel para paginas internas.
Lembre: guardas no cliente sao UX — **a seguranca de verdade e no backend** (secao 4).

---

## 6. Banco de dados — padrao de setup e seed

Um script `db_setup.py` que cria o schema do zero e popula dados de teste:
- `DROP TABLE ... CASCADE` + `CREATE TABLE ...` (recria tudo — **destrutivo**, use so no setup).
- Seeds em listas + `executemany` (usuarios de teste, categorias, exemplos).
- **Semeie senhas ja com hash** (`hash_password`) — nunca texto puro.
- Chaves estrangeiras com `ON DELETE CASCADE`/`SET NULL` para manter integridade.

Documente contas de teste no README (ex.: `admin@... / admin123`).

---

## 7. Convencoes que evitam dor de cabeca

- **SQL sempre parametrizado** (`%s` / placeholders) — nunca f-string com dados do usuario.
- **Erros com status HTTP correto**: 400 (dados invalidos), 401 (sem login), 403 (sem
  permissao), 404 (nao existe), 409 (conflito, ex.: e-mail duplicado).
- **Segredos e credenciais em variaveis de ambiente** (`.env`), fora do git.
- **`.gitignore` desde o primeiro commit**: venv, `__pycache__`, `.env`, `node_modules`.
- **README com passo a passo real**: criar banco, instalar deps, rodar backend e frontend.
- **Valide no servidor** tudo que envolva dinheiro ou permissao.

---

## 8. Checklist para comecar um projeto novo

1. [ ] Criar repo + `.gitignore` + `README.md` + copiar este `BLUEPRINT.md`.
2. [ ] Subir o esqueleto do backend (`database.py`, `security.py`, `main.py`, `db_setup.py`).
3. [ ] Definir as entidades e escrever o `db_setup.py` (schema + seed com senha em hash).
4. [ ] Implementar autenticacao (registro/login com hash + JWT) **antes** do resto.
5. [ ] Implementar o CRUD das entidades, protegendo as escritas por papel.
6. [ ] Frontend: sessao + wrapper de fetch com token + telas.
7. [ ] Escrever o `CLAUDE.md` do projeto (arquitetura + convencoes).
8. [ ] Testar o fluxo critico (login, uma operacao protegida, o caminho principal).

---

## 9. Prompt inicial sugerido (cole na primeira conversa do projeto novo)

> "Este projeto segue os padroes do arquivo **BLUEPRINT.md** (leia-o primeiro).
> Stack: [ex.: FastAPI + PostgreSQL no backend, React no frontend].
> Quero comecar por: [ex.: modelar as entidades X, Y, Z e montar a autenticacao
> com hash bcrypt + JWT como descrito no blueprint]. Antes de codar, gere um
> `CLAUDE.md` com a arquitetura e as convencoes deste projeto."

Assim qualquer sessao futura minha ja parte sabendo a arquitetura, as convencoes de
seguranca e o estilo de codigo que voce quer.
