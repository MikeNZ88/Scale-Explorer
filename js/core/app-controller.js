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
    currentState.category = event.target.value;
    populateModeSelect();
    updateScale();
}

function handleModeChange(event) {
    currentState.mode = event.target.value;
    updateScale();
}

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
        
        // Display the scale
        UIComponents.displayScale(modeNotes, intervals, modeFormula, scaleType, key, category);
        
        // Update mode information
        updateModeInfo(mode, category);
        
    } catch (error) {
        console.error('Error updating scale:', error);
    }
}

function getScaleType(category) {
    const typeMap = {
        'major-modes': 'major',
        'harmonic-minor-modes': 'harmonic-minor',
        'harmonic-major-modes': 'harmonic-major',
        'melodic-minor-modes': 'melodic-minor',
        'hungarian-minor-modes': 'hungarian-minor',
        'neapolitan-minor-modes': 'neapolitan-minor',
        'neapolitan-major-modes': 'neapolitan-major',
        'diminished-modes': 'diminished',
        'pentatonic': 'pentatonic-major',
        'japanese-pentatonic': 'pentatonic',
        'blues-modes': 'blues',
        'blues-scales': 'blues',
        'whole-tone': 'whole-tone',
        'chromatic-scale': 'chromatic',
        'augmented-scale': 'augmented'
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
    
    modeSelect.innerHTML = '';
    
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
    const intervals = document.querySelectorAll('.interval');
    
    intervals.forEach(interval => {
        if (visible) {
            // Show original colors
            const intervalText = interval.textContent;
            interval.style.backgroundColor = MusicTheory.getIntervalColor(intervalText);
            
            // Handle enharmonic equivalents
            if (intervalText === '#5' || intervalText === 'b6') {
                interval.style.backgroundColor = MusicConstants.intervalColors['b6'] || '#8E44AD';
            } else if (intervalText === '#6' || intervalText === 'b7') {
                interval.style.backgroundColor = MusicConstants.intervalColors['b7'] || '#7D3C98';
            }
        } else {
            // Hide colors (neutral background)
            interval.style.backgroundColor = '#666666';
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
                toggleContainer.style.backgroundColor = '#666666';
                toggleContainer.style.borderColor = '#666666';
            }
        }
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
    currentState = { ...currentState, ...newState };
    
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