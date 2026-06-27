# Checklist de Execucao - Nivel 1

Data de criacao: 2026-06-27

## Objetivo

Este checklist transforma o `Nivel 1 - Mudancas rapidas e de alto impacto` em um roteiro pratico de execucao para o projeto `Vitrine Digital / LocalMarket`.

Foco desta etapa:

- melhorar a aparencia geral do sistema
- reduzir atritos de uso
- corrigir pequenos problemas de fluxo
- aumentar a percepcao de qualidade sem reestruturar tudo de uma vez

## Como usar

Status sugeridos:

- `[ ]` nao iniciado
- `[~]` em andamento
- `[x]` concluido

## Ordem recomendada

### 1. Padronizar visual entre paginas publicas e internas

Impacto: alto  
Esforco: medio

- [ ] Revisar paleta principal de cores e definir um padrao unico.
- [ ] Padronizar botoes primarios, secundarios e estados hover.
- [ ] Padronizar cards de produto, loja e metricas.
- [ ] Padronizar campos de formulario, labels e mensagens.
- [ ] Reduzir a diferenca visual entre paginas com Tailwind e paginas com Bootstrap.
- [ ] Revisar espacos, bordas e sombras para manter a mesma linguagem visual.

Entrega esperada:

- interface mais coerente
- sensacao de produto mais profissional

### 2. Trocar `alert()` por feedback visual melhor

Impacto: alto  
Esforco: baixo

- [ ] Mapear onde `alert()` e usado no frontend.
- [ ] Criar um componente simples de toast ou mensagem flutuante.
- [ ] Substituir mensagens de sucesso por toast visual.
- [ ] Substituir erros simples por mensagem mais amigavel.
- [ ] Garantir que o feedback nao interrompa o fluxo do usuario.

Entrega esperada:

- experiencia mais fluida
- menos interrupcao durante uso

### 3. Corrigir fluxo de detalhes do pedido

Impacto: medio  
Esforco: baixo

- [ ] Revisar `pedidos.html` e a area de detalhes do pedido.
- [ ] Garantir que o bloco oculto seja exibido ao clicar em `Ver detalhes`.
- [ ] Validar comportamento com pedido existente.
- [ ] Testar visual em desktop e mobile.

Entrega esperada:

- funcao de pedidos funcionando corretamente
- melhor confianca no fluxo pos-compra

### 4. Melhorar home com secoes de destaque e ofertas

Impacto: alto  
Esforco: medio

- [ ] Adicionar secao de lojas em destaque.
- [ ] Adicionar secao de produtos ou ofertas em destaque.
- [ ] Dar mais destaque visual para chamada principal da home.
- [ ] Melhorar hierarquia entre hero, categorias e vitrines.
- [ ] Incluir CTA mais claros para `Explorar`, `Ver lojas` e `Entrar`.

Entrega esperada:

- pagina inicial mais forte comercialmente
- maior atratividade visual

### 5. Melhorar formularios de login, cadastro e produto

Impacto: alto  
Esforco: medio

- [ ] Adicionar validacao visual mais clara nos campos.
- [ ] Adicionar mensagens de erro por campo onde fizer sentido.
- [ ] Implementar mostrar ou esconder senha em login e cadastro.
- [ ] Melhorar placeholders e textos de ajuda.
- [ ] Revisar alinhamento, tamanho e legibilidade dos formularios.
- [ ] Garantir consistencia visual entre login, register e cadastro de produto.

Entrega esperada:

- formularios mais claros
- menos erro de preenchimento

### 6. Atualizar estados vazios e mensagens orientativas

Impacto: medio  
Esforco: baixo

- [ ] Revisar carrinho vazio.
- [ ] Revisar lista de pedidos vazia.
- [ ] Revisar dashboard sem itens.
- [ ] Revisar catalogo sem resultados.
- [ ] Revisar admin sem clientes ou lojas.
- [ ] Incluir CTA ou proximo passo sempre que possivel.

Entrega esperada:

- sistema mais didatico
- menos sensacao de tela quebrada ou incompleta

## Sprint sugerida

Se quiser executar isso em blocos pequenos, a recomendacao e:

### Sprint 1

- [ ] Corrigir fluxo de detalhes do pedido
- [ ] Trocar `alert()` por feedback visual melhor
- [ ] Atualizar estados vazios e mensagens orientativas

### Sprint 2

- [ ] Melhorar formularios
- [ ] Padronizar visual base

### Sprint 3

- [ ] Melhorar home com destaque e ofertas
- [ ] Ajustar acabamento final entre paginas publicas e internas

## Criterio de conclusao do Nivel 1

Podemos considerar o `Nivel 1` concluido quando:

- os principais fluxos estiverem visualmente consistentes
- o sistema nao depender mais de `alert()` como feedback principal
- a home estiver mais atrativa
- formularios estiverem mais claros
- estados vazios estiverem mais orientativos
- o fluxo de detalhes de pedido estiver funcionando

## Proximos documentos

- [PLANO_MELHORIAS_SISTEMA.md](PLANO_MELHORIAS_SISTEMA.md)
- [DOCUMENTACAO_TECNICA_PROJETO.md](DOCUMENTACAO_TECNICA_PROJETO.md)
- [GUIA_PRIMEIRA_EXECUCAO.md](GUIA_PRIMEIRA_EXECUCAO.md)
