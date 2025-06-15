/**
 * Music Theory Module - Main Entry Point
 * Aggregates all music theory functionality from specialized modules
 * This version works with traditional script loading (no ES6 modules)
 */

// Wait for all modules to load, then create the MusicTheory object
(function() {
    'use strict';
    
    // Function to check if all required modules are loaded
    function checkModulesLoaded() {
        const modules = {
            ColorUtils: window.ColorUtils,
            ScaleCalculator: window.ScaleCalculator,
            ChordAnalyzer: window.ChordAnalyzer,
            IntervalUtils: window.IntervalUtils,
            PatternDetection: window.PatternDetection
        };
        
        console.log('Module loading status:', modules);
        
        return window.ColorUtils && 
               window.ScaleCalculator && 
               window.ChordAnalyzer && 
               window.IntervalUtils && 
               window.PatternDetection;
    }
    
    // Function to initialize MusicTheory object
    function initializeMusicTheory() {
        if (!checkModulesLoaded()) {
            // If modules aren't loaded yet, try again in 10ms
            console.log('Modules not ready, retrying in 10ms...');
            setTimeout(initializeMusicTheory, 10);
            return;
        }
        
        console.log('All modules loaded, initializing MusicTheory...');

// Create the main MusicTheory object for backward compatibility
const MusicTheory = {
    // Color utilities
            hexToRgb: window.ColorUtils.hexToRgb,
            rgbToHex: window.ColorUtils.rgbToHex,
            calculateScaleColor: window.ColorUtils.calculateScaleColor,
            enhanceScaleColor: window.ColorUtils.enhanceScaleColor,
            getIntervalColor: window.ColorUtils.getIntervalColor,
            lightenColor: window.ColorUtils.lightenColor,
            getChordColor: window.ColorUtils.getChordColor,
    
    // Scale calculations
            getProperNoteSpelling: window.ScaleCalculator.getProperNoteSpelling,
            calculateScale: window.ScaleCalculator.calculateScale,
            calculateScaleWithDegrees: window.ScaleCalculator.calculateScaleWithDegrees,
            calculatePentatonicScale: window.ScaleCalculator.calculatePentatonicScale,
            calculateBluesScale: window.ScaleCalculator.calculateBluesScale,
            calculateHybridBluesScale: window.ScaleCalculator.calculateHybridBluesScale,
            calculateAugmentedScale: window.ScaleCalculator.calculateAugmentedScale,
            calculateDiminishedScale: window.ScaleCalculator.calculateDiminishedScale,
            calculateChromaticScale: window.ScaleCalculator.calculateChromaticScale,
            getChromatic: window.ScaleCalculator.getChromatic,
            getModeNotes: window.ScaleCalculator.getModeNotes,
    
    // Chord analysis
            calculateTriads: window.ChordAnalyzer.calculateTriads,
            calculateSeventhChords: window.ChordAnalyzer.calculateSeventhChords,
            analyzeTriadComprehensive: window.ChordAnalyzer.analyzeTriadComprehensive,
            analyzeSeventhChordComprehensive: window.ChordAnalyzer.analyzeSeventhChordComprehensive,
            isValidTriad: window.ChordAnalyzer.isValidTriad,
            getTriadScore: window.ChordAnalyzer.getTriadScore,
            detectTriadInversion: window.ChordAnalyzer.detectTriadInversion,
            analyzePentatonicChord: window.ChordAnalyzer.analyzePentatonicChord,
            analyzeDiminishedChord: window.ChordAnalyzer.analyzeDiminishedChord,
            analyzePentatonicSeventhChord: window.ChordAnalyzer.analyzePentatonicSeventhChord,
            analyzeDiminishedSeventhChord: window.ChordAnalyzer.analyzeDiminishedSeventhChord,
            calculateDiminishedScaleTriads: window.ChordAnalyzer.calculateDiminishedScaleTriads,
            calculateDiminishedScaleSeventhChords: window.ChordAnalyzer.calculateDiminishedScaleSeventhChords,
            isValidSeventhChord: window.ChordAnalyzer.isValidSeventhChord,
            getSeventhChordScore: window.ChordAnalyzer.getSeventhChordScore,
            // Additional chord functions
            calculateSixthChords: window.ChordAnalyzer.calculateSixthChords,
            calculateSus2Chords: window.ChordAnalyzer.calculateSus2Chords,
            calculateSus4Chords: window.ChordAnalyzer.calculateSus4Chords,
            calculateSus4SeventhChords: window.ChordAnalyzer.calculateSus4SeventhChords,
            calculateNinthChords: window.ChordAnalyzer.calculateNinthChords,
            calculateEleventhChords: window.ChordAnalyzer.calculateEleventhChords,
            calculateThirteenthChords: window.ChordAnalyzer.calculateThirteenthChords,
    
    // Interval utilities
            getIntervalName: window.IntervalUtils.getIntervalName,
            getIntervalBetweenNotes: window.IntervalUtils.getIntervalBetweenNotes,
            getIntervals: window.IntervalUtils.getIntervals,
            getRomanNumeral: window.IntervalUtils.getRomanNumeral,
            getChordFunction: window.IntervalUtils.getChordFunction,
            areEnharmonicEquivalents: areEnharmonicEquivalents,
            getEnharmonicEquivalent: getEnharmonicEquivalent,
            getIntervalEnharmonicEquivalent: getIntervalEnharmonicEquivalent,
            getEnharmonicTooltip: getEnharmonicTooltip,
            getChordIntervals: getChordIntervals,
            
            // Pattern detection
            isHarmonicMinorPattern: window.PatternDetection.isHarmonicMinorPattern,
            isMelodicMinorPattern: window.PatternDetection.isMelodicMinorPattern,
            isMajorPattern: window.PatternDetection.isMajorPattern,
            isBluesPattern: window.PatternDetection.isBluesPattern,
            isBluesMajorPattern: window.PatternDetection.isBluesMajorPattern,
            isBluesMinorPattern: window.PatternDetection.isBluesMinorPattern,
            isWholeToneScale: window.PatternDetection.isWholeToneScale,
            isAugmentedScale: window.PatternDetection.isAugmentedScale,
            isAugmentedScale2: window.PatternDetection.isAugmentedScale2,
            shouldDisplayChords: window.PatternDetection.shouldDisplayChords,
            
            // New functions
            getCharacteristicChords: getCharacteristicChords,
            isWholeToneScale: isWholeToneScale,
            isAugmentedScale: isAugmentedScale,
            getDiminishedScaleChords: getDiminishedScaleChords,
            getPentatonicScaleChords: getPentatonicScaleChords,
            getWholeToneScaleChords: getWholeToneScaleChords,
            getBluesScaleChords: getBluesScaleChords,
            getAugmentedScaleChords: getAugmentedScaleChords,
            getChromaticScaleChords: getChromaticScaleChords
        };
        
        // Make MusicTheory available globally
        window.MusicTheory = MusicTheory;
        
        // Verify that calculateScale is properly assigned
        console.log('MusicTheory.calculateScale:', typeof window.MusicTheory.calculateScale);
        console.log('ScaleCalculator.calculateScale:', typeof window.ScaleCalculator.calculateScale);
        
        console.log('MusicTheory module initialized successfully');
    }
    
    // Start initialization when DOM is ready or immediately if already ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMusicTheory);
    } else {
        initializeMusicTheory();
    }
})();

// Add missing functions needed by the application

function areEnharmonicEquivalents(note1, note2) {
    if (note1 === note2) return true;
    
    // Convert both notes to their chromatic index for comparison
    const noteToIndex = (note) => {
        // Handle double sharps and flats
        if (note.includes('##')) {
            const baseNote = note.replace('##', '');
            const baseIndex = getNoteIndex(baseNote);
            return (baseIndex + 2) % 12;
        }
        if (note.includes('bb')) {
            const baseNote = note.replace('bb', '');
            const baseIndex = getNoteIndex(baseNote);
            return (baseIndex - 2 + 12) % 12;
        }
        
        return getNoteIndex(note);
    };
    
    const getNoteIndex = (note) => {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'E#': 5, 'Fb': 4,
            'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 
            'B': 11, 'B#': 0, 'Cb': 11
        };
        return noteMap[note] !== undefined ? noteMap[note] : 0;
    };
    
    return noteToIndex(note1) === noteToIndex(note2);
}

function getEnharmonicEquivalent(note) {
    const enharmonicMap = {
        'C#': 'Db', 'Db': 'C#',
        'D#': 'Eb', 'Eb': 'D#',
        'F#': 'Gb', 'Gb': 'F#',
        'G#': 'Ab', 'Ab': 'G#',
        'A#': 'Bb', 'Bb': 'A#',
        'B#': 'C', 'Cb': 'B',
        'E#': 'F', 'Fb': 'E'
    };
    
    // Handle double accidentals
    if (note.includes('##')) {
        const baseNote = note.replace('##', '');
        const noteMap = { 'C': 'D', 'D': 'E', 'E': 'F#', 'F': 'G', 'G': 'A', 'A': 'B', 'B': 'C#' };
        return noteMap[baseNote] || note;
    }
    if (note.includes('bb')) {
        const baseNote = note.replace('bb', '');
        const noteMap = { 'C': 'Bb', 'D': 'C', 'E': 'D', 'F': 'Eb', 'G': 'F', 'A': 'G', 'B': 'A' };
        return noteMap[baseNote] || note;
    }
    
    return enharmonicMap[note] || null;
}

function getIntervalEnharmonicEquivalent(interval) {
    const enharmonicMap = {
        'b2': '#1', '#1': 'b2',
        'b3': '#2', '#2': 'b3',
        'b5': '#4', '#4': 'b5',
        'b6': '#5', '#5': 'b6',
        'b7': '#6', '#6': 'b7',
        'bb3': '2', 'bb7': '6'
    };
    
    return enharmonicMap[interval] || null;
}

function getEnharmonicTooltip(value, type = 'note') {
    if (type === 'note') {
        const equivalent = getEnharmonicEquivalent(value);
        if (equivalent) {
            // Check if it's a double accidental to natural conversion
            if (value.includes('##') || value.includes('bb') || 
                ['B#', 'E#', 'Cb', 'Fb'].includes(value)) {
                return `Practical spelling: ${equivalent}`;
            } else {
                return `Enharmonic equivalent: ${equivalent}`;
            }
        }
    } else if (type === 'interval') {
        const equivalent = getIntervalEnharmonicEquivalent(value);
        if (equivalent) {
            // Check if it's a double accidental
            if (value.includes('bb') || value.includes('##')) {
                return `Practical spelling: ${equivalent}`;
            } else {
                return `Enharmonic equivalent: ${equivalent}`;
            }
        }
    }
    
    return null;
}

function getChordIntervals(chordNotes, rootNote) {
    if (!chordNotes || !Array.isArray(chordNotes) || chordNotes.length === 0) {
        return [];
    }
    
    function noteToIndex(note) {
        const noteMap = { 'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11 };
        return noteMap[note] !== undefined ? noteMap[note] : 0;
    }
    
    const rootIndex = noteToIndex(rootNote);
    
    // First pass: identify what tertiary chord tones (1, 3, 5, 7) are present
    const tertiaryTones = {
        hasThird: false,        // 3 or ♭3 (semitones 3-4)
        hasPerfectFifth: false, // ONLY perfect 5 (semitone 7) - NOT ♭5
        hasSeventh: false       // 7 or ♭7 (semitones 10-11)
    };
    
    // Check which tertiary tones exist in the chord
    chordNotes.forEach(note => {
        const noteIndex = noteToIndex(note);
        const semitones = (noteIndex - rootIndex + 12) % 12;
        
        if (semitones === 3 || semitones === 4) tertiaryTones.hasThird = true;
        if (semitones === 7) tertiaryTones.hasPerfectFifth = true; // ONLY perfect fifth!
        if (semitones === 10 || semitones === 11) tertiaryTones.hasSeventh = true;
    });
    
    // Second pass: determine intervals based on context
    const intervals = chordNotes.map((note, index) => {
        const noteIndex = noteToIndex(note);
        const semitones = (noteIndex - rootIndex + 12) % 12;
        
        switch (semitones) {
            case 0: return '1';    // Root
            case 1: 
                // ♭9 if third exists, ♭2 if no third
                return tertiaryTones.hasThird ? 'b9' : 'b2';
            case 2: 
                // 9 if third exists, 2 if no third
                return tertiaryTones.hasThird ? '9' : '2';
            case 3: return 'b3';   // Minor third (always tertiary)
            case 4: return '3';    // Major third (always tertiary)
            case 5: 
                // 11 if seventh exists, 4 if no seventh
                return tertiaryTones.hasSeventh ? '11' : '4';
            case 6: 
                // #11 if perfect fifth exists, ♭5 if no perfect fifth
                return tertiaryTones.hasPerfectFifth ? '#11' : 'b5';
            case 7: return '5';    // Perfect fifth (always tertiary)
            case 8: 
                // ♭13 if seventh exists, ♭6 if no seventh
                return tertiaryTones.hasSeventh ? 'b13' : 'b6';
            case 9: 
                // 13 if seventh exists, 6 if no seventh
                return tertiaryTones.hasSeventh ? '13' : '6';
            case 10: return 'b7';  // Minor seventh (always tertiary)
            case 11: return '7';   // Major seventh (always tertiary)
            default: return '1';
        }
    });
    
    return intervals;
}

function getCharacteristicChords(scale, scaleType) {
    // For scales that don't follow traditional degree-by-degree analysis
    // Return the characteristic chord types they naturally produce
    
    // Enhanced detection patterns with more comprehensive matching
    
    // Diminished scales (8-note scales) - CHECK FIRST
    if (scaleType.includes('diminished') || scaleType.includes('dim') || 
        (scale && scale.length === 8)) {
        return getDiminishedScaleChords(scale);
    }
    
    // Blues scales (6-note scales) - CHECK BEFORE PENTATONIC
    if (scaleType === 'blues' || scaleType === 'blues-major' || scaleType === 'blues-minor' || 
        scaleType.includes('blues') || 
        (scale && scale.length === 6 && window.PatternDetection && window.PatternDetection.isBluesPattern(scale, scale[0]))) {
        return getBluesScaleChords(scale, scaleType);
    }
    
    // Whole tone scales (6-note scales with whole tone pattern)
    if (scaleType === 'whole-tone' || scaleType === 'whole_tone' || scaleType.includes('whole') || 
        (scale && scale.length === 6 && isWholeToneScale(scale))) {
        return getWholeToneScaleChords(scale);
    }
    
    // Pentatonic scales (5-note scales) - CHECK AFTER BLUES
    if (scaleType === 'major-pentatonic' || scaleType === 'minor-pentatonic' || scaleType === 'pentatonic' ||
        scaleType.includes('pentatonic') || (scale && scale.length === 5)) {
        const result = getPentatonicScaleChords(scale, scaleType);
        return result;
    }
    
    // Augmented scales (6-note symmetrical scales)
    if (scaleType === 'augmented' || scaleType.includes('augmented') || 
        (scale && scale.length === 6 && isAugmentedScale(scale))) {
        return getAugmentedScaleChords(scale);
    }
    
    // Chromatic scale (12-note scale)
    if (scaleType === 'chromatic' || scaleType.includes('chromatic') || 
        (scale && scale.length === 12)) {
        return getChromaticScaleChords(scale);
    }
    
    // Return null for scales that should use traditional analysis
    return null;
}

function isWholeToneScale(scale) {
    if (!scale || scale.length !== 6) return false;
    
    // Check if all intervals are whole tones (2 semitones)
    const noteToIndex = (note) => {
        const cleanNote = note.replace(/[♯♭#b]/g, match => {
            return match === '♯' || match === '#' ? '#' : 'b';
        });
        
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
            'A#': 10, 'Bb': 10, 'B': 11,
            'B#': 0, 'Cb': 11, 'E#': 5, 'Fb': 4
        };
        return noteMap[cleanNote] !== undefined ? noteMap[cleanNote] : 0;
    };
    
    for (let i = 0; i < scale.length - 1; i++) {
        const currentNote = noteToIndex(scale[i]);
        const nextNote = noteToIndex(scale[i + 1]);
        const interval = (nextNote - currentNote + 12) % 12;
        
        if (interval !== 2) {
            return false;
        }
    }
    
    return true;
}

function isAugmentedScale(scale) {
    if (!scale || scale.length !== 6) return false;
    
    const noteToIndex = (note) => {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
            'A#': 10, 'Bb': 10, 'B': 11
        };
        return noteMap[note] !== undefined ? noteMap[note] : 0;
    };
    
    // Convert scale to intervals
    const intervals = [];
    for (let i = 1; i < scale.length; i++) {
        const interval = (noteToIndex(scale[i]) - noteToIndex(scale[0]) + 12) % 12;
        intervals.push(interval);
    }
    
    // Augmented scale pattern: 3-4-7-8-11 (minor 3rd, major 3rd, perfect 5th, minor 6th, major 7th)
    const augmentedPattern = [3, 4, 7, 8, 11];
    return JSON.stringify(intervals.sort()) === JSON.stringify(augmentedPattern);
}

// Helper functions for characteristic chords
function getDiminishedScaleChords(scale) {
    if (!scale || scale.length !== 8) {
        return { chords: [] };
    }
    
    // Use the comprehensive diminished scale chord analysis
    const triads = window.ChordAnalyzer.calculateDiminishedScaleTriads(scale, 'diminished');
    const seventhChords = window.ChordAnalyzer.calculateDiminishedScaleSeventhChords(scale, 'diminished');
    
    // Organize chords by type for better display
    const result = {
        chords: []
    };
    
    // Group triads by quality
    const majorTriads = triads.filter(t => t.quality === 'major').map(t => t.name);
    const minorTriads = triads.filter(t => t.quality === 'minor').map(t => t.name);
    const diminishedTriads = triads.filter(t => t.quality === 'diminished').map(t => t.name);
    
    // Add triad sections
    if (majorTriads.length > 0) {
        result.chords.push({
            type: 'Major Triads',
            description: `${majorTriads.length} major triads from the diminished scale`,
            chords: majorTriads,
            emphasis: false
        });
    }
    
    if (minorTriads.length > 0) {
        result.chords.push({
            type: 'Minor Triads',
            description: `${minorTriads.length} minor triads from the diminished scale`,
            chords: minorTriads,
            emphasis: false
        });
    }
    
    if (diminishedTriads.length > 0) {
        result.chords.push({
            type: 'Diminished Triads',
            description: `${diminishedTriads.length} diminished triads from the diminished scale`,
            chords: diminishedTriads,
            emphasis: true
        });
    }
    
    // Group seventh chords by quality
    const dominantSevenths = seventhChords.filter(c => c.quality === 'dominant 7th').map(c => c.name);
    const minorSevenths = seventhChords.filter(c => c.quality === 'minor 7th').map(c => c.name);
    const diminishedSevenths = seventhChords.filter(c => c.quality === 'diminished 7th').map(c => c.name);
    const halfDiminishedSevenths = seventhChords.filter(c => c.quality === 'half-diminished 7th').map(c => c.name);
    const majorSevenths = seventhChords.filter(c => c.quality === 'major 7th').map(c => c.name);
    const minorMajorSevenths = seventhChords.filter(c => c.quality === 'minor major 7th').map(c => c.name);
    
    // Add seventh chord sections
    if (dominantSevenths.length > 0) {
        result.chords.push({
            type: 'Dominant 7th Chords',
            description: `${dominantSevenths.length} dominant 7th chords from the diminished scale`,
            chords: dominantSevenths,
            emphasis: true
        });
    }
    
    if (minorSevenths.length > 0) {
        result.chords.push({
            type: 'Minor 7th Chords',
            description: `${minorSevenths.length} minor 7th chords from the diminished scale`,
            chords: minorSevenths,
            emphasis: false
        });
    }
    
    if (diminishedSevenths.length > 0) {
        result.chords.push({
            type: 'Diminished 7th Chords',
            description: `${diminishedSevenths.length} diminished 7th chords from the diminished scale`,
            chords: diminishedSevenths,
            emphasis: true
        });
    }
    
    if (halfDiminishedSevenths.length > 0) {
        result.chords.push({
            type: 'Half-Diminished 7th Chords',
            description: `${halfDiminishedSevenths.length} half-diminished 7th chords from the diminished scale`,
            chords: halfDiminishedSevenths,
            emphasis: false
        });
    }
    
    if (majorSevenths.length > 0) {
        result.chords.push({
            type: 'Major 7th Chords',
            description: `${majorSevenths.length} major 7th chords from the diminished scale`,
            chords: majorSevenths,
            emphasis: false
        });
    }
    
    if (minorMajorSevenths.length > 0) {
        result.chords.push({
            type: 'Minor Major 7th Chords',
            description: `${minorMajorSevenths.length} minor major 7th chords from the diminished scale`,
            chords: minorMajorSevenths,
            emphasis: false
        });
    }
    
    return result;
}

function getPentatonicScaleChords(scale, scaleType) {
    if (!scale || scale.length !== 5) {
        return { chords: [] };
    }
    
    // Basic pentatonic chord structure
    return {
        chords: [
            { root: scale[0], chord: scale[0], notes: [scale[0], scale[2], scale[4]] },
            { root: scale[1], chord: scale[1] + 'm', notes: [scale[1], scale[3], scale[0]] }
        ]
    };
}

function getWholeToneScaleChords(scale) {
    if (!scale || scale.length !== 6) {
        return { chords: [] };
    }
    
    // Whole tone scales produce augmented chords
    return {
        chords: [
            { root: scale[0], chord: scale[0] + '+', notes: [scale[0], scale[2], scale[4]] },
            { root: scale[1], chord: scale[1] + '+', notes: [scale[1], scale[3], scale[5]] }
        ]
    };
}

function getBluesScaleChords(scale, scaleType) {
    if (!scale || scale.length !== 6) {
        return { chords: [] };
    }
    
    // Basic blues chord structure
    return {
        chords: [
            { root: scale[0], chord: scale[0] + '7', notes: [scale[0], scale[2], scale[4]] },
            { root: scale[3], chord: scale[3] + '7', notes: [scale[3], scale[5], scale[1]] }
        ]
    };
}

function getAugmentedScaleChords(scale) {
    if (!scale || scale.length !== 6) {
        return { chords: [] };
    }
    
    // Augmented scales produce augmented and major chords
    return {
        chords: [
            { root: scale[0], chord: scale[0] + '+', notes: [scale[0], scale[2], scale[4]] },
            { root: scale[1], chord: scale[1], notes: [scale[1], scale[3], scale[5]] }
        ]
    };
}

function getChromaticScaleChords(scale) {
    if (!scale || scale.length !== 12) {
        return { chords: [] };
    }
    
    // Chromatic scale can produce any chord
    return {
        chords: [
            { root: scale[0], chord: scale[0], notes: [scale[0], scale[4], scale[7]] }
        ]
    };
}

// Update the global exports to include all new functions
window.MusicTheory = {
    // ... existing exports ...
    areEnharmonicEquivalents,
    getEnharmonicEquivalent,
    getIntervalEnharmonicEquivalent,
    getEnharmonicTooltip,
    getChordIntervals,
    getCharacteristicChords,
    isWholeToneScale,
    isAugmentedScale,
    getDiminishedScaleChords,
    getPentatonicScaleChords,
    getWholeToneScaleChords,
    getBluesScaleChords,
    getAugmentedScaleChords,
    getChromaticScaleChords
}; 