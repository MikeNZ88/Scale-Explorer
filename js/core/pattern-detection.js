// Pattern detection functions for music theory
// Depends on: constants.js

function isHarmonicMinorPattern(notes, root) {
    if (!notes || notes.length < 7) return false;
    
    function noteToIndex(note) {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
            'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };
        return noteMap[note] !== undefined ? noteMap[note] : 0;
    };
    
    const rootIndex = noteToIndex(root);
    const expectedPattern = [0, 2, 3, 5, 7, 8, 11]; // Harmonic minor intervals
    
    const actualPattern = notes.slice(0, 7).map(note => (noteToIndex(note) - rootIndex + 12) % 12);
    
    return JSON.stringify(actualPattern.sort()) === JSON.stringify(expectedPattern.sort());
}

function isMelodicMinorPattern(notes, root) {
    if (!notes || notes.length < 7) return false;
    
    function noteToIndex(note) {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
            'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };
        return noteMap[note] !== undefined ? noteMap[note] : 0;
    };
    
    const rootIndex = noteToIndex(root);
    const expectedPattern = [0, 2, 3, 5, 7, 9, 11]; // Melodic minor intervals
    
    const actualPattern = notes.slice(0, 7).map(note => (noteToIndex(note) - rootIndex + 12) % 12);
    
    return JSON.stringify(actualPattern.sort()) === JSON.stringify(expectedPattern.sort());
}

function isMajorPattern(notes, root) {
    if (!notes || notes.length < 7) return false;
    
    function noteToIndex(note) {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
            'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };
        return noteMap[note] !== undefined ? noteMap[note] : 0;
    };
    
    const rootIndex = noteToIndex(root);
    const expectedPattern = [0, 2, 4, 5, 7, 9, 11]; // Major scale intervals
    
    const actualPattern = notes.slice(0, 7).map(note => (noteToIndex(note) - rootIndex + 12) % 12);
    
    return JSON.stringify(actualPattern.sort()) === JSON.stringify(expectedPattern.sort());
}

function isBluesPattern(notes, root) {
    if (!notes || notes.length < 6) return false;
    
    function noteToIndex(note) {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
            'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };
        return noteMap[note] !== undefined ? noteMap[note] : 0;
    };
    
    const rootIndex = noteToIndex(root);
    const expectedPattern = [0, 3, 5, 6, 7, 10]; // Blues scale intervals
    
    const actualPattern = notes.slice(0, 6).map(note => (noteToIndex(note) - rootIndex + 12) % 12);
    
    return JSON.stringify(actualPattern.sort()) === JSON.stringify(expectedPattern.sort());
}

function isBluesMajorPattern(intervalPattern) {
    const bluesMajorPattern = ['1', '2', '3', '4', '5', '6'];
    return JSON.stringify(intervalPattern.slice(0, 6).sort()) === JSON.stringify(bluesMajorPattern.sort());
}

function isBluesMinorPattern(intervalPattern) {
    const bluesMinorPattern = ['1', 'b3', '4', 'b5', '5', 'b7'];
    return JSON.stringify(intervalPattern.slice(0, 6).sort()) === JSON.stringify(bluesMinorPattern.sort());
}

function isWholeToneScale(scale) {
    if (!scale || scale.length !== 6) return false;
    
    const noteToIndex = (note) => {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
            'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };
        return noteMap[note] !== undefined ? noteMap[note] : 0;
    };
    
    const indices = scale.map(noteToIndex);
    const rootIndex = indices[0];
    
    // Check if all intervals are whole tones (2 semitones apart)
    for (let i = 1; i < indices.length; i++) {
        const interval = (indices[i] - rootIndex + 12) % 12;
        if (interval !== i * 2) {
            return false;
        }
    }
    
    return true;
}

function isAugmentedScale(scale) {
    if (!scale || scale.length !== 6) return false;
    
    const noteToIndex = (note) => {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
            'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };
        return noteMap[note] !== undefined ? noteMap[note] : 0;
    };
    
    const indices = scale.map(noteToIndex);
    const rootIndex = indices[0];
    
    // Augmented scale pattern: 1, b3, 3, 5, #5, 7 (0, 3, 4, 7, 8, 11)
    const expectedIntervals = [0, 3, 4, 7, 8, 11];
    const actualIntervals = indices.map(index => (index - rootIndex + 12) % 12).sort((a, b) => a - b);
    
    return JSON.stringify(actualIntervals) === JSON.stringify(expectedIntervals);
}

function isAugmentedScale2(scale) {
    if (!scale || scale.length !== 6) return false;
    
    const noteToIndex = (note) => {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
            'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };
        return noteMap[note] !== undefined ? noteMap[note] : 0;
    };
    
    const indices = scale.map(noteToIndex);
    const rootIndex = indices[0];
    
    // Alternative augmented scale pattern: 1, #2, 3, 5, #5, 7 (0, 3, 4, 7, 8, 11)
    // This is the same as the first augmented scale, but checking for different enharmonic spellings
    const expectedIntervals = [0, 3, 4, 7, 8, 11];
    const actualIntervals = indices.map(index => (index - rootIndex + 12) % 12).sort((a, b) => a - b);
    
    return JSON.stringify(actualIntervals) === JSON.stringify(expectedIntervals);
}

function shouldDisplayChords(scaleType, scaleLength, category = null) {
    // Always show chords for standard 7-note scales
    if (scaleLength === 7) return true;
    
    // Show chords for pentatonic scales
    if (scaleLength === 5 && (scaleType.includes('pentatonic') || category === 'pentatonic')) {
        return true;
    }
    
    // Show chords for blues scales
    if (scaleLength === 6 && (scaleType.includes('blues') || category === 'blues')) {
        return true;
    }
    
    // Show chords for whole tone scales
    if (scaleLength === 6 && (scaleType.includes('whole tone') || category === 'symmetrical')) {
        return true;
    }
    
    // Show chords for augmented scales
    if (scaleLength === 6 && (scaleType.includes('augmented') || category === 'symmetrical')) {
        return true;
    }
    
    // Show chords for diminished scales
    if (scaleLength === 8 && (scaleType.includes('diminished') || category === 'symmetrical')) {
        return true;
    }
    
    // Show chords for chromatic scale (limited set)
    if (scaleLength === 12 && scaleType === 'chromatic') {
        return true;
    }
    
    // Don't show chords for other exotic scales by default
    return false;
}

// Export all functions to global scope
window.PatternDetection = {
    isHarmonicMinorPattern,
    isMelodicMinorPattern,
    isMajorPattern,
    isBluesPattern,
    isBluesMajorPattern,
    isBluesMinorPattern,
    isWholeToneScale,
    isAugmentedScale,
    isAugmentedScale2,
    shouldDisplayChords
}; 