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
        
        // Calculate the scale directly using the mode's formula
        const modeNotes = MusicTheory.calculateScale(key, modeFormula, scaleType);
        
        // Get intervals
        const intervals = MusicTheory.getIntervals(modeNotes, modeNotes[0]);
        
        // Update state
        currentState.scaleType = scaleType;
        
        // Store scale data globally for color toggle re-rendering
        window.currentScale = modeNotes;
        window.currentIntervals = intervals;
        window.currentFormula = modeFormula;
        
        // Display the scale
        UIComponents.displayScale(modeNotes, intervals, modeFormula, scaleType, key, category);
        
        // Update mode information
        updateModeInfo(mode, category);
        
        // Update audio controls with new scale and chords
        if (window.audioControls) {
            window.audioControls.updateScale(modeNotes, key, mode);
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
    
    const moodElement = modeInfoDiv.querySelector('.mode-mood');
    const descriptionElement = modeInfoDiv.querySelector('.mode-description');
    const applicationsElement = modeInfoDiv.querySelector('.mode-applications');
    
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
    if (!colorToggle) return;
    
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
    if (window.currentScale && window.currentIntervals && window.currentFormula) {
        const currentState = getCurrentState();
        UIComponents.displayScale(
            window.currentScale, 
            window.currentIntervals, 
            window.currentFormula, 
            getScaleType(currentState.category), 
            currentState.key, 
            currentState.category
        );
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