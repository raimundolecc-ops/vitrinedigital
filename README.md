# 🏪 LocalMarket / Vitrine Digital

**Conectando comerciantes locais aos consumidores da comunidade.**

O **LocalMarket / Vitrine Digital** é um projeto frontend desenvolvido com **HTML, CSS, JavaScript e Bootstrap**.  
A proposta é criar uma plataforma simples, funcional e visualmente organizada para divulgar lojas, produtos e serviços locais.

O sistema possui uma página inicial com vitrine de lojas, catálogo de produtos, login com perfis diferentes, painel do comerciante, área de cadastro e painel administrativo.

---

## 📌 Informações Gerais do Projeto

| Item | Descrição |
|---|---|
| **Nome do produto** | LocalMarket / Vitrine Digital |
| **Tipo de projeto** | Frontend web |
| **Problema que resolve** | Muitos pequenos comerciantes não possuem uma vitrine digital organizada para divulgar seus produtos, serviços e informações. O projeto oferece uma interface simples para conectar esses comerciantes aos consumidores. |
| **Público-alvo** | Pequenos comerciantes, lojistas, artesãos, prestadores de serviço e consumidores interessados em encontrar lojas e produtos locais. |
| **Objetivo principal** | Criar uma primeira versão funcional de uma plataforma de vitrine digital com navegação, cards, formulários, tabelas, login e integração planejada com API. |
| **Tecnologias obrigatórias** | HTML, CSS, JavaScript e Bootstrap |
| **API escolhida** | Fake Store API |
| **Armazenamento local** | LocalStorage do navegador |

---

## 🎯 Objetivo do Projeto

O objetivo do projeto é desenvolver uma plataforma que permita:

- Divulgar lojas locais.
- Exibir produtos e serviços em formato de cards.
- Permitir que comerciantes acessem uma área interna.
- Permitir cadastro, edição e exclusão de registros.
- Permitir que administradores visualizem e gerenciem unidades ou lojas.
- Simular o consumo de dados externos por meio de uma API.

A plataforma foi pensada como uma primeira versão de um sistema de vitrine digital para comércio local.

---

## 🧩 Problema que o Projeto Resolve

Pequenos comerciantes muitas vezes dependem apenas de redes sociais ou divulgação presencial para mostrar seus produtos. Isso pode dificultar que consumidores encontrem lojas, comparem produtos ou conheçam negócios da própria região.

O **LocalMarket / Vitrine Digital** resolve esse problema criando uma interface onde:

- O consumidor consegue visualizar lojas e produtos.
- O comerciante consegue cadastrar seus próprios itens.
- O administrador consegue acompanhar informações gerais.
- Os dados podem ser exibidos em cards, tabelas e dashboards.

---

## 👥 Público-Alvo

O projeto atende principalmente:

### Comerciantes

Pequenos lojistas, produtores locais, artesãos, floriculturas, padarias, cafeterias, lojas de roupas, mercados de bairro e prestadores de serviço.

### Consumidores

Pessoas que desejam encontrar produtos, serviços ou lojas locais de forma simples e organizada.

### Administradores

Responsáveis por controlar cadastros, unidades, lojas ou parceiros dentro da plataforma.

---

## ✅ Funcionalidades Definidas

O projeto possui mais de três funcionalidades, atendendo ao requisito solicitado.

---

### 1. Página Inicial com Vitrine de Lojas

A página inicial apresenta uma vitrine com lojas em destaque.

Ela contém:

- Cabeçalho fixo.
- Logo do projeto.
- Campo de busca.
- Menu de navegação.
- Banner principal.
- Categorias.
- Cards de lojas.
- Botões para visitar lojas.
- Link para login do comerciante.

Essa página funciona como a entrada principal do sistema.

---

### 2. Login com Tipos de Usuário

O sistema possui uma tela de login com separação de perfis.

Tipos de acesso:

- **Administrador**
- **Comerciante**

Cada perfil possui uma regra de acesso diferente.

O administrador é direcionado para a página administrativa.  
O comerciante é direcionado para o dashboard de gestão.

Contas de teste:

```txt
Administrador:
E-mail: admin@localmarket.com.br
Senha: admin123

Acesso de Comerciante
E-mail: green@valley.com.br
Senha: green123

E-mail: pao@loft.com.br
Senha: pao123

E-mail: bloom@stem.com.br
Senha: bloom123