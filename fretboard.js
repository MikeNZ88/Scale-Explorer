// Custom Fretboard Implementation
class Fretboard {
    constructor(options = {}) {
        this.el = options.el;
        this.frets = options.frets || 15;
        this.strings = options.strings || 6;
        this.fretWidth = options.fretWidth || 45;
        this.fretHeight = options.fretHeight || 35;
        this.nutWidth = options.nutWidth || 8;
        this.stringWidth = options.stringWidth || 2;
        this.fretColor = options.fretColor || '#d0d0d0';
        this.stringColor = options.stringColor || '#888888';
        this.backgroundColor = options.backgroundColor || '#ffffff';
        this.showFretNumbers = options.showFretNumbers !== false;
        this.fretNumbersHeight = options.fretNumbersHeight || 18;
        this.dotSize = options.dotSize || 20;
        this.dotStrokeColor = options.dotStrokeColor || '#ffffff';
        this.dotStrokeWidth = options.dotStrokeWidth || 2;
        
        this.dots = [];
        this.width = this.frets * this.fretWidth + this.nutWidth;
        this.height = (this.strings - 1) * this.fretHeight + 60; // Extra space for fret numbers
    }
    
    setDots(dots) {
        this.dots = dots;
        return this;
    }
    
    render() {
        if (!this.el) {
            console.error('No container element provided');
            return;
        }
        
        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', this.width);
        svg.setAttribute('height', this.height);
        svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
        svg.style.background = this.backgroundColor;
        
        // Clear container
        this.el.innerHTML = '';
        
        // Draw frets (vertical lines)
        for (let fret = 0; fret <= this.frets; fret++) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            const x = fret === 0 ? this.nutWidth / 2 : this.nutWidth + (fret - 1) * this.fretWidth + this.fretWidth / 2;
            
            line.setAttribute('x1', x);
            line.setAttribute('y1', 30);
            line.setAttribute('x2', x);
            line.setAttribute('y2', this.height - 30);
            line.setAttribute('stroke', this.fretColor);
            line.setAttribute('stroke-width', fret === 0 ? 4 : 2);
            svg.appendChild(line);
        }
        
        // Draw strings (horizontal lines)
        for (let string = 0; string < this.strings; string++) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            const y = 30 + string * this.fretHeight;
            
            line.setAttribute('x1', 0);
            line.setAttribute('y1', y);
            line.setAttribute('x2', this.width);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', this.stringColor);
            line.setAttribute('stroke-width', this.stringWidth);
            svg.appendChild(line);
        }
        
        // Draw fret numbers
        if (this.showFretNumbers) {
            for (let fret = 1; fret <= this.frets; fret++) {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                const x = this.nutWidth + (fret - 1) * this.fretWidth + this.fretWidth / 2;
                
                text.setAttribute('x', x);
                text.setAttribute('y', this.height - 10);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-family', 'Arial, sans-serif');
                text.setAttribute('font-size', '12px');
                text.setAttribute('fill', '#666');
                text.textContent = fret;
                svg.appendChild(text);
            }
        }
        
        // Draw dots
        this.dots.forEach(dot => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            
            // Calculate position
            const x = this.nutWidth + (dot.fret - 0.5) * this.fretWidth;
            const y = 30 + (this.strings - dot.string) * this.fretHeight;
            
            // Circle
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', this.dotSize / 2);
            
            // Color based on whether it's a root note and/or used in tab
            const isRoot = dot.className === 'dot-root' || dot.className === 'dot-root-used';
            const isUsedInTab = dot.className === 'dot-scale-used' || dot.className === 'dot-root-used';
            
            let fillColor, strokeColor, strokeWidth;
            
            if (dot.className === 'dot-root-used') {
                // Root note used in tab - bright red with gold border
                fillColor = '#dc3545';
                strokeColor = '#ffd700';
                strokeWidth = 4;
            } else if (dot.className === 'dot-scale-used') {
                // Scale note used in tab - brown with gold border
                fillColor = '#A0522D';
                strokeColor = '#ffd700';
                strokeWidth = 4;
            } else if (dot.className === 'dot-root') {
                // Root note not used in tab - red with white border
                fillColor = '#dc3545';
                strokeColor = '#ffffff';
                strokeWidth = 2;
            } else {
                // Scale note not used in tab - brown with white border
                fillColor = '#A0522D';
                strokeColor = '#ffffff';
                strokeWidth = 2;
            }
            
            circle.setAttribute('fill', fillColor);
            circle.setAttribute('stroke', strokeColor);
            circle.setAttribute('stroke-width', strokeWidth);
            
            svg.appendChild(circle);
            
            // Note label
            if (dot.note) {
                text.setAttribute('x', x);
                text.setAttribute('y', y + 1);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'central');
                text.setAttribute('font-family', 'Arial, sans-serif');
                text.setAttribute('font-size', '12px');
                text.setAttribute('font-weight', 'bold');
                text.setAttribute('fill', 'white');
                text.textContent = dot.note;
                svg.appendChild(text);
            }
        });
        
        // Add title if provided
        const title = document.createElement('div');
        title.style.textAlign = 'center';
        title.style.marginBottom = '10px';
        title.style.fontWeight = 'bold';
        title.style.fontSize = '14px';
        title.style.color = '#8B4513';
        
        this.el.appendChild(title);
        this.el.appendChild(svg);
        
        return this;
    }
}

// Make it globally available
window.Fretboard = Fretboard;
console.log('✅ Custom Fretboard library loaded successfully!');