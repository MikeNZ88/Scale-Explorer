// Application Controller Module
// Depends on: constants.js, music-theory.js, components.js

// Application state
let currentState = {
    key: 'C',
    category: 'major-modes',
    mode: 'major',
    scaleType: 'major',
    colorsVisible: true
};

// Initialize application
function initializeApp() {
    console.log('Initializing Guitar Scale Explorer...');
    
    // Set up initial UI state
    setupEventListeners();
    loadDefaultScale();
    setupColorToggle();
    
    console.log('App initialized successfully');
}

// Event listeners setup
function setupEventListeners() {
    // Key selector
    const keySelect = document.getElementById('key-select');
    if (keySelect) {
        keySelect.addEventListener('change', handleKeyChange);
    }
    
    // Category selector
    const categorySelect = document.getElementById('category-select');
    if (categorySelect) {
        categorySelect.addEventListener('change', handleCategoryChange);
        populateCategorySelect();
    }
    
    // Mode selector
    const modeSelect = document.getElementById('mode-select');
    if (modeSelect) {
        modeSelect.addEventListener('change', handleModeChange);
    }
    
    // Modal close handlers
    const modalOverlay = document.getElementById('fretboard-modal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                UIComponents.closeFretboardModal();
            }
        });
    }
    
    // Escape key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            UIComponents.closeFretboardModal();
        }
    });
}

// Event handlers
function handleKeyChange(event) {
    currentState.key = event.target.value;
    updateScale();
}

function handleCategoryChange(event) {
    console.log('=== CATEGORY CHANGE DEBUG ===');
    console.log('Previous category:', currentState.category);
    console.log('New category from dropdown:', event.target.value);
    
    currentState.category = event.target.value;
    
    console.log('Updated currentState.category:', currentState.category);
    console.log('Category data:', MusicConstants.scaleCategories[currentState.category]);
    
    populateModeSelect();
    updateScale();
    
    console.log('=== END CATEGORY CHANGE DEBUG ===');
}

function handleModeChange(event) {
    currentState.mode = event.target.value;
    updateScale();
}

// Debug function to check state
function debugState() {
    console.log('=== CURRENT STATE DEBUG ===');
    console.log('currentState:', currentState);
    console.log('Category dropdown value:', document.getElementById('category-select')?.value);
    console.log('Mode dropdown value:', document.getElementById('mode-select')?.value);
    console.log('Key dropdown value:', document.getElementById('key-select')?.value);
    console.log('=== END STATE DEBUG ===');
}

// Make debug function globally available
window.debugState = debugState;

// Scale calculation and display
function updateScale() {
    const { key, category, mode } = currentState;
    
    try {
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
        const scaleType = getScaleType(category);
        
        // For diminished scales and major modes, use the specific mode as scale type
        const actualScaleType = (category === 'diminished-modes' || category === 'major-modes' || category === 'harmonic-minor-modes' || category === 'melodic-minor-modes') ? mode : scaleType;
        
        // Calculate correct enharmonic spelling for modal systems
        let correctedKey = key;
        const modalCategories = ['major-modes', 'harmonic-minor-modes', 'melodic-minor-modes'];
        
        if (modalCategories.includes(category)) {
            // Mode offset lookup table - semitones from parent scale root to mode root
            const modeOffsets = {
                // Major modes
                'major': 0, 'dorian': 2, 'phrygian': 4, 'lydian': 5, 'mixolydian': 7, 'aeolian': 9, 'locrian': 11,
                // Harmonic minor modes  
                'harmonic-minor': 0, 'locrian-natural-6': 2, 'ionian-sharp-5': 3, 'dorian-sharp-4': 5, 
                'phrygian-dominant': 7, 'lydian-sharp-2': 8, 'altered-dominant': 11,
                // Melodic minor modes
                'melodic-minor': 0, 'dorian-b2': 2, 'lydian-augmented': 3, 'lydian-dominant': 5,
                'mixolydian-b6': 7, 'locrian-natural-2': 9, 'super-locrian': 11
            };
            
            const currentModeOffset = modeOffsets[mode] || 0;
            const rootIndex = noteToIndex(key);
            const parentRootIndex = (rootIndex - currentModeOffset + 12) % 12;
            
            // Determine spelling convention based on the parent scale root
            const parentRoot = getConsistentNoteSpelling(parentRootIndex, 'sharp');
            const parentRootFlat = getConsistentNoteSpelling(parentRootIndex, 'flat');
            
            // Keys that use flats/sharps in their key signatures
            const flatKeys = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
            const sharpKeys = ['G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
            
            let spellingConvention;
            const parentScaleType = getScaleTypeFromCategory(category);
            
            if (parentScaleType === 'harmonic-minor' || parentScaleType === 'melodic-minor') {
                // For minor scales, use the same logic as major scales based on key signatures
                if (flatKeys.includes(parentRootFlat)) {
                    spellingConvention = 'flat';
                } else if (sharpKeys.includes(parentRoot)) {
                    spellingConvention = 'sharp';
                } else {
                    spellingConvention = 'flat'; // For C minor scales
                }
            } else if (flatKeys.includes(parentRootFlat)) {
                spellingConvention = 'flat';
            } else if (sharpKeys.includes(parentRoot)) {
                spellingConvention = 'sharp';
            } else {
                spellingConvention = 'sharp'; // For C major
            }
            
            // Calculate the correct root note for this mode
            const correctRootIndex = (parentRootIndex + currentModeOffset) % 12;
            const correctRoot = getConsistentNoteSpelling(correctRootIndex, spellingConvention);
            
            // Use the corrected root if it's different
            if (correctRoot !== key) {
                correctedKey = correctRoot;
                console.log(`Corrected enharmonic spelling: ${key} → ${correctedKey} (based on parent scale)`);
            }
        }
        
        // Add debugging for diminished scales
        if (category === 'diminished-modes') {
            console.log('=== DIMINISHED SCALE DEBUG ===');
            console.log('Category:', category);
            console.log('Mode:', mode);
            console.log('Key:', correctedKey);
            console.log('Mode Formula:', modeFormula);
            console.log('Actual Scale Type:', actualScaleType);
        }
        
        // Calculate the scale using the corrected key
        const modeNotes = MusicTheory.calculateScale(correctedKey, modeFormula, actualScaleType);
        
        // Add more debugging for diminished scales
        if (category === 'diminished-modes') {
            console.log('Calculated Notes:', modeNotes);
        }
        
        // Get intervals
        const intervals = MusicTheory.getIntervals(modeNotes, modeNotes[0], actualScaleType, mode);
        
        // Update state with corrected key if it was changed
        if (correctedKey !== key) {
            currentState.key = correctedKey;
            
            // Update the UI dropdown to reflect the corrected key
            const keySelect = document.getElementById('key-select');
            if (keySelect && keySelect.value !== correctedKey) {
                keySelect.value = correctedKey;
            }
        }
        
        // Update state
        currentState.scaleType = actualScaleType;
        
        // Store scale data globally for color toggle re-rendering
        window.currentScale = modeNotes;
        window.currentIntervals = intervals;
        window.currentFormula = modeFormula;
        window.currentScaleType = actualScaleType;
        window.currentMode = mode;
        
        // Display the scale
        UIComponents.displayScale(modeNotes, intervals, modeFormula, actualScaleType, correctedKey, category);
        
        // Update mode information
        updateModeInfo(mode, category);
        
        // Update audio controls with new scale and chords
        if (window.audioControls) {
            window.audioControls.updateScale(modeNotes, correctedKey, mode);
        }
        
    } catch (error) {
        console.error('Error updating scale:', error);
    }
}

function getScaleType(category) {
    const typeMap = {
        'major-modes': 'major',
        'harmonic-minor-modes': 'harmonic-minor',
        'melodic-minor-modes': 'melodic-minor',
        'diminished-modes': 'diminished',
        'pentatonic': 'pentatonic',
        'blues-modes': 'blues',
        'blues-scales': 'blues',
        'whole-tone': 'whole-tone',
        'chromatic-scale': 'chromatic'
    };
    
    return typeMap[category] || 'major';
}

// UI population functions
function populateCategorySelect() {
    const categorySelect = document.getElementById('category-select');
    if (!categorySelect) return;
    
    categorySelect.innerHTML = '';
    
    Object.entries(MusicConstants.scaleCategories).forEach(([key, category]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = category.name;
        
        if (key === currentState.category) {
            option.selected = true;
        }
        
        categorySelect.appendChild(option);
    });
}

function populateModeSelect() {
    const modeSelect = document.getElementById('mode-select');
    if (!modeSelect) return;
    
    const categoryData = MusicConstants.scaleCategories[currentState.category];
    if (!categoryData) return;
    
    // Define non-modal scales (scales that don't have modes and should be treated as single entities)
    const nonModalScales = [
        'major-6th-diminished', 
        'minor-6th-diminished',
        'chromatic-scale'
    ];
    
    // Check if this is a non-modal scale
    const isNonModal = nonModalScales.includes(currentState.category);
    
    // Special handling for whole tone scale (has rotations, not modes)
    const isWholeTone = currentState.category === 'whole-tone';
    
    modeSelect.innerHTML = '';
    
    if (isNonModal) {
        // For non-modal scales, ensure the mode is set to the first (and only) mode
        if (!categoryData.modes.includes(currentState.mode)) {
            currentState.mode = categoryData.modes[0];
        }
        
        // For non-modal scales, disable the dropdown and show a single option
        modeSelect.disabled = true;
        modeSelect.style.opacity = '0.5';
        modeSelect.style.cursor = 'not-allowed';
        modeSelect.style.backgroundColor = '#f5f5f5';
        modeSelect.style.color = '#999';
        
        // Add a single option indicating this scale has no modes
        const option = document.createElement('option');
        option.value = currentState.mode;
        option.textContent = 'No modes available';
        option.selected = true;
        modeSelect.appendChild(option);
    } else if (isWholeTone) {
        // For whole tone scale, ensure the mode is set correctly
        if (!categoryData.modes.includes(currentState.mode)) {
            currentState.mode = categoryData.modes[0];
        }
        
        // For whole tone scale, enable the dropdown but show rotations
        modeSelect.disabled = false;
        modeSelect.style.opacity = '1';
        modeSelect.style.cursor = 'pointer';
        modeSelect.style.backgroundColor = 'white';
        modeSelect.style.color = '#DC6C27';
        
        // Add a single option explaining rotations
        const option = document.createElement('option');
        option.value = currentState.mode;
        option.textContent = 'Rotations (see below)';
        option.selected = true;
        modeSelect.appendChild(option);
    } else {
        // For modal scales, enable the dropdown and populate with modes
        modeSelect.disabled = false;
        modeSelect.style.opacity = '1';
        modeSelect.style.cursor = 'pointer';
        modeSelect.style.backgroundColor = 'white';
        modeSelect.style.color = '#DC6C27';
        
        categoryData.modes.forEach(mode => {
            const option = document.createElement('option');
            option.value = mode;
            
            // Use proper mode names from constants, with fallback to string transformation
            const modeData = MusicConstants.modeNumbers[mode];
            const properModeName = modeData ? modeData.properName : mode.split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            option.textContent = properModeName;
            
            if (mode === currentState.mode) {
                option.selected = true;
            }
            
            modeSelect.appendChild(option);
        });
        
        // Update current mode if it doesn't exist in new category
        if (!categoryData.modes.includes(currentState.mode)) {
            currentState.mode = categoryData.modes[0];
            modeSelect.value = currentState.mode;
        }
    }
}

function updateModeInfo(mode, category) {
    const modeInfoDiv = document.querySelector('.mode-info');
    if (!modeInfoDiv) return;
    
    const modeData = MusicConstants.modeMetadata[mode];
    if (!modeData) {
        modeInfoDiv.style.display = 'none';
        return;
    }
    
    modeInfoDiv.style.display = 'block';
    
    // Initialize as expanded by default
    const modeDetails = document.getElementById('mode-details');
    const toggleIcon = document.querySelector('.mode-info-toggle');
    
    if (modeDetails && toggleIcon) {
        modeDetails.classList.remove('collapsed');
        modeDetails.classList.add('expanded');
        toggleIcon.classList.remove('collapsed');
        toggleIcon.textContent = '▼';
    }
    
    const moodElement = modeInfoDiv.querySelector('.mode-mood span');
    const descriptionElement = modeInfoDiv.querySelector('.mode-description span');
    const applicationsElement = modeInfoDiv.querySelector('.application-tags');
    
    if (moodElement) {
        moodElement.textContent = modeData.mood;
    }
    
    if (descriptionElement) {
        descriptionElement.textContent = modeData.description;
    }
    
    if (applicationsElement) {
        applicationsElement.innerHTML = '';
        modeData.applications.forEach(app => {
            const span = document.createElement('span');
            span.className = 'application-tag';
            span.textContent = app;
            applicationsElement.appendChild(span);
        });
    }
}

// Color toggle functionality
function setupColorToggle() {
    const colorToggle = document.getElementById('color-toggle');
    
    // If no color toggle element exists, set colors visible by default
    if (!colorToggle) {
        currentState.colorsVisible = true;
        updateColorVisibility(true);
        return;
    }
    
    // Set initial state
    colorToggle.checked = currentState.colorsVisible;
    updateColorVisibility(currentState.colorsVisible);
    
    // Add event listener
    colorToggle.addEventListener('change', function() {
        currentState.colorsVisible = this.checked;
        updateColorVisibility(this.checked);
    });
}

function updateColorVisibility(visible) {
    // Store the color visibility state globally
    window.colorsVisible = visible;
    
    // Update intervals section colors
    const intervals = document.querySelectorAll('.interval');
    intervals.forEach(interval => {
        if (visible) {
            // Show original colors using the consistent color scheme
            const intervalText = interval.textContent;
            const color = MusicTheory.getIntervalColor(intervalText);
            if (color) {
                interval.style.backgroundColor = color;
            }
        } else {
            // Hide colors (use orange instead of gray)
            interval.style.backgroundColor = '#d97706';
        }
    });
    
    // Update toggle button appearance
    const colorToggle = document.getElementById('color-toggle');
    if (colorToggle) {
        const toggleContainer = colorToggle.closest('.color-toggle-container');
        if (toggleContainer) {
            if (visible) {
                toggleContainer.style.backgroundColor = '#8B5CF6';
                toggleContainer.style.borderColor = '#8B5CF6';
            } else {
                toggleContainer.style.backgroundColor = '#d97706';
                toggleContainer.style.borderColor = '#d97706';
            }
        }
    }
    
    // Re-render the current scale to update fretboard colors
    // Instead of using cached values, recalculate everything from current state
    const currentState = getCurrentState();
    if (currentState.key && currentState.category && currentState.mode) {
        // Force a complete scale update to ensure intervals are recalculated
        updateScale();
    }
    
    // Re-render modal fretboard if it's open
    const modal = document.getElementById('fretboard-modal');
    if (modal && modal.style.display !== 'none' && window.currentScale) {
        const fretboardDiv = modal.querySelector('.modal-fretboard');
        if (fretboardDiv) {
            UIComponents.renderModalFretboard(fretboardDiv, window.currentScale);
        }
    }
    
    // Re-render chord modal fretboard if it's open
    const chordModal = document.getElementById('chord-modal');
    if (chordModal && chordModal.style.display !== 'none' && window.currentChord) {
        // The chord modal will be re-rendered by its own logic when colors change
        // since it checks window.colorsVisible in its rendering function
    }
}

// Default scale loading
function loadDefaultScale() {
    // Set default selections
    const keySelect = document.getElementById('key-select');
    const categorySelect = document.getElementById('category-select');
    const modeSelect = document.getElementById('mode-select');
    
    if (keySelect) keySelect.value = currentState.key;
    if (categorySelect) categorySelect.value = currentState.category;
    
    // Populate mode select and set default
    populateModeSelect();
    if (modeSelect) modeSelect.value = currentState.mode;
    
    // Load the default scale
    updateScale();
}

// Utility functions for external access
function getCurrentState() {
    return { ...currentState };
}

function setState(newState) {
    const previousCategory = currentState.category;
    currentState = { ...currentState, ...newState };
    
    // Reset modal system spelling when category changes
    if (newState.category && newState.category !== previousCategory) {
        window.modalSystemSpelling = null;
    }
    
    // Update UI to reflect new state
    const keySelect = document.getElementById('key-select');
    const categorySelect = document.getElementById('category-select');
    const modeSelect = document.getElementById('mode-select');
    
    if (keySelect && currentState.key !== keySelect.value) {
        keySelect.value = currentState.key;
    }
    
    if (categorySelect && currentState.category !== categorySelect.value) {
        categorySelect.value = currentState.category;
        populateModeSelect();
        
        // Wait for mode options to be populated before setting mode
        const waitForModeOptions = (attempts = 0) => {
            if (attempts > 20) { // Give up after 1 second
                console.error('Timeout waiting for mode options in setState');
                updateScale(); // Update anyway
                return;
            }
            
            if (modeSelect) {
                const modeOption = modeSelect.querySelector(`option[value="${currentState.mode}"]`);
                if (modeOption) {
                    modeSelect.value = currentState.mode;
                    updateScale();
                } else {
                    setTimeout(() => waitForModeOptions(attempts + 1), 50);
                }
            } else {
                updateScale();
            }
        };
        
        setTimeout(waitForModeOptions, 50);
    } else {
        // Category didn't change, just update mode directly
        if (modeSelect && currentState.mode !== modeSelect.value) {
            const modeOption = modeSelect.querySelector(`option[value="${currentState.mode}"]`);
            if (modeOption) {
                modeSelect.value = currentState.mode;
            }
        }
        updateScale();
    }
}

// Global function to toggle mode information visibility
function toggleModeInfo() {
    const modeDetails = document.getElementById('mode-details');
    const toggleIcon = document.querySelector('.mode-info-toggle');
    
    if (!modeDetails || !toggleIcon) return;
    
    const isCollapsed = modeDetails.classList.contains('collapsed');
    
    if (isCollapsed) {
        // Expand
        modeDetails.classList.remove('collapsed');
        modeDetails.classList.add('expanded');
        toggleIcon.classList.remove('collapsed');
        toggleIcon.textContent = '▼';
    } else {
        // Collapse
        modeDetails.classList.remove('expanded');
        modeDetails.classList.add('collapsed');
        toggleIcon.classList.add('collapsed');
        toggleIcon.textContent = '▶';
    }
}

// Make the function globally available
window.toggleModeInfo = toggleModeInfo;

// Helper function to map category names to scale types
function getScaleTypeFromCategory(category) {
    const categoryMap = {
        'major-modes': 'major',
        'harmonic-minor-modes': 'harmonic-minor',
        'melodic-minor-modes': 'melodic-minor'
    };
    return categoryMap[category] || 'major';
}

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

// Helper function to get consistent note spelling
function getConsistentNoteSpelling(chromaticIndex, convention) {
    const sharpChromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const flatChromatic = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    
    if (convention === 'sharp') {
        return sharpChromatic[chromaticIndex];
    } else {
        return flatChromatic[chromaticIndex];
    }
}

// Export functions
window.AppController = {
    initializeApp,
    getCurrentState,
    setState,
    updateScale,
    updateColorVisibility,
    loadDefaultScale,
    setupColorToggle
}; 