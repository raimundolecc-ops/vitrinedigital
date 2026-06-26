import requests

base = 'http://127.0.0.1:8000/api'

register = requests.post(base + '/auth/register', json={'email':'cliente.teste@localmarket.com','password':'teste123','name':'Cliente Teste'}, timeout=10)
print('POST /auth/register', register.status_code, register.text)
order = requests.post(base + '/pedidos', json={'usuario_email':'cliente.teste@localmarket.com','itens':[{'produto_id':'ITEM-001','quantidade':1}],'total':79.9,'cupom_codigo':'WELCOME10'}, timeout=10)
print('POST /pedidos', order.status_code, order.text)
print('GET /pedidos?email=cliente.teste@localmarket.com', requests.get(base + '/pedidos?email=cliente.teste@localmarket.com', timeout=10).status_code)
