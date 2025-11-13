// main.js
// NOTE: This file now communicates with a backend endpoint (api/generate.php)
// instead of calling the Gemini API directly.

const App = {
    systemDesign: null,
    activeTab: 'requirements',
    classNodeColor: '#4a044e',
    isLoading: false,
    isExportingPdf: false,

    elements: {
        description: document.getElementById('description'),
        generateBtn: document.getElementById('generate-btn'),
        resultsContainer: document.getElementById('results-container'),
        tabsAndExports: document.getElementById('tabs-and-exports'),
        tabsContainer: document.getElementById('tabs-container'),
        exportsContainer: document.getElementById('exports-container'),
        contentContainer: document.getElementById('content-container'),
    },

    init() {
        this.elements.generateBtn.addEventListener('click', this.handleGenerate.bind(this));
        // Make PDF library available globally for the autoTable plugin to attach to.
        window.jsPDF = window.jspdf.jsPDF;
    },
    
    async handleGenerate() {
        const description = this.elements.description.value;
        if (!description) {
            alert('Por favor, insira uma descrição para o sistema.');
            return;
        }

        this.elements.resultsContainer.style.display = 'block';
        this.elements.tabsAndExports.classList.add('hidden');
        this.systemDesign = null;
        this.setLoading(true, 'Gerando o design completo do sistema... Isso pode levar um momento.');

        try {
            // The frontend now makes a single call to the backend endpoint.
            // The backend will handle the 3-step generation process.
            const response = await fetch('api/generate.php', { // Ensure this file is on a PHP server
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: description })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Ocorreu um erro no servidor.' }));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (!result || !result.systemName) {
                 throw new Error('Falha ao gerar o design do sistema. A resposta do servidor estava vazia ou malformada.');
            }

            this.systemDesign = result;
            this.elements.tabsAndExports.classList.remove('hidden');
            this.setActiveTab('requirements');

        } catch (error) {
            console.error('Error:', error);
            this.renderError(`Falha ao gerar o design do sistema. ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    },
    
    setLoading(isLoading, message = '') {
        this.isLoading = isLoading;
        this.elements.generateBtn.disabled = isLoading || this.isExportingPdf;
        this.elements.description.disabled = isLoading || this.isExportingPdf;
        this.elements.generateBtn.textContent = isLoading ? 'Gerando...' : 'Gerar Projeto';

        if (isLoading) {
            this.elements.contentContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center h-96">
                    <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-400"></div>
                    <p class="mt-4 text-indigo-300">${message}</p>
                </div>`;
        }
    },
    
    setActiveTab(tab) {
        this.activeTab = tab;
        this.render();
    },

    render() {
        if (!this.systemDesign) return;
        this.renderTabsAndExports();
        this.renderContent();
    },

    renderError(errorMessage) {
        this.elements.contentContainer.innerHTML = `<div class="text-center p-8 text-red-400 bg-red-900/20 rounded-lg">${errorMessage}</div>`;
    },

    renderTabsAndExports() {
        const tabs = [
            { id: 'requirements', label: 'Requisitos' }, { id: 'useCaseDiagram', label: 'Diagrama de Caso de Uso' },
            { id: 'classDiagram', label: 'Diagrama de Classes' }, { id: 'narratives', label: 'Narrativas' },
        ];
        this.elements.tabsContainer.innerHTML = tabs.map(tab => `
            <button data-tab="${tab.id}" class="tab-btn px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${this.activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-indigo-200 hover:bg-indigo-500/50'}">
                ${tab.label}
            </button>`).join('') + (this.activeTab === 'classDiagram' ? `
            <div class="flex items-center space-x-2 pl-2">
                <label for="classColor" class="text-sm text-gray-300">Cor:</label>
                <input type="color" id="classColor" value="${this.classNodeColor}" class="w-8 h-8 p-0 border-none rounded-md cursor-pointer appearance-none bg-transparent" style="background-color: ${this.classNodeColor};">
            </div>` : '');

        this.elements.exportsContainer.innerHTML = `
            <button id="export-current-btn" class="px-4 py-2 bg-green-700 text-white font-semibold rounded-md hover:bg-green-600 transition-colors">Exportar Visão Atual</button>
            <button id="export-pdf-btn" class="px-4 py-2 bg-purple-700 text-white font-semibold rounded-md hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">Exportar Tudo (PDF)</button>`;

        this.elements.tabsContainer.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => this.setActiveTab(btn.dataset.tab)));
        if (this.activeTab === 'classDiagram') {
            const colorInput = this.elements.tabsContainer.querySelector('#classColor');
            colorInput.addEventListener('input', e => {
                this.classNodeColor = e.target.value;
                e.target.style.backgroundColor = this.classNodeColor;
                this.renderContent();
            });
        }
        document.getElementById('export-current-btn').addEventListener('click', this.handleExportCurrent.bind(this));
        document.getElementById('export-pdf-btn').addEventListener('click', this.handleExportAllPdf.bind(this));
    },

    renderContent() {
        const { requirements, narratives } = this.systemDesign;
        let html = '';
        const getClassificationBadge = (c) => `<span class="px-2 py-1 text-xs font-semibold rounded-full ${{'Essencial':'bg-red-500/80 text-red-100','Importante':'bg-yellow-500/80 text-yellow-100','Desejável':'bg-green-500/80 text-green-100'}[c]||'bg-gray-500'}">${c}</span>`;
        const renderReqTable = (title, reqs) => `
            <h2 class="text-2xl font-bold text-indigo-300 border-b border-indigo-500/30 p-4 sticky top-0 bg-gray-800">${title}</h2>
            ${(!reqs||!reqs.length)?'<p class="text-gray-400 italic p-4">Nenhum requisito foi gerado.</p>':`
            <table class="w-full text-left border-collapse"><thead><tr class="border-b border-indigo-500/30"><th class="p-3">ID</th><th class="p-3">Descrição</th><th class="p-3 text-center">Classificação</th></tr></thead><tbody>
            ${reqs.map(r=>`<tr><td class="p-3 font-mono text-indigo-400 align-top">${r.id}</td><td class="p-3 align-top">${r.description}</td><td class="p-3 text-center align-top">${getClassificationBadge(r.classification)}</td></tr>`).join('')}</tbody></table>`}`;
        switch(this.activeTab){
            case 'requirements': html=`<div class="bg-gray-800 p-1 rounded-lg w-full h-[80vh] overflow-y-auto">${renderReqTable('Requisitos Funcionais',requirements.functional)}${renderReqTable('Requisitos Não Funcionais',requirements.nonFunctional)}</div>`; break;
            case 'useCaseDiagram': html=`<div id="useCaseDiagramContainer" class="w-full h-[80vh]"></div>`; break;
            case 'classDiagram': html=`<div id="classDiagramContainer" class="w-full h-[80vh]"></div>`; break;
            case 'narratives':
                const field=(l,c)=>c?`<div class="grid grid-cols-4"><div class="font-semibold bg-gray-700 p-2 border-b border-r border-gray-600">${l}</div><div class="col-span-3 p-2 border-b border-gray-600">${c}</div></div>`:'';
                html=`<div class="space-y-8 h-[80vh] overflow-y-auto pr-2">${(!narratives||!narratives.length)?'<div class="text-center p-8 text-gray-400">Nenhuma narrativa foi gerada.</div>':narratives.map(n=>`<div class="border border-gray-600 rounded-lg overflow-hidden"><h2 class="text-xl font-bold text-green-300 p-3 bg-gray-700/50">Narrativa: ${n.useCaseName}</h2><div class="text-sm">${field('Ator Primário',n.primaryActor)}${field('Atores Secundários',(n.secondaryActors||[]).join(', '))}${field('Prioridade',n.priority)}${field('Descrição',n.briefDescription)}${field('Pré-condições',`<ul class="list-disc pl-5">${(n.preConditions||[]).map(pc=>`<li>${pc}</li>`).join('')}</ul>`)}<div class="grid grid-cols-4"><div class="font-semibold bg-gray-700 p-2 border-b border-r border-gray-600 self-start">Fluxo de Eventos</div><div class="col-span-3"><table class="w-full"><thead><tr class="border-b border-gray-600"><th class="p-2 border-r border-gray-600 w-8">Passo</th><th class="p-2 border-r border-gray-600 text-left">Ação do Ator</th><th class="p-2 text-left">Resposta do Sistema</th></tr></thead><tbody>${(n.flowOfEvents||[]).map(f=>`<tr><td class="p-2 border-b border-r border-gray-700 text-center align-top">${f.step}</td><td class="p-2 border-b border-r border-gray-700 align-top">${f.actorAction || ''}</td><td class="p-2 border-b border-gray-700 align-top">${f.systemResponse || ''}</td></tr>`).join('')}</tbody></table></div></div>${field('Pós-condições',`<ul class="list-disc pl-5">${(n.postConditions||[]).map(pc=>`<li>${pc}</li>`).join('')}</ul>`)}${field('Fluxos Alternativos',`<ul class="list-disc pl-5">${(n.alternativeFlows||[]).map(af=>`<li>${af}</li>`).join('')}</ul>`)}</div></div>`).join('')}</div>`; break;
        }
        this.elements.contentContainer.innerHTML = html;
        if(this.activeTab==='useCaseDiagram'||this.activeTab==='classDiagram') this.renderDiagrams();
    },

    renderDiagrams() {
        const data = this.processDiagramData();
        const screenColors = { classFill: this.classNodeColor };
        if (this.activeTab === 'useCaseDiagram') window.renderDiagram('#useCaseDiagramContainer', data.useCaseNodes, data.useCaseLinks, 'useCase', screenColors);
        if (this.activeTab === 'classDiagram') window.renderDiagram('#classDiagramContainer', data.classNodes, data.classLinks, 'class', screenColors);
    },
    
    processDiagramData() {
        if (!this.systemDesign) return { useCaseNodes:[], useCaseLinks:[], classNodes:[], classLinks:[] };

        // No longer need clustering, the new force layout handles organization.
        const ucNodes = [
            ...(this.systemDesign.actors || []).map(a => ({ id: a.id, group: 'actor', data: a })),
            ...(this.systemDesign.useCases || []).map(uc => ({ id: uc.id, group: 'useCase', data: uc }))
        ];
        const ucRels = (this.systemDesign.relationships || []).filter(r => r.type === 'usage' || r.type === 'generalization');
        const ucLinks = ucRels
            .filter(r => ucNodes.find(n => n.id === r.source) && ucNodes.find(n => n.id === r.target))
            .map(r => ({ source: r.source, target: r.target, type: r.type }));

        const cNodes = (this.systemDesign.classes || []).map(c => ({ id: c.id, group: 'class', data: c }));
        const cRels = (this.systemDesign.relationships || []).filter(r => r.type !== 'usage');
        const cLinks = cRels
            .filter(r => cNodes.find(n => n.id === r.source) && cNodes.find(n => n.id === r.target))
            .map(r => ({ source: r.source, target: r.target, type: r.type }));
        
        return { useCaseNodes: ucNodes, useCaseLinks: ucLinks, classNodes: cNodes, classLinks: cLinks };
    },

    handleExportCurrent() {
        switch (this.activeTab) {
            case 'requirements': this.exportMarkdown('Requisitos', this.formatRequirementsMarkdown()); break;
            case 'narratives': this.exportMarkdown('Narrativas', this.formatNarrativesMarkdown()); break;
            case 'useCaseDiagram': this.exportDiagram('useCaseDiagramContainer'); break;
            case 'classDiagram': this.exportDiagram('classDiagramContainer'); break;
        }
    },
    
    exportData(filename, content, contentType) {
        const blob = new Blob([content], { type: contentType });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    },

    exportMarkdown(type, content) {
        const filename = `${this.systemDesign.systemName.replace(/\s+/g, '_')}_${type}.md`;
        this.exportData(filename, content, 'text/markdown');
    },

    formatRequirementsMarkdown() {
        let md = `# ${this.systemDesign.systemName} - Requisitos\n\n## Requisitos Funcionais\n\n| ID | Descrição | Classificação |\n|:---|:---|:---|\n`;
        (this.systemDesign.requirements.functional||[]).forEach(r => { md += `| ${r.id} | ${r.description} | ${r.classification} |\n`; });
        md += `\n## Requisitos Não Funcionais\n\n| ID | Descrição | Classificação |\n|:---|:---|:---|\n`;
        (this.systemDesign.requirements.nonFunctional||[]).forEach(r => { md += `| ${r.id} | ${r.description} | ${r.classification} |\n`; });
        return md;
    },

    formatNarrativesMarkdown() {
        let md = `# ${this.systemDesign.systemName} - Narrativas de Caso de Uso\n\n`;
        (this.systemDesign.narratives||[]).forEach(n => {
            md += `## Caso de Uso: ${n.useCaseName}\n\n**Ator Primário:** ${n.primaryActor}\n\n### Fluxo de Eventos\n\n| Passo | Ação do Ator | Resposta do Sistema |\n|:---|:---|:---|\n`;
            (n.flowOfEvents||[]).forEach(f => {
                md += `| ${f.step} | ${f.actorAction || ''} | ${f.systemResponse || ''} |\n`;
            });
            md += `\n---\n\n`;
        });
        return md;
    },
    
    exportDiagram(containerId) {
        const svgElement = document.getElementById(containerId)?.querySelector('svg');
        if (!svgElement) return;
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svgElement);
        const filename = `${this.systemDesign.systemName.replace(/\s+/g, '_')}_${this.activeTab}.svg`;
        this.exportData(filename, svgString, 'image/svg+xml');
    },

    async handleExportAllPdf() {
        if (!this.systemDesign || this.isExportingPdf) return;
        this.isExportingPdf = true;
        const exportBtn = document.getElementById('export-pdf-btn');
        exportBtn.textContent = 'Exportando...';
        exportBtn.disabled = true;

        const doc = new jsPDF('p', 'pt', 'a4');
        const { systemName, requirements, narratives } = this.systemDesign;
        const margin = 40;
        let currentY = margin;
        
        // Title Page
        doc.setFontSize(26).text("Documento de Design de Sistema", doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() / 2 - 20, { align: 'center' });
        doc.setFontSize(18).text(systemName, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() / 2 + 20, { align: 'center' });
        
        // Requirements
        doc.addPage();
        currentY = margin;
        doc.setFontSize(18).text("Requisitos do Sistema", margin, currentY);
        currentY += 30;

        if((requirements.functional||[]).length) {
            doc.setFontSize(14).text("Requisitos Funcionais", margin, currentY);
            currentY += 15;
            doc.autoTable({ 
                startY: currentY, 
                head:[['ID','Descrição','Classificação']], 
                body: requirements.functional.map(r=>[r.id,r.description,r.classification]) 
            });
            currentY = doc.lastAutoTable.finalY + 30;
        }

        if((requirements.nonFunctional||[]).length) {
            if (currentY > doc.internal.pageSize.getHeight() - 100) {
                doc.addPage();
                currentY = margin;
            }
            doc.setFontSize(14).text("Requisitos Não Funcionais", margin, currentY);
            currentY += 15;
            doc.autoTable({ 
                startY: currentY, 
                head:[['ID','Descrição','Classificação']], 
                body: requirements.nonFunctional.map(r=>[r.id,r.description,r.classification]) 
            });
        }

        // Diagrams - Temporarily render them off-screen to generate images for PDF
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '1000px';
        tempContainer.style.height = '800px';
        tempContainer.innerHTML = '<div id="tempUseCase" style="width:100%;height:100%;"></div><div id="tempClass" style="width:100%;height:100%;"></div>';
        document.body.appendChild(tempContainer);
        
        const diagramData = this.processDiagramData();
        const printColors = {
            classFill: '#ffffff', classStroke: '#333333', classText: '#000000',
            useCaseFill: '#ffffff', useCaseStroke: '#333333', useCaseText: '#000000',
            actorStroke: '#000000', actorText: '#000000',
            linkColor: '#666666', arrowStroke: '#000000'
        };
        window.renderDiagram('#tempUseCase', diagramData.useCaseNodes, diagramData.useCaseLinks, 'useCase', printColors);
        window.renderDiagram('#tempClass', diagramData.classNodes, diagramData.classLinks, 'class', printColors);
        
        // Allow D3 simulation to settle a bit
        await new Promise(resolve => setTimeout(resolve, 2000));

        const addDiagram = async (containerId, title) => {
            const el = document.getElementById(containerId);
            if (!el) return;

            const canvas = await html2canvas(el, { backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            doc.addPage();
            doc.setFontSize(18).text(title, margin, margin);

            const imgProps = doc.getImageProperties(imgData);
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            
            const availableWidth = pageWidth - margin * 2;
            const availableHeight = pageHeight - margin * 2 - 20;
            
            const imgAspectRatio = imgProps.width / imgProps.height;
            const availableAspectRatio = availableWidth / availableHeight;

            let finalWidth, finalHeight;

            if (imgAspectRatio > availableAspectRatio) {
                finalWidth = availableWidth;
                finalHeight = finalWidth / imgAspectRatio;
            } else {
                finalHeight = availableHeight;
                finalWidth = finalHeight * imgAspectRatio;
            }

            const x = margin + (availableWidth - finalWidth) / 2;
            const y = margin + 20 + (availableHeight - finalHeight) / 2;

            doc.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
        };
        await addDiagram('tempUseCase', 'Diagrama de Caso de Uso');
        await addDiagram('tempClass', 'Diagrama de Classes');
        document.body.removeChild(tempContainer);

        // Narratives
        for (const n of narratives) {
            doc.addPage();
            currentY = margin;
            doc.setFontSize(18).text(`Narrativa: ${n.useCaseName}`, margin, currentY);
            currentY += 20;
            
            const narrativeDetails = [
                ['Ator Primário', n.primaryActor],
                ['Atores Secundários', (n.secondaryActors || []).join(', ')],
                ['Prioridade', n.priority],
                ['Descrição', n.briefDescription],
                ['Pré-condições', (n.preConditions || []).join('\n')],
                ['Pós-condições', (n.postConditions || []).join('\n')],
                ['Fluxos Alternativos', (n.alternativeFlows || []).join('\n')]
            ].filter(row => row[1] && row[1].length > 0);

            doc.autoTable({ 
                startY: currentY, 
                theme: 'striped', 
                headStyles:{fillColor: [74,4,78]}, 
                body: narrativeDetails,
                columnStyles: { 0: { fontStyle: 'bold' } }
            });

            currentY = doc.lastAutoTable.finalY + 30;

            if((n.flowOfEvents||[]).length > 0){
                 if (currentY > doc.internal.pageSize.getHeight() - 100) {
                    doc.addPage();
                    currentY = margin;
                }
                doc.setFontSize(14).text("Fluxo de Eventos", margin, currentY);
                currentY += 15;
                doc.autoTable({ 
                    startY: currentY, 
                    head:[['#','Ação do Ator','Resposta do Sistema']], 
                    body: n.flowOfEvents.map(f=>[f.step, f.actorAction || '', f.systemResponse || ''])
                });
            }
        }

        doc.save(`${systemName.replace(/\s+/g, '_')}_Design_Completo.pdf`);
        this.isExportingPdf = false;
        exportBtn.textContent = 'Exportar Tudo (PDF)';
        exportBtn.disabled = false;
    },
};

document.addEventListener('DOMContentLoaded', () => App.init());