# Resumo do Sistema — Vitrine Digital / LocalMarket

Documento de apresentacao tecnica do projeto. Descreve as tecnologias, os atores,
as entidades e atributos, as operacoes de CRUD e a camada de seguranca, com trechos
reais do codigo-fonte.

---

## 1. Visao geral

O **Vitrine Digital (LocalMarket)** e uma plataforma web para divulgacao e venda de
produtos de lojas locais. Possui uma **area publica** (clientes navegam, favoritam e
compram) e uma **area interna** (comerciantes gerenciam sua loja e o administrador
gerencia toda a plataforma).

E uma aplicacao **full-stack** composta por tres camadas:

```
Navegador (HTML/CSS/JS)  <-->  API REST (FastAPI/Python)  <-->  Banco (PostgreSQL)
```

---

## 2. Tecnologias utilizadas

| Camada | Tecnologias |
| --- | --- |
| **Frontend** | HTML5, CSS3, JavaScript (ES6+), Tailwind CSS (paginas publicas), Bootstrap 5 (area interna) |
| **Backend** | Python 3, FastAPI, Pydantic (validacao de dados), Uvicorn (servidor ASGI) |
| **Banco de dados** | PostgreSQL, acessado via Psycopg 3 |
| **Seguranca** | bcrypt (hash de senha), PyJWT (token de acesso JWT) |
| **Comunicacao** | API REST em JSON, com CORS habilitado |

**Organizacao do codigo:**
- `backend/main.py` — todos os endpoints da API REST.
- `backend/database.py` — conexao com o PostgreSQL.
- `backend/security.py` — hash de senha e token JWT.
- `backend/db_setup.py` — criacao das tabelas e dados iniciais.
- `js/script.js` — toda a logica do frontend (uma pagina por `data-page`).

---

## 3. Atores (papeis) e suas funcoes

O sistema tem tres tipos de usuario, definidos no atributo `funcao` da tabela `usuarios`.

| Ator | Funcoes principais |
| --- | --- |
| **Cliente** | Navegar pela vitrine, buscar por categoria, favoritar produtos, montar carrinho, aplicar cupom, finalizar pedido e acompanhar seus pedidos. |
| **Comerciante (lojista)** | Gerenciar os produtos **da sua loja** (CRUD), criar cupons da loja, importar produtos e acompanhar/atualizar o status dos pedidos que envolvem seus produtos. |
| **Administrador** | Gerenciar **todas** as lojas (CRUD), aprovar/ativar lojas, administrar categorias e cupons, visualizar clientes e ter acesso a todos os produtos e pedidos. |

**Visitante** (nao logado) tambem pode navegar e montar um carrinho local; ao efetuar
login, esse carrinho e transferido para a conta.

---

## 4. Modelo de dados (entidades e atributos)

Principais tabelas e seus atributos (definidas em `backend/db_setup.py`):

- **usuarios**: `id`, `email` (unico), `senha` (hash bcrypt), `nome`, `funcao`
  (`admin` | `comerciante` | `cliente`), `slug_loja`, `data_criacao`.
- **lojas**: `id`, `nome`, `categoria`, `localizacao`, `cep`, `imagem`, `status`,
  `slug_loja` (unico), `nome_proprietario`, `email_proprietario`,
  `data_nascimento_proprietario`, `data_criacao`.
- **produtos**: `id`, `slug_dono` (loja dona), `nome_loja`, `nome`, `categoria`,
  `descricao`, `preco`, `quantidade`, `status`, `imagem`, `destaque`, `data_criacao`.
- **categorias**: `id`, `nome`, `tipo` (`produto` | `loja`).
- **carrinhos**: `usuario_email`, `produto_id`, `quantidade` (unico por usuario+produto).
- **pedidos**: `id`, `usuario_email`, `total`, `desconto_total`, `cupom_codigo`,
  `status`, `criado_em`.
- **pedido_items**: `pedido_id`, `produto_id`, `quantidade`, `preco_unitario`.
- **cupons**: `id`, `codigo` (unico), `descricao`, `tipo`, `valor`, `loja_slug`,
  `categoria`, `ativo`, `criado_por`.
- **favoritos**: `usuario_email`, `produto_id`.

**Relacionamentos:** um produto pertence a uma loja (`slug_dono` -> `lojas.slug_loja`);
um pedido tem varios itens (`pedido_items`); carrinho e favoritos ligam usuario a produtos.

**Status de pedido (fluxo):** `Pendente` -> `Em separacao` -> `Enviado` -> `Entregue`.

---

## 5. CRUD — trechos de codigo

O sistema implementa **CRUD completo** (Create, Read, Update, Delete) para produtos,
lojas, categorias e cupons. Exemplo com a entidade **produto** (`backend/main.py`):

### CREATE — cadastrar produto
```python
@app.post("/api/produtos", response_model=ProdutoBase)
def create_produto(prod: ProdutoCreate, conn = Depends(get_db_connection),
                   _user: dict = Depends(require_management)):
    with conn.cursor() as cur:
        ensure_category_exists(cur, prod.categoria, "produto")
        cur.execute(
            """INSERT INTO produtos (id, slug_dono, nome_loja, nome, categoria,
               descricao, preco, quantidade, status, imagem, destaque)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
               RETURNING id, slug_dono, nome_loja, nome, categoria, descricao,
                         preco, quantidade, status, imagem, destaque, data_criacao""",
            (prod.id, prod.slug_dono, prod.nome_loja, prod.nome, prod.categoria,
             prod.descricao, prod.preco, prod.quantidade, prod.status,
             prod.imagem, prod.destaque)
        )
        new_prod = cur.fetchone()
        conn.commit()
        return new_prod
```

### READ — listar produtos
```python
@app.get("/api/produtos", response_model=List[ProdutoBase])
def get_produtos(slug_dono: Optional[str] = None, conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        if slug_dono:  # filtra pelos produtos de uma loja
            cur.execute("SELECT ... FROM produtos WHERE slug_dono = %s "
                        "ORDER BY data_criacao DESC", (slug_dono,))
        else:
            cur.execute("SELECT ... FROM produtos ORDER BY data_criacao DESC")
        return cur.fetchall()
```

### UPDATE — editar produto
```python
@app.put("/api/produtos/{prod_id}", response_model=ProdutoBase)
def update_produto(prod_id: str, prod: ProdutoUpdate, conn = Depends(get_db_connection),
                   _user: dict = Depends(require_management)):
    with conn.cursor() as cur:
        cur.execute(
            """UPDATE produtos SET nome = %s, categoria = %s, descricao = %s,
               preco = %s, quantidade = %s, status = %s, imagem = %s, destaque = %s
               WHERE id = %s RETURNING ...""",
            (prod.nome, prod.categoria, prod.descricao, prod.preco, prod.quantidade,
             prod.status, prod.imagem, prod.destaque, prod_id)
        )
        updated = cur.fetchone()
        if not updated:
            raise HTTPException(status_code=404, detail="Produto não encontrado")
        conn.commit()
        return updated
```

### DELETE — excluir produto
```python
@app.delete("/api/produtos/{prod_id}")
def delete_produto(prod_id: str, conn = Depends(get_db_connection),
                   _user: dict = Depends(require_management)):
    with conn.cursor() as cur:
        cur.execute("DELETE FROM produtos WHERE id = %s RETURNING id", (prod_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Produto não encontrado")
        conn.commit()
        return {"success": True, "message": "Produto excluído com sucesso"}
```

> Observacao tecnica: todas as consultas usam **parametros (`%s`)** em vez de concatenar
> strings, o que protege contra **SQL Injection**.

### 5.1 Preenchimento automatico do endereco pelo CEP (integracao ViaCEP)

No cadastro/edicao da loja, quando o administrador digita o **CEP** e sai do campo, o
sistema consulta a **API publica ViaCEP** e preenche o endereco (rua, bairro, cidade e UF)
automaticamente, evitando digitacao manual e erros. Codigo em `js/script.js`:

```javascript
storeFields.cep.addEventListener("blur", async () => {
    const rawCep = storeFields.cep.value.replace(/\D/g, "");   // mantem so numeros
    if (rawCep.length !== 8) return;                           // CEP tem 8 digitos

    // consulta a API publica dos Correios (ViaCEP)
    const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
    const data = await response.json();

    if (data.erro) {
        showMessage("CEP nao encontrado. Confira o numero informado.", "warning");
        return;
    }

    // monta "Rua, Bairro, Cidade - UF" e preenche o campo de localizacao
    const address = [data.logradouro, data.bairro, `${data.localidade} - ${data.uf}`]
        .filter(Boolean)
        .join(", ");
    storeFields.location.value = address;
});
```

**Como funciona (passo a passo):**
1. O evento `blur` dispara quando o usuario sai do campo do CEP.
2. `replace(/\D/g, "")` remove tudo que nao for numero e o codigo so segue com 8 digitos.
3. `fetch` consulta `https://viacep.com.br/ws/{cep}/json/` e recebe um JSON com o endereco.
4. Se o CEP nao existe (`data.erro`), avisa o usuario.
5. Os campos retornados (`logradouro`, `bairro`, `localidade`, `uf`) sao juntados no
   formato "Rua, Bairro, Cidade - UF" e gravados no campo de localizacao.

Esse mesmo endereco, junto com o CEP, e usado depois para posicionar a loja com precisao
no mapa (Google Maps).

---

## 6. Seguranca

A seguranca combina **hash de senha (bcrypt)** com **autenticacao por token JWT**.
Todo o codigo fica em `backend/security.py`.

### 6.1 Hash de senha (as senhas nunca ficam em texto puro)
```python
import bcrypt

def hash_password(plain_password: str) -> str:
    """Gera o hash bcrypt de uma senha."""
    senha_bytes = (plain_password or "").encode("utf-8")[:72]
    return bcrypt.hashpw(senha_bytes, bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, stored_value: str) -> bool:
    """Confere a senha; aceita banco antigo em texto puro (compatibilidade)."""
    if is_bcrypt_hash(stored_value):
        return bcrypt.checkpw(plain_password.encode("utf-8")[:72],
                              stored_value.encode("utf-8"))
    return plain_password == stored_value  # valor legado
```

### 6.2 Token de acesso JWT
```python
import jwt, datetime

def create_access_token(email: str, role: str) -> str:
    """Cria um token JWT assinado com o e-mail e o papel, valido por 12h."""
    agora = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "sub": email,
        "role": role,
        "iat": agora,
        "exp": agora + datetime.timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> dict:
    """Valida e decodifica o token (lanca erro se invalido/expirado)."""
    return jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
```

### 6.3 Login: verifica a senha e emite o token
```python
@app.post("/api/auth/login", response_model=UserSession)
def login(req: LoginRequest, conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute("SELECT email, senha, nome, funcao, slug_loja FROM usuarios "
                    "WHERE email = %s AND funcao = %s", (req.email, req.role))
        user = cur.fetchone()

        # senha conferida com bcrypt
        if not user or not verify_password(req.password, user["senha"]):
            raise HTTPException(status_code=401,
                detail="E-mail ou senha incorretos para este tipo de acesso.")

        # migracao transparente: senha antiga em texto puro vira hash
        if not is_bcrypt_hash(user["senha"]):
            cur.execute("UPDATE usuarios SET senha = %s WHERE email = %s",
                        (hash_password(req.password), user["email"]))
            conn.commit()

        token = create_access_token(user["email"], user["funcao"])
        return UserSession(email=user["email"], role=user["funcao"],
                           name=user["nome"], storeSlug=user["slug_loja"],
                           loggedAt=datetime.datetime.now().isoformat(), token=token)
```

### 6.4 Rotas protegidas por token e por papel
```python
def get_current_user(authorization: Optional[str] = Header(default=None)) -> dict:
    """Valida o token do cabecalho 'Authorization: Bearer <token>'."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Autenticacao necessaria.")
    token = authorization.split(" ", 1)[1].strip()
    try:
        return decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessao expirada.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token invalido.")

def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acesso apenas para administradores.")
    return user
```

As operacoes de escrita usam essas dependencias: **lojas** exigem `require_admin`;
**produtos, categorias, cupons e status de pedido** exigem `require_management`
(comerciante ou admin). As leituras publicas continuam abertas.

### 6.5 Frontend envia o token automaticamente
No `js/script.js`, um "wrapper" sobre o `fetch` anexa o token em toda chamada a API:
```javascript
const _originalFetch = window.fetch.bind(window);
window.fetch = function (resource, options = {}) {
    if (typeof resource === "string" && resource.startsWith(API_BASE)) {
        const session = JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || "null");
        if (session && session.token) {
            options.headers = { ...(options.headers || {}),
                                Authorization: `Bearer ${session.token}` };
        }
    }
    return _originalFetch(resource, options);
};
```

### Resumo dos atributos de seguranca
- **Confidencialidade das senhas:** hash bcrypt (com salt) — irreversivel.
- **Autenticacao:** token JWT assinado, com validade (expira em 12h).
- **Autorizacao:** controle de acesso por papel (admin / comerciante / cliente).
- **Integridade das consultas:** SQL parametrizado (anti SQL Injection).
- **Chave secreta configuravel:** variavel de ambiente `VITRINE_SECRET`.

---

## 7. Principais fluxos do sistema

1. **Compra (cliente):** navega -> adiciona ao carrinho -> aplica cupom -> finaliza
   pedido (baixa de estoque) -> imprime a nota com o desconto -> acompanha em "Meus Pedidos".
2. **Gestao de produtos (lojista):** cadastra/edita/exclui produtos da sua loja e
   acompanha os pedidos.
3. **Administracao (admin):** cadastra e aprova lojas, cria as contas dos lojistas,
   gerencia categorias e cupons e visualiza clientes.
4. **Login e sessao:** o token e guardado no navegador; o menu mostra quem esta logado
   e da acesso ao painel (lojista/admin) ou aos pedidos (cliente).

---

## 8. Como executar

O passo a passo completo (instalar dependencias, criar o banco, popular os dados e
iniciar backend e frontend) esta no arquivo **[README.md](README.md)**.

Resumo:
```cmd
python -m venv vitrine
vitrine\Scripts\activate
pip install -r backend\requirements.txt
createdb -U postgres vitrine
python backend\db_setup.py
python backend\main.py
python -m http.server 5500
```
Depois abrir `http://localhost:5500/Index.html`.
