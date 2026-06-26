import requests

base = 'http://127.0.0.1:8000/api'

print('GET /produtos', requests.get(base + '/produtos', timeout=10).status_code)
print('GET /usuarios', requests.get(base + '/usuarios?role=cliente', timeout=10).status_code)
resp = requests.post(base + '/cupons', json={'codigo':'WELCOME10','descricao':'Desconto teste','tipo':'percentual','valor':10,'loja_slug':None,'categoria':None,'ativo':True,'criado_por':'admin@localmarket.com.br'}, timeout=10)
print('POST /cupons', resp.status_code, resp.text)
valid = requests.post(base + '/cupons/validar', json={'codigo':'WELCOME10','itens':[{'produto_id':'ITEM-001','quantidade':1}]}, timeout=10)
print('POST /cupons/validar', valid.status_code, valid.text)
pedido = requests.post(base + '/pedidos', json={'usuario_email':'admin@localmarket.com.br','itens':[{'produto_id':'ITEM-001','quantidade':1}],'total':79.9,'cupom_codigo':'WELCOME10'}, timeout=10)
print('POST /pedidos', pedido.status_code, pedido.text)
