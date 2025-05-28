let api = null;
let isPlayerReady = false;
let trackStates = {}; // Store track states (visible, muted, solo)

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
        
        // Add click-to-seek functionality
        api.beatMouseDown.on((beat) => {
            if (api && beat) {
                try {
                    console.log('Beat clicked, seeking to:', beat.absolutePlaybackStart);
                    // Set playback position to the clicked beat
                    api.tickPosition = beat.absolutePlaybackStart;
                } catch (error) {
                    console.error('Error seeking to position:', error);
                }
            }
        });
        
        // Add playback cursor functionality
        api.playerPositionChanged.on((e) => {
            // The cursor position is automatically handled by AlphaTab
            // This event fires when the playback position changes
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

// PNG Export Functionality
let currentScore = null;
let isRenderingComplete = false;

// PNG Export Modal Elements
const exportPngBtn = document.getElementById('exportPngBtn');
const pngExportModal = document.getElementById('pngExportModal');
const closeExportModal = document.getElementById('closeExportModal');
const exportFormatSelect = document.getElementById('exportFormat');
const startBarSelect = document.getElementById('startBar');
const endBarSelect = document.getElementById('endBar');
const exportScaleSelect = document.getElementById('exportScale');
const exportPreview = document.getElementById('exportPreview');
const formatInfo = document.getElementById('formatInfo');
const cancelExportBtn = document.getElementById('cancelExport');
const confirmExportBtn = document.getElementById('confirmExport');

// Initialize PNG export functionality
function initializePngExport() {
    // Add event listeners for export
    exportPngBtn.addEventListener('click', openExportModal);
    
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
    
    // Debug: Check AlphaTab container and canvas elements
    const alphaTabContainer = document.getElementById('alphaTab');
    console.log('AlphaTab container:', alphaTabContainer);
    
    if (alphaTabContainer) {
        const canvasElements = alphaTabContainer.querySelectorAll('canvas');
        console.log(`Found ${canvasElements.length} canvas elements in container`);
        
        // Log details about each canvas
        canvasElements.forEach((canvas, index) => {
            console.log(`Canvas ${index}:`, {
                width: canvas.width,
                height: canvas.height,
                styleWidth: canvas.style.width,
                styleHeight: canvas.style.height,
                offsetWidth: canvas.offsetWidth,
                offsetHeight: canvas.offsetHeight,
                visible: canvas.offsetParent !== null
            });
        });
        
        // Also check for SVG elements (in case AlphaTab is using SVG)
        const svgElements = alphaTabContainer.querySelectorAll('svg');
        console.log(`Found ${svgElements.length} SVG elements in container`);
        
        svgElements.forEach((svg, index) => {
            console.log(`SVG ${index}:`, {
                width: svg.getAttribute('width'),
                height: svg.getAttribute('height'),
                viewBox: svg.getAttribute('viewBox'),
                offsetWidth: svg.offsetWidth,
                offsetHeight: svg.offsetHeight
            });
        });
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
    
    // Update format info
    if (format === 'html') {
        formatInfo.textContent = '💡 HTML files can be embedded in websites using <iframe> or opened directly in browsers';
        confirmExportBtn.textContent = 'Export HTML';
    } else if (format === 'jpeg') {
        formatInfo.textContent = '📷 JPEG images are perfect for sharing and embedding in documents or websites';
        confirmExportBtn.textContent = 'Export JPEG';
    }
}

// Main export function that routes to the appropriate format
async function performExport() {
    const format = exportFormatSelect.value;
    
    if (format === 'html') {
        await performHtmlExport();
    } else if (format === 'jpeg') {
        await performJpegExport();
    }
}

// Helper function to wait for rendering completion
async function waitForRenderingComplete(maxWaitTime = 10000) {
    console.log('Waiting for rendering to complete...');
    const startTime = Date.now();
    
    while (!isRenderingComplete && (Date.now() - startTime) < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!isRenderingComplete) {
        console.warn('Rendering did not complete within timeout, proceeding anyway...');
    } else {
        console.log('Rendering completed successfully');
    }
    
    // Give a bit more time for DOM updates
    await new Promise(resolve => setTimeout(resolve, 500));
}

// Perform HTML export
async function performHtmlExport() {
    const startBar = parseInt(document.getElementById('startBar').value) - 1;
    const endBar = parseInt(document.getElementById('endBar').value) - 1;
    const scale = parseFloat(document.getElementById('exportScale').value);
    const confirmExportBtn = document.getElementById('confirmExport');
    
    // Update button state
    confirmExportBtn.classList.add('loading');
    confirmExportBtn.textContent = 'Exporting...';
    confirmExportBtn.disabled = true;
    
    try {
        console.log('Starting HTML export...', { startBar, endBar, scale });
        
        // First, render the specific bar range
        const rangeInfo = await renderBarRange(startBar, endBar);
        console.log('Bar range rendering completed:', rangeInfo);
        
        // Find the AlphaTab container
        const alphaTabContainer = document.getElementById('alphaTab');
        if (!alphaTabContainer) {
            throw new Error('AlphaTab container not found');
        }
        
        console.log('AlphaTab container found:', alphaTabContainer);
        
        // Force a re-render to ensure content is available
        if (api && api.score) {
            console.log('Forcing re-render...');
            api.renderScore(api.score);
            // Wait for re-render to complete
            await waitForRenderingComplete();
        }
        
        // Look for all possible rendering elements with more detailed logging
        const canvasElements = alphaTabContainer.querySelectorAll('canvas');
        const svgElements = alphaTabContainer.querySelectorAll('svg');
        const imgElements = alphaTabContainer.querySelectorAll('img');
        
        console.log(`Found ${canvasElements.length} canvas, ${svgElements.length} SVG, ${imgElements.length} img elements`);
        
        // Log detailed information about each element type
        canvasElements.forEach((canvas, i) => {
            console.log(`Canvas ${i}:`, {
                width: canvas.width,
                height: canvas.height,
                offsetWidth: canvas.offsetWidth,
                offsetHeight: canvas.offsetHeight,
                visible: canvas.offsetParent !== null,
                style: canvas.style.cssText
            });
        });
        
        svgElements.forEach((svg, i) => {
            console.log(`SVG ${i}:`, {
                width: svg.getAttribute('width'),
                height: svg.getAttribute('height'),
                viewBox: svg.getAttribute('viewBox'),
                offsetWidth: svg.offsetWidth,
                offsetHeight: svg.offsetHeight,
                visible: svg.offsetParent !== null,
                innerHTML: svg.innerHTML.substring(0, 100) + '...'
            });
        });
        
        let htmlContent = '';
        
        if (canvasElements.length > 0) {
            // Handle Canvas rendering - convert to images
            console.log('Using Canvas export method');
            
            const canvasImages = [];
            for (let i = 0; i < canvasElements.length; i++) {
                const canvas = canvasElements[i];
                try {
                    // Check if canvas has actual content
                    const ctx = canvas.getContext('2d');
                    const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 10), Math.min(canvas.height, 10));
                    const hasContent = imageData.data.some(pixel => pixel !== 0);
                    
                    if (hasContent && canvas.width > 0 && canvas.height > 0) {
                        const dataURL = canvas.toDataURL('image/png');
                        if (dataURL && dataURL !== 'data:,') {
                            canvasImages.push({
                                src: dataURL,
                                width: canvas.width,
                                height: canvas.height,
                                index: i
                            });
                            console.log(`Successfully captured canvas ${i} (${canvas.width}x${canvas.height})`);
                        }
                    } else {
                        console.warn(`Canvas ${i} appears to be empty`);
                    }
                } catch (error) {
                    console.warn(`Failed to process canvas ${i}:`, error);
                }
            }
            
            if (canvasImages.length > 0) {
                htmlContent = canvasImages.map(img => 
                    `<img src="${img.src}" style="display: block; width: 100%; height: auto; margin-bottom: 10px; max-width: ${img.width}px;" alt="Tab Page ${img.index + 1}" />`
                ).join('\n');
            } else {
                throw new Error('No valid canvas content found - all canvases appear to be empty');
            }
            
        } else if (svgElements.length > 0) {
            // Handle SVG rendering
            console.log('Using SVG export method');
            
            const validSvgs = [];
            for (let i = 0; i < svgElements.length; i++) {
                const svg = svgElements[i];
                try {
                    // Check if SVG has content
                    if (svg.innerHTML.trim().length > 0 && svg.offsetParent !== null) {
                        // Clone and clean up the SVG
                        const clonedSvg = svg.cloneNode(true);
                        
                        // Ensure proper styling for export
                        clonedSvg.style.display = 'block';
                        clonedSvg.style.width = '100%';
                        clonedSvg.style.height = 'auto';
                        clonedSvg.style.marginBottom = '10px';
                        clonedSvg.style.maxWidth = svg.getAttribute('width') || '100%';
                        
                        // Remove any AlphaTab-specific attributes that might cause issues
                        clonedSvg.removeAttribute('data-alphatab');
                        
                        validSvgs.push(clonedSvg.outerHTML);
                        console.log(`Successfully processed SVG ${i}`);
                    } else {
                        console.warn(`SVG ${i} is empty or not visible`);
                    }
                } catch (error) {
                    console.warn(`Failed to process SVG ${i}:`, error);
                }
            }
            
            if (validSvgs.length > 0) {
                htmlContent = validSvgs.join('\n');
            } else {
                throw new Error('No valid SVG content found');
            }
            
        } else {
            // Try to use AlphaTab's built-in export if available
            console.log('No canvas or SVG found, trying AlphaTab export API...');
            
            if (api && api.renderScore) {
                // Try to trigger a fresh render and wait
                console.log('Triggering fresh render...');
                api.renderScore(api.score);
                await waitForRenderingComplete();
                
                // Check again for rendered content
                const newCanvases = alphaTabContainer.querySelectorAll('canvas');
                const newSvgs = alphaTabContainer.querySelectorAll('svg');
                
                console.log(`After re-render: ${newCanvases.length} canvas, ${newSvgs.length} SVG elements`);
                
                if (newCanvases.length > 0 || newSvgs.length > 0) {
                    // Recursively call this function to process the newly rendered content
                    console.log('Found new content after re-render, processing...');
                    return await performHtmlExport();
                }
            }
            
            throw new Error('No renderable content found. Please ensure the score is fully loaded and rendered before exporting.');
        }
        
        if (!htmlContent.trim()) {
            throw new Error('No content was captured for export');
        }
        
        // Create the complete HTML document
        const scoreTitle = currentScore?.title || 'Guitar Tab';
        const barRangeText = startBar === endBar ? `Bar ${startBar + 1}` : `Bars ${startBar + 1}-${endBar + 1}`;
        
        const fullHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${scoreTitle} - ${barRangeText}</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background: white;
            line-height: 1.6;
        }
        .export-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #8B4513;
            padding-bottom: 15px;
        }
        .export-title {
            font-size: 28px;
            font-weight: bold;
            color: #8B4513;
            margin: 0 0 10px 0;
        }
        .export-info {
            font-size: 16px;
            color: #666;
            margin: 0;
        }
        .tab-container {
            max-width: 100%;
            margin: 0 auto;
            text-align: center;
        }
        .tab-container img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0 auto 20px auto;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-radius: 4px;
            border: 1px solid #ddd;
        }
        .tab-container svg {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0 auto 20px auto;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-radius: 4px;
            border: 1px solid #ddd;
            background: white;
        }
        .export-footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #999;
        }
        @media print {
            body { margin: 0; padding: 10px; }
            .export-header, .export-footer { page-break-inside: avoid; }
            .tab-container img, .tab-container svg { 
                page-break-inside: avoid;
                max-width: 100% !important;
            }
        }
    </style>
</head>
<body>
    <div class="export-header">
        <h1 class="export-title">${scoreTitle}</h1>
        <p class="export-info">${barRangeText} | Quality: ${scale}x | Exported: ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="tab-container">
        ${htmlContent}
    </div>
    
    <div class="export-footer">
        Generated by Guitar Tab Player | ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
    </div>
</body>
</html>`;
        
        // Create and download the HTML file
        const blob = new Blob([fullHtmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Generate filename
        const sanitizedTitle = scoreTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const barRange = startBar === endBar ? `bar_${startBar + 1}` : `bars_${startBar + 1}-${endBar + 1}`;
        a.download = `${sanitizedTitle}_${barRange}_${scale}x.html`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('HTML export completed successfully');
        closeModal();
        
    } catch (error) {
        console.error('HTML export failed:', error);
        alert(`HTML Export failed: ${error.message}\n\nPlease check the browser console for more details.`);
    } finally {
        // Reset button state
        confirmExportBtn.classList.remove('loading');
        updateExportPreview(); // This will set the correct button text
        confirmExportBtn.disabled = false;
    }
}

// Perform JPEG export with bar range support
async function performJpegExport() {
    console.log('🎵 Starting JPEG export...');
    
    try {
        // Get selected bar range
        const startBar = parseInt(document.getElementById('startBar').value);
        const endBar = parseInt(document.getElementById('endBar').value);
        const rangeInfo = {
            totalBars: currentScore ? currentScore.masterBars.length : 0,
            isFullRange: startBar === 1 && endBar === (currentScore ? currentScore.masterBars.length : 0)
        };
        
        console.log(`📊 Export range: bars ${startBar}-${endBar} (${rangeInfo.isFullRange ? 'full score' : 'partial'})`);
        
        // First try to render the specific bar range
        console.log('🎯 Rendering bar range...');
        await renderBarRange(startBar, endBar);
        console.log('✅ Bar range rendering completed');
        
        // Find the AlphaTab container
        const alphaTabContainer = document.querySelector('.alphaTab');
        if (!alphaTabContainer) {
            throw new Error('AlphaTab container not found');
        }
        
        // Look for canvas elements
        const canvasElements = alphaTabContainer.querySelectorAll('canvas');
        console.log(`🔍 Found ${canvasElements.length} canvas elements`);
        
        // Validate canvases and check for content
        const validCanvases = [];
        for (let i = 0; i < canvasElements.length; i++) {
            const canvas = canvasElements[i];
            try {
                console.log(`Checking canvas ${i}:`, {
                    width: canvas.width,
                    height: canvas.height,
                    visible: canvas.offsetParent !== null
                });
                
                // Check if canvas has content
                const ctx = canvas.getContext('2d');
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const hasContent = imageData.data.some(pixel => pixel !== 0);
                
                if (hasContent && canvas.width > 0 && canvas.height > 0) {
                    validCanvases.push(canvas);
                    console.log(`Canvas ${i} is valid and has content`);
                } else {
                    console.warn(`Canvas ${i} is empty or has no dimensions`);
                }
            } catch (error) {
                console.warn(`Failed to check canvas ${i}:`, error);
            }
        }
        
        if (validCanvases.length === 0) {
            throw new Error('No valid canvas elements found with content');
        }
        
        let exportResult;
        
        if (validCanvases.length > 0) {
            console.log(`🖼️ Exporting from ${validCanvases.length} canvas elements`);
            exportResult = await exportFromCanvases(validCanvases, 1.0, startBar, endBar, rangeInfo);
        } else {
            // Fallback to SVG or DOM export
            const svgElements = alphaTabContainer.querySelectorAll('svg');
            if (svgElements.length > 0) {
                console.log(`📄 Falling back to SVG export (${svgElements.length} elements)`);
                exportResult = await exportFromSvg(svgElements);
            } else {
                console.log('🌐 Falling back to DOM export');
                exportResult = await exportFromDom(alphaTabContainer);
            }
        }
        
        // Download the result
        const link = document.createElement('a');
        link.download = `guitar-tab-${startBar}-${endBar}.jpg`;
        link.href = exportResult;
        link.click();
        
        console.log('✅ JPEG export completed successfully');
        
    } catch (error) {
        console.error('❌ JPEG export failed:', error);
        alert('Export failed: ' + error.message);
    } finally {
        // Reset button state
        const exportBtn = document.getElementById('exportJpeg');
        if (exportBtn) {
            exportBtn.textContent = 'Export as JPEG';
            exportBtn.disabled = false;
            exportBtn.classList.remove('loading');
        }
    }
}

// Export from canvas elements with optional bar range cropping
async function exportFromCanvases(validCanvases, scale, startBar = null, endBar = null, rangeInfo = null) {
    console.log(`🖼️ Exporting from ${validCanvases.length} canvas elements`);
    console.log(`📊 Canvas validation: ${validCanvases.map(c => `${c.width}x${c.height}`).join(', ')}`);
    
    // Determine if cropping is needed
    const needsCropping = rangeInfo && endBar && startBar && endBar < rangeInfo.totalBars;
    console.log(`✂️ Cropping needed: ${needsCropping}`);
    
    let canvasesToProcess = validCanvases;
    
    if (needsCropping) {
        console.log(`🎯 Cropping to bars ${startBar}-${endBar} of ${rangeInfo.totalBars} total bars`);
        canvasesToProcess = cropCanvasesToBarRange(validCanvases, startBar, endBar, rangeInfo);
    } else {
        console.log('📄 Using full canvas export (no cropping needed)');
    }
    
    // Combine the canvases (cropped or full) into a single image
    return await combineFullCanvases(canvasesToProcess, scale);
}

// Helper function to combine full canvases (existing working logic)
async function combineFullCanvases(validCanvases, scale) {
    // Calculate total dimensions
    let totalWidth = 0;
    let totalHeight = 0;
    
    validCanvases.forEach(canvas => {
        totalWidth = Math.max(totalWidth, canvas.width);
        totalHeight += canvas.height;
    });
    
    // Apply scale
    totalWidth *= scale;
    totalHeight *= scale;
    
    console.log(`Creating combined canvas: ${totalWidth}x${totalHeight}`);
    
    // Create combined canvas
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = totalWidth;
    finalCanvas.height = totalHeight;
    const ctx = finalCanvas.getContext('2d');
    
    // Set white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, totalWidth, totalHeight);
    
    // Draw each canvas
    let currentY = 0;
    for (const canvas of validCanvases) {
        const scaledWidth = canvas.width * scale;
        const scaledHeight = canvas.height * scale;
        
        ctx.drawImage(canvas, 0, currentY, scaledWidth, scaledHeight);
        currentY += scaledHeight;
        console.log(`Drew canvas at Y position ${currentY - scaledHeight}`);
    }
    
    // Convert to JPEG data URL with high quality
    console.log('🖼️ Converting canvas to JPEG...');
    const jpegDataUrl = finalCanvas.toDataURL('image/jpeg', 0.95);
    
    if (!jpegDataUrl || jpegDataUrl === 'data:,') {
        throw new Error('Failed to generate JPEG data from canvas');
    }
    
    console.log('✅ Successfully created JPEG data URL');
    return jpegDataUrl;
}

// Helper function to crop canvases to a specific bar range
function cropCanvasesToBarRange(canvases, startBar, endBar, rangeInfo) {
    console.log(`🎯 Cropping canvases to bar range ${startBar}-${endBar}`);
    
    if (!api || !api.boundsLookup) {
        console.warn('⚠️ No bounds lookup available, using full canvas');
        return canvases;
    }
    
    const boundsLookup = api.boundsLookup;
    if (!boundsLookup.isFinished) {
        console.warn('⚠️ Bounds lookup not finished, using full canvas');
        return canvases;
    }
    
    // Collect all bars in the selected range across all staff systems
    const barsInRange = [];
    for (let barIndex = startBar - 1; barIndex <= endBar - 1; barIndex++) {
        const barBounds = boundsLookup.findMasterBarByIndex(barIndex);
        if (barBounds) {
            barsInRange.push({
                index: barIndex,
                bounds: barBounds
            });
        }
    }
    
    if (barsInRange.length === 0) {
        console.warn(`⚠️ Could not find any bounds for bars ${startBar}-${endBar}, using full canvas`);
        return canvases;
    }
    
    console.log(`📊 Found ${barsInRange.length} bars in range across staff systems`);
    
    // Group bars by staff system (row)
    const barsBySystem = new Map();
    barsInRange.forEach(bar => {
        const systemIndex = bar.bounds.staffSystemBounds.index;
        if (!barsBySystem.has(systemIndex)) {
            barsBySystem.set(systemIndex, []);
        }
        barsBySystem.get(systemIndex).push(bar);
    });
    
    console.log(`📋 Bars distributed across ${barsBySystem.size} staff systems`);
    
    // Calculate crop regions for each staff system
    const cropRegions = [];
    for (const [systemIndex, systemBars] of barsBySystem) {
        // Sort bars by position within the system
        systemBars.sort((a, b) => a.bounds.realBounds.x - b.bounds.realBounds.x);
        
        const firstBar = systemBars[0];
        const lastBar = systemBars[systemBars.length - 1];
        
        const cropRegion = {
            systemIndex: systemIndex,
            systemBounds: firstBar.bounds.staffSystemBounds,
            x: firstBar.bounds.realBounds.x,
            y: firstBar.bounds.staffSystemBounds.realBounds.y,
            width: (lastBar.bounds.realBounds.x + lastBar.bounds.realBounds.w) - firstBar.bounds.realBounds.x,
            height: firstBar.bounds.staffSystemBounds.realBounds.h,
            bars: systemBars.map(b => b.index + 1) // Convert back to 1-based for logging
        };
        
        cropRegions.push(cropRegion);
        console.log(`📏 System ${systemIndex}: bars ${cropRegion.bars.join(',')} - x:${cropRegion.x}, y:${cropRegion.y}, w:${cropRegion.width}, h:${cropRegion.height}`);
    }
    
    // Sort crop regions by vertical position (top to bottom)
    cropRegions.sort((a, b) => a.y - b.y);
    
    const croppedCanvases = [];
    
    for (let i = 0; i < canvases.length; i++) {
        const canvas = canvases[i];
        console.log(`✂️ Processing canvas ${i + 1}/${canvases.length} (${canvas.width}x${canvas.height})`);
        
        // Calculate total height needed for all crop regions
        let totalHeight = 0;
        let maxWidth = 0;
        
        cropRegions.forEach(region => {
            totalHeight += region.height;
            maxWidth = Math.max(maxWidth, region.width);
        });
        
        // Create a new canvas for the cropped content
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = maxWidth;
        croppedCanvas.height = totalHeight;
        const ctx = croppedCanvas.getContext('2d');
        
        // Set white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, croppedCanvas.width, croppedCanvas.height);
        
        // Draw each crop region
        let currentY = 0;
        for (const region of cropRegions) {
            // Ensure we don't crop beyond canvas boundaries
            const actualCropX = Math.max(0, Math.min(region.x, canvas.width));
            const actualCropY = Math.max(0, Math.min(region.y, canvas.height));
            const actualCropWidth = Math.min(region.width, canvas.width - actualCropX);
            const actualCropHeight = Math.min(region.height, canvas.height - actualCropY);
            
            if (actualCropWidth > 0 && actualCropHeight > 0) {
                ctx.drawImage(
                    canvas,
                    actualCropX, actualCropY, actualCropWidth, actualCropHeight, // Source rectangle
                    0, currentY, actualCropWidth, actualCropHeight              // Destination rectangle
                );
                
                console.log(`✅ Drew system ${region.systemIndex} (bars ${region.bars.join(',')}) at Y:${currentY}`);
            } else {
                console.warn(`⚠️ Invalid crop dimensions for system ${region.systemIndex}`);
            }
            
            currentY += region.height;
        }
        
        console.log(`✅ Created cropped canvas: ${croppedCanvas.width}x${croppedCanvas.height}`);
        croppedCanvases.push(croppedCanvas);
    }
    
    console.log(`🎉 Successfully cropped ${croppedCanvases.length} canvases to bar range ${startBar}-${endBar}`);
    return croppedCanvases;
}

// Helper function to export from SVG elements
async function exportFromSvg(svgElements) {
    const validSvgs = [];
    
    for (let i = 0; i < svgElements.length; i++) {
        const svg = svgElements[i];
        try {
            console.log(`Checking SVG ${i}:`, {
                width: svg.getAttribute('width'),
                height: svg.getAttribute('height'),
                visible: svg.offsetParent !== null
            });
            
            if (svg.offsetParent !== null) {
                validSvgs.push(svg);
                console.log(`SVG ${i} is valid and visible`);
            } else {
                console.warn(`SVG ${i} is not visible`);
            }
        } catch (error) {
            console.warn(`Failed to check SVG ${i}:`, error);
        }
    }
    
    if (validSvgs.length === 0) {
        throw new Error('No valid SVG elements found');
    }
    
    // Convert SVGs to canvas
    const svgCanvases = [];
    for (const svg of validSvgs) {
        try {
            const svgData = new XMLSerializer().serializeToString(svg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);
            
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = svgUrl;
            });
            
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            svgCanvases.push(canvas);
            URL.revokeObjectURL(svgUrl);
            console.log('Successfully converted SVG to canvas');
        } catch (error) {
            console.warn('Failed to convert SVG to canvas:', error);
        }
    }
    
    if (svgCanvases.length === 0) {
        throw new Error('Failed to convert any SVG elements to canvas');
    }
    
    // Combine SVG canvases
    let totalWidth = 0;
    let totalHeight = 0;
    
    svgCanvases.forEach(canvas => {
        totalWidth = Math.max(totalWidth, canvas.width);
        totalHeight += canvas.height;
    });
    
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = totalWidth;
    finalCanvas.height = totalHeight;
    const ctx = finalCanvas.getContext('2d');
    
    // Set white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, totalWidth, totalHeight);
    
    // Draw each canvas
    let currentY = 0;
    for (const canvas of svgCanvases) {
        ctx.drawImage(canvas, 0, currentY);
        currentY += canvas.height;
    }
    
    // Convert to JPEG data URL with high quality
    console.log('🖼️ Converting SVG canvas to JPEG...');
    const jpegDataUrl = finalCanvas.toDataURL('image/jpeg', 0.95);
    
    if (!jpegDataUrl || jpegDataUrl === 'data:,') {
        throw new Error('Failed to generate JPEG data from SVG canvas');
    }
    
    console.log('✅ Successfully created JPEG data URL from SVG');
    return jpegDataUrl;
}

// Helper function to export from DOM using manual canvas drawing
async function exportFromDom(container) {
    console.log('Attempting DOM-to-canvas conversion...');
    
    // Create a canvas based on the container size
    const rect = container.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext('2d');
    
    // Set white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    try {
        // Try to capture the container content
        // This is a simplified approach - for better results, you might want to use html2canvas library
        
        // Get all images in the container
        const images = container.querySelectorAll('img');
        console.log(`Found ${images.length} images in container`);
        
        let yOffset = 0;
        for (const img of images) {
            if (img.complete && img.naturalWidth > 0) {
                try {
                    ctx.drawImage(img, 0, yOffset, img.offsetWidth, img.offsetHeight);
                    yOffset += img.offsetHeight + 10; // Add some spacing
                    console.log('Drew image to canvas');
                } catch (error) {
                    console.warn('Failed to draw image:', error);
                }
            }
        }
        
        // If no images were found or drawn, try a different approach
        if (yOffset === 0) {
            // Draw a placeholder message
            ctx.fillStyle = '#333';
            ctx.font = '16px Arial';
            ctx.fillText('Tab content could not be captured', 20, 50);
            ctx.fillText('Please try using HTML export instead', 20, 80);
            console.log('Drew placeholder message');
        }
        
        // Convert to JPEG data URL with high quality
        console.log('🖼️ Converting DOM canvas to JPEG...');
        const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        
        if (!jpegDataUrl || jpegDataUrl === 'data:,') {
            throw new Error('Failed to generate JPEG data from DOM canvas');
        }
        
        console.log('✅ Successfully created JPEG data URL from DOM');
        return jpegDataUrl;
        
    } catch (error) {
        console.error('DOM-to-canvas conversion failed:', error);
        throw new Error('Failed to convert DOM content to canvas');
    }
}

// Update the score loaded event to store current score and enable export button
function updateScoreForExport(score) {
    currentScore = score;
    exportPngBtn.disabled = false;
    exportPngBtn.title = 'Export HTML';
}

// Helper function to render specific bar range
async function renderBarRange(startBar, endBar) {
    if (!api || !currentScore) {
        throw new Error('AlphaTab API or score not available');
    }
    
    console.log(`Rendering bar range: ${startBar + 1} to ${endBar + 1}`);
    
    // Check if we need to render a specific range or full score
    const totalBars = currentScore.masterBars ? currentScore.masterBars.length : 0;
    const isFullRange = startBar === 0 && endBar === (totalBars - 1);
    
    if (isFullRange) {
        console.log('Rendering full score (no bar range filtering needed)');
        // Just ensure the full score is rendered
        api.renderScore(api.score);
    } else {
        console.log('Rendering partial bar range - this will require custom implementation');
        // For now, render the full score and we'll crop during export
        // TODO: Implement actual bar range rendering
        api.renderScore(api.score);
    }
    
    // Reset rendering completion flag and wait for new render
    isRenderingComplete = false;
    await waitForRenderingComplete();
    
    return { isFullRange, totalBars };
} 