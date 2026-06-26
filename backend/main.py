from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import psycopg
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
