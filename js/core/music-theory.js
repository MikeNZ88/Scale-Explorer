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
    
    // Enhanced noteToIndex function that handles double accidentals
    const noteToIndex = (note) => {
        // Handle double accidentals first
        if (note.includes('bb')) {
            const naturalNote = note.replace('bb', '');
            const naturalIndex = {
                'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
            }[naturalNote];
            return naturalIndex !== undefined ? (naturalIndex - 2 + 12) % 12 : undefined;
        } else if (note.includes('##')) {
            const naturalNote = note.replace('##', '');
            const naturalIndex = {
                'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
            }[naturalNote];
            return naturalIndex !== undefined ? (naturalIndex + 2) % 12 : undefined;
        } else {
            // Single accidental or natural
            const singleAccidentalMap = {
                'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11,
                'C#': 1, 'Db': 1, 'D#': 3, 'Eb': 3, 'F#': 6, 'Gb': 6,
                'G#': 8, 'Ab': 8, 'A#': 10, 'Bb': 10,
                'B#': 0, 'Cb': 11, 'E#': 5, 'Fb': 4
            };
            return singleAccidentalMap[note];
        }
    };
    
    // Find the root note's position in the note names array
    const rootNoteName = root.charAt(0);
    const rootNoteIndex = noteNames.indexOf(rootNoteName);
    if (rootNoteIndex === -1) {
        console.warn('Invalid root note:', root);
        return [];
    }
    
    // Get the chromatic index of the root
    const rootChromaticIndex = noteToIndex(root);
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
    
    if (scaleType === 'hybrid-blues') {
        return calculateHybridBluesScale(root, formula, rootNoteIndex, rootChromaticIndex, noteNames, noteToIndex);
    }
    
    if (scaleType === 'augmented') {
        return calculateAugmentedScale(root, formula, rootChromaticIndex, noteToIndex);
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
        const baseNoteChromatic = noteToIndex(baseNoteName);
        
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
        const baseNoteChromatic = noteToIndex(baseNoteName);
        
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
            const baseNoteChromatic = noteToIndex(baseNoteName);
            
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

function calculateHybridBluesScale(root, formula, rootNoteIndex, rootChromaticIndex, noteNames, noteToIndex) {
    // Hybrid blues scale: 1, 2, b3, 3, 4, b5, 5, 6, b7 (9 notes)
    // Formula: [2, 1, 1, 1, 1, 1, 2, 1]
    
    const scale = [root];
    let currentChromaticIndex = rootChromaticIndex;
    
    // Blues-friendly chromatic scale (always use flats for altered notes)
    const bluesChromatic = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    
    for (let i = 0; i < formula.length; i++) {
        currentChromaticIndex = (currentChromaticIndex + formula[i]) % 12;
        
        // For hybrid blues scale, always use the blues-friendly chromatic scale
        // This ensures Gb instead of F# and Bb instead of B
        const noteName = bluesChromatic[currentChromaticIndex];
        scale.push(noteName);
    }
    
    return scale;
}

function calculateAugmentedScale(root, formula, rootChromaticIndex, noteToIndex) {
    // Augmented scale: 6-note symmetrical scale
    // Formula: [1, 3, 1, 3, 1, 3] or [3, 1, 3, 1, 3, 1]
    
    const scale = [root];
    let currentChromaticIndex = rootChromaticIndex;
    
    // Augmented scale uses flats for altered notes to maintain consistent spelling
    const augmentedChromatic = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    
    for (let i = 0; i < formula.length - 1; i++) {
        currentChromaticIndex = (currentChromaticIndex + formula[i]) % 12;
        
        // Use the augmented-friendly chromatic scale
        const noteName = augmentedChromatic[currentChromaticIndex];
        scale.push(noteName);
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
    if (scaleType === 'hybrid-blues' || scaleType === 'blues') {
        // Blues scales generally prefer flats for altered notes
        chromaticScale = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    } else if (usesSharps) {
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

function getIntervals(notes, root, scaleType = 'major') {
    if (!notes || !Array.isArray(notes) || notes.length === 0) {
        return [];
    }
    
    function noteToIndex(note) {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
            'B#': 0, 'Cb': 11, 'E#': 5, 'Fb': 4
        };
        return noteMap[note] !== undefined ? noteMap[note] : 0;
    }
    
    const rootIndex = noteToIndex(root);
    const intervals = [];
    
    // Special handling for different scale types
    if (notes.length === 6) {
        // Check for augmented scale type first
        if (scaleType === 'augmented' || isAugmentedScale(notes) || isAugmentedScale2(notes)) {
            return ['1', 'b2', '4', 'b5', '6', 'b7'];
        }
        
        // Check for blues scale patterns
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
    
    if (notes.length === 9) {
        // Hybrid blues scale - nine-note scale combining blues minor and blues major
        // Contains: 1-2-♭3-3-4-♭5-5-6-♭7
        return ['1', '2', 'b3', '3', '4', 'b5', '5', '6', 'b7'];
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
function shouldDisplayChords(scaleType, scaleLength, category = null) {
    // Hide chords for Japanese pentatonic scales specifically
    if (category === 'japanese-pentatonic') {
        return false;
    }
    
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
    
    // Blues scales can show chords (6-note blues or 9-note hybrid blues)
    if ((scaleLength === 6 && scaleType === 'blues') || 
        (scaleLength === 9 && scaleType === 'hybrid-blues')) {
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
    // Exception: hybrid blues (9 notes) is allowed
    if (scaleLength < 5 || (scaleLength > 9)) {
        return false;
    }
    
    // Allow 9-note scales if they are blues-related
    if (scaleLength === 9 && scaleType.includes('blues')) {
        return true;
    }
    
    return true;
}

function calculateTriads(scale, scaleType = 'major', category = null) {
    if (!scale || scale.length < 3) {
        return [];
    }
    
    // Check if this scale type should display chords
    if (!shouldDisplayChords(scaleType, scale.length, category)) {
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

function calculateSeventhChords(scale, scaleType = 'major', category = null) {
    if (!scale || scale.length < 4) {
        return [];
    }
    
    // Check if this scale type should display chords
    if (!shouldDisplayChords(scaleType, scale.length, category)) {
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
    
    console.log('=== getCharacteristicChords DEBUG START ===');
    console.log('getCharacteristicChords called with:', { scale, scaleType, scaleLength: scale?.length });
    
    // Enhanced detection patterns with more comprehensive matching
    
    // Diminished scales (8-note scales)
    if (scaleType === 'diminished' || scaleType === 'half-whole-diminished' || scaleType === 'whole-half-diminished' || 
        scaleType.includes('diminished') || (scale && scale.length === 8)) {
        console.log('Detected diminished scale, calling getDiminishedScaleChords');
        return getDiminishedScaleChords(scale);
    }
    
    // Blues scales (6-note scales) - CHECK BEFORE PENTATONIC
    console.log('Checking blues conditions:');
    console.log('scaleType === "blues":', scaleType === 'blues');
    console.log('scaleType.includes("blues"):', scaleType.includes('blues'));
    console.log('scale && scale.length === 6:', scale && scale.length === 6);
    
    if (scaleType === 'blues' || scaleType === 'blues-major' || scaleType === 'blues-minor' || 
        scaleType === 'hybrid-blues' || scaleType.includes('blues') || 
        (scale && scale.length === 6 && isBluesPattern(scale, scale[0]))) {
        console.log('Detected blues scale, calling getBluesScaleChords');
        return getBluesScaleChords(scale, scaleType);
    }
    
    // Whole tone scales (6-note scales with whole tone pattern)
    if (scaleType === 'whole-tone' || scaleType === 'whole_tone' || scaleType.includes('whole') || 
        (scale && scale.length === 6 && isWholeToneScale(scale))) {
        console.log('Detected whole tone scale, calling getWholeToneScaleChords');
        return getWholeToneScaleChords(scale);
    }
    
    // Pentatonic scales (5-note scales) - CHECK AFTER BLUES
    console.log('Checking pentatonic conditions:');
    console.log('scaleType === "major-pentatonic":', scaleType === 'major-pentatonic');
    console.log('scaleType === "minor-pentatonic":', scaleType === 'minor-pentatonic');
    console.log('scaleType === "pentatonic":', scaleType === 'pentatonic');
    console.log('scaleType.includes("pentatonic"):', scaleType.includes('pentatonic'));
    console.log('scale && scale.length === 5:', scale && scale.length === 5);
    
    if (scaleType === 'major-pentatonic' || scaleType === 'minor-pentatonic' || scaleType === 'pentatonic' ||
        scaleType.includes('pentatonic') || (scale && scale.length === 5)) {
        console.log('Detected pentatonic scale, calling getPentatonicScaleChords');
        const result = getPentatonicScaleChords(scale, scaleType);
        console.log('getPentatonicScaleChords returned:', result);
        return result;
    }
    
    // Augmented scales (6-note symmetrical scales)
    if (scaleType === 'augmented' || scaleType.includes('augmented') || 
        (scale && scale.length === 6 && isAugmentedScale(scale))) {
        console.log('Detected augmented scale, calling getAugmentedScaleChords');
        return getAugmentedScaleChords(scale);
    }
    
    // Chromatic scale (12-note scale)
    if (scaleType === 'chromatic' || scaleType.includes('chromatic') || 
        (scale && scale.length === 12)) {
        console.log('Detected chromatic scale, calling getChromaticScaleChords');
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

function getDiminishedScaleChords(scale) {
    console.log('getDiminishedScaleChords called with scale:', scale);
    
    if (!scale || scale.length !== 8) {
        return { chords: [] };
    }
    
    // Diminished scale theory: 8 notes create 4 diminished 7th chords and 4 dominant 7th chords
    // Diminished 7th chords built on scale degrees 1, 3, 5, 7 (odd degrees)
    // Dominant 7th chords built on scale degrees 2, 4, 6, 8 (even degrees)
    
    const diminished7ths = [
        `${scale[0]}°7`,  // 1st degree
        `${scale[2]}°7`,  // 3rd degree  
        `${scale[4]}°7`,  // 5th degree
        `${scale[6]}°7`   // 7th degree
    ];
    
    const dominant7ths = [
        `${scale[1]}7`,   // 2nd degree
        `${scale[3]}7`,   // 4th degree
        `${scale[5]}7`,   // 6th degree
        `${scale[7]}7`    // 8th degree
    ];
    
    // Also show the available triads for completeness
    const diminishedTriads = [
        `${scale[0]}°`,
        `${scale[2]}°`,
        `${scale[4]}°`,
        `${scale[6]}°`
    ];
    
    const majorTriads = [
        `${scale[1]}`,
        `${scale[3]}`,
        `${scale[5]}`,
        `${scale[7]}`
    ];
    
    return {
        chords: [
            {
                type: 'Diminished 7th Chords (Primary)',
                description: 'Four diminished 7th chords built on odd scale degrees (1, 3, 5, 7)',
                chords: diminished7ths.sort(),
                emphasis: true
            },
            {
                type: 'Dominant 7th Chords (Primary)',
                description: 'Four dominant 7th chords built on even scale degrees (2, 4, 6, 8)',
                chords: dominant7ths.sort(),
                emphasis: true
            },
            {
                type: 'Diminished Triads',
                description: 'Diminished triads from odd scale degrees',
                chords: diminishedTriads.sort()
            },
            {
                type: 'Major Triads',
                description: 'Major triads from even scale degrees',
                chords: majorTriads.sort()
            },
            {
                type: 'Scale Applications',
                description: 'Use over altered dominants, diminished passing chords, chromatic harmony',
                chords: ['Excellent for jazz improvisation', 'Creates symmetrical harmonic patterns']
            }
        ]
    };
}

// Helper function to build chords using only notes from the scale
function buildChordsFromScale(scale) {
    const scaleNotes = [...scale];
    const chords = [];
    
    // Build triads using scale notes only
    for (let i = 0; i < scaleNotes.length; i++) {
        const root = scaleNotes[i];
        
        // Try to build triads by stacking thirds within the scale
        for (let j = i + 1; j < scaleNotes.length; j++) {
            for (let k = j + 1; k < scaleNotes.length; k++) {
                const third = scaleNotes[j];
                const fifth = scaleNotes[k];
                
                // Check if this forms a reasonable triad interval
                const rootToThird = getIntervalBetweenNotes(root, third);
                const rootToFifth = getIntervalBetweenNotes(root, fifth);
                
                // Accept major/minor thirds (3-4 semitones) and reasonable fifths (6-8 semitones)
                if ((rootToThird >= 3 && rootToThird <= 4) && (rootToFifth >= 6 && rootToFifth <= 8)) {
                    const chordType = rootToThird === 3 ? 'm' : '';
                    chords.push({
                        root: root,
                        chord: `${root}${chordType}`,
                        notes: [root, third, fifth],
                        type: 'triad'
                    });
                }
            }
        }
        
        // Always include power chords (root + fifth)
        for (let j = i + 1; j < scaleNotes.length; j++) {
            const fifth = scaleNotes[j];
            const interval = getIntervalBetweenNotes(root, fifth);
            if (interval >= 6 && interval <= 8) { // Perfect or augmented fifth
                chords.push({
                    root: root,
                    chord: `${root}5`,
                    notes: [root, fifth],
                    type: 'power'
                });
                break; // Take first suitable fifth
            }
        }
        
        // Add suspended chords using scale notes
        for (let j = i + 1; j < scaleNotes.length; j++) {
            const second = scaleNotes[j];
            const interval = getIntervalBetweenNotes(root, second);
            if (interval === 2) { // Major second
                chords.push({
                    root: root,
                    chord: `${root}sus2`,
                    notes: [root, second],
                    type: 'sus'
                });
            } else if (interval === 5) { // Perfect fourth
                chords.push({
                    root: root,
                    chord: `${root}sus4`,
                    notes: [root, second],
                    type: 'sus'
                });
            }
        }
    }
    
    return chords;
}

function getPentatonicScaleChords(scale, scaleType) {
    console.log('getPentatonicScaleChords called with scale:', scale, 'scaleType:', scaleType);
    
    const availableChords = buildChordsFromScale(scale);
    const triads = availableChords.filter(c => c.type === 'triad').map(c => c.chord);
    const powerChords = availableChords.filter(c => c.type === 'power').map(c => c.chord);
    const susChords = availableChords.filter(c => c.type === 'sus').map(c => c.chord);
    
    return {
        chords: [
            {
                type: 'Power Chords (Built from Scale)',
                description: 'Root and fifth intervals using only pentatonic scale notes',
                chords: powerChords.slice(0, 3).sort()
            },
            {
                type: 'Suspended Chords (Built from Scale)',
                description: 'Sus2 and sus4 chords using only pentatonic scale notes',
                chords: susChords.slice(0, 3).sort()
            },
            {
                type: 'Available Triads (Built from Scale)',
                description: 'Complete triads possible within the pentatonic scale notes',
                chords: triads.length > 0 ? triads.slice(0, 2).sort() : ['Very limited - pentatonic avoids thirds'],
                emphasis: true
            },
            {
                type: 'Scale Applications',
                description: scaleType.includes('minor') ? 
                    'Works over: Am7, C7, F7, G7, Dm7 progressions' : 
                    'Works over: Cmaj7, Am7, F6, G7sus4, Dm7 progressions',
                chords: ['Use for melodic improvisation', 'Quartal harmony voicings']
            }
        ]
    };
}

function getWholeToneScaleChords(scale) {
    console.log('getWholeToneScaleChords called with scale:', scale);
    
    // Whole tone scale creates augmented triads naturally
    const augmentedChords = [];
    for (let i = 0; i < Math.min(3, scale.length - 2); i++) {
        augmentedChords.push(`${scale[i]}+`);
    }
    
    const availableChords = buildChordsFromScale(scale);
    const powerChords = availableChords.filter(c => c.type === 'power').map(c => c.chord);
    
    return {
        chords: [
            {
                type: 'Power Chords (Built from Scale)',
                description: 'Limited power chord options from whole-tone scale',
                chords: powerChords.slice(0, 2).sort()
            },
            {
                type: 'Augmented Triads (Built from Scale)',
                description: 'All triads are augmented due to whole-tone intervals in scale',
                chords: augmentedChords.sort()
            },
            {
                type: 'Augmented Major 7th (Built from Scale)',
                description: 'Characteristic seventh chord using whole-tone scale notes',
                chords: [`${scale[0]}+maj7`],
                emphasis: true
            },
            {
                type: 'Scale Applications',
                description: 'Works over: C+, C7♯11, C7♯5, altered dominants',
                chords: ['Use for impressionist harmony', 'Creates floating, unresolved quality']
            }
        ]
    };
}

function getBluesScaleChords(scale, scaleType) {
    console.log('getBluesScaleChords called with scale:', scale, 'scaleType:', scaleType);
    
    if (!scale || (scale.length !== 6 && scale.length !== 9)) {
        return { chords: [] };
    }

    const root = scale[0]; // Tonic (I chord)
    
    if (scale.length === 9) {
        // Hybrid blues scale: C-D-Eb-E-F-Gb-G-A-Bb (for C root)
        // Use actual scale notes for practical blues chords
        
        // Find the key harmonic notes in the scale
        const second = scale[1];     // D
        const minorThird = scale[2]; // Eb  
        const majorThird = scale[3]; // E
        const fourth = scale[4];     // F
        const tritone = scale[5];    // Gb
        const fifth = scale[6];      // G
        const sixth = scale[7];      // A
        const minorSeventh = scale[8]; // Bb
        
        return {
            chords: [
                {
                    type: "Core Blues Triads",
                    description: "Essential triads built from the hybrid blues scale notes",
                    chords: [
                        `${root}`,      // C major (C-E-G)
                        `${root}m`,     // C minor (C-Eb-G) 
                        `${sixth}m`     // A minor (A-C-E) - vi chord
                    ],
                    emphasis: true
                },
                {
                    type: "Blues Seventh Chords", 
                    description: "Dominant and minor 7th chords for blues progressions",
                    chords: [
                        `${root}7`,        // C7 (C-E-G-Bb)
                        `${fourth}7`,      // F7 (F-A-C-E) - IV7 chord
                        `${root}m7`,       // Cm7 (C-Eb-G-Bb)
                        `${sixth}m7`       // Am7 (A-C-E-G) - vi7 chord
                    ],
                    emphasis: true
                },
                {
                    type: "Passing & Color Chords",
                    description: "Diminished passing chords and chromatic movement", 
                    chords: [
                        `${tritone}°7`,     // Gb°7 - tritone diminished (legitimate passing chord)
                        `${minorThird}°7`   // Eb°7 - passing chord between ii and iii
                    ]
                },
                {
                    type: "Blues Extensions & Alterations",
                    description: "Jazzy blues colors and Hendrix-style chords",
                    chords: [
                        `${root}7#9`,      // C7#9 (Hendrix chord)
                        `${root}7b5`,      // C7b5 (altered blues)
                        `${root}9`,        // C9 (jazz blues)
                        `${root}13`,       // C13 (jazz extension)
                        `${fourth}9`       // F9 (subdominant color)
                    ]
                }
            ],
            applications: {
                description: "Perfect for sophisticated blues harmony and jazz-blues fusion",
                suggestions: [
                    "Use over complex 12-bar blues progressions",
                    "Great for jazz-blues and blues-rock fusion", 
                    "Combines major and minor blues characteristics",
                    "Excellent for blues improvisation in any key"
                ]
            }
        };
    }
    
    // Traditional 6-note blues scales
    const triads = buildChordsFromScale(scale);
    console.log('Generated triads for 6-note blues:', triads);
    
    // Organize traditional blues chords into categories
    const coreTriads = triads.filter(chord => 
        chord.quality === 'major' || chord.quality === 'minor'
    ).slice(0, 3);
    
    const powerChords = triads.filter(chord => 
        chord.chord.includes('5') || chord.quality === 'power'
    ).slice(0, 3);
    
    const suspendedChords = triads.filter(chord => 
        chord.chord.includes('sus')
    ).slice(0, 2);
    
    const extendedChords = triads.filter(chord => 
        chord.chord.includes('7') || chord.chord.includes('6')
    ).slice(0, 4);
    
    console.log('Organized blues chords:', { coreTriads, powerChords, suspendedChords, extendedChords });
    
    return {
        chords: [
            {
                type: "Core Blues Triads",
                description: "Essential triads for traditional blues",
                chords: coreTriads.map(chord => chord.chord),
                emphasis: true
            },
            {
                type: "Blues Power Chords",
                description: "Power chords and perfect fifths",
                chords: powerChords.map(chord => chord.chord)
            },
            {
                type: "Suspended Chords",
                description: "Sus2 and sus4 chords for color",
                chords: suspendedChords.map(chord => chord.chord)
            },
            {
                type: "Blues Extensions",
                description: "6th and 7th chords for blues progressions",
                chords: extendedChords.map(chord => chord.chord)
            }
        ]
    };
}

function getAugmentedScaleChords(scale) {
    console.log('getAugmentedScaleChords called with scale:', scale);
    
    const availableChords = buildChordsFromScale(scale);
    const triads = availableChords.filter(c => c.type === 'triad').map(c => c.chord);
    const powerChords = availableChords.filter(c => c.type === 'power').map(c => c.chord);
    
    // Augmented scale creates augmented triads
    const augmentedChords = [];
    for (let i = 0; i < Math.min(2, scale.length - 2); i += 2) {
        augmentedChords.push(`${scale[i]}+`);
    }
    
    return {
        chords: [
            {
                type: 'Power Chords (Built from Scale)',
                description: 'Power chords using augmented scale intervals',
                chords: powerChords.slice(0, 2).sort(),
                emphasis: true
            },
            {
                type: 'Augmented Triads (Built from Scale)',
                description: 'Augmented triads built using augmented scale notes',
                chords: augmentedChords.sort()
            },
            {
                type: 'Available Triads (Built from Scale)',
                description: 'Other triads possible within the augmented scale notes',
                chords: triads.length > 0 ? triads.slice(0, 2).sort() : ['Limited - augmented intervals dominate']
            },
            {
                type: 'Scale Applications',
                description: 'Works over: C+, C+maj7, altered dominants with ♯5',
                chords: ['Use for augmented harmony', 'Creates symmetrical intervals']
            }
        ]
    };
}

function getChromaticScaleChords(scale) {
    console.log('getChromaticScaleChords called with scale:', scale);
    
    const availableChords = buildChordsFromScale(scale);
    const triads = availableChords.filter(c => c.type === 'triad').map(c => c.chord);
    const powerChords = availableChords.filter(c => c.type === 'power').map(c => c.chord);
    const susChords = availableChords.filter(c => c.type === 'sus').map(c => c.chord);
    
    return {
        chords: [
            {
                type: 'Power Chords (Built from Scale)',
                description: 'Power chords using chromatic scale intervals',
                chords: powerChords.slice(0, 4).sort()
            },
            {
                type: 'Suspended Chords (Built from Scale)',
                description: 'Various suspended chord options from chromatic notes',
                chords: susChords.slice(0, 4).sort(),
                emphasis: true
            },
            {
                type: 'All Available Triads (Built from Scale)',
                description: 'Multiple triad types available from chromatic scale notes',
                chords: triads.slice(0, 6).sort()
            },
            {
                type: 'Scale Applications',
                description: 'Works over: Any chord - use for chromatic passing tones',
                chords: ['Use for voice leading', 'Connects any harmony to any other']
            }
        ]
    };
}

function isAugmentedScale(scale) {
    if (!scale || scale.length !== 6) return false;
    
    // Check if the scale follows the augmented pattern: 1-3-1-3-1-3 (minor 3rd, minor 3rd pattern)
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
    
    const expectedPattern = [1, 3, 1, 3, 1, 3]; // Augmented scale pattern
    
    for (let i = 0; i < scale.length - 1; i++) {
        const currentNote = noteToIndex(scale[i]);
        const nextNote = noteToIndex(scale[i + 1]);
        const interval = (nextNote - currentNote + 12) % 12;
        
        if (interval !== expectedPattern[i]) {
            return false;
        }
    }
    
    return true;
}

function isAugmentedScale2(scale) {
    if (!scale || scale.length !== 6) return false;
    
    // Check if the scale follows the second augmented pattern: 3-1-3-1-3-1 (major 3rd, minor 2nd pattern)
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
    
    const expectedPattern = [3, 1, 3, 1, 3, 1]; // Second augmented scale pattern
    
    for (let i = 0; i < scale.length - 1; i++) {
        const currentNote = noteToIndex(scale[i]);
        const nextNote = noteToIndex(scale[i + 1]);
        const interval = (nextNote - currentNote + 12) % 12;
        
        if (interval !== expectedPattern[i]) {
            return false;
        }
    }
    
    return true;
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
    buildChordsFromScale,
    getDiminishedScaleChords,
    getPentatonicScaleChords,
    getWholeToneScaleChords,
    getBluesScaleChords,
    isAugmentedScale,
    isAugmentedScale2,
    getAugmentedScaleChords,
    getChromaticScaleChords
};