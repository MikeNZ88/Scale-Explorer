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
    showIntervals: false, // Add toggle state
    compareMode: false,
    comparisonScale: null,
    comparisonSelection: null
};

// Modal fretboard state (separate from main fretboard)
let modalFretboardState = {
    startFret: 0,
    fretRange: 12, // Default to 12 for modal (changed from 15)
    maxFrets: 24
};

// Helper function to convert note names to chromatic indices (handles both sharps and flats)
function noteToIndex(note) {
    const noteMapping = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
            'A#': 10, 'Bb': 10, 'B': 11,
        // Add double accidentals
        'C##': 2, 'D##': 4, 'F##': 7, 'G##': 9, 'A##': 11,
        'Dbb': 0, 'Ebb': 2, 'Gbb': 5, 'Abb': 7, 'Bbb': 9,
        // Add enharmonic equivalents for edge cases
        'B#': 0, 'E#': 5, 'Fb': 4, 'Cb': 11
    };
    return noteMapping[note] !== undefined ? noteMapping[note] : 0;
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
        <div class="compare-toggle">
            <button id="compare-scales" class="toggle-btn ${fretboardState.compareMode ? 'active' : ''}">${fretboardState.compareMode ? 'Exit Compare' : 'Compare Scales'}</button>
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
        
        // Show/hide interval info in comparison mode
        const intervalInfo = document.getElementById('interval-info');
        if (intervalInfo) {
            intervalInfo.style.display = fretboardState.showIntervals ? 'block' : 'none';
        }
        
        createFretboard(scale);
    });
    
    // Add compare functionality
    document.getElementById('compare-scales').addEventListener('click', () => {
        if (fretboardState.compareMode) {
            exitCompareMode();
        } else {
            enterCompareMode();
        }
    });
    
    // Show comparison selector if in compare mode
    if (fretboardState.compareMode) {
        showComparisonSelector(controlsDiv);
    }
    
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
    svg.style.background = '#2d3748';
    svg.style.border = '2px solid #4a5568';
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
        line.setAttribute('stroke', actualFret === 0 ? '#e2e8f0' : '#718096');
        line.setAttribute('stroke-width', actualFret === 0 ? '4' : '2');
        svg.appendChild(line);
        
        // Fret numbers - make them clearly visible
        if (fret > 0) {
            const fretNumber = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            fretNumber.setAttribute('x', 80 + ((fret - 0.5) * fretWidth));
            fretNumber.setAttribute('y', 25);
            fretNumber.setAttribute('text-anchor', 'middle');
            fretNumber.setAttribute('fill', '#e2e8f0');
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
        line.setAttribute('stroke', '#a0aec0');
        line.setAttribute('stroke-width', '2');
        svg.appendChild(line);
        
        // String labels
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', 60);
        label.setAttribute('y', y + 5);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('fill', '#f7fafc');
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
        if (fretboardState.compareMode && fretboardState.comparisonScale) {
            renderComparisonFretboard(svg, scale, fretboardState.comparisonScale, displayFrets, fretWidth);
                    } else {
            renderSingleScale(svg, scale, displayFrets, fretWidth);
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
        case 'melodic-minor-modes': return 'melodic-minor';
        case 'diminished-modes': return 'diminished';
        case 'pentatonic-modes': return 'major-pentatonic';
        case 'blues-modes': return 'blues';
        case 'blues-scales': return 'blues';
        case 'barry-harris': return 'major-6th-diminished';
        case 'whole-tone': return 'whole-tone';
        case 'chromatic': return 'chromatic';
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
    
    // Create optimized SVG for modal with better space usage
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const fretWidth = displayFrets <= 12 ? 90 : 70; // Increased fret width for better visibility
    const stringSpacing = 45; // Increased string spacing
    const leftMargin = 80; // Reduced left margin
    const topMargin = 50; // Reduced top margin
    const svgWidth = leftMargin + (displayFrets * fretWidth) + 20;
    const svgHeight = topMargin + ((stringNotes.length - 1) * stringSpacing) + 60;
    
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.background = '#2d3748';
    svg.style.border = '2px solid #4a5568';
    svg.style.borderRadius = '12px';
    
    // Draw fret lines
    for (let fret = 0; fret <= displayFrets; fret++) {
        const actualFret = fretboardState.startFret + fret;
        const x = leftMargin + (fret * fretWidth);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x);
        line.setAttribute('y1', topMargin); // Start just above the strings
        line.setAttribute('x2', x);
        line.setAttribute('y2', topMargin + ((stringNotes.length - 1) * stringSpacing)); // End just below the strings
        line.setAttribute('stroke', actualFret === 0 ? '#e2e8f0' : '#718096');
        line.setAttribute('stroke-width', actualFret === 0 ? '5' : '3');
        svg.appendChild(line);
        
        // Fret numbers
        if (fret > 0) {
            const fretNumber = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            fretNumber.setAttribute('x', leftMargin + ((fret - 0.5) * fretWidth));
            fretNumber.setAttribute('y', topMargin - 15);
            fretNumber.setAttribute('text-anchor', 'middle');
            fretNumber.setAttribute('fill', '#e2e8f0');
            fretNumber.setAttribute('font-size', '20');
            fretNumber.setAttribute('font-weight', 'bold');
            fretNumber.textContent = actualFret;
            svg.appendChild(fretNumber);
        }
    }
    
    // Draw strings
    for (let string = 0; string < stringNotes.length; string++) {
        const y = topMargin + (string * stringSpacing);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', leftMargin);
        line.setAttribute('y1', y);
        line.setAttribute('x2', leftMargin + (displayFrets * fretWidth));
        line.setAttribute('y2', y);
        line.setAttribute('stroke', '#6b7280');
        line.setAttribute('stroke-width', '3');
        svg.appendChild(line);
        
        // String labels
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', leftMargin - 25);
        label.setAttribute('y', y + 6);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('fill', '#f7fafc');
        label.setAttribute('font-size', '20');
        label.setAttribute('font-weight', 'bold');
        label.textContent = stringNotes[string];
        svg.appendChild(label);
    }
    
    // Draw fret markers
    const markerFrets = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
    markerFrets.forEach(markerFret => {
        if (markerFret > fretboardState.startFret && markerFret <= endFret) {
            const fretPosition = markerFret - fretboardState.startFret;
            const x = leftMargin + ((fretPosition - 0.5) * fretWidth);
            const centerY = topMargin + (((stringNotes.length - 1) * stringSpacing) / 2);
            
            if (markerFret === 12 || markerFret === 24) {
                // Double dots for octaves
                const marker1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker1.setAttribute('cx', x);
                marker1.setAttribute('cy', centerY - stringSpacing * 0.8);
                marker1.setAttribute('r', '10');
                marker1.setAttribute('fill', '#d1d5db');
                svg.appendChild(marker1);
                
                const marker2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker2.setAttribute('cx', x);
                marker2.setAttribute('cy', centerY + stringSpacing * 0.8);
                marker2.setAttribute('r', '10');
                marker2.setAttribute('fill', '#d1d5db');
                svg.appendChild(marker2);
            } else {
                // Single dot for other markers
                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker.setAttribute('cx', x);
                marker.setAttribute('cy', centerY);
                marker.setAttribute('r', '10');
                marker.setAttribute('fill', '#d1d5db');
                svg.appendChild(marker);
            }
        }
    });
    
    // Place notes on fretboard
    if (scale && scale.length > 0) {
        for (let string = 0; string < stringNotes.length; string++) {
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
                    // Position notes - optimized for better visibility
                    const x = fret === 0 ? leftMargin - 30 : leftMargin + ((fret - 0.5) * fretWidth);
                    const y = topMargin + (string * stringSpacing);
                    
                    // Get interval and color
                    const scaleIndex = scale.indexOf(displayNote);
                    const interval = MusicTheory.getIntervals(scale, scale[0])[scaleIndex] || '1';
                    const color = window.colorsVisible ? 
                        MusicTheory.getIntervalColor(interval) : '#d97706';
                    
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('cx', x);
                    circle.setAttribute('cy', y);
                    circle.setAttribute('r', '18'); // Larger circles for better visibility
                    circle.setAttribute('fill', color);
                    
                    // Determine stroke color based on interval
                    let strokeColor = 'white'; // Default
                    if (fretboardState.showIntervals) {
                        let intervalText = '';
                        if (isInScale1 && scale1Index >= 0) {
                            const scale1Root = scale1[0];
                            const intervals1 = MusicTheory.getIntervals(scale1, scale1Root);
                            intervalText = intervals1[scale1Index] || '1';
                        } else if (isInScale2 && scale2Index >= 0) {
                            const scale2Root = scale2[0];
                            const intervals2 = MusicTheory.getIntervals(scale2, scale2Root);
                            intervalText = intervals2[scale2Index] || '1';
                        }
                        if (intervalText === '1') {
                            strokeColor = 'black';
                        }
                    }
                    
                    circle.setAttribute('stroke', strokeColor);
                    circle.setAttribute('stroke-width', '2');
                    svg.appendChild(circle);
                    
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', x);
                    text.setAttribute('y', y + 6);
                    text.setAttribute('text-anchor', 'middle');
                    // Use black text for root note (1), white for others
                    text.setAttribute('fill', interval === '1' ? 'black' : 'white');
                    text.setAttribute('font-size', '14'); // Larger font for better readability
                    text.setAttribute('font-weight', 'bold');
                    // Use the same display mode as the main fretboard
                    text.textContent = fretboardState.showIntervals ? interval : displayNote;
                    
                    // Add tooltip for enharmonic equivalents
                    const currentDisplay = fretboardState.showIntervals ? interval : displayNote;
                    const tooltipType = fretboardState.showIntervals ? 'interval' : 'note';
                    const tooltip = MusicTheory.getEnharmonicTooltip(currentDisplay, tooltipType);
                    if (tooltip) {
                        const titleElement = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                        titleElement.textContent = tooltip;
                        
                        // Add title to both circle and text for better UX
                        const titleClone = titleElement.cloneNode(true);
                        circle.appendChild(titleElement);
                        text.appendChild(titleClone);
                    }
                    
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
    displayChords(scale, scaleType, category);
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
    
    // Create play button (only ascending, no direction toggle)
    const playButton = document.createElement('button');
    playButton.className = 'play-btn';
    playButton.textContent = 'Play Scale';
    playButton.setAttribute('data-section', 'notes');
    
    playControlsContainer.appendChild(playButton);
    notesContainer.appendChild(playControlsContainer);
    
    // Create notes display container
    const notesDisplay = document.createElement('div');
    notesDisplay.className = 'notes-display';
    
    notes.forEach((note, index) => {
        const noteElement = document.createElement('span');
        noteElement.className = 'note';
        noteElement.textContent = note;
        noteElement.setAttribute('data-note', note);
        
        // Add enharmonic tooltip if available
        const tooltip = MusicTheory.getEnharmonicTooltip(note, 'note');
        if (tooltip) {
            noteElement.title = tooltip;
        }
        
        if (index === 0) {
            noteElement.classList.add('root-note');
        }
        
        notesDisplay.appendChild(noteElement);
    });
    
    notesContainer.appendChild(notesDisplay);
    
    // Add event listener - always ascending
    playButton.addEventListener('click', () => playScale(notes, 'notes'));
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
        
        // Add enharmonic tooltip if available
        const tooltip = MusicTheory.getEnharmonicTooltip(interval, 'interval');
        if (tooltip) {
            intervalElement.title = tooltip;
        }
        
        // Set background color based on interval using the consistent color scheme
        const color = window.colorsVisible ? 
            MusicTheory.getIntervalColor(interval) : '#d97706';
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
    
    // Add debugging for augmented scale
    console.log('=== displayFormula DEBUG ===');
    console.log('Formula received:', formula);
    console.log('Formula type:', typeof formula);
    console.log('Formula is array:', Array.isArray(formula));
    
    // Convert interval numbers to W/H/WH notation
    const convertedFormula = formula.map(interval => {
        switch (interval) {
            case 1: return 'H';
            case 2: return 'W';
            case 3: return 'WH';
            default: return interval.toString();
        }
    });
    
    console.log('Converted formula:', convertedFormula);
    console.log('Final display:', convertedFormula.join(' - '));
    
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
    
    // Define non-modal scales (scales that don't have modes and should be treated as single entities)
    const nonModalScales = [
        'major-6th-diminished', 
        'minor-6th-diminished',
        'chromatic-scale'
    ];
    
    // Check if this is a non-modal scale
    if (nonModalScales.includes(category)) {
        // For non-modal scales, hide the entire related modes section
        const relatedModesSection = document.querySelector('.related-modes');
        if (relatedModesSection) {
            relatedModesSection.style.display = 'none';
        }
        return;
    }
    
    // Show the related modes section for modal scales
    const relatedModesSection = document.querySelector('.related-modes');
    if (relatedModesSection) {
        relatedModesSection.style.display = 'block';
        
        // Reset the section title to default for modal scales
        const sectionTitle = relatedModesSection.querySelector('h4');
        if (sectionTitle) {
            sectionTitle.textContent = 'Related Modes';
        }
    }
    
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
        // Diminished modes
        'wh-diminished': 0, 'hw-diminished': 1,
        // Major Pentatonic modes (correct offsets)
        'major-pentatonic': 0, 'suspended-pentatonic': 2, 'man-gong': 4, 'ritusen': 7, 'minor-pentatonic': 9,
        // Blues scales
        'blues-major': 0, 'blues-minor': 9,
        // Barry Harris scales
        'major-6th-diminished': 0, 'minor-6th-diminished': 0,
        // Other scales
        'whole-tone': 0, 
        'whole-tone-1': 0, 'whole-tone-2': 2, 'whole-tone-3': 4, 'whole-tone-4': 6, 'whole-tone-5': 8, 'whole-tone-6': 10,
        'chromatic': 0
    };
    
    const currentModeOffset = modeOffsets[currentMode] || 0;
    const parentRootIndex = (noteToIndex(currentKey) - currentModeOffset + 12) % 12;
    
    console.log('currentModeOffset:', currentModeOffset);
    console.log('parentRootIndex:', parentRootIndex);
    
    // Determine spelling convention based on the parent scale root, not the current key
    const parentRoot = getConsistentNoteSpelling(parentRootIndex, 'sharp'); // Get sharp version first
    const parentRootFlat = getConsistentNoteSpelling(parentRootIndex, 'flat'); // Get flat version
    
    // Determine which spelling convention to use based on standard key signatures AND scale type
    let spellingConvention;
    
    // Keys that use flats in their key signatures
    const flatKeys = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
    // Keys that use sharps in their key signatures  
    const sharpKeys = ['G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
    
    // Minor scales (harmonic minor, melodic minor) typically use flat spellings
    // due to their characteristic flat intervals (b3, b6, etc.)
    // However, for certain root notes, we need to be smarter about avoiding double flats
    const parentScaleType = getScaleTypeFromCategory(category);
    if (parentScaleType === 'harmonic-minor' || parentScaleType === 'melodic-minor') {
        // Use smart spelling for minor scales to avoid problematic double flats
        // For roots with flats (Ab, Eb, Bb, Db, Gb), use mixed spelling to avoid double flats
        if (parentRootFlat.includes('b')) {
            // For flat roots, use a hybrid approach that prioritizes readability
            spellingConvention = 'mixed-minor';
        } else {
            spellingConvention = 'flat';
        }
    } else if (flatKeys.includes(parentRootFlat)) {
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
                // Update the app state to use this mode and key directly
                // No need to convert spelling - modeKey already has correct enharmonic spelling
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
        // Show the related modes section for whole tone scales
        const relatedModesSection = document.querySelector('.related-modes');
        if (relatedModesSection) {
            relatedModesSection.style.display = 'block';
        }
        
        // Update the section title to reflect rotations instead of modes
        const sectionTitle = relatedModesSection.querySelector('h4');
        if (sectionTitle) {
            sectionTitle.textContent = 'Related Rotations';
        }
        
        // Calculate the whole tone scale from the current key
        const wholeToneFormula = categoryData.formulas['whole-tone-1']; // All have same formula [2,2,2,2,2,2]
        const wholeToneScale = calculateScaleWithConsistentSpelling(currentKey, wholeToneFormula, 'whole-tone', spellingConvention);
        
        // Create 6 buttons - one for each rotation of the whole tone scale
        wholeToneScale.forEach((startingNote, index) => {
            const rotationName = `whole-tone-${index + 1}`;
            const modeData = MusicConstants.modeNumbers[rotationName];
            
            if (!modeData) return;
            
            const button = document.createElement('button');
            button.className = `mode-button ${rotationName === currentMode && startingNote === currentKey ? 'active' : ''}`;
            button.innerHTML = `
                <span class="mode-number">${index + 1}</span>
                <span class="mode-name">${startingNote} Whole Tone</span>
            `;
            
            // Add click handler to change to this rotation using the specific starting note
            button.addEventListener('click', () => {
                AppController.setState({
                    key: startingNote,
                    category: category,
                    mode: rotationName
                });
            });
            
            modeButtonsContainer.appendChild(button);
        });
        
        // Determine which whole tone scale the current key belongs to (for complementary info)
        const currentKeyIndex = noteToIndex(currentKey);
        const wholeToneIndices = wholeToneScale.map(note => noteToIndex(note));
        const otherWholeToneNotes = [];
        
        // Calculate the complementary whole tone scale
        for (let i = 0; i < 12; i++) {
            if (!wholeToneIndices.includes(i)) {
                otherWholeToneNotes.push(getConsistentNoteSpelling(i, spellingConvention));
            }
        }
        
        // Display special information for whole tone scales explaining rotations vs modes
        const parentInfo = `
            <div class="parent-scale-info">
                <strong>Current Whole Tone Scale:</strong> ${wholeToneScale.join(', ')}
                <br><strong>Complementary Scale:</strong> ${otherWholeToneNotes.join(', ')}
                <br><small><strong>Note:</strong> The whole tone scale has rotations, not modes. Each rotation starts on a different note but maintains the same interval pattern (all whole steps). These rotations change the root note and harmonic focus but don't create new harmonic colors like traditional modes do.</small>
                <br><small>Together, these two whole tone scales contain all 12 chromatic notes.</small>
            </div>
        `;
        parentScaleInfo.innerHTML = parentInfo;
        return; // Exit early for whole tone scales
    }
    
    // Special handling for diminished modes
    if (category === 'diminished-modes') {
        // Show the related modes section for diminished scales
        const relatedModesSection = document.querySelector('.related-modes');
        if (relatedModesSection) {
            relatedModesSection.style.display = 'block';
        }
        
        // Calculate the diminished scale from the current key to get all 8 notes
        const diminishedFormula = categoryData.formulas['wh-diminished']; // Use WH pattern as base
        const diminishedScale = calculateScaleWithConsistentSpelling(currentKey, diminishedFormula, 'diminished', spellingConvention);
        
        // Create 8 buttons - one for each note in the diminished scale
        // Alternate between WH and HW patterns
        diminishedScale.forEach((startingNote, index) => {
            // Determine which pattern this note uses
            const isWHPattern = index % 2 === 0; // Even indices use WH, odd indices use HW
            const mode = isWHPattern ? 'wh-diminished' : 'hw-diminished';
            const modeData = MusicConstants.modeNumbers[mode];
            
            if (!modeData) return;
            
            const button = document.createElement('button');
            button.className = `mode-button ${mode === currentMode && startingNote === currentKey ? 'active' : ''}`;
            button.innerHTML = `
                <span class="mode-number">${modeData.number}</span>
                <span class="mode-name">${startingNote} ${modeData.properName}</span>
            `;
            
            // Add click handler to change to this mode using the specific starting note
            button.addEventListener('click', () => {
                AppController.setState({
                    key: startingNote,
                    category: category,
                    mode: mode
                });
            });
            
            modeButtonsContainer.appendChild(button);
        });
        
        // Display special information for diminished scales
        const parentInfo = `
            <div class="parent-scale-info">
                <strong>These rotations are derived from:</strong> ${currentKey} Diminished Scale
                <br><small><strong>Note:</strong> Diminished scale rotations start on different notes within the 8-note diminished collection. Each rotation emphasizes different harmonic and melodic relationships while using the same collection of notes.</small>
            </div>
        `;
        parentScaleInfo.innerHTML = parentInfo;
        return; // Exit early for diminished scales
    }
    
    // Calculate the parent scale with consistent spelling
    const scaleType = getScaleTypeFromCategory(category);
    const parentFormula = categoryData.formulas[categoryData.modes[0]]; // Get the first mode's formula (the parent scale)
    const parentScaleNotes = calculateScaleWithConsistentSpelling(finalParentRoot, parentFormula, scaleType, spellingConvention);
    
    console.log('=== DEBUG MODE GENERATION ===');
    console.log('finalParentRoot:', finalParentRoot);
    console.log('spellingConvention:', spellingConvention);
    console.log('parentFormula:', parentFormula);
    console.log('parentScaleNotes:', parentScaleNotes);
    console.log('parentScaleNotes contents:', parentScaleNotes.join(', '));
    console.log('category:', category);
    
    // Create mode buttons for each mode in the category
    categoryData.modes.forEach((mode, index) => {
        const modeData = MusicConstants.modeNumbers[mode];
        if (!modeData) return;
        
        // Instead of using modeOffset and converting to generic spelling,
        // use the actual note from the parent scale for exact enharmonic matching
        let modeKey;
        
        // For traditional modal systems (7-note scales), use the scale degree
        if (parentScaleNotes.length === 7) {
            // Map mode to its scale degree in the parent scale
            const modeScaleDegrees = {
                // Major modes - use index directly
                'major': 0, 'dorian': 1, 'phrygian': 2, 'lydian': 3, 'mixolydian': 4, 'aeolian': 5, 'locrian': 6,
                
                // Harmonic minor modes - use index directly  
                'harmonic-minor': 0, 'locrian-natural-6': 1, 'ionian-sharp-5': 2, 'dorian-sharp-4': 3, 
                'phrygian-dominant': 4, 'lydian-sharp-2': 5, 'altered-dominant': 6,
                
                // Melodic minor modes - use index directly
                'melodic-minor': 0, 'dorian-b2': 1, 'lydian-augmented': 2, 'lydian-dominant': 3,
                'mixolydian-b6': 4, 'locrian-natural-2': 5, 'super-locrian': 6
            };
            
            const scaleDegree = modeScaleDegrees[mode];
            if (scaleDegree !== undefined && parentScaleNotes[scaleDegree]) {
                modeKey = parentScaleNotes[scaleDegree];
                console.log(`Mode ${mode}: using scale degree ${scaleDegree} = ${modeKey}`);
            } else {
                // Fallback to offset calculation for modes not in the lookup
                const modeOffset = modeOffsets[mode] || 0;
                const modeRootIndex = (parentRootIndex + modeOffset) % 12;
                modeKey = getConsistentNoteSpelling(modeRootIndex, spellingConvention);
                console.log(`Mode ${mode}: using fallback offset ${modeOffset} = ${modeKey}`);
            }
        } else {
            // For non-traditional scales (pentatonic, blues, etc.), use offset calculation
            const modeOffset = modeOffsets[mode] || 0;
            const modeRootIndex = (parentRootIndex + modeOffset) % 12;
            modeKey = getConsistentNoteSpelling(modeRootIndex, spellingConvention);
            console.log(`Mode ${mode}: using non-traditional offset ${modeOffset} = ${modeKey}`);
        }
        
        const button = document.createElement('button');
        button.className = `mode-button ${mode === currentMode ? 'active' : ''}`;
        button.innerHTML = `
            <span class="mode-number">${modeData.number}</span>
            <span class="mode-name">${modeKey} ${modeData.properName}</span>
        `;
        
        // Add click handler to change to this mode
        button.addEventListener('click', () => {
            // Update the app state to use this mode and key directly
            // No need to convert spelling - modeKey already has correct enharmonic spelling
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
    
    // Double accidental alternatives (for special cases)
    const doubleSharpChromatic = ['B#', 'C##', 'D', 'D##', 'E#', 'F', 'F##', 'G', 'G##', 'A', 'A##', 'B'];
    const doubleFlatChromatic = ['C', 'Dbb', 'D', 'Ebb', 'E', 'Fb', 'Gbb', 'G', 'Abb', 'A', 'Bbb', 'Cb'];
    
    if (spellingConvention === 'mixed-minor') {
        // For mixed-minor, avoid double flats by using smart enharmonic choices
        // Use flats for most notes but sharps when it avoids double flats
        const flatVersion = flatChromatic[normalizedIndex];
        const sharpVersion = sharpChromatic[normalizedIndex];
        
        // Avoid double flats - these are problematic for readability
        if (flatVersion.includes('bb')) {
            return sharpVersion;
        } else {
            return flatVersion;
        }
    } else if (spellingConvention === 'flat') {
        return flatChromatic[normalizedIndex];
    } else if (spellingConvention === 'double-sharp') {
        return doubleSharpChromatic[normalizedIndex];
    } else if (spellingConvention === 'double-flat') {
        return doubleFlatChromatic[normalizedIndex];
    } else {
        return sharpChromatic[normalizedIndex];
    }
}

// Helper function to convert enharmonic equivalents to proper spelling
function getProperEnharmonicSpelling(note) {
    // Get the current spelling convention from the modal system
    const spellingConvention = window.modalSystemSpelling || 'sharp';
    
    // Extended enharmonic map including double accidentals
    const enharmonicMap = {
        'B#': 'C',
        'E#': 'F',
        'Fb': 'E',
        'Cb': 'B',
        'C##': 'D',
        'D##': 'E',
        'F##': 'G',
        'G##': 'A',
        'A##': 'B',
        'Dbb': 'C',
        'Ebb': 'D',
        'Gbb': 'F',
        'Abb': 'G',
        'Bbb': 'A'
    };
    
    // Check if it's a problematic enharmonic that should be converted for system compatibility
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
    
    // Special handling for augmented scale - use chromatic spelling
    if (scaleType === 'augmented' || (Array.isArray(formula) && 
        (JSON.stringify(formula) === JSON.stringify([1, 3, 1, 3, 1, 3]) || 
         JSON.stringify(formula) === JSON.stringify([3, 1, 3, 1, 3, 1])))) {
        return calculateAugmentedScaleSpelling(root, formula, spellingConvention);
    }
    
    // Special handling for diminished scales
    if (scaleType === 'diminished' || formula.length === 8) {
        return calculateDiminishedScaleSpelling(root, formula, spellingConvention);
    }
    
    // Define the note names in order for proper scale degree calculation
    const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const noteToIndex = {
        'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11,
        'C#': 1, 'Db': 1, 'D#': 3, 'Eb': 3, 'F#': 6, 'Gb': 6,
        'G#': 8, 'Ab': 8, 'A#': 10, 'Bb': 10,
        // Add enharmonic equivalents and double accidentals
        'B#': 0, 'Cb': 11, 'E#': 5, 'Fb': 4,
        'C##': 2, 'D##': 4, 'F##': 7, 'G##': 9, 'A##': 11,
        'Dbb': 0, 'Ebb': 2, 'Gbb': 5, 'Abb': 7, 'Bbb': 9
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
        } else if (chromaticDifference === 2) {
            // Two semitones up - use double sharp or flat
            if (spellingConvention === 'flat' || spellingConvention === 'mixed-minor') {
                const nextDegreeIndex = (scaleDegreeIndex + 1) % 7;
                const candidateName = noteNames[nextDegreeIndex] + 'bb';
                
                // For mixed-minor, avoid double flats
                if (spellingConvention === 'mixed-minor' && candidateName.includes('bb')) {
                    noteName = baseNoteName + '##';
                } else {
                    noteName = candidateName;
                }
            } else {
                noteName = baseNoteName + '##';
            }
        } else if (chromaticDifference === 10) {
            // Two semitones down - use double flat or sharp  
            if (spellingConvention === 'sharp') {
                const prevDegreeIndex = (scaleDegreeIndex - 1 + 7) % 7;
                noteName = noteNames[prevDegreeIndex] + '##';
            } else if (spellingConvention === 'mixed-minor') {
                // For mixed-minor, avoid double flats
                const candidateName = baseNoteName + 'bb';
                if (candidateName.includes('bb')) {
                    // Use enharmonic equivalent instead
                    noteName = getConsistentNoteSpelling(currentChromaticIndex, 'sharp');
                } else {
                    noteName = candidateName;
                }
            } else {
                noteName = baseNoteName + 'bb';
            }
        } else {
            // For other intervals, use consistent chromatic spelling
            noteName = getConsistentNoteSpelling(currentChromaticIndex, spellingConvention);
        }
        
        scale.push(noteName);
    }
    
    return scale;
}

// Special function for diminished scale spelling
function calculateDiminishedScaleSpelling(root, formula, spellingConvention) {
    const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const noteToIndex = {
        'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11,
        'C#': 1, 'Db': 1, 'D#': 3, 'Eb': 3, 'F#': 6, 'Gb': 6,
        'G#': 8, 'Ab': 8, 'A#': 10, 'Bb': 10,
        // Add enharmonic equivalents and double accidentals
        'B#': 0, 'Cb': 11, 'E#': 5, 'Fb': 4,
        'C##': 2, 'D##': 4, 'F##': 7, 'G##': 9, 'A##': 11,
        'Dbb': 0, 'Ebb': 2, 'Gbb': 5, 'Abb': 7, 'Bbb': 9
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
    
    const scale = [root];
    let currentChromaticIndex = rootChromaticIndex;
    let usedLetters = [rootNoteName];
    
    for (let i = 0; i < formula.length - 1; i++) {
        currentChromaticIndex = (currentChromaticIndex + formula[i]) % 12;
        
        // For diminished scales, prioritize not repeating letter names
        // and use scale degrees when possible
        const scaleDegreeIndex = (rootNoteIndex + i + 1) % 7;
        const baseNoteName = noteNames[scaleDegreeIndex];
        const baseNoteChromatic = noteToIndex[baseNoteName];
        
        const chromaticDifference = (currentChromaticIndex - baseNoteChromatic + 12) % 12;
        
        let noteName;
        
        // Try to use the scale degree first
        if (chromaticDifference === 0 && !usedLetters.includes(baseNoteName)) {
            noteName = baseNoteName;
        } else if (chromaticDifference === 1 && !usedLetters.includes(baseNoteName)) {
            noteName = baseNoteName + '#';
        } else if (chromaticDifference === 11 && !usedLetters.includes(baseNoteName)) {
            noteName = baseNoteName + 'b';
        } else if (chromaticDifference === 2 && !usedLetters.includes(baseNoteName)) {
            noteName = baseNoteName + '##';
        } else if (chromaticDifference === 10 && !usedLetters.includes(baseNoteName)) {
            noteName = baseNoteName + 'bb';
        } else {
            // If the scale degree is already used, find the best enharmonic equivalent
            noteName = getConsistentNoteSpelling(currentChromaticIndex, spellingConvention);
            
            // Check for conflicts and resolve with enharmonics
            const currentLetter = noteName.charAt(0);
            if (usedLetters.includes(currentLetter)) {
                // Try the enharmonic equivalent
                const enharmonicConvention = spellingConvention === 'flat' ? 'sharp' : 'flat';
                const enharmonicName = getConsistentNoteSpelling(currentChromaticIndex, enharmonicConvention);
                const enharmonicLetter = enharmonicName.charAt(0);
                
                if (!usedLetters.includes(enharmonicLetter)) {
                    noteName = enharmonicName;
                }
                // If both conflict, use the one that fits the spelling convention
            }
        }
        
        scale.push(noteName);
        usedLetters.push(noteName.charAt(0));
    }
    
    return scale;
}

// Special function for augmented scale spelling
function calculateAugmentedScaleSpelling(root, formula, spellingConvention) {
    const noteToIndex = {
        'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11,
        'C#': 1, 'Db': 1, 'D#': 3, 'Eb': 3, 'F#': 6, 'Gb': 6,
        'G#': 8, 'Ab': 8, 'A#': 10, 'Bb': 10,
        'B#': 0, 'Cb': 11, 'E#': 5, 'Fb': 4
    };
    
    const rootChromaticIndex = noteToIndex[root];
    if (rootChromaticIndex === undefined) {
        console.warn('Invalid root note:', root);
        return [];
    }
    
    const scale = [root];
    let currentChromaticIndex = rootChromaticIndex;
    
    for (let i = 0; i < formula.length - 1; i++) {
        currentChromaticIndex = (currentChromaticIndex + formula[i]) % 12;
        
        // For augmented scale, use chromatic spelling with proper enharmonics
        // The augmented scale should avoid using the same letter name twice
        let noteName = getConsistentNoteSpelling(currentChromaticIndex, spellingConvention);
        
        // Check if this note name conflicts with existing notes in the scale
        const existingLetters = scale.map(note => note.charAt(0));
        const currentLetter = noteName.charAt(0);
        
        if (existingLetters.includes(currentLetter)) {
            // Use the enharmonic equivalent
            if (spellingConvention === 'flat') {
                noteName = getConsistentNoteSpelling(currentChromaticIndex, 'sharp');
            } else {
                noteName = getConsistentNoteSpelling(currentChromaticIndex, 'flat');
            }
        }
        
        scale.push(noteName);
    }
    
    return scale;
}

function getParentScaleName(category, parentRoot) {
    console.log('Getting parent scale name for:', category, parentRoot);
    
    if (!category || !parentRoot) return '';
    
    const categoryData = MusicConstants.scaleCategories[category];
    if (!categoryData) return '';
    
    // For traditional modes (major, minor, dorian, etc.)
    if (category === 'church-modes' || category === 'natural-minor-modes') {
        return `All modes derive from the same scale, starting on different degrees`;
    }
    
    // For pentatonic modes
    if (category === 'pentatonic') {
        return `These modes are derived from: ${parentRoot} Major Pentatonic`;
    }
    
    // For other categories, use the category name
    return `These modes are derived from: ${parentRoot} ${categoryData.name}`;
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

function displayChords(scale, scaleType, category = null) {
    console.log('=== displayChords DEBUG START ===');
    console.log('Parameters:', { 
        scaleType, 
        scaleLength: scale?.length, 
        category,
        scale: scale?.slice(0, 5) + (scale?.length > 5 ? '...' : '') 
    });
    
    const chordsSection = document.querySelector('.chords-section');
    const chordsList = document.getElementById('chords-list');
    
    if (!chordsSection || !chordsList) {
        console.log('Missing required DOM elements:', { 
            scaleLength: scale?.length, 
            chordsSection: !!chordsSection, 
            chordsList: !!chordsList 
        });
        return;
    }
    
    // Check if this scale type should display chords
    const shouldDisplay = MusicTheory.shouldDisplayChords(scaleType, scale.length, category);
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
        displayTraditionalChords(scale, scaleType, category);
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
            
            const chordsHtml = chordGroup.chords.map(chord => {
                // Check if this is a clickable chord (contains chord symbols like +, 7, etc.) vs description text
                const isClickableChord = /[+°#♭]|7|maj|m|sus|dim|aug/.test(chord) && !chord.includes(' ');
                
                if (isClickableChord) {
                    return `<span class="characteristic-chord clickable-chord" title="${chordGroup.description}" data-chord="${chord}">${chord}</span>`;
                } else {
                    return `<span class="characteristic-chord non-clickable" title="${chordGroup.description}">${chord}</span>`;
                }
            }).join('');
            
            typeSection.innerHTML = `
                <h4 class="chord-type-title${isEmphasized}">${chordGroup.type}</h4>
                <p class="chord-type-description">${chordGroup.description}</p>
                <div class="chord-type-chords">
                    ${chordsHtml}
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
            
            const chordsHtml = chords.map(chord => {
                const chordName = chord.name || chord;
                const isClickableChord = /[+°#♭]|7|maj|m|sus|dim|aug/.test(chordName) && !chordName.includes(' ');
                
                if (isClickableChord) {
                    return `<span class="characteristic-chord clickable-chord" title="${chord.description || ''}" data-chord="${chordName}">${chordName}</span>`;
                } else {
                    return `<span class="characteristic-chord non-clickable" title="${chord.description || ''}">${chordName}</span>`;
                }
            }).join('');
            
            typeSection.innerHTML = `
                <h4 class="chord-type-title">${chordType}</h4>
                <div class="chord-type-chords">
                    ${chordsHtml}
                </div>
            `;
            
            chordsContainer.appendChild(typeSection);
        });
    }
    
    chordsFromScaleSection.appendChild(chordsContainer);
    container.appendChild(chordsFromScaleSection);
    
    // Add click handlers for clickable chords
    const clickableChords = chordsFromScaleSection.querySelectorAll('.clickable-chord');
    clickableChords.forEach(chordElement => {
        chordElement.addEventListener('click', function() {
            const chordName = this.getAttribute('data-chord');
            const [root, type] = parseChordName(chordName);
            openChordModal(chordName, root);
        });
    });
    
    console.log('displayChordsFromScale completed, container innerHTML length:', container.innerHTML.length);
}

// Helper function to parse chord names
function parseChordName(chordName) {
    // Extract root note and chord type from chord name like "C+", "F#7#5", "Bb°7"
    let root = '';
    let type = '';
    
    // Handle sharp/flat in root note
    if (chordName.length > 1 && (chordName[1] === '#' || chordName[1] === '♯' || chordName[1] === 'b' || chordName[1] === '♭')) {
        root = chordName.substring(0, 2);
        type = chordName.substring(2);
    } else {
        root = chordName[0];
        type = chordName.substring(1);
    }
    
    return [root, type];
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

function displayTraditionalChords(scale, scaleType, category) {
    // Check if chords should be displayed for this scale type
    if (!MusicTheory.shouldDisplayChords(scaleType, scale.length, category)) {
        const chordsList = document.getElementById('chords-list');
        if (chordsList) {
            chordsList.innerHTML = '<p class="no-chords-message">Chord display not available for this scale type.</p>';
        }
        return;
    }

    // Calculate triads
    const triads = MusicTheory.calculateTriads(scale, scaleType, category);
    console.log('Generated triads:', triads);

    // Calculate seventh chords
    const seventhChords = MusicTheory.calculateSeventhChords(scale, scaleType, category);
    console.log('Generated 7th chords:', seventhChords);

    // Determine if extended chords should be available
    const showExtendedChords = scaleType === 'major' || (category && category.toLowerCase().includes('major'));
    
    // Calculate extended chords (only for major modes)
    let ninthChords = [];
    let eleventhChords = [];
    let thirteenthChords = [];

    if (showExtendedChords) {
        ninthChords = MusicTheory.calculateNinthChords(scale, scaleType, category);
        eleventhChords = MusicTheory.calculateEleventhChords(scale, scaleType, category);
        thirteenthChords = MusicTheory.calculateThirteenthChords(scale, scaleType, category);
        console.log('Generated 9th chords:', ninthChords);
        console.log('Generated 11th chords:', eleventhChords);
        console.log('Generated 13th chords:', thirteenthChords);
    }

    // Show/hide extended chord buttons based on scale type
    const extendedChordButtons = document.querySelectorAll('.chord-type-btn[data-type="ninths"], .chord-type-btn[data-type="elevenths"], .chord-type-btn[data-type="thirteenths"]');
    extendedChordButtons.forEach(button => {
        if (showExtendedChords) {
            button.style.display = 'inline-block';
        } else {
            button.style.display = 'none';
            // If the hidden button was active, switch to triads
            if (button.classList.contains('active')) {
                button.classList.remove('active');
                const triadsButton = document.querySelector('.chord-type-btn[data-type="triads"]');
                if (triadsButton) {
                    triadsButton.classList.add('active');
                }
            }
        }
    });

    // Display triads by default
    displayChordType('triads', triads);

    // Update audio controls with triads initially
    if (window.audioControls) {
        window.audioControls.updateChords({
            triads: triads,
            sevenths: seventhChords,
            ninths: ninthChords,
            elevenths: eleventhChords,
            thirteenths: thirteenthChords
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
            } else if (chordType === 'ninths') {
                if (ninthChords.length > 0) {
                    displayChordType('ninths', ninthChords);
                    // Update audio controls with 9th chords
                    if (window.audioControls) {
                        window.audioControls.updateChords(ninthChords);
                    }
                } else {
                    displayChordType('ninths', []);
                    const chordsList = document.getElementById('chords-list');
                    if (chordsList) {
                        chordsList.innerHTML = '<p class="no-chords-message">9th chords are only available for major modes.</p>';
                    }
                }
            } else if (chordType === 'elevenths') {
                if (eleventhChords.length > 0) {
                    displayChordType('elevenths', eleventhChords);
                    // Update audio controls with 11th chords
                    if (window.audioControls) {
                        window.audioControls.updateChords(eleventhChords);
                    }
                } else {
                    displayChordType('elevenths', []);
                    const chordsList = document.getElementById('chords-list');
                    if (chordsList) {
                        chordsList.innerHTML = '<p class="no-chords-message">11th chords are only available for major modes.</p>';
                    }
                }
            } else if (chordType === 'thirteenths') {
                if (thirteenthChords.length > 0) {
                    displayChordType('thirteenths', thirteenthChords);
                    // Update audio controls with 13th chords
                    if (window.audioControls) {
                        window.audioControls.updateChords(thirteenthChords);
                    }
                } else {
                    displayChordType('thirteenths', []);
                    const chordsList = document.getElementById('chords-list');
                    if (chordsList) {
                        chordsList.innerHTML = '<p class="no-chords-message">13th chords are only available for major modes.</p>';
                    }
                }
            }
        });
    });
}

function getContrastTextColor(backgroundColor) {
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return white for dark backgrounds, dark for light backgrounds
    return luminance > 0.5 ? '#1f2937' : '#ffffff';
}

function displayChordType(type, chords) {
    const chordsList = document.getElementById('chords-list');
    if (!chordsList || !chords) return;
    
    chordsList.innerHTML = '';
    
    chords.forEach((chord, index) => {
        const chordElement = document.createElement('div');
        chordElement.className = `chord-item ${chord.isNonStandard ? 'non-standard' : ''}`;
        
        // Always use orange color for chord degrees instead of function-based colors
        const functionColor = '#f97316'; // Orange color
        const textColor = 'white'; // White text for good contrast with orange
        
        // Add a tooltip for non-standard chords
        const tooltip = chord.isNonStandard ? 
            `title="Non-standard chord: ${chord.intervals.map(i => MusicTheory.getIntervalName(i)).join(', ')}"` : '';
        
        chordElement.innerHTML = `
            <div class="chord-degree" style="background-color: ${functionColor}; color: ${textColor};">
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
            
            console.log('Traditional chord clicked:', chord);
            console.log('Chord properties:', Object.keys(chord));
            console.log('Chord details:', {
                name: chord.name,
                notes: chord.notes,
                quality: chord.quality,
                degree: chord.degree,
                roman: chord.roman,
                function: chord.function
            });
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
    console.log('openChordModal called with:', { chord, key });
    
    const modal = document.getElementById('chord-modal');
    const modalTitle = document.getElementById('chord-modal-title');
    const chordNameDisplay = document.getElementById('chord-name-display');
    const chordNotesDisplay = document.getElementById('chord-notes-display');
    const chordQualityDisplay = document.getElementById('chord-quality-display');
    
    if (!modal || !modalTitle || !chordNameDisplay || !chordNotesDisplay || !chordQualityDisplay) {
        console.error('Chord modal elements not found');
        return;
    }
    
    let chordSymbol, chordNotes, chordQuality;
    
    if (typeof chord === 'string') {
        // Handle characteristic chords (string chord name + root note)
        console.log('Handling characteristic chord (string):', chord, 'with key:', key);
        chordSymbol = chord;
        // For characteristic chords, we don't have the notes calculated, so we'll show basic info
        chordNotes = `Based on ${key || 'C'} scale`;
        chordQuality = 'See fretboard for notes';
    } else if (chord && typeof chord === 'object') {
        // Handle traditional chords (object with name, notes, quality properties)
        console.log('Handling traditional chord (object):', chord);
        chordSymbol = chord.symbol || chord.name || 'Unknown';
        chordNotes = chord.notes ? chord.notes.join(' - ') : 'Notes not available';
        chordQuality = chord.quality || 'Quality not specified';
    } else {
        console.error('Invalid chord data format:', chord);
        return;
    }
    
    // Update modal content
    modalTitle.textContent = chordSymbol;
    chordNameDisplay.textContent = chordSymbol;
    chordNotesDisplay.textContent = chordNotes;
    chordQualityDisplay.textContent = chordQuality;
    
    // Render the chord fretboard
    renderChordFretboard(chord, key);
    
    // Show modal
    modal.classList.remove('hidden');
    modal.style.display = 'block';
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

    // Create control section with toggles and rotation
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'chord-controls-container';
    controlsContainer.innerHTML = `
        <div class="chord-controls-row">
            <div class="fretboard-toggle-wrapper">
                <button class="fretboard-toggle-btn active" data-display="notes">Notes</button>
                <button class="fretboard-toggle-btn" data-display="intervals">Intervals</button>
            </div>
            <button class="rotation-btn" title="Rotate for mobile viewing">🔄</button>
        </div>
    `;
    container.appendChild(controlsContainer);

    // Create fretboard display container
    const displayContainer = document.createElement('div');
    displayContainer.className = 'fretboard-display-container';
    container.appendChild(displayContainer);

    // State for display mode and rotation
    let displayMode = 'notes';
    let isRotated = false;

    // Add toggle event listeners
    const toggleButtons = controlsContainer.querySelectorAll('.fretboard-toggle-btn');
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            displayMode = btn.dataset.display;
            renderFretboard();
        });
    });

    // Add rotation event listener
    const rotationBtn = controlsContainer.querySelector('.rotation-btn');
    rotationBtn.addEventListener('click', () => {
        isRotated = !isRotated;
        displayContainer.classList.toggle('rotated', isRotated);
        renderFretboard();
    });

    function renderFretboard() {
        // Dynamic dimensions based on rotation
        const fretCount = 12;
        const stringCount = 6;
        
        let fretWidth, stringSpacing, leftMargin, topMargin, svgWidth, svgHeight;
        
        if (isRotated) {
            // Rotated (mobile-friendly) dimensions
            fretWidth = 60;
            stringSpacing = 35;
            leftMargin = 60;
            topMargin = 80;
            svgWidth = leftMargin + (fretCount * fretWidth) + 20;
            svgHeight = topMargin + ((stringCount - 1) * stringSpacing) + 40;
        } else {
            // Normal (desktop) dimensions
            fretWidth = 90;
            stringSpacing = 45;
            leftMargin = 80;
            topMargin = 80; // Increased to prevent overlap
            svgWidth = leftMargin + (fretCount * fretWidth) + 20;
            svgHeight = topMargin + ((stringCount - 1) * stringSpacing) + 60;
        }

        // Create SVG with dynamic structure
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'fretboard-svg');
        svg.setAttribute('width', svgWidth);
        svg.setAttribute('height', svgHeight);
        svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

        // Standard guitar tuning (low to high)
        const stringNotes = ['E', 'A', 'D', 'G', 'B', 'E'];
        const stringMidiNotes = [40, 45, 50, 55, 59, 64];

        // Draw frets (vertical lines)
        for (let fret = 0; fret <= fretCount; fret++) {
            const x = leftMargin + (fret * fretWidth);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', topMargin);
            line.setAttribute('x2', x);
            line.setAttribute('y2', topMargin + ((stringCount - 1) * stringSpacing));
            line.setAttribute('stroke', fret === 0 ? '#1f2937' : '#6b7280');
            line.setAttribute('stroke-width', fret === 0 ? '4' : '2');
            svg.appendChild(line);

            // Fret numbers - positioned to avoid overlap with high E string
            if (fret > 0) {
                const fretNumber = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                fretNumber.setAttribute('x', leftMargin + ((fret - 0.5) * fretWidth));
                // Position higher above the fretboard to avoid any overlap with dots
                fretNumber.setAttribute('y', topMargin - 35);
                fretNumber.setAttribute('text-anchor', 'middle');
                fretNumber.setAttribute('fill', '#374151');
                fretNumber.setAttribute('font-size', isRotated ? '16' : '18');
                fretNumber.setAttribute('font-weight', 'bold');
                fretNumber.textContent = fret;
                svg.appendChild(fretNumber);
            }
        }

        // Draw strings (horizontal lines) - CORRECT ORDER: E(high) to E(low)
        for (let string = 0; string < stringCount; string++) {
            const y = topMargin + (string * stringSpacing);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', leftMargin);
            line.setAttribute('y1', y);
            line.setAttribute('x2', leftMargin + (fretCount * fretWidth));
            line.setAttribute('y2', y);
            line.setAttribute('stroke', '#6b7280');
            line.setAttribute('stroke-width', '3');
            svg.appendChild(line);

            // String labels - REVERSE ORDER to match visual layout (high E at top)
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', leftMargin - 25);
            label.setAttribute('y', y + 6);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('fill', '#374151');
            label.setAttribute('font-size', isRotated ? '16' : '18');
            label.setAttribute('font-weight', 'bold');
            label.textContent = stringNotes[stringCount - 1 - string]; // Reverse order for display
            svg.appendChild(label);
        }

        // Draw fret markers (inlay dots)
        const markerFrets = [3, 5, 7, 9, 12];
        markerFrets.forEach(markerFret => {
            const x = leftMargin + ((markerFret - 0.5) * fretWidth);
            const centerY = topMargin + (((stringCount - 1) * stringSpacing) / 2);
            
            if (markerFret === 12) {
                // Double dots for 12th fret
                const dotSize = isRotated ? 8 : 10;
                const marker1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker1.setAttribute('cx', x);
                marker1.setAttribute('cy', centerY - stringSpacing * 0.8);
                marker1.setAttribute('r', dotSize);
                marker1.setAttribute('fill', '#d1d5db');
                marker1.setAttribute('class', 'inlay-dot');
                svg.appendChild(marker1);
                
                const marker2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker2.setAttribute('cx', x);
                marker2.setAttribute('cy', centerY + stringSpacing * 0.8);
                marker2.setAttribute('r', dotSize);
                marker2.setAttribute('fill', '#d1d5db');
                marker2.setAttribute('class', 'inlay-dot');
                svg.appendChild(marker2);
            } else {
                // Single dot for other markers
                const dotSize = isRotated ? 8 : 10;
                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker.setAttribute('cx', x);
                marker.setAttribute('cy', centerY);
                marker.setAttribute('r', dotSize);
                marker.setAttribute('fill', '#d1d5db');
                marker.setAttribute('class', 'inlay-dot');
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
                    
                    console.log(`Note: ${chordNote}, Root: ${rootNote}, isRoot: ${isRoot}`);
                    
                    // Determine interval and color
                    let interval = '1'; // Default to root
                    let intervalColor;
                    
                    if (isRoot) {
                        interval = '1';
                        // Root notes are always white with black text/stroke
                        intervalColor = '#FFFFFF';
                        console.log(`Setting root note ${chordNote} to white (#FFFFFF)`);
                    } else {
                        // Use the same interval calculation as scales
                        const chordIntervals = MusicTheory.getIntervals(chord.notes, rootNote);
                        interval = chordIntervals[chordNoteIndex] || '1';
                        // Non-root notes use interval colors if colors are visible
                        intervalColor = window.colorsVisible ? 
                            MusicTheory.getIntervalColor(interval) : '#d97706';
                        console.log(`Setting non-root note ${chordNote} (interval ${interval}) to color ${intervalColor}`);
                    }
                    
                    // Position notes - optimized positioning
                    const x = fret === 0 ? leftMargin - 30 : leftMargin + ((fret - 0.5) * fretWidth);
                    const y = topMargin + (string * stringSpacing);
                    
                    const circleRadius = isRotated ? 15 : 18;
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('cx', x);
                    circle.setAttribute('cy', y);
                    circle.setAttribute('r', circleRadius);
                    circle.setAttribute('fill', intervalColor);
                    circle.setAttribute('style', `fill: ${intervalColor} !important;`);
                    // Use black stroke for root note (1), white for others
                    circle.setAttribute('stroke', isRoot || interval === '1' ? 'black' : 'white');
                    circle.setAttribute('stroke-width', '2');
                    circle.setAttribute('class', isRoot ? 'note-dot root' : 'note-dot');
                    svg.appendChild(circle);
                    
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', x);
                    text.setAttribute('y', y + 4);
                    text.setAttribute('text-anchor', 'middle');
                    
                    // Determine what to display based on toggle state
                    let displayText = chordNote; // Default to note name
                    let isRootNote = isRoot;
                    
                    if (displayMode === 'intervals') {
                        // Show interval instead of note name
                        displayText = interval;
                        isRootNote = interval === '1';
                    }
                    
                    // Use black text for root note (1), white for others
                    text.setAttribute('fill', isRootNote ? 'black' : 'white');
                    text.setAttribute('style', `fill: ${isRootNote ? 'black' : 'white'} !important;`);
                    text.setAttribute('font-size', isRotated ? '12' : '14');
                    text.setAttribute('font-weight', 'bold');
                    
                    text.textContent = displayText;
                    
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
    displayScale,
    displayNotes,
    displayIntervals,
    displayFormula,
    createFretboard,
    openFretboardModal,
    closeFretboardModal,
    setOptimalModalSize,
    openChordModal,
    closeChordModal,
    renderChordFretboard,
    openChordVoicingModal,
    closeChordVoicingModal,
    openIntervalInfoModal,
    closeIntervalInfoModal,
    enterCompareMode,
    exitCompareMode,
    updateScaleColor,
    updateParentScale,
    updateModeName,
    createRelatedModes
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
    
    console.log('Playing direction: ascending (only option)');
    
    // Add octave note for playback
    const octaveNote = notes[0]; // Root note an octave higher
    
    try {
        // Initialize audio engine if needed
        if (!window.AudioEngine.isInitialized) {
            await window.AudioEngine.initialize();
        }
        
        // Play the scale ascending only (octave visual will be added during playback)
        await playScaleSequence([...notes, octaveNote], true, section);
        
    } catch (error) {
        console.error('Error playing scale:', error);
    }
}

async function playScaleSequence(notes, ascending, section) {
    const playOrder = ascending ? notes : [...notes].reverse();
    let octaveElement = null;
    
    // Calculate proper octaves for smooth scale progression
    const notesWithOctaves = calculateScaleOctaves(playOrder, ascending);
    
    // Get audio context timing for precise synchronization
    const audioContext = window.AudioEngine.audioContext;
    const noteDuration = 0.6; // Duration for each note
    const noteSpacing = noteDuration * 0.7; // Time between note starts
    
    for (let i = 0; i < playOrder.length; i++) {
        const note = playOrder[i];
        const isOctave = i === (ascending ? playOrder.length - 1 : 0);
        
        // Use the calculated octave for proper pitch progression
        const noteWithOctave = notesWithOctaves[i];
        
        // Add octave visual only when we reach the octave note
        if (isOctave && !octaveElement) {
            octaveElement = await addOctaveVisual(notes.slice(0, -1), note, section);
        }
        
        // Highlight current note immediately
        highlightCurrentNote(note, isOctave);
        
        // Play the note with precise Web Audio timing
        await window.AudioEngine.playNote(noteWithOctave, noteDuration * 0.8);
        
        // Schedule highlight removal after note duration
        setTimeout(() => {
            removeNoteHighlight();
        }, noteDuration * 800);
        
        // Wait before next note (only if not the last note)
        if (i < playOrder.length - 1) {
            await new Promise(resolve => setTimeout(resolve, noteSpacing * 1000));
        }
    }
    
    // Remove octave visual after playback
    if (octaveElement) {
        setTimeout(() => removeOctaveVisual(section), 500);
    }
}

function calculateScaleOctaves(notes, ascending) {
    // Note names in chromatic order for octave calculation
    const chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // Function to get note index (handles both sharp and flat notation)
    function getNoteIndex(note) {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1,
            'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6,
            'G': 7, 'G#': 8, 'Ab': 8,
            'A': 9, 'A#': 10, 'Bb': 10,
            'B': 11
        };
        return noteMap[note] !== undefined ? noteMap[note] : 0;
    }
    
    if (notes.length === 0) return [];
    
    const result = [];
    let currentOctave;
    
    if (ascending) {
        // Ascending: start at octave 2 (where descending ends)
        currentOctave = 2;
    } else {
        // Descending: start at octave 3 (will go down to octave 2)
        currentOctave = 3;
    }
    
    let lastNoteIndex = getNoteIndex(notes[0]);
    
    for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        const noteIndex = getNoteIndex(note);
        
        if (i > 0) {
            if (ascending) {
                // For ascending: if current note is lower than previous, we've crossed into next octave
                if (noteIndex < lastNoteIndex) {
                    currentOctave++;
                }
            } else {
                // For descending: if current note is higher than previous, we've crossed into lower octave
                if (noteIndex > lastNoteIndex) {
                    currentOctave--;
                }
            }
        }
        
        result.push(`${note}${currentOctave}`);
        lastNoteIndex = noteIndex;
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

        // Check if octave elements already exist (prevent duplicates)
        const existingOctaveNote = notesContainer.querySelector('.octave-note');
        const existingOctaveInterval = intervalsContainer.querySelector('.octave-interval');
        
        if (existingOctaveNote && existingOctaveInterval) {
            // Return existing elements
            resolve({ noteElement: existingOctaveNote, intervalElement: existingOctaveInterval });
            return;
        }
        
        // Remove any existing octave elements first (cleanup)
        const oldOctaveElements = document.querySelectorAll('.octave-note, .octave-interval');
        oldOctaveElements.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        
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

// Scale comparison functions
function enterCompareMode() {
    fretboardState.compareMode = true;
    
    // Re-render fretboard
    createFretboard(window.currentScale);
}

function exitCompareMode() {
    fretboardState.compareMode = false;
    fretboardState.comparisonScale = null;
    
    // Re-render fretboard
    createFretboard(window.currentScale);
}

// Function to update the comparison legend with actual scale names
function updateComparisonLegend(comparisonRoot, comparisonCategory, comparisonMode) {
    const comparisonScaleNameElement = document.getElementById('comparison-scale-name');
    if (comparisonScaleNameElement) {
        const formattedModeName = formatModeName(comparisonMode);
        comparisonScaleNameElement.textContent = `${comparisonRoot} ${formattedModeName} only`;
    }
}

// Function to update the primary scale legend
function updatePrimaryScaleLegend() {
    const primaryScaleNameElement = document.getElementById('primary-scale-name');
    if (primaryScaleNameElement && window.AppController) {
        const currentState = window.AppController.getCurrentState();
        if (currentState) {
            const formattedModeName = formatModeName(currentState.mode);
            primaryScaleNameElement.textContent = `${currentState.key} ${formattedModeName} only`;
        }
    }
}

function showComparisonSelector(controlsDiv) {
    // Save current selections if they exist
    let savedSelections = null;
    const existingRoot = document.getElementById('comparison-root');
    const existingCategory = document.getElementById('comparison-category');
    const existingMode = document.getElementById('comparison-mode');
    
    if (existingRoot && existingCategory && existingMode) {
        savedSelections = {
            root: existingRoot.value,
            category: existingCategory.value,
            mode: existingMode.value
        };
    } else if (fretboardState.comparisonSelection) {
        // Use stored selections if available
        savedSelections = fretboardState.comparisonSelection;
    }
    
    const comparisonDiv = document.createElement('div');
    comparisonDiv.className = 'comparison-selector';
    
    comparisonDiv.innerHTML = `
        <h4 style="color: #f97316;">Select Comparison Scale</h4>
        <div class="comparison-controls">
            <label for="comparison-root">Root Note:</label>
            <select id="comparison-root" name="comparison-root">
                <option value="C">C</option>
                <option value="C#">C#</option>
                <option value="Db">Db</option>
                <option value="D">D</option>
                <option value="D#">D#</option>
                <option value="Eb">Eb</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="F#">F#</option>
                <option value="Gb">Gb</option>
                <option value="G">G</option>
                <option value="G#">G#</option>
                <option value="Ab">Ab</option>
                <option value="A">A</option>
                <option value="A#">A#</option>
                <option value="Bb">Bb</option>
                <option value="B">B</option>
            </select>
            
            <label for="comparison-category">Scale Category:</label>
            <select id="comparison-category" name="comparison-category">
            </select>
            
            <label for="comparison-mode">Mode:</label>
            <select id="comparison-mode" name="comparison-mode">
            </select>
            
            <button id="apply-comparison" class="apply-btn">Apply Comparison</button>
        </div>
    `;
    
    // Add legend
    const legend = document.createElement('div');
    legend.className = 'comparison-legend';
    legend.innerHTML = `
        <div class="legend-items">
            <div class="legend-item">
                <span class="legend-color shared-note"></span>
                <span>Shared notes</span>
            </div>
            <div class="legend-item">
                <span class="legend-color primary-only"></span>
                <span id="primary-scale-name">Primary scale only</span>
            </div>
            <div class="legend-item">
                <span class="legend-color comparison-only"></span>
                <span id="comparison-scale-name">Comparison scale only</span>
            </div>
        </div>
        <div id="interval-info" class="interval-info" style="display: none;">
            <p><strong>Interval Mode:</strong> Intervals are shown relative to each scale's root. 
            Notes in both scales show the primary scale's intervals.</p>
        </div>
    `;
    comparisonDiv.appendChild(legend);
    controlsDiv.appendChild(comparisonDiv);
    
    // Update primary scale legend immediately after adding to DOM
    setTimeout(() => {
        updatePrimaryScaleLegend();
        // Also update comparison legend if we have stored comparison data
        if (fretboardState.comparisonSelection) {
            updateComparisonLegend(
                fretboardState.comparisonSelection.root,
                fretboardState.comparisonSelection.category,
                fretboardState.comparisonSelection.mode
            );
        }
    }, 0);
    
    // Populate category dropdown
    populateComparisonCategories();
    
    // Restore saved selections
    if (savedSelections) {
        setTimeout(() => {
            const rootSelect = document.getElementById('comparison-root');
            const categorySelect = document.getElementById('comparison-category');
            const modeSelect = document.getElementById('comparison-mode');
            
            if (rootSelect && savedSelections.root) {
                rootSelect.value = savedSelections.root;
            }
            
            if (categorySelect && savedSelections.category) {
                categorySelect.value = savedSelections.category;
                populateComparisonModes(savedSelections.category);
                
                // Restore mode selection after populating modes
                setTimeout(() => {
                    if (modeSelect && savedSelections.mode) {
                        modeSelect.value = savedSelections.mode;
                    }
                }, 10);
            }
        }, 10);
    }
    
    // Set up event listeners for dependent dropdowns
    const categorySelect = document.getElementById('comparison-category');
    const modeSelect = document.getElementById('comparison-mode');
    
    categorySelect.addEventListener('change', function() {
        populateComparisonModes(this.value);
    });
    
    // Initialize with first category if no saved selections
    if (!savedSelections && categorySelect.options.length > 0) {
        categorySelect.selectedIndex = 0;
        populateComparisonModes(categorySelect.value);
    }
    
    // Apply comparison event listener
    document.getElementById('apply-comparison').addEventListener('click', function() {
        const root = document.getElementById('comparison-root').value;
        const category = document.getElementById('comparison-category').value;
        const mode = document.getElementById('comparison-mode').value;
        
        if (!root || !category || !mode) {
            console.warn('Please select root, category, and mode for comparison');
            return;
        }
        
        try {
            // Get the category data from constants
            const categoryData = MusicConstants.scaleCategories[category];
            if (!categoryData) {
                console.error('Invalid category:', category);
                return;
            }
            
            // Get the formula for the selected mode
            const modeFormula = categoryData.formulas[mode];
            if (!modeFormula) {
                console.error('Invalid mode for category:', mode, category);
                return;
            }
            
            // Get scale type
            const scaleType = getScaleTypeFromCategory(category);
            
            // Generate the comparison scale using the same method as the main app
            const comparisonScale = MusicTheory.calculateScale(root, modeFormula, scaleType);
            
            if (comparisonScale && comparisonScale.length > 0) {
                // Store the comparison selections to maintain them
                fretboardState.comparisonSelection = {
                    root,
                    category,
                    mode
                };
                
                // Update fretboard state
                fretboardState.comparisonScale = comparisonScale;
                
                // Re-render the fretboard with comparison first
                createFretboard(window.currentScale);
                
                console.log('Comparison applied:', {
                    root,
                    category,
                    mode,
                    formula: modeFormula,
                    scale: comparisonScale
                });
                
            } else {
                console.error('Failed to generate comparison scale');
            }
        } catch (error) {
            console.error('Error applying comparison:', error);
        }
    });
}

// Helper function to populate comparison categories
function populateComparisonCategories() {
    const categorySelect = document.getElementById('comparison-category');
    if (!categorySelect || !MusicConstants.scaleCategories) return;
    
    categorySelect.innerHTML = '';
    
    Object.entries(MusicConstants.scaleCategories).forEach(([key, category]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
}

// Helper function to populate comparison modes based on category
function populateComparisonModes(categoryKey) {
    const modeSelect = document.getElementById('comparison-mode');
    if (!modeSelect || !MusicConstants.scaleCategories) return;
    
    const categoryData = MusicConstants.scaleCategories[categoryKey];
    if (!categoryData) return;
    
    modeSelect.innerHTML = '';
    
    categoryData.modes.forEach(mode => {
        const option = document.createElement('option');
        option.value = mode;
        option.textContent = formatModeName(mode);
        modeSelect.appendChild(option);
    });
}

// Helper function to format mode names for display
function formatModeName(mode) {
    // Use proper mode names from constants if available
    if (MusicConstants && MusicConstants.modeNumbers && MusicConstants.modeNumbers[mode]) {
        return MusicConstants.modeNumbers[mode].properName;
    }
    
    // Fallback to basic formatting if not found in constants
    return mode
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Helper function to get scale type from category (same logic as main app)
function getScaleTypeFromCategory(category) {
    switch(category) {
        case 'major-modes':
            return 'major';
        case 'harmonic-minor-modes':
            return 'harmonic-minor';
        case 'harmonic-major-modes':
            return 'harmonic-major';
        case 'melodic-minor-modes':
            return 'melodic-minor';
        case 'diminished-modes':
            return 'diminished';
        case 'pentatonic-modes':
            return 'major-pentatonic';
        case 'blues-modes':
        case 'blues-scales':
            return 'blues';
        case 'barry-harris':
            return 'major-6th-diminished';
        case 'whole-tone':
            return 'whole-tone';
        case 'chromatic':
            return 'chromatic';
        default:
            return category;
    }
}

function renderSingleScale(svg, scale, displayFrets, fretWidth) {
    const stringNotes = ['E', 'B', 'G', 'D', 'A', 'E'];
    
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
                
                // Check color visibility state - use orange if colors are disabled
                const color = window.colorsVisible ? 
                    MusicTheory.getIntervalColor(interval) : '#d97706';
                
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
                // Use black text for root note (1), white for others
                text.setAttribute('fill', interval === '1' ? 'black' : 'white');
                text.setAttribute('font-size', '10');
                text.setAttribute('font-weight', 'bold');
                // Show intervals or notes based on toggle state
                text.textContent = fretboardState.showIntervals ? interval : displayNote;
                
                // Add tooltip for enharmonic equivalents
                const currentDisplay = fretboardState.showIntervals ? interval : displayNote;
                const tooltipType = fretboardState.showIntervals ? 'interval' : 'note';
                const tooltip = MusicTheory.getEnharmonicTooltip(currentDisplay, tooltipType);
                if (tooltip) {
                    const titleElement = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                    titleElement.textContent = tooltip;
                    
                    // Add title to both circle and text for better UX
                    const titleClone = titleElement.cloneNode(true);
                    circle.appendChild(titleElement);
                    text.appendChild(titleClone);
                }
                
                svg.appendChild(text);
            }
        }
    }
}

function renderComparisonFretboard(svg, scale1, scale2, displayFrets, fretWidth) {
    const stringNotes = ['E', 'B', 'G', 'D', 'A', 'E'];
    
    // Find shared notes between the two scales
    const sharedNotes = scale1.filter(note => 
        scale2.some(compareNote => {
            if (typeof MusicTheory !== 'undefined' && 
                typeof MusicTheory.areEnharmonicEquivalents === 'function') {
                return MusicTheory.areEnharmonicEquivalents(note, compareNote);
            }
            return note === compareNote;
        })
    );
    
    for (let string = 0; string < 6; string++) {
        const openNote = stringNotes[string];
        
        for (let fret = 0; fret <= displayFrets; fret++) {
            const actualFret = fretboardState.startFret + fret;
            
            const chromaticIndex = (noteToIndex(openNote) + actualFret) % 12;
            const chromaticNoteName = MusicConstants.chromaticScale[chromaticIndex];
            
            let displayNote = null;
            let isInScale1 = false;
            let isInScale2 = false;
            let isShared = false;
            let scale1Index = -1;
            let scale2Index = -1;
            
            // Check if this note is in scale1
            for (let i = 0; i < scale1.length; i++) {
                const scaleNote = scale1[i];
                if (typeof MusicTheory !== 'undefined' && 
                    typeof MusicTheory.areEnharmonicEquivalents === 'function') {
                    if (MusicTheory.areEnharmonicEquivalents(chromaticNoteName, scaleNote)) {
                        displayNote = scaleNote;
                        isInScale1 = true;
                        scale1Index = i;
                        break;
                    }
                } else {
                    if (chromaticNoteName === scaleNote) {
                        displayNote = scaleNote;
                        isInScale1 = true;
                        scale1Index = i;
                        break;
                    }
                }
            }
            
            // Check if this note is in scale2
            for (let i = 0; i < scale2.length; i++) {
                const scaleNote = scale2[i];
                if (typeof MusicTheory !== 'undefined' && 
                    typeof MusicTheory.areEnharmonicEquivalents === 'function') {
                    if (MusicTheory.areEnharmonicEquivalents(chromaticNoteName, scaleNote)) {
                        if (!displayNote) displayNote = scaleNote;
                        isInScale2 = true;
                        scale2Index = i;
                        break;
                    }
                } else {
                    if (chromaticNoteName === scaleNote) {
                        if (!displayNote) displayNote = scaleNote;
                        isInScale2 = true;
                        scale2Index = i;
                        break;
                    }
                }
            }
            
            // Check if shared
            if (displayNote) {
                isShared = sharedNotes.some(sharedNote => {
                    if (typeof MusicTheory !== 'undefined' && 
                        typeof MusicTheory.areEnharmonicEquivalents === 'function') {
                        return MusicTheory.areEnharmonicEquivalents(displayNote, sharedNote);
                    }
                    return displayNote === sharedNote;
                });
            }
            
            if (displayNote && (isInScale1 || isInScale2)) {
                const x = fret === 0 ? 25 : 80 + ((fret - 0.5) * fretWidth);
                const y = 60 + (string * 30);
                
                // Color coding for comparison
                let color;
                if (isShared) {
                    // Shared notes: blue
                    color = '#3b82f6'; // blue-500
                } else if (isInScale1) {
                    // Only in scale1 (primary): orange
                    color = '#f97316'; // orange-500
                } else {
                    // Only in scale2 (comparison): red
                    color = '#dc2626'; // red-600
                }
                
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
                
                // Determine what to display based on toggle state
                let displayText = displayNote; // Default to note name
                
                if (fretboardState.showIntervals) {
                    // For intervals, prioritize scale1 if the note is in both scales
                    let intervalText = '';
                    if (isInScale1 && scale1Index >= 0) {
                        // Get interval from scale1
                        const scale1Root = scale1[0];
                        const intervals1 = MusicTheory.getIntervals(scale1, scale1Root);
                        intervalText = intervals1[scale1Index] || '1';
                    } else if (isInScale2 && scale2Index >= 0) {
                        // Get interval from scale2
                        const scale2Root = scale2[0];
                        const intervals2 = MusicTheory.getIntervals(scale2, scale2Root);
                        intervalText = intervals2[scale2Index] || '1';
                    }
                    
                    if (intervalText) {
                        displayText = intervalText;
                        // Update text color for root notes
                        text.setAttribute('fill', intervalText === '1' ? 'black' : 'white');
                    }
                }
                
                text.textContent = displayText;
                
                // Add tooltip for enharmonic equivalents
                const tooltipType = fretboardState.showIntervals ? 'interval' : 'note';
                const tooltip = MusicTheory.getEnharmonicTooltip(displayText, tooltipType);
                if (tooltip) {
                    const titleElement = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                    titleElement.textContent = tooltip;
                    
                    // Add title to both circle and text for better UX
                    const titleClone = titleElement.cloneNode(true);
                    circle.appendChild(titleElement);
                    text.appendChild(titleClone);
                }
                
                svg.appendChild(text);
            }
        }
    }
}

// Chord Voicing Practices Modal Functions
function openChordVoicingModal() {
    const modal = document.getElementById('chord-voicing-modal');
    if (!modal) return;
    
    // Show modal
    modal.classList.remove('hidden');
    modal.style.display = 'block';
    
    // Add escape key listener
    document.addEventListener('keydown', handleChordVoicingModalEscape);
}

function closeChordVoicingModal() {
    const modal = document.getElementById('chord-voicing-modal');
    modal.classList.add('hidden');
    
    // Remove escape key listener
    document.removeEventListener('keydown', handleChordVoicingModalEscape);
}

function handleChordVoicingModalEscape(e) {
    if (e.key === 'Escape') {
        closeChordVoicingModal();
    }
}

function openIntervalInfoModal() {
    const modal = document.getElementById('interval-info-modal');
    if (!modal) return;
    
    // Show modal
    modal.classList.remove('hidden');
    modal.style.display = 'block';
    
    // Add escape key listener
    document.addEventListener('keydown', handleIntervalInfoModalEscape);
}

function closeIntervalInfoModal() {
    const modal = document.getElementById('interval-info-modal');
    modal.classList.add('hidden');
    
    // Remove escape key listener
    document.removeEventListener('keydown', handleIntervalInfoModalEscape);
}

function handleIntervalInfoModalEscape(e) {
    if (e.key === 'Escape') {
        closeIntervalInfoModal();
    }
}