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

// Current file tracking for download functionality
let currentFileData = null;
let currentFileName = null;

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
    initializeAlphaTab();
    setupEventListeners();
    initializeGpFilesBrowser(); // Initialize GP Files Browser
    
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
    currentScore = score;
    
    // Enable print button
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
        printBtn.disabled = false;
        printBtn.title = 'Print Tab';
    }
    
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
    
    console.log('Score updated for print and loop functionality');
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

// Make functions globally available for manual file addition and refresh
window.addGpFile = addGpFile;
window.refreshGpFiles = refreshGpFiles;
window.testLoopButton = testLoopButton;

function addKnownGpFiles() {
    // This function is no longer needed since we use a hardcoded list
    // Kept for backward compatibility
    console.log('Using hardcoded file list - no fallback needed');
}

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
        // This opens a popup window with A4-optimized print layout
        // It automatically handles:
        // - Proper scaling (0.8x)
        // - Disabled lazy loading
        // - Print-optimized layout
        // - Song title and artist in document title
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

// Enable/disable control buttons
function enableControls() {
    // Implementation of enableControls function
}

// Get smart categorized instrument options based on current program
function getInstrumentOptions(currentProgram) {
    let options = '';
    
    // Determine instrument family and create categorized options
    if (currentProgram >= 24 && currentProgram <= 31) {
        // Guitar Family
        options += '<optgroup label="Guitar Family">';
        const guitarInstruments = [
            {value: 24, name: "Acoustic Guitar (nylon)"},
            {value: 25, name: "Acoustic Guitar (steel)"},
            {value: 26, name: "Electric Guitar (jazz)"},
            {value: 27, name: "Electric Guitar (clean)"},
            {value: 28, name: "Electric Guitar (muted)"},
            {value: 29, name: "Overdriven Guitar"},
            {value: 30, name: "Distortion Guitar"},
            {value: 31, name: "Guitar Harmonics"}
        ];
        
        guitarInstruments.forEach(inst => {
            const selected = inst.value === currentProgram ? ' selected' : '';
            options += `<option value="${inst.value}"${selected}>${inst.name}</option>`;
        });
        options += '</optgroup>';
        
        // Related Stringed Instruments
        options += '<optgroup label="Related Stringed">';
        const relatedStringed = [
            {value: 105, name: "Banjo"},
            {value: 104, name: "Sitar"},
            {value: 106, name: "Shamisen"},
            {value: 110, name: "Fiddle"}
        ];
        
        relatedStringed.forEach(inst => {
            const selected = inst.value === currentProgram ? ' selected' : '';
            options += `<option value="${inst.value}"${selected}>${inst.name}</option>`;
        });
        options += '</optgroup>';
        
        // Bass Options
        options += '<optgroup label="Bass">';
        const bassInstruments = [
            {value: 32, name: "Acoustic Bass"},
            {value: 33, name: "Electric Bass (finger)"},
            {value: 34, name: "Electric Bass (pick)"},
            {value: 35, name: "Fretless Bass"},
            {value: 36, name: "Slap Bass 1"},
            {value: 37, name: "Slap Bass 2"}
        ];
        
        bassInstruments.forEach(inst => {
            const selected = inst.value === currentProgram ? ' selected' : '';
            options += `<option value="${inst.value}"${selected}>${inst.name}</option>`;
        });
        options += '</optgroup>';
        
    } else if (currentProgram >= 32 && currentProgram <= 39) {
        // Bass Family
        options += '<optgroup label="Bass Family">';
        const bassInstruments = [
            {value: 32, name: "Acoustic Bass"},
            {value: 33, name: "Electric Bass (finger)"},
            {value: 34, name: "Electric Bass (pick)"},
            {value: 35, name: "Fretless Bass"},
            {value: 36, name: "Slap Bass 1"},
            {value: 37, name: "Slap Bass 2"},
            {value: 38, name: "Synth Bass 1"},
            {value: 39, name: "Synth Bass 2"}
        ];
        
        bassInstruments.forEach(inst => {
            const selected = inst.value === currentProgram ? ' selected' : '';
            options += `<option value="${inst.value}"${selected}>${inst.name}</option>`;
        });
        options += '</optgroup>';
        
        // Related Low-End
        options += '<optgroup label="Related Low-End">';
        const relatedLow = [
            {value: 42, name: "Cello"},
            {value: 43, name: "Contrabass"},
            {value: 58, name: "Tuba"}
        ];
        
        relatedLow.forEach(inst => {
            const selected = inst.value === currentProgram ? ' selected' : '';
            options += `<option value="${inst.value}"${selected}>${inst.name}</option>`;
        });
        options += '</optgroup>';
        
    } else if (currentProgram >= 0 && currentProgram <= 7) {
        // Piano Family
        options += '<optgroup label="Piano Family">';
        const pianoInstruments = [
            {value: 0, name: "Acoustic Grand Piano"},
            {value: 1, name: "Bright Acoustic Piano"},
            {value: 2, name: "Electric Grand Piano"},
            {value: 3, name: "Honky-tonk Piano"},
            {value: 4, name: "Electric Piano 1"},
            {value: 5, name: "Electric Piano 2"},
            {value: 6, name: "Harpsichord"},
            {value: 7, name: "Clavinet"}
        ];
        
        pianoInstruments.forEach(inst => {
            const selected = inst.value === currentProgram ? ' selected' : '';
            options += `<option value="${inst.value}"${selected}>${inst.name}</option>`;
        });
        options += '</optgroup>';
        
        // Keyboard Related
        options += '<optgroup label="Keyboards">';
        const keyboards = [
            {value: 16, name: "Drawbar Organ"},
            {value: 17, name: "Percussive Organ"},
            {value: 18, name: "Rock Organ"},
            {value: 21, name: "Accordion"}
        ];
        
        keyboards.forEach(inst => {
            const selected = inst.value === currentProgram ? ' selected' : '';
            options += `<option value="${inst.value}"${selected}>${inst.name}</option>`;
        });
        options += '</optgroup>';
        
    } else if (currentProgram >= 40 && currentProgram <= 47) {
        // Orchestral Strings
        options += '<optgroup label="Orchestral Strings">';
        const strings = [
            {value: 40, name: "Violin"},
            {value: 41, name: "Viola"},
            {value: 42, name: "Cello"},
            {value: 43, name: "Contrabass"},
            {value: 44, name: "Tremolo Strings"},
            {value: 45, name: "Pizzicato Strings"},
            {value: 46, name: "Orchestral Harp"},
            {value: 47, name: "Timpani"}
        ];
        
        strings.forEach(inst => {
            const selected = inst.value === currentProgram ? ' selected' : '';
            options += `<option value="${inst.value}"${selected}>${inst.name}</option>`;
        });
        options += '</optgroup>';
        
        // String Ensembles
        options += '<optgroup label="String Ensembles">';
        const ensembles = [
            {value: 48, name: "String Ensemble 1"},
            {value: 49, name: "String Ensemble 2"},
            {value: 50, name: "Synth Strings 1"},
            {value: 51, name: "Synth Strings 2"}
        ];
        
        ensembles.forEach(inst => {
            const selected = inst.value === currentProgram ? ' selected' : '';
            options += `<option value="${inst.value}"${selected}>${inst.name}</option>`;
        });
        options += '</optgroup>';
        
    } else if (currentProgram >= 56 && currentProgram <= 63) {
        // Brass Family
        options += '<optgroup label="Brass Family">';
        const brass = [
            {value: 56, name: "Trumpet"},
            {value: 57, name: "Trombone"},
            {value: 58, name: "Tuba"},
            {value: 59, name: "Muted Trumpet"},
            {value: 60, name: "French Horn"},
            {value: 61, name: "Brass Section"},
            {value: 62, name: "Synth Brass 1"},
            {value: 63, name: "Synth Brass 2"}
        ];
        
        brass.forEach(inst => {
            const selected = inst.value === currentProgram ? ' selected' : '';
            options += `<option value="${inst.value}"${selected}>${inst.name}</option>`;
        });
        options += '</optgroup>';
        
    } else if (currentProgram >= 64 && currentProgram <= 79) {
        // Wind Instruments
        options += '<optgroup label="Reed Instruments">';
        const reeds = [
            {value: 64, name: "Soprano Sax"},
            {value: 65, name: "Alto Sax"},
            {value: 66, name: "Tenor Sax"},
            {value: 67, name: "Baritone Sax"},
            {value: 68, name: "Oboe"},
            {value: 69, name: "English Horn"},
            {value: 70, name: "Bassoon"},
            {value: 71, name: "Clarinet"}
        ];
        
        reeds.forEach(inst => {
            const selected = inst.value === currentProgram ? ' selected' : '';
            options += `<option value="${inst.value}"${selected}>${inst.name}</option>`;
        });
        options += '</optgroup>';
        
        options += '<optgroup label="Flutes">';
        const flutes = [
            {value: 72, name: "Piccolo"},
            {value: 73, name: "Flute"},
            {value: 74, name: "Recorder"},
            {value: 75, name: "Pan Flute"}
        ];
        
        flutes.forEach(inst => {
            const selected = inst.value === currentProgram ? ' selected' : '';
            options += `<option value="${inst.value}"${selected}>${inst.name}</option>`;
        });
        options += '</optgroup>';
        
    } else {
        // For other instruments, show a general categorized list
        options += '<optgroup label="Popular Instruments">';
        const popular = [
            {value: 0, name: "Piano"},
            {value: 25, name: "Acoustic Guitar"},
            {value: 27, name: "Electric Guitar (clean)"},
            {value: 29, name: "Overdriven Guitar"},
            {value: 33, name: "Electric Bass"},
            {value: 40, name: "Violin"},
            {value: 56, name: "Trumpet"},
            {value: 65, name: "Alto Sax"},
            {value: 73, name: "Flute"}
        ];
        
        popular.forEach(inst => {
            const selected = inst.value === currentProgram ? ' selected' : '';
            options += `<option value="${inst.value}"${selected}>${inst.name}</option>`;
        });
        options += '</optgroup>';
        
        // Current instrument if not in popular list
        if (!popular.find(inst => inst.value === currentProgram)) {
            options += '<optgroup label="Current">';
            const currentName = getGeneralMidiInstrumentName(currentProgram);
            options += `<option value="${currentProgram}" selected>${currentName}</option>`;
            options += '</optgroup>';
        }
    }
    
    // Always add a "More Instruments" option that shows common alternatives
    options += '<optgroup label="More Options">';
    const moreOptions = [
        {value: 0, name: "Piano"},
        {value: 25, name: "Acoustic Guitar"},
        {value: 29, name: "Overdriven Guitar"},
        {value: 33, name: "Electric Bass"},
        {value: 40, name: "Violin"},
        {value: 48, name: "String Ensemble"},
        {value: 56, name: "Trumpet"},
        {value: 65, name: "Alto Sax"},
        {value: 73, name: "Flute"},
        {value: 105, name: "Banjo"}
    ];
    
    moreOptions.forEach(inst => {
        if (inst.value !== currentProgram) { // Don't duplicate current instrument
            options += `<option value="${inst.value}">${inst.name}</option>`;
        }
    });
    options += '</optgroup>';
    
    return options;
}

// Handle instrument change
function handleInstrumentChange(event) {
    if (!event.target.classList.contains('instrument-select')) return;
    
    const trackIndex = parseInt(event.target.getAttribute('data-track'));
    const newProgram = parseInt(event.target.value);
    
    console.log(`Changing track ${trackIndex} instrument to program ${newProgram}`);
    
    // Update the track's program in the score
    if (api && api.score && api.score.tracks[trackIndex]) {
        const track = api.score.tracks[trackIndex];
        const oldProgram = track.playbackInfo.program;
        
        // Update the track's program number
        track.playbackInfo.program = newProgram;
        
        console.log(`Track ${trackIndex} instrument changed from ${oldProgram} to ${newProgram}`);
        
        // Update the track info display
        updateTrackInstrumentDisplay(trackIndex, newProgram);
        
        // Apply the instrument change using score reload
        applyInstrumentChangeViaScoreReload(trackIndex, newProgram);
    }
}

// Apply instrument change by reloading the modified score
function applyInstrumentChangeViaScoreReload(trackIndex, newProgram) {
    if (!api || !api.score) {
        console.log('No API or score available for instrument change');
        return;
    }
    
    try {
        console.log(`Applying instrument change for track ${trackIndex} -> program ${newProgram}`);
        
        // Remember current playback state
        const wasPlaying = api.playerState === 1;
        const currentPosition = api.tickPosition || 0;
        
        // Force the player to reload with the new instrument settings
        // This is the most reliable way to ensure instrument changes work
        if (isPlayerReady) {
            // Stop current playback if playing
            if (wasPlaying) {
                api.stop();
            }
            
            // Small delay to ensure stop is processed
            setTimeout(() => {
                // Trigger a reload of the audio with the updated score
                // This forces AlphaTab to re-initialize with the new program numbers
                console.log('Reloading audio with updated instrument settings...');
                
                // The score has already been modified, so we just need to trigger
                // a re-initialization of the player audio system
                if (api.player && api.player.ready) {
                    // Try to reload just the MIDI data
                    try {
                        // This forces AlphaTab to regenerate the MIDI with new instruments
                        api.renderScore(api.score);
                        console.log('✓ Score re-rendered with new instruments');
                        
                        // Restore playback position and state after a delay
                        setTimeout(() => {
                            if (currentPosition > 0) {
                                api.tickPosition = currentPosition;
                            }
                            if (wasPlaying) {
                                api.playPause();
                            }
                            console.log('✓ Instrument change applied successfully');
                        }, 500);
                        
                    } catch (error) {
                        console.log('Score re-render failed, trying alternative method');
                        applyInstrumentChangeFallback(trackIndex, newProgram, wasPlaying, currentPosition);
                    }
                } else {
                    console.log('Player not ready, instrument change will apply on next load');
                }
            }, 100);
        } else {
            console.log('Player not ready, instrument change queued for when ready');
            queueInstrumentChange(trackIndex, newProgram);
        }
        
    } catch (error) {
        console.error('Error applying instrument change:', error);
        console.log('Falling back to queued approach');
        queueInstrumentChange(trackIndex, newProgram);
    }
}

// Fallback method for instrument changes
function applyInstrumentChangeFallback(trackIndex, newProgram, wasPlaying, currentPosition) {
    console.log('Using fallback method for instrument change');
    
    try {
        // As a last resort, queue the change for next playback
        queueInstrumentChange(trackIndex, newProgram);
        
        // Show user feedback
        const trackItem = document.querySelector(`[data-track-index="${trackIndex}"]`);
        if (trackItem) {
            // Add a visual indicator that the change will apply on next play
            trackItem.style.opacity = '0.8';
            trackItem.style.background = 'rgba(255, 193, 7, 0.1)';
            
            setTimeout(() => {
                trackItem.style.opacity = '';
                trackItem.style.background = '';
            }, 2000);
        }
        
        // Inform the user
        showInstrumentChangeMessage('Instrument change will apply on next playback');
        
        // If was playing, restart to apply immediately
        if (wasPlaying) {
            setTimeout(() => {
                if (currentPosition > 0) {
                    api.tickPosition = currentPosition;
                }
                api.playPause();
            }, 500);
        }
        
    } catch (error) {
        console.error('Fallback method also failed:', error);
    }
}

// Show instrument change message to user
function showInstrumentChangeMessage(message) {
    // Create or update the message display
    let messageDiv = document.getElementById('instrumentChangeMessage');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'instrumentChangeMessage';
        messageDiv.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: #FFC107;
            color: #000;
            padding: 12px 18px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            font-family: 'Inter', sans-serif;
            max-width: 300px;
        `;
        document.body.appendChild(messageDiv);
    }
    
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    messageDiv.style.opacity = '1';
    
    // Auto-hide after delay
    setTimeout(() => {
        if (messageDiv) {
            messageDiv.style.opacity = '0';
            setTimeout(() => {
                if (messageDiv && messageDiv.style.opacity === '0') {
                    messageDiv.style.display = 'none';
                }
            }, 300);
        }
    }, 3000);
}

// Queue instrument changes for later application (simplified)
function queueInstrumentChange(trackIndex, newProgram) {
    if (!window.queuedInstrumentChanges) {
        window.queuedInstrumentChanges = new Map();
    }
    window.queuedInstrumentChanges.set(trackIndex, newProgram);
    console.log(`Queued instrument change: Track ${trackIndex} -> Program ${newProgram}`);
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

// Update track instrument display
function updateTrackInstrumentDisplay(trackIndex, newProgram) {
    const trackItem = document.querySelector(`[data-track-index="${trackIndex}"]`);
    if (!trackItem) return;
    
    const trackInfoDetails = trackItem.querySelector('.track-info-details');
    if (!trackInfoDetails) return;
    
    // Get the new instrument name
    const newInstrumentName = getGeneralMidiInstrumentName(newProgram);
    
    // Update the displayed instrument info
    const track = api.score.tracks[trackIndex];
    const updatedInstrumentInfo = getInstrumentInfo(track, trackIndex);
    trackInfoDetails.innerHTML = updatedInstrumentInfo;
    
    console.log(`Updated display for track ${trackIndex}: ${newInstrumentName}`);
}

// Debug function to check synthesizer capabilities
function debugSynthesizer() {
    console.log('=== SYNTHESIZER DEBUG INFO ===');
    
    if (!api) {
        console.log('❌ No API available');
        return;
    }
    
    console.log('✓ API available');
    console.log('Player ready:', isPlayerReady);
    console.log('Player state:', api.playerState);
    
    if (!api.player) {
        console.log('❌ No player available');
        return;
    }
    
    console.log('✓ Player available');
    console.log('Player type:', typeof api.player);
    console.log('Player methods:', Object.getOwnPropertyNames(api.player).filter(name => typeof api.player[name] === 'function'));
    
    if (!api.player.synthesizer) {
        console.log('❌ No synthesizer available');
        return;
    }
    
    const synth = api.player.synthesizer;
    console.log('✓ Synthesizer available');
    console.log('Synthesizer type:', typeof synth);
    console.log('Synthesizer constructor:', synth.constructor.name);
    console.log('Synthesizer methods:', Object.getOwnPropertyNames(synth).filter(name => typeof synth[name] === 'function'));
    
    // Check for specific methods
    const methods = ['programChange', 'sendEvent', 'setChannelProgram', 'midiEvent'];
    methods.forEach(method => {
        const available = typeof synth[method] === 'function';
        console.log(`${available ? '✓' : '❌'} synth.${method}:`, available ? 'available' : 'not available');
    });
    
    // Check API level methods
    const apiMethods = ['changeTrackProgram', 'changeTrackVolume'];
    apiMethods.forEach(method => {
        const available = typeof api[method] === 'function';
        console.log(`${available ? '✓' : '❌'} api.${method}:`, available ? 'available' : 'not available');
    });
    
    // Check current score and tracks
    if (api.score && api.score.tracks) {
        console.log('✓ Score loaded with', api.score.tracks.length, 'tracks');
        api.score.tracks.forEach((track, index) => {
            console.log(`Track ${index}:`, {
                name: track.name,
                program: track.playbackInfo.program,
                primaryChannel: track.playbackInfo.primaryChannel,
                secondaryChannel: track.playbackInfo.secondaryChannel
            });
        });
    } else {
        console.log('❌ No score loaded');
    }
    
    console.log('=== END DEBUG INFO ===');
}// Make debug function globally available
window.debugSynthesizer = debugSynthesizer;

function handleVolumeChange(event) {
    if (!event.target.classList.contains('volume-slider')) return;
    
    const trackIndex = parseInt(event.target.getAttribute('data-track'));
    const volume = parseInt(event.target.value) / 100;
    
    // Update volume display
    const volumeDisplay = event.target.parentNode.querySelector('.volume-display');
    volumeDisplay.textContent = `${event.target.value}%`;
    
    // Update AlphaTab volume
    if (api && isPlayerReady) {
        api.changeTrackVolume([trackIndex], volume);
    }
    
    // Store volume in track state
    if (trackStates[trackIndex]) {
        trackStates[trackIndex].volume = volume;
    }
}

// Initialize track controls toggle
const toggleTrackControlsBtn = document.getElementById('toggleTrackControls');
const bulkControls = document.querySelector('.bulk-controls');
let trackControlsVisible = false; // Start hidden by default

if (toggleTrackControlsBtn) {
    // Set initial state - hidden
    if (tracksGrid) tracksGrid.style.display = 'none';
    if (bulkControls) bulkControls.style.display = 'none';
    toggleTrackControlsBtn.textContent = '👁️';
    toggleTrackControlsBtn.title = 'Show Track Controls';
    
    toggleTrackControlsBtn.addEventListener('click', () => {
        trackControlsVisible = !trackControlsVisible;
        
        if (trackControlsVisible) {
            if (tracksGrid) tracksGrid.style.display = 'flex';
            if (bulkControls) bulkControls.style.display = 'flex';
            toggleTrackControlsBtn.textContent = '🙈';
            toggleTrackControlsBtn.title = 'Hide Track Controls';
        } else {
            if (tracksGrid) tracksGrid.style.display = 'none';
            if (bulkControls) bulkControls.style.display = 'none';
            toggleTrackControlsBtn.textContent = '👁️';
            toggleTrackControlsBtn.title = 'Show Track Controls';
        }
    });
}

// Initialize library toggle
const toggleLibraryBtn = document.getElementById('toggleLibrary');
const browserContent = document.getElementById('browserContent');
let libraryVisible = true;

if (toggleLibraryBtn && browserContent) {
    toggleLibraryBtn.addEventListener('click', () => {
        libraryVisible = !libraryVisible;
        
        if (libraryVisible) {
            browserContent.style.display = 'block';
            toggleLibraryBtn.textContent = '🙈';
            toggleLibraryBtn.title = 'Hide Library';
        } else {
            browserContent.style.display = 'none';
            toggleLibraryBtn.textContent = '👁️';
            toggleLibraryBtn.title = 'Show Library';
        }
    });
}

// Mobile touch control functions for pause/play from touch position
function setupScoreTouchControls() {
    const scoreElement = document.querySelector('#alphaTab');
    if (!scoreElement) {
        console.log('Score element not found for touch controls');
        return;
    }
    
    console.log('Setting up mobile score touch controls with popup');
    
    // Track mobile device detection
    const isMobile = () => window.innerWidth <= 768 || 'ontouchstart' in window;
    
    // Use AlphaTab's beatMouseDown event for precise position detection
    if (api) {
        api.beatMouseDown.on((beat) => {
            if (isMobile() && beat) {
                handleMobileBeatTouch(beat);
            }
        });
    }
    
    // Fallback touch event for mobile devices
    scoreElement.addEventListener('touchend', (event) => {
        if (isMobile()) {
            event.preventDefault();
            handleMobileScoreTouch(event);
        }
    }, { passive: false });
}

function handleMobileBeatTouch(beat) {
    if (!api || !beat) return;
    
    console.log('Mobile beat touch detected:', beat);
    
    // Store the touched beat position for later use
    window.touchedBeatPosition = beat.absolutePlaybackStart;
    
    // Show the mobile control popup at the touch position
    showMobileControlPopup(event || { touches: [{ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }] });
}

function handleMobileScoreTouch(event) {
    // Fallback for when beat detection doesn't work
    if (!api) return;
    
    console.log('Mobile score touch detected');
    
    // Store current position as fallback
    window.touchedBeatPosition = api.tickPosition || 0;
    
    // Show the mobile control popup at the touch position
    showMobileControlPopup(event);
}

function showMobileControlPopup(event) {
    // Remove any existing popup
    const existingPopup = document.getElementById('mobileControlPopup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Get touch position
    const touch = event.touches ? event.touches[0] || event.changedTouches[0] : event;
    const touchX = touch ? touch.clientX : window.innerWidth / 2;
    const touchY = touch ? touch.clientY : window.innerHeight / 2;
    
    // Create popup container
    const popup = document.createElement('div');
    popup.id = 'mobileControlPopup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #FF8C00, #D2691E);
        border-radius: 20px;
        padding: 8px;
        display: flex;
        gap: 8px;
        z-index: 3000;
        box-shadow: 0 12px 40px rgba(255, 140, 0, 0.6);
        backdrop-filter: blur(15px);
        border: 1px solid rgba(255, 140, 0, 0.4);
        animation: popupFadeIn 0.2s ease-out;
    `;
    
    // Add CSS animation
    if (!document.getElementById('mobilePopupStyles')) {
        const style = document.createElement('style');
        style.id = 'mobilePopupStyles';
        style.textContent = `
            @keyframes popupFadeIn {
                from {
                    opacity: 0;
                    transform: scale(0.8);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            @keyframes popupFadeOut {
                from {
                    opacity: 1;
                    transform: scale(1);
                }
                to {
                    opacity: 0;
                    transform: scale(0.8);
                }
            }
            
            .mobile-control-btn {
                width: 50px;
                height: 50px;
                border: none;
                border-radius: 50%;
                background: rgba(255, 140, 0, 0.85);
                color: #FFFFFF;
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
                backdrop-filter: blur(5px);
                border: 1px solid rgba(255, 140, 0, 0.4);
                box-shadow: 0 4px 15px rgba(255, 140, 0, 0.3);
            }
            
            .mobile-control-btn:hover,
            .mobile-control-btn:active {
                background: rgba(255, 140, 0, 0.9);
                transform: scale(1.1);
                border: 1px solid rgba(255, 140, 0, 0.6);
                box-shadow: 0 6px 20px rgba(255, 140, 0, 0.4);
            }
            
            .mobile-control-btn.play {
                background: linear-gradient(135deg, #FF8C00, #FF7F50);
                border: 1px solid rgba(255, 140, 0, 0.4);
                color: #FFFFFF;
            }
            
            .mobile-control-btn.play:hover,
            .mobile-control-btn.play:active {
                background: linear-gradient(135deg, #FFA500, #FF8C00);
                border: 1px solid rgba(255, 140, 0, 0.6);
                box-shadow: 0 6px 20px rgba(255, 140, 0, 0.4);
            }
            
            .mobile-control-btn.pause {
                background: linear-gradient(135deg, #D2691E, #CD853F);
                border: 1px solid rgba(255, 140, 0, 0.4);
                color: #FFFFFF;
            }
            
            .mobile-control-btn.pause:hover,
            .mobile-control-btn.pause:active {
                background: linear-gradient(135deg, #FF8C00, #D2691E);
                border: 1px solid rgba(255, 140, 0, 0.6);
                box-shadow: 0 6px 20px rgba(255, 140, 0, 0.4);
            }
            
            .mobile-control-btn.stop {
                background: linear-gradient(135deg, #B8860B, #DAA520);
                border: 1px solid rgba(255, 140, 0, 0.4);
                color: #FFFFFF;
            }
            
            .mobile-control-btn.stop:hover,
            .mobile-control-btn.stop:active {
                background: linear-gradient(135deg, #D2691E, #B8860B);
                border: 1px solid rgba(255, 140, 0, 0.6);
                box-shadow: 0 6px 20px rgba(255, 140, 0, 0.4);
            }
        `;
        document.head.appendChild(style);
    }
    
    // Determine current playback state
    const isCurrentlyPlaying = api.playerState === 1; // PlayerState.Playing
    const isPaused = api.playerState === 2; // PlayerState.Paused
    
    // Create control buttons based on current state
    if (isCurrentlyPlaying) {
        // Show pause and stop buttons
        const pauseBtn = createMobileControlButton('⏸️', 'pause', () => {
            pauseAtTouchedPosition();
            hideMobileControlPopup();
        });
        
        const stopBtn = createMobileControlButton('⏹️', 'stop', () => {
            stopPlayback();
            hideMobileControlPopup();
        });
        
        popup.appendChild(pauseBtn);
        popup.appendChild(stopBtn);
    } else {
        // Show play button (and stop if paused)
        const playBtn = createMobileControlButton('▶️', 'play', () => {
            playFromTouchedPosition();
            hideMobileControlPopup();
        });
        
        popup.appendChild(playBtn);
        
        if (isPaused) {
            const stopBtn = createMobileControlButton('⏹️', 'stop', () => {
                stopPlayback();
                hideMobileControlPopup();
            });
            popup.appendChild(stopBtn);
        }
    }
    
    // Add popup to page
    document.body.appendChild(popup);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        hideMobileControlPopup();
    }, 3000);
    
    // Hide on any other touch outside popup
    const hideOnTouch = (e) => {
        if (!popup.contains(e.target)) {
            hideMobileControlPopup();
            document.removeEventListener('touchstart', hideOnTouch);
        }
    };
    
    setTimeout(() => {
        document.addEventListener('touchstart', hideOnTouch);
    }, 100);
}

function createMobileControlButton(icon, className, onClick) {
    const button = document.createElement('button');
    button.className = `mobile-control-btn ${className}`;
    button.textContent = icon;
    button.addEventListener('click', onClick);
    button.addEventListener('touchend', (e) => {
        e.preventDefault();
        onClick();
    });
    return button;
}

function hideMobileControlPopup() {
    const popup = document.getElementById('mobileControlPopup');
    if (popup) {
        popup.style.animation = 'popupFadeOut 0.2s ease-out';
        setTimeout(() => {
            if (popup && popup.parentNode) {
                popup.remove();
            }
        }, 200);
    }
}

function pauseAtTouchedPosition() {
    if (!api) return;
    
    console.log('Pausing at touched position');
    api.pause();
    
    // Set position to touched beat if available
    if (window.touchedBeatPosition !== undefined) {
        api.tickPosition = window.touchedBeatPosition;
        console.log('Position set to touched beat:', window.touchedBeatPosition);
        showMobileMessage('⏸️ Paused at touched position', '#FF8C00');
    } else {
        showMobileMessage('⏸️ Paused', '#FF8C00');
    }
}

function playFromTouchedPosition() {
    if (!api) return;
    
    console.log('Playing from touched position');
    
    // Set position to touched beat if available
    if (window.touchedBeatPosition !== undefined) {
        api.tickPosition = window.touchedBeatPosition;
        console.log('Position set to touched beat:', window.touchedBeatPosition);
        showMobileMessage('▶️ Playing from touched position', '#FF8C00');
    } else {
        showMobileMessage('▶️ Playing', '#FF8C00');
    }
    
    api.play();
}

function stopPlayback() {
    if (!api) return;
    
    console.log('Stopping playback');
    api.stop();
    showMobileMessage('⏹️ Stopped', '#D2691E');
}

function handleScoreClick(event) {
    // Desktop behavior - only respond to double-click to avoid conflicts
    const isMobile = () => window.innerWidth <= 768 || 'ontouchstart' in window;
    
    if (!isMobile() && event.detail === 2) { // Double-click on desktop
        console.log('Desktop double-click detected - toggling playback');
        togglePlayPause();
    }
}

function togglePlayPause() {
    if (!api || !currentScore) {
        console.log('No score loaded - cannot play/pause');
        return;
    }
    
    try {
        api.playPause();
        console.log('Toggled playback');
    } catch (error) {
        console.error('Error toggling playback:', error);
    }
}

// Show mobile-specific messages
function showMobileMessage(text, color = '#4CAF50') {
    // Create or update mobile message display
    let mobileMessage = document.getElementById('mobileMessage');
    if (!mobileMessage) {
        mobileMessage = document.createElement('div');
        mobileMessage.id = 'mobileMessage';
        mobileMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${color};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            z-index: 2000;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            font-family: 'Inter', sans-serif;
            text-align: center;
            min-width: 200px;
        `;
        document.body.appendChild(mobileMessage);
    }

    mobileMessage.style.background = color;
    mobileMessage.textContent = text;
    mobileMessage.style.display = 'block';
    mobileMessage.style.opacity = '1';
    mobileMessage.style.transform = 'translate(-50%, -50%) scale(1)';

    // Auto-hide after delay
    setTimeout(() => {
        if (mobileMessage && mobileMessage.style.opacity === '1') {
            mobileMessage.style.opacity = '0';
            mobileMessage.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => {
                if (mobileMessage && mobileMessage.style.opacity === '0') {
                    mobileMessage.style.display = 'none';
                }
            }, 300);
        }
    }, 2000);
}

// Auto-scroll control functions
function setScrollMode(mode) {
    if (!api) {
        console.log('API not ready - cannot set scroll mode');
        return;
    }
    
    try {
        // Use the proper AlphaTab API method to change settings
        api.changeTrackVolume([], 1); // Dummy call to ensure API is ready
        
        // Update the settings object properly
        if (api.settings && api.settings.player) {
            api.settings.player.scrollMode = mode;
            console.log(`Scroll mode set to: ${mode} (0=Off, 1=Continuous, 2=OffScreen)`);
            
            // Force a settings update by triggering a re-render if needed
            if (api.score) {
                // The settings should take effect immediately for future playback
                console.log('Settings updated successfully');
            }
        } else {
            console.error('Settings object not available');
        }
    } catch (error) {
        console.error('Error setting scroll mode:', error);
    }
}

// Make helper function available globally
window.addNewGpFileToList = addNewGpFileToList;
window.debugSynthesizer = debugSynthesizer;
// Auto-scroll control functions
window.setScrollMode = setScrollMode;
window.toggleAutoScroll = toggleAutoScroll;
window.setScrollSpeed = setScrollSpeed;
window.setScrollOffset = setScrollOffset;
window.getScrollInfo = getScrollInfo;
// Touch control functions
window.setupScoreTouchControls = setupScoreTouchControls;
window.togglePlayPause = togglePlayPause;

// Print and download button event listeners
printBtn.addEventListener('click', printTab);
downloadBtn.addEventListener('click', downloadCurrentFile);

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
        downloadBtn.classList.add('downloading');
        downloadBtn.title = 'Downloading...';
        
        // Trigger the download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up the object URL
        URL.revokeObjectURL(downloadLink.href);
        
        // Show success message
        showDownloadMessage(`Downloaded: ${currentFileName}`, '#4CAF50');
        
        console.log('File downloaded successfully:', currentFileName);
        
    } catch (error) {
        console.error('Error downloading file:', error);
        alert('Failed to download the file. Please try again.');
        showDownloadMessage('Download failed', '#f44336');
    } finally {
        // Restore button state
        setTimeout(() => {
            downloadBtn.classList.remove('downloading');
            downloadBtn.title = 'Download Guitar Pro File';
        }, 1000);
    }
}

// Show download status message
function showDownloadMessage(text, color = '#4CAF50') {
    // Create or update download message display
    let downloadMessage = document.getElementById('downloadMessage');
    if (!downloadMessage) {
        downloadMessage = document.createElement('div');
        downloadMessage.id = 'downloadMessage';
        downloadMessage.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
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
        document.body.appendChild(downloadMessage);
    }

    downloadMessage.style.background = color;
    downloadMessage.textContent = text;
    downloadMessage.style.display = 'block';
    downloadMessage.style.opacity = '1';

    // Auto-hide after delay
    setTimeout(() => {
        if (downloadMessage && downloadMessage.style.opacity === '1') {
            downloadMessage.style.opacity = '0';
            setTimeout(() => {
                if (downloadMessage && downloadMessage.style.opacity === '0') {
                    downloadMessage.style.display = 'none';
                }
            }, 300);
        }
    }, 3000);
}

