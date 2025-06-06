// Guitar Scale Explorer - Main Application Entry Point
// This file has been refactored to use a modular architecture
// Dependencies: constants.js, music-theory.js, components.js, app-controller.js

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    
    // Set up legacy compatibility
    setupLegacyCompatibility();
    
    // Initialize the modular app
    if (window.AppController) {
        AppController.initializeApp();
    } else {
        console.error('AppController module not loaded');
    }
    
    // Initialize search functionality
    if (window.UIComponents && window.UIComponents.initializeSearch) {
        UIComponents.initializeSearch();
        console.log('Search functionality initialized');
    } else {
        console.error('Search functionality not available');
    }
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

// Legacy AlphaTab integration and file handling
// (This will be moved to a separate audio module in the future)

let api = null;
let currentFiles = new Map();

function setupAlphaTab() {
    try {
        const tabElement = document.getElementById('tab-content');
        if (!tabElement) {
            console.log('Tab content element not found, skipping AlphaTab setup');
            return;
        }

        const settings = {
            file: null,
            player: {
                enablePlayer: true,
                soundFont: 'https://cdn.jsdelivr.net/npm/@coderline/alphatab@latest/dist/soundfont/sonivox.sf2',
                scrollElement: tabElement
            },
            display: {
                layoutMode: 'page',
                staveProfile: 'score'
            }
        };

        api = new alphaTab.AlphaTabApi(tabElement, settings);
        
        console.log('AlphaTab initialized successfully');
        setupPlayerControls();
        
    } catch (error) {
        console.warn('AlphaTab initialization failed:', error);
    }
}

function setupPlayerControls() {
    if (!api) return;

    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');

    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (api.player) api.player.play();
        });
    }

    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            if (api.player) api.player.pause();
        });
    }

    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            if (api.player) api.player.stop();
        });
    }
}

function setupFileUpload() {
    const fileInput = document.getElementById('file-input');
    const uploadSection = document.getElementById('upload-section');

    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    if (uploadSection) {
        uploadSection.addEventListener('dragover', handleDragOver);
        uploadSection.addEventListener('drop', handleFileDrop);
    }
}

function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    processFiles(files);
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

function handleFileDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = Array.from(event.dataTransfer.files);
    processFiles(files);
}

function processFiles(files) {
    files.forEach(file => {
        if (file.name.match(/\.(gp[345x]?|ptb)$/i)) {
            currentFiles.set(file.name, file);
            loadFile(file);
        } else {
            console.warn('Unsupported file format:', file.name);
        }
    });
}

function loadFile(file) {
        if (api) {
        try {
            api.load(file);
            document.getElementById('tab-player').classList.remove('hidden');
            console.log('File loaded:', file.name);
            } catch (error) {
            console.error('Error loading file:', error);
        }
    }
}

// Initialize file upload and AlphaTab when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setupFileUpload();
    setupAlphaTab();
});

// Export key functions for global access
window.calculateScale = calculateScale;
window.getIntervals = getIntervals;
window.getIntervalColor = getIntervalColor;
window.createFretboard = createFretboard;
window.openFretboardModal = openFretboardModal;
window.closeFretboardModal = closeFretboardModal;
window.displayScale = displayScale;

