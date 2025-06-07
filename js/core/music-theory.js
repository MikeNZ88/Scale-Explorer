// Music Theory Core Functions
// Depends on: constants.js

// Color utility functions
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function calculateScaleColor(scaleIntervals) {
    if (!scaleIntervals || scaleIntervals.length === 0) {
        return '#8B5CF6'; // Default purple
    }

    // Extract numeric values from intervals
    const numericIntervals = scaleIntervals.map(interval => {
        if (typeof interval === 'string') {
            // Remove any sharps/flats and convert to number
            const match = interval.match(/(\d+)/);
            return match ? parseInt(match[1]) : 1;
        }
        return interval;
    });

    // Calculate weighted average based on scale degree importance
    let totalWeight = 0;
    let weightedSum = 0;

    numericIntervals.forEach(degree => {
        const weight = MusicConstants.scaleDegreeWeights[degree] || 1;
        totalWeight += weight;
        weightedSum += degree * weight;
    });

    const avgDegree = totalWeight > 0 ? weightedSum / totalWeight : 3.5;
    
    // Map to color spectrum (1-7 scale degrees to hue values)
    const hue = Math.round((avgDegree - 1) * 300 / 6); // 0-300 degrees
    const saturation = Math.min(80, 50 + (numericIntervals.length - 5) * 5); // More notes = more saturated
    const lightness = Math.max(45, 65 - (numericIntervals.length - 5) * 3); // More notes = darker
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Enhanced color processing for better visibility
function enhanceScaleColor(baseColor, scaleIntervals) {
    const rgb = hexToRgb(baseColor) || { r: 139, g: 92, b: 246 };
    
    const enhanceColor = (r, g, b) => {
        // Increase saturation
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturationBoost = 1.3;
        
        let newR = r + (max - r) * (saturationBoost - 1);
        let newG = g + (max - g) * (saturationBoost - 1);
        let newB = b + (max - b) * (saturationBoost - 1);
        
        // Ensure good contrast
        const luminance = 0.299 * newR + 0.587 * newG + 0.114 * newB;
        const contrastAdjustment = luminance < 128 ? 1.2 : 0.8;
        
        newR = Math.min(255, Math.max(0, newR * contrastAdjustment));
        newG = Math.min(255, Math.max(0, newG * contrastAdjustment));
        newB = Math.min(255, Math.max(0, newB * contrastAdjustment));
        
        return rgbToHex(Math.round(newR), Math.round(newG), Math.round(newB));
    };
    
    return enhanceColor(rgb.r, rgb.g, rgb.b);
}

function getIntervalColor(interval) {
    return MusicConstants.intervalColors[interval] || '#8B5CF6';
}

function lightenColor(hex, percent = 50) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    
    const lighten = (color) => Math.min(255, Math.round(color + (255 - color) * (percent / 100)));
    
    return rgbToHex(
        lighten(rgb.r),
        lighten(rgb.g),
        lighten(rgb.b)
    );
}

// Note spelling functions
function getProperNoteSpelling(noteIndex, key, scaleType = 'major') {
    return getChromatic(noteIndex, key, scaleType);
}

// Scale calculation functions
function calculateScale(root, formula, scaleType = 'major') {
    if (!formula || !Array.isArray(formula)) {
        console.warn('Invalid formula provided to calculateScale:', formula);
        return [];
    }
    
    // Use the new scale degree-based calculation
    return calculateScaleWithDegrees(root, formula, scaleType);
}

function calculateScaleWithDegrees(root, formula, scaleType = 'major') {
    // Define the note names in order for proper scale degree calculation
    const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const noteToIndex = {
        'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11,
        'C#': 1, 'Db': 1, 'D#': 3, 'Eb': 3, 'F#': 6, 'Gb': 6,
        'G#': 8, 'Ab': 8, 'A#': 10, 'Bb': 10,
        'B#': 0, 'Cb': 11, 'E#': 5, 'Fb': 4
    };
    
    // Find the root note's position in the note names array
    const rootNoteName = root.charAt(0);
    const rootNoteIndex = noteNames.indexOf(rootNoteName);
    if (rootNoteIndex === -1) {
        console.warn('Invalid root note:', root);
        return [];
    }
    
    // Get the chromatic index of the root
    const rootChromaticIndex = noteToIndex[root];
    if (rootChromaticIndex === undefined) {
        console.warn('Invalid root note:', root);
        return [];
    }
    
    // Handle special scale types with predefined degree mappings
    if (scaleType === 'pentatonic-major' || scaleType === 'pentatonic') {
        return calculatePentatonicScale(root, formula, rootNoteIndex, rootChromaticIndex, noteNames, noteToIndex, scaleType);
    }
    
    if (scaleType === 'blues') {
        return calculateBluesScale(root, formula, rootNoteIndex, rootChromaticIndex, noteNames, noteToIndex);
    }
    
    // Calculate scale notes based on scale degrees for regular scales
    const scale = [root]; // Start with the root
    let currentChromaticIndex = rootChromaticIndex;
    
    for (let i = 0; i < formula.length - 1; i++) {
        // Move to the next chromatic position
        currentChromaticIndex = (currentChromaticIndex + formula[i]) % 12;
        
        // Calculate which scale degree this should be (2nd, 3rd, 4th, etc.)
        const scaleDegreeIndex = (rootNoteIndex + i + 1) % 7;
        const baseNoteName = noteNames[scaleDegreeIndex];
        const baseNoteChromatic = noteToIndex[baseNoteName];
        
        // Calculate the difference between where we are and where the base note is
        const chromaticDifference = (currentChromaticIndex - baseNoteChromatic + 12) % 12;
        
        let noteName;
        if (chromaticDifference === 0) {
            // Perfect match - use the natural note
            noteName = baseNoteName;
        } else if (chromaticDifference === 1) {
            // One semitone up - use sharp
            noteName = baseNoteName + '#';
        } else if (chromaticDifference === 11) {
            // One semitone down - use flat
            noteName = baseNoteName + 'b';
        } else if (chromaticDifference === 2) {
            // Two semitones up - use double sharp (very rare)
            noteName = baseNoteName + '##';
        } else if (chromaticDifference === 10) {
            // Two semitones down - use double flat (very rare)
            noteName = baseNoteName + 'bb';
        } else {
            // This shouldn't happen in normal scales, fallback to chromatic
            noteName = getChromatic(currentChromaticIndex, root, scaleType);
        }
        
        scale.push(noteName);
    }
    
    return scale;
}

function calculatePentatonicScale(root, formula, rootNoteIndex, rootChromaticIndex, noteNames, noteToIndex, scaleType) {
    // Different pentatonic scales use different scale degree mappings
    let pentatonicDegreeMap;
    
    if (scaleType === 'pentatonic-major') {
        // Major pentatonic: 1, 2, 3, 5, 6 (maps to C, D, E, G, A scale degrees)
        pentatonicDegreeMap = [0, 1, 2, 4, 5];
    } else if (scaleType === 'pentatonic') {
        // Japanese pentatonic scales - handle based on formula
        // hirojoshi-pentatonic: [2, 1, 4, 1, 4] - E, F#, G, B, C
        // iwato-scale: [1, 4, 1, 4, 2] - E♭, F, B♭, B, D
        
        // For Japanese scales, we need to calculate the intervals and map them to appropriate degrees
        const intervals = [0];
        let tempIndex = rootChromaticIndex;
        for (let i = 0; i < formula.length - 1; i++) {
            tempIndex = (tempIndex + formula[i]) % 12;
            intervals.push((tempIndex - rootChromaticIndex + 12) % 12);
        }
        
        // Map intervals to scale degrees based on closest diatonic note
        pentatonicDegreeMap = [0]; // Root is always 0
        for (let i = 1; i < intervals.length; i++) {
            const interval = intervals[i];
            // Map chromatic intervals to closest scale degrees
            if (interval <= 2) pentatonicDegreeMap.push(1); // 2nd degree
            else if (interval <= 4) pentatonicDegreeMap.push(2); // 3rd degree  
            else if (interval <= 6) pentatonicDegreeMap.push(3); // 4th degree
            else if (interval <= 8) pentatonicDegreeMap.push(4); // 5th degree
            else if (interval <= 10) pentatonicDegreeMap.push(5); // 6th degree
            else pentatonicDegreeMap.push(6); // 7th degree
        }
    } else {
        // Default to major pentatonic pattern
        pentatonicDegreeMap = [0, 1, 2, 4, 5];
    }
    
    const scale = [root];
    let currentChromaticIndex = rootChromaticIndex;
    
    for (let i = 0; i < formula.length - 1; i++) {
        currentChromaticIndex = (currentChromaticIndex + formula[i]) % 12;
        
        // Get the corresponding diatonic scale degree
        const scaleDegreeIndex = (rootNoteIndex + pentatonicDegreeMap[i + 1]) % 7;
        const baseNoteName = noteNames[scaleDegreeIndex];
        const baseNoteChromatic = noteToIndex[baseNoteName];
        
        const chromaticDifference = (currentChromaticIndex - baseNoteChromatic + 12) % 12;
        
        let noteName;
        if (chromaticDifference === 0) {
            noteName = baseNoteName;
        } else if (chromaticDifference === 1) {
            noteName = baseNoteName + '#';
        } else if (chromaticDifference === 11) {
            noteName = baseNoteName + 'b';
        } else {
            noteName = getChromatic(currentChromaticIndex, root, scaleType);
        }
        
        scale.push(noteName);
    }
    
    return scale;
}

function calculateBluesScale(root, formula, rootNoteIndex, rootChromaticIndex, noteNames, noteToIndex) {
    // Blues scales have specific note relationships
    // Major blues: 1, 2, b3, 3, 5, 6
    // Minor blues: 1, b3, 4, b5, 5, b7
    
    const scale = [root];
    let currentChromaticIndex = rootChromaticIndex;
    
    // Pre-defined degree mappings for blues scales
    let degreeMap;
    if (formula.length === 6) {
        // Determine if it's major or minor blues based on the formula
        const intervalsFromRoot = [0];
        let tempIndex = rootChromaticIndex;
        for (let i = 0; i < formula.length - 1; i++) {
            tempIndex = (tempIndex + formula[i]) % 12;
            intervalsFromRoot.push((tempIndex - rootChromaticIndex + 12) % 12);
        }
        
        // Check for major blues pattern: [0, 2, 3, 4, 7, 9]
        const majorBluesIntervals = [0, 2, 3, 4, 7, 9];
        const isBluesMajor = JSON.stringify(intervalsFromRoot.sort((a,b) => a-b)) === JSON.stringify(majorBluesIntervals);
        
        if (isBluesMajor) {
            // Major blues: 1, 2, b3, 3, 5, 6
            degreeMap = [0, 1, 2, 2, 4, 5]; // Note: both b3 and 3 use the 3rd degree base
        } else {
            // Minor blues: 1, b3, 4, b5, 5, b7
            degreeMap = [0, 2, 3, 3, 4, 6]; // Note: both b5 and 5 use different bases
        }
    }
    
    for (let i = 0; i < formula.length - 1; i++) {
        currentChromaticIndex = (currentChromaticIndex + formula[i]) % 12;
        
        if (degreeMap) {
            const scaleDegreeIndex = (rootNoteIndex + degreeMap[i + 1]) % 7;
            const baseNoteName = noteNames[scaleDegreeIndex];
            const baseNoteChromatic = noteToIndex[baseNoteName];
            
            const chromaticDifference = (currentChromaticIndex - baseNoteChromatic + 12) % 12;
            
            let noteName;
            if (chromaticDifference === 0) {
                noteName = baseNoteName;
            } else if (chromaticDifference === 1) {
                noteName = baseNoteName + '#';
            } else if (chromaticDifference === 11) {
                noteName = baseNoteName + 'b';
            } else {
                noteName = getChromatic(currentChromaticIndex, root, 'blues');
            }
            
            scale.push(noteName);
        } else {
            // Fallback to chromatic
            scale.push(getChromatic(currentChromaticIndex, root, 'blues'));
        }
    }
    
    return scale;
}

// Helper function for chromatic fallback (improved version of getProperNoteSpelling)
function getChromatic(chromaticIndex, key, scaleType = 'major') {
    const normalizedIndex = ((chromaticIndex % 12) + 12) % 12;
    
    // Determine if this key uses sharps or flats
    const sharpKeys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
    const flatKeys = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'];
    
    const usesSharps = sharpKeys.includes(key);
    const usesFlats = flatKeys.includes(key);
    
    // Chromatic scale with proper enharmonics based on key signature
    let chromaticScale;
    if (usesSharps) {
        chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    } else if (usesFlats) {
        chromaticScale = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    } else {
        // Default for C and enharmonic roots
        chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    }
    
    return chromaticScale[normalizedIndex];
}

function getModeNotes(parentScale, modeIndex, parentFormula, scaleType = 'major') {
    if (!parentScale || !Array.isArray(parentScale) || modeIndex >= parentScale.length) {
        return [];
    }
    
    const modeRoot = parentScale[modeIndex];
    const modeFormula = [...parentFormula.slice(modeIndex), ...parentFormula.slice(0, modeIndex)];
    
    return calculateScale(modeRoot, modeFormula, scaleType);
}

function getIntervals(notes, root) {
    if (!notes || !Array.isArray(notes) || notes.length === 0) {
        return [];
    }
    
    function noteToIndex(note) {
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
    }
    
    const rootIndex = noteToIndex(root);
    const intervals = [];
    
    // Special handling for different scale types
    if (notes.length === 6) {
        // Check for blues scale patterns first
        if (isBluesPattern(notes, root)) {
            const intervalPattern = [];
            for (let i = 0; i < notes.length; i++) {
                const noteIndex = noteToIndex(notes[i]);
                const interval = (noteIndex - rootIndex + 12) % 12;
                intervalPattern.push(interval);
            }
            
            // Determine if it's blues major or blues minor based on the pattern
            if (isBluesMajorPattern(intervalPattern)) {
                return ['1', '2', 'b3', '3', '5', '6'];
            } else if (isBluesMinorPattern(intervalPattern)) {
                return ['1', 'b3', '4', 'b5', '5', 'b7'];
            }
        }
        
        // Whole tone scales - return characteristic intervals
        return ['1', '2', '3', '#4', '#5', '#6'];
    }
    
    if (notes.length === 8) {
        // Diminished scales - return proper intervals to prevent duplicates
        return ['1', '2', 'b3', '4', 'b5', 'b6', '6', '7'];
    }
    
    if (notes.length === 7) {
        // Check for harmonic minor pattern
        const intervalPattern = [];
        for (let i = 0; i < notes.length; i++) {
            const noteIndex = noteToIndex(notes[i]);
            const interval = (noteIndex - rootIndex + 12) % 12;
            intervalPattern.push(interval);
        }
        
        if (isHarmonicMinorPattern(notes, root)) {
            return ['1', '2', 'b3', '4', '5', 'b6', '7'];
        }
        
        if (isMelodicMinorPattern(notes, root)) {
            return ['1', '2', 'b3', '4', '5', '6', '7'];
        }
        
        if (isMajorPattern(notes, root)) {
            return ['1', '2', '3', '4', '5', '6', '7'];
        }
    }
    
    // Default interval calculation
    const intervalNames = ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7'];
    
    for (let i = 0; i < notes.length; i++) {
        const noteIndex = noteToIndex(notes[i]);
        const interval = (noteIndex - rootIndex + 12) % 12;
        intervals.push(intervalNames[interval]);
    }
    
    return intervals;
}

function isHarmonicMinorPattern(notes, root) {
    if (notes.length !== 7) return false;
    
    function noteToIndex(note) {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
            'B#': 0, 'Cb': 11, 'E#': 5, 'Fb': 4
        };
        return noteMap[note] !== undefined ? noteMap[note] : 0;
    }
    
    const rootIndex = noteToIndex(root);
    const intervals = notes.map(note => (noteToIndex(note) - rootIndex + 12) % 12).sort((a, b) => a - b);
    const harmonicMinorIntervals = [0, 2, 3, 5, 7, 8, 11];
    
    return JSON.stringify(intervals) === JSON.stringify(harmonicMinorIntervals);
}

function isMelodicMinorPattern(notes, root) {
    if (notes.length !== 7) return false;
    
    function noteToIndex(note) {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
            'B#': 0, 'Cb': 11, 'E#': 5, 'Fb': 4
        };
        return noteMap[note] !== undefined ? noteMap[note] : 0;
    }
    
    const rootIndex = noteToIndex(root);
    const intervals = notes.map(note => (noteToIndex(note) - rootIndex + 12) % 12).sort((a, b) => a - b);
    const melodicMinorIntervals = [0, 2, 3, 5, 7, 9, 11];
    
    return JSON.stringify(intervals) === JSON.stringify(melodicMinorIntervals);
}

function isMajorPattern(notes, root) {
    if (notes.length !== 7) return false;
    
    function noteToIndex(note) {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
            'B#': 0, 'Cb': 11, 'E#': 5, 'Fb': 4
        };
        return noteMap[note] !== undefined ? noteMap[note] : 0;
    }
    
    const rootIndex = noteToIndex(root);
    const intervals = notes.map(note => (noteToIndex(note) - rootIndex + 12) % 12).sort((a, b) => a - b);
    const majorIntervals = [0, 2, 4, 5, 7, 9, 11];
    
    return JSON.stringify(intervals) === JSON.stringify(majorIntervals);
}

function isBluesPattern(notes, root) {
    if (notes.length !== 6) return false;
    
    function noteToIndex(note) {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
            'B#': 0, 'Cb': 11, 'E#': 5, 'Fb': 4
        };
        return noteMap[note] !== undefined ? noteMap[note] : 0;
    }
    
    const rootIndex = noteToIndex(root);
    const intervals = notes.map(note => (noteToIndex(note) - rootIndex + 12) % 12).sort((a, b) => a - b);
    
    // Blues Major: [0, 2, 3, 4, 7, 9] = [2,1,1,3,2,3] = C-D-Eb-E-G-A
    const bluesMajorIntervals = [0, 2, 3, 4, 7, 9];
    
    // Blues Minor: [0, 3, 5, 6, 7, 10] = [3,2,1,1,3,2] = C-Eb-F-Gb-G-Bb
    const bluesMinorIntervals = [0, 3, 5, 6, 7, 10];
    
    return JSON.stringify(intervals) === JSON.stringify(bluesMajorIntervals) || 
           JSON.stringify(intervals) === JSON.stringify(bluesMinorIntervals);
}

function isBluesMajorPattern(intervalPattern) {
    const bluesMajorIntervals = [0, 2, 3, 4, 7, 9];
    return JSON.stringify(intervalPattern.sort((a, b) => a - b)) === JSON.stringify(bluesMajorIntervals);
}

function isBluesMinorPattern(intervalPattern) {
    const bluesMinorIntervals = [0, 3, 5, 6, 7, 10];
    return JSON.stringify(intervalPattern.sort((a, b) => a - b)) === JSON.stringify(bluesMinorIntervals);
}

// Check if two notes are enharmonic equivalents
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

// Chord calculation functions
function shouldDisplayChords(scaleType, scaleLength) {
    // Scales that don't traditionally use diatonic chord analysis
    const noChordScales = [
        'chromatic',
        'whole-tone',
        'augmented'
    ];
    
    // Check if it's a scale type that doesn't use traditional chord analysis
    if (noChordScales.includes(scaleType)) {
        return false;
    }
    
    // Pentatonic scales can show chords but with limited functionality
    if (scaleLength === 5) {
        return true;
    }
    
    // Blues scales can show chords
    if (scaleLength === 6 && scaleType === 'blues') {
        return true;
    }
    
    // 8-note scales (diminished) can show chords but they're complex
    if (scaleLength === 8) {
        return true;
    }
    
    // Traditional 7-note scales should show chords
    if (scaleLength === 7) {
        return true;
    }
    
    // Very long scales (chromatic) or very short scales don't work well with chord analysis
    if (scaleLength < 5 || scaleLength > 8) {
        return false;
    }
    
    return true;
}

function calculateTriads(scale, scaleType = 'major') {
    if (!scale || scale.length < 3) {
        return [];
    }
    
    // Check if this scale type should display chords
    if (!shouldDisplayChords(scaleType, scale.length)) {
        return [];
    }

    const triads = [];
    
    for (let i = 0; i < scale.length; i++) {
        const root = scale[i];
        
        // Properly calculate scale degrees for third and fifth
        // In music theory, third = skip 1 note, fifth = skip 3 notes
        const thirdIndex = (i + 2) % scale.length;
        const fifthIndex = (i + 4) % scale.length;
        
        const third = scale[thirdIndex];
        const fifth = scale[fifthIndex];
        
        // Calculate intervals from the chord root
        let thirdInterval = getIntervalBetweenNotes(root, third);
        let fifthInterval = getIntervalBetweenNotes(root, fifth);
        
        // Fix octave wrapping issues - ensure intervals are in correct range
        // For triads: third should be 1-6 semitones, fifth should be 4-11 semitones
        while (thirdInterval > 6) {
            thirdInterval -= 12;
        }
        while (thirdInterval < 0) {
            thirdInterval += 12;
        }
        
        while (fifthInterval > 11) {
            fifthInterval -= 12;
        }
        while (fifthInterval < 4) {
            fifthInterval += 12;
        }
        
        // Enhanced chord detection with comprehensive naming
        const chordAnalysis = analyzeTriadComprehensive(thirdInterval, fifthInterval, scale, i, scaleType);
        
        triads.push({
            degree: i + 1,
            roman: getRomanNumeral(i + 1, chordAnalysis.quality),
            root: root,
            notes: [root, third, fifth],
            quality: chordAnalysis.quality,
            symbol: chordAnalysis.symbol,
            name: `${root}${chordAnalysis.symbol}`,
            intervals: [thirdInterval, fifthInterval],
            function: getChordFunction(i + 1, scaleType),
            isNonStandard: chordAnalysis.isNonStandard,
            description: chordAnalysis.description,
            inversion: chordAnalysis.inversion
        });
    }
    
    return triads;
}

function analyzeTriadComprehensive(thirdInterval, fifthInterval, scale, rootIndex, scaleType) {
    // Check for standard triads first
    if (thirdInterval === 4 && fifthInterval === 7) {
        return { quality: 'Major', symbol: '', isNonStandard: false, description: 'Major triad' };
    }
    if (thirdInterval === 3 && fifthInterval === 7) {
        return { quality: 'minor', symbol: 'm', isNonStandard: false, description: 'Minor triad' };
    }
    if (thirdInterval === 3 && fifthInterval === 6) {
        return { quality: 'diminished', symbol: '°', isNonStandard: false, description: 'Diminished triad' };
    }
    if (thirdInterval === 4 && fifthInterval === 8) {
        return { quality: 'Augmented', symbol: '+', isNonStandard: false, description: 'Augmented triad' };
    }
    
    // Suspended chords
    if (thirdInterval === 2 && fifthInterval === 7) {
        return { quality: 'sus2', symbol: 'sus2', isNonStandard: false, description: 'Suspended 2nd' };
    }
    if (thirdInterval === 5 && fifthInterval === 7) {
        return { quality: 'sus4', symbol: 'sus4', isNonStandard: false, description: 'Suspended 4th' };
    }
    
    // Missing intervals (no3, no5)
    if (thirdInterval === 0 && fifthInterval === 7) {
        return { quality: 'no3', symbol: '(no3)', isNonStandard: true, description: 'Power chord - no third' };
    }
    if (thirdInterval === 4 && fifthInterval === 0) {
        return { quality: 'no5', symbol: '(no5)', isNonStandard: true, description: 'Major no fifth' };
    }
    if (thirdInterval === 3 && fifthInterval === 0) {
        return { quality: 'minor no5', symbol: 'm(no5)', isNonStandard: true, description: 'Minor no fifth' };
    }
    
    // Altered fifths
    if (thirdInterval === 4 && fifthInterval === 6) {
        return { quality: 'Major♭5', symbol: '♭5', isNonStandard: true, description: 'Major flat fifth' };
    }
    if (thirdInterval === 3 && fifthInterval === 8) {
        return { quality: 'minor+5', symbol: 'm+5', isNonStandard: true, description: 'Minor sharp fifth' };
    }
    
    // Sus2♭5 chord (Major 2nd + Tritone)
    if (thirdInterval === 2 && fifthInterval === 6) {
        return { quality: 'sus2♭5', symbol: 'sus2♭5', isNonStandard: false, description: 'Suspended second flat fifth' };
    }
    
    // Quartal harmony (common in pentatonic scales)
    if (thirdInterval === 5 && fifthInterval === 10) {
        return { quality: 'quartal', symbol: '4th', isNonStandard: true, description: 'Quartal harmony' };
    }
    if (thirdInterval === 2 && fifthInterval === 9) {
        return { quality: 'add9/6', symbol: 'add9/6', isNonStandard: true, description: 'Add 9 and 6' };
    }
    
    // Quintal harmony
    if (thirdInterval === 7 && fifthInterval === 2) {
        return { quality: 'quintal', symbol: '5th', isNonStandard: true, description: 'Quintal harmony' };
    }
    
    // Wide interval chords (common in diminished contexts)
    if (thirdInterval === 6 && fifthInterval === 9) {
        return { quality: 'tritone+6', symbol: '♭5/6', isNonStandard: true, description: 'Tritone with sixth' };
    }
    if (thirdInterval === 6 && fifthInterval === 11) {
        return { quality: 'tritone+7', symbol: '♭5/7', isNonStandard: true, description: 'Tritone with seventh' };
    }
    
    // Polychords (stacked intervals)
    if (thirdInterval === 1 && fifthInterval === 6) {
        return { quality: 'cluster♭5', symbol: 'b2/♭5', isNonStandard: true, description: 'Minor second cluster' };
    }
    if (thirdInterval === 8 && fifthInterval === 11) {
        return { quality: 'wide cluster', symbol: 'm6/7', isNonStandard: true, description: 'Wide interval cluster' };
    }
    
    // Check for possible inversions by analyzing interval relationships
    const inversionAnalysis = detectTriadInversion(thirdInterval, fifthInterval);
    if (inversionAnalysis.isInversion) {
        return {
            quality: inversionAnalysis.quality,
            symbol: inversionAnalysis.symbol,
            isNonStandard: false,
            description: inversionAnalysis.description,
            inversion: inversionAnalysis.inversion
        };
    }
    
    // Special handling for pentatonic scales
    if (scale.length === 5) {
        return analyzePentatonicChord(thirdInterval, fifthInterval, scaleType);
    }
    
    // Special handling for diminished scales
    if (scale.length === 8) {
        return analyzeDiminishedChord(thirdInterval, fifthInterval);
    }
    
    // Fallback to descriptive naming for truly exotic intervals
    const thirdName = getIntervalName(thirdInterval);
    const fifthName = getIntervalName(fifthInterval);
    return {
        quality: `${thirdName}/${fifthName}`,
        symbol: `(${thirdName.replace(' ', '')}/${fifthName.replace(' ', '')})`,
        isNonStandard: true,
        description: `Exotic chord: ${thirdName} and ${fifthName}`
    };
}

function detectTriadInversion(thirdInterval, fifthInterval) {
    // First inversion patterns (bass note is the third of the chord)
    // C/E would have intervals: E to G (3 semitones), E to C (9 semitones = -3 when normalized)
    if (thirdInterval === 3 && (fifthInterval === 8 || fifthInterval === 9)) {
        return {
            isInversion: true,
            quality: 'Major/3rd',
            symbol: '/3',
            description: 'Major chord, first inversion',
            inversion: 'first'
        };
    }
    if (thirdInterval === 4 && (fifthInterval === 8 || fifthInterval === 9)) {
        return {
            isInversion: true,
            quality: 'minor/3rd',
            symbol: 'm/3',
            description: 'Minor chord, first inversion',
            inversion: 'first'
        };
    }
    
    // Second inversion patterns (bass note is the fifth of the chord)
    // C/G would have intervals: G to C (5 semitones), G to E (9 semitones)
    if (thirdInterval === 5 && (fifthInterval === 8 || fifthInterval === 9)) {
        return {
            isInversion: true,
            quality: 'Major/5th',
            symbol: '/5',
            description: 'Major chord, second inversion',
            inversion: 'second'
        };
    }
    if (thirdInterval === 5 && (fifthInterval === 9 || fifthInterval === 10)) {
        return {
            isInversion: true,
            quality: 'minor/5th',
            symbol: 'm/5',
            description: 'Minor chord, second inversion',
            inversion: 'second'
        };
    }
    
    return { isInversion: false };
}

function analyzePentatonicChord(thirdInterval, fifthInterval, scaleType) {
    // Pentatonic scales often create open, quartal, and added-tone harmonies
    
    if (thirdInterval === 2 && fifthInterval === 7) {
        return { quality: 'sus2', symbol: 'sus2', isNonStandard: false, description: 'Suspended second (pentatonic)' };
    }
    if (thirdInterval === 5 && fifthInterval === 7) {
        return { quality: 'sus4', symbol: 'sus4', isNonStandard: false, description: 'Suspended fourth (pentatonic)' };
    }
    if (thirdInterval === 2 && fifthInterval === 9) {
        return { quality: 'add9/6', symbol: 'add9/6', isNonStandard: true, description: 'Add 9 and 6 (pentatonic)' };
    }
    if (thirdInterval === 5 && fifthInterval === 10) {
        return { quality: 'quartal 4/7', symbol: '4/7', isNonStandard: true, description: 'Quartal fourths and sevenths' };
    }
    if (thirdInterval === 7 && fifthInterval === 10) {
        return { quality: 'open 5/7', symbol: '5/7', isNonStandard: true, description: 'Open fifth and seventh' };
    }
    if (thirdInterval === 0 && fifthInterval === 7) {
        return { quality: 'power chord', symbol: '5', isNonStandard: true, description: 'Power chord (pentatonic)' };
    }
    
    // Default pentatonic naming
    const thirdName = getIntervalName(thirdInterval);
    const fifthName = getIntervalName(fifthInterval);
    return {
        quality: `pentatonic ${thirdName}/${fifthName}`,
        symbol: `pent(${thirdInterval}/${fifthInterval})`,
        isNonStandard: true,
        description: `Pentatonic harmony: ${thirdName} and ${fifthName}`
    };
}

function analyzeDiminishedChord(thirdInterval, fifthInterval) {
    // Diminished scales create many diminished, half-diminished, and chromatic clusters
    
    if (thirdInterval === 3 && fifthInterval === 6) {
        return { quality: 'diminished', symbol: '°', isNonStandard: false, description: 'Diminished triad (from dim. scale)' };
    }
    if (thirdInterval === 1 && fifthInterval === 4) {
        return { quality: 'chromatic cluster', symbol: 'b2/3', isNonStandard: true, description: 'Chromatic cluster b2/3' };
    }
    if (thirdInterval === 2 && fifthInterval === 5) {
        return { quality: 'chromatic cluster', symbol: '2/4', isNonStandard: true, description: 'Chromatic cluster 2/4' };
    }
    if (thirdInterval === 6 && fifthInterval === 9) {
        return { quality: 'tritone cluster', symbol: '♭5/6', isNonStandard: true, description: 'Tritone with sixth' };
    }
    if (thirdInterval === 1 && fifthInterval === 6) {
        return { quality: 'diminished cluster', symbol: 'b2/♭5', isNonStandard: true, description: 'Diminished cluster' };
    }
    if (thirdInterval === 4 && fifthInterval === 6) {
        return { quality: 'Major♭5', symbol: '♭5', isNonStandard: true, description: 'Major flat fifth (diminished)' };
    }
    if (thirdInterval === 3 && fifthInterval === 8) {
        return { quality: 'minor+5', symbol: 'm+5', isNonStandard: true, description: 'Minor augmented fifth (diminished)' };
    }
    
    // Default diminished naming
    const thirdName = getIntervalName(thirdInterval);
    const fifthName = getIntervalName(fifthInterval);
    return {
        quality: `diminished ${thirdName}/${fifthName}`,
        symbol: `dim(${thirdInterval}/${fifthInterval})`,
        isNonStandard: true,
        description: `Diminished harmony: ${thirdName} and ${fifthName}`
    };
}

function calculateSeventhChords(scale, scaleType = 'major') {
    if (!scale || scale.length < 4) {
        return [];
    }
    
    // Check if this scale type should display chords
    if (!shouldDisplayChords(scaleType, scale.length)) {
        return [];
    }

    const seventhChords = [];
    
    for (let i = 0; i < scale.length; i++) {
        const root = scale[i];
        
        // Properly calculate scale degrees for third, fifth, and seventh
        const thirdIndex = (i + 2) % scale.length;
        const fifthIndex = (i + 4) % scale.length;
        const seventhIndex = (i + 6) % scale.length;
        
        const third = scale[thirdIndex];
        const fifth = scale[fifthIndex];
        const seventh = scale[seventhIndex];
        
        // Calculate intervals from the chord root
        let thirdInterval = getIntervalBetweenNotes(root, third);
        let fifthInterval = getIntervalBetweenNotes(root, fifth);
        let seventhInterval = getIntervalBetweenNotes(root, seventh);
        
        // Fix octave wrapping issues - ensure intervals are in correct range
        // For seventh chords: third (1-6), fifth (4-11), seventh (9-11)
        while (thirdInterval > 6) {
            thirdInterval -= 12;
        }
        while (thirdInterval < 0) {
            thirdInterval += 12;
        }
        
        while (fifthInterval > 11) {
            fifthInterval -= 12;
        }
        while (fifthInterval < 4) {
            fifthInterval += 12;
        }
        
        while (seventhInterval > 11) {
            seventhInterval -= 12;
        }
        while (seventhInterval < 9) {
            seventhInterval += 12;
        }
        
        // Enhanced chord detection with comprehensive naming
        const chordAnalysis = analyzeSeventhChordComprehensive(thirdInterval, fifthInterval, seventhInterval, scale, i, scaleType);
        
        seventhChords.push({
            degree: i + 1,
            roman: getRomanNumeral(i + 1, chordAnalysis.quality),
            root: root,
            notes: [root, third, fifth, seventh],
            quality: chordAnalysis.quality,
            symbol: chordAnalysis.symbol,
            name: `${root}${chordAnalysis.symbol}`,
            intervals: [thirdInterval, fifthInterval, seventhInterval],
            function: getChordFunction(i + 1, scaleType),
            isNonStandard: chordAnalysis.isNonStandard,
            description: chordAnalysis.description,
            inversion: chordAnalysis.inversion
        });
    }
    
    return seventhChords;
}

function analyzeSeventhChordComprehensive(thirdInterval, fifthInterval, seventhInterval, scale, rootIndex, scaleType) {
    // Standard seventh chords
    if (thirdInterval === 4 && fifthInterval === 7 && seventhInterval === 11) {
        return { quality: 'Major 7th', symbol: 'maj7', isNonStandard: false, description: 'Major seventh chord' };
    }
    if (thirdInterval === 3 && fifthInterval === 7 && seventhInterval === 10) {
        return { quality: 'minor 7th', symbol: 'm7', isNonStandard: false, description: 'Minor seventh chord' };
    }
    if (thirdInterval === 4 && fifthInterval === 7 && seventhInterval === 10) {
        return { quality: 'Dominant 7th', symbol: '7', isNonStandard: false, description: 'Dominant seventh chord' };
    }
    if (thirdInterval === 3 && fifthInterval === 6 && seventhInterval === 10) {
        return { quality: 'half-diminished 7th', symbol: 'm7♭5', isNonStandard: false, description: 'Half-diminished seventh' };
    }
    if (thirdInterval === 3 && fifthInterval === 6 && seventhInterval === 9) {
        return { quality: 'diminished 7th', symbol: '°7', isNonStandard: false, description: 'Diminished seventh chord' };
    }
    
    // Augmented seventh chords
    if (thirdInterval === 4 && fifthInterval === 8 && seventhInterval === 11) {
        return { quality: 'Augmented Major 7th', symbol: '+maj7', isNonStandard: false, description: 'Augmented major seventh' };
    }
    if (thirdInterval === 4 && fifthInterval === 8 && seventhInterval === 10) {
        return { quality: 'Augmented 7th', symbol: '+7', isNonStandard: false, description: 'Augmented dominant seventh' };
    }
    
    // Minor major seventh
    if (thirdInterval === 3 && fifthInterval === 7 && seventhInterval === 11) {
        return { quality: 'minor Major 7th', symbol: 'mMaj7', isNonStandard: false, description: 'Minor major seventh' };
    }
    
    // SPECIFIC FIXES FOR EXOTIC SCALES - Add these before the generic patterns
    
    // Fix for Neapolitan Minor: B(♭2♭4♭6) - Notes: B - Db - F - Ab
    if (thirdInterval === 2 && fifthInterval === 6 && seventhInterval === 9) {
        return { quality: 'cluster chord', symbol: '(2♭5♭6)', isNonStandard: false, description: 'Cluster chord with major 2nd, tritone, and major 6th' };
    }
    
    // Fix for Hungarian Minor: D7♯11 - Notes: D - F# - Ab - C  
    if (thirdInterval === 4 && fifthInterval === 6 && seventhInterval === 10) {
        return { quality: 'Dominant 7♯11', symbol: '7♯11', isNonStandard: false, description: 'Dominant seventh sharp eleventh' };
    }
    
    // Fix for Hungarian Minor: F#°7 - Notes: F# - Ab - C - Eb
    if (thirdInterval === 2 && fifthInterval === 5 && seventhInterval === 8) {
        return { quality: 'diminished 7th', symbol: '°7', isNonStandard: false, description: 'Diminished seventh chord' };
    }
    
    // Fix for Neapolitan Major: G7♭5 - Notes: G - B - Db - F
    if (thirdInterval === 4 && fifthInterval === 6 && seventhInterval === 10) {
        return { quality: 'Dominant 7♭5', symbol: '7♭5', isNonStandard: false, description: 'Dominant seventh flat fifth' };
    }
    
    // Extended and altered seventh chords for exotic scales
    if (thirdInterval === 2 && fifthInterval === 6 && seventhInterval === 10) {
        return { quality: 'sus2♭5 7th', symbol: '7sus2♭5', isNonStandard: false, description: 'Suspended second flat fifth seventh' };
    }
    if (thirdInterval === 5 && fifthInterval === 6 && seventhInterval === 10) {
        return { quality: 'sus4♭5 7th', symbol: '7sus4♭5', isNonStandard: false, description: 'Suspended fourth flat fifth seventh' };
    }
    if (thirdInterval === 4 && fifthInterval === 6 && seventhInterval === 11) {
        return { quality: 'Major♭5 Maj7', symbol: 'maj7♭5', isNonStandard: false, description: 'Major flat fifth major seventh' };
    }
    if (thirdInterval === 3 && fifthInterval === 8 && seventhInterval === 11) {
        return { quality: 'minor#5 Maj7', symbol: 'mMaj7#5', isNonStandard: false, description: 'Minor sharp fifth major seventh' };
    }
    if (thirdInterval === 1 && fifthInterval === 7 && seventhInterval === 10) {
        return { quality: '♭9 7th', symbol: '7♭9', isNonStandard: false, description: 'Dominant seventh flat ninth' };
    }
    if (thirdInterval === 5 && fifthInterval === 8 && seventhInterval === 10) {
        return { quality: '11th♯5', symbol: '11♯5', isNonStandard: false, description: 'Eleventh sharp fifth' };
    }
    
    // Complex exotic scale seventh chords
    if (thirdInterval === 2 && fifthInterval === 5 && seventhInterval === 10) {
        return { quality: 'quartal 7th', symbol: '2/4/7', isNonStandard: false, description: 'Quartal seventh harmony' };
    }
    if (thirdInterval === 1 && fifthInterval === 6 && seventhInterval === 9) {
        return { quality: 'diminished cluster', symbol: 'dimCluster', isNonStandard: false, description: 'Diminished chromatic cluster' };
    }
    if (thirdInterval === 6 && fifthInterval === 10 && seventhInterval === 2) {
        return { quality: 'tritone maj6/9', symbol: '♭5maj6/9', isNonStandard: false, description: 'Tritone major sixth add ninth' };
    }
    
    // Hungarian minor and related exotic scales
    if (thirdInterval === 1 && fifthInterval === 5 && seventhInterval === 8) {
        return { quality: 'Hungarian 7th', symbol: 'Hung7', isNonStandard: false, description: 'Hungarian seventh chord' };
    }
    if (thirdInterval === 3 && fifthInterval === 5 && seventhInterval === 11) {
        return { quality: 'Neapolitan Maj7', symbol: 'Neap Maj7', isNonStandard: false, description: 'Neapolitan major seventh' };
    }
    if (thirdInterval === 4 && fifthInterval === 9 && seventhInterval === 11) {
        return { quality: 'Lydian Maj7', symbol: 'LydMaj7', isNonStandard: false, description: 'Lydian major seventh' };
    }
    
    // Suspended seventh variations
    if (thirdInterval === 2 && fifthInterval === 7 && seventhInterval === 10) {
        return { quality: 'sus2 7th', symbol: '7sus2', isNonStandard: false, description: 'Suspended second seventh' };
    }
    if (thirdInterval === 5 && fifthInterval === 7 && seventhInterval === 10) {
        return { quality: 'sus4 7th', symbol: '7sus4', isNonStandard: false, description: 'Suspended fourth seventh' };
    }
    if (thirdInterval === 2 && fifthInterval === 7 && seventhInterval === 11) {
        return { quality: 'sus2 Maj7', symbol: 'Maj7sus2', isNonStandard: false, description: 'Suspended second major seventh' };
    }
    if (thirdInterval === 5 && fifthInterval === 7 && seventhInterval === 11) {
        return { quality: 'sus4 Maj7', symbol: 'Maj7sus4', isNonStandard: false, description: 'Suspended fourth major seventh' };
    }
    
    // Add variations
    if (thirdInterval === 4 && fifthInterval === 7 && seventhInterval === 2) {
        return { quality: 'add9', symbol: 'add9', isNonStandard: true, description: 'Major add ninth (no 7th)' };
    }
    if (thirdInterval === 3 && fifthInterval === 7 && seventhInterval === 2) {
        return { quality: 'minor add9', symbol: 'madd9', isNonStandard: true, description: 'Minor add ninth (no 7th)' };
    }
    if (thirdInterval === 4 && fifthInterval === 9 && seventhInterval === 10) {
        return { quality: '13th', symbol: '13', isNonStandard: true, description: 'Dominant thirteenth (implied)' };
    }
    if (thirdInterval === 3 && fifthInterval === 9 && seventhInterval === 10) {
        return { quality: 'minor 13th', symbol: 'm13', isNonStandard: true, description: 'Minor thirteenth (implied)' };
    }
    
    // Missing intervals in seventh chords
    if (thirdInterval === 0 && fifthInterval === 7 && seventhInterval === 10) {
        return { quality: '7(no3)', symbol: '7(no3)', isNonStandard: true, description: 'Seventh no third' };
    }
    if (thirdInterval === 4 && fifthInterval === 0 && seventhInterval === 10) {
        return { quality: '7(no5)', symbol: '7(no5)', isNonStandard: true, description: 'Seventh no fifth' };
    }
    if (thirdInterval === 3 && fifthInterval === 0 && seventhInterval === 10) {
        return { quality: 'm7(no5)', symbol: 'm7(no5)', isNonStandard: true, description: 'Minor seventh no fifth' };
    }
    
    // Quartal seventh harmony (common in pentatonic/modal contexts)
    if (thirdInterval === 5 && fifthInterval === 10 && seventhInterval === 2) {
        return { quality: 'quartal 7th', symbol: '4/7/9', isNonStandard: true, description: 'Quartal seventh harmony' };
    }
    if (thirdInterval === 2 && fifthInterval === 5 && seventhInterval === 10) {
        return { quality: 'quartal stack', symbol: '2/4/7', isNonStandard: true, description: 'Quartal interval stack' };
    }
    
    // Polychord sevenths (stacked intervals)
    if (thirdInterval === 1 && fifthInterval === 6 && seventhInterval === 10) {
        return { quality: 'cluster 7th', symbol: 'b2/♭5/7', isNonStandard: true, description: 'Chromatic cluster seventh' };
    }
    if (thirdInterval === 6 && fifthInterval === 9 && seventhInterval === 11) {
        return { quality: 'tritone maj7', symbol: '♭5/6/7', isNonStandard: true, description: 'Tritone major seventh cluster' };
    }
    
    // Check for seventh chord inversions
    const inversionAnalysis = detectSeventhChordInversion(thirdInterval, fifthInterval, seventhInterval);
    if (inversionAnalysis.isInversion) {
        return {
            quality: inversionAnalysis.quality,
            symbol: inversionAnalysis.symbol,
            isNonStandard: false,
            description: inversionAnalysis.description,
            inversion: inversionAnalysis.inversion
        };
    }
    
    // Special handling for pentatonic scales
    if (scale.length === 5) {
        return analyzePentatonicSeventhChord(thirdInterval, fifthInterval, seventhInterval, scaleType);
    }
    
    // Special handling for diminished scales
    if (scale.length === 8) {
        return analyzeDiminishedSeventhChord(thirdInterval, fifthInterval, seventhInterval);
    }
    
    // Enhanced fallback with proper chord names instead of interval numbers
    if (thirdInterval === 3 && fifthInterval === 7) {
        // Minor triad with various sevenths
        if (seventhInterval === 9) return { quality: 'minor♭7', symbol: 'm♭7', isNonStandard: false, description: 'Minor flat seventh' };
        if (seventhInterval === 1) return { quality: 'minor♭9', symbol: 'm♭9', isNonStandard: false, description: 'Minor flat ninth' };
        return { quality: 'minor complex', symbol: 'm(alt)', isNonStandard: true, description: 'Minor chord with altered extension' };
    } else if (thirdInterval === 4 && fifthInterval === 7) {
        // Major triad with various sevenths
        if (seventhInterval === 9) return { quality: 'Major♭7', symbol: '♭7', isNonStandard: false, description: 'Major flat seventh' };
        if (seventhInterval === 1) return { quality: 'Major♭9', symbol: '♭9', isNonStandard: false, description: 'Major flat ninth' };
        return { quality: 'Major complex', symbol: 'Maj(alt)', isNonStandard: true, description: 'Major chord with altered extension' };
    } else if (thirdInterval === 3 && fifthInterval === 6) {
        // Diminished base with various sevenths
        if (seventhInterval === 8) return { quality: 'diminished♭6', symbol: '°♭6', isNonStandard: false, description: 'Diminished flat sixth' };
        if (seventhInterval === 11) return { quality: 'diminished Maj7', symbol: '°Maj7', isNonStandard: false, description: 'Diminished major seventh' };
        return { quality: 'diminished complex', symbol: '°(alt)', isNonStandard: true, description: 'Diminished chord with altered extension' };
    } else if (thirdInterval === 4 && fifthInterval === 8) {
        // Augmented base with various sevenths
        return { quality: 'Augmented complex', symbol: '+(alt)', isNonStandard: true, description: 'Augmented chord with extension' };
    } else {
        // Exotic harmony - name by intervallic structure with proper chord terminology
        const baseName = getExoticChordName(thirdInterval, fifthInterval, seventhInterval);
        return {
            quality: baseName,
            symbol: getExoticChordSymbol(thirdInterval, fifthInterval, seventhInterval),
            isNonStandard: true,
            description: `Exotic seventh chord: ${baseName}`
        };
    }
}

function getExoticChordName(thirdInterval, fifthInterval, seventhInterval) {
    // Create meaningful names for exotic chord structures
    if (thirdInterval <= 2) {
        if (fifthInterval <= 6) return 'cluster♭5';
        if (fifthInterval >= 8) return 'cluster#5';
        return 'cluster';
    }
    if (thirdInterval >= 5) {
        if (fifthInterval <= 6) return 'quartal♭5';
        if (fifthInterval >= 8) return 'quartal#5';
        return 'quartal';
    }
    // Remove generic "tritone chord" - let specific cases handle this
    if (fifthInterval === 6) {
        if (thirdInterval === 4) return 'Maj7♭5';  // Major with flat 5
        if (thirdInterval === 3) return 'min♭5';   // Minor with flat 5
        return 'altered♭5';  // Generic altered with flat 5
    }
    if (fifthInterval >= 9) return 'wide interval';
    
    return 'complex harmony';
}

function getExoticChordSymbol(thirdInterval, fifthInterval, seventhInterval) {
    // Create concise symbols for exotic chords
    if (thirdInterval <= 2 && fifthInterval <= 6) return 'clus♭5';
    if (thirdInterval <= 2 && fifthInterval >= 8) return 'clus#5';
    if (thirdInterval <= 2) return 'clus';
    if (thirdInterval >= 5 && fifthInterval <= 6) return 'qrt♭5';
    if (thirdInterval >= 5 && fifthInterval >= 8) return 'qrt#5';
    if (thirdInterval >= 5) return 'qrt';
    // Remove generic "trit" - provide more specific symbols
    if (fifthInterval === 6) {
        if (thirdInterval === 4) return 'Maj♭5';  // Major with flat 5
        if (thirdInterval === 3) return 'm♭5';    // Minor with flat 5
        return 'alt♭5';  // Generic altered with flat 5
    }
    if (fifthInterval >= 9) return 'wide';
    
    return 'alt';
}

function detectSeventhChordInversion(thirdInterval, fifthInterval, seventhInterval) {
    // First inversion (third in bass)
    if (thirdInterval === 3 && fifthInterval === 8 && (seventhInterval === 10 || seventhInterval === 11)) {
        const is7th = seventhInterval === 10;
        return {
            isInversion: true,
            quality: is7th ? 'Dominant 7/3' : 'Major 7/3',
            symbol: is7th ? '7/3' : 'maj7/3',
            description: `${is7th ? 'Dominant' : 'Major'} seventh, first inversion`,
            inversion: 'first'
        };
    }
    
    // Second inversion (fifth in bass)
    if (thirdInterval === 5 && (fifthInterval === 8 || fifthInterval === 9) && (seventhInterval === 10 || seventhInterval === 11)) {
        const is7th = seventhInterval === 10;
        return {
            isInversion: true,
            quality: is7th ? 'Dominant 7/5' : 'Major 7/5',
            symbol: is7th ? '7/5' : 'maj7/5',
            description: `${is7th ? 'Dominant' : 'Major'} seventh, second inversion`,
            inversion: 'second'
        };
    }
    
    // Third inversion (seventh in bass)
    if ((thirdInterval === 2 || thirdInterval === 1) && (fifthInterval === 5 || fifthInterval === 6) && (seventhInterval === 8 || seventhInterval === 9)) {
        const isMaj7 = thirdInterval === 1;
        return {
            isInversion: true,
            quality: isMaj7 ? 'Major 7/7' : 'Dominant 7/7',
            symbol: isMaj7 ? 'maj7/7' : '7/7',
            description: `${isMaj7 ? 'Major' : 'Dominant'} seventh, third inversion`,
            inversion: 'third'
        };
    }
    
    return { isInversion: false };
}

function analyzePentatonicSeventhChord(thirdInterval, fifthInterval, seventhInterval, scaleType) {
    // Pentatonic scales create unique seventh chord qualities
    
    if (thirdInterval === 2 && fifthInterval === 7 && seventhInterval === 10) {
        return { quality: 'sus2 7th', symbol: '7sus2', isNonStandard: false, description: 'Suspended second seventh (pentatonic)' };
    }
    if (thirdInterval === 5 && fifthInterval === 7 && seventhInterval === 10) {
        return { quality: 'sus4 7th', symbol: '7sus4', isNonStandard: false, description: 'Suspended fourth seventh (pentatonic)' };
    }
    if (thirdInterval === 2 && fifthInterval === 9 && seventhInterval === 0) {
        return { quality: 'add9/6', symbol: 'add9/6', isNonStandard: true, description: 'Add ninth and sixth (pentatonic)' };
    }
    if (thirdInterval === 5 && fifthInterval === 10 && seventhInterval === 2) {
        return { quality: 'quartal 7/9', symbol: '4/7/9', isNonStandard: true, description: 'Quartal seventh/ninth (pentatonic)' };
    }
    if (thirdInterval === 7 && fifthInterval === 10 && seventhInterval === 2) {
        return { quality: 'open 5/7/9', symbol: '5/7/9', isNonStandard: true, description: 'Open fifth/seventh/ninth (pentatonic)' };
    }
    
    // Default pentatonic seventh naming
    return {
        quality: `pentatonic 7th`,
        symbol: `pent7(${thirdInterval}/${fifthInterval}/${seventhInterval})`,
        isNonStandard: true,
        description: `Pentatonic seventh harmony`
    };
}

function analyzeDiminishedSeventhChord(thirdInterval, fifthInterval, seventhInterval) {
    // Diminished scales create complex seventh chord structures
    
    if (thirdInterval === 3 && fifthInterval === 6 && seventhInterval === 9) {
        return { quality: 'diminished 7th', symbol: '°7', isNonStandard: false, description: 'Diminished seventh (from dim. scale)' };
    }
    if (thirdInterval === 3 && fifthInterval === 6 && seventhInterval === 10) {
        return { quality: 'half-diminished 7th', symbol: 'm7♭5', isNonStandard: false, description: 'Half-diminished seventh (from dim. scale)' };
    }
    if (thirdInterval === 1 && fifthInterval === 4 && seventhInterval === 7) {
        return { quality: 'chromatic 7th', symbol: 'b2/3/5', isNonStandard: true, description: 'Chromatic cluster with fifth' };
    }
    if (thirdInterval === 2 && fifthInterval === 5 && seventhInterval === 8) {
        return { quality: 'chromatic stack', symbol: '2/4/6', isNonStandard: true, description: 'Chromatic interval stack' };
    }
    if (thirdInterval === 6 && fifthInterval === 9 && seventhInterval === 0) {
        return { quality: 'tritone cluster', symbol: '♭5/6/8', isNonStandard: true, description: 'Tritone cluster with octave' };
    }
    
    // Default diminished seventh naming
    return {
        quality: `diminished 7th complex`,
        symbol: `dim7(${thirdInterval}/${fifthInterval}/${seventhInterval})`,
        isNonStandard: true,
        description: `Complex diminished seventh harmony`
    };
}

function getIntervalName(semitones) {
    const intervalNames = {
        0: 'Unison',
        1: 'Minor 2nd',
        2: 'Major 2nd', 
        3: 'Minor 3rd',
        4: 'Major 3rd',
        5: 'Perfect 4th',
        6: 'Tritone',
        7: 'Perfect 5th',
        8: 'Minor 6th',
        9: 'Major 6th',
        10: 'Minor 7th',
        11: 'Major 7th'
    };
    
    return intervalNames[semitones] || `${semitones} semitones`;
}

function getIntervalBetweenNotes(note1, note2) {
    const noteToIndex = (note) => {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
            'A#': 10, 'Bb': 10, 'B': 11,
            'B#': 0, 'Cb': 11, 'E#': 5, 'Fb': 4
        };
        return noteMap[note] !== undefined ? noteMap[note] : 0;
    };
    
    const index1 = noteToIndex(note1);
    const index2 = noteToIndex(note2);
    return (index2 - index1 + 12) % 12;
}

function getRomanNumeral(degree, quality) {
    const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    const numeral = numerals[degree - 1] || 'I';
    
    if (quality.includes('minor') || quality.includes('diminished')) {
        return numeral.toLowerCase();
    } else if (quality.includes('diminished')) {
        return numeral.toLowerCase() + '°';
    } else if (quality.includes('Augmented')) {
        return numeral + '+';
    }
    
    return numeral;
}

function getChordFunction(degree, scaleType = 'major') {
    // Only apply functional harmony to scales that actually use it
    const functionalScales = [
        'major', 'minor', 'natural-minor', 'harmonic-minor', 'melodic-minor',
        'ionian', 'aeolian'  // These are essentially major/minor
    ];
    
    // For non-functional scales, return empty string
    if (!functionalScales.includes(scaleType)) {
        return '';
    }
    
    // Define chord functions based on scale degree and type
    const functions = {
        major: {
            1: 'Tonic',
            2: 'Supertonic',
            3: 'Mediant', 
            4: 'Subdominant',
            5: 'Dominant',
            6: 'Submediant',
            7: 'Leading Tone'
        },
        minor: {
            1: 'Tonic',
            2: 'Supertonic',
            3: 'Mediant',
            4: 'Subdominant', 
            5: 'Dominant',
            6: 'Submediant',
            7: 'Subtonic'
        }
    };
    
    // Determine base scale type for function naming
    let baseType = 'major';
    if (scaleType.includes('minor') || scaleType === 'aeolian') {
        baseType = 'minor';
    }
    
    return functions[baseType][degree] || '';
}

function getChordColor(chordFunction, quality) {
    // Color chords based on their harmonic function
    const functionColors = {
        'Tonic': '#4CAF50',        // Green - stable, home
        'Dominant': '#F44336',     // Red - tension, wants to resolve
        'Subdominant': '#2196F3',  // Blue - pre-dominant function
        'Supertonic': '#FF9800',   // Orange - commonly used in progressions
        'Mediant': '#9C27B0',      // Purple - mediant function
        'Submediant': '#00BCD4',   // Cyan - relative minor relationship
        'Leading Tone': '#795548', // Brown - strong pull to tonic
        'Subtonic': '#607D8B'      // Blue-gray - minor seventh
    };
    
    return functionColors[chordFunction] || '#9E9E9E';
}

function isStandardTriad(thirdInterval, fifthInterval) {
    // Define standard triad interval patterns
    const standardTriads = [
        [4, 7], // Major
        [3, 7], // minor
        [3, 6], // diminished
        [4, 8], // Augmented
        [2, 7], // sus2
        [5, 7]  // sus4
    ];
    
    return standardTriads.some(([third, fifth]) => 
        thirdInterval === third && fifthInterval === fifth
    );
}

function isStandardSeventhChord(thirdInterval, fifthInterval, seventhInterval) {
    // Define standard seventh chord interval patterns
    const standardSeventhChords = [
        [4, 7, 11], // Major 7th
        [3, 7, 10], // minor 7th
        [4, 7, 10], // Dominant 7th
        [3, 6, 10], // half-diminished 7th
        [3, 6, 9],  // diminished 7th
        [4, 8, 11], // Augmented Major 7th
        [4, 8, 10], // Augmented 7th
        [3, 7, 11], // minor Major 7th
        [2, 7, 10], // sus2 7th
        [5, 7, 10], // sus4 7th
        [2, 7, 11], // sus2 maj7
        [5, 7, 11]  // sus4 maj7
    ];
    
    return standardSeventhChords.some(([third, fifth, seventh]) => 
        thirdInterval === third && fifthInterval === fifth && seventhInterval === seventh
    );
}

function getCharacteristicChords(scale, scaleType) {
    // For scales that don't follow traditional degree-by-degree analysis
    // Return the characteristic chord types they naturally produce
    
    console.log('getCharacteristicChords called with:', { scale, scaleType, scaleLength: scale?.length });
    
    // More robust detection patterns
    if (scaleType === 'diminished' || scaleType === 'half-whole-diminished' || scaleType === 'whole-half-diminished' || scaleType.includes('diminished')) {
        return getDiminishedScaleChords(scale);
    }
    
    if (scaleType === 'pentatonic-major' || scaleType === 'pentatonic-minor' || scaleType.includes('pentatonic')) {
        return getPentatonicScaleChords(scale, scaleType);
    }
    
    // Enhanced whole tone detection
    if (scaleType === 'whole-tone' || scaleType === 'whole_tone' || scaleType.includes('whole') || 
        (scale && scale.length === 6 && isWholeToneScale(scale))) {
        return getWholeToneScaleChords(scale);
    }
    
    if (scaleType === 'blues' || scaleType === 'blues-major' || scaleType === 'blues-minor' || scaleType.includes('blues')) {
        return getBluesScaleChords(scale, scaleType);
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

function getDiminishedScaleChords(scale) {
    const root = scale[0];
    
    return {
        triads: [
            {
                type: 'Diminished Triads',
                description: 'Four diminished triads, each a minor 3rd apart',
                chords: [
                    `${root}°`, `${scale[2]}°`, `${scale[4]}°`, `${scale[6]}°`
                ]
            },
            {
                type: 'Major Triads', 
                description: 'Four major triads, each a minor 3rd apart',
                chords: [
                    `${scale[1]}`, `${scale[3]}`, `${scale[5]}`, `${scale[7] || scale[0]}`
                ]
            }
        ],
        sevenths: [
            {
                type: 'Diminished 7th Chords',
                description: 'The signature chord - fully diminished seventh',
                chords: [`${root}°7`],
                emphasis: true
            },
            {
                type: 'Dominant 7♭9 Chords',
                description: 'Extremely common in jazz improvisation',
                chords: [`${scale[1]}7♭9`, `${scale[3]}7♭9`, `${scale[5]}7♭9`]
            },
            {
                type: 'Dominant 7♯9♯11 Chords',
                description: 'Advanced jazz harmony - altered dominants',
                chords: [`${scale[1]}7♯9♯11`]
            },
            {
                type: 'Minor 6 Chords',
                description: 'Found within the scale structure',
                chords: [`${scale[2]}m6`, `${scale[6]}m6`]
            }
        ]
    };
}

function getPentatonicScaleChords(scale, scaleType) {
    const root = scale[0];
    
    return {
        triads: [
            {
                type: 'Basic Chords from Scale',
                description: 'Fundamental chord types using only scale notes',
                chords: [
                    `${root}5`, `${scale[1]}5`, `${scale[4]}5`, // Power chords
                    `${root}sus2`, `${root}sus4`, `${scale[1]}sus2`, `${scale[4]}sus4` // Suspended chords
                ]
            },
            {
                type: 'Extended Chords',
                description: 'Natural extensions from pentatonic intervals',
                chords: [`${root}add9`, `${scale[2]}add9`]
            }
        ],
        sevenths: [
            {
                type: 'Quartal Harmony',
                description: 'Stacked 4th intervals characteristic of pentatonic',
                chords: ['Quartal voicings'],
                emphasis: true
            },
            {
                type: 'Sus7 Chords',
                description: 'Seventh chords with suspended intervals',
                chords: [`${root}7sus4`, `${scale[4]}7sus2`]
            }
        ]
    };
}

function getWholeToneScaleChords(scale) {
    const root = scale[0];
    
    return {
        triads: [
            {
                type: 'Augmented Triads',
                description: 'All triads are augmented due to whole-tone structure',
                chords: [`${root}+`, `${scale[1]}+`, `${scale[2]}+`]
            }
        ],
        sevenths: [
            {
                type: 'Augmented Major 7th',
                description: 'The characteristic seventh chord',
                chords: [`${root}+maj7`],
                emphasis: true
            },
            {
                type: 'Dominant 7♯11',
                description: 'Altered dominant with sharp eleven',
                chords: [`${root}7♯11`]
            }
        ]
    };
}

function getBluesScaleChords(scale, scaleType) {
    const root = scale[0];
    const isMinorBlues = scaleType.includes('minor');
    
    return {
        triads: [
            {
                type: isMinorBlues ? 'Minor Triads' : 'Major Triads',
                description: 'Basic triads with blue note inflections',
                chords: isMinorBlues ? [`${root}m`, `${scale[3]}`, `${scale[4]}`] : [`${root}`, `${scale[3]}m`, `${scale[4]}`]
            }
        ],
        sevenths: [
            {
                type: 'Dominant 7th Chords',
                description: 'The backbone of blues harmony',
                chords: [`${root}7`, `${scale[3]}7`, `${scale[4]}7`],
                emphasis: true
            },
            {
                type: 'Minor 7th Chords',
                description: 'Common in minor blues progressions',
                chords: [`${root}m7`, `${scale[2]}m7`]
            }
        ]
    };
}

function getScaleApplications(scaleType) {
    // Return HTML content for scale applications instead of object structure
    
    const applications = {
        'diminished': {
            worksOver: ['Any dominant 7th chord', 'C7, Eb7, F#7, A7 (diminished cycle)', 'Altered dominants'],
            commonIn: ['Jazz improvisation', 'Classical harmony', 'Transition passages'],
            examples: ['Use over V7 chords in ii-V-I progressions', 'Passing tones between chord changes']
        },
        
        'pentatonic-major': {
            worksOver: ['Cmaj7', 'Am7', 'F6', 'G7sus4', 'Dm7'],
            commonIn: ['Folk music', 'Rock solos', 'Country music', 'Celtic music'],
            examples: ['Guitar solos over major progressions', 'Vocal melodies in folk songs']
        },
        
        'pentatonic-minor': {
            worksOver: ['Am7', 'C7', 'F7', 'G7', 'Dm7'],
            commonIn: ['Blues', 'Rock', 'Jazz fusion', 'World music'],
            examples: ['Blues guitar solos', 'Rock lead lines', 'Jazz-rock fusion']
        },
        
        'blues': {
            worksOver: ['12-bar blues progression', 'I7-IV7-V7', 'Minor blues changes'],
            commonIn: ['Blues', 'Jazz', 'Rock', 'Soul', 'R&B'],
            examples: ['Classic blues progressions', 'Jazz blues heads', 'Rock power ballads']
        },
        
        'whole-tone': {
            worksOver: ['Augmented chords', 'Dominant 7♯11', 'Impressionist harmony'],
            commonIn: ['Impressionist classical', 'Jazz ballads', 'Film scoring'],
            examples: ['Debussy compositions', 'Jazz standards with augmented harmony']
        }
    };
    
    // Check all possible scale type variations
    let scaleData = applications[scaleType];
    if (!scaleData) {
        // Try alternative formats
        if (scaleType.includes('pentatonic')) {
            scaleData = scaleType.includes('minor') ? applications['pentatonic-minor'] : applications['pentatonic-major'];
        } else if (scaleType.includes('whole')) {
            scaleData = applications['whole-tone'];
        } else if (scaleType.includes('blues')) {
            scaleData = applications['blues'];
        } else if (scaleType.includes('diminished')) {
            scaleData = applications['diminished'];
        }
    }
    
    if (!scaleData) return null;
    
    // Return formatted HTML content
    return `
        <div class="application-item">
            <strong>Works over:</strong> ${scaleData.worksOver.join(', ')}
        </div>
        <div class="application-item">
            <strong>Common in:</strong> ${scaleData.commonIn.join(', ')}
        </div>
        <div class="application-item">
            <strong>Examples:</strong> ${scaleData.examples.join(', ')}
        </div>
    `;
}

// Export all functions
window.MusicTheory = {
    hexToRgb,
    rgbToHex,
    calculateScaleColor,
    enhanceScaleColor,
    getIntervalColor,
    lightenColor,
    getProperNoteSpelling,
    calculateScale,
    getModeNotes,
    getIntervals,
    isHarmonicMinorPattern,
    isMelodicMinorPattern,
    isMajorPattern,
    isBluesPattern,
    isBluesMajorPattern,
    isBluesMinorPattern,
    areEnharmonicEquivalents,
    shouldDisplayChords,
    calculateTriads,
    calculateSeventhChords,
    getIntervalBetweenNotes,
    getRomanNumeral,
    getChordFunction,
    getChordColor,
    isStandardTriad,
    isStandardSeventhChord,
    getIntervalName,
    getCharacteristicChords,
    getDiminishedScaleChords,
    getPentatonicScaleChords,
    getWholeToneScaleChords,
    getBluesScaleChords,
    getScaleApplications
}; 