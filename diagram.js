// diagram.js
window.renderDiagram = (containerSelector, nodes, links, diagramType, colorOptions = {}) => {
  const containerEl = document.querySelector(containerSelector);
  if (!containerEl || !nodes || nodes.length === 0) return;

  const defaults = {
    classFill: '#4a044e', classStroke: '#f0abfc', classText: '#f5d0fe',
    useCaseFill: '#2563eb', useCaseStroke: '#93c5fd', useCaseText: '#e0e7ff',
    actorStroke: '#d1d5db', actorText: '#e0e7ff',
    linkColor: '#999', arrowStroke: '#999'
  };
  const colors = { ...defaults, ...colorOptions };

  containerEl.innerHTML = ''; // Clear previous render
  const svg = d3.select(containerSelector).append('svg').attr('width', '100%').attr('height', '100%');
  const { width, height } = containerEl.getBoundingClientRect();
  
  // Set a default viewBox, which will be overridden by the static layout if needed
  svg.attr('viewBox', `0 0 ${width} ${height}`);

  const defs = svg.append('defs');
  defs.append('marker')
    .attr('id', 'arrow-generalization')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 10)
    .attr('refY', 0)
    .attr('markerWidth', 10).attr('markerHeight', 10)
    .attr('orient', 'auto-start-reverse')
    .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', 'none').attr('stroke', colors.arrowStroke);

  const graphContainer = svg.append("g");
  
  const link = graphContainer.append("g").attr("stroke", colors.linkColor).attr("stroke-opacity", 0.8)
      .selectAll("line").data(links).join("line").attr("stroke-width", 1.5);
  
  const node = graphContainer.append("g").selectAll("g").data(nodes).join("g");
  
  if (diagramType === 'class') {
    // --- DYNAMIC LAYOUT FOR CLASS DIAGRAMS (UNCHANGED) ---
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(250))
      .force("charge", d3.forceManyBody().strength(-1000))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(150));
    
    link.attr('marker-end', d => d.type === 'generalization' ? 'url(#arrow-generalization)' : null);
    
    node.call(d3.drag()
        .on("start", (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on("end", (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));
    
    simulation.on("tick", () => {
        link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        node.attr("transform", d => `translate(${d.x}, ${d.y})`);
    });

  } else if (diagramType === 'useCase') {
    // --- STATIC, DETERMINISTIC LAYOUT FOR USE CASE DIAGRAMS ---
    const MARGIN = { top: 60, left: 150, right: 150 };
    const COL_GAP = 250;
    const V_SPACING = 100; // Vertical space between use cases
    const GROUP_SPACING = 50; // Vertical space between actor groups

    const leftActorNames = ["Comercial", "Controle Operacional", "Portaria"];
    const actors = nodes.filter(n => n.group === 'actor');
    const actorGroups = actors.map(actor => ({
        actor,
        useCases: links.filter(l => l.source === actor.id || l.target === actor.id)
                       .map(l => (l.source === actor.id) ? l.target : l.source)
                       .map(id => nodes.find(n => n.id === id))
                       .filter(n => n && n.group === 'useCase'),
        side: leftActorNames.includes(actor.data.name) ? 'left' : 'right'
    }));
    
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    // Position generalization parent first
    const genLink = links.find(l => l.type === 'generalization');
    if (genLink) {
        const parentActor = nodeMap.get(genLink.target);
        const childActor = nodeMap.get(genLink.source);
        if (parentActor && childActor) {
           parentActor.x = width - MARGIN.right;
           parentActor.y = MARGIN.top;
           childActor.x = parentActor.x;
           childActor.y = parentActor.y + V_SPACING + 20;
        }
    }

    let y_left = MARGIN.top;
    actorGroups.filter(g => g.side === 'left').forEach(group => {
        const groupHeight = Math.max(1, group.useCases.length) * V_SPACING;
        group.actor.x = MARGIN.left;
        group.actor.y = y_left + (groupHeight / 2) - (V_SPACING / 2);
        group.useCases.forEach((uc, i) => {
            uc.x = MARGIN.left + COL_GAP;
            uc.y = y_left + (i * V_SPACING);
        });
        y_left += groupHeight - V_SPACING + GROUP_SPACING + V_SPACING;
    });

    let y_right = MARGIN.top;
     actorGroups.filter(g => g.side === 'right').forEach(group => {
        if (group.actor.x !== undefined) {
            y_right = group.actor.y; 
        } else {
             group.actor.x = width - MARGIN.right;
             group.actor.y = y_right;
        }

        const startYForUseCases = group.actor.y - (Math.floor(group.useCases.length / 2) * V_SPACING) + (group.useCases.length % 2 === 0 ? V_SPACING/2 : 0);
        
        group.useCases.forEach((uc, i) => {
            uc.x = width - MARGIN.right - COL_GAP;
            uc.y = startYForUseCases + (i * V_SPACING);
        });

        const groupHeight = Math.max(1, group.useCases.length) * V_SPACING;
        y_right = group.actor.y + (groupHeight / 2) + GROUP_SPACING;
    });

    // --- Adjust viewBox to fit all content ---
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const PADDING = 120; 
    nodes.forEach(n => {
        if (n.x !== undefined && n.y !== undefined) {
            minX = Math.min(minX, n.x);
            maxX = Math.max(maxX, n.x);
            minY = Math.min(minY, n.y);
            maxY = Math.max(maxY, n.y);
        }
    });

    if (isFinite(minX)) {
        const finalX = minX - PADDING;
        const finalY = minY - PADDING;
        const finalWidth = (maxX - minX) + (PADDING * 2);
        const finalHeight = (maxY - minY) + (PADDING * 2);
        svg.attr('viewBox', `${finalX} ${finalY} ${finalWidth} ${finalHeight}`);
    }


    // Final Rendering based on calculated positions
    link.attr('marker-end', d => d.type === 'generalization' ? 'url(#arrow-generalization)' : null);
    
    link.attr("x1", d => nodeMap.get(d.source)?.x)
        .attr("y1", d => nodeMap.get(d.source)?.y)
        .attr("x2", d => nodeMap.get(d.target)?.x)
        .attr("y2", d => nodeMap.get(d.target)?.y);
        
    node.attr("transform", d => `translate(${d.x || 0}, ${d.y || 0})`);
  }

  // --- COMMON NODE RENDERING LOGIC ---
  const actorStrokeWidth = 2.5;
  node.filter(d => d.group === 'actor').append('circle').attr('r', 15).attr('cy', -25).attr('fill', 'none').attr('stroke', colors.actorStroke).attr('stroke-width', actorStrokeWidth);
  node.filter(d => d.group === 'actor').append('line').attr('y1', -10).attr('y2', 20).attr('stroke', colors.actorStroke).attr('stroke-width', actorStrokeWidth);
  node.filter(d => d.group === 'actor').append('line').attr('x1', -20).attr('x2', 20).attr('y1', 5).attr('y2', 5).attr('stroke', colors.actorStroke).attr('stroke-width', actorStrokeWidth);
  node.filter(d => d.group === 'actor').append('line').attr('y1', 20).attr('x2', -15).attr('y2', 40).attr('stroke', colors.actorStroke).attr('stroke-width', actorStrokeWidth);
  node.filter(d => d.group === 'actor').append('line').attr('y1', 20).attr('x2', 15).attr('y2', 40).attr('stroke', colors.actorStroke).attr('stroke-width', actorStrokeWidth);
  node.filter(d => d.group === 'actor').append('text').text(d => d.data.name).attr('y', 60).attr('text-anchor', 'middle').attr('fill', colors.actorText).attr('font-size', '14px');
  
  node.filter(d => d.group === 'useCase').append('ellipse').attr('rx', 100).attr('ry', 40).attr('fill', colors.useCaseFill).attr('stroke', colors.useCaseStroke).attr('stroke-width', 2);
  node.filter(d => d.group === 'useCase').append('text').text(d => d.data.name).attr('text-anchor', 'middle').attr('dy', '.3em').attr('fill', colors.useCaseText).attr('font-size', '14px').call(wrapText, 180);

  const classNodes = node.filter(d => d.group === 'class');
  classNodes.each(function(d) {
      const classData = d.data;
      const group = d3.select(this);
      const maxWidth = 200, padding = 10, lineHeight = 18, nameHeight = 30;
      const attrHeight = (classData.attributes || []).length * lineHeight + ((classData.attributes || []).length > 0 ? padding : 0);
      const methodHeight = (classData.methods || []).length * lineHeight + ((classData.methods || []).length > 0 ? padding : 0);
      const totalHeight = nameHeight + attrHeight + methodHeight;

      group.append('rect').attr('width', maxWidth).attr('height', totalHeight).attr('x', -maxWidth/2).attr('y', -totalHeight/2).attr('fill', colors.classFill).attr('stroke', colors.classStroke).attr('stroke-width', 2);
      group.append('line').attr('x1', -maxWidth/2).attr('x2', maxWidth/2).attr('y1', -totalHeight/2 + nameHeight).attr('y2', -totalHeight/2 + nameHeight).attr('stroke', colors.classStroke);
      if (attrHeight > 0) {
          group.append('line').attr('x1', -maxWidth/2).attr('x2', maxWidth/2).attr('y1', -totalHeight/2 + nameHeight + attrHeight).attr('y2', -totalHeight/2 + nameHeight + attrHeight).attr('stroke', colors.classStroke);
      }
      group.append('text').text(classData.name).attr('font-weight', 'bold').attr('y', -totalHeight/2 + nameHeight/2 + 5).attr('text-anchor', 'middle').attr('fill', colors.classText);
      
      group.append('g').attr('transform', `translate(0, ${-totalHeight/2 + nameHeight + padding})`)
          .selectAll('text').data(classData.attributes || []).join('text')
          .text(t => t).attr('y', (t,i) => i * lineHeight).attr('x', -maxWidth/2 + padding).attr('font-family', 'monospace').attr('font-size', '12px').attr('fill', colors.classText);

      group.append('g').attr('transform', `translate(0, ${-totalHeight/2 + nameHeight + attrHeight + padding})`)
          .selectAll('text').data(classData.methods || []).join('text')
          .text(t => t).attr('y', (t,i) => i * lineHeight).attr('x', -maxWidth/2 + padding).attr('font-family', 'monospace').attr('font-size', '12px').attr('fill', colors.classText);
  });
  
  // --- COMMON SVG HELPERS ---
  const zoom = d3.zoom().scaleExtent([0.1, 4]).on("zoom", (event) => {
    graphContainer.attr("transform", event.transform);
  });
  svg.call(zoom);

  function wrapText(selection, width) {
    selection.each(function() {
        const text = d3.select(this);
        const words = text.text().split(/\s+/).reverse();
        let word, line = [], lineNumber = 0, lineHeight = 1.1;
        const dy = parseFloat(text.attr("dy")) || 0;
        let tspan = text.text(null).append("tspan").attr("x", 0).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 0).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
  }
};
