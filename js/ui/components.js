// UI Components Module
// Depends on: constants.js, music-theory.js

// Debug: Check if dependencies are loaded
console.log('UIComponents loading, MusicTheory available:', typeof window.MusicTheory);
console.log('MusicConstants available:', typeof window.MusicConstants);

// Main fretboard state
let fretboardState = {
    startFret: 0,
    fretRange: 12, // 12 or 24
    maxFrets: 24,
    showIntervals: false // Add toggle state
};

// Modal fretboard state (separate from main fretboard)
let modalFretboardState = {
    startFret: 0,
    fretRange: 12, // Default to 12 for modal (changed from 15)
    maxFrets: 24
};

// Helper function to convert note names to chromatic indices (handles both sharps and flats)
function noteToIndex(note) {
    // Handle double accidentals first
    if (note.includes('bb')) {
        const naturalNote = note.replace('bb', '');
        const naturalIndex = {
            'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
        }[naturalNote];
        return naturalIndex !== undefined ? (naturalIndex - 2 + 12) % 12 : -1;
    } else if (note.includes('##')) {
        const naturalNote = note.replace('##', '');
        const naturalIndex = {
            'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
        }[naturalNote];
        return naturalIndex !== undefined ? (naturalIndex + 2) % 12 : -1;
    } else {
        // Single accidental or natural
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
            'A#': 10, 'Bb': 10, 'B': 11,
            'B#': 0, 'Cb': 11, 'E#': 5, 'Fb': 4
        };
        return noteMap[note] !== undefined ? noteMap[note] : -1;
    }
}

// Main fretboard rendering function
function createFretboard(scale) {
    console.log('Creating fretboard with scale:', scale);
    
    const fretboardContainer = document.querySelector('.fretboard-container');
    if (!fretboardContainer) {
        console.error('Fretboard container not found');
        return;
    }
    
    fretboardContainer.innerHTML = '';
    
    // Create fretboard controls
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'fretboard-controls';
    controlsDiv.innerHTML = `
        <div class="fret-range-selector">
            <label>View: </label>
            <select id="fret-range-select">
                <option value="12" ${fretboardState.fretRange === 12 ? 'selected' : ''}>12 Frets</option>
                <option value="24" ${fretboardState.fretRange === 24 ? 'selected' : ''}>24 Frets</option>
            </select>
        </div>
        <div class="display-toggle">
            <button id="toggle-display" class="toggle-btn">${fretboardState.showIntervals ? 'Show Notes' : 'Show Intervals'}</button>
        </div>
    `;
    fretboardContainer.appendChild(controlsDiv);
    
    // Add event listeners for controls
    document.getElementById('fret-range-select').addEventListener('change', (e) => {
        fretboardState.fretRange = parseInt(e.target.value);
        fretboardState.startFret = 0; // Always start from fret 0
        createFretboard(scale);
    });
    
    // Add toggle functionality
    document.getElementById('toggle-display').addEventListener('click', () => {
        fretboardState.showIntervals = !fretboardState.showIntervals;
        createFretboard(scale);
    });
    
    // Calculate display range
    const displayFrets = fretboardState.fretRange;
    const endFret = fretboardState.startFret + displayFrets;
    
    // String notes (high E to low E)
    const stringNotes = ['E', 'B', 'G', 'D', 'A', 'E'];
    
    // Create SVG with responsive width
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const fretWidth = displayFrets <= 12 ? 60 : 40; // Narrower frets for 24-fret view
    const svgWidth = 100 + (displayFrets * fretWidth);
    svg.setAttribute('viewBox', `0 0 ${svgWidth} 280`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '280');
    svg.style.background = '#f5f5f5';
    svg.style.border = '2px solid #ddd';
    svg.style.borderRadius = '8px';
    
    // Draw fret lines
    for (let fret = 0; fret <= displayFrets; fret++) {
        const actualFret = fretboardState.startFret + fret;
        const x = 80 + (fret * fretWidth);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x);
        line.setAttribute('y1', 45); // Start just above the strings
        line.setAttribute('x2', x);
        line.setAttribute('y2', 225); // End just below the strings (strings are at y=60 to y=210)
        line.setAttribute('stroke', actualFret === 0 ? '#000' : '#999');
        line.setAttribute('stroke-width', actualFret === 0 ? '4' : '2');
        svg.appendChild(line);
        
        // Fret numbers - make them clearly visible
        if (fret > 0) {
            const fretNumber = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            fretNumber.setAttribute('x', 80 + ((fret - 0.5) * fretWidth));
            fretNumber.setAttribute('y', 25);
            fretNumber.setAttribute('text-anchor', 'middle');
            fretNumber.setAttribute('fill', '#333');
            fretNumber.setAttribute('font-size', displayFrets <= 12 ? '14' : '12');
            fretNumber.setAttribute('font-weight', 'bold');
            fretNumber.textContent = actualFret;
            svg.appendChild(fretNumber);
        }
    }
    
    // Draw strings
    for (let string = 0; string < 6; string++) {
        const y = 60 + (string * 30);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', 80);
        line.setAttribute('y1', y);
        line.setAttribute('x2', 80 + (displayFrets * fretWidth));
        line.setAttribute('y2', y);
        line.setAttribute('stroke', '#666');
        line.setAttribute('stroke-width', '2');
        svg.appendChild(line);
        
        // String labels
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', 60);
        label.setAttribute('y', y + 5);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('fill', '#333');
        label.setAttribute('font-size', '14');
        label.setAttribute('font-weight', 'bold');
        label.textContent = stringNotes[string];
        svg.appendChild(label);
    }
    
    // Draw fret markers for standard positions
    const markerFrets = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
    markerFrets.forEach(markerFret => {
        if (markerFret > fretboardState.startFret && markerFret <= endFret) {
            const fretPosition = markerFret - fretboardState.startFret;
            const x = 80 + ((fretPosition - 0.5) * fretWidth);
            
            if (markerFret === 12 || markerFret === 24) {
                // Double dots for octaves
                const marker1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker1.setAttribute('cx', x);
                marker1.setAttribute('cy', 105);
                marker1.setAttribute('r', '6');
                marker1.setAttribute('fill', '#ccc');
                svg.appendChild(marker1);
                
                const marker2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker2.setAttribute('cx', x);
                marker2.setAttribute('cy', 165);
                marker2.setAttribute('r', '6');
                marker2.setAttribute('fill', '#ccc');
                svg.appendChild(marker2);
            } else {
                // Single dot for other markers
                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker.setAttribute('cx', x);
                marker.setAttribute('cy', 135);
                marker.setAttribute('r', '6');
                marker.setAttribute('fill', '#ccc');
                svg.appendChild(marker);
            }
        }
    });
    
    // Place notes on fretboard
    if (scale && scale.length > 0) {
        for (let string = 0; string < 6; string++) {
            const openNote = stringNotes[string];
            
            for (let fret = 0; fret <= displayFrets; fret++) {
                const actualFret = fretboardState.startFret + fret;
                
                const chromaticIndex = (noteToIndex(openNote) + actualFret) % 12;
                const chromaticNoteName = MusicConstants.chromaticScale[chromaticIndex];
                
                let displayNote = null;
                
                // Check if this note is in the scale
                for (let i = 0; i < scale.length; i++) {
                    const scaleNote = scale[i];
                    
                    // Check for enharmonic equivalents if the function exists
                    if (typeof MusicTheory !== 'undefined' && 
                        typeof MusicTheory.areEnharmonicEquivalents === 'function') {
                        if (MusicTheory.areEnharmonicEquivalents(chromaticNoteName, scaleNote)) {
                            displayNote = scaleNote;
                            break;
                        }
                    } else {
                        // Fallback to direct comparison if function not available
                        if (chromaticNoteName === scaleNote) {
                            displayNote = scaleNote;
                            break;
                        }
                    }
                }
                
                if (displayNote) {
                    // Improved positioning: move fret 0 notes further to the left
                    const x = fret === 0 ? 25 : 80 + ((fret - 0.5) * fretWidth);
                    const y = 60 + (string * 30);
                    
                    // Get the scale index and interval for this note
                    const scaleIndex = scale.indexOf(displayNote);
                    const scaleRoot = scale[0];
                    const intervals = MusicTheory.getIntervals(scale, scaleRoot);
                    const interval = intervals[scaleIndex] || '1';
                    const color = MusicTheory.getIntervalColor(interval);
                    
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('cx', x);
                    circle.setAttribute('cy', y);
                    circle.setAttribute('r', '12');
                    circle.setAttribute('fill', color);
                    circle.setAttribute('stroke', 'white');
                    circle.setAttribute('stroke-width', '2');
                    svg.appendChild(circle);
                    
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', x);
                    text.setAttribute('y', y + 4);
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('fill', 'white');
                    text.setAttribute('font-size', '10');
                    text.setAttribute('font-weight', 'bold');
                    // Show intervals or notes based on toggle state
                    text.textContent = fretboardState.showIntervals ? interval : displayNote;
                    svg.appendChild(text);
                }
            }
        }
    }
    
    // Add click handler for modal
    console.log('Adding click handler to fretboard SVG');
    svg.addEventListener('click', function(e) {
        console.log('Fretboard SVG clicked, opening modal');
        console.log('Event target:', e.target);
        console.log('Scale being passed:', scale);
        
        // Prevent any default behavior
        e.preventDefault();
        e.stopPropagation();
        
        try {
            openFretboardModal(scale);
        } catch (error) {
            console.error('Error opening modal:', error);
        }
    });
    
    // Also add cursor pointer to indicate it's clickable
    svg.style.cursor = 'pointer';
    
    fretboardContainer.appendChild(svg);
}

// Helper function to get scale type from category
function getScaleTypeFromCategory(category) {
    switch (category) {
        case 'major-modes': return 'major';
        case 'harmonic-minor-modes': return 'harmonic-minor';
        case 'harmonic-major-modes': return 'harmonic-major';
        case 'melodic-minor-modes': return 'melodic-minor';
        case 'hungarian-minor-modes': return 'hungarian-minor';
        case 'neapolitan-minor-modes': return 'neapolitan-minor';
        case 'neapolitan-major-modes': return 'neapolitan-major';
        case 'diminished-modes': return 'diminished';
        case 'pentatonic': return 'pentatonic';
        case 'japanese-pentatonic': return 'pentatonic';
        case 'blues-modes': return 'blues';
        case 'blues-scales': return 'blues';
        case 'whole-tone': return 'whole-tone';
        case 'chromatic-scale': return 'chromatic';
        case 'augmented-scale': return 'augmented';
        default: return 'major';
    }
}

function openFretboardModal(scale) {
    console.log('===== OPENING FRETBOARD MODAL =====');
    console.log('Scale passed:', scale);
    
    const modal = document.getElementById('fretboard-modal');
    console.log('Modal element:', modal);
    
    if (!modal) {
        console.error('❌ Modal element not found!');
        return;
    }
    
    console.log('✅ Modal element found');
    console.log('Current modal classes:', modal.className);
    console.log('Current modal display:', modal.style.display);
    
    // Show the modal
    modal.style.display = 'flex';
    modal.classList.remove('hidden');
    
    console.log('Modal display set to:', modal.style.display);
    console.log('Modal classes after removing hidden:', modal.className);
    
    const fretboardDiv = modal.querySelector('.modal-fretboard');
    console.log('Modal fretboard div:', fretboardDiv);
    
    if (!fretboardDiv) {
        console.error('❌ Modal fretboard div not found!');
        console.log('Available elements in modal:', modal.innerHTML);
        return;
    }
    
    console.log('✅ Modal fretboard div found');
    
    // Clear existing content
    fretboardDiv.innerHTML = '';
    
    // Create simplified modal fretboard (larger version of main fretboard)
    renderModalFretboard(fretboardDiv, scale);
    
    console.log('✅ Modal fretboard rendered');
    
    // Apply utilities for modal functionality
    try {
        setOptimalModalSize();
        handleMobileOrientation();
        makeDraggable(modal);
        makeResizable(modal);
        console.log('✅ Modal utilities applied');
    } catch (error) {
        console.error('❌ Error applying modal utilities:', error);
    }
}

function renderModalFretboard(container, scale) {
    // Create a larger version of the main fretboard
    container.innerHTML = '';
    
    // Use the same state as the main fretboard
    const displayFrets = fretboardState.fretRange;
    const endFret = fretboardState.startFret + displayFrets;
    
    // String notes (high E to low E)
    const stringNotes = ['E', 'B', 'G', 'D', 'A', 'E'];
    
    // Create larger SVG for modal
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const fretWidth = displayFrets <= 12 ? 80 : 60; // Larger frets for modal
    const svgWidth = 120 + (displayFrets * fretWidth);
    const svgHeight = 400; // Taller for modal
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.background = '#f8fafc';
    svg.style.border = '2px solid #e2e8f0';
    svg.style.borderRadius = '12px';
    
    // Draw fret lines
    for (let fret = 0; fret <= displayFrets; fret++) {
        const actualFret = fretboardState.startFret + fret;
        const x = 100 + (fret * fretWidth);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x);
        line.setAttribute('y1', 65); // Start just above the strings
        line.setAttribute('x2', x);
        line.setAttribute('y2', 295); // End just below the strings (strings are at y=80 to y=280)
        line.setAttribute('stroke', actualFret === 0 ? '#000' : '#999');
        line.setAttribute('stroke-width', actualFret === 0 ? '5' : '3');
        svg.appendChild(line);
        
        // Fret numbers
        if (fret > 0) {
            const fretNumber = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            fretNumber.setAttribute('x', 100 + ((fret - 0.5) * fretWidth));
            fretNumber.setAttribute('y', 40);
            fretNumber.setAttribute('text-anchor', 'middle');
            fretNumber.setAttribute('fill', '#374151');
            fretNumber.setAttribute('font-size', '18');
            fretNumber.setAttribute('font-weight', 'bold');
            fretNumber.textContent = actualFret;
            svg.appendChild(fretNumber);
        }
    }
    
    // Draw strings
    for (let string = 0; string < 6; string++) {
        const y = 80 + (string * 40);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', 100);
        line.setAttribute('y1', y);
        line.setAttribute('x2', 100 + (displayFrets * fretWidth));
        line.setAttribute('y2', y);
        line.setAttribute('stroke', '#6b7280');
        line.setAttribute('stroke-width', '3');
        svg.appendChild(line);
        
        // String labels
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', 70);
        label.setAttribute('y', y + 6);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('fill', '#374151');
        label.setAttribute('font-size', '18');
        label.setAttribute('font-weight', 'bold');
        label.textContent = stringNotes[string];
        svg.appendChild(label);
    }
    
    // Draw fret markers
    const markerFrets = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
    markerFrets.forEach(markerFret => {
        if (markerFret > fretboardState.startFret && markerFret <= endFret) {
            const fretPosition = markerFret - fretboardState.startFret;
            const x = 100 + ((fretPosition - 0.5) * fretWidth);
            
            if (markerFret === 12 || markerFret === 24) {
                // Double dots for octaves
                const marker1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker1.setAttribute('cx', x);
                marker1.setAttribute('cy', 140);
                marker1.setAttribute('r', '8');
                marker1.setAttribute('fill', '#d1d5db');
                svg.appendChild(marker1);
                
                const marker2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker2.setAttribute('cx', x);
                marker2.setAttribute('cy', 220);
                marker2.setAttribute('r', '8');
                marker2.setAttribute('fill', '#d1d5db');
                svg.appendChild(marker2);
            } else {
                // Single dot for other markers
                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker.setAttribute('cx', x);
                marker.setAttribute('cy', 180);
                marker.setAttribute('r', '8');
                marker.setAttribute('fill', '#d1d5db');
                svg.appendChild(marker);
            }
        }
    });
    
    // Place notes on fretboard
    if (scale && scale.length > 0) {
        for (let string = 0; string < 6; string++) {
            const openNote = stringNotes[string];
            
            for (let fret = 0; fret <= displayFrets; fret++) {
                const actualFret = fretboardState.startFret + fret;
                
                const chromaticIndex = (noteToIndex(openNote) + actualFret) % 12;
                const chromaticNoteName = MusicConstants.chromaticScale[chromaticIndex];
                
                let displayNote = null;
                
                // Check if this note is in the scale
                for (let i = 0; i < scale.length; i++) {
                    const scaleNote = scale[i];
                    
                    if (typeof MusicTheory !== 'undefined' && 
                        typeof MusicTheory.areEnharmonicEquivalents === 'function') {
                        if (MusicTheory.areEnharmonicEquivalents(chromaticNoteName, scaleNote)) {
                            displayNote = scaleNote;
                            break;
                        }
                    } else {
                        if (chromaticNoteName === scaleNote) {
                            displayNote = scaleNote;
                            break;
                        }
                    }
                }
                
                if (displayNote) {
                    // Position notes
                    const x = fret === 0 ? 40 : 100 + ((fret - 0.5) * fretWidth);
                    const y = 80 + (string * 40);
                    
                    // Get interval and color
                    const scaleIndex = scale.indexOf(displayNote);
                    const interval = MusicTheory.getIntervals(scale, scale[0])[scaleIndex] || '1';
                    const color = MusicTheory.getIntervalColor(interval);
                    
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('cx', x);
                    circle.setAttribute('cy', y);
                    circle.setAttribute('r', '16');
                    circle.setAttribute('fill', color);
                    circle.setAttribute('stroke', 'white');
                    circle.setAttribute('stroke-width', '3');
                    svg.appendChild(circle);
                    
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', x);
                    text.setAttribute('y', y + 5);
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('fill', 'white');
                    text.setAttribute('font-size', '12');
                    text.setAttribute('font-weight', 'bold');
                    // Use the same display mode as the main fretboard
                    text.textContent = fretboardState.showIntervals ? interval : displayNote;
                    svg.appendChild(text);
                }
            }
        }
    }
    
    container.appendChild(svg);
}

function closeFretboardModal() {
    const modal = document.getElementById('fretboard-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
    }
}

// Modal utility functions
function setOptimalModalSize() {
    const modal = document.getElementById('fretboard-modal');
    if (!modal) return;
    
    const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
    };
    
    // Set modal to 85% of viewport with max dimensions
    const modalWidth = Math.min(viewport.width * 0.85, 1200);
    const modalHeight = Math.min(viewport.height * 0.85, 800);
    
    modal.style.width = modalWidth + 'px';
    modal.style.height = modalHeight + 'px';
    
    // Center the modal
    modal.style.left = ((viewport.width - modalWidth) / 2) + 'px';
    modal.style.top = ((viewport.height - modalHeight) / 2) + 'px';
}

function handleMobileOrientation() {
    // Adjust modal size on orientation change
    window.addEventListener('orientationchange', function() {
        setTimeout(setOptimalModalSize, 100);
    });
}

function makeDraggable(modal) {
    const header = modal.querySelector('.modal-header');
    if (!header) return;
    
    let isDragging = false;
    let currentX = 0;
    let currentY = 0;
    let initialX = 0;
    let initialY = 0;
    
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    
    function dragStart(e) {
        if (e.target.classList.contains('close-modal') || e.target.closest('button')) {
            return;
        }
        
        initialX = e.clientX - currentX;
        initialY = e.clientY - currentY;
        
        if (e.target === header || header.contains(e.target)) {
            isDragging = true;
            header.style.cursor = 'grabbing';
        }
    }
    
    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            
            modal.style.left = currentX + 'px';
            modal.style.top = currentY + 'px';
        }
    }
    
    function dragEnd() {
        if (isDragging) {
            isDragging = false;
            header.style.cursor = 'grab';
        }
    }
    
    header.style.cursor = 'grab';
}

function makeResizable(modal) {
    // Add resize handles
    const resizeHandles = ['ne', 'nw', 'se', 'sw', 'n', 's', 'e', 'w'];
    
    resizeHandles.forEach(direction => {
        const handle = document.createElement('div');
        handle.className = `resize-handle resize-${direction}`;
        modal.appendChild(handle);
        
        handle.addEventListener('mousedown', initResize);
    });
    
    function initResize(e) {
        const handle = e.target;
        const direction = handle.className.split(' ')[1].replace('resize-', '');
        
        let isResizing = true;
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = parseInt(window.getComputedStyle(modal).width, 10);
        const startHeight = parseInt(window.getComputedStyle(modal).height, 10);
        const startLeft = parseInt(window.getComputedStyle(modal).left, 10);
        const startTop = parseInt(window.getComputedStyle(modal).top, 10);
        
        function doResize(e) {
            if (!isResizing) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newWidth = startWidth;
            let newHeight = startHeight;
            let newLeft = startLeft;
            let newTop = startTop;
            
            if (direction.includes('e')) {
                newWidth = Math.max(400, startWidth + deltaX);
            }
            if (direction.includes('w')) {
                newWidth = Math.max(400, startWidth - deltaX);
                newLeft = startLeft + deltaX;
            }
            if (direction.includes('s')) {
                newHeight = Math.max(300, startHeight + deltaY);
            }
            if (direction.includes('n')) {
                newHeight = Math.max(300, startHeight - deltaY);
                newTop = startTop + deltaY;
            }
            
            modal.style.width = newWidth + 'px';
            modal.style.height = newHeight + 'px';
            modal.style.left = newLeft + 'px';
            modal.style.top = newTop + 'px';
        }
        
        function stopResize() {
            isResizing = false;
            document.removeEventListener('mousemove', doResize);
            document.removeEventListener('mouseup', stopResize);
        }
        
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
        
        e.preventDefault();
    }
}

// Scale display functions
function displayScale(scale, intervals, formula, scaleType, key, category) {
    displayNotes(scale);
    displayIntervals(intervals);
    displayFormula(formula);
    displayChords(scale, scaleType);
    updateScaleColor(intervals);
    updateParentScale(scaleType, key, category);
    updateModeName();
    createFretboard(scale);
    
    // Get current state to create related modes
    const currentState = AppController.getCurrentState();
    createRelatedModes(currentState.mode, currentState.category, currentState.key);
}

function displayNotes(notes) {
    const notesContainer = document.querySelector('.notes');
    if (!notesContainer) return;
    
    notesContainer.innerHTML = '';
    
    // Create play controls container
    const playControlsContainer = document.createElement('div');
    playControlsContainer.className = 'play-controls';
    
    // Create play button
    const playButton = document.createElement('button');
    playButton.className = 'play-btn';
    playButton.textContent = '▶️ Play Scale';
    playButton.setAttribute('data-section', 'notes');
    
    // Create direction toggle button
    const directionButton = document.createElement('button');
    directionButton.className = 'direction-btn';
    directionButton.textContent = '→';
    directionButton.setAttribute('data-direction', 'ascending');
    directionButton.setAttribute('title', 'Ascending');
    
    playControlsContainer.appendChild(playButton);
    playControlsContainer.appendChild(directionButton);
    notesContainer.appendChild(playControlsContainer);
    
    // Create notes display container
    const notesDisplay = document.createElement('div');
    notesDisplay.className = 'notes-display';
    
    notes.forEach((note, index) => {
        const noteElement = document.createElement('span');
        noteElement.className = 'note';
        noteElement.textContent = note;
        noteElement.setAttribute('data-note', note);
        
        if (index === 0) {
            noteElement.classList.add('root-note');
        }
        
        notesDisplay.appendChild(noteElement);
    });
    
    notesContainer.appendChild(notesDisplay);
    
    // Add event listeners
    playButton.addEventListener('click', () => playScale(notes, 'notes'));
    directionButton.addEventListener('click', () => toggleDirection(directionButton));
}

function displayIntervals(intervals) {
    const intervalsContainer = document.querySelector('.intervals');
    if (!intervalsContainer) return;
    
    intervalsContainer.innerHTML = '';
    
    // Create intervals display container (no play controls here)
    const intervalsDisplay = document.createElement('div');
    intervalsDisplay.className = 'intervals-display';
    
    intervals.forEach((interval, index) => {
        const intervalElement = document.createElement('span');
        intervalElement.className = 'interval';
        intervalElement.textContent = interval;
        intervalElement.setAttribute('data-interval', interval);
        intervalElement.setAttribute('data-index', index);
        
        // Set background color based on interval using the consistent color scheme
        const color = MusicTheory.getIntervalColor(interval);
        if (color) {
            intervalElement.style.backgroundColor = color;
        }
        
        intervalsDisplay.appendChild(intervalElement);
    });
    
    intervalsContainer.appendChild(intervalsDisplay);
}

function displayFormula(formula) {
    const formulaContainer = document.querySelector('.formula');
    if (!formulaContainer || !formula) return;
    
    // Convert interval numbers to W/H/WH notation
    const convertedFormula = formula.map(interval => {
        switch (interval) {
            case 1: return 'H';
            case 2: return 'W';
            case 3: return 'WH';
            default: return interval.toString();
        }
    });
    
    formulaContainer.textContent = convertedFormula.join(' - ');
}

function updateScaleColor(intervals) {
    const scaleCard = document.querySelector('.scale-card');
    if (!scaleCard) return;
    
    const baseColor = MusicTheory.calculateScaleColor(intervals);
    const enhancedColor = MusicTheory.enhanceScaleColor(baseColor, intervals);
    
    scaleCard.style.setProperty('--scale-color', enhancedColor);
}

function updateModeName() {
    const modeNameElement = document.querySelector('.mode-name');
    if (!modeNameElement) return;
    
    const { mode, key } = AppController.getCurrentState();
    
    // Get proper mode name from constants
    const modeData = MusicConstants.modeNumbers[mode];
    if (modeData) {
        modeNameElement.textContent = `${key} ${modeData.properName}`;
    } else {
        // Fallback to converted mode name
        const properModeName = mode.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        modeNameElement.textContent = `${key} ${properModeName}`;
    }
}

function updateParentScale(scaleType, key, category) {
    const parentScaleElement = document.querySelector('.parent-scale');
    if (!parentScaleElement) return;
    
    // Show the scale category name instead of redundant parent scale info
    const categoryData = MusicConstants.scaleCategories[category];
    if (categoryData) {
        parentScaleElement.textContent = categoryData.name;
    } else {
        parentScaleElement.textContent = 'Scale';
    }
}

function createRelatedModes(currentMode, category, currentKey) {
    console.log('=== createRelatedModes called ===');
    console.log('currentMode:', currentMode, 'category:', category, 'currentKey:', currentKey);
    
    const modeButtonsContainer = document.querySelector('.mode-buttons');
    const parentScaleInfo = document.querySelector('.parent-scale-info');
    
    if (!modeButtonsContainer || !parentScaleInfo) return;
    
    // Clear existing content
    modeButtonsContainer.innerHTML = '';
    parentScaleInfo.innerHTML = '';
    
    const categoryData = MusicConstants.scaleCategories[category];
    if (!categoryData || !categoryData.modes) return;
    
    // Calculate the root key of the parent scale based on current mode
    const currentModeData = MusicConstants.modeNumbers[currentMode];
    if (!currentModeData) return;
    
    // Mode offset lookup table - semitones from parent scale root to mode root
    const modeOffsets = {
        // Major modes
        'major': 0, 'dorian': 2, 'phrygian': 4, 'lydian': 5, 'mixolydian': 7, 'aeolian': 9, 'locrian': 11,
        // Harmonic minor modes  
        'harmonic-minor': 0, 'locrian-natural-6': 2, 'ionian-sharp-5': 3, 'dorian-sharp-4': 5, 
        'phrygian-dominant': 7, 'lydian-sharp-2': 8, 'altered-dominant': 11,
        // Harmonic major modes
        'harmonic-major': 0, 'dorian-b5': 2, 'phrygian-b4': 3, 'lydian-b3': 5, 'mixolydian-b2': 7, 
        'lydian-augmented-sharp-2': 8, 'locrian-double-flat-7': 11,
        // Melodic minor modes
        'melodic-minor': 0, 'dorian-b2': 2, 'lydian-augmented': 3, 'lydian-dominant': 5,
        'mixolydian-b6': 7, 'locrian-natural-2': 9, 'super-locrian': 11,
        // Hungarian minor modes
        'hungarian-minor': 0, 'oriental': 2, 'ionian-augmented-sharp-2': 3, 'locrian-double-flat-3-double-flat-7': 5,
        'double-harmonic-major': 7, 'lydian-sharp-2-sharp-6': 8, 'ultra-locrian': 11,
        // Neapolitan minor modes
        'neapolitan-minor': 0, 'leading-whole-tone': 1, 'lydian-augmented-dominant': 3, 'lydian-dominant-flat-6': 5,
        'major-locrian': 7, 'half-diminished-flat-2': 8, 'altered-diminished': 11,
        // Neapolitan major modes
        'neapolitan-major': 0, 'leading-whole-tone-major': 1, 'lydian-augmented-major': 3, 'lydian-dominant-major': 5,
        'major-locrian-major': 7, 'half-diminished-major': 9, 'altered-major': 11,
        // Diminished modes
        'diminished': 0, 'half-diminished': 1,
        // Major Pentatonic modes (correct offsets)
        'major-pentatonic': 0, 'suspended-pentatonic': 2, 'man-gong': 4, 'ritusen': 7, 'minor-pentatonic': 9,
        // Japanese Pentatonic scales (independent scales, not modes)
        'hirojoshi-pentatonic': 0, 'iwato-scale': 0,
        // Blues scales
        'blues-major': 0, 'blues-minor': 9,
        // Other scales
        'whole-tone': 0, 'chromatic': 0, 'augmented': 0, 'bebop-major': 0
    };
    
    const currentModeOffset = modeOffsets[currentMode] || 0;
    const parentRootIndex = (noteToIndex(currentKey) - currentModeOffset + 12) % 12;
    
    console.log('currentModeOffset:', currentModeOffset);
    console.log('parentRootIndex:', parentRootIndex);
    
    // Determine spelling convention based on the parent scale root, not the current key
    const parentRoot = getConsistentNoteSpelling(parentRootIndex, 'sharp'); // Get sharp version first
    const parentRootFlat = getConsistentNoteSpelling(parentRootIndex, 'flat'); // Get flat version
    
    // Determine which spelling convention to use based on standard key signatures
    let spellingConvention;
    
    // Keys that use flats in their key signatures
    const flatKeys = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
    // Keys that use sharps in their key signatures  
    const sharpKeys = ['G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
    
    if (flatKeys.includes(parentRootFlat)) {
        spellingConvention = 'flat';
    } else if (sharpKeys.includes(parentRoot)) {
        spellingConvention = 'sharp';
    } else {
        // For C major (no sharps or flats), default to sharp
        spellingConvention = 'sharp';
    }
    
    // Get the final parent root with the determined spelling convention
    const finalParentRoot = getConsistentNoteSpelling(parentRootIndex, spellingConvention);
    
    console.log('parentRoot (sharp):', parentRoot);
    console.log('parentRoot (flat):', parentRootFlat);
    console.log('determined spellingConvention:', spellingConvention);
    console.log('finalParentRoot:', finalParentRoot);
    
    // Store the spelling convention
    window.modalSystemSpelling = spellingConvention;
    
    // Special handling for blues scales - they have different formulas but share the same notes
    if (category === 'blues-scales' || category === 'blues-modes') {
        // For blues scales, calculate each scale independently using its own formula
        // but ensure they use the same parent root
        
        // Create mode buttons for each blues scale
        categoryData.modes.forEach((mode, index) => {
            const modeData = MusicConstants.modeNumbers[mode];
            if (!modeData) return;
            
            // Calculate the root for this mode based on the offset
            const modeOffset = modeOffsets[mode] || 0;
            const modeRootIndex = (parentRootIndex + modeOffset) % 12;
            const modeKey = getConsistentNoteSpelling(modeRootIndex, spellingConvention);
            
            const button = document.createElement('button');
            button.className = `mode-button ${mode === currentMode ? 'active' : ''}`;
            button.innerHTML = `
                <span class="mode-number">${modeData.number}</span>
                <span class="mode-name">${modeKey} ${modeData.properName}</span>
            `;
            
            // Add click handler to change to this mode
            button.addEventListener('click', () => {
                // Update the app state to use this mode and key
                AppController.setState({
                    key: modeKey,
                    category: category,
                    mode: mode
                });
            });
            
            modeButtonsContainer.appendChild(button);
        });
        
        // Display parent scale information
        const parentScaleName = getParentScaleName(category, finalParentRoot);
        const parentInfo = `
            <div class="parent-scale-info">
                <strong>These blues scales share the same notes:</strong> ${parentScaleName}
                <br><small>Blues Major and Blues Minor contain the same notes, starting from different degrees</small>
            </div>
        `;
        parentScaleInfo.innerHTML = parentInfo;
        return; // Exit early for blues scales
    }
    
    // Special handling for whole tone scales
    if (category === 'whole-tone') {
        // For whole tone scales, show all the other whole tone scales that share the same notes
        const wholeToneNotes = ['C', 'D', 'E', 'F#', 'G#', 'A#']; // One whole tone scale
        const otherWholeToneNotes = ['Db', 'Eb', 'F', 'G', 'A', 'B']; // The other whole tone scale
        
        // Determine which whole tone scale the current key belongs to
        const currentKeyIndex = noteToIndex(currentKey);
        const wholeToneIndices = wholeToneNotes.map(note => noteToIndex(note));
        const isInFirstScale = wholeToneIndices.includes(currentKeyIndex);
        
        const relatedNotes = isInFirstScale ? wholeToneNotes : otherWholeToneNotes;
        
        // Create buttons for all notes in the same whole tone scale
        relatedNotes.forEach((note, index) => {
            const button = document.createElement('button');
            button.className = `mode-button ${note === currentKey ? 'active' : ''}`;
            button.innerHTML = `
                <span class="mode-number">${index + 1}</span>
                <span class="mode-name">${note} Whole Tone</span>
            `;
            
            // Add click handler to change to this note
            button.addEventListener('click', () => {
                AppController.setState({
                    key: note,
                    category: category,
                    mode: currentMode
                });
            });
            
            modeButtonsContainer.appendChild(button);
        });
        
        // Display special information for whole tone scales
        const otherScaleNotes = isInFirstScale ? otherWholeToneNotes : wholeToneNotes;
        const parentInfo = `
            <div class="parent-scale-info">
                <strong>Related Whole Tone Scales:</strong> ${relatedNotes.join(', ')} (current scale)
                <br><strong>Complementary Scale:</strong> ${otherScaleNotes.join(', ')}
                <br><small>These two scales together contain all 12 chromatic notes</small>
            </div>
        `;
        parentScaleInfo.innerHTML = parentInfo;
        return; // Exit early for whole tone scales
    }
    
    // Calculate the parent scale with consistent spelling
    const scaleType = getScaleTypeFromCategory(category);
    const parentFormula = categoryData.formulas[categoryData.modes[0]]; // Get the first mode's formula (the parent scale)
    const parentScaleNotes = calculateScaleWithConsistentSpelling(finalParentRoot, parentFormula, scaleType, spellingConvention);
    
    // Create mode buttons for each mode in the category
    categoryData.modes.forEach((mode, index) => {
        const modeData = MusicConstants.modeNumbers[mode];
        if (!modeData) return;
        
        // Use the actual scale note for this mode (maintaining consistent spelling)
        const modeKey = parentScaleNotes[index] || finalParentRoot;
        
        const button = document.createElement('button');
        button.className = `mode-button ${mode === currentMode ? 'active' : ''}`;
        button.innerHTML = `
            <span class="mode-number">${modeData.number}</span>
            <span class="mode-name">${modeKey} ${modeData.properName}</span>
        `;
        
        // Add click handler to change to this mode
        button.addEventListener('click', () => {
            // Convert the modeKey to proper enharmonic spelling
            const properKey = getProperEnharmonicSpelling(modeKey);
            
            // Update the app state to use this mode and proper key
            AppController.setState({
                key: properKey,
                category: category,
                mode: mode
            });
        });
        
        modeButtonsContainer.appendChild(button);
    });
    
    // Display parent scale information
    const parentScaleName = getParentScaleName(category, finalParentRoot);
    const parentInfo = `
        <div class="parent-scale-info">
            <strong>These modes are derived from:</strong> ${parentScaleName}
            <br><small>All modes derive from the same scale, starting on different degrees</small>
        </div>
    `;
    parentScaleInfo.innerHTML = parentInfo;
}

// Helper function to determine spelling convention from a key
function determineSpellingConvention(key) {
    // Determine if the key uses sharps, flats, or naturals
    if (key.includes('#')) {
        return 'sharp';
    }
    if (key.includes('b')) {
        return 'flat';
    }
    
    // For natural keys, determine based on key signature conventions
    // Keys that typically use sharps in their key signatures
    const sharpKeys = ['C', 'G', 'D', 'A', 'E', 'B'];
    // Keys that typically use flats in their key signatures  
    const flatKeys = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
    
    if (sharpKeys.includes(key)) {
        return 'sharp';
    }
    if (flatKeys.includes(key)) {
        return 'flat';
    }
    
    return 'sharp'; // Default to sharp for ambiguous cases
}

// Helper function to get consistent note spelling based on convention
function getConsistentNoteSpelling(noteIndex, spellingConvention) {
    const normalizedIndex = ((noteIndex % 12) + 12) % 12;
    
    // Chromatic scales with consistent spelling
    const sharpChromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const flatChromatic = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    
    if (spellingConvention === 'flat') {
        return flatChromatic[normalizedIndex];
    } else {
        return sharpChromatic[normalizedIndex];
    }
}

// Helper function to convert enharmonic equivalents to proper spelling
function getProperEnharmonicSpelling(note) {
    // Get the current spelling convention from the modal system
    const spellingConvention = window.modalSystemSpelling || 'sharp';
    
    // Only convert truly problematic enharmonic equivalents, not standard sharp/flat pairs
    const enharmonicMap = {
        'B#': 'C',
        'E#': 'F',
        'Fb': 'E',
        'Cb': 'B'
    };
    
    // Check if it's a problematic enharmonic that should always be converted
    if (enharmonicMap[note]) {
        return enharmonicMap[note];
    }
    
    // For standard sharp/flat pairs, respect the spelling convention
    if (spellingConvention === 'flat') {
        const sharpToFlat = {
            'C#': 'Db',
            'D#': 'Eb',
            'F#': 'Gb',
            'G#': 'Ab',
            'A#': 'Bb'
        };
        return sharpToFlat[note] || note;
    } else {
        const flatToSharp = {
            'Db': 'C#',
            'Eb': 'D#',
            'Gb': 'F#',
            'Ab': 'G#',
            'Bb': 'A#'
        };
        return flatToSharp[note] || note;
    }
}

// Helper function to calculate scale with consistent enharmonic spelling
function calculateScaleWithConsistentSpelling(root, formula, scaleType, spellingConvention) {
    if (!formula || !Array.isArray(formula)) {
        console.warn('Invalid formula provided to calculateScaleWithConsistentSpelling:', formula);
        return [];
    }
    
    // Define the note names in order for proper scale degree calculation
    const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const noteToIndex = {
        'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11,
        'C#': 1, 'Db': 1, 'D#': 3, 'Eb': 3, 'F#': 6, 'Gb': 6,
        'G#': 8, 'Ab': 8, 'A#': 10, 'Bb': 10,
        // Add enharmonic equivalents
        'B#': 0, 'Cb': 11, 'E#': 5, 'Fb': 4
    };
    
    // Find the root note's position in the note names array
    const rootNoteName = root.charAt(0);
    const rootNoteIndex = noteNames.indexOf(rootNoteName);
    if (rootNoteIndex === -1) {
        console.warn('Invalid root note:', root);
        return [];
    }
    
    // Get the chromatic index of the root
    const rootChromaticIndex = noteToIndex[root];
    if (rootChromaticIndex === undefined) {
        console.warn('Invalid root note:', root);
        return [];
    }
    
    // Calculate scale notes based on scale degrees
    const scale = [root]; // Start with the root
    let currentChromaticIndex = rootChromaticIndex;
    
    for (let i = 0; i < formula.length - 1; i++) {
        // Move to the next chromatic position
        currentChromaticIndex = (currentChromaticIndex + formula[i]) % 12;
        
        // Calculate which scale degree this should be (2nd, 3rd, 4th, etc.)
        const scaleDegreeIndex = (rootNoteIndex + i + 1) % 7;
        const baseNoteName = noteNames[scaleDegreeIndex];
        const baseNoteChromatic = noteToIndex[baseNoteName];
        
        // Calculate the difference between where we are and where the base note is
        const chromaticDifference = (currentChromaticIndex - baseNoteChromatic + 12) % 12;
        
        let noteName;
        if (chromaticDifference === 0) {
            // Perfect match - use the natural note
            noteName = baseNoteName;
        } else if (chromaticDifference === 1) {
            // One semitone up - use sharp or flat based on convention
            if (spellingConvention === 'flat') {
                // Use the next note with flat
                const nextDegreeIndex = (scaleDegreeIndex + 1) % 7;
                noteName = noteNames[nextDegreeIndex] + 'b';
            } else {
                // Use sharp
                noteName = baseNoteName + '#';
            }
        } else if (chromaticDifference === 11) {
            // One semitone down - use flat or sharp based on convention
            if (spellingConvention === 'sharp') {
                // Use the previous note with sharp
                const prevDegreeIndex = (scaleDegreeIndex - 1 + 7) % 7;
                noteName = noteNames[prevDegreeIndex] + '#';
            } else {
                // Use flat
                noteName = baseNoteName + 'b';
            }
        } else {
            // For other intervals, use consistent chromatic spelling
            noteName = getConsistentNoteSpelling(currentChromaticIndex, spellingConvention);
        }
        
        scale.push(noteName);
    }
    
    return scale;
}

function getParentScaleName(category, parentRoot) {
    const categoryData = MusicConstants.scaleCategories[category];
    if (!categoryData) return `${parentRoot} Scale`;
    
    switch (category) {
        case 'major-modes':
            return `${parentRoot} Major`;
        case 'harmonic-minor-modes':
            return `${parentRoot} Harmonic Minor`;
        case 'harmonic-major-modes':
            return `${parentRoot} Harmonic Major`;
        case 'melodic-minor-modes':
            return `${parentRoot} Melodic Minor`;
        case 'hungarian-minor-modes':
            return `${parentRoot} Hungarian Minor`;
        case 'neapolitan-minor-modes':
            return `${parentRoot} Neapolitan Minor`;
        case 'neapolitan-major-modes':
            return `${parentRoot} Neapolitan Major`;
        case 'diminished-modes':
            return `${parentRoot} Diminished`;
        case 'pentatonic':
            return `${parentRoot} Major Pentatonic`;
        case 'japanese-pentatonic':
            return `${parentRoot} Japanese Pentatonic`;
        case 'blues-modes':
        case 'blues-scales':
            return `${parentRoot} Blues`;
        default:
            return `${parentRoot} ${categoryData.name}`;
    }
}

// Search functionality
let searchResults = [];
let selectedSuggestionIndex = -1;

function initializeSearch() {
    console.log('Initializing search functionality...');
    const searchInput = document.getElementById('mode-search');
    const suggestionsContainer = document.getElementById('search-suggestions');
    
    if (!searchInput || !suggestionsContainer) {
        console.error('Search elements not found:', { searchInput, suggestionsContainer });
        return;
    }
    
    console.log('Search elements found, adding event listeners...');
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('keydown', handleSearchKeydown);
    searchInput.addEventListener('blur', hideSuggestions);
    searchInput.addEventListener('focus', showSuggestionsIfResults);
    console.log('Search functionality initialized successfully');
}

function handleSearchInput(e) {
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        hideSuggestions();
        return;
    }
    
    searchResults = searchModes(query);
    displaySearchSuggestions(searchResults);
    selectedSuggestionIndex = -1;
}

function handleSearchKeydown(e) {
    const suggestionsContainer = document.getElementById('search-suggestions');
    
    if (suggestionsContainer.classList.contains('hidden')) {
        return;
    }
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, searchResults.length - 1);
            updateSuggestionHighlight();
            break;
        case 'ArrowUp':
            e.preventDefault();
            selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
            updateSuggestionHighlight();
            break;
        case 'Enter':
            e.preventDefault();
            if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < searchResults.length) {
                selectSearchResult(searchResults[selectedSuggestionIndex]);
            }
            break;
        case 'Escape':
            hideSuggestions();
            e.target.blur();
            break;
    }
}

function searchModes(query) {
    const results = [];
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);
    
    // Notes for root matching
    const notes = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
    
    // Find root note in query
    const rootNote = queryWords.find(word => 
        notes.some(note => note.toLowerCase() === word.toLowerCase())
    );
    
    // Search through all categories
    Object.entries(MusicConstants.scaleCategories).forEach(([categoryKey, categoryData]) => {
        if (!categoryData.modes) return;
        
        categoryData.modes.forEach(mode => {
            const modeData = MusicConstants.modeMetadata[mode];
            const modeNumbers = MusicConstants.modeNumbers[mode];
            
            if (!modeData || !modeNumbers) {
                return;
            }
            
            const modeName = modeNumbers.properName || mode;
            const modeNameLower = modeName.toLowerCase();
            const categoryName = categoryData.name.toLowerCase();
            
            // Calculate match score
            let score = 0;
            let matchedText = '';
            
            // Check if any query word matches the mode name
            const modeWordMatch = queryWords.find(word => {
                // Direct mode name match
                if (modeNameLower.includes(word.toLowerCase()) && word.length > 1) {
                    return true;
                }
                // Special case: "major" should match the "major" mode (Ionian)
                if (word.toLowerCase() === 'major' && mode === 'major') {
                    return true;
                }
                return false;
            });
            
            // HIGH PRIORITY: Root note + mode combination
            if (rootNote && modeWordMatch) {
                score = 1000; // Highest priority
                
                // Special handling for "major" search - show as "Major" in results
                const displayModeName = queryWords.includes('major') && mode === 'major' ? 'Major' : modeName;
                matchedText = `${rootNote.toUpperCase()} ${displayModeName}`;
                
                // Add result for the specific root note
                results.push({
                    root: rootNote.toUpperCase(),
                    mode: mode,
                    modeName: displayModeName,
                    category: categoryKey,
                    categoryName: categoryData.name,
                    description: modeData.description || '',
                    mood: modeData.mood || '',
                    score: score,
                    matchedText: matchedText
                });
                
            } else if (modeWordMatch) {
                // MEDIUM PRIORITY: Mode name match only
                score = 500;
                
                // Special handling for "major" search - show as "Major" in results
                const displayModeName = queryWords.includes('major') && mode === 'major' ? 'Major' : modeName;
                matchedText = displayModeName;
                
                // Add result for all notes if just searching by mode name
                notes.forEach(note => {
                    results.push({
                        root: note,
                        mode: mode,
                        modeName: displayModeName,
                        category: categoryKey,
                        categoryName: categoryData.name,
                        description: modeData.description || '',
                        mood: modeData.mood || '',
                        score: score,
                        matchedText: `${note} ${displayModeName}`
                    });
                });
                
            } else {
                // LOW PRIORITY: Partial matches
                queryWords.forEach(word => {
                    if (word.length > 1) { // Ignore single letter matches unless they're note names
                        if (modeNameLower.includes(word.toLowerCase())) {
                            score += 100;
                        }
                        if (categoryName.includes(word.toLowerCase())) {
                            score += 25;
                        }
                        // Special case: "major" should match the "major" mode (Ionian)
                        if (word.toLowerCase() === 'major' && mode === 'major') {
                            score += 100;
                        }
                    }
                });
                
                if (score > 0) {
                    const displayModeName = queryWords.includes('major') && mode === 'major' ? 'Major' : modeName;
                    notes.forEach(note => {
                        results.push({
                            root: note,
                            mode: mode,
                            modeName: displayModeName,
                            category: categoryKey,
                            categoryName: categoryData.name,
                            description: modeData.description || '',
                            mood: modeData.mood || '',
                            score: score,
                            matchedText: displayModeName
                        });
                    });
                }
            }
        });
    });
    
    // Sort by score (highest first) and limit results
    const sortedResults = results
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);
        
    return sortedResults;
}

function displaySearchSuggestions(results) {
    const suggestionsContainer = document.getElementById('search-suggestions');
    
    if (results.length === 0) {
        hideSuggestions();
        return;
    }
    
    suggestionsContainer.innerHTML = '';
    
    results.forEach((result, index) => {
        const suggestion = document.createElement('div');
        suggestion.className = 'search-suggestion';
        suggestion.dataset.index = index;
        
        suggestion.innerHTML = `
            <div class="suggestion-main">
                <div class="suggestion-title">${result.root} ${result.modeName}</div>
                <div class="suggestion-subtitle">${result.description}</div>
            </div>
            <div class="suggestion-category">${result.categoryName}</div>
        `;
        
        suggestion.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevent the blur event from firing
            selectSearchResult(result);
        });
        suggestion.addEventListener('mouseenter', () => {
            selectedSuggestionIndex = index;
            updateSuggestionHighlight();
        });
        
        suggestionsContainer.appendChild(suggestion);
    });
    
    suggestionsContainer.classList.remove('hidden');
}

function updateSuggestionHighlight() {
    const suggestions = document.querySelectorAll('.search-suggestion');
    suggestions.forEach((suggestion, index) => {
        suggestion.classList.toggle('highlighted', index === selectedSuggestionIndex);
    });
}

function selectSearchResult(result) {
    console.log('Selecting search result:', result);
    
    // Immediately clear search and hide suggestions to prevent timing issues
    const searchInput = document.getElementById('mode-search');
    const suggestionsContainer = document.getElementById('search-suggestions');
    
    if (searchInput) {
        searchInput.value = '';
    }
    
    if (suggestionsContainer) {
        suggestionsContainer.classList.add('hidden');
        selectedSuggestionIndex = -1;
    }
    
    // Use the AppController's setState method with a callback to ensure everything updates
    if (window.AppController && typeof AppController.setState === 'function') {
        console.log('Using AppController.setState to update state');
        console.log('Setting state to:', { key: result.root, category: result.category, mode: result.mode });
        
        // Update state and force scale update
        AppController.setState({
            key: result.root,
            category: result.category,
            mode: result.mode
        });
        
        // Force an additional update after a short delay to ensure everything is set
        setTimeout(() => {
            console.log('Forcing additional scale update...');
            if (typeof AppController.updateScale === 'function') {
                AppController.updateScale();
            }
        }, 100);
        
    } else {
        console.error('AppController.setState not available, falling back to manual updates');
        
        // Fallback to manual UI updates
        const rootSelect = document.getElementById('key-select');
        const categorySelect = document.getElementById('category-select');
        const modeSelect = document.getElementById('mode-select');
        
        // Set root note first
        if (rootSelect) {
            rootSelect.value = result.root;
            const changeEvent = new Event('change', { bubbles: true });
            rootSelect.dispatchEvent(changeEvent);
        }
        
        // Set category and wait for it to fully update
        if (categorySelect) {
            categorySelect.value = result.category;
            const changeEvent = new Event('change', { bubbles: true });
            categorySelect.dispatchEvent(changeEvent);
            
            // Wait for mode options to populate, then set mode
            const waitForModeOptions = (attempts = 0) => {
                if (attempts > 20) { // Give up after 1 second
                    console.error('Timeout waiting for mode options');
                    return;
                }
                
                if (modeSelect) {
                    const modeOption = modeSelect.querySelector(`option[value="${result.mode}"]`);
                    if (modeOption) {
                        modeSelect.value = result.mode;
                        const changeEvent = new Event('change', { bubbles: true });
                        modeSelect.dispatchEvent(changeEvent);
                    } else {
                        setTimeout(() => waitForModeOptions(attempts + 1), 50);
                    }
                }
            };
            
            setTimeout(waitForModeOptions, 100);
        }
    }
    
    console.log('Search result selection completed');
}

function showSuggestionsIfResults() {
    if (searchResults.length > 0) {
        document.getElementById('search-suggestions').classList.remove('hidden');
    }
}

function hideSuggestions() {
    setTimeout(() => {
        document.getElementById('search-suggestions').classList.add('hidden');
        selectedSuggestionIndex = -1;
    }, 150); // Small delay to allow for click events
}

function displayChords(scale, scaleType) {
    console.log('=== displayChords DEBUG START ===');
    console.log('Scale:', scale);
    console.log('Scale Type:', scaleType);
    console.log('Scale Length:', scale?.length);
    
    const chordsSection = document.querySelector('.chords-section');
    const chordsList = document.getElementById('chords-list');
    
    console.log('DOM elements found:', { chordsSection: !!chordsSection, chordsList: !!chordsList });
    
    if (!scale || scale.length < 3 || !chordsSection || !chordsList) {
        console.log('Early return due to missing requirements:', { 
            scale: scale, 
            scaleLength: scale?.length, 
            chordsSection: !!chordsSection, 
            chordsList: !!chordsList 
        });
        return;
    }
    
    // Check if this scale type should display chords
    const shouldDisplay = MusicTheory.shouldDisplayChords(scaleType, scale.length);
    console.log('shouldDisplayChords result:', shouldDisplay);
    
    if (!shouldDisplay) {
        console.log('Hiding chords section - scale type should not display chords');
        chordsSection.style.display = 'none';
        return;
    }
    
    // Show the chords section
    chordsSection.style.display = 'block';
    console.log('Chords section shown');
    
    // Check if this scale uses characteristic chord analysis instead of traditional analysis
    console.log('Calling getCharacteristicChords with:', { scale, scaleType });
    const characteristicChords = MusicTheory.getCharacteristicChords(scale, scaleType);
    console.log('getCharacteristicChords returned:', characteristicChords);
    console.log('Type of result:', typeof characteristicChords);
    
    if (characteristicChords) {
        console.log('Using characteristic chords display');
        // Display characteristic chords for exotic scales
        displayCharacteristicChords(scale, scaleType, characteristicChords);
    } else {
        console.log('Using traditional chords display');
        // Use traditional degree-by-degree analysis for diatonic scales
        displayTraditionalChords(scale, scaleType);
    }
    console.log('=== displayChords DEBUG END ===');
}

function displayCharacteristicChords(scale, scaleType, characteristicChords) {
    console.log('=== displayCharacteristicChords DEBUG START ===');
    console.log('Parameters:', { scale, scaleType, characteristicChords });
    
    const chordsList = document.getElementById('chords-list');
    const chordsSection = document.querySelector('.chords-section');
    const chordControls = document.querySelector('.chord-controls');
    
    console.log('DOM elements:', { chordsList: !!chordsList, chordsSection: !!chordsSection, chordControls: !!chordControls });
    
    if (!chordsList || !chordsSection) {
        console.log('Missing required DOM elements, returning early');
        return;
    }
    
    // Hide traditional chord controls and update section title
    if (chordControls) chordControls.style.display = 'none';
    const sectionTitle = chordsSection.querySelector('h3');
    if (sectionTitle) sectionTitle.textContent = 'Chords from the Scale';
    
    // Clear existing content
    chordsList.innerHTML = '';
    console.log('Cleared chords list, about to call displayChordsFromScale');
    
    // Display chords organized by type
    displayChordsFromScale(chordsList, characteristicChords);
    
    console.log('Called displayChordsFromScale, chords list innerHTML length:', chordsList.innerHTML.length);
    
    // Update audio controls with characteristic chord data
    if (window.audioControls && characteristicChords) {
        // Convert characteristic chords to a format the audio controls can use
        const audioChords = {
            triads: [],
            sevenths: [],
            characteristic: characteristicChords
        };
        
        // Extract chord names from characteristic chords structure
        if (characteristicChords.triads) {
            characteristicChords.triads.forEach(group => {
                if (group.chords) {
                    group.chords.forEach(chordName => {
                        audioChords.triads.push({ name: chordName });
                    });
                }
            });
        }
        
        if (characteristicChords.sevenths) {
            characteristicChords.sevenths.forEach(group => {
                if (group.chords) {
                    group.chords.forEach(chordName => {
                        audioChords.sevenths.push({ name: chordName });
                    });
                }
            });
        }
        
        window.audioControls.updateChords(audioChords);
    }
}

function displayChordsFromScale(container, characteristicChords) {
    console.log('displayChordsFromScale called with:', characteristicChords);
    
    // Create main chords section
    const chordsFromScaleSection = document.createElement('div');
    chordsFromScaleSection.className = 'chords-from-scale-section';
    chordsFromScaleSection.innerHTML = `
        <div class="section-header">
            <h3>Chords Formed FROM the Scale</h3>
            <p class="section-description">These chords are constructed using only notes from the scale</p>
        </div>
    `;
    
    const chordsContainer = document.createElement('div');
    chordsContainer.className = 'chord-types-container';
    
    // Check if we have the new structure with 'chords' array
    if (characteristicChords && characteristicChords.chords) {
        console.log('Using new chord structure with chords array');
        
        // Display each chord type section
        characteristicChords.chords.forEach(chordGroup => {
            const typeSection = document.createElement('div');
            typeSection.className = 'chord-type-section';
            
            const isEmphasized = chordGroup.emphasis ? ' emphasized' : '';
            
            typeSection.innerHTML = `
                <h4 class="chord-type-title${isEmphasized}">${chordGroup.type}</h4>
                <p class="chord-type-description">${chordGroup.description}</p>
                <div class="chord-type-chords">
                    ${chordGroup.chords.map(chord => `
                        <span class="characteristic-chord" title="${chordGroup.description}">${chord}</span>
                    `).join('')}
                </div>
            `;
            
            chordsContainer.appendChild(typeSection);
        });
    } else {
        console.log('Using legacy chord structure, calling organizeChordsByType');
        // Fallback to old structure
        const organizedChords = organizeChordsByType(characteristicChords);
        
        // Create sections for each chord type
        Object.entries(organizedChords).forEach(([chordType, chords]) => {
            const typeSection = document.createElement('div');
            typeSection.className = 'chord-type-section';
            
            typeSection.innerHTML = `
                <h4 class="chord-type-title">${chordType}</h4>
                <div class="chord-type-chords">
                    ${chords.map(chord => `
                        <span class="characteristic-chord" title="${chord.description || ''}">${chord.name}</span>
                    `).join('')}
                </div>
            `;
            
            chordsContainer.appendChild(typeSection);
        });
    }
    
    chordsFromScaleSection.appendChild(chordsContainer);
    container.appendChild(chordsFromScaleSection);
    
    console.log('displayChordsFromScale completed, container innerHTML length:', container.innerHTML.length);
}

function organizeChordsByType(characteristicChords) {
    const organized = {
        'Triads': [],
        'Seventh Chords': [],
        'Extended & Other': []
    };
    
    // Process triads
    if (characteristicChords.triads) {
        characteristicChords.triads.forEach(group => {
            if (group.chords) {
                group.chords.forEach(chord => {
                    organized['Triads'].push({
                        name: chord,
                        description: group.description
                    });
                });
            }
        });
    }
    
    // Process sevenths
    if (characteristicChords.sevenths) {
        characteristicChords.sevenths.forEach(group => {
            if (group.chords) {
                group.chords.forEach(chord => {
                    organized['Seventh Chords'].push({
                        name: chord,
                        description: group.description
                    });
                });
            }
        });
    }
    
    // Process extended/other chords
    if (characteristicChords.extended) {
        characteristicChords.extended.forEach(group => {
            if (group.chords) {
                group.chords.forEach(chord => {
                    organized['Extended & Other'].push({
                        name: chord,
                        description: group.description
                    });
                });
            }
        });
    }
    
    // Remove empty categories
    Object.keys(organized).forEach(key => {
        if (organized[key].length === 0) {
            delete organized[key];
        }
    });
    
    return organized;
}

function displayScaleApplications(container, scaleType) {
    console.log('displayScaleApplications called with scaleType:', scaleType);
    
    const applicationData = getScaleApplicationData(scaleType);
    console.log('Application data found:', applicationData);
    
    if (!applicationData) {
        console.log('No application data found for scale type:', scaleType);
        return;
    }
    
    const applicationsSection = document.createElement('div');
    applicationsSection.className = 'scale-applications-section';
    
    applicationsSection.innerHTML = `
        <div class="section-header">
            <h3>Scale Applications</h3>
            <p class="section-description">When and how to use this scale (chord context, not melody)</p>
        </div>
        <div class="applications-content">
            <div class="application-context">
                <h4>Works Over:</h4>
                <p>${applicationData.usedOver}</p>
            </div>
            <div class="application-example">
                <h4>Example:</h4>
                <div class="progression-example">
                    <span class="progression">${applicationData.exampleProgression}</span>
                    <span class="usage-note">${applicationData.specificChord}</span>
                </div>
            </div>
            <div class="application-context-note">
                <h4>Context:</h4>
                <p>${applicationData.context}</p>
            </div>
            <div class="application-styles">
                <h4>Common In:</h4>
                <p>${applicationData.commonIn}</p>
            </div>
        </div>
    `;
    
    console.log('Adding applications section to container');
    container.appendChild(applicationsSection);
}

function getScaleApplicationData(scaleType) {
    console.log('getScaleApplicationData called with:', scaleType);
    
    const applications = {
        'diminished': {
            usedOver: 'Dominant 7th chords (especially altered dominants), diminished chords',
            exampleProgression: 'Dm7 - G7alt - Cmaj7',
            specificChord: 'Works over the G7alt chord only',
            commonIn: 'Jazz improvisation, classical harmony, bebop',
            context: 'Use over specific dominant chords, not entire progressions'
        },
        'pentatonic-major': {
            usedOver: 'Major key progressions, major and minor chords within the key',
            exampleProgression: 'C - Am - F - G',
            specificChord: 'Works over the entire progression (all chords are in C major)',
            commonIn: 'Folk music, rock solos, country, Celtic music',
            context: 'Works over entire progressions in major keys'
        },
        'pentatonic-minor': {
            usedOver: 'Minor key progressions, blues progressions, minor and dominant chords',
            exampleProgression: 'Am - F - C - G',
            specificChord: 'Works over entire progression, especially strong over Am and C',
            commonIn: 'Blues, rock, jazz fusion, world music',
            context: 'Works over entire minor key progressions and blues changes'
        },
        'blues': {
            usedOver: '12-bar blues, dominant 7th chords, minor blues progressions',
            exampleProgression: 'C7 - F7 - C7 - G7',
            specificChord: 'Works over all dominant 7th chords in blues progressions',
            commonIn: 'Blues, jazz, rock, soul, R&B',
            context: 'Works over entire blues progressions and individual dominant chords'
        },
        'whole-tone': {
            usedOver: 'Augmented chords, dominant 7♯11 chords, impressionist harmony',
            exampleProgression: 'Cmaj7 - C7♯11 - Fmaj7',
            specificChord: 'Works over the C7♯11 chord only',
            commonIn: 'Impressionist classical, jazz ballads, film scoring',
            context: 'Use over specific altered chords, creates floating, ambiguous sound'
        }
    };
    
    // Handle scale type variations
    let scaleData = applications[scaleType];
    console.log('Direct lookup result:', scaleData);
    
    if (!scaleData) {
        console.log('Trying alternative scale type matching...');
        if (scaleType.includes('pentatonic')) {
            scaleData = scaleType.includes('minor') ? applications['pentatonic-minor'] : applications['pentatonic-major'];
            console.log('Pentatonic match found:', scaleData ? 'yes' : 'no');
        } else if (scaleType.includes('whole')) {
            scaleData = applications['whole-tone'];
            console.log('Whole tone match found:', scaleData ? 'yes' : 'no');
        } else if (scaleType.includes('blues')) {
            scaleData = applications['blues'];
            console.log('Blues match found:', scaleData ? 'yes' : 'no');
        } else if (scaleType.includes('diminished')) {
            scaleData = applications['diminished'];
            console.log('Diminished match found:', scaleData ? 'yes' : 'no');
        }
    }
    
    return scaleData;
}

function displayTraditionalChords(scale, scaleType) {
    const chordsList = document.getElementById('chords-list');
    const chordsSection = document.querySelector('.chords-section');
    
    // Update section title
    const sectionTitle = chordsSection.querySelector('h3');
    sectionTitle.textContent = 'Diatonic Chords';
    
    // Show traditional chord type buttons
    const chordControls = document.querySelector('.chord-controls');
    chordControls.style.display = 'block';
    
    // Calculate both triads and 7th chords
    const triads = MusicTheory.calculateTriads(scale, scaleType);
    const seventhChords = MusicTheory.calculateSeventhChords(scale, scaleType);
    
    // If no chords can be calculated, hide the section
    if (triads.length === 0 && seventhChords.length === 0) {
        chordsSection.style.display = 'none';
        return;
    }
    
    // Store chord data for switching between types
    chordsList.dataset.triads = JSON.stringify(triads);
    chordsList.dataset.seventhChords = JSON.stringify(seventhChords);
    
    // Display triads by default
    displayChordType('triads', triads);
    
    // Update audio controls with chord data
    if (window.audioControls) {
        window.audioControls.updateChords({
            triads: triads,
            sevenths: seventhChords
        });
    }
    
    // Add event listeners for chord type buttons
    const chordButtons = document.querySelectorAll('.chord-type-btn');
    chordButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Update active state
            chordButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            // Display the selected chord type
            const chordType = e.target.dataset.type;
            if (chordType === 'triads') {
                displayChordType('triads', triads);
                // Update audio controls with triads
                if (window.audioControls) {
                    window.audioControls.updateChords(triads);
                }
            } else if (chordType === 'sevenths') {
                displayChordType('sevenths', seventhChords);
                // Update audio controls with 7th chords
                if (window.audioControls) {
                    window.audioControls.updateChords(seventhChords);
                }
            }
        });
    });
}

function displayChordType(type, chords) {
    const chordsList = document.getElementById('chords-list');
    if (!chordsList || !chords) return;
    
    chordsList.innerHTML = '';
    
    // Add a note about exotic chords if any are present
    const hasNonStandardChords = chords.some(chord => chord.isNonStandard);
    if (hasNonStandardChords) {
        const noteElement = document.createElement('div');
        noteElement.className = 'chord-note';
        noteElement.innerHTML = `
            <p><strong>Note:</strong> This scale contains non-standard chord intervals. Some chords may have unusual qualities due to the unique interval structure of this scale.</p>
        `;
        chordsList.appendChild(noteElement);
    }
    
    chords.forEach((chord, index) => {
        const chordElement = document.createElement('div');
        chordElement.className = `chord-item ${chord.isNonStandard ? 'non-standard' : ''}`;
        
        const functionColor = MusicTheory.getChordColor(chord.function, chord.quality);
        
        // Add a tooltip for non-standard chords
        const tooltip = chord.isNonStandard ? 
            `title="Non-standard chord: ${chord.intervals.map(i => MusicTheory.getIntervalName(i)).join(', ')}"` : '';
        
        chordElement.innerHTML = `
            <div class="chord-degree" style="background-color: ${functionColor}">
                <span class="degree-number">${chord.degree}</span>
                <span class="roman-numeral">${chord.roman}</span>
            </div>
            <div class="chord-info" ${tooltip}>
                <div class="chord-name ${chord.isNonStandard ? 'exotic' : ''}">${chord.name}</div>
                <div class="chord-notes">${chord.notes.join(' - ')}</div>
                <div class="chord-quality ${chord.isNonStandard ? 'exotic' : ''}">${chord.quality}</div>
                <div class="chord-function">${chord.function}</div>
                ${chord.isNonStandard ? '<div class="chord-exotic-note">⚡ Exotic</div>' : ''}
            </div>
        `;
        
        // Add click handler for future chord playback or visualization
        chordElement.addEventListener('click', (e) => {
            // Only prevent modal if clicking directly on audio control buttons
            if (window.audioControls && (e.target.closest('.play-btn') || e.target.closest('.direction-btn'))) {
                return; // Let audio controls handle it
            }
            
            console.log('Chord clicked:', chord);
            highlightChordOnFretboard(chord);
        });
        
        chordsList.appendChild(chordElement);
    });
}

function highlightChordOnFretboard(chord) {
    // Get current key and open chord modal directly
    const currentKey = window.AppController ? window.AppController.getCurrentState().key : 'C';
    openChordModal(chord, currentKey);
}

// Chord Modal Functions
function openChordModal(chord, key) {
    const modal = document.getElementById('chord-modal');
    const modalTitle = document.getElementById('chord-modal-title');
    const chordInfoSection = document.querySelector('.chord-info');
    
    if (!modal || !modalTitle || !chordInfoSection) return;

    // Set modal title
    modalTitle.textContent = `${chord.symbol} Chord`;
    
    // Update chord information
    chordInfoSection.innerHTML = `
        <h3>${chord.symbol}</h3>
        <p><strong>Notes:</strong> ${chord.notes.join(', ')}</p>
        <p><em>Quality:</em> ${chord.quality}</p>
    `;
    
    // Clear and render chord fretboard
    renderChordFretboard(chord, key);
    
    // Show modal
    modal.classList.remove('hidden');
    modal.style.display = 'block';
    
    // Add escape key listener
    document.addEventListener('keydown', handleChordModalEscape);
}

function closeChordModal() {
    const modal = document.getElementById('chord-modal');
    modal.classList.add('hidden');
    
    // Remove escape key listener
    document.removeEventListener('keydown', handleChordModalEscape);
}

function handleChordModalEscape(e) {
    if (e.key === 'Escape') {
        closeChordModal();
    }
}

function renderChordFretboard(chord, key) {
    const container = document.getElementById('chord-fretboard-container');
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    // Create toggle controls (matching the main fretboard)
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'fretboard-toggle-container';
    toggleContainer.innerHTML = `
        <div class="fretboard-toggle-wrapper">
            <button class="fretboard-toggle-btn active" data-display="notes">Notes</button>
            <button class="fretboard-toggle-btn" data-display="intervals">Intervals</button>
        </div>
    `;
    container.appendChild(toggleContainer);

    // Create fretboard display container
    const displayContainer = document.createElement('div');
    displayContainer.className = 'fretboard-display-container';
    container.appendChild(displayContainer);

    // State for display mode
    let displayMode = 'notes';

    // Add toggle event listeners
    const toggleButtons = toggleContainer.querySelectorAll('.fretboard-toggle-btn');
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            displayMode = btn.dataset.display;
            renderFretboard();
        });
    });

    function renderFretboard() {
        // Match the exact dimensions of the main fretboard
        const fretCount = 12;
        const stringCount = 6;
        const fretWidth = 80;  // Match main fretboard
        const stringSpacing = 40; // Match main fretboard
        const svgWidth = (fretCount + 1) * fretWidth + 100;
        const svgHeight = (stringCount - 1) * stringSpacing + 100;

        // Create SVG with exact same structure as main fretboard
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'fretboard-svg');
        svg.setAttribute('width', svgWidth);
        svg.setAttribute('height', svgHeight);
        svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

        // Standard guitar tuning (low to high) - SAME ORDER AS MAIN FRETBOARD
        const stringNotes = ['E', 'A', 'D', 'G', 'B', 'E'];
        const stringMidiNotes = [40, 45, 50, 55, 59, 64]; // MIDI note numbers for open strings

        // Draw frets (vertical lines)
        for (let fret = 0; fret <= fretCount; fret++) {
            const x = 100 + (fret * fretWidth);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', 50);
            line.setAttribute('x2', x);
            line.setAttribute('y2', 50 + ((stringCount - 1) * stringSpacing));
            line.setAttribute('stroke', fret === 0 ? '#1f2937' : '#6b7280');
            line.setAttribute('stroke-width', fret === 0 ? '4' : '2');
            svg.appendChild(line);

            // Fret numbers (only for frets 1-12)
            if (fret > 0) {
                const fretNumber = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                fretNumber.setAttribute('x', 100 + ((fret - 0.5) * fretWidth));
                fretNumber.setAttribute('y', 40);
                fretNumber.setAttribute('text-anchor', 'middle');
                fretNumber.setAttribute('fill', '#374151');
                fretNumber.setAttribute('font-size', '18');
                fretNumber.setAttribute('font-weight', 'bold');
                fretNumber.textContent = fret;
                svg.appendChild(fretNumber);
            }
        }

        // Draw strings (horizontal lines) - CORRECT ORDER: E(high) to E(low)
        for (let string = 0; string < stringCount; string++) {
            const y = 50 + (string * stringSpacing);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', 100);
            line.setAttribute('y1', y);
            line.setAttribute('x2', 100 + (fretCount * fretWidth));
            line.setAttribute('y2', y);
            line.setAttribute('stroke', '#6b7280');
            line.setAttribute('stroke-width', '3');
            svg.appendChild(line);

            // String labels - REVERSE ORDER to match visual layout (high E at top)
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', 70);
            label.setAttribute('y', y + 6);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('fill', '#374151');
            label.setAttribute('font-size', '18');
            label.setAttribute('font-weight', 'bold');
            label.textContent = stringNotes[stringCount - 1 - string]; // Reverse order for display
            svg.appendChild(label);
        }

        // Draw fret markers (inlay dots)
        const markerFrets = [3, 5, 7, 9, 12];
        markerFrets.forEach(markerFret => {
            const x = 100 + ((markerFret - 0.5) * fretWidth);
            
            if (markerFret === 12) {
                // Double dots for 12th fret
                const marker1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker1.setAttribute('cx', x);
                marker1.setAttribute('cy', 90);
                marker1.setAttribute('r', '8');
                marker1.setAttribute('fill', '#d1d5db');
                svg.appendChild(marker1);
                
                const marker2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker2.setAttribute('cx', x);
                marker2.setAttribute('cy', 170);
                marker2.setAttribute('r', '8');
                marker2.setAttribute('fill', '#d1d5db');
                svg.appendChild(marker2);
            } else {
                // Single dot for other markers
                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker.setAttribute('cx', x);
                marker.setAttribute('cy', 130);
                marker.setAttribute('r', '8');
                marker.setAttribute('fill', '#d1d5db');
                svg.appendChild(marker);
            }
        });

        // Place chord notes on fretboard
        for (let string = 0; string < stringCount; string++) {
            // Use reverse string index for MIDI calculation (low E = 0, high E = 5)
            const midiStringIndex = stringCount - 1 - string;
            
            for (let fret = 0; fret <= fretCount; fret++) {
                const midiNote = stringMidiNotes[midiStringIndex] + fret;
                const chromaticIndex = midiNote % 12;
                const noteName = MusicConstants.chromaticScale[chromaticIndex];
                
                // Check if this note is in the chord
                let isChordNote = false;
                let chordNoteIndex = -1;
                
                for (let i = 0; i < chord.notes.length; i++) {
                    const chordNote = chord.notes[i];
                    
                    // Use enharmonic equivalence check if available
                    if (typeof MusicTheory !== 'undefined' && 
                        typeof MusicTheory.areEnharmonicEquivalents === 'function') {
                        if (MusicTheory.areEnharmonicEquivalents(noteName, chordNote)) {
                            isChordNote = true;
                            chordNoteIndex = i;
                            break;
                        }
                    } else {
                        // Fallback to direct comparison
                        if (noteName === chordNote) {
                            isChordNote = true;
                            chordNoteIndex = i;
                            break;
                        }
                    }
                }

                if (isChordNote) {
                    const chordNote = chord.notes[chordNoteIndex];
                    const rootNote = chord.notes[0]; // First note is the root
                    
                    // Check if this is the root note
                    const isRoot = (typeof MusicTheory !== 'undefined' && 
                        typeof MusicTheory.areEnharmonicEquivalents === 'function') ?
                        MusicTheory.areEnharmonicEquivalents(chordNote, rootNote) :
                        chordNote === rootNote;
                    
                    // Calculate interval using the same system as scales
                    let interval = '1'; // Default to root
                    let intervalColor = MusicTheory.getIntervalColor('1');
                    
                    if (isRoot) {
                        interval = '1';
                        intervalColor = MusicTheory.getIntervalColor('1');
                    } else {
                        // Use the same interval calculation as scales
                        const chordIntervals = MusicTheory.getIntervals(chord.notes, rootNote);
                        interval = chordIntervals[chordNoteIndex] || '1';
                        intervalColor = MusicTheory.getIntervalColor(interval);
                    }
                    
                    // Position notes - CORRECT positioning
                    const x = fret === 0 ? 40 : 100 + ((fret - 0.5) * fretWidth);
                    const y = 50 + (string * stringSpacing);
                    
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('cx', x);
                    circle.setAttribute('cy', y);
                    circle.setAttribute('r', '16');
                    circle.setAttribute('fill', intervalColor);
                    circle.setAttribute('stroke', 'white');
                    circle.setAttribute('stroke-width', '3');
                    svg.appendChild(circle);
                    
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', x);
                    text.setAttribute('y', y + 5);
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('fill', 'white');
                    text.setAttribute('font-size', '12');
                    text.setAttribute('font-weight', 'bold');
                    
                    if (displayMode === 'intervals') {
                        text.textContent = interval;
                    } else {
                        // Use the chord note name directly (it's already properly spelled)
                        text.textContent = chordNote;
                    }
                    
                    svg.appendChild(text);
                }
            }
        }

        // Clear and add the new SVG
        displayContainer.innerHTML = '';
        displayContainer.appendChild(svg);
    }

    // Initial render
    renderFretboard();
}

// Helper function to check enharmonic equivalents
function isEnharmonicEquivalent(note1, note2) {
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
        'B': ['B', 'Cb']
    };
    
    // Find which group each note belongs to
    for (const [key, equivalents] of Object.entries(enharmonicMap)) {
        if (equivalents.includes(note1) && equivalents.includes(note2)) {
            return true;
        }
    }
    
    return false;
}

// Export all functions
window.UIComponents = {
    createFretboard,
    openFretboardModal,
    renderModalFretboard,
    closeFretboardModal,
    openChordModal,
    closeChordModal,
    renderChordFretboard,
    setOptimalModalSize,
    handleMobileOrientation,
    makeDraggable,
    makeResizable,
    displayScale,
    displayNotes,
    displayIntervals,
    displayFormula,
    updateScaleColor,
    updateParentScale,
    updateModeName,
    createRelatedModes,
    initializeSearch
};

// Scale playback functionality
function toggleDirection(button) {
    const currentDirection = button.getAttribute('data-direction');
    let newDirection, newIcon, newTitle;
    
    switch (currentDirection) {
        case 'ascending':
            newDirection = 'descending';
            newIcon = '←';
            newTitle = 'Descending';
            break;
        case 'descending':
            newDirection = 'both';
            newIcon = '↔';
            newTitle = 'Both (Ascending & Descending)';
            break;
        case 'both':
            newDirection = 'ascending';
            newIcon = '→';
            newTitle = 'Ascending';
            break;
    }
    
    button.setAttribute('data-direction', newDirection);
    button.innerHTML = newIcon;
    button.setAttribute('title', newTitle);
}

async function playScale(data, section) {
    console.log('Playing scale:', data, 'section:', section);
    
    // Get current scale info from AppController
    const currentState = AppController.getCurrentState();
    const { key } = currentState;
    
    // Always use the notes data for playback
    let notes = data;
    
    if (!notes || notes.length === 0) {
        console.error('No notes to play');
        return;
    }
    
    // Get direction from the button in the notes section
    const notesContainer = document.querySelector('.notes');
    const directionButton = notesContainer.querySelector('.direction-btn');
    const direction = directionButton.getAttribute('data-direction');
    
    console.log('Playing direction:', direction);
    
    // Add octave note for playback (but don't show it yet)
    const octaveNote = notes[0]; // Root note an octave higher
    
    try {
        // Initialize audio engine if needed
        if (!window.AudioEngine.isInitialized) {
            await window.AudioEngine.initialize();
        }
        
        // Play the scale based on direction
        switch (direction) {
            case 'ascending':
                await playScaleSequence([...notes, octaveNote], true, section);
                break;
            case 'descending':
                await playScaleSequence([...notes, octaveNote], false, section);
                break;
            case 'both':
                await playScaleSequence([...notes, octaveNote], true, section);
                await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause
                await playScaleSequence([...notes, octaveNote], false, section);
                break;
        }
        
    } catch (error) {
        console.error('Error playing scale:', error);
    }
}

async function playScaleSequence(notes, ascending, section) {
    const playOrder = ascending ? notes : [...notes].reverse();
    const noteDuration = 0.6; // Duration for each note
    let octaveElement = null;
    
    // Calculate proper octaves for smooth scale progression
    const notesWithOctaves = calculateScaleOctaves(playOrder, ascending);
    
    for (let i = 0; i < playOrder.length; i++) {
        const note = playOrder[i];
        const isOctave = i === (ascending ? playOrder.length - 1 : 0);
        
        // Use the calculated octave for proper pitch progression
        const noteWithOctave = notesWithOctaves[i];
        
        // Show octave visual at the same time as highlighting (no delay)
        if (isOctave && !octaveElement) {
            octaveElement = await addOctaveVisual(notes.slice(0, -1), note, section);
        }
        
        // Highlight the current note
        highlightCurrentNote(note, isOctave);
        
        // Play the note
        await window.AudioEngine.playNote(noteWithOctave, noteDuration * 0.8);
        
        // Wait before next note
        if (i < playOrder.length - 1) {
            await new Promise(resolve => setTimeout(resolve, noteDuration * 1000 * 0.7));
        }
        
        // Remove highlight
        removeNoteHighlight();
    }
    
    // Remove octave visual after playback
    if (octaveElement) {
        setTimeout(() => removeOctaveVisual(section), 500);
    }
}

// Helper function to calculate proper octaves for smooth scale progression
function calculateScaleOctaves(notes, ascending) {
    if (!notes || notes.length === 0) return [];
    
    // Note to semitone mapping for octave calculation
    const noteToSemitone = {
        'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
        'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
        'A#': 10, 'Bb': 10, 'B': 11, 'B#': 0, 'Cb': 11, 'E#': 5, 'Fb': 4
    };
    
    const result = [];
    let currentOctave = 4; // Start in 4th octave
    let lastSemitone = -1;
    
    for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        const semitone = noteToSemitone[note] !== undefined ? noteToSemitone[note] : 0;
        
        if (i === 0) {
            // First note - always start in 4th octave
            result.push(`${note}${currentOctave}`);
            lastSemitone = semitone;
        } else {
            // Check if we need to go to next octave
            if (ascending) {
                // For ascending: if current note is lower than previous, we've wrapped around
                if (semitone < lastSemitone) {
                    currentOctave++;
                }
            } else {
                // For descending: if current note is higher than previous, we've wrapped around
                if (semitone > lastSemitone) {
                    currentOctave--;
                }
            }
            
            result.push(`${note}${currentOctave}`);
            lastSemitone = semitone;
        }
    }
    
    return result;
}

function addOctaveVisual(notes, octaveNote, section) {
    return new Promise(resolve => {
        const notesContainer = document.querySelector('.notes-display');
        const intervalsContainer = document.querySelector('.intervals-display');
    
        if (!notesContainer || !intervalsContainer) {
            resolve(null);
            return;
        }
        
        // Add octave to notes section (no separator) - with root note styling
        const octaveNoteElement = document.createElement('span');
        octaveNoteElement.className = 'note octave-note root-note'; // Add root-note class for same styling
        octaveNoteElement.textContent = octaveNote;
        octaveNoteElement.setAttribute('data-note', octaveNote);
        notesContainer.appendChild(octaveNoteElement);
        
        // Add octave to intervals section (no separator) - with same color as root
        const octaveIntervalElement = document.createElement('span');
        octaveIntervalElement.className = 'interval octave-interval';
        octaveIntervalElement.textContent = '8'; // Octave interval
        octaveIntervalElement.setAttribute('data-interval', '8');
        // Apply the same color as the "1" interval (unison)
        octaveIntervalElement.style.background = MusicTheory.getIntervalColor('1') || '#E8B4B8';
        octaveIntervalElement.style.color = 'white';
        octaveIntervalElement.style.fontWeight = '600';
        intervalsContainer.appendChild(octaveIntervalElement);
        
        // Animate both elements in immediately
        [octaveNoteElement, octaveIntervalElement].forEach(element => {
            element.style.opacity = '1';
            element.style.transform = 'scale(1)';
        });
        
        resolve({ noteElement: octaveNoteElement, intervalElement: octaveIntervalElement });
    });
}

function removeOctaveVisual(section) {
    // Remove octave elements from both sections (no separators to remove)
    const octaveElements = document.querySelectorAll('.octave-note, .octave-interval');
    
    octaveElements.forEach(element => {
        element.style.transition = 'all 0.3s ease';
        element.style.opacity = '0';
        element.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 300);
    });
}

function highlightCurrentNote(note, isOctave) {
    // Remove any existing highlights
    removeNoteHighlight();
    
    // Find and highlight the note
    const noteElements = document.querySelectorAll('.note');
    noteElements.forEach(element => {
        if (element.getAttribute('data-note') === note) {
            element.classList.add('playing-highlight');
        }
    });
    
    // Find and highlight the corresponding interval
    const intervalElements = document.querySelectorAll('.interval');
    const noteIndex = getCurrentNoteIndex(note, isOctave);
    
    if (noteIndex !== -1 && intervalElements[noteIndex]) {
        intervalElements[noteIndex].classList.add('playing-highlight');
    }
}

function removeNoteHighlight() {
    // Remove highlights from both notes and intervals
    const highlightedElements = document.querySelectorAll('.playing-highlight');
    highlightedElements.forEach(element => {
        element.classList.remove('playing-highlight');
    });
}

function getCurrentNoteIndex(note, isOctave) {
    // Get current scale notes to find the index
    const notesDisplay = document.querySelector('.notes-display');
    if (!notesDisplay) return -1;
    
    const noteElements = notesDisplay.querySelectorAll('.note');
    for (let i = 0; i < noteElements.length; i++) {
        if (noteElements[i].getAttribute('data-note') === note) {
            return isOctave ? 0 : i; // Octave maps to root interval (index 0)
        }
    }
    
    return -1;
}