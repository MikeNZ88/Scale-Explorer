/**
 * Professional Audio Engine for TabPlayer
 * Uses Web Audio API for high-quality synthesized guitar sounds
 * Free to build and use - no external dependencies
 */

class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.reverb = null;
        this.isInitialized = false;
        this.activeNotes = new Map();
        this.settings = {
            volume: 0.7,
            tempo: 85, // Reduced from 100 for better timing precision
            noteLength: 0.6,
            chordSpread: 0.03,
            reverbAmount: 0.15
        };
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('🎵 Initializing Audio Engine...');
            
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('✅ Audio Context created:', this.audioContext.state);
            
            // Create reverb effect
            this.reverbNode = await this.createReverb();
            console.log('✅ Reverb effect created');
            
            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.settings.volume;
            
            // Connect master gain through reverb to destination
            this.masterGain.connect(this.reverbNode);
            this.reverbNode.connect(this.audioContext.destination);
            console.log('✅ Master gain node created and connected through reverb');

            this.isInitialized = true;
            console.log('🎵 Audio Engine initialized successfully');
            console.log('Audio Context State:', this.audioContext.state);
            console.log('Sample Rate:', this.audioContext.sampleRate);
            
        } catch (error) {
            console.error('❌ Failed to initialize Audio Engine:', error);
            throw error;
        }
    }

    // Create a simple reverb effect using convolution
    async createReverb() {
        const convolver = this.audioContext.createConvolver();
        
        // Create impulse response for room reverb
        const length = this.audioContext.sampleRate * 2; // 2 seconds
        const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                // Create a decaying noise burst (simple room simulation)
                const decay = Math.pow(1 - i / length, 2);
                channelData[i] = (Math.random() * 2 - 1) * decay * 0.1; // Low reverb level
            }
        }
        
        convolver.buffer = impulse;
        
        // Create wet/dry mix
        const dryGain = this.audioContext.createGain();
        const wetGain = this.audioContext.createGain();
        const outputGain = this.audioContext.createGain();
        
        dryGain.gain.value = 0.95;  // 95% dry signal (much cleaner)
        wetGain.gain.value = 0.05;  // 5% wet signal (minimal reverb)
        
        // Create the reverb chain
        const inputSplitter = this.audioContext.createGain();
        
        // Dry path
        inputSplitter.connect(dryGain);
        dryGain.connect(outputGain);
        
        // Wet path
        inputSplitter.connect(convolver);
        convolver.connect(wetGain);
        wetGain.connect(outputGain);
        
        // Store references for potential adjustment
        this.reverbDryGain = dryGain;
        this.reverbWetGain = wetGain;
        
        return inputSplitter;
    }

    // Convert note name to frequency
    noteToFrequency(noteName) {
        // Clean the note name
        const cleanNote = noteName.trim().replace(/[^\w#b]/g, '');
        
        // Extract base note and octave
        let baseNote = cleanNote.replace(/[0-9]/g, '');
        const octaveMatch = cleanNote.match(/[0-9]/);
        const octave = octaveMatch ? parseInt(octaveMatch[0]) : 4; // Default to 4th octave
        
        console.log(`Note conversion: "${noteName}" -> base: "${baseNote}", octave: ${octave}`);
        
        // Handle double accidentals
        let semitoneOffset = 0;
        
        if (baseNote.includes('bb')) {
            // Double flat - subtract 2 semitones
            const naturalNote = baseNote.replace('bb', '');
            semitoneOffset = this.getNaturalNoteIndex(naturalNote) - 2;
        } else if (baseNote.includes('##')) {
            // Double sharp - add 2 semitones
            const naturalNote = baseNote.replace('##', '');
            semitoneOffset = this.getNaturalNoteIndex(naturalNote) + 2;
        } else {
            // Single accidental or natural
            semitoneOffset = this.getSingleAccidentalNoteIndex(baseNote);
        }
        
        // Normalize to 0-11 range
        semitoneOffset = ((semitoneOffset % 12) + 12) % 12;
        
        if (semitoneOffset === undefined || isNaN(semitoneOffset)) {
            console.warn(`Unknown note: ${baseNote}, defaulting to C`);
            return 261.63; // C4
        }
        
        const totalSemitones = (octave - 4) * 12 + semitoneOffset;
        
        // A4 = 440Hz as reference, C4 = 261.63Hz
        const frequency = 440 * Math.pow(2, (totalSemitones - 9) / 12);
        
        console.log(`Final frequency for ${noteName}: ${frequency.toFixed(2)}Hz`);
        return frequency;
    }
    
    // Helper method to get natural note index
    getNaturalNoteIndex(note) {
        const naturalNotes = {
            'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
        };
        return naturalNotes[note] !== undefined ? naturalNotes[note] : 0;
    }
    
    // Helper method to get single accidental note index
    getSingleAccidentalNoteIndex(note) {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
            'A#': 10, 'Bb': 10, 'B': 11, 'B#': 0, 'Cb': 11, 'E#': 5, 'Fb': 4
        };
        return noteMap[note] !== undefined ? noteMap[note] : 0;
    }

    // Create a realistic plucked guitar tone using enhanced Karplus-Strong algorithm
    createGuitarTone(frequency, startTime, duration) {
        // Karplus-Strong parameters
        const sampleRate = this.audioContext.sampleRate;
        const delayTime = 1 / frequency; // Period of the fundamental frequency
        const bufferSize = Math.round(delayTime * sampleRate);
        
        // Guitar string characteristics based on frequency
        const stringParams = this.getStringParameters(frequency);
        
        // Create the delay line buffer
        const delayBuffer = new Float32Array(bufferSize);
        
        // Fill with shaped noise (initial pluck excitation)
        // Use burst of noise followed by decay for more realistic pluck
        for (let i = 0; i < bufferSize; i++) {
            let noise = (Math.random() * 2 - 1);
            
            // Create a more realistic pluck envelope in the initial excitation
            const pluckPosition = i / bufferSize;
            let pluckEnvelope;
            
            if (stringParams.isLowString) {
                // Lower strings: broader, warmer initial excitation
                pluckEnvelope = Math.exp(-pluckPosition * 3) * (1 + Math.sin(pluckPosition * Math.PI * 2) * 0.3);
            } else {
                // Higher strings: sharper, brighter attack
                pluckEnvelope = Math.exp(-pluckPosition * 5) * (1 + Math.sin(pluckPosition * Math.PI * 3) * 0.2);
            }
            
            delayBuffer[i] = noise * pluckEnvelope * 0.8;
        }
        
        // Create audio buffer for the entire duration
        const totalSamples = Math.ceil(duration * sampleRate);
        const audioBuffer = this.audioContext.createBuffer(1, totalSamples, sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        
        // Enhanced Karplus-Strong synthesis parameters
        const dampingFactor = stringParams.damping; // String-specific damping
        const blendFactor = stringParams.brightness; // String-specific filtering
        let delayIndex = 0;
        
        // Add slight detuning for realism (guitar strings are never perfectly in tune)
        const detuning = (Math.random() - 0.5) * 0.001; // Reduced detuning for better pitch accuracy
        
        // Generate the plucked string sound
        for (let i = 0; i < totalSamples; i++) {
            // Get current sample from delay line
            const currentSample = delayBuffer[delayIndex];
            
            // Apply envelope (quick attack, exponential decay with string-specific characteristics)
            const timeRatio = i / totalSamples;
            const envelope = Math.exp(-timeRatio * stringParams.decayRate);
            
            // Add very subtle amplitude modulation for string vibration realism
            const vibrato = 1 + Math.sin(2 * Math.PI * i * 1.5 / sampleRate) * 0.001; // Reduced vibrato
            
            // Store the processed sample
            channelData[i] = currentSample * envelope * vibrato;
            
            // Enhanced Karplus-Strong feedback with improved filtering
            const nextIndex = (delayIndex + 1) % bufferSize;
            const nextSample = delayBuffer[nextIndex];
            
            // Improved two-point averaging with frequency-dependent filtering
            let filteredSample = (currentSample * blendFactor + nextSample * (1 - blendFactor));
            
            // Apply damping with frequency-dependent loss
            filteredSample *= dampingFactor;
            
            // Add subtle nonlinearity for more realistic string behavior (reduced)
            if (Math.abs(filteredSample) > 0.15) {
                filteredSample *= (1 - Math.abs(filteredSample) * 0.02); // Reduced nonlinearity
            }
            
            // Feed back into delay line
            delayBuffer[delayIndex] = filteredSample;
            
            // Advance delay line pointer
            delayIndex = nextIndex;
        }
        
        // Create buffer source and connect to audio graph
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        
        // Add guitar body resonance with frequency-dependent characteristics
        const bodyFilter = this.audioContext.createBiquadFilter();
        bodyFilter.type = 'lowpass';
        bodyFilter.frequency.setValueAtTime(stringParams.bodyResonance, startTime);
        bodyFilter.Q.setValueAtTime(stringParams.bodyQ, startTime);
        
        // Add a subtle high-frequency roll-off for warmth
        const warmthFilter = this.audioContext.createBiquadFilter();
        warmthFilter.type = 'lowpass';
        warmthFilter.frequency.setValueAtTime(5000, startTime); // Increased for more brightness
        warmthFilter.Q.setValueAtTime(0.3, startTime); // Reduced Q for smoother roll-off
        
        // Master gain for this note
        const noteGain = this.audioContext.createGain();
        noteGain.gain.setValueAtTime(stringParams.volume, startTime);
        
        // Connect the audio graph
        source.connect(bodyFilter);
        bodyFilter.connect(warmthFilter);
        warmthFilter.connect(noteGain);
        noteGain.connect(this.masterGain);
        
        // Start playback
        source.start(startTime);
        source.stop(startTime + duration);
        
        return { source, bodyFilter, warmthFilter, noteGain };
    }
    
    // Get string-specific parameters for realistic guitar modeling
    getStringParameters(frequency) {
        // Determine string characteristics based on frequency ranges
        // Standard guitar tuning: E2(82Hz), A2(110Hz), D3(147Hz), G3(196Hz), B3(247Hz), E4(330Hz)
        
        let params = {
            damping: 0.996,
            brightness: 0.5,
            decayRate: 4,
            bodyResonance: 2000,
            bodyQ: 0.7,
            volume: 0.35,
            isLowString: false
        };
        
        if (frequency < 120) {
            // Low E and A strings - warmer, more sustained
            params.damping = 0.998;
            params.brightness = 0.35;
            params.decayRate = 2.5;
            params.bodyResonance = 1200 + frequency * 1.2;
            params.bodyQ = 0.9;
            params.volume = 0.4;
            params.isLowString = true;
        } else if (frequency < 180) {
            // D string - balanced
            params.damping = 0.997;
            params.brightness = 0.4;
            params.decayRate = 3;
            params.bodyResonance = 1600 + frequency * 1.0;
            params.bodyQ = 0.8;
            params.volume = 0.38;
        } else if (frequency < 250) {
            // G string - slightly brighter
            params.damping = 0.996;
            params.brightness = 0.5;
            params.decayRate = 3.5;
            params.bodyResonance = 1800 + frequency * 0.8;
            params.bodyQ = 0.75;
            params.volume = 0.36;
        } else {
            // B and high E strings - brighter, shorter decay
            params.damping = 0.994;
            params.brightness = 0.65;
            params.decayRate = 4.5;
            params.bodyResonance = 2000 + frequency * 0.6;
            params.bodyQ = 0.6;
            params.volume = 0.34;
        }
        
        return params;
    }

    // Play a single note with precise timing
    async playNote(noteName, duration = null) {
        if (!this.isInitialized) await this.initialize();
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        const freq = this.noteToFrequency(noteName);
        const noteDuration = duration || this.settings.noteLength;
        
        // Use immediate timing for better synchronization
        const startTime = this.audioContext.currentTime;
        
        this.createGuitarTone(freq, startTime, noteDuration);
        
        console.log(`Playing note: ${noteName} (${freq.toFixed(2)}Hz) at ${startTime.toFixed(3)}s for ${noteDuration.toFixed(2)}s`);
    }

    // Play a scale (ascending or descending) with proper timing
    async playScale(notes, ascending = true) {
        if (!this.isInitialized) await this.initialize();
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        const playOrder = ascending ? notes : [...notes].reverse();
        const noteDuration = 60 / this.settings.tempo; // Convert BPM to seconds per note
        
        // Start immediately from current audio context time for better sync
        const baseStartTime = this.audioContext.currentTime;
        
        playOrder.forEach((note, index) => {
            const startTime = baseStartTime + (index * noteDuration);
            const freq = this.noteToFrequency(note);
            this.createGuitarTone(freq, startTime, noteDuration * 0.9); // Slight overlap for smoother playback
        });

        console.log(`Playing scale: ${playOrder.join(' - ')} starting at ${baseStartTime.toFixed(3)}s`);
    }

    // Play a chord (all notes together or arpeggiated) with improved timing
    async playChord(notes, arpeggiated = false) {
        if (!this.isInitialized) await this.initialize();
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        // Convert chord notes to guitar-friendly octaves
        const guitarVoicing = this.createGuitarVoicing(notes);
        
        // Start immediately from current audio context time for better sync
        const baseStartTime = this.audioContext.currentTime;

        if (arpeggiated) {
            // Play notes in sequence with slight delay (like fingerpicking)
            guitarVoicing.forEach((note, index) => {
                const startTime = baseStartTime + (index * this.settings.chordSpread);
                const freq = this.noteToFrequency(note);
                this.createGuitarTone(freq, startTime, this.settings.noteLength * 1.8); // Longer for arpeggiated
            });
        } else {
            // Play all notes simultaneously with slight human timing variations
            guitarVoicing.forEach((note, index) => {
                // Add tiny random timing variations (like human strumming)
                const humanTiming = (Math.random() - 0.5) * 0.005; // Reduced timing variation
                const startTime = baseStartTime + humanTiming;
                const freq = this.noteToFrequency(note);
                
                // Vary the duration slightly for each string (like real guitar resonance)
                const durationVariation = 1 + (Math.random() - 0.5) * 0.1; // Reduced variation
                const noteDuration = this.settings.noteLength * durationVariation;
                
                this.createGuitarTone(freq, startTime, noteDuration);
            });
        }

        console.log(`Playing chord: ${notes.join(' - ')} -> Guitar voicing: ${guitarVoicing.join(' - ')} ${arpeggiated ? '(arpeggiated)' : '(strummed)'} at ${baseStartTime.toFixed(3)}s`);
    }

    // Create guitar-friendly chord voicing using real guitar chord shapes
    createGuitarVoicing(notes) {
        // Standard guitar tuning frequencies (in Hz for reference)
        // E2=82.4, A2=110, D3=146.8, G3=196, B3=246.9, E4=329.6
        
        // Clean note names
        const cleanNotes = notes.map(note => note.replace(/[0-9]/g, ''));
        const rootNote = cleanNotes[0];
        
        // Common guitar chord voicings (based on actual guitar fingerings)
        const guitarChordShapes = {
            // Major chords
            'C': ['C3', 'E3', 'G3', 'C4', 'E4'],
            'D': ['D3', 'A3', 'D4', 'F#4'],
            'E': ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'],
            'F': ['F2', 'C3', 'F3', 'A3', 'C4', 'F4'],
            'G': ['G2', 'B2', 'D3', 'G3', 'B3', 'G4'],
            'A': ['A2', 'E3', 'A3', 'C#4', 'E4'],
            'B': ['B2', 'F#3', 'B3', 'D#4', 'F#4'],
            
            // Minor chords (add 'm' suffix)
            'Cm': ['C3', 'Eb3', 'G3', 'C4', 'Eb4'],
            'Dm': ['D3', 'A3', 'D4', 'F4'],
            'Em': ['E2', 'B2', 'E3', 'G3', 'B3', 'E4'],
            'Fm': ['F2', 'C3', 'F3', 'Ab3', 'C4', 'F4'],
            'Gm': ['G2', 'Bb2', 'D3', 'G3', 'Bb3', 'G4'],
            'Am': ['A2', 'E3', 'A3', 'C4', 'E4'],
            'Bm': ['B2', 'F#3', 'B3', 'D4', 'F#4'],
            
            // Seventh chords
            'C7': ['C3', 'E3', 'Bb3', 'C4', 'E4'],
            'Cmaj7': ['C3', 'E3', 'G3', 'B3', 'E4'],
            'Dm7': ['D3', 'A3', 'C4', 'F4'],
            'Em7': ['E2', 'B2', 'D3', 'G3', 'B3', 'E4'],
            'Fmaj7': ['F2', 'C3', 'E3', 'A3', 'C4'],
            'G7': ['G2', 'B2', 'D3', 'F3', 'B3', 'G4'],
            'Am7': ['A2', 'E3', 'G3', 'C4', 'E4'],
        };
        
        // Try to find a matching guitar chord shape
        let chordKey = rootNote;
        
        // Check for chord quality indicators
        if (notes.length >= 3) {
            const third = cleanNotes[1];
            const isMinor = this.isMinorThird(rootNote, third);
            if (isMinor) chordKey += 'm';
        }
        
        // Check for seventh
        if (notes.length >= 4) {
            const seventh = cleanNotes[3];
            if (this.isMajorSeventh(rootNote, seventh)) {
                chordKey = chordKey.replace('m', '') + 'maj7';
            } else if (this.isMinorSeventh(rootNote, seventh)) {
                chordKey += '7';
            }
        }
        
        // Use predefined guitar voicing if available
        if (guitarChordShapes[chordKey]) {
            return guitarChordShapes[chordKey];
        }
        
        // Fallback: create guitar-range voicing
        return this.createGuitarRangeVoicing(cleanNotes);
    }
    
    // Create voicing within guitar range when no preset exists
    createGuitarRangeVoicing(notes) {
        // Guitar range: E2 (82Hz) to E5 (659Hz) approximately
        const guitarOctaves = [2, 3, 4, 5];
        
        return notes.map((note, index) => {
            let octave;
            
            // Distribute notes across guitar range
            if (index === 0) {
                // Root - usually low
                octave = note === 'E' || note === 'F' || note === 'G' ? 2 : 3;
            } else if (index === 1) {
                // Second note - middle-low
                octave = 3;
            } else if (index === 2) {
                // Third note - middle-high
                octave = 3;
            } else {
                // Higher notes - upper register
                octave = 4;
            }
            
            return `${note}${octave}`;
        });
    }
    
    // Helper functions for chord analysis
    isMinorThird(root, third) {
        const intervals = {
            'C': { 'Eb': true, 'E': false },
            'D': { 'F': true, 'F#': false },
            'E': { 'G': true, 'G#': false },
            'F': { 'Ab': true, 'A': false },
            'G': { 'Bb': true, 'B': false },
            'A': { 'C': true, 'C#': false },
            'B': { 'D': true, 'D#': false }
        };
        return intervals[root] && intervals[root][third] === true;
    }
    
    isMajorSeventh(root, seventh) {
        const majorSevenths = {
            'C': 'B', 'D': 'C#', 'E': 'D#', 'F': 'E',
            'G': 'F#', 'A': 'G#', 'B': 'A#'
        };
        return majorSevenths[root] === seventh;
    }
    
    isMinorSeventh(root, seventh) {
        const minorSevenths = {
            'C': 'Bb', 'D': 'C', 'E': 'D', 'F': 'Eb',
            'G': 'F', 'A': 'G', 'B': 'A'
        };
        return minorSevenths[root] === seventh;
    }

    // Stop all currently playing notes
    stopAll() {
        // The Web Audio API will automatically clean up completed nodes
        // For immediate stopping, we'd need to track active nodes
        console.log('Stopping all audio');
    }

    // Update settings
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        if (this.masterGain && newSettings.volume !== undefined) {
            this.masterGain.gain.setValueAtTime(newSettings.volume, this.audioContext.currentTime);
        }
        
        console.log('Audio settings updated:', this.settings);
    }

    // Get current settings
    getSettings() {
        return { ...this.settings };
    }
}

// Create global audio engine instance
window.AudioEngine = new AudioEngine();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioEngine;
} 