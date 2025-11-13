
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DUBAI - Design UML By Artificial Intelligence</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <style>
        body { background-color: #1f2937; color: #e5e7eb; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #2a3645; }
        ::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #6366f1; }
        input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
        input[type="color"]::-webkit-color-swatch { border: none; border-radius: 0.375rem; }
    </style>


</head>
<body class="font-sans">
    <div class="container mx-auto p-4 md:p-8 max-w-7xl">
        <header class="text-center mb-8">
            <h1 class="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Design UML By Artificial Intelligence</h1>
            <p class="mt-2 text-lg text-gray-400">Descreva seu sistema em linguagem natural e obtenha requisitos, narrativas e diagramas UML.</p>
        </header>

        <main>
            <div class="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
                <label for="description" class="block text-lg font-medium text-indigo-300 mb-2">Descrição do Sistema</label>
                <textarea id="description" rows="5" class="w-full p-3 bg-gray-900/70 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-gray-200 placeholder-gray-500" placeholder="Ex: Um sistema de e-commerce para venda de livros, com cadastro de usuários, busca de produtos, carrinho de compras e checkout..."></textarea>
                <button id="generate-btn" class="mt-4 w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-transform transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none">
                    Gerar Projeto
                </button>
            </div>

            <div id="results-container" class="mt-10" style="display: none;">
                <div id="tabs-and-exports" class="hidden flex flex-col md:flex-row justify-between items-center mb-4 p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                    <div id="tabs-container" class="flex flex-wrap items-center gap-2 mb-4 md:mb-0"></div>
                    <div id="exports-container" class="flex items-center gap-2"></div>
                </div>
                <div id="content-container" class="bg-gray-900/70 border border-gray-700 rounded-lg min-h-[80vh] p-1 md:p-2">
                </div>
            </div>
        </main>

        <footer class="text-center mt-12 text-gray-500">
            <p>Lembre-se: a revisão humana é essencial para garantir a precisão e adequação ao seu projeto.</p>
        </footer>
    </div>

    <script src="diagram.js"></script>
    <script type="module" src="main.js"></script>

</body>
</html>
