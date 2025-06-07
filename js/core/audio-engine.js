/**
 * Professional Audio Engine for TabPlayer
 * Uses Web Audio API for high-quality synthesized guitar sounds
 * Free to build and use - no external dependencies
 */

class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.isInitialized = false;
        this.activeNotes = new Map();
        this.settings = {
            volume: 0.7,
            tempo: 120, // BPM for scale playback
            noteLength: 0.5, // seconds
            chordSpread: 0.05, // seconds between chord notes for arpeggio
            waveform: 'sawtooth' // sawtooth gives a nice guitar-like tone
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

    // Create a clean, natural guitar tone using simple oscillator synthesis
    createGuitarTone(frequency, startTime, duration) {
        // Create the fundamental tone
        const fundamental = this.audioContext.createOscillator();
        fundamental.type = 'sawtooth'; // Rich harmonic content like a guitar string
        fundamental.frequency.setValueAtTime(frequency, startTime);
        
        // Create subtle harmonic overtones
        const octave = this.audioContext.createOscillator();
        octave.type = 'triangle';
        octave.frequency.setValueAtTime(frequency * 2, startTime);
        
        const fifth = this.audioContext.createOscillator();
        fifth.type = 'sine';
        fifth.frequency.setValueAtTime(frequency * 1.5, startTime);
        
        // Create gain nodes for mixing
        const fundamentalGain = this.audioContext.createGain();
        const octaveGain = this.audioContext.createGain();
        const fifthGain = this.audioContext.createGain();
        const masterGain = this.audioContext.createGain();
        
        // Set mix levels for natural guitar sound
        fundamentalGain.gain.value = 0.8;  // Strong fundamental
        octaveGain.gain.value = 0.15;      // Subtle octave
        fifthGain.gain.value = 0.1;        // Very subtle fifth
        
        // Guitar-like envelope (quick attack, natural decay)
        const attackTime = 0.01;   // Quick pluck attack
        const decayTime = 0.3;     // Natural decay
        const sustainLevel = 0.4;  // Moderate sustain
        const releaseTime = 0.5;   // Natural release
        
        // Apply envelope
        masterGain.gain.setValueAtTime(0, startTime);
        masterGain.gain.linearRampToValueAtTime(0.6, startTime + attackTime);
        masterGain.gain.exponentialRampToValueAtTime(sustainLevel, startTime + attackTime + decayTime);
        masterGain.gain.setValueAtTime(sustainLevel, startTime + duration - releaseTime);
        masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        // Guitar body simulation with gentle filtering
        const bodyFilter = this.audioContext.createBiquadFilter();
        bodyFilter.type = 'lowpass';
        bodyFilter.frequency.setValueAtTime(3000, startTime); // Warm guitar tone
        bodyFilter.Q.setValueAtTime(0.5, startTime);
        
        // Connect the audio graph
        fundamental.connect(fundamentalGain);
        octave.connect(octaveGain);
        fifth.connect(fifthGain);
        
        fundamentalGain.connect(masterGain);
        octaveGain.connect(masterGain);
        fifthGain.connect(masterGain);
        
        masterGain.connect(bodyFilter);
        bodyFilter.connect(this.masterGain);
        
        // Start and stop oscillators
        fundamental.start(startTime);
        octave.start(startTime);
        fifth.start(startTime);
        
        fundamental.stop(startTime + duration);
        octave.stop(startTime + duration);
        fifth.stop(startTime + duration);
        
        return { fundamental, octave, fifth, masterGain };
    }
    
    // Play a single note
    async playNote(noteName, duration = null) {
        console.log('🎵 playNote called with:', noteName, 'duration:', duration);
        
        if (!this.isInitialized) {
            console.log('Audio engine not initialized, initializing now...');
            await this.initialize();
        }

        // Resume audio context if suspended (required by browsers)
        if (this.audioContext.state === 'suspended') {
            console.log('Audio context suspended, resuming...');
            await this.audioContext.resume();
            console.log('Audio context resumed, new state:', this.audioContext.state);
        }

        const freq = this.noteToFrequency(noteName);
        const noteLength = duration || this.settings.noteLength;
        const startTime = this.audioContext.currentTime;

        console.log(`🎵 Playing note: ${noteName} (${freq.toFixed(2)}Hz) for ${noteLength}s`);
        console.log('Audio context state:', this.audioContext.state);
        console.log('Master gain value:', this.masterGain.gain.value);

        try {
            this.createGuitarTone(freq, startTime, noteLength);
            console.log('✅ Guitar tone created and scheduled');
        } catch (error) {
            console.error('❌ Error creating guitar tone:', error);
            throw error;
        }
    }

    // Play a scale (ascending or descending)
    async playScale(notes, ascending = true) {
        if (!this.isInitialized) await this.initialize();
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        const playOrder = ascending ? notes : [...notes].reverse();
        const noteDuration = 60 / this.settings.tempo; // Convert BPM to seconds per note
        
        playOrder.forEach((note, index) => {
            const startTime = this.audioContext.currentTime + (index * noteDuration);
            const freq = this.noteToFrequency(note);
            this.createGuitarTone(freq, startTime, noteDuration * 0.8); // Slight gap between notes
        });

        console.log(`Playing scale: ${playOrder.join(' - ')}`);
    }

    // Play a chord (all notes together or arpeggiated)
    async playChord(notes, arpeggiated = false) {
        if (!this.isInitialized) await this.initialize();
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        // Convert chord notes to guitar-friendly octaves
        const guitarVoicing = this.createGuitarVoicing(notes);

        if (arpeggiated) {
            // Play notes in sequence with slight delay (like fingerpicking)
            guitarVoicing.forEach((note, index) => {
                const startTime = this.audioContext.currentTime + (index * this.settings.chordSpread);
                const freq = this.noteToFrequency(note);
                this.createGuitarTone(freq, startTime, this.settings.noteLength * 1.5); // Longer for arpeggiated
            });
        } else {
            // Play all notes simultaneously with slight human timing variations
            const baseStartTime = this.audioContext.currentTime;
            guitarVoicing.forEach((note, index) => {
                // Add tiny random timing variations (like human strumming)
                const humanTiming = (Math.random() - 0.5) * 0.01; // ±5ms variation
                const startTime = baseStartTime + humanTiming;
                const freq = this.noteToFrequency(note);
                
                // Vary the duration slightly for each string (like real guitar resonance)
                const durationVariation = 1 + (Math.random() - 0.5) * 0.2; // ±10% variation
                const noteDuration = this.settings.noteLength * durationVariation;
                
                this.createGuitarTone(freq, startTime, noteDuration);
            });
        }

        console.log(`Playing chord: ${notes.join(' - ')} -> Guitar voicing: ${guitarVoicing.join(' - ')} ${arpeggiated ? '(arpeggiated)' : '(strummed)'}`);
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