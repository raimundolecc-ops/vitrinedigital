import psycopg
import sys

try:
    from backend.security import hash_password
except ImportError:
    from security import hash_password

# Parâmetros de conexão
DB_PARAMS = "dbname=vitrine user=postgres password=1234 host=localhost port=5432"

SQL_CREATE_TABLES = """
-- Remover tabelas existentes se houver para recriar do zero
DROP TABLE IF EXISTS favoritos CASCADE;
DROP TABLE IF EXISTS pedido_items CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS carrinhos CASCADE;
DROP TABLE IF EXISTS cupons CASCADE;
DROP TABLE IF EXISTS produtos CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS lojas CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Criar tabela usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    funcao VARCHAR(50) NOT NULL, -- 'admin', 'comerciante', 'cliente'
    slug_loja VARCHAR(100),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela lojas
CREATE TABLE lojas (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    localizacao VARCHAR(255),
    cep VARCHAR(20),
    imagem TEXT,
    status VARCHAR(50) DEFAULT 'Pendente',
    slug_loja VARCHAR(100) UNIQUE NOT NULL,
    nome_proprietario VARCHAR(255),
    email_proprietario VARCHAR(255),
    data_nascimento_proprietario DATE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT categorias_nome_tipo_unique UNIQUE (nome, tipo)
);

-- Criar tabela produtos
CREATE TABLE produtos (
    id VARCHAR(50) PRIMARY KEY,
    slug_dono VARCHAR(100) REFERENCES lojas(slug_loja) ON DELETE SET NULL,
    nome_loja VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco NUMERIC(10, 2) NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    imagem TEXT,
    destaque BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela carrinhos
CREATE TABLE carrinhos (
    id SERIAL PRIMARY KEY,
    usuario_email VARCHAR(255) REFERENCES usuarios(email) ON DELETE CASCADE,
    produto_id VARCHAR(50) REFERENCES produtos(id) ON DELETE CASCADE,
    quantidade INTEGER NOT NULL DEFAULT 1,
    adicionado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unico_produto_usuario UNIQUE (usuario_email, produto_id)
);

-- Criar tabela pedidos
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    usuario_email VARCHAR(255) REFERENCES usuarios(email) ON DELETE CASCADE,
    total NUMERIC(12,2) NOT NULL,
    desconto_total NUMERIC(12,2) DEFAULT 0,
    cupom_codigo VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'Pendente',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela cupons
CREATE TABLE cupons (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    descricao TEXT,
    tipo VARCHAR(20) NOT NULL DEFAULT 'percentual',
    valor NUMERIC(10,2) NOT NULL,
    loja_slug VARCHAR(100),
    categoria VARCHAR(100),
    ativo BOOLEAN DEFAULT TRUE,
    criado_por VARCHAR(255) REFERENCES usuarios(email) ON DELETE CASCADE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela pedido_items
CREATE TABLE pedido_items (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id VARCHAR(50) REFERENCES produtos(id) ON DELETE CASCADE,
    quantidade INTEGER NOT NULL,
    preco_unitario NUMERIC(10,2) NOT NULL
);

-- Criar tabela favoritos
CREATE TABLE favoritos (
    id SERIAL PRIMARY KEY,
    usuario_email VARCHAR(255) REFERENCES usuarios(email) ON DELETE CASCADE,
    produto_id VARCHAR(50) REFERENCES produtos(id) ON DELETE CASCADE,
    CONSTRAINT unico_favorito_usuario UNIQUE (usuario_email, produto_id)
);
"""

# Dados iniciais
SEED_USUARIOS = [
    ("admin@localmarket.com.br", "admin123", "Administrador LocalMarket", "admin", None),
    ("green@valley.com.br", "green123", "Green Valley Orgânicos", "comerciante", "green-valley"),
    ("pao@loft.com.br", "pao123", "The Sourdough Loft", "comerciante", "sourdough-loft"),
    ("bloom@stem.com.br", "bloom123", "Bloom & Stem", "comerciante", "bloom-stem"),
]

SEED_LOJAS = [
    ("ORG-001", "Green Valley Orgânicos", "Orgânicos", "Centro da cidade", "77000-000", "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80", "Ativo", "green-valley"),
    ("ORG-002", "The Sourdough Loft", "Padaria", "Bairro histórico", "77001-000", "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80", "Ativo", "sourdough-loft"),
    ("ORG-003", "Bloom & Stem", "Flores", "Jardim Leste", "77002-000", "https://images.unsplash.com/photo-1487070183336-b863922373d4?auto=format&fit=crop&w=900&q=80", "Ativo", "bloom-stem"),
]

SEED_CATEGORIAS = [
    ("Produto", "produto"),
    ("Orgânicos", "produto"),
    ("Padaria", "produto"),
    ("Flores", "produto"),
    ("Bebidas", "produto"),
    ("Mercearia", "produto"),
    ("Orgânicos", "loja"),
    ("Padaria", "loja"),
    ("Flores", "loja"),
    ("Mercado", "loja"),
    ("Restaurante", "loja"),
]

SEED_PRODUTOS = [
    (
        "ITEM-001",
        "green-valley",
        "Green Valley Orgânicos",
        "Cesta Orgânica",
        "Produto",
        "Cesta com produtos frescos selecionados.",
        79.9,
        18,
        "Ativo",
        "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
        True
    ),
    (
        "ITEM-002",
        "sourdough-loft",
        "The Sourdough Loft",
        "Pão Artesanal",
        "Produto",
        "Pão de fermentação natural produzido artesanalmente.",
        22.5,
        12,
        "Ativo",
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
        True
    ),
    (
        "ITEM-003",
        "bloom-stem",
        "Bloom & Stem",
        "Arranjo Floral",
        "Produto",
        "Arranjo decorativo com flores naturais.",
        65.0,
        6,
        "Ativo",
        "https://images.unsplash.com/photo-1487070183336-b863922373d4?auto=format&fit=crop&w=900&q=80",
        True
    ),
    (
        "ITEM-004",
        "green-valley",
        "Green Valley Orgânicos",
        "Suco Natural",
        "Produto",
        "Suco natural feito com frutas frescas.",
        14.9,
        4,
        "Baixo estoque",
        "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=900&q=80",
        False
    )
]

def main():
    print("Iniciando configuração do banco de dados...")
    try:
        with psycopg.connect(DB_PARAMS) as conn:
            with conn.cursor() as cur:
                # Criar tabelas
                print("Criando tabelas...")
                cur.execute(SQL_CREATE_TABLES)
                
                # Inserir usuários (senhas gravadas como hash bcrypt)
                print("Inserindo usuários de teste (senhas criptografadas)...")
                seed_usuarios_hash = [
                    (email, hash_password(senha), nome, funcao, slug)
                    for (email, senha, nome, funcao, slug) in SEED_USUARIOS
                ]
                cur.executemany(
                    "INSERT INTO usuarios (email, senha, nome, funcao, slug_loja) VALUES (%s, %s, %s, %s, %s)",
                    seed_usuarios_hash
                )
                
                # Inserir lojas
                print("Inserindo lojas de teste...")
                cur.executemany(
                    "INSERT INTO lojas (id, nome, categoria, localizacao, cep, imagem, status, slug_loja) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                    SEED_LOJAS
                )

                print("Inserindo categorias iniciais...")
                cur.executemany(
                    "INSERT INTO categorias (nome, tipo) VALUES (%s, %s)",
                    SEED_CATEGORIAS
                )
                
                # Inserir produtos
                print("Inserindo produtos de teste...")
                cur.executemany(
                    "INSERT INTO produtos (id, slug_dono, nome_loja, nome, categoria, descricao, preco, quantidade, status, imagem, destaque) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                    SEED_PRODUTOS
                )
                
                conn.commit()
                print("Banco de dados configurado e populado com sucesso!")
    except Exception as e:
        print(f"Erro ao configurar banco de dados: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
