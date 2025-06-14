// Guitar Scale Explorer - Main Application Entry Point
// This file has been refactored to use a modular architecture
// Dependencies: constants.js, music-theory.js, components.js, app-controller.js

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    
    // Initialize color visibility state (colors visible by default)
    window.colorsVisible = true;
    
    // Set up legacy compatibility
    setupLegacyCompatibility();
    
    // Initialize the modular app
    if (window.AppController) {
        AppController.initializeApp();
    } else {
        console.error('AppController module not loaded');
    }
    
    // Initialize audio controls
    if (window.AudioControls) {
        new AudioControls();
        console.log('Audio controls initialized');
    } else {
        console.error('Audio controls not available');
    }
    
    console.log('Guitar Scale Explorer initialized successfully');
});

// Legacy compatibility layer
function setupLegacyCompatibility() {
    if (window.MusicConstants) {
        // Make constants available globally for legacy code
        window.scaleCategories = window.MusicConstants.scaleCategories;
        window.modeMetadata = window.MusicConstants.modeMetadata;
        window.chromaticScale = window.MusicConstants.chromaticScale;
        window.scaleFormulas = window.MusicConstants.scaleFormulas;
        window.intervalColors = window.MusicConstants.intervalColors;
    }
}

// Legacy function exports for backward compatibility
// These delegate to the new modular functions

function calculateScale(root, formula, scaleType) {
    return MusicTheory ? MusicTheory.calculateScale(root, formula, scaleType) : [];
}

function getIntervals(notes, root) {
    return MusicTheory ? MusicTheory.getIntervals(notes, root) : [];
}

function getIntervalColor(interval) {
    return MusicTheory ? MusicTheory.getIntervalColor(interval) : '#8B5CF6';
}

function createFretboard(scale) {
    return UIComponents ? UIComponents.createFretboard(scale) : null;
}

function openFretboardModal(scale) {
    return UIComponents ? UIComponents.openFretboardModal(scale) : null;
}

function closeFretboardModal() {
    return UIComponents ? UIComponents.closeFretboardModal() : null;
}

function displayScale(scale, intervals, formula, scaleType, key, category) {
    return UIComponents ? UIComponents.displayScale(scale, intervals, formula, scaleType, key, category) : null;
}

// Export key functions for global access
window.calculateScale = calculateScale;
window.getIntervals = getIntervals;
window.getIntervalColor = getIntervalColor;
window.createFretboard = createFretboard;
window.openFretboardModal = openFretboardModal;
window.closeFretboardModal = closeFretboardModal;
window.displayScale = displayScale;

