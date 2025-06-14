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
    // First try direct lookup
    let color = MusicConstants.intervalColors[interval];
    
    // If not found, try enharmonic equivalent
    if (!color) {
        // Inline enharmonic equivalent mapping for performance
        const enharmonicMap = {
            '#4': 'b5', 'b5': '#4',
            '#1': 'b2', 'b2': '#1',
            '#2': 'b3', 'b3': '#2',
            '#5': 'b6', 'b6': '#5',
            '#6': 'b7', 'b7': '#6',
            'b4': '3', '#3': '4',  // b4 = 3, #3 = 4
            'bb7': '6', '##1': '2', 
            '##2': '3', '##4': '5',
            '##5': '6', '##6': '7',
            '#7': '1', 'bb2': '1',
            'bb3': '2', 'bb4': '3',
            'bb5': '4', 'bb6': '5'
        };
        
        const enharmonicEquivalent = enharmonicMap[interval];
        if (enharmonicEquivalent) {
            color = MusicConstants.intervalColors[enharmonicEquivalent];
        }
    }
    
    return color || '#8B5CF6';
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
    // Debug logging for diminished scales
    if (scaleType && scaleType.includes('diminished')) {
        console.log('calculateScale called with:', { root, formula, scaleType });
    }
    
    if (!formula || !Array.isArray(formula)) {
        console.error('Invalid formula provided to calculateScale:', formula);
        return [];
    }
    
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
    
    if (scaleType === 'augmented') {
        return calculateAugmentedScale(root, formula, rootChromaticIndex, noteToIndex);
    }
    
    if (scaleType === 'wh-diminished' || scaleType === 'hw-diminished') {
        return calculateDiminishedScale(root, formula, scaleType, rootNoteIndex, rootChromaticIndex, noteNames, noteToIndex);
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

function calculateDiminishedScale(root, formula, scaleType, rootNoteIndex, rootChromaticIndex, noteNames, noteToIndex) {
    console.log('calculateDiminishedScale called with:', { root, formula, scaleType, rootNoteIndex, rootChromaticIndex });
    
    const scale = [root];
    
    // Determine if this is W-H or H-W diminished
    const isWH = scaleType === 'wh-diminished';
    
    // Letter offsets for diminished scales (ensuring one note per letter name)
    const whLetterOffsets = [1, 2, 3, 4, 5, 5, 6, 0]; // W-H: step 5 stays on A, step 7 wraps to C
    const hwLetterOffsets = [1, 2, 2, 3, 4, 5, 6, 0]; // H-W: step 2 stays on E, step 7 wraps to C
    
    const letterOffsets = isWH ? whLetterOffsets : hwLetterOffsets;
    
    let currentChromaticIndex = rootChromaticIndex;
    
    for (let i = 0; i < formula.length - 1; i++) {
        currentChromaticIndex = (currentChromaticIndex + formula[i]) % 12;
        
        // Calculate target letter index
        const targetLetterIndex = (rootNoteIndex + letterOffsets[i]) % 7;
        const targetLetter = noteNames[targetLetterIndex];
        
        // Handle bounds checking
        if (targetLetterIndex < 0 || targetLetterIndex >= noteNames.length || !targetLetter) {
            console.error('Undefined targetLetter at index', targetLetterIndex);
            continue;
        }
        
        // Get the natural chromatic index for this letter
        const naturalIndex = noteToIndex(targetLetter);
        
        // Calculate chromatic difference
        const chromaticDiff = (currentChromaticIndex - naturalIndex + 12) % 12;
        
        // Determine the note name with appropriate accidental
        let noteName;
        if (chromaticDiff === 0) {
            noteName = targetLetter; // Natural
        } else if (chromaticDiff === 1) {
            noteName = targetLetter + '#'; // Sharp
        } else if (chromaticDiff === 11) {
            noteName = targetLetter + 'b'; // Flat
        } else {
            // For problematic intervals, use enharmonic equivalents
            // Map chromatic index to preferred note name
            const chromaticToNote = {
                0: 'C', 1: 'C#', 2: 'D', 3: 'Eb', 4: 'E', 5: 'F',
                6: 'F#', 7: 'G', 8: 'Ab', 9: 'A', 10: 'Bb', 11: 'B'
            };
            noteName = chromaticToNote[currentChromaticIndex] || targetLetter;
        }
        
        // Fix problematic enharmonic spellings
        if (noteName === 'Cb') noteName = 'B';
        if (noteName === 'Fb') noteName = 'E';
        if (noteName === 'E#') noteName = 'F';
        if (noteName === 'B#') noteName = 'C';
        
        console.log(`Step ${i}: chromatic ${currentChromaticIndex}, letter ${targetLetter}, diff ${chromaticDiff}, result ${noteName}`);
        scale.push(noteName);
    }
    
    console.log('Generated diminished scale:', scale);
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
    if (scaleType === 'blues') {
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

function getIntervals(notes, root, scaleType = 'major', mode = null) {
    if (!notes || notes.length === 0) return [];
    
    function noteToIndex(note) {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };
        return noteMap[note] !== undefined ? noteMap[note] : 0;
    }
    
    const rootIndex = noteToIndex(root);
    const intervals = [];
    
            for (let i = 0; i < notes.length; i++) {
                const noteIndex = noteToIndex(notes[i]);
        let semitones = (noteIndex - rootIndex + 12) % 12;
        
        // Convert semitones to interval names
        const intervalMap = {
            0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4',
            6: 'b5', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7'
        };
        
        let interval = intervalMap[semitones] || '1';
        
        // Context-aware interval naming for specific modes
        if (semitones === 6) { // Tritone - can be b5 or #4
            if (mode === 'lydian') {
                interval = '#4'; // Lydian mode uses #4, not b5
            }
            // Other Lydian-related modes that use #4 instead of b5
            else if (mode === 'lydian-dominant' || mode === 'lydian-augmented' || mode === 'lydian-sharp-2') {
                interval = '#4';
            }
        }
        
        intervals.push(interval);
    }
    
    // Handle special cases for 8-note scales
    if (notes.length === 8) {
        if (scaleType === 'wh-diminished' || mode === 'wh-diminished') {
        return ['1', '2', 'b3', '4', 'b5', 'b6', '6', '7'];
        } else if (scaleType === 'hw-diminished' || mode === 'hw-diminished') {
            return ['1', 'b2', 'b3', '3', '#4', '5', '6', 'b7'];
        } else {
            // Generic 8-note scale - use calculated intervals
            return intervals;
        }
    }
    
    // Handle special scale types that need hardcoded intervals
    // Only use hardcoded intervals for specific scale types, not for modes
    if (scaleType === 'blues' || isBluesPattern(notes, root)) {
        return ['1', 'b3', '4', 'b5', '5', 'b7'];
    }
    
    if (scaleType === 'pentatonic') {
        if (notes.length === 5) {
            // Determine if major or minor pentatonic based on intervals
            const hasMinorThird = intervals.includes('b3');
            if (hasMinorThird) {
                return ['1', 'b3', '4', '5', 'b7']; // Minor pentatonic
            } else {
                return ['1', '2', '3', '5', '6']; // Major pentatonic
            }
        }
    }
    
    // For all other cases, including major modes, harmonic minor modes, etc.
    // Use the calculated intervals instead of hardcoded ones
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
    // Handle pentatonic scales (5 notes) - don't show chords
    if (scaleLength === 5) {
        return false;
    }
    
    // Handle blues scales specifically - don't show chords for any blues type
    if ((scaleLength === 6 && scaleType === 'blues') || 
        scaleType.includes('blues')) {
        return false;
    }
    
    // Scales that don't traditionally use diatonic chord analysis
    const noChordScales = [
        'chromatic',
        'whole-tone',
        'augmented',
        'major-6th-diminished',
        'minor-6th-diminished'
    ];
    
    // Check if it's a scale type that doesn't use traditional chord analysis
    if (noChordScales.includes(scaleType)) {
        return false;
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
    if (scaleLength < 5 || (scaleLength > 9)) {
        return false;
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

    // Special handling for diminished scales - find ALL possible triads
    if (scale.length === 8 && (scaleType.includes('diminished') || scaleType.includes('dim'))) {
        return calculateDiminishedScaleTriads(scale, scaleType);
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

function calculateDiminishedScaleTriads(scale, scaleType) {
    const triads = [];
    
    // For diminished scales, we need to find ALL possible triads, not just sequential ones
    // This includes the major triads that occur on non-sequential scale degrees
    
    for (let i = 0; i < scale.length; i++) {
        const root = scale[i];
        const possibleTriads = [];
        
        // Check all possible combinations of notes from the scale for this root
        for (let j = 0; j < scale.length; j++) {
            if (j === i) continue; // Skip the root
            
            for (let k = j + 1; k < scale.length; k++) {
                if (k === i) continue; // Skip the root
                
                const third = scale[j];
                const fifth = scale[k];
                
                // Calculate intervals
                let thirdInterval = getIntervalBetweenNotes(root, third);
                let fifthInterval = getIntervalBetweenNotes(root, fifth);
                
                // Normalize intervals
                while (thirdInterval > 6) thirdInterval -= 12;
                while (thirdInterval < 0) thirdInterval += 12;
                while (fifthInterval > 11) fifthInterval -= 12;
                while (fifthInterval < 4) fifthInterval += 12;
                
                // Check if this forms a valid triad (major, minor, diminished, augmented)
                if (isValidTriad(thirdInterval, fifthInterval)) {
                    const chordAnalysis = analyzeDiminishedChord(thirdInterval, fifthInterval);
                    
                    possibleTriads.push({
                        root: root,
                        third: third,
                        fifth: fifth,
                        thirdInterval: thirdInterval,
                        fifthInterval: fifthInterval,
                        quality: chordAnalysis.quality,
                        symbol: chordAnalysis.symbol,
                        score: getTriadScore(thirdInterval, fifthInterval) // Prioritize standard triads
                    });
                }
            }
        }
        
        // Select the best triad for this root (prefer standard intervals)
        if (possibleTriads.length > 0) {
            const bestTriad = possibleTriads.sort((a, b) => b.score - a.score)[0];
            
            triads.push({
                degree: i + 1,
                roman: getRomanNumeral(i + 1, bestTriad.quality),
                root: bestTriad.root,
                notes: [bestTriad.root, bestTriad.third, bestTriad.fifth],
                quality: bestTriad.quality,
                symbol: bestTriad.symbol,
                name: `${bestTriad.root}${bestTriad.symbol}`,
                intervals: [bestTriad.thirdInterval, bestTriad.fifthInterval],
                function: '', // Diminished scales don't follow functional harmony
                isNonStandard: false,
                description: `${bestTriad.quality} triad from diminished scale`
            });
        }
    }
    
    return triads;
}

function isValidTriad(thirdInterval, fifthInterval) {
    // Define what constitutes a valid triad
    const validTriads = [
        [4, 7], // Major
        [3, 7], // minor
        [3, 6], // diminished
        [4, 8], // Augmented
        [2, 7], // sus2
        [5, 7]  // sus4
    ];
    
    return validTriads.some(([third, fifth]) => 
        thirdInterval === third && fifthInterval === fifth
    );
}

function getTriadScore(thirdInterval, fifthInterval) {
    // Score triads to prioritize standard ones
    if (thirdInterval === 4 && fifthInterval === 7) return 100; // Major
    if (thirdInterval === 3 && fifthInterval === 7) return 90;  // minor
    if (thirdInterval === 3 && fifthInterval === 6) return 80;  // diminished
    if (thirdInterval === 4 && fifthInterval === 8) return 70;  // Augmented
    if (thirdInterval === 2 && fifthInterval === 7) return 60;  // sus2
    if (thirdInterval === 5 && fifthInterval === 7) return 50;  // sus4
    return 0; // Invalid/exotic
}

function analyzeTriadComprehensive(thirdInterval, fifthInterval, scale, rootIndex, scaleType) {
    // Special handling for diminished scales - do this FIRST to prevent inversion misdetection
    if (scale.length === 8) {
        return analyzeDiminishedChord(thirdInterval, fifthInterval);
    }
    
    // Special handling for pentatonic scales
    if (scale.length === 5) {
        return analyzePentatonicChord(thirdInterval, fifthInterval, scaleType);
    }
    
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
    // For diminished scales, analyze the actual chord structures that occur
    
    // Standard major triad (4, 7)
    if (thirdInterval === 4 && fifthInterval === 7) {
        return { quality: 'Major', symbol: '', isNonStandard: false, description: 'Major triad' };
    }
    
    // Standard minor triad (3, 7)
    if (thirdInterval === 3 && fifthInterval === 7) {
        return { quality: 'minor', symbol: 'm', isNonStandard: false, description: 'Minor triad' };
    }
    
    // Standard diminished triad (3, 6) - this is correct for Eb°, F°, etc.
    if (thirdInterval === 3 && fifthInterval === 6) {
        return { quality: 'diminished', symbol: '°', isNonStandard: false, description: 'Diminished triad' };
    }
    
    // Standard augmented triad (4, 8)
    if (thirdInterval === 4 && fifthInterval === 8) {
        return { quality: 'Augmented', symbol: '+', isNonStandard: false, description: 'Augmented triad' };
    }
    
    // Diminished scales create some non-standard interval patterns due to the chromatic nature
    // Handle the specific intervals that occur in W-H and H-W diminished scales
    
    // Major triad with altered fifth (4, 6) - Major with flat 5
    if (thirdInterval === 4 && fifthInterval === 6) {
        return { quality: 'diminished', symbol: '°', isNonStandard: false, description: 'Diminished triad' };
    }
    
    // Minor triad with sharp 5 (3, 8) - treat as minor
    if (thirdInterval === 3 && fifthInterval === 8) {
        return { quality: 'minor', symbol: 'm', isNonStandard: false, description: 'Minor triad' };
    }
    
    // Handle other common diminished scale intervals
    // (2, 6) = sus2 with flat 5
    if (thirdInterval === 2 && fifthInterval === 6) {
        return { quality: 'diminished', symbol: '°', isNonStandard: false, description: 'Diminished triad' };
    }
    
    // (5, 9) = sus4 with 6th 
    if (thirdInterval === 5 && fifthInterval === 9) {
        return { quality: 'diminished', symbol: '°', isNonStandard: false, description: 'Diminished triad' };
    }
    
    // For any other exotic intervals in diminished scales, default to diminished
    // This prevents complex chord names and keeps the analysis simple
    return { quality: 'diminished', symbol: '°', isNonStandard: false, description: 'Diminished triad' };
}

function calculateSeventhChords(scale, scaleType = 'major', category = null) {
    if (!scale || scale.length < 4) {
        return [];
    }
    
    // Check if this scale type should display chords
    if (!shouldDisplayChords(scaleType, scale.length, category)) {
        return [];
    }

    // Special handling for diminished scales - find ALL possible seventh chords
    if (scale.length === 8 && (scaleType.includes('diminished') || scaleType.includes('dim'))) {
        return calculateDiminishedScaleSeventhChords(scale, scaleType);
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

function calculateDiminishedScaleSeventhChords(scale, scaleType) {
    const seventhChords = [];
    
    // For diminished scales, we need to find ALL possible seventh chords, not just sequential ones
    for (let i = 0; i < scale.length; i++) {
        const root = scale[i];
        const possibleSeventhChords = [];
        
        // Check all possible combinations of notes from the scale for this root
        for (let j = 0; j < scale.length; j++) {
            if (j === i) continue; // Skip the root
            
            for (let k = j + 1; k < scale.length; k++) {
                if (k === i) continue; // Skip the root
                
                for (let l = k + 1; l < scale.length; l++) {
                    if (l === i) continue; // Skip the root
                    
                    const third = scale[j];
                    const fifth = scale[k];
                    const seventh = scale[l];
                    
                    // Calculate intervals
                    let thirdInterval = getIntervalBetweenNotes(root, third);
                    let fifthInterval = getIntervalBetweenNotes(root, fifth);
                    let seventhInterval = getIntervalBetweenNotes(root, seventh);
                    
                    // Normalize intervals
                    while (thirdInterval > 6) thirdInterval -= 12;
                    while (thirdInterval < 0) thirdInterval += 12;
                    while (fifthInterval > 11) fifthInterval -= 12;
                    while (fifthInterval < 4) fifthInterval += 12;
                    while (seventhInterval > 11) seventhInterval -= 12;
                    while (seventhInterval < 9) seventhInterval += 12;
                    
                    // Check if this forms a valid seventh chord
                    if (isValidSeventhChord(thirdInterval, fifthInterval, seventhInterval)) {
                        const chordAnalysis = analyzeDiminishedSeventhChord(thirdInterval, fifthInterval, seventhInterval);
                        
                        possibleSeventhChords.push({
                            root: root,
                            third: third,
                            fifth: fifth,
                            seventh: seventh,
                            thirdInterval: thirdInterval,
                            fifthInterval: fifthInterval,
                            seventhInterval: seventhInterval,
                            quality: chordAnalysis.quality,
                            symbol: chordAnalysis.symbol,
                            score: getSeventhChordScore(thirdInterval, fifthInterval, seventhInterval)
                        });
                    }
                }
            }
        }
        
        // Select the best seventh chord for this root (prefer standard intervals)
        if (possibleSeventhChords.length > 0) {
            const bestChord = possibleSeventhChords.sort((a, b) => b.score - a.score)[0];
            
            seventhChords.push({
                degree: i + 1,
                roman: getRomanNumeral(i + 1, bestChord.quality),
                root: bestChord.root,
                notes: [bestChord.root, bestChord.third, bestChord.fifth, bestChord.seventh],
                quality: bestChord.quality,
                symbol: bestChord.symbol,
                name: `${bestChord.root}${bestChord.symbol}`,
                intervals: [bestChord.thirdInterval, bestChord.fifthInterval, bestChord.seventhInterval],
                function: '', // Diminished scales don't follow functional harmony
                isNonStandard: false,
                description: `${bestChord.quality} seventh chord from diminished scale`
            });
        }
    }
    
    return seventhChords;
}

function isValidSeventhChord(thirdInterval, fifthInterval, seventhInterval) {
    // Define what constitutes a valid seventh chord
    const validSeventhChords = [
        [4, 7, 11], // Major 7th
        [4, 7, 10], // Dominant 7th  
        [3, 7, 10], // Minor 7th
        [3, 6, 9],  // Diminished 7th
        [3, 6, 10], // Half-diminished 7th
        [4, 8, 11], // Augmented major 7th
        [4, 8, 10]  // Augmented 7th
    ];
    
    return validSeventhChords.some(([third, fifth, seventh]) => 
        thirdInterval === third && fifthInterval === fifth && seventhInterval === seventh
    );
}

function getSeventhChordScore(thirdInterval, fifthInterval, seventhInterval) {
    // Score seventh chords to prioritize standard ones
    if (thirdInterval === 4 && fifthInterval === 7 && seventhInterval === 11) return 100; // Major 7th
    if (thirdInterval === 4 && fifthInterval === 7 && seventhInterval === 10) return 95;  // Dominant 7th
    if (thirdInterval === 3 && fifthInterval === 7 && seventhInterval === 10) return 90;  // Minor 7th
    if (thirdInterval === 3 && fifthInterval === 6 && seventhInterval === 9) return 85;   // Diminished 7th
    if (thirdInterval === 3 && fifthInterval === 6 && seventhInterval === 10) return 80;  // Half-diminished 7th
    if (thirdInterval === 4 && fifthInterval === 8 && seventhInterval === 11) return 75;  // Augmented major 7th
    if (thirdInterval === 4 && fifthInterval === 8 && seventhInterval === 10) return 70;  // Augmented 7th
    return 0; // Invalid/exotic
}

function calculateNinthChords(scale, scaleType = 'major', category = null) {
    if (!scale || scale.length < 7) {
        return [];
    }
    
    // Only calculate extended chords for major modes
    if (scaleType !== 'major' || !category || category !== 'major-modes') {
        return [];
    }
    
    const ninthChords = [];
    
    for (let i = 0; i < scale.length; i++) {
        const root = scale[i];
        
        // Calculate scale degrees for chord tones
        const thirdIndex = (i + 2) % scale.length;
        const fifthIndex = (i + 4) % scale.length;
        const seventhIndex = (i + 6) % scale.length;
        const ninthIndex = (i + 1) % scale.length; // 9th is the same as 2nd
        
        const third = scale[thirdIndex];
        const fifth = scale[fifthIndex];
        const seventh = scale[seventhIndex];
        const ninth = scale[ninthIndex];
        
        // Calculate intervals from the chord root
        let thirdInterval = getIntervalBetweenNotes(root, third);
        let fifthInterval = getIntervalBetweenNotes(root, fifth);
        let seventhInterval = getIntervalBetweenNotes(root, seventh);
        let ninthInterval = getIntervalBetweenNotes(root, ninth);
        
        // Normalize ninth interval (should be in the second octave: 13-15 semitones)
        if (ninthInterval < 12) ninthInterval += 12;
        
        // Analyze the ninth chord
        const chordAnalysis = analyzeNinthChord(thirdInterval, fifthInterval, seventhInterval, ninthInterval);
        
        ninthChords.push({
            degree: i + 1,
            roman: getRomanNumeral(i + 1, chordAnalysis.quality),
            root: root,
            notes: [root, third, fifth, seventh, ninth],
            quality: chordAnalysis.quality,
            symbol: chordAnalysis.symbol,
            name: `${root}${chordAnalysis.symbol}`,
            intervals: [thirdInterval, fifthInterval, seventhInterval, ninthInterval],
            function: getChordFunction(i + 1, scaleType),
            isNonStandard: chordAnalysis.isNonStandard || false,
            description: chordAnalysis.description
        });
    }
    
    return ninthChords;
}

function calculateEleventhChords(scale, scaleType = 'major', category = null) {
    if (!scale || scale.length < 7) {
        return [];
    }
    
    // Only calculate extended chords for major modes
    if (scaleType !== 'major' || !category || category !== 'major-modes') {
        return [];
    }
    
    const eleventhChords = [];
    
    for (let i = 0; i < scale.length; i++) {
        const root = scale[i];
        
        // Calculate scale degrees for chord tones
        const thirdIndex = (i + 2) % scale.length;
        const fifthIndex = (i + 4) % scale.length;
        const seventhIndex = (i + 6) % scale.length;
        const ninthIndex = (i + 1) % scale.length; // 9th is the same as 2nd
        const eleventhIndex = (i + 3) % scale.length; // 11th is the same as 4th
        
        const third = scale[thirdIndex];
        const fifth = scale[fifthIndex];
        const seventh = scale[seventhIndex];
        const ninth = scale[ninthIndex];
        const eleventh = scale[eleventhIndex];
        
        // Calculate intervals from the chord root
        let thirdInterval = getIntervalBetweenNotes(root, third);
        let fifthInterval = getIntervalBetweenNotes(root, fifth);
        let seventhInterval = getIntervalBetweenNotes(root, seventh);
        let ninthInterval = getIntervalBetweenNotes(root, ninth);
        let eleventhInterval = getIntervalBetweenNotes(root, eleventh);
        
        // Normalize ninth interval (should be in the second octave: 13-15 semitones)
        if (ninthInterval < 12) ninthInterval += 12;
        
        // Normalize eleventh interval (should be in the second octave: 16-18 semitones)
        if (eleventhInterval < 12) eleventhInterval += 12;
        
        // Analyze the eleventh chord
        const chordAnalysis = analyzeEleventhChord(thirdInterval, fifthInterval, seventhInterval, ninthInterval, eleventhInterval);
        
        eleventhChords.push({
            degree: i + 1,
            roman: getRomanNumeral(i + 1, chordAnalysis.quality),
            root: root,
            notes: [root, third, fifth, seventh, ninth, eleventh],
            quality: chordAnalysis.quality,
            symbol: chordAnalysis.symbol,
            name: `${root}${chordAnalysis.symbol}`,
            intervals: [thirdInterval, fifthInterval, seventhInterval, ninthInterval, eleventhInterval],
            function: getChordFunction(i + 1, scaleType),
            isNonStandard: chordAnalysis.isNonStandard || false,
            description: chordAnalysis.description
        });
    }
    
    return eleventhChords;
}

function calculateThirteenthChords(scale, scaleType = 'major', category = null) {
    if (!scale || scale.length < 7) {
        return [];
    }
    
    // Only calculate extended chords for major modes
    if (scaleType !== 'major' || !category || category !== 'major-modes') {
        return [];
    }
    
    const thirteenthChords = [];
    
    for (let i = 0; i < scale.length; i++) {
        const root = scale[i];
        
        // Calculate scale degrees for chord tones
        const thirdIndex = (i + 2) % scale.length;
        const fifthIndex = (i + 4) % scale.length;
        const seventhIndex = (i + 6) % scale.length;
        const ninthIndex = (i + 1) % scale.length; // 9th is the same as 2nd
        const eleventhIndex = (i + 3) % scale.length; // 11th is the same as 4th
        const thirteenthIndex = (i + 5) % scale.length; // 13th is the same as 6th
        
        const third = scale[thirdIndex];
        const fifth = scale[fifthIndex];
        const seventh = scale[seventhIndex];
        const ninth = scale[ninthIndex];
        const eleventh = scale[eleventhIndex];
        const thirteenth = scale[thirteenthIndex];
        
        // Calculate intervals from the chord root
        let thirdInterval = getIntervalBetweenNotes(root, third);
        let fifthInterval = getIntervalBetweenNotes(root, fifth);
        let seventhInterval = getIntervalBetweenNotes(root, seventh);
        let ninthInterval = getIntervalBetweenNotes(root, ninth);
        let eleventhInterval = getIntervalBetweenNotes(root, eleventh);
        let thirteenthInterval = getIntervalBetweenNotes(root, thirteenth);
        
        // Normalize ninth interval (should be in the second octave: 13-15 semitones)
        if (ninthInterval < 12) ninthInterval += 12;
        
        // Normalize eleventh interval (should be in the second octave: 16-18 semitones)
        if (eleventhInterval < 12) eleventhInterval += 12;
        
        // Normalize thirteenth interval (should be in the second octave: 19-21 semitones)
        if (thirteenthInterval < 12) thirteenthInterval += 12;
        
        // Analyze the thirteenth chord
        const chordAnalysis = analyzeThirteenthChord(thirdInterval, fifthInterval, seventhInterval, ninthInterval, eleventhInterval, thirteenthInterval);
        
        thirteenthChords.push({
            degree: i + 1,
            roman: getRomanNumeral(i + 1, chordAnalysis.quality),
            root: root,
            notes: [root, third, fifth, seventh, ninth, eleventh, thirteenth],
            quality: chordAnalysis.quality,
            symbol: chordAnalysis.symbol,
            name: `${root}${chordAnalysis.symbol}`,
            intervals: [thirdInterval, fifthInterval, seventhInterval, ninthInterval, eleventhInterval, thirteenthInterval],
            function: getChordFunction(i + 1, scaleType),
            isNonStandard: chordAnalysis.isNonStandard || false,
            description: chordAnalysis.description
        });
    }
    
    return thirteenthChords;
}

function analyzeNinthChord(thirdInterval, fifthInterval, seventhInterval, ninthInterval) {
    // Determine base chord quality from third interval
    let baseQuality, baseSymbol;
    if (thirdInterval === 3) {
        baseQuality = 'minor';
        baseSymbol = 'm';
    } else if (thirdInterval === 4) {
        baseQuality = 'Major';
        baseSymbol = '';  // Major chords don't need 'maj' prefix for dominant 7ths
    } else {
        // Handle sus chords or other structures
        if (thirdInterval === 2) {
            baseQuality = 'sus2';
            baseSymbol = 'sus2';
        } else if (thirdInterval === 5) {
            baseQuality = 'sus4';
            baseSymbol = 'sus4';
        } else {
            baseQuality = 'altered';
            baseSymbol = 'alt';
        }
    }
    
    // Determine seventh quality and adjust base symbol accordingly
    let seventhQuality = '';
    if (seventhInterval === 11) {
        // Major 7th - use 'maj' for major chords
        if (baseQuality === 'Major') {
            baseSymbol = 'maj';
            seventhQuality = '';
        } else {
            seventhQuality = 'Maj';
        }
    } else if (seventhInterval === 10) {
        // Dominant 7th - no modifier needed for major chords, keep 'm' for minor
        seventhQuality = '';
    }
    
    // Handle fifth alterations
    let fifthAlteration = '';
    if (fifthInterval === 6) {
        fifthAlteration = '♭5';
    } else if (fifthInterval === 8) {
        fifthAlteration = '#5';
    }
    
    // Handle ninth alterations
    let ninthAlteration = '';
    if (ninthInterval === 13) {
        ninthAlteration = '♭9';
    } else if (ninthInterval === 15) {
        ninthAlteration = '#9';
    }
    
    // Construct the symbol
    let symbol = baseSymbol;
    if (seventhQuality) symbol += seventhQuality;
    
    // Only add base extension if there are no alterations
    if (ninthAlteration) {
        symbol += ninthAlteration;
    } else {
        symbol += '9';
    }
    
    if (fifthAlteration) symbol += fifthAlteration;
    
    // Construct the quality name - fix the duplication issue
    let quality = baseQuality;
    if (seventhInterval === 11 && baseQuality !== 'Major') {
        quality += ' Major';
    } else if (seventhInterval === 10 && baseQuality === 'Major') {
        quality = 'Dominant';
    }
    
    // Add the ninth extension - use alteration if present, otherwise use "9th"
    if (ninthAlteration) {
        quality += ` ${ninthAlteration}`;
    } else {
        quality += ' 9th';
    }
    
    if (fifthAlteration) quality += ` ${fifthAlteration}`;
    
    return { 
        quality: quality, 
        symbol: symbol, 
        description: `${quality} chord`,
        isNonStandard: ninthAlteration || fifthAlteration || baseQuality === 'altered'
    };
}

function analyzeEleventhChord(thirdInterval, fifthInterval, seventhInterval, ninthInterval, eleventhInterval) {
    // Determine base chord quality from third interval
    let baseQuality, baseSymbol;
    if (thirdInterval === 3) {
        baseQuality = 'minor';
        baseSymbol = 'm';
    } else if (thirdInterval === 4) {
        baseQuality = 'Major';
        baseSymbol = '';  // Major chords don't need 'maj' prefix for dominant 7ths
    } else {
        // Handle sus chords or other structures
        if (thirdInterval === 2) {
            baseQuality = 'sus2';
            baseSymbol = 'sus2';
        } else if (thirdInterval === 5) {
            baseQuality = 'sus4';
            baseSymbol = 'sus4';
        } else {
            baseQuality = 'altered';
            baseSymbol = 'alt';
        }
    }
    
    // Determine seventh quality and adjust base symbol accordingly
    let seventhQuality = '';
    if (seventhInterval === 11) {
        // Major 7th - use 'maj' for major chords
        if (baseQuality === 'Major') {
            baseSymbol = 'maj';
            seventhQuality = '';
        } else {
            seventhQuality = 'Maj';
        }
    } else if (seventhInterval === 10) {
        // Dominant 7th - no modifier needed for major chords, keep 'm' for minor
        seventhQuality = '';
    }
    
    // Handle fifth alterations
    let fifthAlteration = '';
    if (fifthInterval === 6) {
        fifthAlteration = '♭5';
    } else if (fifthInterval === 8) {
        fifthAlteration = '#5';
    }
    
    // Handle ninth alterations
    let ninthAlteration = '';
    if (ninthInterval === 13) {
        ninthAlteration = '♭9';
    } else if (ninthInterval === 15) {
        ninthAlteration = '#9';
    }
    
    // Handle eleventh alterations
    let eleventhAlteration = '';
    if (eleventhInterval === 18) {
        eleventhAlteration = '#11';
    } else if (eleventhInterval === 16) {
        eleventhAlteration = '♭11';
    }
    
    // Construct the symbol
    let symbol = baseSymbol;
    if (seventhQuality) symbol += seventhQuality;
    
    // Only add base extension if there are no alterations to the 11th
    if (eleventhAlteration) {
        symbol += eleventhAlteration;
    } else {
        symbol += '11';
    }
    
    if (ninthAlteration) symbol += ninthAlteration;
    if (fifthAlteration) symbol += fifthAlteration;
    
    // Construct the quality name - fix the duplication issue
    let quality = baseQuality;
    if (seventhInterval === 11 && baseQuality !== 'Major') {
        quality += ' Major';
    } else if (seventhInterval === 10 && baseQuality === 'Major') {
        quality = 'Dominant';
    }
    
    // Add the eleventh extension - use alteration if present, otherwise use "11th"
    if (eleventhAlteration) {
        quality += ` ${eleventhAlteration}`;
    } else {
        quality += ' 11th';
    }
    
    if (ninthAlteration) quality += ` ${ninthAlteration}`;
    if (fifthAlteration) quality += ` ${fifthAlteration}`;
    
    return { 
        quality: quality, 
        symbol: symbol, 
        description: `${quality} chord`,
        isNonStandard: ninthAlteration || eleventhAlteration || fifthAlteration || baseQuality === 'altered'
    };
}

function analyzeThirteenthChord(thirdInterval, fifthInterval, seventhInterval, ninthInterval, eleventhInterval, thirteenthInterval) {
    // Determine base chord quality from third interval
    let baseQuality, baseSymbol;
    if (thirdInterval === 3) {
        baseQuality = 'minor';
        baseSymbol = 'm';
    } else if (thirdInterval === 4) {
        baseQuality = 'Major';
        baseSymbol = '';  // Major chords don't need 'maj' prefix for dominant 7ths
    } else {
        // Handle sus chords or other structures
        if (thirdInterval === 2) {
            baseQuality = 'sus2';
            baseSymbol = 'sus2';
        } else if (thirdInterval === 5) {
            baseQuality = 'sus4';
            baseSymbol = 'sus4';
        } else {
            baseQuality = 'altered';
            baseSymbol = 'alt';
        }
    }
    
    // Determine seventh quality and adjust base symbol accordingly
    let seventhQuality = '';
    if (seventhInterval === 11) {
        // Major 7th - use 'maj' for major chords
        if (baseQuality === 'Major') {
            baseSymbol = 'maj';
            seventhQuality = '';
        } else {
            seventhQuality = 'Maj';
        }
    } else if (seventhInterval === 10) {
        // Dominant 7th - no modifier needed for major chords, keep 'm' for minor
        seventhQuality = '';
    }
    
    // Handle fifth alterations
    let fifthAlteration = '';
    if (fifthInterval === 6) {
        fifthAlteration = '♭5';
    } else if (fifthInterval === 8) {
        fifthAlteration = '#5';
    }
    
    // Handle ninth alterations
    let ninthAlteration = '';
    if (ninthInterval === 13) {
        ninthAlteration = '♭9';
    } else if (ninthInterval === 15) {
        ninthAlteration = '#9';
    }
    
    // Handle eleventh alterations
    let eleventhAlteration = '';
    if (eleventhInterval === 18) {
        eleventhAlteration = '#11';
    } else if (eleventhInterval === 16) {
        eleventhAlteration = '♭11';
    }
    
    // Handle thirteenth alterations
    let thirteenthAlteration = '';
    if (thirteenthInterval === 20) {
        thirteenthAlteration = '♭13';
    } else if (thirteenthInterval === 22) {
        thirteenthAlteration = '#13';
    }
    
    // Construct the symbol
    let symbol = baseSymbol;
    if (seventhQuality) symbol += seventhQuality;
    
    // Only add base extension if there are no alterations to the 13th
    if (thirteenthAlteration) {
        symbol += thirteenthAlteration;
    } else {
        symbol += '13';
    }
    
    if (ninthAlteration) symbol += ninthAlteration;
    if (eleventhAlteration) symbol += eleventhAlteration;
    if (fifthAlteration) symbol += fifthAlteration;
    
    // Construct the quality name - fix the duplication issue
    let quality = baseQuality;
    if (seventhInterval === 11 && baseQuality !== 'Major') {
        quality += ' Major';
    } else if (seventhInterval === 10 && baseQuality === 'Major') {
        quality = 'Dominant';
    }
    
    // Add the thirteenth extension - use alteration if present, otherwise use "13th"
    if (thirteenthAlteration) {
        quality += ` ${thirteenthAlteration}`;
    } else {
        quality += ' 13th';
    }
    
    if (ninthAlteration) quality += ` ${ninthAlteration}`;
    if (eleventhAlteration) quality += ` ${eleventhAlteration}`;
    if (fifthAlteration) quality += ` ${fifthAlteration}`;
    
    return { 
        quality: quality, 
        symbol: symbol, 
        description: `${quality} chord`,
        isNonStandard: ninthAlteration || eleventhAlteration || thirteenthAlteration || fifthAlteration || baseQuality === 'altered'
    };
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
    
    // Minor major seventh (characteristic of harmonic minor)
    if (thirdInterval === 3 && fifthInterval === 7 && seventhInterval === 11) {
        return { quality: 'minor Major 7th', symbol: 'mMaj7', isNonStandard: false, description: 'Minor major seventh' };
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
        if (seventhInterval === 9) return { quality: 'minor♭7', symbol: 'm♭7', isNonStandard: true, description: 'Minor flat seventh' };
        return { quality: 'minor complex', symbol: 'm(alt)', isNonStandard: true, description: 'Minor chord with altered extension' };
    } else if (thirdInterval === 4 && fifthInterval === 7) {
        // Major triad with various sevenths
        if (seventhInterval === 9) return { quality: 'Major♭7', symbol: '♭7', isNonStandard: true, description: 'Major flat seventh' };
        return { quality: 'Major complex', symbol: 'Maj(alt)', isNonStandard: true, description: 'Major chord with altered extension' };
    } else if (thirdInterval === 3 && fifthInterval === 6) {
        // Diminished base with various sevenths
        if (seventhInterval === 8) return { quality: 'diminished♭6', symbol: '°♭6', isNonStandard: true, description: 'Diminished flat sixth' };
        if (seventhInterval === 11) return { quality: 'diminished Maj7', symbol: '°Maj7', isNonStandard: true, description: 'Diminished major seventh' };
        return { quality: 'diminished complex', symbol: '°(alt)', isNonStandard: true, description: 'Diminished chord with altered extension' };
    } else if (thirdInterval === 4 && fifthInterval === 8) {
        // Augmented base with various sevenths
        return { quality: 'Augmented complex', symbol: '+(alt)', isNonStandard: true, description: 'Augmented chord with extension' };
    } else {
        // Exotic harmony - create simple descriptive names
        return {
            quality: `chord ${thirdInterval}/${fifthInterval}/${seventhInterval}`,
            symbol: `(${thirdInterval}/${fifthInterval}/${seventhInterval})`,
            isNonStandard: true,
            description: `Non-standard chord structure`
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
    // For diminished scales, only analyze basic seventh chords
    
    // Standard major seventh
    if (thirdInterval === 4 && fifthInterval === 7 && seventhInterval === 11) {
        return { quality: 'Major 7th', symbol: 'maj7', isNonStandard: false, description: 'Major seventh chord' };
    }
    
    // Standard minor seventh
    if (thirdInterval === 3 && fifthInterval === 7 && seventhInterval === 10) {
        return { quality: 'minor 7th', symbol: 'm7', isNonStandard: false, description: 'Minor seventh chord' };
    }
    
    // Standard dominant seventh
    if (thirdInterval === 4 && fifthInterval === 7 && seventhInterval === 10) {
        return { quality: 'Dominant 7th', symbol: '7', isNonStandard: false, description: 'Dominant seventh chord' };
    }
    
    // Half-diminished seventh
    if (thirdInterval === 3 && fifthInterval === 6 && seventhInterval === 10) {
        return { quality: 'half-diminished 7th', symbol: 'm7♭5', isNonStandard: false, description: 'Half-diminished seventh' };
    }
    
    // Diminished seventh
    if (thirdInterval === 3 && fifthInterval === 6 && seventhInterval === 9) {
        return { quality: 'diminished 7th', symbol: '°7', isNonStandard: false, description: 'Diminished seventh chord' };
    }
    
    // For any other intervals in diminished scales, default to dominant 7th
    // This prevents complex exotic chord names
    return { quality: 'Dominant 7th', symbol: '7', isNonStandard: false, description: 'Dominant seventh chord' };
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
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
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
    
    // Handle sus chord types
    if (quality === 'sus2') {
        return numeral + 'sus2';
    } else if (quality === 'sus4') {
        return numeral + 'sus4';
    } else if (quality === 'sus4seventh') {
        return numeral + '7sus4';
    } else if (quality.includes('minor') || quality.includes('diminished')) {
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
    
    // Enhanced detection patterns with more comprehensive matching
    
    // Diminished scales (8-note scales) - CHECK FIRST
    if (scaleType.includes('diminished') || scaleType.includes('dim') || 
        (scale && scale.length === 8)) {
        return getDiminishedScaleChords(scale);
    }
    
    // Blues scales (6-note scales) - CHECK BEFORE PENTATONIC
    if (scaleType === 'blues' || scaleType === 'blues-major' || scaleType === 'blues-minor' || 
        scaleType.includes('blues') || 
        (scale && scale.length === 6 && isBluesPattern(scale, scale[0]))) {
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

function getDiminishedScaleChords(scale) {
    console.log('getDiminishedScaleChords called with scale:', scale);
    
    if (!scale || scale.length !== 8) {
        console.log('Invalid scale length:', scale ? scale.length : 'null');
        return { chords: [] };
    }
    
    const getChromaticIndex = (note) => {
        const noteToIndex = {
            'C': 0, 'B#': 0,
            'C#': 1, 'Db': 1,
            'D': 2,
            'D#': 3, 'Eb': 3,
            'E': 4, 'Fb': 4,
            'F': 5, 'E#': 5,
            'F#': 6, 'Gb': 6,
            'G': 7,
            'G#': 8, 'Ab': 8,
            'A': 9,
            'A#': 10, 'Bb': 10,
            'B': 11, 'Cb': 11
        };
        return noteToIndex[note] !== undefined ? noteToIndex[note] : -1;
    };

    // Determine if we should use sharps or flats based on the root note
    const root = scale[0];
    const flatKeys = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
    const useFlats = flatKeys.includes(root) || root.includes('b');

    // Convert scale to chromatic indices for analysis
    const scaleIndices = scale.map(note => getChromaticIndex(note));
    console.log('Scale indices:', scaleIndices);
    console.log('Scale notes mapped:', scale.map((note, i) => `${note} -> ${scaleIndices[i]}`));
    
    // Check for any invalid notes
    const invalidNotes = scaleIndices.filter(index => index === -1);
    if (invalidNotes.length > 0) {
        console.log('Found invalid notes! Indices:', invalidNotes);
        return { chords: [] };
    }
    
    // Find all possible triads and seventh chords by checking every combination
    const majorTriads = [];
    const dominantSevenths = [];
    const diminishedTriads = [];
    const diminishedSevenths = [];
    
    // Check all possible chord combinations from the scale
    for (let rootIdx = 0; rootIdx < scale.length; rootIdx++) {
        const chordRoot = scale[rootIdx];
        const rootChromatic = scaleIndices[rootIdx];
        
        // Find all possible thirds and fifths for this root
        for (let thirdIdx = 0; thirdIdx < scale.length; thirdIdx++) {
            if (thirdIdx === rootIdx) continue;
            
            const third = scale[thirdIdx];
            const thirdChromatic = scaleIndices[thirdIdx];
            const thirdInterval = (thirdChromatic - rootChromatic + 12) % 12;
            
            for (let fifthIdx = 0; fifthIdx < scale.length; fifthIdx++) {
                if (fifthIdx === rootIdx || fifthIdx === thirdIdx) continue;
                
                const fifth = scale[fifthIdx];
                const fifthChromatic = scaleIndices[fifthIdx];
                const fifthInterval = (fifthChromatic - rootChromatic + 12) % 12;
                
                // Check for major triad (4, 7)
                if (thirdInterval === 4 && fifthInterval === 7) {
                    if (!majorTriads.some(chord => chord.root === chordRoot)) {
                        majorTriads.push({
                            root: chordRoot,
                            chord: chordRoot,
                            notes: [chordRoot, third, fifth],
                            scaleIndex: rootIdx
                        });
                    }
                }
                
                // Check for diminished triad (3, 6)
                if (thirdInterval === 3 && fifthInterval === 6) {
                    if (!diminishedTriads.some(chord => chord.root === chordRoot)) {
                        diminishedTriads.push({
                            root: chordRoot,
                            chord: chordRoot + '°',
                            notes: [chordRoot, third, fifth],
                            scaleIndex: rootIdx
                        });
                    }
                }
                
                // Check for dominant 7th and diminished 7th chords
                for (let seventhIdx = 0; seventhIdx < scale.length; seventhIdx++) {
                    if (seventhIdx === rootIdx || seventhIdx === thirdIdx || seventhIdx === fifthIdx) continue;
                    
                    const seventh = scale[seventhIdx];
                    const seventhChromatic = scaleIndices[seventhIdx];
                    const seventhInterval = (seventhChromatic - rootChromatic + 12) % 12;
                    
                    // Check for dominant 7th (4, 7, 10)
                    if (thirdInterval === 4 && fifthInterval === 7 && seventhInterval === 10) {
                        if (!dominantSevenths.some(chord => chord.root === chordRoot)) {
                            dominantSevenths.push({
                                root: chordRoot,
                                chord: chordRoot + '7',
                                notes: [chordRoot, third, fifth, seventh],
                                scaleIndex: rootIdx
                            });
                        }
                    }
                    
                    // Check for diminished 7th (3, 6, 9)
                    if (thirdInterval === 3 && fifthInterval === 6 && seventhInterval === 9) {
                        if (!diminishedSevenths.some(chord => chord.root === chordRoot)) {
                            diminishedSevenths.push({
                                root: chordRoot,
                                chord: chordRoot + '°7',
                                notes: [chordRoot, third, fifth, seventh],
                                scaleIndex: rootIdx
                            });
                        }
                    }
                }
            }
        }
    }
    
    console.log('Found chords:', {
        majorTriads: majorTriads.length,
        dominantSevenths: dominantSevenths.length,
        diminishedTriads: diminishedTriads.length,
        diminishedSevenths: diminishedSevenths.length
    });
    
    // Sort chords by scale degree (scaleIndex) for proper ordering
    const sortByScaleIndex = (a, b) => a.scaleIndex - b.scaleIndex;
    
    majorTriads.sort(sortByScaleIndex);
    dominantSevenths.sort(sortByScaleIndex);
    diminishedTriads.sort(sortByScaleIndex);
    diminishedSevenths.sort(sortByScaleIndex);
    
    // Fix enharmonic spelling for chord names based on key signature
    const fixEnharmonicSpelling = (chordName) => {
        if (useFlats) {
            return chordName
                .replace(/C#/g, 'Db')
                .replace(/D#/g, 'Eb')
                .replace(/F#/g, 'Gb')
                .replace(/G#/g, 'Ab')
                .replace(/A#/g, 'Bb');
        }
        return chordName;
    };
    
    // Apply enharmonic fixes to all chord arrays
    majorTriads.forEach(chord => chord.chord = fixEnharmonicSpelling(chord.chord));
    diminishedTriads.forEach(chord => chord.chord = fixEnharmonicSpelling(chord.chord));
    dominantSevenths.forEach(chord => chord.chord = fixEnharmonicSpelling(chord.chord));
    diminishedSevenths.forEach(chord => chord.chord = fixEnharmonicSpelling(chord.chord));
    
    // Build the result structure
    const result = {
        chords: []
    };
    
    // Add diminished triads first if found
    if (diminishedTriads.length > 0) {
        result.chords.push({
                type: 'Diminished Triads',
            description: `${diminishedTriads.length} diminished triads found in the scale`,
            chords: diminishedTriads.map(c => c.chord)
        });
    }
    
    // Add major triads if found (without emphasis to match other chord colors)
    if (majorTriads.length > 0) {
        result.chords.push({
                type: 'Major Triads',
            description: `${majorTriads.length} major triads found in the diminished scale`,
            chords: majorTriads.map(c => c.chord)
        });
    }
    
    // Add dominant sevenths if found
    if (dominantSevenths.length > 0) {
        result.chords.push({
            type: 'Dominant 7th Chords',
            description: `${dominantSevenths.length} dominant 7th chords found in the diminished scale`,
            chords: dominantSevenths.map(c => c.chord)
        });
    }
    
    // Add diminished sevenths if found
    if (diminishedSevenths.length > 0) {
        result.chords.push({
            type: 'Diminished 7th Chords',
            description: `${diminishedSevenths.length} diminished 7th chords found in the scale`,
            chords: diminishedSevenths.map(c => c.chord)
        });
    }
    
    // Add theoretical information
    result.chords.push({
        type: 'Harmonic Analysis',
        description: 'Diminished scales create symmetrical harmonic patterns with multiple chord types',
        chords: [
            'Contains both W-H and H-W interval patterns',
            'Creates 4 major triads and 4 dominant 7th chords',
            'Multiple diminished chord possibilities',
            'Excellent for chromatic harmony and jazz improvisation'
        ]
    });
    
    return result;
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

/**
 * Get enharmonic equivalent for a note
 * @param {string} note - The note to find enharmonic equivalent for
 * @returns {string|null} - The enharmonic equivalent or null if none
 */
function getEnharmonicEquivalent(note) {
    const enharmonicMap = {
        // Double accidentals to natural notes
        'B#': 'C',
        'C##': 'D', 
        'D##': 'E',
        'E#': 'F',
        'F##': 'G',
        'G##': 'A',
        'A##': 'B',
        'Cb': 'B',
        'Dbb': 'C',
        'Ebb': 'D',
        'Fb': 'E',
        'Gbb': 'F',
        'Abb': 'G',
        'Bbb': 'A',
        
        // Single accidentals (bidirectional)
        'C#': 'Db',
        'Db': 'C#',
        'D#': 'Eb',
        'Eb': 'D#',
        'F#': 'Gb',
        'Gb': 'F#',
        'G#': 'Ab',
        'Ab': 'G#',
        'A#': 'Bb',
        'Bb': 'A#'
    };
    
    return enharmonicMap[note] || null;
}

/**
 * Get enharmonic equivalent for an interval
 * @param {string} interval - The interval to find enharmonic equivalent for
 * @returns {string|null} - The enharmonic equivalent or null if none
 */
function getIntervalEnharmonicEquivalent(interval) {
    const intervalEnharmonicMap = {
        // Double accidentals to simpler equivalents
        'bb7': '6',
        '##1': '2', 
        '##2': '3',
        '##4': '5',
        '##5': '6',
        '##6': '7',
        '#7': '1',
        'bb2': '1',
        'bb3': '2',
        'bb4': '3',
        'bb5': '4',
        'bb6': '5',
        
        // Augmented/diminished equivalents
        '#4': 'b5',
        'b5': '#4',
        '#1': 'b2',
        'b2': '#1',
        '#2': 'b3',
        'b3': '#2',
        'b4': '3',    // Diminished fourth = Major third
        '#3': '4',    // Augmented third = Perfect fourth
        '#5': 'b6',
        'b6': '#5',
        '#6': 'b7',
        'b7': '#6'
    };
    
    return intervalEnharmonicMap[interval] || null;
}

/**
 * Get practical spelling tooltip for notes and intervals
 * @param {string} value - The note or interval
 * @param {string} type - 'note' or 'interval'
 * @returns {string|null} - Tooltip text or null if no practical spelling needed
 */
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

function calculateSixthChords(scale, scaleType = 'major', category = null) {
    if (!scale || scale.length < 6) {
        return [];
    }
    
    // Only calculate 6th chords for major modes
    if (scaleType !== 'major' || !category || category !== 'major-modes') {
        return [];
    }
    
    const sixthChords = [];
    
    // Only build 6th chords on degrees that naturally have a major 6th interval
    // In major scale: I6, ii6, IV6, V6 (degrees 1, 2, 4, 5)
    const sixthChordDegrees = [0, 1, 3, 4]; // I, ii, IV, V (0-indexed)
    
    sixthChordDegrees.forEach(i => {
        const root = scale[i];
        
        // Calculate scale degrees for chord tones
        const thirdIndex = (i + 2) % scale.length;
        const fifthIndex = (i + 4) % scale.length;
        const sixthIndex = (i + 5) % scale.length; // 6th is the same as 13th but simpler
        
        const third = scale[thirdIndex];
        const fifth = scale[fifthIndex];
        const sixth = scale[sixthIndex];
        
        // Calculate intervals from the chord root
        let thirdInterval = getIntervalBetweenNotes(root, third);
        let fifthInterval = getIntervalBetweenNotes(root, fifth);
        let sixthInterval = getIntervalBetweenNotes(root, sixth);
        
        // Fix octave wrapping issues
        while (thirdInterval > 6) thirdInterval -= 12;
        while (thirdInterval < 0) thirdInterval += 12;
        while (fifthInterval > 11) fifthInterval -= 12;
        while (fifthInterval < 4) fifthInterval += 12;
        while (sixthInterval > 11) sixthInterval -= 12;
        while (sixthInterval < 8) sixthInterval += 12;
        
        // Analyze the 6th chord
        const chordAnalysis = analyzeSixthChord(thirdInterval, fifthInterval, sixthInterval);
        
        sixthChords.push({
            degree: i + 1,
            roman: getRomanNumeral(i + 1, chordAnalysis.quality),
            root: root,
            notes: [root, third, fifth, sixth],
            quality: chordAnalysis.quality,
            symbol: chordAnalysis.symbol,
            name: `${root}${chordAnalysis.symbol}`,
            intervals: [thirdInterval, fifthInterval, sixthInterval],
            function: getChordFunction(i + 1, scaleType),
            isNonStandard: chordAnalysis.isNonStandard || false,
            description: chordAnalysis.description
        });
    });
    
    return sixthChords;
}

function analyzeSixthChord(thirdInterval, fifthInterval, sixthInterval) {
    const quality = thirdInterval === 4 ? 'Major' : 'minor';
    const symbol = thirdInterval === 4 ? '6' : 'm6';
    return { quality, symbol };
}

function calculateSus2Chords(scale, scaleType = 'major', category = null) {
    if (!scale || scale.length < 7) return [];
    
    // Only calculate sus2 chords for major modes
    if (scaleType !== 'major') return [];
    
    // Sus2 chords are typically found on degrees I, ii, IV, V, vi in major
    const sus2Degrees = [1, 2, 4, 5, 6];
    const chords = [];
    
    for (const degree of sus2Degrees) {
        const rootIndex = degree - 1;
        const root = scale[rootIndex];
        
        // Calculate sus2 chord: root + 2nd + 5th
        const secondIndex = (rootIndex + 1) % scale.length;
        const fifthIndex = (rootIndex + 4) % scale.length;
        
        const second = scale[secondIndex];
        const fifth = scale[fifthIndex];
        
        const notes = [root, second, fifth];
        
        // Calculate intervals from root
        const secondInterval = getIntervalBetweenNotes(root, second);
        const fifthInterval = getIntervalBetweenNotes(root, fifth);
        
        const analysis = analyzeSus2Chord(secondInterval, fifthInterval);
        const function_ = getChordFunction(degree, scaleType);
        const color = getChordColor(function_, analysis.quality);
        
        chords.push({
            degree: degree,
            roman: getRomanNumeral(degree, 'sus2'),
            root: root,
            name: `${root}${analysis.symbol}`,
            notes: notes,
            quality: analysis.quality,
            symbol: `${root}${analysis.symbol}`,
            description: `${analysis.quality} sus2 chord`,
            intervals: ['1', '2', '5'],
            function: function_,
            color: color
        });
    }
    
    return chords;
}

function analyzeSus2Chord(secondInterval, fifthInterval) {
    // Sus2 chords are neither major nor minor, but we can categorize by fifth
    const quality = fifthInterval === 7 ? 'Sus2' : 'Sus2♭5';
    const symbol = fifthInterval === 7 ? 'sus2' : 'sus2♭5';
    return { quality, symbol };
}

function calculateSus4Chords(scale, scaleType = 'major', category = null) {
    if (!scale || scale.length < 7) return [];
    
    // Only calculate sus4 chords for major modes
    if (scaleType !== 'major') return [];
    
    // Sus4 chords are typically found on degrees I, ii, iii, V, vi in major
    const sus4Degrees = [1, 2, 3, 5, 6];
    const chords = [];
    
    for (const degree of sus4Degrees) {
        const rootIndex = degree - 1;
        const root = scale[rootIndex];
        
        // Calculate sus4 chord: root + 4th + 5th
        const fourthIndex = (rootIndex + 3) % scale.length;
        const fifthIndex = (rootIndex + 4) % scale.length;
        
        const fourth = scale[fourthIndex];
        const fifth = scale[fifthIndex];
        
        const notes = [root, fourth, fifth];
        
        // Calculate intervals from root
        const fourthInterval = getIntervalBetweenNotes(root, fourth);
        const fifthInterval = getIntervalBetweenNotes(root, fifth);
        
        const analysis = analyzeSus4Chord(fourthInterval, fifthInterval);
        const function_ = getChordFunction(degree, scaleType);
        const color = getChordColor(function_, analysis.quality);
        
        chords.push({
            degree: degree,
            roman: getRomanNumeral(degree, 'sus4'),
            root: root,
            name: `${root}${analysis.symbol}`,
            notes: notes,
            quality: analysis.quality,
            symbol: `${root}${analysis.symbol}`,
            description: `${analysis.quality} sus4 chord`,
            intervals: ['1', '4', '5'],
            function: function_,
            color: color
        });
    }
    
    return chords;
}

function analyzeSus4Chord(fourthInterval, fifthInterval) {
    // Sus4 chords are neither major nor minor, but we can categorize by fifth
    const quality = fifthInterval === 7 ? 'Sus4' : 'Sus4♭5';
    const symbol = fifthInterval === 7 ? 'sus4' : 'sus4♭5';
    return { quality, symbol };
}

function calculateSus4SeventhChords(scale, scaleType = 'major', category = null) {
    if (!scale || scale.length < 7) return [];
    
    // Only calculate 7sus4 chords for major modes
    if (scaleType !== 'major') return [];
    
    // 7sus4 chords are typically found on degrees I, ii, iii, V, vi in major
    const sus4SeventhDegrees = [1, 2, 3, 5, 6];
    const chords = [];
    
    for (const degree of sus4SeventhDegrees) {
        const rootIndex = degree - 1;
        const root = scale[rootIndex];
        
        // Calculate 7sus4 chord: root + 4th + 5th + 7th
        const fourthIndex = (rootIndex + 3) % scale.length;
        const fifthIndex = (rootIndex + 4) % scale.length;
        const seventhIndex = (rootIndex + 6) % scale.length;
        
        const fourth = scale[fourthIndex];
        const fifth = scale[fifthIndex];
        const seventh = scale[seventhIndex];
        
        const notes = [root, fourth, fifth, seventh];
        
        // Calculate intervals from root
        const fourthInterval = getIntervalBetweenNotes(root, fourth);
        const fifthInterval = getIntervalBetweenNotes(root, fifth);
        const seventhInterval = getIntervalBetweenNotes(root, seventh);
        
        const analysis = analyzeSus4SeventhChord(fourthInterval, fifthInterval, seventhInterval);
        const function_ = getChordFunction(degree, scaleType);
        const color = getChordColor(function_, analysis.quality);
        
        chords.push({
            degree: degree,
            roman: getRomanNumeral(degree, 'sus4seventh'),
            root: root,
            name: `${root}${analysis.symbol}`,
            notes: notes,
            quality: analysis.quality,
            symbol: `${root}${analysis.symbol}`,
            description: `${analysis.quality} sus4 seventh chord`,
            intervals: ['1', '4', '5', analysis.seventhInterval],
            function: function_,
            color: color
        });
    }
    
    return chords;
}

function analyzeSus4SeventhChord(fourthInterval, fifthInterval, seventhInterval) {
    let quality, symbol, seventhIntervalName;
    
    if (seventhInterval === 11) {
        // Major 7th
        quality = 'Major 7';
        symbol = 'maj7sus4';
        seventhIntervalName = '7';
    } else if (seventhInterval === 10) {
        // Minor 7th (dominant)
        quality = 'Dominant 7';
        symbol = '7sus4';
        seventhIntervalName = '♭7';
    } else {
        // Other seventh intervals
        quality = 'Sus4 7th';
        symbol = '7sus4';
        seventhIntervalName = '♭7';
    }
    
    // Adjust for altered fifths
    if (fifthInterval !== 7) {
        symbol += '♭5';
        quality += '♭5';
    }
    
    return { quality, symbol, seventhInterval: seventhIntervalName };
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
    calculateNinthChords,
    calculateEleventhChords,
    calculateThirteenthChords,
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
    getChromaticScaleChords,
    getEnharmonicEquivalent,
    getIntervalEnharmonicEquivalent,
    getEnharmonicTooltip,
    getChordIntervals,
    calculateSixthChords,
    analyzeSixthChord,
    calculateSus2Chords,
    analyzeSus2Chord,
    calculateSus4Chords,
    analyzeSus4Chord,
    calculateSus4SeventhChords,
    analyzeSus4SeventhChord
};