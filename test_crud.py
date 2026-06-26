#!/usr/bin/env python
"""
Script de teste para validar os endpoints de CRUD de produtos
Executa testes básicos de criação e atualização
"""

import requests
import json
import time
from datetime import datetime

API_BASE = "http://localhost:8000/api"

def log_test(title, status, details=""):
    """Log formatado dos testes"""
    symbol = "✅" if status else "❌"
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"\n[{timestamp}] {symbol} {title}")
    if details:
        print(f"    └─ {details}")

def test_create_product():
    """Testa criação de novo produto"""
    print("\n" + "="*60)
    print("TESTE 1: Criar novo produto")
    print("="*60)
    
    product_id = f"TEST-{int(time.time())}"
    payload = {
        "id": product_id,
        "slug_dono": "admin",
        "nome_loja": "Loja Teste",
        "nome": "Produto Teste",
        "categoria": "Eletrônicos",
        "descricao": "Um produto de teste para validar criação",
        "preco": 99.99,
        "quantidade": 5,
        "status": "Ativo",
        "imagem": "https://via.placeholder.com/300",
        "destaque": False
    }
    
    print(f"\n📤 Enviando POST para /produtos")
    print(f"   Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(f"{API_BASE}/produtos", json=payload)
        
        if response.status_code == 200:
            result = response.json()
            log_test("Produto criado com sucesso", True, f"ID: {result['id']}")
            return product_id, True
        else:
            error_msg = response.text
            log_test("Erro ao criar produto", False, f"Status: {response.status_code} - {error_msg[:100]}")
            return product_id, False
            
    except Exception as e:
        log_test("Erro de conexão ao criar", False, str(e))
        return product_id, False

def test_update_product(product_id):
    """Testa atualização de produto existente"""
    print("\n" + "="*60)
    print("TESTE 2: Atualizar produto existente")
    print("="*60)
    
    payload = {
        "nome": "Produto Atualizado",
        "categoria": "Eletrônicos Premium",
        "descricao": "Descrição atualizada com sucesso",
        "preco": 149.99,
        "quantidade": 10,
        "status": "Ativo",
        "imagem": "https://via.placeholder.com/400",
        "destaque": True
    }
    
    print(f"\n📤 Enviando PUT para /produtos/{product_id}")
    print(f"   Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.put(f"{API_BASE}/produtos/{product_id}", json=payload)
        
        if response.status_code == 200:
            result = response.json()
            log_test("Produto atualizado com sucesso", True, 
                    f"Novo preço: R$ {result['preco']}, Novo nome: {result['nome']}")
            return True
        else:
            error_msg = response.text
            log_test("Erro ao atualizar produto", False, f"Status: {response.status_code} - {error_msg[:100]}")
            return False
            
    except Exception as e:
        log_test("Erro de conexão ao atualizar", False, str(e))
        return False

def test_get_product(product_id):
    """Testa leitura de produto"""
    print("\n" + "="*60)
    print("TESTE 3: Obter produto pelo ID")
    print("="*60)
    
    print(f"\n📥 Enviando GET para /produtos/{product_id}")
    
    try:
        response = requests.get(f"{API_BASE}/produtos/{product_id}")
        
        if response.status_code == 200:
            result = response.json()
            log_test("Produto obtido com sucesso", True, 
                    f"Nome: {result['nome']}, Preço: R$ {result['preco']}")
            return True
        else:
            log_test("Erro ao obter produto", False, f"Status: {response.status_code}")
            return False
            
    except Exception as e:
        log_test("Erro de conexão ao obter", False, str(e))
        return False

def test_get_all_products():
    """Testa leitura de todos os produtos"""
    print("\n" + "="*60)
    print("TESTE 4: Obter lista de todos os produtos")
    print("="*60)
    
    print(f"\n📥 Enviando GET para /produtos")
    
    try:
        response = requests.get(f"{API_BASE}/produtos")
        
        if response.status_code == 200:
            result = response.json()
            log_test("Lista de produtos obtida com sucesso", True, 
                    f"Total de produtos: {len(result)}")
            return True
        else:
            log_test("Erro ao obter lista", False, f"Status: {response.status_code}")
            return False
            
    except Exception as e:
        log_test("Erro de conexão", False, str(e))
        return False

def test_delete_product(product_id):
    """Testa exclusão de produto"""
    print("\n" + "="*60)
    print("TESTE 5: Excluir produto")
    print("="*60)
    
    print(f"\n🗑️  Enviando DELETE para /produtos/{product_id}")
    
    try:
        response = requests.delete(f"{API_BASE}/produtos/{product_id}")
        
        if response.status_code == 200:
            log_test("Produto excluído com sucesso", True)
            return True
        else:
            error_msg = response.text
            log_test("Erro ao excluir produto", False, f"Status: {response.status_code}")
            return False
            
    except Exception as e:
        log_test("Erro de conexão ao excluir", False, str(e))
        return False

def main():
    print("\n" + "="*60)
    print("🧪 TESTES DE VALIDAÇÃO - CRUD DE PRODUTOS")
    print("="*60)
    print(f"\n🔗 API Base: {API_BASE}")
    print(f"⏰ Iniciado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    
    # Verificar conexão básica
    try:
        response = requests.get(f"{API_BASE}/produtos", timeout=5)
        log_test("Conexão com API", True, "API está respondendo")
    except Exception as e:
        log_test("Conexão com API", False, f"Falha ao conectar: {str(e)}")
        print("\n⚠️  Certifique-se de que o servidor está rodando em http://localhost:8000")
        return
    
    results = {
        "criacao": False,
        "leitura": False,
        "atualizacao": False,
        "listagem": False,
        "exclusao": False
    }
    
    # Executar testes
    product_id, results["criacao"] = test_create_product()
    
    if results["criacao"]:
        results["leitura"] = test_get_product(product_id)
        results["atualizacao"] = test_update_product(product_id)
        results["listagem"] = test_get_all_products()
        results["exclusao"] = test_delete_product(product_id)
    else:
        print("\n⚠️  Testes subsequentes cancelados devido à falha de criação")
    
    # Resumo
    print("\n" + "="*60)
    print("📊 RESUMO DOS TESTES")
    print("="*60)
    
    for test_name, passed in results.items():
        symbol = "✅" if passed else "❌"
        print(f"{symbol} {test_name.upper()}: {'PASSOU' if passed else 'FALHOU'}")
    
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    
    print("\n" + "-"*60)
    print(f"Taxa de sucesso: {passed}/{total} ({(passed/total*100):.0f}%)")
    
    if passed == total:
        print("\n✨ Todos os testes passaram! O CRUD está funcionando corretamente.")
    else:
        print("\n⚠️  Alguns testes falharam. Verifique os logs acima.")
    
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
