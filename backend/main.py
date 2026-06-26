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

class LojaBase(BaseModel):
    id: str
    nome: str
    categoria: str
    localizacao: Optional[str] = None
    status: str
    slug_loja: str

class LojaCreate(BaseModel):
    nome: str

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
            cur.execute(
                "SELECT id, usuario_email, total, status, criado_em FROM pedidos WHERE usuario_email = %s ORDER BY criado_em DESC",
                (email,)
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
    with conn.cursor() as cur:
        cur.execute("SELECT id, nome, categoria, localizacao, status, slug_loja FROM lojas ORDER BY nome")
        return cur.fetchall()

@app.post("/api/lojas", response_model=LojaBase)
def create_loja(req: LojaCreate, conn = Depends(get_db_connection)):
    import time
    id_org = f"ORG-{int(time.time() * 1000)}"
    slug = req.nome.lower().strip().replace(" ", "-")
    
    with conn.cursor() as cur:
        # Verificar se o slug já existe
        cur.execute("SELECT id FROM lojas WHERE slug_loja = %s", (slug,))
        if cur.fetchone():
            slug = f"{slug}-{int(time.time() % 1000)}"
            
        cur.execute(
            """INSERT INTO lojas (id, nome, categoria, localizacao, status, slug_loja) 
               VALUES (%s, %s, 'Geral', 'Não informado', 'Pendente', %s) 
               RETURNING id, nome, categoria, localizacao, status, slug_loja""",
            (id_org, req.nome, slug)
        )
        new_loja = cur.fetchone()
        conn.commit()
        return new_loja

@app.put("/api/lojas/{loja_id}/status", response_model=LojaBase)
def toggle_loja_status(loja_id: str, conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute("SELECT status FROM lojas WHERE id = %s", (loja_id,))
        loja = cur.fetchone()
        if not loja:
            raise HTTPException(status_code=404, detail="Loja não encontrada")
            
        new_status = "Pendente" if loja["status"] == "Ativo" else "Ativo"
        cur.execute(
            "UPDATE lojas SET status = %s WHERE id = %s RETURNING id, nome, categoria, localizacao, status, slug_loja",
            (new_status, loja_id)
        )
        updated_loja = cur.fetchone()
        conn.commit()
        return updated_loja

@app.delete("/api/lojas/{loja_id}")
def delete_loja(loja_id: str, conn = Depends(get_db_connection)):
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
