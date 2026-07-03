from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import psycopg

try:
    from backend.database import get_db_connection
except ImportError:
    from database import get_db_connection

app = FastAPI(title="LocalMarket API", version="1.0.0")

# Habilitar CORS para permitir requisições do frontend local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# SCHEMAS PYDANTIC
# ==========================================

class LoginRequest(BaseModel):
    email: str
    password: str
    role: str

class UserSession(BaseModel):
    email: str
    role: str
    name: str
    storeSlug: Optional[str] = None
    loggedAt: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

class UserPublic(BaseModel):
    email: str
    name: str
    funcao: str
    slug_loja: Optional[str] = None
    data_criacao: Optional[str] = None

class OrderItem(BaseModel):
    produto_id: str
    quantidade: int

class OrderCreate(BaseModel):
    usuario_email: str
    itens: List[OrderItem]
    total: float
    cupom_codigo: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    atualizado_por: str
    status: str

class OrderItemResponse(BaseModel):
    produto_id: str
    quantidade: int
    preco_unitario: float

class OrderResponse(BaseModel):
    id: int
    usuario_email: str
    status: str
    total: float
    cupom_codigo: Optional[str] = None
    desconto_total: float = 0
    criado_em: Optional[str] = None

class OrderDetailResponse(OrderResponse):
    itens: List[OrderItemResponse] = []

ORDER_STATUS_FLOW = [
    "Pendente",
    "Em separacao",
    "Enviado",
    "Entregue"
]

def ensure_valid_order_status(value: str) -> str:
    normalized = value.strip()
    if normalized not in ORDER_STATUS_FLOW:
        raise HTTPException(status_code=400, detail="Status de pedido invalido.")
    return normalized

def can_manage_order(conn, pedido_id: int, user_email: str) -> bool:
    with conn.cursor() as cur:
        cur.execute("SELECT funcao, slug_loja FROM usuarios WHERE email = %s", (user_email,))
        usuario = cur.fetchone()
        if not usuario:
            return False

        if usuario["funcao"] == "admin":
            return True

        if usuario["funcao"] != "comerciante" or not usuario["slug_loja"]:
            return False

        cur.execute(
            """SELECT 1
               FROM pedido_items pi
               JOIN produtos p ON p.id = pi.produto_id
               WHERE pi.pedido_id = %s AND p.slug_dono = %s
               LIMIT 1""",
            (pedido_id, usuario["slug_loja"])
        )
        return cur.fetchone() is not None

def ensure_lojas_schema(conn) -> None:
    with conn.cursor() as cur:
        cur.execute("ALTER TABLE lojas ADD COLUMN IF NOT EXISTS nome_proprietario VARCHAR(255)")
        cur.execute("ALTER TABLE lojas ADD COLUMN IF NOT EXISTS email_proprietario VARCHAR(255)")
        cur.execute("ALTER TABLE lojas ADD COLUMN IF NOT EXISTS data_nascimento_proprietario DATE")
    conn.commit()

def normalize_store_slug(value: str) -> str:
    slug = value.lower().strip()
    replacements = {
        "a": ["á", "à", "ã", "â"],
        "e": ["é", "ê"],
        "i": ["í"],
        "o": ["ó", "õ", "ô"],
        "u": ["ú"],
        "c": ["ç"]
    }

    for replacement, chars in replacements.items():
        for char in chars:
            slug = slug.replace(char, replacement)

    allowed = []
    for char in slug:
        if char.isalnum():
            allowed.append(char)
        elif char in {" ", "-", "_"}:
            allowed.append("-")

    normalized = "".join(allowed).strip("-")
    while "--" in normalized:
        normalized = normalized.replace("--", "-")
    return normalized or "loja"

def build_unique_store_slug(cur, store_name: str, loja_id: Optional[str] = None) -> str:
    import time

    base_slug = normalize_store_slug(store_name)
    slug = base_slug
    suffix = 1

    while True:
        if loja_id:
            cur.execute(
                "SELECT id FROM lojas WHERE slug_loja = %s AND id <> %s",
                (slug, loja_id)
            )
        else:
            cur.execute("SELECT id FROM lojas WHERE slug_loja = %s", (slug,))

        if not cur.fetchone():
            return slug

        slug = f"{base_slug}-{suffix}-{int(time.time() % 1000)}"
        suffix += 1

def sync_merchant_user(
    cur,
    *,
    slug_loja: str,
    nome_proprietario: str,
    email_proprietario: str,
    senha_proprietario: Optional[str],
    current_email: Optional[str] = None
) -> None:
    lookup_email = current_email or email_proprietario

    try:
        cur.execute(
            "SELECT email, funcao FROM usuarios WHERE email = %s",
            (lookup_email,)
        )
        existing_user = cur.fetchone()

        if existing_user:
            if existing_user["funcao"] != "comerciante":
                raise HTTPException(status_code=409, detail="O e-mail informado ja esta vinculado a outro tipo de usuario.")

            if email_proprietario != lookup_email:
                cur.execute("SELECT email FROM usuarios WHERE email = %s", (email_proprietario,))
                conflict = cur.fetchone()
                if conflict:
                    raise HTTPException(status_code=409, detail="O novo e-mail do lojista ja esta em uso.")

            if senha_proprietario:
                cur.execute(
                    """UPDATE usuarios
                       SET email = %s, nome = %s, senha = %s, slug_loja = %s
                       WHERE email = %s AND funcao = 'comerciante'""",
                    (email_proprietario, nome_proprietario, senha_proprietario, slug_loja, lookup_email)
                )
            else:
                cur.execute(
                    """UPDATE usuarios
                       SET email = %s, nome = %s, slug_loja = %s
                       WHERE email = %s AND funcao = 'comerciante'""",
                    (email_proprietario, nome_proprietario, slug_loja, lookup_email)
                )
            return

        cur.execute("SELECT email FROM usuarios WHERE email = %s", (email_proprietario,))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="O e-mail do lojista ja esta em uso por outro usuario.")

        if not senha_proprietario:
            raise HTTPException(status_code=400, detail="Informe uma senha para criar o acesso do lojista.")

        cur.execute(
            """INSERT INTO usuarios (email, senha, nome, funcao, slug_loja)
               VALUES (%s, %s, %s, 'comerciante', %s)""",
            (email_proprietario, senha_proprietario, nome_proprietario, slug_loja)
        )
    except psycopg.Error as exc:
        raise HTTPException(
            status_code=409,
            detail="Nao foi possivel atualizar o acesso do lojista. Verifique e-mail, senha e vinculacoes existentes."
        ) from exc

class LojaBase(BaseModel):
    id: str
    nome: str
    categoria: Optional[str] = None
    localizacao: Optional[str] = None
    status: str
    slug_loja: str
    nome_proprietario: Optional[str] = None
    email_proprietario: Optional[str] = None
    data_nascimento_proprietario: Optional[str] = None
    data_criacao: Optional[str] = None

class LojaCreate(BaseModel):
    nome: str
    categoria: str
    localizacao: Optional[str] = None
    nome_proprietario: str
    email_proprietario: str
    data_nascimento_proprietario: str
    senha_proprietario: str
    status: str = "Pendente"

class LojaUpdate(BaseModel):
    nome: str
    categoria: str
    localizacao: Optional[str] = None
    nome_proprietario: str
    email_proprietario: str
    data_nascimento_proprietario: str
    senha_proprietario: Optional[str] = None
    status: str

class ProdutoBase(BaseModel):
    id: str
    slug_dono: Optional[str] = None
    nome_loja: str
    nome: str
    categoria: str
    descricao: Optional[str] = None
    preco: float
    quantidade: int
    status: str
    imagem: Optional[str] = None
    destaque: bool = False
    createdAt: Optional[str] = Field(None, alias="data_criacao")

    class Config:
        populate_by_name = True

class ProdutoCreate(BaseModel):
    id: str
    slug_dono: Optional[str] = None
    nome_loja: str
    nome: str
    categoria: str
    descricao: Optional[str] = None
    preco: float
    quantidade: int
    status: str
    imagem: Optional[str] = None
    destaque: bool = False

class ProdutoUpdate(BaseModel):
    nome: str
    categoria: str
    descricao: Optional[str] = None
    preco: float
    quantidade: int
    status: str
    imagem: Optional[str] = None
    destaque: bool = False

class CarrinhoItem(BaseModel):
    id: str # id do produto
    quantity: int = Field(..., alias="quantidade")
    addedAt: Optional[str] = Field(None, alias="adicionado_em")

    class Config:
        populate_by_name = True

class CarrinhoUpdate(BaseModel):
    usuario_email: str
    produto_id: str
    quantidade: int

class FavoritoRequest(BaseModel):
    usuario_email: str
    produto_id: str

class CupomBase(BaseModel):
    codigo: str
    descricao: Optional[str] = None
    tipo: str = "percentual"
    valor: float
    loja_slug: Optional[str] = None
    categoria: Optional[str] = None
    ativo: bool = True

class CupomCreate(CupomBase):
    criado_por: str

class CupomResponse(CupomBase):
    id: int
    criado_por: str
    data_criacao: Optional[str] = None

class CupomValidationItem(BaseModel):
    produto_id: str
    quantidade: int

class CupomValidationRequest(BaseModel):
    codigo: str
    itens: List[CupomValidationItem]

class CupomValidationResponse(BaseModel):
    codigo: str
    aplicavel: bool
    tipo: str
    valor: float
    desconto: float
    descricao: Optional[str] = None
    loja_slug: Optional[str] = None
    categoria: Optional[str] = None
    mensagem: str

# ==========================================
# ENDPOINTS - AUTENTICAÇÃO
# ==========================================

@app.post("/api/auth/login", response_model=UserSession)
def login(req: LoginRequest, conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT email, senha, nome, funcao, slug_loja FROM usuarios WHERE email = %s AND funcao = %s",
            (req.email, req.role)
        )
        user = cur.fetchone()
        
        if not user or user["senha"] != req.password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="E-mail ou senha incorretos para este tipo de acesso."
            )
        
        import datetime
        return UserSession(
            email=user["email"],
            role=user["funcao"],
            name=user["nome"],
            storeSlug=user["slug_loja"],
            loggedAt=datetime.datetime.now().isoformat()
        )

@app.post("/api/auth/register", response_model=UserSession)
def register(req: RegisterRequest, conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute("SELECT email FROM usuarios WHERE email = %s", (req.email,))
        if cur.fetchone():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail já cadastrado.")

        cur.execute(
            "INSERT INTO usuarios (email, senha, nome, funcao) VALUES (%s, %s, %s, 'cliente') RETURNING email, nome, funcao, slug_loja",
            (req.email, req.password, req.name)
        )
        user = cur.fetchone()
        conn.commit()

        import datetime
        return UserSession(
            email=user["email"],
            role=user["funcao"],
            name=user["nome"],
            storeSlug=user["slug_loja"],
            loggedAt=datetime.datetime.now().isoformat()
        )

@app.get("/api/usuarios", response_model=List[UserPublic])
def get_usuarios(role: Optional[str] = None, conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        if role:
            cur.execute(
                "SELECT email, nome, funcao, slug_loja, data_criacao FROM usuarios WHERE funcao = %s ORDER BY data_criacao DESC",
                (role,)
            )
        else:
            cur.execute(
                "SELECT email, nome, funcao, slug_loja, data_criacao FROM usuarios ORDER BY data_criacao DESC"
            )
        users = cur.fetchall()
        response_users = []
        for user in users:
            payload = {
                "email": user["email"],
                "name": user["nome"],
                "funcao": user["funcao"],
                "slug_loja": user["slug_loja"],
                "data_criacao": user["data_criacao"].isoformat() if user["data_criacao"] else None,
            }
            response_users.append(payload)
        return response_users

@app.get("/api/cupons", response_model=List[CupomResponse])
def get_cupons(email: Optional[str] = None, conn = Depends(get_db_connection)):
    if not email:
        return []

    with conn.cursor() as cur:
        cur.execute("SELECT email, funcao, slug_loja FROM usuarios WHERE email = %s", (email,))
        usuario = cur.fetchone()
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")

        if usuario["funcao"] == "admin":
            cur.execute(
                "SELECT id, codigo, descricao, tipo, valor, loja_slug, categoria, ativo, criado_por, data_criacao FROM cupons ORDER BY data_criacao DESC"
            )
        else:
            cur.execute(
                "SELECT id, codigo, descricao, tipo, valor, loja_slug, categoria, ativo, criado_por, data_criacao FROM cupons WHERE criado_por = %s OR loja_slug = %s ORDER BY data_criacao DESC",
                (email, usuario["slug_loja"])
            )

        cupons = cur.fetchall()
        for cupom in cupons:
            if cupom["data_criacao"]:
                cupom["data_criacao"] = cupom["data_criacao"].isoformat()
        return cupons

@app.post("/api/cupons", response_model=CupomResponse)
def create_cupom(req: CupomCreate, conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute("SELECT email, funcao, slug_loja FROM usuarios WHERE email = %s", (req.criado_por,))
        usuario = cur.fetchone()
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")

        if usuario["funcao"] == "comerciante":
            if req.loja_slug and req.loja_slug != usuario["slug_loja"]:
                raise HTTPException(status_code=403, detail="Lojista só pode criar cupons para a sua loja.")
            req.loja_slug = usuario["slug_loja"]
        elif usuario["funcao"] != "admin":
            raise HTTPException(status_code=403, detail="Acesso não autorizado.")

        cur.execute("SELECT id FROM cupons WHERE codigo = %s", (req.codigo.upper(),))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="Código de cupom já existe.")

        cur.execute(
            """INSERT INTO cupons (codigo, descricao, tipo, valor, loja_slug, categoria, ativo, criado_por)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
               RETURNING id, codigo, descricao, tipo, valor, loja_slug, categoria, ativo, criado_por, data_criacao""",
            (req.codigo.upper(), req.descricao, req.tipo, req.valor, req.loja_slug, req.categoria, req.ativo, req.criado_por)
        )
        cupom = cur.fetchone()
        conn.commit()

        if cupom["data_criacao"]:
            cupom["data_criacao"] = cupom["data_criacao"].isoformat()
        return cupom

@app.post("/api/cupons/validar", response_model=CupomValidationResponse)
def validar_cupom(req: CupomValidationRequest, conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, codigo, descricao, tipo, valor, loja_slug, categoria, ativo FROM cupons WHERE codigo = %s AND ativo = TRUE",
            (req.codigo.upper(),)
        )
        cupom = cur.fetchone()
        if not cupom:
            raise HTTPException(status_code=404, detail="Cupom não encontrado ou inativo.")

        subtotal = 0.0
        subtotal_elegivel = 0.0

        for item in req.itens:
            cur.execute("SELECT slug_dono, categoria, preco FROM produtos WHERE id = %s", (item.produto_id,))
            produto = cur.fetchone()
            if not produto:
                continue

            item_total = float(produto["preco"]) * item.quantidade
            subtotal += item_total

            aplicavel = True
            if cupom["loja_slug"] and produto["slug_dono"] != cupom["loja_slug"]:
                aplicavel = False
            if aplicavel and cupom["categoria"] and produto["categoria"] != cupom["categoria"]:
                aplicavel = False

            if aplicavel:
                subtotal_elegivel += item_total

        if subtotal_elegivel <= 0:
            return CupomValidationResponse(
                codigo=cupom["codigo"],
                aplicavel=False,
                tipo=cupom["tipo"],
                valor=float(cupom["valor"]),
                desconto=0.0,
                descricao=cupom["descricao"],
                loja_slug=cupom["loja_slug"],
                categoria=cupom["categoria"],
                mensagem="Cupom não é aplicável a este carrinho."
            )

        if cupom["tipo"] == "percentual":
            desconto = round(subtotal_elegivel * (float(cupom["valor"]) / 100), 2)
        else:
            desconto = round(min(subtotal_elegivel, float(cupom["valor"])), 2)

        return CupomValidationResponse(
            codigo=cupom["codigo"],
            aplicavel=True,
            tipo=cupom["tipo"],
            valor=float(cupom["valor"]),
            desconto=desconto,
            descricao=cupom["descricao"],
            loja_slug=cupom["loja_slug"],
            categoria=cupom["categoria"],
            mensagem="Cupom aplicado com sucesso."
        )

@app.post("/api/pedidos", response_model=OrderResponse)
def create_pedido(req: OrderCreate, conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute("SELECT email FROM usuarios WHERE email = %s AND funcao = 'cliente'", (req.usuario_email,))
        if not cur.fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado.")

        desconto_total = 0.0
        cupom_codigo = req.cupom_codigo.upper() if req.cupom_codigo else None

        if cupom_codigo:
            cur.execute(
                "SELECT codigo, tipo, valor, loja_slug, categoria FROM cupons WHERE codigo = %s AND ativo = TRUE",
                (cupom_codigo,)
            )
            cupom = cur.fetchone()
            if cupom:
                subtotal_elegivel = 0.0
                for item in req.itens:
                    cur.execute("SELECT slug_dono, categoria, preco FROM produtos WHERE id = %s", (item.produto_id,))
                    produto = cur.fetchone()
                    if not produto:
                        continue

                    item_total = float(produto["preco"]) * item.quantidade
                    aplicavel = True
                    if cupom["loja_slug"] and produto["slug_dono"] != cupom["loja_slug"]:
                        aplicavel = False
                    if aplicavel and cupom["categoria"] and produto["categoria"] != cupom["categoria"]:
                        aplicavel = False
                    if aplicavel:
                        subtotal_elegivel += item_total

                if subtotal_elegivel > 0:
                    if cupom["tipo"] == "percentual":
                        desconto_total = round(subtotal_elegivel * (float(cupom["valor"]) / 100), 2)
                    else:
                        desconto_total = round(min(subtotal_elegivel, float(cupom["valor"])), 2)
                    desconto_total = round(min(desconto_total, float(req.total)), 2)

        total_final = round(float(req.total) - desconto_total, 2)

        for item in req.itens:
            cur.execute("SELECT id, quantidade, nome FROM produtos WHERE id = %s", (item.produto_id,))
            produto = cur.fetchone()
            if not produto:
                raise HTTPException(status_code=404, detail=f"Produto não encontrado: {item.produto_id}")
            if produto["quantidade"] < item.quantidade:
                raise HTTPException(status_code=400, detail=f"Estoque insuficiente para {produto['nome']}")

        cur.execute(
            "INSERT INTO pedidos (usuario_email, total, status, cupom_codigo, desconto_total) VALUES (%s, %s, 'Pendente', %s, %s) RETURNING id, usuario_email, total, status, cupom_codigo, desconto_total, criado_em",
            (req.usuario_email, total_final, cupom_codigo, desconto_total)
        )
        pedido = cur.fetchone()

        for item in req.itens:
            cur.execute(
                "INSERT INTO pedido_items (pedido_id, produto_id, quantidade, preco_unitario) VALUES (%s, %s, %s, (SELECT preco FROM produtos WHERE id = %s))",
                (pedido["id"], item.produto_id, item.quantidade, item.produto_id)
            )
            cur.execute(
                "UPDATE produtos SET quantidade = quantidade - %s WHERE id = %s",
                (item.quantidade, item.produto_id)
            )

        conn.commit()

        if pedido["criado_em"]:
            pedido["criado_em"] = pedido["criado_em"].isoformat()
        return pedido

@app.get("/api/pedidos", response_model=List[OrderResponse])
def get_pedidos(email: Optional[str] = None, conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        if email:
            cur.execute("SELECT email, funcao, slug_loja FROM usuarios WHERE email = %s", (email,))
            usuario = cur.fetchone()
            if not usuario:
                raise HTTPException(status_code=404, detail="Usuário não encontrado.")

            if usuario["funcao"] == "cliente":
                cur.execute(
                    "SELECT id, usuario_email, total, status, criado_em FROM pedidos WHERE usuario_email = %s ORDER BY criado_em DESC",
                    (email,)
                )
            elif usuario["funcao"] == "comerciante":
                cur.execute(
                    """SELECT DISTINCT p.id, p.usuario_email, p.total, p.status, p.criado_em
                       FROM pedidos p
                       JOIN pedido_items pi ON pi.pedido_id = p.id
                       JOIN produtos pr ON pr.id = pi.produto_id
                       WHERE pr.slug_dono = %s
                       ORDER BY p.criado_em DESC""",
                    (usuario["slug_loja"],)
                )
            else:
                cur.execute(
                    "SELECT id, usuario_email, total, status, criado_em FROM pedidos ORDER BY criado_em DESC"
                )
        else:
            cur.execute(
                "SELECT id, usuario_email, total, status, criado_em FROM pedidos ORDER BY criado_em DESC"
            )
        orders = cur.fetchall()
        for order in orders:
            if order["criado_em"]:
                order["criado_em"] = order["criado_em"].isoformat()
        return orders

@app.put("/api/pedidos/{pedido_id}/status", response_model=OrderResponse)
def update_pedido_status(pedido_id: int, req: OrderStatusUpdate, conn = Depends(get_db_connection)):
    novo_status = ensure_valid_order_status(req.status)

    if not can_manage_order(conn, pedido_id, req.atualizado_por):
        raise HTTPException(status_code=403, detail="Usuário não autorizado a atualizar este pedido.")

    with conn.cursor() as cur:
        cur.execute(
            """UPDATE pedidos
               SET status = %s
               WHERE id = %s
               RETURNING id, usuario_email, status, total, cupom_codigo, desconto_total, criado_em""",
            (novo_status, pedido_id)
        )
        pedido = cur.fetchone()
        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido não encontrado.")
        conn.commit()

        if pedido["criado_em"]:
            pedido["criado_em"] = pedido["criado_em"].isoformat()
        return pedido

@app.get("/api/pedidos/{pedido_id}", response_model=OrderDetailResponse)
def get_pedido(pedido_id: int, conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, usuario_email, total, status, criado_em FROM pedidos WHERE id = %s",
            (pedido_id,)
        )
        pedido = cur.fetchone()
        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido não encontrado.")

        cur.execute(
            "SELECT produto_id, quantidade, preco_unitario FROM pedido_items WHERE pedido_id = %s",
            (pedido_id,)
        )
        itens = cur.fetchall()

        if pedido["criado_em"]:
            pedido["criado_em"] = pedido["criado_em"].isoformat()

        return {**pedido, "itens": itens}

# ==========================================
# ENDPOINTS - LOJAS
# ==========================================

@app.get("/api/lojas", response_model=List[LojaBase])
def get_lojas(conn = Depends(get_db_connection)):
    ensure_lojas_schema(conn)
    with conn.cursor() as cur:
        cur.execute(
            """SELECT id, nome, categoria, localizacao, status, slug_loja,
                      nome_proprietario, email_proprietario, data_nascimento_proprietario, data_criacao
               FROM lojas
               ORDER BY nome"""
        )
        lojas = cur.fetchall()
        for loja in lojas:
            if loja.get("data_nascimento_proprietario"):
                loja["data_nascimento_proprietario"] = loja["data_nascimento_proprietario"].isoformat()
            if loja.get("data_criacao"):
                loja["data_criacao"] = loja["data_criacao"].isoformat()
        return lojas

@app.post("/api/lojas", response_model=LojaBase)
def create_loja(req: LojaCreate, conn = Depends(get_db_connection)):
    import time
    ensure_lojas_schema(conn)
    id_org = f"ORG-{int(time.time() * 1000)}"
    with conn.cursor() as cur:
        slug = build_unique_store_slug(cur, req.nome)
        cur.execute("SELECT id FROM lojas WHERE email_proprietario = %s", (req.email_proprietario,))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="Ja existe uma loja vinculada a este e-mail de proprietario.")

        sync_merchant_user(
            cur,
            slug_loja=slug,
            nome_proprietario=req.nome_proprietario,
            email_proprietario=req.email_proprietario,
            senha_proprietario=req.senha_proprietario
        )

        cur.execute(
            """INSERT INTO lojas (
                    id, nome, categoria, localizacao, status, slug_loja,
                    nome_proprietario, email_proprietario, data_nascimento_proprietario
               )
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
               RETURNING id, nome, categoria, localizacao, status, slug_loja,
                         nome_proprietario, email_proprietario, data_nascimento_proprietario, data_criacao""",
            (
                id_org,
                req.nome,
                req.categoria,
                req.localizacao or "Nao informado",
                req.status or "Pendente",
                slug,
                req.nome_proprietario,
                req.email_proprietario,
                req.data_nascimento_proprietario
            )
        )
        new_loja = cur.fetchone()
        conn.commit()

        if new_loja.get("data_nascimento_proprietario"):
            new_loja["data_nascimento_proprietario"] = new_loja["data_nascimento_proprietario"].isoformat()
        if new_loja.get("data_criacao"):
            new_loja["data_criacao"] = new_loja["data_criacao"].isoformat()
        return new_loja

    slug = None
    
    with conn.cursor() as cur:
        # Verificar se o slug já existe
        slug = build_unique_store_slug(cur, req.nome)
        cur.execute("SELECT id FROM lojas WHERE email_proprietario = %s", (req.email_proprietario,))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="Ja existe uma loja vinculada a este e-mail de proprietario.")
            
        cur.execute(
            """INSERT INTO lojas (id, nome, categoria, localizacao, status, slug_loja) 
               VALUES (%s, %s, 'Geral', 'Não informado', 'Pendente', %s) 
               RETURNING id, nome, categoria, localizacao, status, slug_loja""",
            (id_org, req.nome, slug)
        )
        new_loja = cur.fetchone()
        conn.commit()
        return new_loja

@app.put("/api/lojas/{loja_id}", response_model=LojaBase)
def update_loja(loja_id: str, req: LojaUpdate, conn = Depends(get_db_connection)):
    ensure_lojas_schema(conn)

    with conn.cursor() as cur:
        cur.execute("SELECT id, slug_loja, nome, email_proprietario FROM lojas WHERE id = %s", (loja_id,))
        existing_loja = cur.fetchone()
        if not existing_loja:
            raise HTTPException(status_code=404, detail="Loja nao encontrada")

        cur.execute(
            "SELECT id FROM lojas WHERE email_proprietario = %s AND id <> %s",
            (req.email_proprietario, loja_id)
        )
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="Ja existe outra loja vinculada a este e-mail de proprietario.")

        slug = existing_loja["slug_loja"] or build_unique_store_slug(cur, req.nome, loja_id)

        sync_merchant_user(
            cur,
            slug_loja=slug,
            nome_proprietario=req.nome_proprietario,
            email_proprietario=req.email_proprietario,
            senha_proprietario=req.senha_proprietario,
            current_email=existing_loja.get("email_proprietario")
        )

        cur.execute(
            """UPDATE lojas
               SET nome = %s,
                   categoria = %s,
                   localizacao = %s,
                   status = %s,
                   slug_loja = %s,
                   nome_proprietario = %s,
                   email_proprietario = %s,
                   data_nascimento_proprietario = %s
               WHERE id = %s
               RETURNING id, nome, categoria, localizacao, status, slug_loja,
                         nome_proprietario, email_proprietario, data_nascimento_proprietario, data_criacao""",
            (
                req.nome,
                req.categoria,
                req.localizacao or "Nao informado",
                req.status,
                slug,
                req.nome_proprietario,
                req.email_proprietario,
                req.data_nascimento_proprietario,
                loja_id
            )
        )
        updated_loja = cur.fetchone()

        if existing_loja["nome"] != req.nome:
            cur.execute(
                "UPDATE produtos SET nome_loja = %s WHERE slug_dono = %s",
                (req.nome, slug)
            )

        conn.commit()

        if updated_loja.get("data_nascimento_proprietario"):
            updated_loja["data_nascimento_proprietario"] = updated_loja["data_nascimento_proprietario"].isoformat()
        if updated_loja.get("data_criacao"):
            updated_loja["data_criacao"] = updated_loja["data_criacao"].isoformat()
        return updated_loja

@app.put("/api/lojas/{loja_id}/status", response_model=LojaBase)
def toggle_loja_status(loja_id: str, conn = Depends(get_db_connection)):
    ensure_lojas_schema(conn)
    with conn.cursor() as cur:
        cur.execute("SELECT status FROM lojas WHERE id = %s", (loja_id,))
        loja = cur.fetchone()
        if not loja:
            raise HTTPException(status_code=404, detail="Loja não encontrada")
            
        new_status = "Pendente" if loja["status"] == "Ativo" else "Ativo"
        cur.execute(
            """UPDATE lojas
               SET status = %s
               WHERE id = %s
               RETURNING id, nome, categoria, localizacao, status, slug_loja,
                         nome_proprietario, email_proprietario, data_nascimento_proprietario, data_criacao""",
            (new_status, loja_id)
        )
        updated_loja = cur.fetchone()
        conn.commit()
        if updated_loja.get("data_nascimento_proprietario"):
            updated_loja["data_nascimento_proprietario"] = updated_loja["data_nascimento_proprietario"].isoformat()
        if updated_loja.get("data_criacao"):
            updated_loja["data_criacao"] = updated_loja["data_criacao"].isoformat()
        return updated_loja

@app.delete("/api/lojas/{loja_id}")
def delete_loja(loja_id: str, conn = Depends(get_db_connection)):
    ensure_lojas_schema(conn)
    with conn.cursor() as cur:
        cur.execute("DELETE FROM lojas WHERE id = %s RETURNING id", (loja_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Loja não encontrada")
        conn.commit()
        return {"success": True, "message": "Loja excluída com sucesso"}

# ==========================================
# ENDPOINTS - PRODUTOS
# ==========================================

@app.get("/api/produtos", response_model=List[ProdutoBase])
def get_produtos(slug_dono: Optional[str] = None, conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        if slug_dono:
            cur.execute(
                """SELECT id, slug_dono, nome_loja, nome, categoria, descricao, preco, quantidade, status, imagem, destaque, data_criacao 
                   FROM produtos WHERE slug_dono = %s ORDER BY data_criacao DESC""",
                (slug_dono,)
            )
        else:
            cur.execute(
                """SELECT id, slug_dono, nome_loja, nome, categoria, descricao, preco, quantidade, status, imagem, destaque, data_criacao 
                   FROM produtos ORDER BY data_criacao DESC"""
            )
        
        produtos = cur.fetchall()
        # Formata o preço para float e a data para string ISO
        for prod in produtos:
            prod["preco"] = float(prod["preco"])
            if prod["data_criacao"]:
                prod["data_criacao"] = prod["data_criacao"].isoformat()
        return produtos

@app.get("/api/produtos/{prod_id}", response_model=ProdutoBase)
def get_produto(prod_id: str, conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute(
            """SELECT id, slug_dono, nome_loja, nome, categoria, descricao, preco, quantidade, status, imagem, destaque, data_criacao 
               FROM produtos WHERE id = %s""",
            (prod_id,)
        )
        prod = cur.fetchone()
        if not prod:
            raise HTTPException(status_code=404, detail="Produto não encontrado")
        prod["preco"] = float(prod["preco"])
        if prod["data_criacao"]:
            prod["data_criacao"] = prod["data_criacao"].isoformat()
        return prod

@app.post("/api/produtos", response_model=ProdutoBase)
def create_produto(prod: ProdutoCreate, conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute(
            """INSERT INTO produtos (id, slug_dono, nome_loja, nome, categoria, descricao, preco, quantidade, status, imagem, destaque) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) 
               RETURNING id, slug_dono, nome_loja, nome, categoria, descricao, preco, quantidade, status, imagem, destaque, data_criacao""",
            (prod.id, prod.slug_dono, prod.nome_loja, prod.nome, prod.categoria, prod.descricao, prod.preco, prod.quantidade, prod.status, prod.imagem, prod.destaque)
        )
        new_prod = cur.fetchone()
        conn.commit()
        new_prod["preco"] = float(new_prod["preco"])
        new_prod["data_criacao"] = new_prod["data_criacao"].isoformat()
        return new_prod

@app.put("/api/produtos/{prod_id}", response_model=ProdutoBase)
def update_produto(prod_id: str, prod: ProdutoUpdate, conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute(
            """UPDATE produtos SET 
               nome = %s, categoria = %s, descricao = %s, preco = %s, quantidade = %s, status = %s, imagem = %s, destaque = %s 
               WHERE id = %s 
               RETURNING id, slug_dono, nome_loja, nome, categoria, descricao, preco, quantidade, status, imagem, destaque, data_criacao""",
            (prod.nome, prod.categoria, prod.descricao, prod.preco, prod.quantidade, prod.status, prod.imagem, prod.destaque, prod_id)
        )
        updated = cur.fetchone()
        if not updated:
            raise HTTPException(status_code=404, detail="Produto não encontrado")
        conn.commit()
        updated["preco"] = float(updated["preco"])
        updated["data_criacao"] = updated["data_criacao"].isoformat()
        return updated

@app.delete("/api/produtos/{prod_id}")
def delete_produto(prod_id: str, conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute("DELETE FROM produtos WHERE id = %s RETURNING id", (prod_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Produto não encontrado")
        conn.commit()
        return {"success": True, "message": "Produto excluído com sucesso"}

# ==========================================
# ENDPOINTS - CARRINHO
# ==========================================

@app.get("/api/carrinho", response_model=List[CarrinhoItem])
def get_carrinho(email: str, conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT produto_id AS id, quantidade, adicionado_em FROM carrinhos WHERE usuario_email = %s",
            (email,)
        )
        itens = cur.fetchall()
        for item in itens:
            if item["adicionado_em"]:
                item["adicionado_em"] = item["adicionado_em"].isoformat()
        return itens

@app.post("/api/carrinho")
def update_carrinho(req: CarrinhoUpdate, conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        # Se quantidade <= 0, removemos o produto do carrinho
        if req.quantidade <= 0:
            cur.execute("DELETE FROM carrinhos WHERE usuario_email = %s AND produto_id = %s", (req.usuario_email, req.produto_id))
            conn.commit()
            return {"success": True, "message": "Produto removido do carrinho"}
            
        cur.execute(
            """INSERT INTO carrinhos (usuario_email, produto_id, quantidade) 
               VALUES (%s, %s, %s)
               ON CONFLICT (usuario_email, produto_id) 
               DO UPDATE SET quantidade = EXCLUDED.quantidade, adicionado_em = CURRENT_TIMESTAMP""",
            (req.usuario_email, req.produto_id, req.quantidade)
        )
        conn.commit()
        return {"success": True, "message": "Carrinho atualizado"}

@app.delete("/api/carrinho/{prod_id}")
def delete_item_carrinho(prod_id: str, email: str, conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute("DELETE FROM carrinhos WHERE usuario_email = %s AND produto_id = %s RETURNING id", (email, prod_id))
        conn.commit()
        return {"success": True, "message": "Item removido do carrinho"}

@app.post("/api/carrinho/limpar")
def clear_carrinho(email: str, conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute("DELETE FROM carrinhos WHERE usuario_email = %s", (email,))
        conn.commit()
        return {"success": True, "message": "Carrinho esvaziado"}

# ==========================================
# ENDPOINTS - FAVORITOS
# ==========================================

@app.get("/api/favoritos", response_model=List[str])
def get_favoritos(email: str, conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute("SELECT produto_id FROM favoritos WHERE usuario_email = %s", (email,))
        return [row["produto_id"] for row in cur.fetchall()]

@app.post("/api/favoritos")
def toggle_favorito(req: FavoritoRequest, conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id FROM favoritos WHERE usuario_email = %s AND produto_id = %s",
            (req.usuario_email, req.produto_id)
        )
        fav = cur.fetchone()
        
        if fav:
            cur.execute("DELETE FROM favoritos WHERE id = %s", (fav["id"],))
            message = "Removido dos favoritos"
            is_favorite = False
        else:
            cur.execute("INSERT INTO favoritos (usuario_email, produto_id) VALUES (%s, %s)", (req.usuario_email, req.produto_id))
            message = "Adicionado aos favoritos"
            is_favorite = True
            
        conn.commit()
        return {"success": True, "message": message, "is_favorite": is_favorite}

# ==========================================
# INICIALIZAÇÃO LOCAL (se rodar como script)
# ==========================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)
