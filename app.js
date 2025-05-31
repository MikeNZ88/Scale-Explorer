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

// Buffered playback system for improved cursor accuracy
let isBufferingPlayback = false;
const PLAYBACK_BUFFER_DELAY = 150; // 150ms buffer delay for better synchronization

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

// Print button
const printBtn = document.getElementById('printBtn');
printBtn.addEventListener('click', printTab);

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
                enableLazyLoading: false,
                tracks: [-1] // -1 means render all tracks by default
            }
        };
        
        console.log('Creating AlphaTab API with settings:', settings);
        api = new alphaTab.AlphaTabApi(container, settings);
        console.log('AlphaTab API created:', api);
        
        // Immediate audio context activation on first user interaction
        const activateAudio = () => {
            if (api && api.player && api.player.output && api.player.output.audioContext) {
                const audioContext = api.player.output.audioContext;
                if (audioContext.state === 'suspended') {
                    audioContext.resume();
                    console.log('✅ Audio context activated immediately');
                }
            }
        };
        
        // Activate on any user interaction
        document.addEventListener('click', activateAudio, { once: true });
        document.addEventListener('keydown', activateAudio, { once: true });
        
        // Event listeners
        api.scoreLoaded.on((score) => {
            console.log('Score loaded successfully:', score.title, 'Tracks:', score.tracks.length);
            isRenderingComplete = false;
            
            updateTrackInfo(score);
            enhancedUpdateScoreForPrint(score);
            enablePlayerControls(true);
        });
        
        api.renderStarted.on(() => {
            console.log('Rendering started...');
        });
        
        api.renderFinished.on(() => {
            console.log('Rendering finished - tab should be visible');
            isRenderingComplete = true;
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
            handlePlayerStateChange(e);
        });
        
        // Simple playback cursor functionality
        api.playerPositionChanged.on((e) => {
            // Basic position tracking only
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
    const metadata = extractComprehensiveMetadata(score);
    
    songTitle.textContent = metadata.title;
    songArtist.textContent = metadata.artist;
    trackCount.textContent = `Tracks: ${score.tracks.length}`;
    
    console.log('Track info updated:', metadata);
    
    // Initialize track states for all tracks as visible
    initializeTrackStates(score);
    
    // Initialize track states for each track (ensure all are visible by default)
    score.tracks.forEach((track, index) => {
        if (!trackStates[index]) {
            trackStates[index] = {
                visible: true, // Make sure all tracks are visible by default
                muted: track.playbackInfo?.isMute || false,
                solo: false
            };
        }
    });
    
    // Create track controls
    createTrackControls(score);
    
    // Render only visible tracks by default (excludes hidden drum tracks)
    if (api && api.score) {
        const visibleTrackIndices = Object.keys(trackStates)
            .map(index => parseInt(index))
            .filter(index => trackStates[index].visible);
        
        console.log('Rendering visible tracks (drums hidden by default):', visibleTrackIndices);
        
        if (visibleTrackIndices.length > 0) {
            api.renderScore(api.score, visibleTrackIndices);
        } else {
            // Fallback: if no tracks are visible, show the first track
            console.log('No visible tracks found, showing first track as fallback');
            api.renderScore(api.score, [0]);
        }
    }
    
    // Add track controls header with toggle button
    const trackControlsHeader = trackControls.querySelector('h3');
    if (trackControlsHeader) {
        trackControlsHeader.innerHTML = `
            Track Controls
            <button id="toggleTrackControls" class="toggle-controls-btn" title="Show/Hide Track Controls">
                👁️
            </button>
        `;
    }
    
    // Set track controls to be hidden by default
    const tracksGrid = document.getElementById('tracksGrid');
    const bulkControls = trackControls.querySelector('.bulk-controls');
    
    if (tracksGrid) tracksGrid.style.display = 'none';
    if (bulkControls) bulkControls.style.display = 'none';
    
    // Add toggle functionality
    const toggleButton = document.getElementById('toggleTrackControls');
    if (toggleButton) {
        toggleButton.addEventListener('click', toggleTrackControlsVisibility);
    }
    
    // Show both track info and track controls container
    trackInfo.style.display = 'block';
    trackControls.style.display = 'block';
}

// Toggle track controls visibility
function toggleTrackControlsVisibility() {
    const tracksGrid = document.getElementById('tracksGrid');
    const bulkControls = document.querySelector('.bulk-controls');
    const toggleButton = document.getElementById('toggleTrackControls');
    
    if (!tracksGrid || !toggleButton) return;
    
    const isHidden = tracksGrid.style.display === 'none';
    
    if (isHidden) {
        // Show track controls
        tracksGrid.style.display = 'flex';
        if (bulkControls) bulkControls.style.display = 'flex';
        toggleButton.innerHTML = '🙈';
        toggleButton.title = 'Hide Track Controls';
        console.log('Track controls shown');
    } else {
        // Hide track controls
        tracksGrid.style.display = 'none';
        if (bulkControls) bulkControls.style.display = 'none';
        toggleButton.innerHTML = '👁️';
        toggleButton.title = 'Show Track Controls';
        console.log('Track controls hidden');
    }
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
    const isStopped = state === 0; // PlayerState.Stopped
    
    // Don't update buttons if we're in buffering mode
    if (isBufferingPlayback) {
        console.log('⏳ Skipping button update during buffering');
        return;
    }
    
    // Update play button
    playBtn.disabled = isPlaying;
    playBtn.textContent = isPlaying ? '⏸️' : '▶️';
    
    // Update pause button
    pauseBtn.disabled = !isPlaying;
    
    // Update stop button
    stopBtn.disabled = isStopped;
    
    console.log(`🎛️ Buttons updated for state ${state}: ${isPlaying ? 'Playing' : isPaused ? 'Paused' : 'Stopped'}`);
}

// Track control functions
function initializeTrackStates(score) {
    trackStates = {};
    score.tracks.forEach((track, index) => {
        // Check if this is a drum/percussion track
        const isDrumTrack = isPercussionTrack(track);
        
        trackStates[index] = {
            visible: !isDrumTrack, // Hide drum tracks by default, show all others
            muted: false,
            solo: false
        };
        
        if (isDrumTrack) {
            console.log(`Track ${index} (${getTrackName(track, index)}) identified as drum track - hidden by default`);
        }
    });
}

// Helper function to identify percussion/drum tracks
function isPercussionTrack(track) {
    // Check multiple indicators for percussion tracks
    
    // 1. Check if explicitly marked as percussion
    if (track.percussionTrack === true) {
        return true;
    }
    
    // 2. Check playback info for percussion indicators
    if (track.playbackInfo) {
        // Channel 9 (index 9) is the standard MIDI percussion channel
        if (track.playbackInfo.primaryChannel === 9 || track.playbackInfo.secondaryChannel === 9) {
            return true;
        }
        
        // Check if explicitly marked as percussion track
        if (track.playbackInfo.isPercussionTrack === true) {
            return true;
        }
    }
    
    // 3. Check channel info for percussion
    if (track.channel) {
        if (track.channel.channel1 === 9 || track.channel.channel2 === 9) {
            return true;
        }
    }
    
    // 4. Check track name for drum/percussion keywords
    const trackName = (track.name || '').toLowerCase();
    const drumKeywords = ['drum', 'drums', 'percussion', 'perc', 'kit', 'cymbal', 'snare', 'kick', 'hihat', 'hi-hat'];
    if (drumKeywords.some(keyword => trackName.includes(keyword))) {
        return true;
    }
    
    // 5. Check instrument name for drum indicators
    const instrumentName = getInstrumentName(track).toLowerCase();
    if (drumKeywords.some(keyword => instrumentName.includes(keyword))) {
        return true;
    }
    
    return false;
}

// Create track controls for each track
function createTrackControls(score) {
    const tracksGrid = document.getElementById('tracksGrid');
    tracksGrid.innerHTML = '';
    
    score.tracks.forEach((track, index) => {
        const trackDiv = document.createElement('div');
        trackDiv.className = 'track-control';
        trackDiv.setAttribute('data-track', index);
        
        // Enhanced track information
        const trackName = getTrackName(track, index);
        const instrumentName = getInstrumentName(track);
        const programNumber = track.playbackInfo?.program || 0;
        const volume = track.playbackInfo?.volume || 16;
        const volumePercent = Math.round((volume / 16) * 100);
        
        // Effects information
        const effects = [];
        if (track.playbackInfo?.chorus > 0) effects.push(`Chorus: ${track.playbackInfo.chorus}`);
        if (track.playbackInfo?.reverb > 0) effects.push(`Reverb: ${track.playbackInfo.reverb}`);
        if (track.playbackInfo?.phaser > 0) effects.push(`Phaser: ${track.playbackInfo.phaser}`);
        if (track.playbackInfo?.tremolo > 0) effects.push(`Tremolo: ${track.playbackInfo.tremolo}`);
        
        // Channel information
        const primaryChannel = track.playbackInfo?.primaryChannel;
        const secondaryChannel = track.playbackInfo?.secondaryChannel;
        const channelText = primaryChannel !== undefined ? 
            (secondaryChannel !== undefined && secondaryChannel !== primaryChannel ? 
                `Ch ${primaryChannel + 1}/${secondaryChannel + 1}` : 
                `Ch ${primaryChannel + 1}`) : 
            'Ch Unknown';
        
        // Tuning information
        const tuningInfo = track.staves?.[0]?.tuning;
        const capo = track.staves?.[0]?.capo || 0;
        const tuningText = tuningInfo ? 
            `${tuningInfo.length} strings${capo > 0 ? `, Capo ${capo}` : ''}` : 
            'Standard';
        
        trackDiv.innerHTML = `
            <div class="track-header">
                <div class="track-title-section">
                    <h4 class="track-name">${trackName}</h4>
                    <div class="track-program-info">
                        <span class="instrument-name">${instrumentName}</span>
                    </div>
                </div>
                <div class="track-buttons">
                    <button class="visibility-btn ${trackStates[index]?.visible !== false ? 'active' : ''}" 
                            data-track="${index}" 
                            title="Toggle track visibility">
                        ${trackStates[index]?.visible !== false ? '👁️' : '🙈'}
                    </button>
                    <button class="solo-btn" 
                            data-track="${index}" 
                            title="Solo this track">
                        🎤
                    </button>
                    <button class="mute-btn ${track.playbackInfo && track.playbackInfo.isMute ? 'active' : ''}" 
                            data-track="${index}" 
                            title="Mute/unmute track">
                        🔇
                    </button>
                </div>
            </div>
            <div class="track-details">
                <div class="track-sound-info">
                    <div class="sound-param volume-control">
                        <span class="param-label">Volume:</span>
                        <div class="volume-slider-container">
                            <input type="range" 
                                   class="volume-slider" 
                                   min="0" 
                                   max="16" 
                                   value="${volume}" 
                                   data-track="${index}"
                                   title="Track volume">
                            <span class="volume-display">${volumePercent}%</span>
                        </div>
                    </div>
                    <div class="sound-param">
                        <span class="param-label">${channelText}</span>
                        <span class="param-value">${tuningText}</span>
                    </div>
                    ${effects.length > 0 ? `
                    <div class="sound-param effects">
                        <span class="param-label">Effects:</span>
                        <span class="param-value">${effects.join(', ')}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        tracksGrid.appendChild(trackDiv);
    });
    
    // Add event listeners for track buttons and volume sliders
    tracksGrid.addEventListener('click', handleTrackButtonClick);
    tracksGrid.addEventListener('input', handleVolumeChange);
    
    console.log(`Created enhanced controls for ${score.tracks.length} tracks`);
}

// Handle volume slider changes
function handleVolumeChange(event) {
    if (event.target.classList.contains('volume-slider')) {
        const trackIndex = parseInt(event.target.getAttribute('data-track'));
        const volume = parseInt(event.target.value);
        const volumePercent = Math.round((volume / 16) * 100);
        
        // Update the display
        const volumeDisplay = event.target.parentElement.querySelector('.volume-display');
        volumeDisplay.textContent = `${volumePercent}%`;
        
        // Use AlphaTab's built-in volume control
        if (api && api.score && api.score.tracks[trackIndex]) {
            try {
                // Convert volume from 0-16 scale to 0-1 scale for AlphaTab
                const normalizedVolume = volume / 16;
                
                // Use AlphaTab's changeTrackVolume method
                api.changeTrackVolume([trackIndex], normalizedVolume);
                
                // Also update the track's playback info for consistency
                api.score.tracks[trackIndex].playbackInfo.volume = volume;
                
                // Log the volume change
                console.log(`Track ${trackIndex} (${getTrackName(api.score.tracks[trackIndex], trackIndex)}) volume changed to ${volumePercent}% using AlphaTab's changeTrackVolume`);
                
            } catch (error) {
                console.error('Error updating track volume with AlphaTab:', error);
                
                // Fallback: try alternative AlphaTab methods
                try {
                    if (api.player && api.player.setChannelVolume) {
                        const track = api.score.tracks[trackIndex];
                        const primaryChannel = track.playbackInfo?.primaryChannel;
                        if (primaryChannel !== undefined) {
                            api.player.setChannelVolume(primaryChannel, volume);
                            console.log(`Fallback: Set channel ${primaryChannel} volume to ${volume}`);
                        }
                    }
                } catch (fallbackError) {
                    console.error('Fallback volume control also failed:', fallbackError);
                }
            }
        }
    }
}

// Handle track button clicks (visibility, solo, mute)
function handleTrackButtonClick(event) {
    if (!event.target.classList.contains('visibility-btn') && 
        !event.target.classList.contains('solo-btn') && 
        !event.target.classList.contains('mute-btn')) {
        return;
    }
    
    const trackIndex = parseInt(event.target.getAttribute('data-track'));
    
    if (event.target.classList.contains('visibility-btn')) {
        toggleTrackVisibility(trackIndex);
    } else if (event.target.classList.contains('solo-btn')) {
        toggleTrackSolo(trackIndex);
    } else if (event.target.classList.contains('mute-btn')) {
        toggleTrackMute(trackIndex);
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
        
        console.log('Visible tracks after toggle:', visibleTracks);
        
        if (visibleTracks.length > 0) {
            // Use renderScore with track indexes to show all visible tracks
            api.renderScore(api.score, visibleTracks);
            console.log(`Rendering tracks: ${visibleTracks.join(', ')}`);
        } else {
            // If no tracks would be visible, keep this one visible
            state.visible = true;
            api.renderScore(api.score, [trackIndex]);
            console.log(`Forced track ${trackIndex} to remain visible`);
        }
    }
    
    // Update UI
    updateTrackUI(trackIndex);
    console.log(`Track ${trackIndex} visibility toggled to: ${state.visible}`);
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
        
        let targetVolume = 1.0; // Default full volume
        
        if (soloedTracks.length > 0) {
            // If there are soloed tracks, only play soloed tracks
            targetVolume = state.solo ? 1.0 : 0.0;
        } else {
            // If no tracks are soloed, respect mute settings
            targetVolume = state.muted ? 0.0 : 1.0;
        }
        
        // Apply volume using AlphaTab's built-in method
        try {
            api.changeTrackVolume([trackIndex], targetVolume);
        } catch (error) {
            console.error(`Error setting volume for track ${trackIndex}:`, error);
        }
    });
}

function updateTrackUI(trackIndex) {
    // Find the track control element using the correct selector
    const trackControl = document.querySelector(`[data-track="${trackIndex}"]`);
    if (!trackControl) {
        console.log(`Track control not found for index ${trackIndex}`);
        return;
    }
    
    const state = trackStates[trackIndex];
    const visibilityBtn = trackControl.querySelector('.visibility-btn');
    const soloBtn = trackControl.querySelector('.solo-btn');
    const muteBtn = trackControl.querySelector('.mute-btn');
    
    // Update visibility button
    if (visibilityBtn) {
        if (state.visible) {
            visibilityBtn.classList.add('active');
            visibilityBtn.innerHTML = '👁️';
            visibilityBtn.title = 'Hide track';
        } else {
            visibilityBtn.classList.remove('active');
            visibilityBtn.innerHTML = '🙈';
            visibilityBtn.title = 'Show track';
        }
    }
    
    // Update solo button
    if (soloBtn) {
        if (state.solo) {
            soloBtn.classList.add('active');
            soloBtn.title = 'Unsolo track';
        } else {
            soloBtn.classList.remove('active');
            soloBtn.title = 'Solo this track';
        }
    }
    
    // Update mute button
    if (muteBtn) {
        if (state.muted) {
            muteBtn.classList.add('active');
            muteBtn.title = 'Unmute track';
        } else {
            muteBtn.classList.remove('active');
            muteBtn.title = 'Mute track';
        }
    }
    
    // Update track control appearance
    trackControl.classList.toggle('muted', state.muted);
    trackControl.classList.toggle('solo', state.solo);
    trackControl.classList.toggle('hidden', !state.visible);
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

function toggleDrumTracksFunction() {
    if (!api || !api.score) return;
    
    let drumTracksVisible = false;
    let drumTrackIndices = [];
    
    // Find all drum tracks and check their current visibility
    Object.keys(trackStates).forEach(index => {
        const trackIndex = parseInt(index);
        const track = api.score.tracks[trackIndex];
        
        if (isPercussionTrack(track)) {
            drumTrackIndices.push(trackIndex);
            if (trackStates[trackIndex].visible) {
                drumTracksVisible = true;
            }
        }
    });
    
    // Toggle drum track visibility
    const newVisibility = !drumTracksVisible;
    drumTrackIndices.forEach(trackIndex => {
        trackStates[trackIndex].visible = newVisibility;
        updateTrackUI(trackIndex);
    });
    
    // Re-render with current visible tracks
    const visibleTracks = Object.keys(trackStates)
        .map(index => parseInt(index))
        .filter(index => trackStates[index].visible);
    
    if (visibleTracks.length > 0) {
        api.renderScore(api.score, visibleTracks);
        console.log(`${newVisibility ? 'Showed' : 'Hidden'} ${drumTrackIndices.length} drum tracks`);
    } else {
        // Fallback: if no tracks would be visible, show the first track
        trackStates[0].visible = true;
        updateTrackUI(0);
        api.renderScore(api.score, [0]);
        console.log('No tracks would be visible, showing first track as fallback');
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
    
    // Simple player controls with buffered playback for better cursor accuracy
    playBtn.addEventListener('click', () => {
        if (api && isPlayerReady) {
            console.log('🎵 Play button clicked - starting buffered playback');
            startBufferedPlayback();
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
        const volume = parseFloat(e.target.value) / 100;
        volumeValue.textContent = `${e.target.value}%`;
        if (api && isPlayerReady) {
            api.masterVolume = volume;
        }
    });
    
    // Speed control
    speedSlider.addEventListener('input', (e) => {
        const speed = parseFloat(e.target.value) / 100;
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
    
    // Keyboard controls with buffered playback
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            const activeElement = document.activeElement;
            const isTyping = activeElement && activeElement.matches('input[type="text"], input[type="search"], textarea');
            
            if (!isTyping && api && isPlayerReady) {
                e.preventDefault();
                e.stopPropagation();
                
                // Use buffered playback for spacebar as well
                if (api.playerState === 0 || api.playerState === 2) {
                    // Stopped or paused - start buffered playback
                    startBufferedPlayback();
                } else {
                    // Playing - pause immediately
                    api.playPause();
                }
            }
        }
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeAlphaTab();
    setupEventListeners();
    initializeGpFilesBrowser(); // Initialize GP Files Browser
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

// Enhanced update score for print functionality
function enhancedUpdateScoreForPrint(score) {
    currentScore = score;
    
    // Enable print button
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
        printBtn.disabled = false;
        printBtn.title = 'Print Tab';
    }
    
    console.log('Score updated for print and loop functionality');
}

// Test enhanced cursor accuracy and timing
function testCursorAccuracy() {
    if (!api || !isPlayerReady) {
        console.log('❌ API or player not ready for cursor test');
        return;
    }
    
    console.log('🎯 Testing basic cursor accuracy...');
    
    // Reset to beginning
    api.stop();
    api.tickPosition = 0;
    
    setTimeout(() => {
        console.log('🎵 Starting basic playback test...');
        
        const testStartTime = performance.now();
        let testCount = 0;
        
        // Start playback
        api.play();
        
        // Monitor basic cursor position
        const testInterval = setInterval(() => {
            testCount++;
            const currentTime = performance.now();
            const elapsedTime = currentTime - testStartTime;
            
            const currentTick = api.tickPosition;
            const currentTimePos = api.timePosition;
            
            console.log(`📍 Basic Test ${testCount}:`, {
                elapsed: `${elapsedTime.toFixed(0)}ms`,
                currentTick: currentTick,
                currentTime: `${currentTimePos.toFixed(0)}ms`
            });
            
            if (testCount >= 5) {
                clearInterval(testInterval);
                console.log('✅ Basic cursor test completed');
            }
        }, 1000);
        
        // Stop test after 6 seconds
        setTimeout(() => {
            clearInterval(testInterval);
            api.pause();
            console.log('🛑 Basic cursor test stopped');
        }, 6000);
        
    }, 500);
}

// Manual cursor timing initialization (simplified)
function initializeCursorTimingManually() {
    console.log('🔧 Basic cursor system active');
    
    if (api && api.player) {
        console.log('📊 Current Audio Context Info:', {
            state: api.player.output?.audioContext?.state,
            sampleRate: api.player.output?.audioContext?.sampleRate
        });
    }
    
    console.log('✅ Using AlphaTab default cursor behavior');
}

// Test cursor timing system performance (simplified)
function testCursorTimingPerformance() {
    console.log('⚡ Using AlphaTab default cursor performance');
    console.log('📈 Default cursor system is optimized by AlphaTab');
}

// Test buffered playback system
function testBufferedPlayback() {
    if (!api || !isPlayerReady) {
        console.log('❌ API or player not ready for buffered playback test');
        return;
    }
    
    console.log('🧪 Testing buffered playback system...');
    
    // Reset to beginning
    api.stop();
    api.tickPosition = 0;
    
    setTimeout(() => {
        console.log('🎵 Starting buffered playback test...');
        
        const testStartTime = performance.now();
        
        // Start buffered playback
        startBufferedPlayback();
        
        // Monitor the buffering and playback process
        const monitorInterval = setInterval(() => {
            const currentTime = performance.now();
            const elapsedTime = currentTime - testStartTime;
            
            console.log(`📊 Buffer Test Status:`, {
                elapsed: `${elapsedTime.toFixed(0)}ms`,
                isBuffering: isBufferingPlayback,
                playerState: api.playerState,
                currentTick: api.tickPosition,
                currentTime: `${api.timePosition.toFixed(0)}ms`
            });
            
            // Stop monitoring after playback starts
            if (api.playerState === 1 && !isBufferingPlayback) {
                clearInterval(monitorInterval);
                console.log('✅ Buffered playback test completed successfully');
                
                // Stop playback after a few seconds
                setTimeout(() => {
                    api.stop();
                    console.log('🛑 Test playback stopped');
                }, 3000);
            }
        }, 100);
        
        // Safety timeout
        setTimeout(() => {
            clearInterval(monitorInterval);
            if (isBufferingPlayback) {
                console.log('⚠️ Buffered playback test timed out');
                isBufferingPlayback = false;
                playBtn.disabled = false;
                playBtn.textContent = '▶️';
            }
        }, 5000);
        
    }, 500);
}

// Global functions for manual file addition and refresh
window.addGpFile = addGpFile;
window.refreshGpFiles = refreshGpFiles;
window.debugSynthesizer = debugSynthesizer;
window.testInstrumentChange = testInstrumentChange;
window.explainMidiChannels = explainMidiChannels;
window.testSoundChange = testSoundChange;
window.analyzeSoundFont = analyzeSoundFont;
window.analyzeGpFileSoundSettings = analyzeGpFileSoundSettings;
window.testAlphaTabVolumeControl = testAlphaTabVolumeControl;
window.toggleTrackControlsVisibility = toggleTrackControlsVisibility;
window.analyzePlaybackAccuracy = analyzePlaybackAccuracy;
window.testPlaybackTiming = testPlaybackTiming;
window.optimizeAudioForResponsiveness = optimizeAudioForResponsiveness;
window.preWarmAudioSystem = preWarmAudioSystem;
window.ensureAudioContextRunning = ensureAudioContextRunning;
window.testCursorAccuracy = testCursorAccuracy;
window.initializeCursorTimingManually = initializeCursorTimingManually;
window.testCursorTimingPerformance = testCursorTimingPerformance;
window.testBufferedPlayback = testBufferedPlayback;

// Add GP file to the list
function addGpFileToList(fileName, category, filePath) {
    const fileId = `gp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const gpFile = {
        id: fileId,
        name: fileName,
        category: category,
        path: filePath,
        size: 'Unknown', // We don't have size info without fetching
        dateModified: new Date() // Use current date as fallback
    };
    
    gpFiles.push(gpFile);
    console.log(`Added GP file: ${fileName} (${category})`);
}

// Load GP files from predefined directory structure
async function loadGpFilesFromDirectory() {
    console.log('Loading GP files from directory...');
    
    // Actual GP files that exist in the public/GP Files directory
    const gpFilesList = [
        // Scale Exercises
        { name: 'C Major Scale and Arpeggio Exercises.gp', category: 'scale-exercises', folder: 'Scale Exercises' },
        { name: 'Pentatonic_Exercises.gp', category: 'scale-exercises', folder: 'Scale Exercises' },
        { name: 'Minor_Pentatonic_Patterns.gp', category: 'scale-exercises', folder: 'Scale Exercises' },
        
        // Licks
        { name: '5 Licks To Metal adapted.gp', category: 'licks', folder: 'Licks' },
        { name: 'Bebop Lines for Jazz Blues in B flat.gp', category: 'licks', folder: 'Licks' },
        { name: '5 Licks To Metal.gp', category: 'licks', folder: 'Licks' },
        { name: '5 Licks To - ROCK.gp', category: 'licks', folder: 'Licks' },
        
        // Songs
        { name: 'Achy Breaky Heart (Simple Melody).gp', category: 'songs', folder: 'Songs' },
        { name: 'Beethoven-Bagatelle_no_25-Fur_Elise.gp', category: 'songs', folder: 'Songs' }
    ];
    
    try {
        // Clear existing files
        gpFiles = [];
        filteredFiles = [];
        
        let totalFilesFound = 0;
        
        // Add each file to the list
        gpFilesList.forEach(fileInfo => {
            const filePath = `./public/GP Files/${fileInfo.folder}/${fileInfo.name}`;
            addGpFileToList(fileInfo.name, fileInfo.category, filePath);
            totalFilesFound++;
        });
        
        console.log(`Found ${totalFilesFound} GP files`);
        
        // Update the display
        applyFiltersAndSort();
        
    } catch (error) {
        console.error('Error loading GP files:', error);
        // Reset arrays on error
        gpFiles = [];
        filteredFiles = [];
    }
}

// Initialize the application
function initializeApp() {
    console.log('Initializing TabPlayer application...');
    
    // Initialize GP file loading
    loadGpFilesFromDirectory();
    
    console.log('TabPlayer application initialized successfully');
}

// Manual function to add a GP file (for console use)
function addGpFile(fileName, filePath, category = 'scale-exercises') {
    addGpFileToList(fileName, category, filePath);
    applyFiltersAndSort();
    console.log(`Manually added GP file: ${fileName}`);
}

// Refresh the GP files list
function refreshGpFiles() {
    console.log('Refreshing GP files list...');
    loadGpFilesFromDirectory();
}

// Start buffered playback with preparation delay
function startBufferedPlayback() {
    if (isBufferingPlayback) {
        console.log('⏳ Already buffering playback...');
        return;
    }
    
    isBufferingPlayback = true;
    
    // Update UI to show buffering state
    playBtn.disabled = true;
    playBtn.textContent = '⏳';
    
    console.log(`🔄 Buffering playback (${PLAYBACK_BUFFER_DELAY}ms delay)...`);
    
    // Prepare audio context and timing
    prepareAudioForPlayback();
    
    // Start playback after buffer delay
    setTimeout(() => {
        try {
            console.log('🎵 Starting playback after buffer');
            api.playPause();
            
            // Reset UI
            playBtn.textContent = '▶️';
            isBufferingPlayback = false;
            
            console.log('✅ Buffered playback started successfully');
            
        } catch (error) {
            console.error('❌ Error starting buffered playback:', error);
            playBtn.disabled = false;
            playBtn.textContent = '▶️';
            isBufferingPlayback = false;
        }
    }, PLAYBACK_BUFFER_DELAY);
}

// Prepare audio context for optimal playback
function prepareAudioForPlayback() {
    if (api && api.player && api.player.output && api.player.output.audioContext) {
        const audioContext = api.player.output.audioContext;
        
        // Ensure audio context is running
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('🔊 Audio context resumed for buffered playback');
            }).catch(error => {
                console.warn('⚠️ Could not resume audio context:', error);
            });
        }
        
        // Log audio context info for debugging
        console.log('🎧 Audio context prepared:', {
            state: audioContext.state,
            sampleRate: audioContext.sampleRate,
            baseLatency: audioContext.baseLatency ? `${(audioContext.baseLatency * 1000).toFixed(1)}ms` : 'unknown',
            outputLatency: audioContext.outputLatency ? `${(audioContext.outputLatency * 1000).toFixed(1)}ms` : 'unknown'
        });
    }
}

// Enhanced player state change handler with buffering awareness
function handlePlayerStateChange(stateEvent) {
    console.log('Player state changed:', stateEvent.state);
    updatePlayerButtons(stateEvent.state);
    
    // Handle buffering state
    if (stateEvent.state === 1 && isBufferingPlayback) {
        // Playing state reached during buffering
        console.log('🎵 Playback started during buffer period');
    }
}