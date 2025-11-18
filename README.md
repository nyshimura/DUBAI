
# DUBAI - Design UML By Artificial Intelligence

**DUBAI** é uma aplicação web inovadora que utiliza o poder da API do Google Gemini para transformar descrições de sistemas em linguagem natural em artefatos completos de design de software. Descreva sua ideia e obtenha Requisitos Funcionais, Não Funcionais, Narrativas de Caso de Uso e diagramas UML interativos em segundos.

---

## Funcionalidades Principais

-   **Geração por IA**: Converte uma simples descrição de texto em um design de sistema estruturado.
-   **Requisitos Detalhados**: Gera automaticamente listas de Requisitos Funcionais e Não Funcionais com classificação de prioridade.
-   **Diagramas UML Interativos**: Cria diagramas de Caso de Uso e de Classes utilizando D3.js, com suporte a pan e zoom.
-   **Narrativas Completas**: Produz narrativas detalhadas para cada Caso de Uso, seguindo padrões de documentação de software.
-   **Exportação Múltipla**: Exporte a visão atual (SVG para diagramas, Markdown para textos) ou o documento de design completo em um único arquivo PDF profissional.
-   **Interface Moderna**: UI limpa e responsiva construída com TailwindCSS.

---

## Tecnologias Utilizadas

-   **Frontend**: HTML5, TailwindCSS, JavaScript (ES6)
-   **Inteligência Artificial**: Google Gemini API
-   **Visualização de Dados**: D3.js
-   **Backend**: PHP
-   **Exportação de PDF**: jsPDF, jsPDF-AutoTable, html2canvas

---

## Instalação e Configuração

Para rodar este projeto localmente, você precisará de um ambiente de servidor PHP (como XAMPP, MAMP, WAMP ou o servidor embutido do PHP).

**Passo 1: Clonar o Repositório**

```bash
git clone https://github.com/nyshimura/DUBAI.git
cd seu-repositorio
```

**Passo 2: Configurar o Backend**

O arquivo de backend é fornecido como `generate.php` para facilitar a visualização.

-   `api/generate.php`.

**Passo 3: Configurar a Chave da API do Gemini**

A chave da API é lida a partir de variáveis de ambiente do servidor para maior segurança.

1.  **Obtenha sua chave da API** no [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  **Alternativa (Insegura para Produção):** Apenas para testes locais rápidos, você pode descomentar e editar a linha 24 no arquivo `api/generate.php` e colar sua chave diretamente:

     ```php
        $apiKey = "SUA-CHAVE"; // <-- COLE SUA CHAVE AQUI DENTRO DAS ASPAS
      ```
      ```curl
          function call_gemini_api($prompt, $apiKey) {
              $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . $apiKey; // <-- COLE SEU CURL DA SUA IA, NAO TESTEI COM OUTRAS APENAS COM GEMINI
          **Passo 4: Iniciar o Servidor**
      ```

1.  Mova a pasta do projeto para o diretório raiz do seu servidor web (ex: `htdocs` no XAMPP).
2.  Inicie o seu servidor Apache e PHP.
3.  Acesse o projeto no seu navegador, geralmente em `http://localhost/`.

---

## Como Usar

1.  **Descreva seu Sistema**: No campo de texto principal, escreva a descrição do sistema que você deseja projetar.
2.  **Gere o Projeto**: Clique no botão "Gerar Projeto".
3.  **Navegue pelos Resultados**: Use as abas para visualizar os Requisitos, Diagramas e Narrativas.
4.  **Exporte os Artefatos**: Use os botões de exportação para salvar os diagramas, textos ou o documento completo em PDF.

---

## Agradecimentos

Gostaria de estender um agradecimento especial a **Matheus Haddad**, cuja ideia e insight inicial durante uma conversa pelo whatsapp foi a centelha que deu origem a este projeto. A capacidade de transformar conceitos abstratos em ferramentas práticas é uma jornada, e o ponto de partida é muitas vezes a parte mais valiosa.

## Colaboradores


-   **Matheus Haddad** - [*@Prof-math423*](https://github.com/Prof-math423) - Idealizador do projeto.
-   **Nyshimura** - [*@nyshimura*](https://github.com/nyshimura)

## Ideias


-   Automatização e simplificação da criação da documentação de sistemas;

---

## Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
