Para rodar este projeto no na sua própria máquina, você precisará ter o instalado. Siga estes passos:VS CodeNode.js
1. Preparar o Código
Primeiro, você precisa baixar o código do Google AI Studio:
No menu superior ou lateral do AI Studio, procure pela opção ou pelo ícone de download/exportar."Cenários"
Selecione ou ."Exportar para ZIP""Exportar para o GitHub"
2. Configurar no VS Code
Abra o VS Code.
Vá em e selecione a pasta que você extraiu.Arquivo > Abrir Pasta...
Abra o terminal integrado do VS Code clicando em (ou use o atalho ).Terminal > Novo TerminalCtrl + '
3. Instalar Dependências
No terminal, digite o seguinte comando para instalar todas as bibliotecas necessárias (como React, Tailwind e Lucide Icons):
code
Bash
npm install
4. Rodar o Projeto
Agora, inicie o servidor de desenvolvimento:
code
Bash
npm run dev
5. Acessar a Aplicação
O terminal mostrará uma mensagem indicando que o servidor está rodando. Geralmente será algo como:
Sem terminal: Local: http://localhost:3000/
Segure e clique no link ou abra o navegador e digite esse endereço.Ctrl
Dicas Extras:
Node.js: Se você ainda não tem o Node instalado, baixe a versão em .LTSnodejs.org
Extensões Recomendadas: Para uma melhor experiência no VS Code, instale as extensões e .Trechos ES7+ React/Redux/React-NativeTailwind CSS IntelliSense
Variáveis de Ambiente: Se o seu app usar a API do Gemini ou outra chave secreta, você precisará criar um arquivo chamado na raiz do projeto e adicionar as chaves seguindo o exemplo do arquivo ..env.env.exemplo
