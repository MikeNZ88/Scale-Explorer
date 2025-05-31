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
    
    // Show track info and track controls
    trackInfo.style.display = 'block';
    trackControls.style.display = 'block';
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
                    <button class="visibility-btn ${track.isVisible ? 'active' : ''}" 
                            data-track="${index}" 
                            title="Toggle track visibility">
                        👁️
                    </button>
                    <button class="solo-btn" 
                            data-track="${index}" 
                            title="Solo this track">
                        🎯
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
            visibilityBtn.title = 'Hide track';
        } else {
            visibilityBtn.classList.remove('active');
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
    console.log('Loading GP files from predefined list...');
    
    try {
        // Clear existing files
        gpFiles = [];
        filteredFiles = [];
        
        // Hardcoded list of GP files (since GitHub Pages doesn't serve directory listings)
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
        
        let totalFilesFound = 0;
        
        // Add each file to the list
        gpFilesList.forEach(fileInfo => {
            const filePath = `./public/GP Files/${fileInfo.folder}/${fileInfo.name}`;
            addGpFileToList(fileInfo.name, filePath, fileInfo.category);
            totalFilesFound++;
        });
        
        updateFilesList();
        console.log(`Loaded ${totalFilesFound} GP files from predefined list`);
        
    } catch (error) {
        console.error('Error loading files:', error);
        console.log('Falling back to empty list...');
        gpFiles = [];
        filteredFiles = [];
        updateFilesList();
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
window.debugSynthesizer = debugSynthesizer;
window.analyzeSoundFont = analyzeSoundFont;
window.analyzeGpFileSoundSettings = analyzeGpFileSoundSettings;

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

// Get simplified instrument options - only instruments that actually sound different in SONiVOX
function getInstrumentOptions(currentProgram) {
    // This function is no longer needed since we removed instrument dropdowns
    // Instrument changes don't work in AlphaTab v1.6.0 due to synthesizer limitations
    return '';
}

// Handle instrument change
function handleInstrumentChange(event) {
    // This function is no longer needed since we removed instrument dropdowns
    // Instrument changes don't work in AlphaTab v1.6.0 due to synthesizer limitations
    return;
}

// Apply instrument change via score reload
function applyInstrumentChangeViaScoreReload(trackIndex, newProgram) {
    // This function is no longer needed since we removed instrument dropdowns
    // Instrument changes don't work in AlphaTab v1.6.0 due to synthesizer limitations
    return;
}

// Apply instrument change fallback
function applyInstrumentChangeFallback(trackIndex, newProgram, wasPlaying, currentPosition) {
    // This function is no longer needed since we removed instrument dropdowns
    // Instrument changes don't work in AlphaTab v1.6.0 due to synthesizer limitations
    return;
}

// Show instrument change message
function showInstrumentChangeMessage(message) {
    // This function is no longer needed since we removed instrument dropdowns
    return;
}

// Queue instrument change
function queueInstrumentChange(trackIndex, newProgram) {
    // This function is no longer needed since we removed instrument dropdowns
    return;
}

// Apply queued instrument changes
function applyQueuedInstrumentChanges() {
    // This function is no longer needed since we removed instrument dropdowns
    return;
}

// Update track instrument display
function updateTrackInstrumentDisplay(trackIndex, newProgram) {
    // This function is no longer needed since we removed instrument dropdowns
    return;
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
    console.log('AlphaTab version:', api.version || 'Unknown');
    
    if (!api.player) {
        console.log('❌ No player available');
        return;
    }
    
    console.log('✓ Player available');
    console.log('Player type:', typeof api.player);
    console.log('Player ready:', api.player.ready);
    console.log('Player methods:', Object.getOwnPropertyNames(api.player).filter(name => typeof api.player[name] === 'function'));
    
    // Check synthesizer
    if (api.player.synthesizer) {
        const synth = api.player.synthesizer;
        console.log('✓ Synthesizer available');
        console.log('Synthesizer type:', typeof synth);
        console.log('Synthesizer constructor:', synth.constructor.name);
        console.log('Synthesizer methods:', Object.getOwnPropertyNames(synth).filter(name => typeof synth[name] === 'function'));
        
        // Check for specific methods
        const methods = ['programChange', 'sendEvent', 'setChannelProgram', 'midiEvent', 'noteOn', 'noteOff'];
        methods.forEach(method => {
            const available = typeof synth[method] === 'function';
            console.log(`${available ? '✓' : '❌'} synth.${method}:`, available ? 'available' : 'not available');
        });
    } else {
        console.log('❌ No synthesizer available');
    }
    
    // Check API level methods
    const apiMethods = ['changeTrackProgram', 'changeTrackVolume', 'load', 'renderScore'];
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
                secondaryChannel: track.playbackInfo.secondaryChannel,
                isPercussionTrack: track.playbackInfo.isPercussionTrack
            });
        });
    } else {
        console.log('❌ No score loaded');
    }
    
    // Check SoundFont info
    console.log('SoundFont URL:', api.settings?.player?.soundFont || 'Not configured');
    
    console.log('=== END DEBUG INFO ===');
}

// Test instrument change functionality
function testInstrumentChange(trackIndex = 0, newProgram = 29) {
    // This function is no longer needed since we removed instrument dropdowns
    // Instrument changes don't work in AlphaTab v1.6.0 due to synthesizer limitations
    console.log('Instrument changes have been removed due to AlphaTab v1.6.0 limitations');
}

// Test sound change functionality
function testSoundChange() {
    // This function is no longer needed since we removed instrument dropdowns
    // Instrument changes don't work in AlphaTab v1.6.0 due to synthesizer limitations
    console.log('Sound changes have been removed due to AlphaTab v1.6.0 limitations');
}

// Enhanced debugging for instrument changes
function debugInstrumentChange(trackIndex, newProgram) {
    // This function is no longer needed since we removed instrument dropdowns
    // Instrument changes don't work in AlphaTab v1.6.0 due to synthesizer limitations
    console.log('Instrument change debugging has been removed due to AlphaTab v1.6.0 limitations');
}

// Test the actual sound difference
function testActualSoundDifference() {
    // This function is no longer needed since we removed instrument dropdowns
    // Instrument changes don't work in AlphaTab v1.6.0 due to synthesizer limitations
    console.log('Sound difference testing has been removed due to AlphaTab v1.6.0 limitations');
}

// Simple test function to verify dropdown functionality
function testDropdownChange() {
    // This function is no longer needed since we removed instrument dropdowns
    console.log('Dropdown testing has been removed - instrument dropdowns no longer exist');
}

// Explain MIDI channels
function explainMidiChannels() {
    // This function is no longer needed since we removed instrument dropdowns
    console.log('MIDI channel explanation has been removed since instrument changes are not supported');
}

// Comprehensive GP file sound analysis
function analyzeGpFileSoundSettings() {
    if (!api || !api.score) {
        console.log('❌ No score loaded for analysis');
        return;
    }
    
    const score = api.score;
    console.log('🎵 === GUITAR PRO FILE SOUND ANALYSIS ===');
    
    // Master settings
    console.log('📊 MASTER SETTINGS:');
    console.log('  Title:', score.title || 'Unknown');
    console.log('  Artist:', score.artist || 'Unknown');
    console.log('  Master Volume:', score.masterVolume || 'Default');
    console.log('  Tempo:', score.tempo || 'Unknown');
    console.log('  Total Tracks:', score.tracks.length);
    
    // Detailed track analysis
    console.log('\n🎸 TRACK SOUND SETTINGS:');
    score.tracks.forEach((track, index) => {
        console.log(`\n--- TRACK ${index + 1}: ${track.name || 'Unnamed'} ---`);
        
        // Basic track info
        console.log('  Track Name:', track.name || 'Unnamed');
        console.log('  Short Name:', track.shortName || 'None');
        console.log('  Color:', track.color || 'Default');
        console.log('  Percussion Track:', track.percussionTrack || false);
        
        // Playback information
        if (track.playbackInfo) {
            const pb = track.playbackInfo;
            console.log('  🔊 PLAYBACK INFO:');
            console.log('    Program Number:', pb.program);
            console.log('    Program Name:', getGeneralMidiInstrumentName(pb.program));
            console.log('    Primary Channel:', pb.primaryChannel);
            console.log('    Secondary Channel:', pb.secondaryChannel);
            console.log('    Volume:', pb.volume, '(0-16 scale)');
            console.log('    Balance:', pb.balance, '(0-16 scale, 8=center)');
            console.log('    Chorus:', pb.chorus || 0);
            console.log('    Reverb:', pb.reverb || 0);
            console.log('    Phaser:', pb.phaser || 0);
            console.log('    Tremolo:', pb.tremolo || 0);
            console.log('    Is Mute:', pb.isMute || false);
            console.log('    Is Solo:', pb.isSolo || false);
            console.log('    Is Visible:', pb.isVisible !== false);
            console.log('    Is Percussion:', pb.isPercussionTrack || false);
        }
        
        // Channel information
        if (track.channel) {
            console.log('  📡 CHANNEL INFO:');
            console.log('    Channel 1:', track.channel.channel1);
            console.log('    Channel 2:', track.channel.channel2);
            console.log('    Instrument 1:', track.channel.instrument1);
            console.log('    Instrument 2:', track.channel.instrument2);
            console.log('    Volume 1:', track.channel.volume1);
            console.log('    Volume 2:', track.channel.volume2);
            console.log('    Balance 1:', track.channel.balance1);
            console.log('    Balance 2:', track.channel.balance2);
            console.log('    Chorus 1:', track.channel.chorus1);
            console.log('    Chorus 2:', track.channel.chorus2);
            console.log('    Reverb 1:', track.channel.reverb1);
            console.log('    Reverb 2:', track.channel.reverb2);
            console.log('    Phaser 1:', track.channel.phaser1);
            console.log('    Phaser 2:', track.channel.phaser2);
            console.log('    Tremolo 1:', track.channel.tremolo1);
            console.log('    Tremolo 2:', track.channel.tremolo2);
        }
        
        // Staff/tuning information
        if (track.staves && track.staves.length > 0) {
            console.log('  🎼 STAFF INFO:');
            track.staves.forEach((staff, staffIndex) => {
                console.log(`    Staff ${staffIndex + 1}:`);
                console.log('      Tuning:', staff.tuning || 'Standard');
                console.log('      Capo:', staff.capo || 0);
                console.log('      String Count:', staff.tuning?.length || 'Unknown');
                console.log('      Track Channel:', staff.trackChannel || 'Default');
                console.log('      Display Tablature:', staff.showTablature !== false);
                console.log('      Display Standard:', staff.showStandardNotation !== false);
            });
        }
        
        // Additional properties
        console.log('  🔧 ADDITIONAL PROPERTIES:');
        const additionalProps = Object.keys(track).filter(key => 
            !['name', 'shortName', 'color', 'percussionTrack', 'playbackInfo', 'channel', 'staves'].includes(key)
        );
        additionalProps.forEach(prop => {
            if (track[prop] !== null && track[prop] !== undefined) {
                console.log(`    ${prop}:`, track[prop]);
            }
        });
    });
    
    // Master bars analysis for tempo changes
    console.log('\n🎵 MASTER BARS ANALYSIS:');
    if (score.masterBars && score.masterBars.length > 0) {
        console.log('  Total Master Bars:', score.masterBars.length);
        
        // Check for tempo changes
        const tempoChanges = [];
        score.masterBars.forEach((bar, index) => {
            if (bar.tempoAutomation && bar.tempoAutomation.value !== score.tempo) {
                tempoChanges.push({
                    bar: index + 1,
                    tempo: bar.tempoAutomation.value
                });
            }
        });
        
        if (tempoChanges.length > 0) {
            console.log('  Tempo Changes Found:');
            tempoChanges.forEach(change => {
                console.log(`    Bar ${change.bar}: ${change.tempo} BPM`);
            });
        } else {
            console.log('  No tempo changes detected');
        }
    }
    
    // Effects analysis
    console.log('\n🎛️ EFFECTS SUMMARY:');
    const effectsSummary = {
        chorus: [],
        reverb: [],
        phaser: [],
        tremolo: []
    };
    
    score.tracks.forEach((track, index) => {
        if (track.playbackInfo) {
            const pb = track.playbackInfo;
            if (pb.chorus > 0) effectsSummary.chorus.push(`Track ${index + 1}: ${pb.chorus}`);
            if (pb.reverb > 0) effectsSummary.reverb.push(`Track ${index + 1}: ${pb.reverb}`);
            if (pb.phaser > 0) effectsSummary.phaser.push(`Track ${index + 1}: ${pb.phaser}`);
            if (pb.tremolo > 0) effectsSummary.tremolo.push(`Track ${index + 1}: ${pb.tremolo}`);
        }
    });
    
    Object.keys(effectsSummary).forEach(effect => {
        if (effectsSummary[effect].length > 0) {
            console.log(`  ${effect.toUpperCase()}:`, effectsSummary[effect].join(', '));
        } else {
            console.log(`  ${effect.toUpperCase()}: None`);
        }
    });
    
    console.log('\n=== END SOUND ANALYSIS ===');
    
    // Return structured data for further use
    return {
        masterSettings: {
            title: score.title,
            artist: score.artist,
            masterVolume: score.masterVolume,
            tempo: score.tempo,
            trackCount: score.tracks.length
        },
        tracks: score.tracks.map((track, index) => ({
            index,
            name: track.name,
            program: track.playbackInfo?.program,
            programName: getGeneralMidiInstrumentName(track.playbackInfo?.program || 0),
            volume: track.playbackInfo?.volume,
            balance: track.playbackInfo?.balance,
            effects: {
                chorus: track.playbackInfo?.chorus || 0,
                reverb: track.playbackInfo?.reverb || 0,
                phaser: track.playbackInfo?.phaser || 0,
                tremolo: track.playbackInfo?.tremolo || 0
            },
            channels: {
                primary: track.playbackInfo?.primaryChannel,
                secondary: track.playbackInfo?.secondaryChannel
            },
            tuning: track.staves?.[0]?.tuning,
            capo: track.staves?.[0]?.capo
        })),
        effectsSummary
    };
}

// Test AlphaTab volume control capabilities
function testAlphaTabVolumeControl() {
    console.log('=== ALPHATAB VOLUME CONTROL TEST ===');
    
    if (!api) {
        console.log('❌ No API available');
        return;
    }
    
    console.log('✓ API available');
    
    // Check available volume control methods
    const volumeMethods = [
        'changeTrackVolume',
        'masterVolume',
        'setTrackVolume',
        'setChannelVolume'
    ];
    
    console.log('📊 Available volume control methods:');
    volumeMethods.forEach(method => {
        const available = typeof api[method] !== 'undefined';
        console.log(`  ${available ? '✓' : '❌'} api.${method}:`, available ? 'available' : 'not available');
        
        if (available && typeof api[method] === 'function') {
            console.log(`    Type: function`);
        } else if (available) {
            console.log(`    Type: ${typeof api[method]}, Value:`, api[method]);
        }
    });
    
    // Check player volume methods
    if (api.player) {
        console.log('\n🎵 Player volume methods:');
        const playerMethods = [
            'setChannelVolume',
            'setTrackVolume',
            'masterVolume',
            'volume'
        ];
        
        playerMethods.forEach(method => {
            const available = typeof api.player[method] !== 'undefined';
            console.log(`  ${available ? '✓' : '❌'} api.player.${method}:`, available ? 'available' : 'not available');
            
            if (available && typeof api.player[method] === 'function') {
                console.log(`    Type: function`);
            } else if (available) {
                console.log(`    Type: ${typeof api.player[method]}, Value:`, api.player[method]);
            }
        });
    }
    
    // Test actual volume change if tracks are available
    if (api.score && api.score.tracks && api.score.tracks.length > 0) {
        console.log('\n🧪 Testing volume change on first track...');
        
        try {
            // Test changeTrackVolume method
            if (typeof api.changeTrackVolume === 'function') {
                console.log('Testing api.changeTrackVolume([0], 0.5)...');
                api.changeTrackVolume([0], 0.5);
                console.log('✓ changeTrackVolume executed successfully');
                
                // Reset to full volume
                setTimeout(() => {
                    api.changeTrackVolume([0], 1.0);
                    console.log('✓ Volume reset to full');
                }, 1000);
            }
        } catch (error) {
            console.error('❌ Error testing changeTrackVolume:', error);
        }
    }
    
    console.log('\n=== END VOLUME CONTROL TEST ===');
}

// Make the test function globally available
window.testAlphaTabVolumeControl = testAlphaTabVolumeControl;