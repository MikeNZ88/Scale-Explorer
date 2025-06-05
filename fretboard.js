// 🎸 FRETBOARD VISUALIZATION LIBRARY
// Renders interactive guitar fretboard diagrams with scale patterns

class Fretboard {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            frets: options.frets || 12,
            strings: options.strings || 6,
            startFret: options.startFret || 0,
            showFretNumbers: options.showFretNumbers !== false,
            showStringLabels: options.showStringLabels !== false,
            dotSize: options.dotSize || 16,
            fretSpacing: options.fretSpacing || 50,
            stringSpacing: options.stringSpacing || 30,
            nutWidth: options.nutWidth || 8,
            ...options
        };
        
        // Standard guitar tuning (high to low for display purposes)
        this.tuning = options.tuning || ['E', 'B', 'G', 'D', 'A', 'E'];
        
        // Use the same chromatic scale system as app.js
        this.chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // Flat keys for proper note spelling
        this.flatKeys = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
        
        this.init();
    }
    
    init() {
        this.container.innerHTML = '';
        this.container.style.position = 'relative';
        this.container.style.overflow = 'auto';
        
        this.createFretboard();
    }
    
    createFretboard() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        // Add extra space on the left for open string dots
        const leftMargin = 40; // Space for open string dots and labels
        const width = leftMargin + (this.options.frets + 1) * this.options.fretSpacing + this.options.nutWidth + 20;
        const height = (this.options.strings - 1) * this.options.stringSpacing + 60;
        
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.style.background = '#fafafa';
        
        this.svg = svg;
        this.width = width;
        this.height = height;
        
        this.drawFrets();
        this.drawStrings();
        this.drawFretNumbers();
        this.drawStringLabels();
        this.drawFretboardInlays();
        
        this.container.appendChild(svg);
    }
    
    drawFrets() {
        const leftMargin = 40;
        const startY = 20;
        const endY = startY + (this.options.strings - 1) * this.options.stringSpacing;
        
        // Draw nut (thick line at fret 0)
        if (this.options.startFret === 0) {
            const nutLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            nutLine.setAttribute('x1', leftMargin);
            nutLine.setAttribute('y1', startY);
            nutLine.setAttribute('x2', leftMargin);
            nutLine.setAttribute('y2', endY);
            nutLine.setAttribute('stroke', '#333');
            nutLine.setAttribute('stroke-width', this.options.nutWidth);
            this.svg.appendChild(nutLine);
        }
        
        // Draw frets
        for (let fret = this.options.startFret; fret <= this.options.startFret + this.options.frets; fret++) {
            const x = leftMargin + this.options.nutWidth + (fret - this.options.startFret) * this.options.fretSpacing;
            const fretLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            fretLine.setAttribute('x1', x);
            fretLine.setAttribute('y1', startY);
            fretLine.setAttribute('x2', x);
            fretLine.setAttribute('y2', endY);
            fretLine.setAttribute('stroke', '#999');
            fretLine.setAttribute('stroke-width', fret === 0 ? 4 : 2);
            this.svg.appendChild(fretLine);
        }
    }
    
    drawStrings() {
        const leftMargin = 40;
        const startX = leftMargin;
        const endX = leftMargin + this.options.nutWidth + this.options.frets * this.options.fretSpacing;
        
        for (let string = 0; string < this.options.strings; string++) {
            const y = 20 + string * this.options.stringSpacing;
            const stringLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            stringLine.setAttribute('x1', startX);
            stringLine.setAttribute('y1', y);
            stringLine.setAttribute('x2', endX);
            stringLine.setAttribute('y2', y);
            stringLine.setAttribute('stroke', '#666');
            stringLine.setAttribute('stroke-width', 1.5);
            this.svg.appendChild(stringLine);
        }
    }
    
    drawFretNumbers() {
        if (!this.options.showFretNumbers) return;
        
        const leftMargin = 40;
        for (let fret = this.options.startFret + 1; fret <= this.options.startFret + this.options.frets; fret++) {
            const x = leftMargin + this.options.nutWidth + (fret - this.options.startFret - 0.5) * this.options.fretSpacing;
            const y = 20 + (this.options.strings - 1) * this.options.stringSpacing + 25;
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', y);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-family', 'Arial, sans-serif');
            text.setAttribute('font-size', '12');
            text.setAttribute('fill', '#666');
            text.textContent = fret;
            this.svg.appendChild(text);
        }
    }
    
    drawStringLabels() {
        if (!this.options.showStringLabels) return;
        
        for (let string = 0; string < this.options.strings; string++) {
            const x = 20; // Keep string labels in their original position
            const y = 20 + string * this.options.stringSpacing + 4;
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', y);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-family', 'Arial, sans-serif');
            text.setAttribute('font-size', '12');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('fill', '#333');
            text.textContent = this.tuning[string];
            this.svg.appendChild(text);
        }
    }
    
    drawFretboardInlays() {
        const leftMargin = 40;
        const inlayFrets = [3, 5, 7, 9, 12, 15, 17, 19, 21];
        const doubleInlayFrets = [12, 24];
        
        for (let fret of inlayFrets) {
            if (fret < this.options.startFret || fret > this.options.startFret + this.options.frets) continue;
            
            const x = leftMargin + this.options.nutWidth + (fret - this.options.startFret - 0.5) * this.options.fretSpacing;
            
            if (doubleInlayFrets.includes(fret)) {
                // Double dots for octave markers
                const y1 = 20 + (this.options.strings - 1) * this.options.stringSpacing * 0.25;
                const y2 = 20 + (this.options.strings - 1) * this.options.stringSpacing * 0.75;
                
                this.createInlayDot(x, y1);
                this.createInlayDot(x, y2);
            } else {
                // Single dot
                const y = 20 + (this.options.strings - 1) * this.options.stringSpacing * 0.5;
                this.createInlayDot(x, y);
            }
        }
    }
    
    createInlayDot(x, y) {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', x);
        dot.setAttribute('cy', y);
        dot.setAttribute('r', 4);
        dot.setAttribute('fill', '#ddd');
        dot.setAttribute('stroke', '#bbb');
        dot.setAttribute('stroke-width', 1);
        this.svg.appendChild(dot);
    }
    
    render(notes = []) {
        // Clear existing note dots and text
        const existingDots = this.svg.querySelectorAll('.note-dot');
        const existingText = this.svg.querySelectorAll('.note-text');
        existingDots.forEach(dot => dot.remove());
        existingText.forEach(text => text.remove());
        
        // Add new note dots
        notes.forEach(note => this.addNoteDot(note));
    }
    
    addNoteDot(note) {
        const { fret, string, note: noteName, class: noteClass = 'scale' } = note;
        
        // Calculate position - special handling for open strings (fret 0)
        const leftMargin = 40;
        let x;
        if (fret === 0) {
            // Position open string dots to the left of the nut
            x = leftMargin - 15;
        } else {
            // Normal position calculation for fretted notes
            x = leftMargin + this.options.nutWidth + (fret - this.options.startFret - 0.5) * this.options.fretSpacing;
        }
        const y = 20 + (string - 1) * this.options.stringSpacing;
        
        // Create note dot
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', x);
        dot.setAttribute('cy', y);
        dot.setAttribute('r', this.options.dotSize / 2);
        dot.setAttribute('class', `note-dot ${noteClass}`);
        
        // Set colors based on note type
        switch (noteClass) {
            case 'root':
                dot.setAttribute('fill', '#dc2626');
                dot.setAttribute('stroke', '#991b1b');
                break;
            case 'scale':
                dot.setAttribute('fill', '#2563eb');
                dot.setAttribute('stroke', '#1d4ed8');
                break;
            case 'chord':
                dot.setAttribute('fill', '#f59e0b');
                dot.setAttribute('stroke', '#d97706');
                break;
            default:
                dot.setAttribute('fill', '#6b7280');
                dot.setAttribute('stroke', '#4b5563');
        }
        
        dot.setAttribute('stroke-width', 2);
        this.svg.appendChild(dot);
        
        // Add note label
        if (noteName) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', y + 4);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-family', 'Arial, sans-serif');
            text.setAttribute('font-size', '11');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('fill', 'white');
            text.setAttribute('class', 'note-text');
            text.textContent = noteName;
            this.svg.appendChild(text);
        }
        
        // Add hover effect
        dot.style.cursor = 'pointer';
        dot.addEventListener('mouseenter', () => {
            dot.setAttribute('r', this.options.dotSize / 2 + 2);
        });
        dot.addEventListener('mouseleave', () => {
            dot.setAttribute('r', this.options.dotSize / 2);
        });
    }
    
    // Calculate note at specific fret and string with proper spelling
    getNoteAt(string, fret, useFlats = false) {
        // Map string numbers to tuning array indices
        // String 1 (high E) = index 0, String 6 (low E) = index 5
        const stringIndex = string - 1;
        const openNote = this.tuning[stringIndex];
        const openNoteIndex = this.chromaticScale.indexOf(openNote);
        const noteIndex = (openNoteIndex + fret) % 12;
        let note = this.chromaticScale[noteIndex];
        
        // Use flats if specified
        if (useFlats && note.includes('#')) {
            const flatEquivalents = {
                'C#': 'Db',
                'D#': 'Eb',
                'F#': 'Gb',
                'G#': 'Ab',
                'A#': 'Bb'
            };
            note = flatEquivalents[note] || note;
        }
        
        return note;
    }
    
    // Generate fretboard pattern from scale notes with proper spelling
    generatePattern(scaleNotes, rootNote = null) {
        const pattern = [];
        const useFlats = rootNote && this.flatKeys.includes(rootNote);
        
        // Create enharmonic equivalents map for better note matching
        const enharmonicMap = {
            'C': ['C', 'B#'],
            'C#': ['C#', 'Db'],
            'D': ['D'],
            'D#': ['D#', 'Eb'],
            'E': ['E', 'Fb'],
            'F': ['F', 'E#'],
            'F#': ['F#', 'Gb'],
            'G': ['G'],
            'G#': ['G#', 'Ab'],
            'A': ['A'],
            'A#': ['A#', 'Bb'],
            'B': ['B', 'Cb'],
            // Also include reverse mappings
            'Db': ['C#', 'Db'],
            'Eb': ['D#', 'Eb'],
            'Fb': ['E', 'Fb'],
            'Gb': ['F#', 'Gb'],
            'Ab': ['G#', 'Ab'],
            'Bb': ['A#', 'Bb'],
            'Cb': ['B', 'Cb'],
            'B#': ['C', 'B#'],
            'E#': ['F', 'E#']
        };
        
        // Function to find the scale note name that matches this fretboard position
        function getScaleNoteName(fretboardNote, scaleNotes) {
            // First check for direct match
            if (scaleNotes.includes(fretboardNote)) {
                return fretboardNote;
            }
            
            // Check enharmonic equivalents and return the scale's spelling
            const equivalents = enharmonicMap[fretboardNote] || [fretboardNote];
            for (let equiv of equivalents) {
                if (scaleNotes.includes(equiv)) {
                    return equiv; // Return the scale's spelling, not the fretboard's
                }
            }
            
            return null; // Not in scale
        }
        
        for (let string = 1; string <= this.options.strings; string++) {
            for (let fret = this.options.startFret; fret <= this.options.startFret + this.options.frets; fret++) {
                const fretboardNote = this.getNoteAt(string, fret, useFlats);
                const scaleNoteName = getScaleNoteName(fretboardNote, scaleNotes);
                
                if (scaleNoteName) {
                    // Check if this note is the root (considering enharmonics)
                    const isRoot = rootNote && (scaleNoteName === rootNote || 
                        (enharmonicMap[scaleNoteName] && enharmonicMap[scaleNoteName].includes(rootNote)) ||
                        (enharmonicMap[rootNote] && enharmonicMap[rootNote].includes(scaleNoteName)));
                    
                    pattern.push({
                        fret: fret,
                        string: string,
                        note: scaleNoteName, // Use the scale's note spelling, not fretboard calculation
                        class: isRoot ? 'root' : 'scale'
                    });
                }
            }
        }
        
        return pattern;
    }
    
    // Display a scale pattern
    displayScale(scaleNotes, rootNote = null) {
        const pattern = this.generatePattern(scaleNotes, rootNote);
        this.render(pattern);
    }
    
    // Clear all notes
    clear() {
        this.render([]);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Fretboard;
}