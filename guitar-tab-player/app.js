let api = null;
let isPlayerReady = false;
let trackStates = {}; // Store track states (visible, muted, solo)
let currentScore = null; // Global score reference
let isRenderingComplete = false; // Track rendering state

// GP Files Browser State
let gpFiles = [];
let filteredFiles = [];
let currentFilter = 'all';
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

// PNG Export elements
const exportPngBtn = document.getElementById('exportPngBtn');
const visualCropBtn = document.getElementById('visualCropBtn');
const pngExportModal = document.getElementById('pngExportModal');
const closeExportModal = document.getElementById('closeExportModal');
const cancelExportBtn = document.getElementById('cancelExport');
const confirmExportBtn = document.getElementById('confirmExport');
const exportFormatSelect = document.getElementById('exportFormat');
const startBarSelect = document.getElementById('startBar');
const endBarSelect = document.getElementById('endBar');
const exportScaleSelect = document.getElementById('exportScale');
const exportPreview = document.getElementById('exportPreview');
const formatInfo = document.getElementById('formatInfo');

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
                scrollElement: window,
                enableCursor: true,
                enableUserInteraction: true,
                enableAnimatedBeatCursor: true
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
            updateScoreForExport(score);
            enablePlayerControls(true);
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
        });
        
        api.playerStateChanged.on((e) => {
            console.log('Player state changed:', e.state);
            updatePlayerButtons(e.state);
        });
        
        // Add playback cursor functionality
        api.playerPositionChanged.on((e) => {
            // The cursor position is automatically handled by AlphaTab
            // This event fires when the playback position changes
            
            // Update loop system position (for compatibility, though not needed with AlphaTab's native looping)
            if (loopSystem) {
                loopSystem.currentPosition = e.currentTime;
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
        
        // Read file as ArrayBuffer for better debugging
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const arrayBuffer = e.target.result;
                console.log('File loaded as ArrayBuffer, size:', arrayBuffer.byteLength);
                
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
    const sortSelect = document.getElementById('sortBy');
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        applyFiltersAndSort();
    });
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshGpFilesBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            console.log('Refresh button clicked');
            refreshGpFiles();
        });
    }
}

function applyFiltersAndSort() {
    // Apply filters
    filteredFiles = gpFiles.filter(file => {
        // Category filter
        const categoryMatch = currentFilter === 'all' || file.category === currentFilter;
        
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
    const formattedDate = formatDate(file.dateModified);
    
    return `
        <div class="file-item" data-file-id="${file.id}">
            <div class="file-icon">${icon}</div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-meta">
                    <span class="file-category ${file.category}">${categoryLabel}</span>
                    <span>${file.size}</span>
                    <span>${formattedDate}</span>
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
            return 'Scale Exercises';
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
        
        // Show loading state
        const fileItem = document.querySelector(`[data-file-id="${fileId}"]`);
        if (fileItem) {
            fileItem.style.opacity = '0.6';
            fileItem.style.pointerEvents = 'none';
        }

        // Fetch the actual file
        const response = await fetch(file.path);
        if (!response.ok) {
            throw new Error(`Failed to load file: ${response.status} ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
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
        trackItem.className = 'track-item';
        trackItem.setAttribute('data-track-index', index);
        
        // Enhanced track name detection with multiple fallbacks
        const trackName = getTrackName(track, index);
        
        // Enhanced instrument detection with multiple fallbacks
        const instrumentInfo = getInstrumentInfo(track, index);
        
        trackItem.innerHTML = `
            <div class="track-header">
                <div class="track-name">${trackName}</div>
            </div>
            <div class="track-info-details">
                ${instrumentInfo}
            </div>
            <div class="track-controls-buttons">
                <button class="track-btn visibility visible" data-action="visibility" data-track="${index}">
                    Show
                </button>
                <button class="track-btn solo" data-action="solo" data-track="${index}">
                    Solo
                </button>
                <button class="track-btn mute" data-action="mute" data-track="${index}">
                    Mute
                </button>
            </div>
        `;
        
        tracksGrid.appendChild(trackItem);
    });
    
    // Add event listeners to track buttons
    tracksGrid.addEventListener('click', handleTrackButtonClick);
    
    trackControls.style.display = 'block';
}

function handleTrackButtonClick(event) {
    if (!event.target.classList.contains('track-btn')) return;
    
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
        visibilityBtn.classList.add('visible');
        visibilityBtn.textContent = 'Hide';
    } else {
        visibilityBtn.classList.remove('visible');
        visibilityBtn.textContent = 'Show';
    }
    
    // Update solo button
    if (state.solo) {
        soloBtn.classList.add('active');
        soloBtn.textContent = 'Solo';
    } else {
        soloBtn.classList.remove('active');
        soloBtn.textContent = 'Solo';
    }
    
    // Update mute button
    if (state.muted) {
        muteBtn.classList.add('active');
        muteBtn.textContent = 'Muted';
    } else {
        muteBtn.classList.remove('active');
        muteBtn.textContent = 'Mute';
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
    initializeAlphaTab();
    setupEventListeners();
    initializePngExport();
    initializeVisualCropping();
    initializeGpFilesBrowser(); // Initialize GP Files Browser
    
    // Initialize loop system
    loopSystem.initialize();
    
    // Force hide modal on page load to prevent it from being stuck open
    forceHideModal();
});

// Force hide modal function
function forceHideModal() {
    const modal = document.getElementById('pngExportModal');
    if (modal) {
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
        modal.classList.remove('show');
        document.body.style.overflow = '';
        console.log('Modal force hidden on page load');
    }
}

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

// Initialize PNG export functionality
function initializePngExport() {
    // Add event listeners for export
    exportPngBtn.addEventListener('click', openExportModal);
    
    // Add event listener for visual crop button
    visualCropBtn.addEventListener('click', toggleVisualCropping);
    
    // Multiple ways to close the modal
    closeExportModal.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
    });
    
    cancelExportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
    });
    
    confirmExportBtn.addEventListener('click', performExport);
    
    // Close modal when clicking outside (on the backdrop)
    pngExportModal.addEventListener('click', (e) => {
        if (e.target === pngExportModal) {
            closeModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && pngExportModal.style.display === 'flex') {
            closeModal();
        }
    });
    
    // Update preview when selections change
    exportFormatSelect.addEventListener('change', updateExportPreview);
    startBarSelect.addEventListener('change', updateExportPreview);
    endBarSelect.addEventListener('change', updateExportPreview);
    
    // Ensure end bar is always >= start bar
    startBarSelect.addEventListener('change', () => {
        const startBar = parseInt(startBarSelect.value);
        const endBar = parseInt(endBarSelect.value);
        if (endBar < startBar) {
            endBarSelect.value = startBar;
            updateExportPreview();
        }
    });
    
    endBarSelect.addEventListener('change', () => {
        const startBar = parseInt(startBarSelect.value);
        const endBar = parseInt(endBarSelect.value);
        if (endBar < startBar) {
            startBarSelect.value = endBar;
            updateExportPreview();
        }
    });
    
    console.log('PNG export functionality initialized');
}

// Open export modal
function openExportModal() {
    console.log('Opening export modal...');
    
    if (!api || !currentScore) {
        alert('Please load a score first');
        return;
    }
    
    populateBarSelections();
    updateExportPreview();
    
    // Show modal with multiple approaches to ensure visibility
    const modal = document.getElementById('pngExportModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.classList.add('show');
    }
    
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    console.log('Export modal opened');
}

// Close export modal
function closeModal() {
    console.log('Closing modal...');
    
    const modal = document.getElementById('pngExportModal');
    if (modal) {
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
        modal.classList.remove('show');
    }
    
    document.body.style.overflow = ''; // Restore scrolling
    
    // Reset button state
    confirmExportBtn.classList.remove('loading');
    updateExportPreview(); // This will set the correct button text
    confirmExportBtn.disabled = false;
    
    console.log('Modal closed successfully');
}

// Populate bar selection dropdowns
function populateBarSelections() {
    if (!currentScore) return;
    
    // Clear existing options
    startBarSelect.innerHTML = '';
    endBarSelect.innerHTML = '';
    
    // Get total number of bars from the score
    let totalBars = 0;
    if (currentScore.masterBars && currentScore.masterBars.length > 0) {
        totalBars = currentScore.masterBars.length;
    } else {
        // Fallback: estimate from first track
        const firstTrack = currentScore.tracks[0];
        if (firstTrack && firstTrack.staves && firstTrack.staves[0] && firstTrack.staves[0].bars) {
            totalBars = firstTrack.staves[0].bars.length;
        }
    }
    
    // If we still don't have bars, default to 1
    if (totalBars === 0) {
        totalBars = 1;
    }
    
    // Populate dropdowns
    for (let i = 1; i <= totalBars; i++) {
        const startOption = document.createElement('option');
        startOption.value = i;
        startOption.textContent = `Bar ${i}`;
        startBarSelect.appendChild(startOption);
        
        const endOption = document.createElement('option');
        endOption.value = i;
        endOption.textContent = `Bar ${i}`;
        endBarSelect.appendChild(endOption);
    }
    
    // Set default selection (all bars)
    startBarSelect.value = 1;
    endBarSelect.value = totalBars;
}

// Update export preview text
function updateExportPreview() {
    const format = exportFormatSelect.value;
    const startBar = parseInt(startBarSelect.value);
    const endBar = parseInt(endBarSelect.value);
    const scale = parseFloat(exportScaleSelect.value);
    
    let previewText = `Selected: Bar ${startBar}`;
    if (startBar !== endBar) {
        previewText += ` to Bar ${endBar}`;
    }
    previewText += ` (${scale}x quality)`;
    
    exportPreview.textContent = previewText;
    
    // Update button text based on format
    if (format === 'html') {
        confirmExportBtn.textContent = 'Export HTML';
        formatInfo.textContent = '💡 HTML files can be embedded in websites using <iframe> or opened directly in browsers';
    } else {
        confirmExportBtn.textContent = 'Export JPEG';
        formatInfo.textContent = '💡 JPEG images are perfect for sharing, printing, or embedding in documents';
    }
}

// Perform export based on selected format
async function performExport() {
    const format = exportFormatSelect.value;
    
    if (format === 'html') {
        await performHtmlExport();
    } else {
        await performJpegExport();
    }
}

// Placeholder functions for export functionality
async function performHtmlExport() {
    console.log('HTML export not yet implemented');
    alert('HTML export functionality will be implemented soon!');
}

// Perform JPEG export with cropping support
async function performJpegExport() {
    try {
        console.log('Starting JPEG export...');
        
        // Update button state
        confirmExportBtn.classList.add('loading');
        confirmExportBtn.textContent = 'Exporting...';
        confirmExportBtn.disabled = true;
        
        const startBar = parseInt(startBarSelect.value) - 1; // Convert to 0-based
        const endBar = parseInt(endBarSelect.value) - 1;     // Convert to 0-based
        const scale = parseFloat(exportScaleSelect.value);
        
        // Ensure rendering is complete
        if (!isRenderingComplete) {
            console.log('Waiting for rendering to complete...');
            await waitForRenderingComplete();
        }
        
        // Get the AlphaTab container and find all canvas elements
        const alphaTabContainer = document.getElementById('alphaTab');
        if (!alphaTabContainer) {
            throw new Error('AlphaTab container not found');
        }
        
        // Find all canvas elements in the container
        const canvases = alphaTabContainer.querySelectorAll('canvas');
        console.log(`Found ${canvases.length} canvas elements`);
        
        if (canvases.length === 0) {
            throw new Error('No canvas elements found. Make sure the score is fully rendered.');
        }
        
        // Create a composite canvas from all AlphaTab canvases
        const compositeCanvas = await createCompositeCanvas(canvases, scale);
        
        // Apply cropping if visual crop selection exists
        let finalCanvas = compositeCanvas;
        if (window.customCropSelection) {
            console.log('Applying custom crop selection:', window.customCropSelection);
            finalCanvas = applyCropToCanvas(compositeCanvas, window.customCropSelection, scale);
        }
        
        // Convert to JPEG and download
        const jpegBlob = await canvasToJpegBlob(finalCanvas, 0.95); // 95% quality
        
        // Create filename
        const scoreTitle = currentScore.title || 'guitar-tab';
        const sanitizedTitle = scoreTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const barRange = startBar === endBar ? `bar_${startBar + 1}` : `bars_${startBar + 1}-${endBar + 1}`;
        const filename = `${sanitizedTitle}_${barRange}.jpg`;
        
        // Download the file
        downloadBlob(jpegBlob, filename);
        
        console.log('JPEG export completed successfully');
        
        // Close modal after successful export
        setTimeout(() => {
            closeModal();
        }, 500);
        
    } catch (error) {
        console.error('JPEG export failed:', error);
        alert(`Export failed: ${error.message}`);
        
        // Reset button state
        confirmExportBtn.classList.remove('loading');
        confirmExportBtn.textContent = 'Export JPEG';
        confirmExportBtn.disabled = false;
    }
}

// Create a composite canvas from multiple canvas elements
async function createCompositeCanvas(canvases, scale = 1) {
    console.log('Creating composite canvas...');
    
    // Calculate total dimensions using actual canvas dimensions
    let totalWidth = 0;
    let totalHeight = 0;
    let maxWidth = 0;
    
    // First pass: calculate dimensions using actual canvas size
    for (const canvas of canvases) {
        maxWidth = Math.max(maxWidth, canvas.width);
        totalHeight += canvas.height;
    }
    
    totalWidth = maxWidth;
    
    console.log(`Composite canvas dimensions: ${totalWidth}x${totalHeight} (scale: ${scale})`);
    
    // Create the composite canvas
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = totalWidth * scale;
    compositeCanvas.height = totalHeight * scale;
    
    const ctx = compositeCanvas.getContext('2d');
    ctx.scale(scale, scale);
    
    // Set white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, totalWidth, totalHeight);
    
    // Second pass: draw all canvases using their actual dimensions
    let currentY = 0;
    for (const canvas of canvases) {
        try {
            // Draw the canvas content using actual canvas dimensions
            ctx.drawImage(canvas, 0, currentY, canvas.width, canvas.height);
            currentY += canvas.height;
        } catch (error) {
            console.warn('Failed to draw canvas:', error);
            // Continue with other canvases
        }
    }
    
    console.log('Composite canvas created successfully');
    return compositeCanvas;
}

// Apply crop selection to canvas
function applyCropToCanvas(sourceCanvas, cropSelection, scale = 1) {
    console.log('Applying crop to canvas...');
    
    const { x, y, width, height } = cropSelection;
    
    // Scale the crop coordinates
    const scaledX = x * scale;
    const scaledY = y * scale;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    
    // Create cropped canvas
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = scaledWidth;
    croppedCanvas.height = scaledHeight;
    
    const ctx = croppedCanvas.getContext('2d');
    
    // Set white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, scaledWidth, scaledHeight);
    
    // Draw the cropped portion
    ctx.drawImage(
        sourceCanvas,
        scaledX, scaledY, scaledWidth, scaledHeight,  // Source rectangle
        0, 0, scaledWidth, scaledHeight               // Destination rectangle
    );
    
    console.log(`Crop applied: ${scaledWidth}x${scaledHeight} from (${scaledX}, ${scaledY})`);
    return croppedCanvas;
}

// Convert canvas to JPEG blob
async function canvasToJpegBlob(canvas, quality = 0.95) {
    return new Promise((resolve, reject) => {
        try {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to create JPEG blob'));
                }
            }, 'image/jpeg', quality);
        } catch (error) {
            reject(error);
        }
    });
}

// Download blob as file
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 100);
    
    console.log(`File downloaded: ${filename}`);
}

// Wait for rendering to complete
function waitForRenderingComplete(timeout = 10000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const checkRendering = () => {
            if (isRenderingComplete) {
                resolve();
            } else if (Date.now() - startTime > timeout) {
                reject(new Error('Rendering timeout'));
            } else {
                setTimeout(checkRendering, 100);
            }
        };
        
        checkRendering();
    });
}

// Update score for export functionality
function updateScoreForExport(score) {
    currentScore = score;
    
    // Enable export button
    exportPngBtn.disabled = false;
    exportPngBtn.title = 'Export Tab (HTML/JPEG)';
    
    // Enable visual crop button
    visualCropBtn.disabled = false;
    visualCropBtn.title = 'Visual Crop Tool - Click to select crop area';
    
    // Enable loop button
    const loopBtn = document.getElementById('loopBtn');
    if (loopBtn) {
        loopBtn.disabled = false;
        loopBtn.title = 'Loop Selected Bars';
    }
    
    // Initialize loop system
    loopSystem.initialize();
    loopSystem.setEnabled(true);
    loopSystem.reset();
    
    console.log('Score updated for export and loop functionality');
}

// Initialize visual cropping functionality
function initializeVisualCropping() {
    console.log('Visual cropping functionality initialized');
}

// Toggle visual cropping mode
function toggleVisualCropping() {
    console.log('Visual cropping toggle - functionality to be implemented');
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
    console.log('Loading GP files from subfolders...');
    
    try {
        // Define the subfolders to scan
        const subfolders = [
            { name: 'Scale Exercises', path: 'Scale%20Exercises/', category: 'scale-exercises' },
            { name: 'Licks', path: 'Licks/', category: 'licks' },
            { name: 'Chord Progressions', path: 'Chord%20Progressions/', category: 'chord-progressions' },
            { name: 'Songs', path: 'Songs/', category: 'songs' },
            { name: 'Arpeggios', path: 'Arpeggios/', category: 'arpeggios' }
        ];
        
        // Clear existing files
        gpFiles = [];
        filteredFiles = [];
        
        let totalFilesFound = 0;
        
        // Scan each subfolder
        for (const subfolder of subfolders) {
            try {
                console.log(`Scanning ${subfolder.name} folder...`);
                const response = await fetch(`./public/GP Files/${subfolder.path}`);
                
                if (response.ok) {
                    const html = await response.text();
                    const files = parseDirectoryListing(html);
                    
                    files.forEach(fileName => {
                        if (isValidGpFile(fileName)) {
                            const filePath = `./public/GP Files/${subfolder.name}/${fileName}`;
                            addGpFileToList(fileName, filePath, subfolder.category);
                            totalFilesFound++;
                        }
                    });
                    
                    console.log(`Found ${files.filter(isValidGpFile).length} GP files in ${subfolder.name}`);
                } else {
                    console.warn(`Could not access ${subfolder.name} folder:`, response.status);
                }
            } catch (error) {
                console.warn(`Error scanning ${subfolder.name}:`, error);
            }
        }
        
        updateFilesList();
        console.log(`Loaded ${totalFilesFound} GP files total from all subfolders`);
        
    } catch (error) {
        console.error('Error loading files from subfolders:', error);
        console.log('Falling back to known files...');
        addKnownGpFiles();
    }
}

function parseDirectoryListing(html) {
    // Parse the HTML directory listing to extract filenames
    const files = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Look for links that represent files (not directories)
    const links = doc.querySelectorAll('a[href]');
    
    links.forEach(link => {
        const href = link.getAttribute('href');
        // Skip parent directory link and directories
        if (href && href !== '../' && !href.endsWith('/')) {
            // Decode URL-encoded filenames
            const fileName = decodeURIComponent(href);
            files.push(fileName);
        }
    });
    
    return files;
}

function isValidGpFile(fileName) {
    const fileExtension = fileName.split('.').pop().toLowerCase();
    return ['gp', 'gp3', 'gp4', 'gp5', 'gpx', 'gp6', 'gp7'].includes(fileExtension);
}

function addGpFileToList(fileName, filePath, category = 'scale-exercises') {
    const newFile = {
        id: gpFiles.length + 1,
        name: fileName,
        category: category,
        size: 'Unknown', // Would need server-side info for actual size
        dateModified: new Date(),
        path: filePath
    };
    
    gpFiles.push(newFile);
    console.log('Added file to GP Browser:', fileName, `(${category})`);
}

// Make functions globally available for manual file addition and refresh
window.addGpFile = addGpFile;
window.refreshGpFiles = refreshGpFiles;
window.testLoopButton = testLoopButton;

function addKnownGpFiles() {
    // Fallback for when directory scanning fails
    console.log('Using fallback file list...');
    gpFiles = [];
    filteredFiles = [];
    updateFilesList();
    console.log('GP Files Browser ready - add files to ./public/GP Files/ and refresh');
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
    
    addGpFileToList(fileName, filePath, category);
    applyFiltersAndSort();
    console.log('Manually added file to GP Browser:', fileName, `(${category})`);
}

function refreshGpFiles() {
    console.log('Refreshing GP files list...');
    loadGpFilesFromDirectory();
}