// UI Components Module
// Depends on: constants.js, music-theory.js

// Debug: Check if dependencies are loaded
console.log('UIComponents loading, MusicTheory available:', typeof window.MusicTheory);
console.log('MusicConstants available:', typeof window.MusicConstants);

// Main fretboard state
let fretboardState = {
    startFret: 0,
    fretRange: 12, // 12 or 24
    maxFrets: 24
};

// Modal fretboard state (separate from main fretboard)
let modalFretboardState = {
    startFret: 0,
    fretRange: 12, // Default to 12 for modal (changed from 15)
    maxFrets: 24
};

// Helper function to convert note names to chromatic indices (handles both sharps and flats)
function noteToIndex(note) {
    const noteMap = {
        'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
        'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
        'A#': 10, 'Bb': 10, 'B': 11
    };
    return noteMap[note] !== undefined ? noteMap[note] : -1;
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
        <div class="fret-navigation">
            <button id="fret-left" class="nav-btn" ${fretboardState.startFret === 0 ? 'disabled' : ''}>←</button>
            <span class="fret-range">Frets ${fretboardState.startFret}-${fretboardState.startFret + fretboardState.fretRange}</span>
            <button id="fret-right" class="nav-btn" ${fretboardState.startFret + fretboardState.fretRange >= fretboardState.maxFrets ? 'disabled' : ''}>→</button>
        </div>
        <div class="fret-range-selector">
            <label>View: </label>
            <select id="fret-range-select">
                <option value="12" ${fretboardState.fretRange === 12 ? 'selected' : ''}>12 Frets</option>
                <option value="24" ${fretboardState.fretRange === 24 ? 'selected' : ''}>24 Frets</option>
            </select>
        </div>
    `;
    fretboardContainer.appendChild(controlsDiv);
    
    // Add event listeners for controls
    document.getElementById('fret-left').addEventListener('click', () => {
        if (fretboardState.startFret > 0) {
            fretboardState.startFret = Math.max(0, fretboardState.startFret - 6);
            createFretboard(scale);
        }
    });
    
    document.getElementById('fret-right').addEventListener('click', () => {
        if (fretboardState.startFret + fretboardState.fretRange < fretboardState.maxFrets) {
            fretboardState.startFret = Math.min(fretboardState.maxFrets - fretboardState.fretRange, fretboardState.startFret + 6);
            createFretboard(scale);
        }
    });
    
    document.getElementById('fret-range-select').addEventListener('change', (e) => {
        fretboardState.fretRange = parseInt(e.target.value);
        fretboardState.startFret = 0; // Reset to beginning when changing range
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
        line.setAttribute('y1', 40);
        line.setAttribute('x2', x);
        line.setAttribute('y2', 240);
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
                    text.textContent = displayNote;
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
        case 'major': return 'major';
        case 'harmonic-minor': return 'harmonic-minor';
        case 'melodic-minor': return 'melodic-minor';
        case 'pentatonic': return 'pentatonic';
        case 'other': return 'other';
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
    
    // Clear existing content and add controls
    fretboardDiv.innerHTML = '';
    
    // Create modal fretboard controls
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'modal-fretboard-controls';
    controlsDiv.innerHTML = `
        <div class="modal-fret-navigation">
            <button id="modal-fret-left" class="modal-nav-btn" ${modalFretboardState.startFret === 0 ? 'disabled' : ''}>←</button>
            <span class="modal-fret-range">Frets ${modalFretboardState.startFret}-${modalFretboardState.startFret + modalFretboardState.fretRange}</span>
            <button id="modal-fret-right" class="modal-nav-btn" ${modalFretboardState.startFret + modalFretboardState.fretRange >= modalFretboardState.maxFrets ? 'disabled' : ''}>→</button>
        </div>
        <div class="modal-fret-range-selector">
            <label>View: </label>
            <select id="modal-fret-range-select">
                <option value="12" ${modalFretboardState.fretRange === 12 ? 'selected' : ''}>12 Frets</option>
                <option value="15" ${modalFretboardState.fretRange === 15 ? 'selected' : ''}>15 Frets</option>
                <option value="24" ${modalFretboardState.fretRange === 24 ? 'selected' : ''}>24 Frets</option>
            </select>
        </div>
        <div class="modal-display-toggle">
            <button id="toggle-display" class="toggle-btn">Show Intervals</button>
        </div>
    `;
    fretboardDiv.appendChild(controlsDiv);
    
    console.log('✅ Controls added to modal');
    
    // Add event listeners for modal controls
    document.getElementById('modal-fret-left').addEventListener('click', () => {
        if (modalFretboardState.startFret > 0) {
            modalFretboardState.startFret = Math.max(0, modalFretboardState.startFret - 6);
            renderModalFretboard(fretboardDiv, scale, false);
        }
    });
    
    document.getElementById('modal-fret-right').addEventListener('click', () => {
        if (modalFretboardState.startFret + modalFretboardState.fretRange < modalFretboardState.maxFrets) {
            modalFretboardState.startFret = Math.min(modalFretboardState.maxFrets - modalFretboardState.fretRange, modalFretboardState.startFret + 6);
            renderModalFretboard(fretboardDiv, scale, false);
        }
    });
    
    document.getElementById('modal-fret-range-select').addEventListener('change', (e) => {
        modalFretboardState.fretRange = parseInt(e.target.value);
        modalFretboardState.startFret = 0; // Reset to beginning when changing range
        renderModalFretboard(fretboardDiv, scale, false);
    });
    
    // Add toggle functionality AFTER controls are created
    const toggleBtn = document.getElementById('toggle-display');
    let showingIntervals = false;
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            showingIntervals = !showingIntervals;
            toggleBtn.textContent = showingIntervals ? 'Show Notes' : 'Show Intervals';
            renderModalFretboard(fretboardDiv, scale, showingIntervals);
        });
        console.log('✅ Toggle functionality added');
    } else {
        console.error('❌ Toggle button not found');
    }
    
    console.log('✅ Event listeners added');
    
    // Render the fretboard
    console.log('Rendering modal fretboard...');
    renderModalFretboard(fretboardDiv, scale, false);
    
    console.log('Modal should now be visible. Final check:');
    console.log('Modal display:', modal.style.display);
    console.log('Modal visibility:', getComputedStyle(modal).visibility);
    console.log('Modal z-index:', getComputedStyle(modal).zIndex);
    
    // Set optimal size and make draggable
    try {
        setOptimalModalSize();
        handleMobileOrientation();
        makeDraggable(modal);
        makeResizable(modal);
        console.log('✅ Modal utilities applied');
    } catch (error) {
        console.error('Error applying modal utilities:', error);
    }
    
    console.log('===== MODAL OPENING COMPLETE =====');
}

function renderModalFretboard(container, scale, showIntervals = false) {
    // Find the fretboard container (skip the controls)
    let fretboardContainer = container.querySelector('.modal-fretboard-svg-container');
    if (!fretboardContainer) {
        fretboardContainer = document.createElement('div');
        fretboardContainer.className = 'modal-fretboard-svg-container';
        container.appendChild(fretboardContainer);
    }
    fretboardContainer.innerHTML = '';
    
    // Update controls
    const leftBtn = document.getElementById('modal-fret-left');
    const rightBtn = document.getElementById('modal-fret-right');
    const rangeSpan = container.querySelector('.modal-fret-range');
    const rangeSelect = document.getElementById('modal-fret-range-select');
    
    if (leftBtn) leftBtn.disabled = modalFretboardState.startFret === 0;
    if (rightBtn) rightBtn.disabled = modalFretboardState.startFret + modalFretboardState.fretRange >= modalFretboardState.maxFrets;
    if (rangeSpan) rangeSpan.textContent = `Frets ${modalFretboardState.startFret}-${modalFretboardState.startFret + modalFretboardState.fretRange}`;
    if (rangeSelect) rangeSelect.value = modalFretboardState.fretRange;
    
    // Calculate display range
    const displayFrets = modalFretboardState.fretRange;
    const endFret = modalFretboardState.startFret + displayFrets;
    
    // Fixed string order: high E on top (string 0) to low E on bottom (string 5)
    const stringNotes = ['E', 'B', 'G', 'D', 'A', 'E'];
    
    // Create larger SVG for modal
    const fretWidth = displayFrets <= 12 ? 60 : displayFrets <= 15 ? 50 : 40;
    const svgWidth = 100 + (displayFrets * fretWidth);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgWidth} 400`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '400');
    svg.style.background = '#1a1a1a';
    
    // Draw fret lines
    for (let fret = 0; fret <= displayFrets; fret++) {
        const actualFret = modalFretboardState.startFret + fret;
        const x = 60 + (fret * fretWidth);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x);
        line.setAttribute('y1', 40);
        line.setAttribute('x2', x);
        line.setAttribute('y2', 360);
        line.setAttribute('stroke', actualFret === 0 ? '#fff' : '#555');
        line.setAttribute('stroke-width', actualFret === 0 ? '6' : '2');
        svg.appendChild(line);
        
        // Fret numbers
        if (fret > 0) {
            const fretNumber = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            fretNumber.setAttribute('x', 60 + ((fret - 0.5) * fretWidth));
            fretNumber.setAttribute('y', 30);
            fretNumber.setAttribute('text-anchor', 'middle');
            fretNumber.setAttribute('fill', '#999');
            fretNumber.setAttribute('font-size', displayFrets <= 12 ? '14' : displayFrets <= 15 ? '12' : '10');
            fretNumber.setAttribute('font-weight', 'bold');
            fretNumber.textContent = actualFret;
            svg.appendChild(fretNumber);
        }
    }
    
    // Draw strings
    for (let string = 0; string < 6; string++) {
        const y = 70 + (string * 50);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', 60);
        line.setAttribute('y1', y);
        line.setAttribute('x2', 60 + (displayFrets * fretWidth));
        line.setAttribute('y2', y);
        line.setAttribute('stroke', '#777');
        line.setAttribute('stroke-width', '3');
        svg.appendChild(line);
        
        // String labels
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', 30);
        label.setAttribute('y', y + 5);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('fill', 'white');
        label.setAttribute('font-size', '16');
        label.setAttribute('font-weight', 'bold');
        label.textContent = stringNotes[string];
        svg.appendChild(label);
    }
    
    // Draw fret markers for standard positions
    const markerFrets = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
    markerFrets.forEach(markerFret => {
        if (markerFret > modalFretboardState.startFret && markerFret <= endFret) {
            const fretPosition = markerFret - modalFretboardState.startFret;
            const x = 60 + ((fretPosition - 0.5) * fretWidth);
            
            if (markerFret === 12 || markerFret === 24) {
                // Double dots for octaves
                const marker1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker1.setAttribute('cx', x);
                marker1.setAttribute('cy', 145);
                marker1.setAttribute('r', '8');
                marker1.setAttribute('fill', '#666');
                svg.appendChild(marker1);
                
                const marker2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker2.setAttribute('cx', x);
                marker2.setAttribute('cy', 245);
                marker2.setAttribute('r', '8');
                marker2.setAttribute('fill', '#666');
                svg.appendChild(marker2);
            } else {
                // Single dot for other markers
                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker.setAttribute('cx', x);
                marker.setAttribute('cy', 195);
                marker.setAttribute('r', '8');
                marker.setAttribute('fill', '#666');
                svg.appendChild(marker);
            }
        }
    });
    
    // Place notes/intervals on fretboard
    if (scale && scale.length > 0) {
        const scaleRoot = scale[0];
        const intervals = MusicTheory.getIntervals(scale, scaleRoot);
        
        for (let string = 0; string < 6; string++) {
            const openNote = stringNotes[string];
            const openNoteIndex = noteToIndex(openNote);
            
            for (let fret = 0; fret <= displayFrets; fret++) {
                const actualFret = modalFretboardState.startFret + fret;
                const noteIndex = (openNoteIndex + actualFret) % 12;
                const chromaticNoteName = MusicConstants.chromaticScale[noteIndex];
                
                // Check if this note is in the scale using proper spelling
                let displayNote = null;
                let scaleIndex = -1;
                for (let i = 0; i < scale.length; i++) {
                    if (MusicTheory && typeof MusicTheory.areEnharmonicEquivalents === 'function') {
                        if (MusicTheory.areEnharmonicEquivalents(chromaticNoteName, scale[i])) {
                            displayNote = scale[i]; // Use the properly spelled scale note
                            scaleIndex = i;
                            break;
                        }
                    } else {
                        // Fallback to direct comparison if function not available
                        if (chromaticNoteName === scale[i]) {
                            displayNote = scale[i];
                            scaleIndex = i;
                            break;
                        }
                    }
                }
                
                if (displayNote && scaleIndex !== -1) {
                    // Improved positioning: move fret 0 notes further to the left
                    const x = fret === 0 ? 35 : 60 + ((fret - 0.5) * fretWidth);
                    const y = 70 + (string * 50);
                    
                    const interval = intervals[scaleIndex] || '1';
                    const color = MusicTheory.getIntervalColor(interval);
                    
                    // Note circle
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('cx', x);
                    circle.setAttribute('cy', y);
                    circle.setAttribute('r', '18');
                    circle.setAttribute('fill', color);
                    circle.setAttribute('stroke', 'white');
                    circle.setAttribute('stroke-width', '2');
                    svg.appendChild(circle);
                    
                    // Improved text visibility with white text
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', x);
                    text.setAttribute('y', y + 5);
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('fill', 'white');
                    text.setAttribute('font-size', '12');
                    text.setAttribute('font-weight', 'bold');
                    text.textContent = showIntervals ? interval : displayNote;
                    svg.appendChild(text);
                }
            }
        }
    }
    
    fretboardContainer.appendChild(svg);
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
    
    notes.forEach((note, index) => {
        const noteElement = document.createElement('span');
        noteElement.className = 'note';
        noteElement.textContent = note;
        
        if (index === 0) {
            noteElement.classList.add('root-note');
        }
        
        notesContainer.appendChild(noteElement);
        
        if (index < notes.length - 1) {
            notesContainer.appendChild(document.createTextNode(' - '));
        }
    });
}

function displayIntervals(intervals) {
    const intervalsContainer = document.querySelector('.intervals');
    if (!intervalsContainer) return;
    
    intervalsContainer.innerHTML = '';
    
    intervals.forEach((interval, index) => {
        const intervalElement = document.createElement('span');
        intervalElement.className = 'interval';
        intervalElement.textContent = interval;
        intervalElement.style.backgroundColor = MusicTheory.getIntervalColor(interval);
        
        // Add consistent colors for enharmonic equivalents
        if (interval === '#5' || interval === 'b6') {
            intervalElement.style.backgroundColor = MusicConstants.intervalColors['b6'] || '#8E44AD';
        } else if (interval === '#6' || interval === 'b7') {
            intervalElement.style.backgroundColor = MusicConstants.intervalColors['b7'] || '#7D3C98';
        }
        
        intervalsContainer.appendChild(intervalElement);
        
        if (index < intervals.length - 1) {
            intervalsContainer.appendChild(document.createTextNode(' - '));
        }
    });
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
        // Melodic minor modes
        'melodic-minor': 0, 'dorian-b2': 2, 'lydian-augmented': 3, 'lydian-dominant': 5,
        'mixolydian-b6': 7, 'locrian-natural-2': 9, 'super-locrian': 11,
        // Pentatonic modes
        'major-pentatonic': 0, 'minor-pentatonic': 3, 'egyptian': 5, 'blues-major': 7, 'blues-minor': 10
    };
    
    const currentModeOffset = modeOffsets[currentMode] || 0;
    const parentRootIndex = (noteToIndex(currentKey) - currentModeOffset + 12) % 12;
    
    // Use proper note spelling for the parent root based on the current key's spelling convention
    const scaleType = getScaleTypeFromCategory(category);
    const parentRoot = MusicTheory.getProperNoteSpelling(parentRootIndex, currentKey, scaleType);
    
    // Calculate the actual parent scale notes
    const parentFormula = categoryData.formulas[categoryData.modes[0]]; // Get the first mode's formula (the parent scale)
    const parentScaleNotes = MusicTheory.calculateScale(parentRoot, parentFormula, scaleType);
    
    // Create mode buttons for each mode in the category
    categoryData.modes.forEach((mode, index) => {
        const modeData = MusicConstants.modeNumbers[mode];
        if (!modeData) return;
        
        // Use the actual scale note for this mode (not chromatic)
        const modeKey = parentScaleNotes[index] || parentRoot;
        
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
    const parentScaleName = getParentScaleName(category, parentRoot);
    parentScaleInfo.innerHTML = `
        <strong>Parent Scale:</strong> ${parentScaleName}
        <br><small>All modes derive from the same parent scale, starting on different degrees</small>
    `;
}

function getParentScaleName(category, parentRoot) {
    const categoryData = MusicConstants.scaleCategories[category];
    if (!categoryData) return `${parentRoot} Scale`;
    
    switch (category) {
        case 'major':
            return `${parentRoot} Major`;
        case 'harmonic-minor':
            return `${parentRoot} Harmonic Minor`;
        case 'melodic-minor':
            return `${parentRoot} Melodic Minor`;
        case 'pentatonic':
            return `${parentRoot} Pentatonic`;
        default:
            return `${parentRoot} ${categoryData.name}`;
    }
}

// Export all functions
window.UIComponents = {
    createFretboard,
    openFretboardModal,
    renderModalFretboard,
    closeFretboardModal,
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
    createRelatedModes
};