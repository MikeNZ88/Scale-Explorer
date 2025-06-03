let api = null;
let isPlayerReady = false;
let trackStates = {}; // Store track states (visible, muted, solo)
let currentScore = null; // Global score reference
let isRenderingComplete = false; // Track rendering state

// GP Files Browser State
let gpFiles = [];
let filteredFiles = [];
let currentFilter = 'scale-exercises';
let currentSort = 'name';
let searchQuery = '';

// DOM elements
const fileInput = document.getElementById('fileInput');
const fileInputContainer = document.getElementById('fileInputContainer');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const trackInfo = document.getElementById('trackInfo');
const trackControls = document.querySelector('.track-controls');
const tracksGrid = document.getElementById('tracksGrid');
const songTitle = document.getElementById('songTitle');
const songArtist = document.getElementById('songArtist');
const trackCount = document.getElementById('trackCount');
const horizontalControls = document.getElementById('horizontalControls');

// Track control buttons
const showAllTracks = document.getElementById('showAllTracks');
const hideAllTracks = document.getElementById('hideAllTracks');
const unmuteAllTracks = document.getElementById('unmuteAllTracks');
const unsoloAllTracks = document.getElementById('unsoloAllTracks');

// Print and download buttons
const printBtn = document.getElementById('printBtn');
const downloadBtn = document.getElementById('downloadBtn');
const scaleDiagramBtn = document.getElementById('scaleDiagramBtn');

// Current file tracking for download functionality
let currentFileData = null;
let currentFileName = null;

// Comprehensive scale patterns database - MOVED TO TOP TO FIX HOISTING ISSUE
const scalePatterns = {
    // Major Scale and Modes
    'C Major Scale and its Modes Using 1 shape': {
        patterns: [
            {
                name: 'C Ionian (Major)',
                notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
                frets: [8, 10, 12, 8, 10, 12, 9, 10, 12, 9, 10, 12, 10, 12, 8, 10, 12],
                strings: [6, 6, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 1, 1, 1],
                noteLabels: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'A', 'B', 'C', 'D', 'E']
            }
        ]
    },
    'C Ionian Mode': {
        patterns: [{
            name: 'C Ionian (Major Scale)',
            notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
            frets: [8, 10, 12, 8, 10, 12, 9, 10, 12, 9, 10, 12, 10, 12, 8, 10, 12],
            strings: [6, 6, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 1, 1, 1],
            noteLabels: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'A', 'B', 'C', 'D', 'E']
        }]
    },
    'C Dorian Mode': {
        patterns: [{
            name: 'C Dorian',
            notes: ['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb'],
            frets: [8, 10, 11, 8, 10, 12, 8, 10, 12, 9, 10, 12, 10, 11, 8, 10, 12],
            strings: [6, 6, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 1, 1, 1],
            noteLabels: ['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb', 'C', 'D', 'Eb', 'F', 'G', 'A', 'Bb', 'C', 'D', 'Eb']
        }]
    },
    'C Phrygian Mode': {
        patterns: [{
            name: 'C Phrygian',
            notes: ['C', 'Db', 'Eb', 'F', 'G', 'Ab', 'Bb'],
            frets: [8, 9, 11, 8, 10, 11, 8, 10, 12, 9, 10, 11, 10, 11, 8, 9, 11],
            strings: [6, 6, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 1, 1, 1],
            noteLabels: ['C', 'Db', 'Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'Db', 'Eb']
        }]
    },
    'C Lydian Mode': {
        patterns: [{
            name: 'C Lydian',
            notes: ['C', 'D', 'E', 'F#', 'G', 'A', 'B'],
            frets: [8, 10, 12, 9, 10, 12, 9, 10, 12, 9, 10, 12, 10, 12, 8, 10, 12],
            strings: [6, 6, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 1, 1, 1],
            noteLabels: ['C', 'D', 'E', 'F#', 'G', 'A', 'B', 'C', 'D', 'E', 'F#', 'G', 'A', 'B', 'C', 'D', 'E']
        }]
    },
    'C Mixolydian Mode': {
        patterns: [{
            name: 'C Mixolydian',
            notes: ['C', 'D', 'E', 'F', 'G', 'A', 'Bb'],
            frets: [8, 10, 12, 8, 10, 12, 9, 10, 12, 9, 10, 12, 10, 11, 8, 10, 12],
            strings: [6, 6, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 1, 1, 1],
            noteLabels: ['C', 'D', 'E', 'F', 'G', 'A', 'Bb', 'C', 'D', 'E', 'F', 'G', 'A', 'Bb', 'C', 'D', 'E']
        }]
    },
    'C Aeolian Mode': {
        patterns: [{
            name: 'C Aeolian (Natural Minor)',
            notes: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
            frets: [8, 10, 11, 8, 10, 11, 8, 10, 12, 9, 10, 11, 10, 11, 8, 10, 11],
            strings: [6, 6, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 1, 1, 1],
            noteLabels: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D', 'Eb']
        }]
    },
    'C Locrian Mode': {
        patterns: [{
            name: 'C Locrian',
            notes: ['C', 'Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb'],
            frets: [8, 9, 11, 8, 9, 11, 8, 10, 11, 9, 10, 11, 10, 11, 8, 9, 11],
            strings: [6, 6, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 1, 1, 1],
            noteLabels: ['C', 'Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C', 'Db', 'Eb']
        }]
    },
    // Harmonic Minor and related
    'C Harmonic Minor': {
        patterns: [{
            name: 'C Harmonic Minor',
            notes: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'B'],
            frets: [8, 10, 11, 8, 10, 11, 8, 10, 12, 9, 10, 11, 10, 12, 8, 10, 12],
            strings: [6, 6, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 1, 1, 1],
            noteLabels: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'B', 'C', 'D', 'Eb', 'F', 'G', 'Ab', 'B', 'C', 'D', 'Eb']
        }]
    },
    'C Phrygian Dominant ': {  // Note: includes space to match file
        patterns: [{
            name: 'C Phrygian Dominant',
            notes: ['C', 'Db', 'E', 'F', 'G', 'Ab', 'Bb'],
            frets: [8, 9, 12, 8, 10, 11, 8, 10, 12, 9, 12, 11, 10, 11, 8, 9, 12],
            strings: [6, 6, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 1, 1, 1],
            noteLabels: ['C', 'Db', 'E', 'F', 'G', 'Ab', 'Bb', 'C', 'Db', 'E', 'F', 'G', 'Ab', 'Bb', 'C', 'Db', 'E']
        }]
    },
    // Diminished Scales
    'C Diminished Scale': {  // NEW - matches the actual file name
        patterns: [{
            name: 'C Half-Whole Diminished',
            notes: ['C', 'Db', 'Eb', 'E', 'F#', 'G', 'A', 'Bb'],
            frets: [8, 9, 11, 12, 9, 10, 12, 11, 8, 9, 11, 12, 10, 11, 8, 9],
            strings: [6, 6, 6, 6, 5, 5, 5, 5, 4, 4, 4, 4, 2, 2, 1, 1],
            noteLabels: ['C', 'Db', 'Eb', 'E', 'F#', 'G', 'A', 'Bb', 'C', 'Db', 'Eb', 'E', 'A', 'Bb', 'C', 'Db']
        }]
    },
    'C Half - Whole Diminished Scale': {
        patterns: [{
            name: 'C Half-Whole Diminished',
            notes: ['C', 'Db', 'Eb', 'E', 'F#', 'G', 'A', 'Bb'],
            frets: [8, 9, 11, 12, 9, 10, 12, 11, 8, 9, 11, 12, 10, 11, 8, 9],
            strings: [6, 6, 6, 6, 5, 5, 5, 5, 4, 4, 4, 4, 2, 2, 1, 1],
            noteLabels: ['C', 'Db', 'Eb', 'E', 'F#', 'G', 'A', 'Bb', 'C', 'Db', 'Eb', 'E', 'A', 'Bb', 'C', 'Db']
        }]
    },
    'C Whole-Half Diminished Scale': {
        patterns: [{
            name: 'C Whole-Half Diminished',
            notes: ['C', 'D', 'Eb', 'F', 'F#', 'Ab', 'A', 'B'],
            frets: [8, 10, 11, 8, 9, 11, 12, 9, 8, 10, 11, 8, 10, 12, 8, 10],
            strings: [6, 6, 6, 5, 5, 5, 5, 4, 4, 4, 4, 3, 2, 2, 1, 1],
            noteLabels: ['C', 'D', 'Eb', 'F', 'F#', 'Ab', 'A', 'B', 'C', 'D', 'Eb', 'F', 'A', 'B', 'C', 'D']
        }]
    },
    // Chromatic
    'Chromatic Scale': {
        patterns: [{
            name: 'Chromatic Scale',
            notes: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
            frets: [8, 9, 10, 11, 12, 8, 9, 10, 11, 12, 8, 9, 10, 11, 12, 8, 9, 10, 11, 12],
            strings: [6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 3, 3, 3, 3, 3],
            noteLabels: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'E', 'F', 'F#', 'G', 'G#']
        }]
    }
};

// Initialize AlphaTab
function initializeAlphaTab() {
    try {
        console.log('Initializing AlphaTab...');
        
        // Check if AlphaTab is loaded
        if (typeof alphaTab === 'undefined') {
            console.error('AlphaTab library not loaded!');
            return;
        }
        
        // Get the container element
        const container = document.getElementById('alphaTab');
        if (!container) {
            console.error('AlphaTab container not found!');
            return;
        }
        
        console.log('Container found:', container);
        
        const settings = {
            player: {
                enablePlayer: true,
                soundFont: 'https://cdn.jsdelivr.net/npm/@coderline/alphatab@latest/dist/soundfont/sonivox.sf2',
                scrollElement: 'html,body',
                enableCursor: true,
                enableUserInteraction: true,
                enableAnimatedBeatCursor: true,
                scrollMode: 1, // Continuous scrolling
                scrollSpeed: 300, // Scroll animation speed
                scrollOffsetY: -20, // Minimal offset
                nativeBrowserSmoothScroll: false // Disable to avoid conflicts
            },
            display: {
                scale: 1.0,
                stretchForce: 1.0,
                layoutMode: 'page',
                staveProfile: 'default',
                resources: {
                    copyrightFont: 'bold 12px Arial',
                    titleFont: '32px serif',
                    subTitleFont: '20px serif',
                    wordsFont: '15px serif',
                    mainGlyphColor: '#000000',
                    secondaryGlyphColor: '#000000',
                    scoreInfoColor: '#000000',
                    staffLineColor: '#000000',
                    barSeparatorColor: '#000000',
                    tablatureColor: '#0066CC'
                }
            },
            core: {
                fontDirectory: 'https://cdn.jsdelivr.net/npm/@coderline/alphatab@latest/dist/font/',
                engine: 'html5',
                enableLazyLoading: false, // Disable lazy loading to ensure all content is rendered immediately
                tracks: [-1] // -1 means render all tracks by default
            }
        };
        
        console.log('Creating AlphaTab API with settings:', settings);
        api = new alphaTab.AlphaTabApi(container, settings);
        console.log('AlphaTab API created:', api);
        
        // Event listeners
        api.scoreLoaded.on((score) => {
            console.log('Score loaded successfully:', score.title, 'Tracks:', score.tracks.length);
            isRenderingComplete = false; // Reset rendering flag for new score
            updateTrackInfo(score);
            updateScoreForPrint(score);
            enablePlayerControls(true);
            setupScoreTouchControls(); // Enable mobile touch controls for play/pause on score
            // Don't call track control functions here - let AlphaTab render all tracks by default
        });
        
        api.renderStarted.on(() => {
            console.log('Rendering started...');
        });
        
        api.renderFinished.on(() => {
            console.log('Rendering finished - tab should be visible');
            isRenderingComplete = true;
            // Force a layout update
            setTimeout(() => {
                if (api && api.container) {
                    console.log('Container dimensions:', {
                        width: api.container.offsetWidth,
                        height: api.container.offsetHeight,
                        scrollHeight: api.container.scrollHeight
                    });
                }
            }, 100);
        });
        
        api.playerReady.on(() => {
            console.log('Player ready');
            isPlayerReady = true;
            
            // Apply any queued instrument changes
            setTimeout(() => {
                applyQueuedInstrumentChanges();
            }, 200); // Longer delay to ensure synthesizer is fully ready
        });
        
        api.playerStateChanged.on((e) => {
            console.log('Player state changed:', e.state);
            updatePlayerButtons(e.state);
            
            // Apply queued instrument changes when playback starts
            if (e.state === 1) { // PlayerState.Playing
                setTimeout(() => {
                    applyQueuedInstrumentChanges();
                }, 100); // Small delay to ensure synthesizer is ready
            }
        });
        
        // Enhanced playback cursor functionality with auto-scroll debugging
        api.playerPositionChanged.on((e) => {
            // Enhanced position tracking with scroll debugging
            if (e && e.currentTick !== undefined) {
                console.log('🎵 Playback position:', {
                    tick: e.currentTick,
                    timePosition: e.timePosition,
                    endTick: e.endTick,
                    scrollMode: api.settings?.player?.scrollMode || 'unknown',
                    scrollElement: api.settings?.player?.scrollElement || 'unknown'
                });
                
                // Log when we might be reaching a new bar/line
                if (e.currentTick % 960 === 0) { // Assuming 960 ticks per quarter note
                    console.log('🎼 Potential new bar reached at tick:', e.currentTick);
                }
            }
        });
        
        api.error.on((error) => {
            console.error('AlphaTab Error:', error);
        });
        
        console.log('AlphaTab initialization complete');
        
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

// Load file from input
function loadFile(file) {
    if (!api) {
        return;
    }
    
    try {
        console.log('File details:', {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified)
        });
        
        // Store file info for download functionality
        currentFileName = file.name;
        
        // Read file as ArrayBuffer for better debugging
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const arrayBuffer = e.target.result;
                console.log('File loaded as ArrayBuffer, size:', arrayBuffer.byteLength);
                
                // Store the file data for download functionality
                currentFileData = new Uint8Array(arrayBuffer);
                
                // Enable download button
                downloadBtn.disabled = false;
                
                // Check file header for GP files
                const headerView = new Uint8Array(arrayBuffer, 0, Math.min(50, arrayBuffer.byteLength));
                const headerString = String.fromCharCode.apply(null, headerView);
                console.log('File header (first 50 bytes):', headerString);
                
                api.load(arrayBuffer);
            } catch (loadError) {
                console.error('Error loading file into player:', loadError);
            }
        };
        reader.onerror = function() {
            console.error('Failed to read file');
        };
        reader.readAsArrayBuffer(file);
        
    } catch (error) {
        console.error('Load error:', error);
    }
}

// GP Files Browser Functions
function initializeGpFilesBrowser() {
    console.log('Initializing GP Files Browser...');
    
    // Load files from the GP Files directory
    loadGpFilesFromDirectory();
    
    setupFilesBrowserEventListeners();
}

function setupFilesBrowserEventListeners() {
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active filter button
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            currentFilter = e.target.dataset.filter;
            applyFiltersAndSort();
        });
    });
    
    // Search input
    const searchInput = document.getElementById('fileSearch');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        applyFiltersAndSort();
    });
    
    // Sort dropdown
    const sortToggle = document.getElementById('sortToggle');
    let isAscending = true; // Track current sort direction
    
    sortToggle.addEventListener('click', (e) => {
        isAscending = !isAscending;
        currentSort = isAscending ? 'name' : 'name-desc';
        sortToggle.textContent = isAscending ? 'A-Z' : 'Z-A';
        applyFiltersAndSort();
    });
}

function applyFiltersAndSort() {
    // Apply filters
    filteredFiles = gpFiles.filter(file => {
        // Category filter - now only filters by specific category (no 'all' option)
        const categoryMatch = file.category === currentFilter;
        
        // Search filter
        const searchMatch = searchQuery === '' || 
            file.name.toLowerCase().includes(searchQuery) ||
            file.category.toLowerCase().includes(searchQuery);
        
        return categoryMatch && searchMatch;
    });
    
    // Apply sorting
    sortFiles();
    
    // Update display
    updateFilesList();
}

function sortFiles() {
    filteredFiles.sort((a, b) => {
        switch (currentSort) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'date':
                return b.dateModified - a.dateModified;
            case 'size':
                return parseFloat(a.size) - parseFloat(b.size);
            default:
                return 0;
        }
    });
}

function updateFilesList() {
    const filesList = document.getElementById('filesList');
    const emptyState = document.getElementById('filesEmptyState');
    
    if (filteredFiles.length === 0) {
        filesList.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    filesList.style.display = 'block';
    emptyState.style.display = 'none';
    
    filesList.innerHTML = filteredFiles.map(file => createFileItemHTML(file)).join('');
    
    // Add click event listeners to file items to load files directly
    const fileItems = filesList.querySelectorAll('.file-item');
    fileItems.forEach((item, index) => {
        const file = filteredFiles[index];
        item.addEventListener('click', () => {
            // Add visual feedback
            selectFile(file);
            // Load the file directly
            loadGpFile(file.id);
        });
        
        // Add hover effect with cursor pointer
        item.style.cursor = 'pointer';
    });
}

function createFileItemHTML(file) {
    const icon = getFileIcon(file.category);
    const categoryLabel = getCategoryLabel(file.category);
    
    // Remove file extension for display (.gp, .gp3, .gp4, .gp5, .gpx, .gp6, .gp7)
    const displayName = file.name.replace(/\.(gp[3-7x]?|GP[3-7X]?)$/i, '');
    
    return `
        <div class="file-item" data-file-id="${file.id}">
            <div class="file-icon">${icon}</div>
            <div class="file-info">
                <div class="file-name">${displayName}</div>
                <div class="file-meta">
                    <span class="file-category ${file.category}">${categoryLabel}</span>
                </div>
            </div>
        </div>
    `;
}

function getFileIcon(category) {
    switch (category) {
        case 'scale-exercises':
            return '🎯';
        case 'licks':
            return '🎸';
        case 'chord-progressions':
            return '🎵';
        case 'songs':
            return '🎤';
        case 'arpeggios':
            return '🎼';
        default:
            return '📄';
    }
}

function getCategoryLabel(category) {
    switch (category) {
        case 'scale-exercises':
            return 'Scales';
        case 'licks':
            return 'Licks';
        case 'chord-progressions':
            return 'Chord Progressions';
        case 'songs':
            return 'Songs';
        case 'arpeggios':
            return 'Arpeggios';
        default:
            return 'Other';
    }
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function selectFile(file) {
    // Remove previous selection
    const prevSelected = document.querySelector('.file-item.selected');
    if (prevSelected) {
        prevSelected.classList.remove('selected');
    }
    
    // Add selection to current file
    const currentItem = document.querySelector(`[data-file-id="${file.id}"]`);
    if (currentItem) {
        currentItem.classList.add('selected');
    }
}

async function loadGpFile(fileId) {
    try {
        const file = gpFiles.find(f => f.id === fileId);
        if (!file) {
            console.error('File not found:', fileId);
            return;
        }

        console.log('Loading GP file:', file.name);
        
        // Store file info for download functionality
        currentFileName = file.name;
        
        // Show loading state
        const fileItem = document.querySelector(`[data-file-id="${fileId}"]`);
        if (fileItem) {
            fileItem.style.opacity = '0.6';
            fileItem.style.pointerEvents = 'none';
        }

        // Properly encode the file path for URLs with spaces and special characters
        const encodedPath = file.path.split('/').map(segment => encodeURIComponent(segment)).join('/');
        console.log('Encoded path:', encodedPath);

        // Fetch the actual file
        const response = await fetch(encodedPath);
        if (!response.ok) {
            throw new Error(`Failed to load file: ${response.status} ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Store the file data for download functionality
        currentFileData = uint8Array;
        
        // Enable download button
        downloadBtn.disabled = false;
        
        // Create a File object for AlphaTab
        const fileBlob = new File([uint8Array], file.name, {
            type: 'application/octet-stream'
        });
        
        // Load the file using the existing loadFile function
        await loadFile(fileBlob);
        
        // Update file input display
        updateFileInputDisplay(file.name);
        
        console.log('GP file loaded successfully:', file.name);
        
    } catch (error) {
        console.error('Error loading GP file:', error);
        alert(`Failed to load file: ${error.message}`);
    } finally {
        // Restore file item state
        const fileItem = document.querySelector(`[data-file-id="${fileId}"]`);
        if (fileItem) {
            fileItem.style.opacity = '';
            fileItem.style.pointerEvents = '';
        }
    }
}

// Update track info display
function updateTrackInfo(score) {
    // Enhanced metadata extraction
    const metadata = extractComprehensiveMetadata(score);
    
    songTitle.textContent = metadata.title;
    songArtist.textContent = metadata.artist;
    trackCount.textContent = `Tracks: ${score.tracks.length}`;
    
    // Log all available metadata for debugging
    console.log('Complete score metadata:', {
        title: score.title,
        artist: score.artist,
        album: score.album,
        words: score.words,
        music: score.music,
        copyright: score.copyright,
        tab: score.tab,
        instructions: score.instructions,
        notices: score.notices,
        masterVolume: score.masterVolume,
        tempo: score.tempo
    });
    
    // Initialize track controls but don't interfere with initial rendering
    initializeTrackStates(score);
    createTrackControls(score);
    
    trackInfo.style.display = 'block';
    
    // Scroll to track info section to show the selected file title at the top
    setTimeout(() => {
        trackInfo.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }, 100); // Small delay to ensure the track info is visible before scrolling
}

// Extract comprehensive metadata from Guitar Pro file
function extractComprehensiveMetadata(score) {
    let title = 'Unknown Title';
    let artist = 'Unknown Artist';
    
    // Extract title
    if (score.title && score.title.trim()) {
        title = score.title.trim();
    }
    
    // Extract artist information with multiple sources
    const artistInfo = [];
    
    // Check for composer/music information
    if (score.music && score.music.trim()) {
        artistInfo.push(`Music: ${score.music.trim()}`);
    }
    
    // Check for lyricist/words information
    if (score.words && score.words.trim()) {
        artistInfo.push(`Words: ${score.words.trim()}`);
    }
    
    // Check for arranger information
    if (score.artist && score.artist.trim()) {
        artistInfo.push(`Arranged: ${score.artist.trim()}`);
    }
    
    // Check for copyright information
    if (score.copyright && score.copyright.trim()) {
        artistInfo.push(`© ${score.copyright.trim()}`);
    }
    
    // Check for tab information (often contains arranger info)
    if (score.tab && score.tab.trim()) {
        artistInfo.push(`Tab: ${score.tab.trim()}`);
    }
    
    // If we have detailed info, use it; otherwise fall back to basic artist
    if (artistInfo.length > 0) {
        artist = artistInfo.join(' | ');
    } else if (score.artist && score.artist.trim()) {
        artist = score.artist.trim();
    }
    
    return { title, artist };
}

// Enable/disable player controls
function enablePlayerControls(enabled) {
    playBtn.disabled = !enabled;
    pauseBtn.disabled = !enabled;
    stopBtn.disabled = !enabled;
    // Download button is enabled based on file loading, not player state
    horizontalControls.style.display = enabled ? 'flex' : 'none';
}

// Update player button states
function updatePlayerButtons(state) {
    const isPlaying = state === 1; // PlayerState.Playing
    const isPaused = state === 2;  // PlayerState.Paused
    
    playBtn.disabled = isPlaying;
    pauseBtn.disabled = !isPlaying;
    stopBtn.disabled = state === 0; // PlayerState.Paused
}

// Track control functions
function initializeTrackStates(score) {
    trackStates = {};
    score.tracks.forEach((track, index) => {
        trackStates[index] = {
            visible: true,
            muted: false,
            solo: false
        };
    });
}

function createTrackControls(score) {
    tracksGrid.innerHTML = '';
    
    score.tracks.forEach((track, index) => {
        const trackItem = document.createElement('div');
        trackItem.className = 'track-control';
        trackItem.setAttribute('data-track-index', index);
        
        // Enhanced track name detection with multiple fallbacks
        const trackName = getTrackName(track, index);
        
        // Enhanced instrument detection with multiple fallbacks
        const instrumentInfo = getInstrumentInfo(track, index);
        
        trackItem.innerHTML = `
            <div class="track-header">
                <div class="track-title-section">
                <div class="track-name">${trackName}</div>
                    <div class="track-program-info">
                        <span class="instrument-name">${instrumentInfo}</span>
            </div>
            </div>
                <div class="track-buttons">
                    <button class="visibility-btn active" data-action="visibility" data-track="${index}" title="Show/Hide Track">
                        👁️
                    </button>
                    <button class="solo-btn" data-action="solo" data-track="${index}" title="Solo Track">
                        S
                    </button>
                    <button class="mute-btn" data-action="mute" data-track="${index}" title="Mute Track">
                        M
                    </button>
                </div>
            </div>
            <div class="track-details">
                <div class="track-sound-info">
                    <div class="sound-param volume-control">
                        <div class="param-label">Volume</div>
                        <div class="volume-slider-container">
                            <input type="range" class="volume-slider" min="0" max="100" value="80" data-track="${index}">
                            <span class="volume-display">80%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        tracksGrid.appendChild(trackItem);
    });
    
    // Add event listeners to track buttons
    tracksGrid.addEventListener('click', handleTrackButtonClick);
    
    // Add event listeners to volume sliders
    tracksGrid.addEventListener('input', handleVolumeChange);
    
    trackControls.style.display = 'block';
}

function handleTrackButtonClick(event) {
    // Check if the clicked element is one of the track control buttons
    const isTrackButton = event.target.classList.contains('visibility-btn') ||
                         event.target.classList.contains('solo-btn') ||
                         event.target.classList.contains('mute-btn');
    
    if (!isTrackButton) return;
    
    const action = event.target.getAttribute('data-action');
    const trackIndex = parseInt(event.target.getAttribute('data-track'));
    
    switch (action) {
        case 'visibility':
            toggleTrackVisibility(trackIndex);
            break;
        case 'solo':
            toggleTrackSolo(trackIndex);
            break;
        case 'mute':
            toggleTrackMute(trackIndex);
            break;
    }
}

function toggleTrackVisibility(trackIndex) {
    const state = trackStates[trackIndex];
    state.visible = !state.visible;
    
    // Update AlphaTab track visibility using the correct API
    if (api && api.score) {
        // Get all visible track indexes
        const visibleTracks = Object.keys(trackStates)
            .map(index => parseInt(index))
            .filter(index => trackStates[index].visible);
        
        if (visibleTracks.length > 0) {
            // Use renderScore with track indexes (not renderTracks)
            api.renderScore(api.score, visibleTracks);
        } else {
            // If no tracks would be visible, keep this one visible
            state.visible = true;
            api.renderScore(api.score, [trackIndex]);
        }
    }
    
    updateTrackUI(trackIndex);
}

function toggleTrackSolo(trackIndex) {
    const state = trackStates[trackIndex];
    state.solo = !state.solo;
    
    // If soloing this track, unmute it
    if (state.solo) {
        state.muted = false;
    }
    
    // Update audio playback
    updateAudioPlayback();
    updateTrackUI(trackIndex);
}

function toggleTrackMute(trackIndex) {
    const state = trackStates[trackIndex];
    state.muted = !state.muted;
    
    // If muting this track, unsolo it
    if (state.muted) {
        state.solo = false;
    }
    
    // Update audio playback
    updateAudioPlayback();
    updateTrackUI(trackIndex);
}

function updateAudioPlayback() {
    if (!api || !isPlayerReady) return;
    
    // Check if any tracks are soloed
    const soloedTracks = Object.keys(trackStates).filter(index => trackStates[index].solo);
    
    Object.keys(trackStates).forEach(index => {
        const trackIndex = parseInt(index);
        const state = trackStates[trackIndex];
        
        if (soloedTracks.length > 0) {
            // If there are soloed tracks, only play soloed tracks
            api.changeTrackVolume([trackIndex], state.solo ? 1 : 0);
        } else {
            // If no tracks are soloed, respect mute settings
            api.changeTrackVolume([trackIndex], state.muted ? 0 : 1);
        }
    });
}

function updateTrackUI(trackIndex) {
    const trackItem = document.querySelector(`[data-track-index="${trackIndex}"]`);
    if (!trackItem) return;
    
    const state = trackStates[trackIndex];
    const visibilityBtn = trackItem.querySelector('[data-action="visibility"]');
    const soloBtn = trackItem.querySelector('[data-action="solo"]');
    const muteBtn = trackItem.querySelector('[data-action="mute"]');
    
    // Update visibility button
    if (state.visible) {
        visibilityBtn.classList.add('active');
        visibilityBtn.textContent = '👁️';
        visibilityBtn.title = 'Hide Track';
    } else {
        visibilityBtn.classList.remove('active');
        visibilityBtn.textContent = '🙈';
        visibilityBtn.title = 'Show Track';
    }
    
    // Update solo button
    if (state.solo) {
        soloBtn.classList.add('active');
        soloBtn.textContent = 'S';
        soloBtn.title = 'Unsolo Track';
    } else {
        soloBtn.classList.remove('active');
        soloBtn.textContent = 'S';
        soloBtn.title = 'Solo Track';
    }
    
    // Update mute button
    if (state.muted) {
        muteBtn.classList.add('active');
        muteBtn.textContent = 'M';
        muteBtn.title = 'Unmute Track';
    } else {
        muteBtn.classList.remove('active');
        muteBtn.textContent = 'M';
        muteBtn.title = 'Mute Track';
    }
    
    // Update track item appearance
    trackItem.classList.toggle('muted', state.muted);
    trackItem.classList.toggle('solo', state.solo);
}

// Bulk track control functions
function showAllTracksFunction() {
    Object.keys(trackStates).forEach(index => {
        const trackIndex = parseInt(index);
        trackStates[trackIndex].visible = true;
        updateTrackUI(trackIndex);
    });
    
    // Render all tracks using renderScore
    if (api && api.score) {
        const allTracks = Object.keys(trackStates).map(index => parseInt(index));
        api.renderScore(api.score, allTracks);
    }
}

function hideAllTracksFunction() {
    // Don't allow hiding all tracks - keep at least one visible
    const trackIndices = Object.keys(trackStates).map(index => parseInt(index));
    if (trackIndices.length === 0) return;
    
    // Hide all except the first track
    trackIndices.forEach((trackIndex, i) => {
        trackStates[trackIndex].visible = i === 0;
        updateTrackUI(trackIndex);
    });
    
    // Render only the first track using renderScore
    if (api && api.score) {
        api.renderScore(api.score, [trackIndices[0]]);
    }
}

function unmuteAllTracksFunction() {
    Object.keys(trackStates).forEach(index => {
        const trackIndex = parseInt(index);
        trackStates[trackIndex].muted = false;
        updateTrackUI(trackIndex);
    });
    updateAudioPlayback();
}

function unsoloAllTracksFunction() {
    Object.keys(trackStates).forEach(index => {
        const trackIndex = parseInt(index);
        trackStates[trackIndex].solo = false;
        updateTrackUI(trackIndex);
    });
    updateAudioPlayback();
}

// Update file input display
function updateFileInputDisplay(fileName) {
    const fileInputText = document.querySelector('.file-input-text');
    const fileInputIcon = document.querySelector('.file-input-icon');
    
    if (fileName) {
        fileInputContainer.classList.add('has-file');
        fileInputText.textContent = 'File Selected';
        fileInputIcon.textContent = '✅';
        fileNameDisplay.textContent = fileName;
        fileNameDisplay.style.display = 'block';
    } else {
        fileInputContainer.classList.remove('has-file');
        fileInputText.textContent = 'Choose Guitar Pro File';
        fileInputIcon.textContent = '📁';
        fileNameDisplay.style.display = 'none';
    }
}

// Event listeners setup
function setupEventListeners() {
    // File input
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            updateFileInputDisplay(file.name);
            loadFile(file);
        } else {
            updateFileInputDisplay(null);
        }
    });
    
    // Player controls
    playBtn.addEventListener('click', () => {
        if (api && isPlayerReady) {
            api.playPause();
        }
    });
    
    pauseBtn.addEventListener('click', () => {
        if (api && isPlayerReady) {
            api.playPause();
        }
    });
    
    stopBtn.addEventListener('click', () => {
        if (api && isPlayerReady) {
            api.stop();
        }
    });
    
    // Volume control
    volumeSlider.addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value) / 100; // Convert percentage to decimal
        volumeValue.textContent = `${e.target.value}%`;
        if (api && isPlayerReady) {
            api.masterVolume = volume;
        }
    });
    
    // Speed control
    speedSlider.addEventListener('input', (e) => {
        const speed = parseFloat(e.target.value) / 100; // Convert percentage to decimal
        speedValue.textContent = `${e.target.value}%`;
        if (api && isPlayerReady) {
            api.playbackSpeed = speed;
        }
    });
    
    // Speed slider double-click to reset to 100%
    speedSlider.addEventListener('dblclick', () => {
        speedSlider.value = 100;
        speedValue.textContent = '100%';
        if (api && isPlayerReady) {
            api.playbackSpeed = 1.0;
        }
    });
    
    // Bulk track control event listeners
    showAllTracks.addEventListener('click', showAllTracksFunction);
    hideAllTracks.addEventListener('click', hideAllTracksFunction);
    unmuteAllTracks.addEventListener('click', unmuteAllTracksFunction);
    unsoloAllTracks.addEventListener('click', unsoloAllTracksFunction);
    
    // Print and download button event listeners
    printBtn.addEventListener('click', printTab);
    downloadBtn.addEventListener('click', downloadCurrentFile);
    
    // Global keyboard controls
    document.addEventListener('keydown', (e) => {
        // Spacebar for play/pause
        if (e.code === 'Space') {
            // Only prevent spacebar if not typing in input fields
            const activeElement = document.activeElement;
            const isTyping = activeElement && activeElement.matches('input[type="text"], input[type="search"], textarea');
            
            // Allow spacebar to work everywhere except when typing
            if (!isTyping && api && isPlayerReady) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Spacebar triggered play/pause');
                api.playPause();
            }
        }
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Ensure scale diagram modal is closed on page load
    const modal = document.getElementById('scaleDiagramModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    initializeAlphaTab();
    setupEventListeners();
    initializeGpFilesBrowser(); // Initialize GP Files Browser
    initializeScaleDiagrams(); // Initialize Scale Diagrams
    
    // Initialize loop system
    loopSystem.initialize();
});

// Enhanced track name detection
function getTrackName(track, index) {
    // Log all available track properties for debugging
    console.log(`Track ${index} properties:`, {
        name: track.name,
        shortName: track.shortName,
        playbackInfo: track.playbackInfo,
        channel: track.channel,
        staves: track.staves?.length,
        color: track.color,
        percussionTrack: track.percussionTrack
    });
    
    // Try multiple properties for track name
    let trackName = '';
    
    // Primary sources for track name
    if (track.name && track.name.trim()) {
        trackName = track.name.trim();
        console.log(`Using track.name: "${trackName}"`);
    } else if (track.shortName && track.shortName.trim()) {
        trackName = track.shortName.trim();
        console.log(`Using track.shortName: "${trackName}"`);
    } else if (track.playbackInfo && track.playbackInfo.name && track.playbackInfo.name.trim()) {
        trackName = track.playbackInfo.name.trim();
        console.log(`Using track.playbackInfo.name: "${trackName}"`);
    }
    
    // Try additional sources
    if (!trackName && track.channel && track.channel.name && track.channel.name.trim()) {
        trackName = track.channel.name.trim();
        console.log(`Using track.channel.name: "${trackName}"`);
    }
    
    // If still no name, try to construct from instrument info
    if (!trackName) {
        const instrumentName = getInstrumentName(track);
        if (instrumentName && instrumentName !== 'Unknown') {
            trackName = instrumentName;
            console.log(`Using instrument name: "${trackName}"`);
        }
    }
    
    // Final fallback
    if (!trackName) {
        trackName = `Track ${index + 1}`;
        console.log(`Using fallback: "${trackName}"`);
    }
    
    return trackName;
}

// Enhanced instrument information detection
function getInstrumentInfo(track, index) {
    const instrumentName = getInstrumentName(track);
    const channelInfo = getChannelInfo(track, index);
    const additionalInfo = getAdditionalTrackInfo(track);
    
    let infoString = `Instrument: ${instrumentName}`;
    
    if (channelInfo) {
        infoString += ` | ${channelInfo}`;
    }
    
    if (additionalInfo) {
        infoString += ` | ${additionalInfo}`;
    }
    
    return infoString;
}

// Get instrument name with multiple fallbacks
function getInstrumentName(track) {
    let instrumentName = 'Unknown';
    
    // Log playback info for debugging
    if (track.playbackInfo) {
        console.log('Track playbackInfo:', {
            program: track.playbackInfo.program,
            primaryChannel: track.playbackInfo.primaryChannel,
            secondaryChannel: track.playbackInfo.secondaryChannel,
            isPercussionTrack: track.playbackInfo.isPercussionTrack,
            instrumentName: track.playbackInfo.instrumentName,
            volume: track.playbackInfo.volume,
            balance: track.playbackInfo.balance
        });
    }
    
    // Try different sources for instrument name
    if (track.playbackInfo) {
        const playback = track.playbackInfo;
        
        // Try explicit instrument name first
        if (playback.instrumentName && playback.instrumentName.trim()) {
            instrumentName = playback.instrumentName.trim();
            console.log(`Using explicit instrument name: "${instrumentName}"`);
            return instrumentName;
        }
        
        // Try percussion channel detection
        if (playback.isPercussionTrack || playback.primaryChannel === 9 || playback.secondaryChannel === 9) {
            instrumentName = 'Drums/Percussion';
            console.log(`Detected percussion track`);
            return instrumentName;
        }
        
        // Try program number mapping to General MIDI
        if (typeof playback.program === 'number') {
            instrumentName = getGeneralMidiInstrumentName(playback.program);
            console.log(`Using GM program ${playback.program}: "${instrumentName}"`);
            return instrumentName;
        }
    }
    
    // Try channel-based detection
    if (instrumentName === 'Unknown' && track.channel) {
        console.log('Track channel info:', track.channel);
        if (track.channel.channel1 === 9 || track.channel.channel2 === 9) {
            instrumentName = 'Drums/Percussion';
            console.log(`Detected percussion via channel`);
            return instrumentName;
        } else if (typeof track.channel.instrument1 === 'number') {
            instrumentName = getGeneralMidiInstrumentName(track.channel.instrument1);
            console.log(`Using channel instrument ${track.channel.instrument1}: "${instrumentName}"`);
            return instrumentName;
        }
    }
    
    // Try staff-based detection for guitar tracks
    if (instrumentName === 'Unknown' && track.staves && track.staves.length > 0) {
        const staff = track.staves[0];
        console.log('Staff info:', {
            tuning: staff.tuning,
            capo: staff.capo,
            stringCount: staff.tuning?.length
        });
        
        if (staff.tuning && staff.tuning.length >= 6) {
            instrumentName = 'Guitar';
            console.log(`Detected guitar via tuning (${staff.tuning.length} strings)`);
            return instrumentName;
        } else if (staff.tuning && staff.tuning.length === 4) {
            instrumentName = 'Bass Guitar';
            console.log(`Detected bass via tuning (${staff.tuning.length} strings)`);
            return instrumentName;
        }
    }
    
    console.log(`No instrument detected, using: "${instrumentName}"`);
    return instrumentName;
}

// Get channel information
function getChannelInfo(track, index) {
    let channelInfo = '';
    
    if (track.playbackInfo) {
        const primary = track.playbackInfo.primaryChannel;
        const secondary = track.playbackInfo.secondaryChannel;
        
        if (typeof primary === 'number') {
            channelInfo = `Ch: ${primary + 1}`;
            if (typeof secondary === 'number' && secondary !== primary) {
                channelInfo += `/${secondary + 1}`;
            }
        }
    } else if (track.channel) {
        const ch1 = track.channel.channel1;
        const ch2 = track.channel.channel2;
        
        if (typeof ch1 === 'number') {
            channelInfo = `Ch: ${ch1 + 1}`;
            if (typeof ch2 === 'number' && ch2 !== ch1) {
                channelInfo += `/${ch2 + 1}`;
            }
        }
    }
    
    if (!channelInfo) {
        channelInfo = `Ch: ${index + 1}`;
    }
    
    return channelInfo;
}

// Get additional track information
function getAdditionalTrackInfo(track) {
    const info = [];
    
    // String count for stringed instruments
    if (track.staves && track.staves.length > 0) {
        const staff = track.staves[0];
        if (staff.tuning && staff.tuning.length > 0) {
            info.push(`${staff.tuning.length} strings`);
        }
        
        // Capo information
        if (staff.capo && staff.capo > 0) {
            info.push(`Capo: ${staff.capo}`);
        }
    }
    
    // Volume information
    if (track.playbackInfo && typeof track.playbackInfo.volume === 'number') {
        const volume = Math.round((track.playbackInfo.volume / 16) * 100);
        if (volume !== 100) {
            info.push(`Vol: ${volume}%`);
        }
    }
    
    return info.length > 0 ? info.join(' | ') : '';
}

// General MIDI instrument mapping (simplified version)
function getGeneralMidiInstrumentName(program) {
    const instruments = {
        // Piano Family (0-7)
        0: 'Acoustic Grand Piano', 1: 'Bright Acoustic Piano', 2: 'Electric Grand Piano', 3: 'Honky-tonk Piano',
        4: 'Electric Piano 1', 5: 'Electric Piano 2', 6: 'Harpsichord', 7: 'Clavinet',
        
        // Chromatic Percussion (8-15)
        8: 'Celesta', 9: 'Glockenspiel', 10: 'Music Box', 11: 'Vibraphone',
        12: 'Marimba', 13: 'Xylophone', 14: 'Tubular Bells', 15: 'Dulcimer',
        
        // Organ (16-23)
        16: 'Drawbar Organ', 17: 'Percussive Organ', 18: 'Rock Organ', 19: 'Church Organ',
        20: 'Reed Organ', 21: 'Accordion', 22: 'Harmonica', 23: 'Tango Accordion',
        
        // Guitar (24-31)
        24: 'Acoustic Guitar (nylon)', 25: 'Acoustic Guitar (steel)', 26: 'Electric Guitar (jazz)', 27: 'Electric Guitar (clean)',
        28: 'Electric Guitar (muted)', 29: 'Overdriven Guitar', 30: 'Distortion Guitar', 31: 'Guitar Harmonics',
        
        // Bass (32-39)
        32: 'Acoustic Bass', 33: 'Electric Bass (finger)', 34: 'Electric Bass (pick)', 35: 'Fretless Bass',
        36: 'Slap Bass 1', 37: 'Slap Bass 2', 38: 'Synth Bass 1', 39: 'Synth Bass 2',
        
        // Strings (40-47)
        40: 'Violin', 41: 'Viola', 42: 'Cello', 43: 'Contrabass',
        44: 'Tremolo Strings', 45: 'Pizzicato Strings', 46: 'Orchestral Harp', 47: 'Timpani',
        
        // Ensemble (48-55)
        48: 'String Ensemble 1', 49: 'String Ensemble 2', 50: 'Synth Strings 1', 51: 'Synth Strings 2',
        52: 'Choir Aahs', 53: 'Voice Oohs', 54: 'Synth Voice', 55: 'Orchestra Hit',
        
        // Brass (56-63)
        56: 'Trumpet', 57: 'Trombone', 58: 'Tuba', 59: 'Muted Trumpet',
        60: 'French Horn', 61: 'Brass Section', 62: 'Synth Brass 1', 63: 'Synth Brass 2',
        
        // Reed (64-71)
        64: 'Soprano Sax', 65: 'Alto Sax', 66: 'Tenor Sax', 67: 'Baritone Sax',
        68: 'Oboe', 69: 'English Horn', 70: 'Bassoon', 71: 'Clarinet',
        
        // Pipe (72-79)
        72: 'Piccolo', 73: 'Flute', 74: 'Recorder', 75: 'Pan Flute',
        76: 'Blown Bottle', 77: 'Shakuhachi', 78: 'Whistle', 79: 'Ocarina',
        
        // Synth Lead (80-87)
        80: 'Lead 1 (square)', 81: 'Lead 2 (sawtooth)', 82: 'Lead 3 (calliope)', 83: 'Lead 4 (chiff)',
        84: 'Lead 5 (charang)', 85: 'Lead 6 (voice)', 86: 'Lead 7 (fifths)', 87: 'Lead 8 (bass + lead)',
        
        // Synth Pad (88-95)
        88: 'Pad 1 (new age)', 89: 'Pad 2 (warm)', 90: 'Pad 3 (polysynth)', 91: 'Pad 4 (choir)',
        92: 'Pad 5 (bowed)', 93: 'Pad 6 (metallic)', 94: 'Pad 7 (halo)', 95: 'Pad 8 (sweep)',
        
        // Synth Effects (96-103)
        96: 'FX 1 (rain)', 97: 'FX 2 (soundtrack)', 98: 'FX 3 (crystal)', 99: 'FX 4 (atmosphere)',
        100: 'FX 5 (brightness)', 101: 'FX 6 (goblins)', 102: 'FX 7 (echoes)', 103: 'FX 8 (sci-fi)',
        
        // Ethnic (104-111)
        104: 'Sitar', 105: 'Banjo', 106: 'Shamisen', 107: 'Koto',
        108: 'Kalimba', 109: 'Bag pipe', 110: 'Fiddle', 111: 'Shanai',
        
        // Percussive (112-119)
        112: 'Tinkle Bell', 113: 'Agogo', 114: 'Steel Drums', 115: 'Woodblock',
        116: 'Taiko Drum', 117: 'Melodic Tom', 118: 'Synth Drum', 119: 'Reverse Cymbal',
        
        // Sound Effects (120-127)
        120: 'Guitar Fret Noise', 121: 'Breath Noise', 122: 'Seashore', 123: 'Bird Tweet',
        124: 'Telephone Ring', 125: 'Helicopter', 126: 'Applause', 127: 'Gunshot'
    };
    
    return instruments[program] || `Program ${program}`;
}

// Loop Functionality System
class LoopSystem {
    constructor() {
        this.isLooping = false;
        this.isSelectionMode = false;
        this.startBar = 1;
        this.endBar = 1;
        this.loopInterval = null;
        this.currentPosition = 0;
        this.barDuration = 0;
        this.isInitialized = false;
        this.originalBeatMouseDownHandler = null;
        this.currentRange = null; // Store the current loop range
        this.loopStartTime = 0; // Track when loop started for timing
        this.lastLogTime = null; // Track last log time for throttled logging
        this.currentSelection = null; // Store the visual selection data
    }

    // Initialize loop system
    initialize() {
        if (this.isInitialized) return;
        
        this.loopButton = document.getElementById('loopBtn');
        if (!this.loopButton) {
            console.error('Loop button not found');
            return;
        }

        // Add event listener
        this.loopButton.addEventListener('click', () => this.toggleLoopMode());
        
        // Setup selection handlers when API is available
        if (api) {
            this.setupSelectionHandlers();
        } else {
            // Wait for API to be ready
            const checkApi = () => {
                if (api) {
                    this.setupSelectionHandlers();
                } else {
                    setTimeout(checkApi, 100);
                }
            };
            checkApi();
        }

        this.isInitialized = true;
        console.log('Loop system initialized with AlphaTab selection');
    }

    // Setup AlphaTab selection event handlers
    setupSelectionHandlers() {
        if (!api) return;

        // Listen for beat mouse up to detect when selection is complete
        api.beatMouseUp.on((beat) => {
            if (this.isSelectionMode && beat) {
                console.log('Beat mouse up detected in selection mode:', beat);
                // Check if AlphaTab has created a playback range
                setTimeout(() => {
                    if (api.playbackRange) {
                        console.log('Selection detected, starting loop with AlphaTab range');
                        this.startLoopWithAlphaTabRange();
                    } else {
                        console.log('Single beat clicked, using default range');
                        this.startLoopFromBeat(beat);
                    }
                }, 100); // Small delay to let AlphaTab process the selection
            }
        });

        // Listen for player position changes to handle looping
        api.playerPositionChanged.on((e) => {
            if (this.isLooping && this.currentRange) {
                this.checkLoopPosition(e.currentTime);
            }
        });

        // Listen for player state changes to handle when playback stops
        api.playerStateChanged.on((e) => {
            if (this.isLooping && e.state === 0) { // PlayerState.Paused
                // If we're looping and playback stopped, restart from beginning of selection
                setTimeout(() => {
                    if (this.isLooping && this.currentRange) {
                        console.log('Playback stopped, restarting loop');
                        api.tickPosition = this.currentRange.startTick;
                        api.playPause();
                    }
                }, 100);
            }
        });

        console.log('Selection handlers setup complete');
    }

    // Toggle loop mode (selection mode)
    toggleLoopMode() {
        if (!api || !currentScore) {
            console.log('No score loaded for looping');
            return;
        }

        if (this.isLooping) {
            this.stopLoop();
        } else {
            this.enterSelectionMode();
        }
    }

    // Enter selection mode
    enterSelectionMode() {
        this.isSelectionMode = true;
        this.updateLoopButton();
        
        // Show instruction message
        this.showSelectionMessage();
        
        console.log('Loop selection mode activated - click and drag to select range');
    }

    // Start loop with AlphaTab's native playback range
    startLoopWithAlphaTabRange() {
        if (!api || !api.playbackRange) return;

        const range = api.playbackRange;
        this.currentRange = range; // Store the range for loop checking
        this.isLooping = true;
        this.isSelectionMode = false;
        this.loopStartTime = Date.now();
        
        // Start playback if not already playing
        if (api.playerState !== 1) { // Not playing
            api.tickPosition = range.startTick; // Start from beginning of selection
            api.playPause();
        }
        
        this.updateLoopButton();
        this.showLoopActiveMessage();
        
        console.log('Loop started with AlphaTab range:', range);
    }

    // Start loop from a single beat (default 4-bar range)
    startLoopFromBeat(beat) {
        if (!api || !beat) return;

        // Calculate a 4-bar range starting from the clicked beat
        const startBar = beat.voice.bar.index;
        const totalBars = this.getTotalBars();
        const endBar = Math.min(startBar + 3, totalBars - 1); // 4 bars or to end

        // Create a playback range
        const startTick = beat.voice.bar.masterBar.start;
        const endMasterBar = currentScore.masterBars[endBar];
        const endTick = endMasterBar.start + endMasterBar.calculateDuration();

        const range = {
            startTick: startTick,
            endTick: endTick
        };

        // Set the range in AlphaTab and start our loop
        api.playbackRange = range;
        this.currentRange = range;
        this.startLoopWithAlphaTabRange();
        
        console.log(`Loop started from beat: bars ${startBar + 1}-${endBar + 1}`);
    }

    // Stop looping
    stopLoop() {
        this.isLooping = false;
        this.isSelectionMode = false;
        this.currentRange = null;
        
        // Clear AlphaTab's playback range
        if (api) {
            api.playbackRange = null;
        }
        
        this.updateLoopButton();
        this.hideMessages();
        
        console.log('Loop stopped');
    }

    // Get total number of bars
    getTotalBars() {
        if (!currentScore || !currentScore.masterBars) return 1;
        return currentScore.masterBars.length;
    }

    // Update loop button appearance
    updateLoopButton() {
        if (!this.loopButton) return;

        // Remove all state classes first
        this.loopButton.classList.remove('active', 'selection-mode');

        if (this.isLooping) {
            this.loopButton.classList.add('active');
            this.loopButton.title = 'Looping Active (Click to stop)';
        } else if (this.isSelectionMode) {
            this.loopButton.classList.add('selection-mode');
            this.loopButton.title = 'Selection Mode - Click and drag to select loop range';
        } else {
            this.loopButton.title = 'Loop Selected Bars - Click to start selection';
        }
    }

    // Show selection instruction message
    showSelectionMessage() {
        this.showMessage('🎯 Click and drag on the tab to select loop range', '#FF9800');
    }

    // Show loop active message
    showLoopActiveMessage() {
        // Get range info for display
        let rangeText = 'Selected Range';
        if (api && api.playbackRange) {
            // Try to determine bar numbers from the range
            rangeText = 'Selected Range';
        }
        
        this.showMessage(`🔄 Looping ${rangeText}`, '#4CAF50');
    }

    // Show status message
    showMessage(text, color = '#4CAF50') {
        // Create or update loop status display
        let loopStatus = document.getElementById('loopStatus');
        if (!loopStatus) {
            loopStatus = document.createElement('div');
            loopStatus.id = 'loopStatus';
            loopStatus.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${color};
                color: white;
                padding: 12px 18px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                z-index: 1000;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
                font-family: 'Inter', sans-serif;
            `;
            document.body.appendChild(loopStatus);
        }

        loopStatus.style.background = color;
        loopStatus.textContent = text;
        loopStatus.style.display = 'block';
        loopStatus.style.opacity = '1';

        // Auto-hide after delay (except for active loop message)
        if (color !== '#4CAF50' || !this.isLooping) {
            setTimeout(() => {
                if (loopStatus && loopStatus.style.opacity === '1') {
                    loopStatus.style.opacity = '0';
                    setTimeout(() => {
                        if (loopStatus && loopStatus.style.opacity === '0') {
                            loopStatus.style.display = 'none';
                        }
                    }, 300);
                }
            }, 3000);
        }
    }

    // Hide status messages
    hideMessages() {
        const loopStatus = document.getElementById('loopStatus');
        if (loopStatus) {
            loopStatus.style.opacity = '0';
            setTimeout(() => {
                if (loopStatus) {
                    loopStatus.style.display = 'none';
                }
            }, 300);
        }
    }

    // Enable/disable loop button
    setEnabled(enabled) {
        if (this.loopButton) {
            this.loopButton.disabled = !enabled;
        }
    }

    // Reset loop system
    reset() {
        this.stopLoop();
        this.startBar = 1;
        this.endBar = 1;
        this.currentPosition = 0;
        this.barDuration = 0;
        this.currentRange = null;
    }

    // Check if we need to loop back to the start
    checkLoopPosition(currentTime) {
        if (!this.isLooping || !this.currentRange || !api) return;

        // Convert current time to ticks (approximate)
        const currentTick = api.tickPosition;
        
        // Log position for debugging (throttled)
        if (!this.lastLogTime || Date.now() - this.lastLogTime > 1000) {
            console.log(`Loop position: ${currentTick} / ${this.currentRange.endTick} (${Math.round((currentTick / this.currentRange.endTick) * 100)}%)`);
            this.lastLogTime = Date.now();
        }
        
        // Check if we've reached or passed the end of the loop
        if (currentTick >= this.currentRange.endTick - 100) { // Small buffer to prevent timing issues
            console.log('🔄 Loop end reached, jumping back to start');
            // Jump back to the start of the loop
            api.tickPosition = this.currentRange.startTick;
            
            // Update the visual feedback
            this.showMessage('🔄 Loop restarted', '#4CAF50');
        }
    }
}

// Create global loop system instance
const loopSystem = new LoopSystem();

// Update score for print and loop functionality
function updateScoreForPrint(score) {
    const hasScore = score !== null;
    
    if (printBtn) {
        printBtn.disabled = !hasScore;
    }
    
    if (downloadBtn) {
        downloadBtn.disabled = !hasScore;
    }
    
    // Enable scale diagrams when score is loaded
    enableScaleDiagrams(hasScore);
    
    currentScore = score; // Store for print functionality
}

// Test function for debugging loop button
function testLoopButton() {
    console.log('Testing loop button...');
    const btn = document.getElementById('loopBtn');
    console.log('Button found:', btn);
    if (btn) {
        btn.classList.add('selection-mode');
        console.log('Added selection-mode class');
        setTimeout(() => {
            btn.classList.remove('selection-mode');
            btn.classList.add('active');
            console.log('Switched to active class');
        }, 2000);
    }
}

// Make test function globally available
window.testLoopButton = testLoopButton;

async function loadGpFilesFromDirectory() {
    console.log('Loading GP files from hardcoded list...');
    
    // NOTE: This uses a hardcoded list because browsers cannot scan directories
    // This approach works perfectly with GitHub Pages and other static hosting
    // To add new files: 1) Upload to public/GP Files/[folder]/ 2) Add entry below 3) Commit to GitHub
    
    const gpFilesList = [
        // Scale Exercises
        { name: 'C Major Scale and Arpeggio Exercises.gp', category: 'scale-exercises', folder: 'Scale Exercises' },
        { name: 'C Major Scale and its Modes Using 1 shape.gp', category: 'scale-exercises', folder: 'Scale Exercises' },
        { name: 'A Minor & C Major Pentatonic Scale Shapes.gp', category: 'scale-exercises', folder: 'Scale Exercises' },
        { name: 'E Minor and G Major Pentatonic Scale Shapes.gp', category: 'scale-exercises', folder: 'Scale Exercises' },
        { name: 'Pentatonic_Exercises.gp', category: 'scale-exercises', folder: 'Scale Exercises' },
        { name: 'Minor_Pentatonic_Patterns.gp', category: 'scale-exercises', folder: 'Scale Exercises' },
        { name: 'Chromatic Scale.gp', category: 'scale-exercises', folder: 'Scale Exercises' },
        { name: 'C Ionian Mode.gp', category: 'scale-exercises', folder: 'Scale Exercises' },
        { name: 'C Dorian Mode.gp', category: 'scale-exercises', folder: 'Scale Exercises' },
        { name: 'C Phrygian Mode.gp', category: 'scale-exercises', folder: 'Scale Exercises' },
        { name: 'C Lydian Mode.gp', category: 'scale-exercises', folder: 'Scale Exercises' },
        { name: 'C Mixolydian Mode.gp', category: 'scale-exercises', folder: 'Scale Exercises' },
        { name: 'C Aeolian Mode.gp', category: 'scale-exercises', folder: 'Scale Exercises' },
        { name: 'C Locrian Mode.gp', category: 'scale-exercises', folder: 'Scale Exercises' },
        { name: 'C Harmonic Minor.gp', category: 'scale-exercises', folder: 'Scale Exercises' },
        { name: 'C Phrygian Dominant .gp', category: 'scale-exercises', folder: 'Scale Exercises' },
        { name: 'C Half - Whole Diminished Scale.gp', category: 'scale-exercises', folder: 'Scale Exercises' },
        { name: 'C Whole-Half Diminished Scale.gp', category: 'scale-exercises', folder: 'Scale Exercises' },

        // Arpeggios
        { name: 'C m7b5 Arpeggio.gp', category: 'arpeggios', folder: 'Arpeggios' },
        { name: 'C 7 Arpeggio.gp', category: 'arpeggios', folder: 'Arpeggios' },
        { name: 'C maj7 Arpeggio.gp', category: 'arpeggios', folder: 'Arpeggios' },
        { name: 'C m7 Arpeggio.gp', category: 'arpeggios', folder: 'Arpeggios' },
        { name: 'Cdimj7 Arpeggio.gp', category: 'arpeggios', folder: 'Arpeggios' },
        { name: 'CmMaj7 Arpeggio.gp', category: 'arpeggios', folder: 'Arpeggios' },

        // Chord Progressions
        { name: '12 Bar Blues in E.gp', category: 'chord-progressions', folder: 'Chord Progressions' },
        { name: 'I - VI - V - IV in C Major.gp', category: 'chord-progressions', folder: 'Chord Progressions' },
        
        // Songs
        { name: 'Achy Breaky.gp', category: 'songs', folder: 'Songs' },
        { name: 'Beethoven-Bagatelle_no_25-Fur_Elise.gp', category: 'songs', folder: 'Songs' }
        ];
        
        // Clear existing files
        gpFiles = [];
        filteredFiles = [];
        
    // Add each file to the list
    gpFilesList.forEach((fileInfo, index) => {
        const newFile = {
            id: index + 1,
            name: fileInfo.name,
            category: fileInfo.category,
            path: `./public/GP Files/${fileInfo.folder}/${fileInfo.name}`
        };
        
        gpFiles.push(newFile);
        console.log('Added file to GP Browser:', fileInfo.name, `(${fileInfo.category})`);
    });
    
    // Apply initial filter and update display
    applyFiltersAndSort();
    console.log(`Loaded ${gpFiles.length} GP files from hardcoded list`);
}

function isValidGpFile(fileName) {
    const fileExtension = fileName.split('.').pop().toLowerCase();
    return ['gp', 'gp3', 'gp4', 'gp5', 'gpx', 'gp6', 'gp7'].includes(fileExtension);
}

function addGpFile(fileName, filePath, category = 'scale-exercises') {
    // Function to manually add a GP file (for console use)
    const fileExtension = fileName.split('.').pop().toLowerCase();
    if (!['gp', 'gp3', 'gp4', 'gp5', 'gpx', 'gp6', 'gp7'].includes(fileExtension)) {
        console.warn('Invalid file type:', fileName);
        return;
    }
    
    // If no category specified, try to determine from file path
    if (category === 'scale-exercises' && filePath) {
        if (filePath.includes('/Licks/')) category = 'licks';
        else if (filePath.includes('/Chord Progressions/')) category = 'chord-progressions';
        else if (filePath.includes('/Songs/')) category = 'songs';
        else if (filePath.includes('/Arpeggios/')) category = 'arpeggios';
        else if (filePath.includes('/Scale Exercises/')) category = 'scale-exercises';
    }
    
    // Add file directly to the hardcoded list approach
    const newFile = {
        id: gpFiles.length + 1,
        name: fileName,
        category: category,
        path: filePath
    };
    
    gpFiles.push(newFile);
    applyFiltersAndSort();
    console.log('Manually added file to GP Browser:', fileName, `(${category})`);
}

// Refresh GP files function
function refreshGpFiles() {
    console.log('Refreshing GP files list...');
    loadGpFilesFromDirectory();
}

// Print functionality
function printTab() {
    if (!api || !currentScore) {
        alert('Please load a tab file first before printing.');
        return;
    }

    try {
        // Add print preparation indicator
        const printBtn = document.getElementById('printBtn');
        printBtn.classList.add('print-preparing');
        
        // Use AlphaTab's built-in print functionality
        api.print();
        
        // Clean up after a brief delay
        setTimeout(() => {
            printBtn.classList.remove('print-preparing');
        }, 1000);
        
    } catch (error) {
        console.error('Error printing tab:', error);
        alert('An error occurred while preparing the tab for printing. Please try again.');
        
        const printBtn = document.getElementById('printBtn');
        printBtn.classList.remove('print-preparing');
    }
}

// Download functionality
function downloadCurrentFile() {
    console.log('🔽 Download button clicked!', {
        hasFileData: !!currentFileData,
        hasFileName: !!currentFileName,
        fileName: currentFileName,
        fileDataLength: currentFileData ? currentFileData.length : 0
    });
    
    if (!currentFileData || !currentFileName) {
        alert('No Guitar Pro file is currently loaded. Please load a file first.');
        return;
    }

    try {
        // Create a blob from the current file data
        const blob = new Blob([currentFileData], { type: 'application/octet-stream' });
        
        // Create a temporary download link
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = currentFileName;
        
        // Add visual feedback
        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.classList.add('downloading');
        downloadBtn.title = 'Downloading...';
        
        // Trigger the download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up the object URL
        URL.revokeObjectURL(downloadLink.href);
        
        console.log('File downloaded successfully:', currentFileName);
        
    } catch (error) {
        console.error('Error downloading file:', error);
        alert('Failed to download the file. Please try again.');
    } finally {
        // Restore button state
        setTimeout(() => {
            const downloadBtn = document.getElementById('downloadBtn');
            downloadBtn.classList.remove('downloading');
            downloadBtn.title = 'Download Guitar Pro File';
        }, 1000);
    }
}

// Initialize scale diagrams
function initializeScaleDiagrams() {
    console.log('🎸 Initializing scale diagrams...');
    console.log('Scale diagram button element:', scaleDiagramBtn);
    
    if (scaleDiagramBtn) {
        scaleDiagramBtn.addEventListener('click', openScaleDiagramModal);
        console.log('✅ Scale diagram button event listener added');
    } else {
        console.error('❌ Scale diagram button not found!');
    }
    
    const modal = document.getElementById('scaleDiagramModal');
    const closeBtn = document.getElementById('closeScaleDiagramModal');
    
    console.log('Scale diagram modal elements:', { modal, closeBtn });
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeScaleDiagramModal);
        console.log('✅ Close button event listener added');
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeScaleDiagramModal();
            }
        });
        console.log('✅ Modal click-outside event listener added');
    }
    
    // Test if Fretboard library is available
    if (typeof Fretboard !== 'undefined') {
        console.log('✅ Fretboard.js library is available');
    } else {
        console.error('❌ Fretboard.js library not found!');
    }
}

// Open scale diagram modal
function openScaleDiagramModal() {
    console.log('🎸 Scale diagram button clicked!');
    
    if (!currentFileName) {
        console.error('❌ No file loaded');
        alert('Please load a Guitar Pro file first');
        return;
    }
    
    // Use currentFileName and trim whitespace, remove file extension
    const fileName = currentFileName.replace(/\.gp\d?x?$/i, '').trim();
    console.log('📁 Current file name:', fileName);
    console.log('📚 Available scale patterns:', Object.keys(scalePatterns));
    
    const modal = document.getElementById('scaleDiagramModal');
    const container = document.getElementById('scaleDiagramContainer');
    
    if (!modal || !container) {
        console.error('❌ Modal elements not found:', { modal, container });
        return;
    }
    
    // DEBUG: Log modal state before changes
    console.log('🔍 Modal before changes:', {
        display: window.getComputedStyle(modal).display,
        visibility: window.getComputedStyle(modal).visibility,
        opacity: window.getComputedStyle(modal).opacity,
        zIndex: window.getComputedStyle(modal).zIndex
    });
    
    // Clear previous diagrams
    container.innerHTML = '';
    
    // Check if we have scale patterns for this file
    const scaleData = scalePatterns[fileName];
    console.log('🔍 Looking for patterns for:', fileName);
    console.log('🎵 Found scale data:', scaleData);
    
    if (scaleData && scaleData.patterns && scaleData.patterns.length > 0) {
        console.log('✅ Scale patterns found, generating diagrams...');
        generateScaleDiagrams(scaleData.patterns, container);
    } else {
        console.log('⚠️ No scale patterns found for this file');
        // Show available patterns or message
        container.innerHTML = `
            <div class="scale-diagram-item">
                <div class="scale-diagram-title">Scale Diagrams</div>
                <p>Scale diagrams for "<strong>${fileName}</strong>" are not yet available.</p>
                <p><strong>Currently supported files:</strong></p>
                <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
                    ${Object.keys(scalePatterns).map(name => `<li>${name}</li>`).join('')}
                </ul>
                <p style="margin-top: 20px; font-style: italic;">More scale diagrams coming soon!</p>
            </div>
        `;
    }
    
    // Force display with !important via style attribute
    modal.style.cssText = 'display: block !important; position: fixed !important; z-index: 10000 !important;';
    document.body.style.overflow = 'hidden';
    
    // DEBUG: Log modal state after changes
    setTimeout(() => {
        console.log('🔍 Modal after changes:', {
            display: window.getComputedStyle(modal).display,
            visibility: window.getComputedStyle(modal).visibility,
            opacity: window.getComputedStyle(modal).opacity,
            zIndex: window.getComputedStyle(modal).zIndex,
            position: window.getComputedStyle(modal).position,
            top: window.getComputedStyle(modal).top,
            left: window.getComputedStyle(modal).left,
            width: window.getComputedStyle(modal).width,
            height: window.getComputedStyle(modal).height
        });
    }, 100);
    
    console.log('✅ Scale diagram modal opened');
}

// Close scale diagram modal
function closeScaleDiagramModal() {
    const modal = document.getElementById('scaleDiagramModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Generate scale diagrams using Fretboard.js
function generateScaleDiagrams(patterns, container) {
    // Check if Fretboard library is available
    if (typeof Fretboard === 'undefined') {
        console.error('Fretboard library not loaded');
        container.innerHTML = `
            <div class="scale-diagram-item">
                <div class="scale-diagram-title">Error</div>
                <p>Fretboard library not available. Please refresh the page and try again.</p>
            </div>
        `;
        return;
    }
    
    patterns.forEach((pattern, index) => {
        const diagramItem = document.createElement('div');
        diagramItem.className = 'scale-diagram-item';
        
        const title = document.createElement('div');
        title.className = 'scale-diagram-title';
        title.textContent = pattern.name;
        
        const subtitle = document.createElement('div');
        subtitle.className = 'scale-diagram-subtitle';
        subtitle.textContent = `Scale Notes: ${pattern.notes.join(' - ')}`;
        
        // Create enhanced legend showing tab usage
        const legend = document.createElement('div');
        legend.className = 'scale-legend';
        
        const legendTitle = document.createElement('div');
        legendTitle.className = 'scale-legend-title';
        legendTitle.textContent = 'Note Colors:';
        
        const legendItems = document.createElement('div');
        legendItems.className = 'scale-legend-items';
        
        // Check if we have tab data loaded
        const tabData = extractTabFretPositions();
        const hasTabData = tabData.length > 0;
        
        if (hasTabData) {
            // Root note used in tab
            const rootUsedItem = document.createElement('div');
            rootUsedItem.className = 'scale-legend-item';
            
            const rootUsedDot = document.createElement('div');
            rootUsedDot.className = 'scale-legend-dot';
            rootUsedDot.style.backgroundColor = '#dc3545';
            rootUsedDot.style.border = '3px solid #ffd700';
            rootUsedDot.style.color = 'white';
            rootUsedDot.textContent = '●';
            
            const rootUsedText = document.createElement('span');
            rootUsedText.textContent = `${pattern.notes[0]} (Root - Used in Tab)`;
            
            rootUsedItem.appendChild(rootUsedDot);
            rootUsedItem.appendChild(rootUsedText);
            
            // Scale notes used in tab
            const scaleUsedItem = document.createElement('div');
            scaleUsedItem.className = 'scale-legend-item';
            
            const scaleUsedDot = document.createElement('div');
            scaleUsedDot.className = 'scale-legend-dot';
            scaleUsedDot.style.backgroundColor = '#A0522D';
            scaleUsedDot.style.border = '3px solid #ffd700';
            scaleUsedDot.style.color = 'white';
            scaleUsedDot.textContent = '●';
            
            const scaleUsedText = document.createElement('span');
            scaleUsedText.textContent = 'Scale Notes (Used in Tab)';
            
            scaleUsedItem.appendChild(scaleUsedDot);
            scaleUsedItem.appendChild(scaleUsedText);
            
            // Root note not used in tab
            const rootUnusedItem = document.createElement('div');
            rootUnusedItem.className = 'scale-legend-item';
            
            const rootUnusedDot = document.createElement('div');
            rootUnusedDot.className = 'scale-legend-dot';
            rootUnusedDot.style.backgroundColor = '#dc3545';
            rootUnusedDot.style.border = '2px solid #ffffff';
            rootUnusedDot.style.color = 'white';
            rootUnusedDot.textContent = '●';
            
            const rootUnusedText = document.createElement('span');
            rootUnusedText.textContent = `${pattern.notes[0]} (Root - Available)`;
            
            rootUnusedItem.appendChild(rootUnusedDot);
            rootUnusedItem.appendChild(rootUnusedText);
            
            // Scale notes not used in tab
            const scaleUnusedItem = document.createElement('div');
            scaleUnusedItem.className = 'scale-legend-item';
            
            const scaleUnusedDot = document.createElement('div');
            scaleUnusedDot.className = 'scale-legend-dot';
            scaleUnusedDot.style.backgroundColor = '#A0522D';
            scaleUnusedDot.style.border = '2px solid #ffffff';
            scaleUnusedDot.style.color = 'white';
            scaleUnusedDot.textContent = '●';
            
            const scaleUnusedText = document.createElement('span');
            scaleUnusedText.textContent = 'Scale Notes (Available)';
            
            scaleUnusedItem.appendChild(scaleUnusedDot);
            scaleUnusedItem.appendChild(scaleUnusedText);
            
            legendItems.appendChild(rootUsedItem);
            legendItems.appendChild(scaleUsedItem);
            legendItems.appendChild(rootUnusedItem);
            legendItems.appendChild(scaleUnusedItem);
            
        } else {
            // No tab loaded - show simple legend
            // Root note legend item
            const rootItem = document.createElement('div');
            rootItem.className = 'scale-legend-item';
            
            const rootDot = document.createElement('div');
            rootDot.className = 'scale-legend-dot';
            rootDot.style.backgroundColor = '#dc3545';
            rootDot.style.color = 'white';
            rootDot.textContent = '●';
            
            const rootText = document.createElement('span');
            rootText.textContent = `${pattern.notes[0]} (Root Note)`;
            
            rootItem.appendChild(rootDot);
            rootItem.appendChild(rootText);
            
            // Scale notes legend item
            const scaleItem = document.createElement('div');
            scaleItem.className = 'scale-legend-item';
            
            const scaleDot = document.createElement('div');
            scaleDot.className = 'scale-legend-dot';
            scaleDot.style.backgroundColor = '#A0522D';
            scaleDot.style.color = 'white';
            scaleDot.textContent = '●';
            
            const scaleText = document.createElement('span');
            scaleText.textContent = 'Other Scale Notes';
            
            scaleItem.appendChild(scaleDot);
            scaleItem.appendChild(scaleText);
            
            legendItems.appendChild(rootItem);
            legendItems.appendChild(scaleItem);
        }
        
        legend.appendChild(legendTitle);
        legend.appendChild(legendItems);
        
        const fretboardContainer = document.createElement('div');
        fretboardContainer.className = 'fretboard-container';
        
        // Add helpful text with tab information
        const helpText = document.createElement('div');
        helpText.style.cssText = 'text-align: center; margin-bottom: 10px; font-size: 12px; color: #666; font-style: italic;';
        
        const tabPositions = extractTabFretPositions();
        if (tabPositions.length > 0) {
            helpText.textContent = `Scroll horizontally to see the full fretboard • Gold borders highlight notes used in the current tab (${tabPositions.length} positions)`;
        } else {
            helpText.textContent = 'Scroll horizontally to see the full fretboard • Load a tab file to see which notes are actually used';
        }
        
        try {
            // Create fretboard instance with full 22 fret range
            const fretboard = new Fretboard({
                el: fretboardContainer,
                frets: 22, // Full fretboard range
                strings: 6,
                fretWidth: 40, // Slightly smaller for better fit
                fretHeight: 30,
                nutWidth: 8,
                stringWidth: 2,
                fretColor: '#d0d0d0',
                stringColor: '#888888',
                backgroundColor: '#ffffff',
                showFretNumbers: true,
                fretNumbersHeight: 18,
                dotSize: 20, // Bigger dots
                dotStrokeColor: '#ffffff',
                dotStrokeWidth: 2,
                showThumbPosition: false
            });
            
            // Generate full fretboard scale pattern with tab highlighting
            const dots = generateFullFretboardPattern(pattern);
            
            // Set dots and render
            fretboard.setDots(dots).render();
            
            console.log(`✅ Generated full fretboard for ${pattern.name} with ${dots.length} note positions`);
            
        } catch (error) {
            console.error('Error creating fretboard:', error);
            fretboardContainer.innerHTML = `
                <p style="color: #dc3545; padding: 20px;">
                    Error generating fretboard diagram for ${pattern.name}
                </p>
            `;
        }
        
        diagramItem.appendChild(title);
        diagramItem.appendChild(subtitle);
        diagramItem.appendChild(legend);
        diagramItem.appendChild(helpText);
        diagramItem.appendChild(fretboardContainer);
        container.appendChild(diagramItem);
    });
}

// Generate full fretboard pattern for a scale
function generateFullFretboardPattern(pattern) {
    const dots = [];
    const scaleNotes = pattern.notes;
    const rootNote = scaleNotes[0];
    
    // Standard guitar tuning (from 6th string to 1st string)
    const stringTuning = ['E', 'A', 'D', 'G', 'B', 'E'];
    
    // All chromatic notes using FLATS (not sharps)
    const chromaticNotes = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    
    // Convert sharp notes to flat equivalents
    const normalizeNote = (note) => {
        const sharpToFlat = {
            'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'
        };
        return sharpToFlat[note] || note;
    };
    
    // Normalize scale notes to use flats
    const normalizedScaleNotes = scaleNotes.map(normalizeNote);
    const normalizedRootNote = normalizeNote(rootNote);
    
    // Function to get note at specific fret on specific string
    const getNoteAtFret = (stringIndex, fret) => {
        const openStringNote = stringTuning[stringIndex];
        const openStringIndex = chromaticNotes.indexOf(openStringNote);
        const noteIndex = (openStringIndex + fret) % 12;
        return chromaticNotes[noteIndex];
    };
    
    // Generate dots for ALL strings and ALL frets (0-22)
    for (let stringNum = 1; stringNum <= 6; stringNum++) {
        const stringIndex = stringNum - 1; // Convert to 0-based index
        
        // Check every fret from 0 (open) to 22
        for (let fret = 0; fret <= 22; fret++) {
            const noteAtFret = getNoteAtFret(stringIndex, fret);
            
            // Check if this note is in our scale
            if (normalizedScaleNotes.includes(noteAtFret)) {
                const isRoot = noteAtFret === normalizedRootNote;
                
                // Simple color system: root or scale note
                const className = isRoot ? 'dot-root' : 'dot-scale';
                
                dots.push({
                    string: stringNum,
                    fret: fret,
                    note: noteAtFret,
                    className: className,
                    text: noteAtFret // Show the note name on the dot
                });
            }
        }
    }
    
    console.log(`✅ Generated ${dots.length} scale note positions for ${pattern.name}`);
    console.log('Scale notes:', normalizedScaleNotes.join(', '));
    
    return dots;
}

// Enable/disable scale diagrams button
function enableScaleDiagrams(enable) {
    console.log('🎛️ enableScaleDiagrams called with:', enable);
    console.log('Scale diagram button element:', scaleDiagramBtn);
    
    if (scaleDiagramBtn) {
        scaleDiagramBtn.disabled = !enable;
        console.log('✅ Scale diagram button disabled state set to:', !enable);
    } else {
        console.error('❌ Scale diagram button not found in enableScaleDiagrams!');
    }
}

// Make functions globally available for manual file addition and refresh
window.addGpFile = addGpFile;
window.refreshGpFiles = refreshGpFiles;
window.testLoopButton = testLoopButton;

// Handle volume changes for individual tracks
function handleVolumeChange(event) {
    if (!event.target.classList.contains('volume-slider')) return;
    
    const trackIndex = parseInt(event.target.getAttribute('data-track'));
    const volume = parseFloat(event.target.value) / 100; // Convert percentage to decimal
    
    // Update the volume display
    const volumeDisplay = event.target.nextElementSibling;
    if (volumeDisplay && volumeDisplay.classList.contains('volume-display')) {
        volumeDisplay.textContent = `${event.target.value}%`;
    }
    
    // Apply volume change to AlphaTab if available
    if (api && isPlayerReady) {
        try {
            api.changeTrackVolume([trackIndex], volume);
            console.log(`Changed track ${trackIndex} volume to ${Math.round(volume * 100)}%`);
        } catch (error) {
            console.warn('Could not change track volume:', error);
        }
    }
}

// Apply queued instrument changes when player starts (simplified)
function applyQueuedInstrumentChanges() {
    if (!window.queuedInstrumentChanges || window.queuedInstrumentChanges.size === 0) {
        return;
    }
    
    console.log(`Note: ${window.queuedInstrumentChanges.size} instrument changes queued - they are already applied to the score`);
    
    // Clear the queue since the changes are already in the score
    window.queuedInstrumentChanges.clear();
}

// Mobile touch control functions for pause/play from touch position
function setupScoreTouchControls() {
    const scoreElement = document.querySelector('#alphaTab');
    if (!scoreElement) {
        console.log('Score element not found for touch controls');
        return;
    }
    
    console.log('Setting up mobile score touch controls');
    
    // Track mobile device detection
    const isMobile = () => window.innerWidth <= 768 || 'ontouchstart' in window;
    
    // Use AlphaTab's beatMouseDown event for precise position detection
    if (api) {
        api.beatMouseDown.on((beat) => {
            if (isMobile() && beat) {
                console.log('Mobile beat touch detected:', beat);
                // Simple implementation - just play/pause
                if (api.playerState === 1) { // Playing
                    api.playPause(); // Pause
                } else {
                    api.playPause(); // Play
                }
            }
        });
    }
    
    // Fallback touch event for mobile devices
    scoreElement.addEventListener('touchend', (event) => {
        if (isMobile()) {
            event.preventDefault();
            console.log('Mobile score touch detected');
            // Simple play/pause toggle
            if (api && isPlayerReady) {
                api.playPause();
            }
        }
    }, { passive: false });
}

// Scale Pattern Generator Tool
window.generateScalePattern = function(scaleName, rootNote, scaleFormula, startFret = 8) {
    console.log('🎼 Generating scale pattern for:', scaleName);
    
    // Note mapping with enharmonic equivalents
    const noteMap = {
        'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
        'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };
    
    const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIndex = noteMap[rootNote];
    
    // Generate scale notes from formula (semitone intervals)
    const scaleNotes = [rootNote];
    let currentIndex = rootIndex;
    
    for (let i = 0; i < scaleFormula.length - 1; i++) {
        currentIndex = (currentIndex + scaleFormula[i]) % 12;
        scaleNotes.push(allNotes[currentIndex]);
    }
    
    console.log('Generated scale notes:', scaleNotes);
    
    // Standard guitar tuning (low to high): E A D G B E
    const stringTuning = [4, 9, 2, 7, 11, 4]; // E=4, A=9, D=2, G=7, B=11, E=4
    
    const frets = [];
    const strings = [];
    const noteLabels = [];
    
    // Generate pattern across fretboard (3 notes per string typically)
    for (let string = 6; string >= 1; string--) {
        const stringIndex = string - 1;
        const openNote = stringTuning[stringIndex];
        
        // Find scale notes on this string within a reasonable fret range
        for (let fret = startFret; fret <= startFret + 7; fret++) {
            const noteValue = (openNote + fret) % 12;
            const noteName = allNotes[noteValue];
            
            // Check if this note is in our scale
            if (scaleNotes.includes(noteName)) {
                frets.push(fret);
                strings.push(string);
                noteLabels.push(noteName);
            }
        }
    }
    
    const pattern = {
        name: scaleName,
        notes: scaleNotes,
        frets: frets,
        strings: strings,
        noteLabels: noteLabels
    };
    
    console.log('🎸 Generated pattern:', pattern);
    console.log('📋 Copy this to add to scalePatterns:');
    console.log(`'${scaleName}': {
    patterns: [${JSON.stringify(pattern, null, 8)}]
},`);
    
    return pattern;
};

// Common scale formulas (semitone intervals)
window.scaleFormulas = {
    major: [2, 2, 1, 2, 2, 2, 1],
    naturalMinor: [2, 1, 2, 2, 1, 2, 2],
    harmonicMinor: [2, 1, 2, 2, 1, 3, 1],
    melodicMinor: [2, 1, 2, 2, 2, 2, 1],
    dorian: [2, 1, 2, 2, 2, 1, 2],
    phrygian: [1, 2, 2, 2, 1, 2, 2],
    lydian: [2, 2, 2, 1, 2, 2, 1],
    mixolydian: [2, 2, 1, 2, 2, 1, 2],
    locrian: [1, 2, 2, 1, 2, 2, 2],
    wholeTone: [2, 2, 2, 2, 2, 2],
    halfWholeDiminished: [1, 2, 1, 2, 1, 2, 1, 2],
    wholeHalfDiminished: [2, 1, 2, 1, 2, 1, 2, 1],
    chromatic: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
};

// Quick pattern generators for common scales
window.generateMajorScale = (root) => generateScalePattern(`${root} Major Scale`, root, scaleFormulas.major);
window.generateMinorScale = (root) => generateScalePattern(`${root} Natural Minor Scale`, root, scaleFormulas.naturalMinor);
window.generateDorianMode = (root) => generateScalePattern(`${root} Dorian Mode`, root, scaleFormulas.dorian);
window.generatePhrygianMode = (root) => generateScalePattern(`${root} Phrygian Mode`, root, scaleFormulas.phrygian);
window.generateLydianMode = (root) => generateScalePattern(`${root} Lydian Mode`, root, scaleFormulas.lydian);
window.generateMixolydianMode = (root) => generateScalePattern(`${root} Mixolydian Mode`, root, scaleFormulas.mixolydian);
window.generateLocrianMode = (root) => generateScalePattern(`${root} Locrian Mode`, root, scaleFormulas.locrian);

console.log('🎼 Scale pattern generator tools loaded!');
console.log('Use: generateScalePattern("Scale Name", "Root", [intervals])');
console.log('Or use shortcuts like: generateDorianMode("C")');
console.log('Available formulas:', Object.keys(scaleFormulas));

// Debug function to force show modal (for testing)
window.forceShowModal = function() {
    const modal = document.getElementById('scaleDiagramModal');
    if (modal) {
        modal.style.cssText = 'display: block !important; position: fixed !important; z-index: 10000 !important; left: 0 !important; top: 0 !important; width: 100% !important; height: 100% !important; background: rgba(0,0,0,0.8) !important;';
        console.log('🚀 Modal force displayed');
    }
};

// Test function to verify Fretboard.js is working
window.testFretboard = function() {
    console.log('🧪 Testing Fretboard...');
    
    // Create a test container
    const testContainer = document.createElement('div');
    testContainer.style.cssText = 'position: fixed; top: 50px; left: 50px; background: white; padding: 20px; border: 2px solid red; z-index: 99999;';
    document.body.appendChild(testContainer);
    
    // Create a simple fretboard
    const fretboard = new Fretboard({
        el: testContainer,
        frets: 12,
        strings: 6
    });
    
    // Add some test dots
    fretboard.setDots([
        { string: 6, fret: 3, note: 'C', className: 'dot-root' },
        { string: 5, fret: 5, note: 'D', className: 'dot-note' },
        { string: 4, fret: 7, note: 'E', className: 'dot-note' }
    ]).render();
    
    console.log('✅ Test fretboard created');
    
    // Remove after 5 seconds
    setTimeout(() => {
        document.body.removeChild(testContainer);
        console.log('🗑️ Test fretboard removed');
    }, 5000);
};

// Extract fret positions used in the current tab
function extractTabFretPositions() {
    if (!currentScore) {
        console.log('No score loaded to analyze');
        return [];
    }
    
    const usedPositions = new Set();
    
    try {
        // Iterate through all tracks
        for (let trackIndex = 0; trackIndex < currentScore.tracks.length; trackIndex++) {
            const track = currentScore.tracks[trackIndex];
            
            // Skip non-guitar tracks (drums, etc.)
            if (!track.channel || track.channel.channel1 === 9) continue; // Channel 9 is typically drums
            
            // Iterate through all staves in the track
            for (let staffIndex = 0; staffIndex < track.staves.length; staffIndex++) {
                const staff = track.staves[staffIndex];
                
                // Iterate through all bars
                for (let barIndex = 0; barIndex < staff.bars.length; barIndex++) {
                    const bar = staff.bars[barIndex];
                    
                    // Iterate through all voices in the bar
                    for (let voiceIndex = 0; voiceIndex < bar.voices.length; voiceIndex++) {
                        const voice = bar.voices[voiceIndex];
                        
                        // Iterate through all beats in the voice
                        for (let beatIndex = 0; beatIndex < voice.beats.length; beatIndex++) {
                            const beat = voice.beats[beatIndex];
                            
                            // Iterate through all notes in the beat
                            for (let noteIndex = 0; noteIndex < beat.notes.length; noteIndex++) {
                                const note = beat.notes[noteIndex];
                                
                                // Check if note has fret information
                                if (note.fret !== undefined && note.string !== undefined) {
                                    // Convert to 1-based string numbering (6th string = 1, 1st string = 6)
                                    const stringNumber = 7 - note.string; // AlphaTab uses 0-based, we need 1-based from bottom
                                    const fretNumber = note.fret;
                                    
                                    // Add to our set of used positions
                                    usedPositions.add(`${stringNumber}-${fretNumber}`);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Convert Set to array of position objects
        const positions = Array.from(usedPositions).map(pos => {
            const [string, fret] = pos.split('-').map(Number);
            return { string, fret };
        });
        
        console.log(`✅ Extracted ${positions.length} unique fret positions from tab:`, positions);
        return positions;
        
    } catch (error) {
        console.error('Error extracting fret positions:', error);
        return [];
    }
}

// Generate full fretboard pattern for a scale with tab highlights
function generateFullFretboardPattern(pattern) {
    const dots = [];
    const scaleNotes = pattern.notes;
    const rootNote = scaleNotes[0];
    
    // Get fret positions used in the current tab
    const tabPositions = extractTabFretPositions();
    const tabPositionSet = new Set(tabPositions.map(pos => `${pos.string}-${pos.fret}`));
    
    // Standard guitar tuning (from 6th string to 1st string)
    const stringTuning = ['E', 'A', 'D', 'G', 'B', 'E'];
    
    // All chromatic notes using FLATS (not sharps)
    const chromaticNotes = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    
    // Convert sharp notes to flat equivalents
    const normalizeNote = (note) => {
        const sharpToFlat = {
            'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'
        };
        return sharpToFlat[note] || note;
    };
    
    // Normalize scale notes to use flats
    const normalizedScaleNotes = scaleNotes.map(normalizeNote);
    const normalizedRootNote = normalizeNote(rootNote);
    
    // Function to get note at specific fret on specific string
    const getNoteAtFret = (stringIndex, fret) => {
        const openStringNote = stringTuning[stringIndex];
        const openStringIndex = chromaticNotes.indexOf(openStringNote);
        const noteIndex = (openStringIndex + fret) % 12;
        return chromaticNotes[noteIndex];
    };
    
    // Generate dots for ALL strings and ALL frets (0-22)
    for (let stringNum = 1; stringNum <= 6; stringNum++) {
        const stringIndex = stringNum - 1; // Convert to 0-based index
        
        // Check every fret from 0 (open) to 22
        for (let fret = 0; fret <= 22; fret++) {
            const noteAtFret = getNoteAtFret(stringIndex, fret);
            
            // Check if this note is in our scale
            if (normalizedScaleNotes.includes(noteAtFret)) {
                const isRoot = noteAtFret === normalizedRootNote;
                const isUsedInTab = tabPositionSet.has(`${stringNum}-${fret}`);
                
                // Determine dot class based on note type and tab usage
                let className = 'dot-scale';
                if (isRoot && isUsedInTab) {
                    className = 'dot-root-used';
                } else if (isRoot) {
                    className = 'dot-root';
                } else if (isUsedInTab) {
                    className = 'dot-scale-used';
                }
                
                dots.push({
                    string: stringNum,
                    fret: fret,
                    note: noteAtFret,
                    className: className,
                    text: noteAtFret, // Show the note name on the dot
                    usedInTab: isUsedInTab
                });
            }
        }
    }
    
    console.log(`✅ Generated ${dots.length} scale note positions for ${pattern.name}`);
    console.log(`📊 ${dots.filter(d => d.usedInTab).length} positions are used in the current tab`);
    console.log('Scale notes:', normalizedScaleNotes.join(', '));
    
    return dots;
}
