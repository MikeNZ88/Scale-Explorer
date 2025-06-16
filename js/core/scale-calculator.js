// Scale calculation functions for music theory
// Depends on: constants.js

// Note spelling functions
function getProperNoteSpelling(noteIndex, key, scaleType = 'major') {
    return getChromatic(noteIndex, key, scaleType);
}

// Main scale calculation functions
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
    
    // Debug logging for mixolydian scales
    if (scaleType === 'mixolydian') {
        console.log('calculateScaleWithDegrees called with:', { root, formula, scaleType });
    }
    
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
    if (scaleType === 'chromatic') {
        return calculateChromaticScale(root);
    }
    
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
        
        // Debug logging for mixolydian scales
        if (scaleType === 'mixolydian') {
            console.log(`Step ${i + 1}: chromatic=${currentChromaticIndex}, scaleDegree=${scaleDegreeIndex}, baseName=${baseNoteName}, baseChromaticIndex=${baseNoteChromatic}`);
        }
        
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
        
        if (scaleType === 'mixolydian') {
            console.log(`  -> noteName: ${noteName}`);
        }
        
        scale.push(noteName);
    }
    
    if (scaleType === 'mixolydian') {
        console.log('Final scale:', scale);
    }
    
    return scale;
}

function calculatePentatonicScale(root, formula, rootNoteIndex, rootChromaticIndex, noteNames, noteToIndex, scaleType) {
    // Simpler approach: Just use the formula directly with proper key signature spelling
    const scale = [root];
    let currentChromaticIndex = rootChromaticIndex;
    
    // Determine spelling convention based on the root note and scale type
    const flatKeys = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
    const sharpKeys = ['G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
    
    let spellingConvention;
    
    // Special handling for blues scales - always prefer flats for altered notes
    if (formula.length === 6 || scaleType === 'blues' || scaleType.includes('blues')) {
        spellingConvention = 'flat';
    } else if (flatKeys.includes(root)) {
        spellingConvention = 'flat';
    } else if (sharpKeys.includes(root)) {
        spellingConvention = 'sharp';
    } else {
        // For C and enharmonic equivalents, default to sharp for pentatonic, flat for blues
        spellingConvention = (formula.length === 6) ? 'flat' : 'sharp';
    }
    
    // Chromatic scales with consistent spelling
    const sharpChromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const flatChromatic = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    
    const chromatic = spellingConvention === 'flat' ? flatChromatic : sharpChromatic;
    
    // Calculate each note using the formula
    for (let i = 0; i < formula.length - 1; i++) {
        currentChromaticIndex = (currentChromaticIndex + formula[i]) % 12;
        let noteName = chromatic[currentChromaticIndex];
        
        // Additional cleanup for problematic enharmonic spellings
        if (noteName === 'B#') noteName = 'C';
        if (noteName === 'E#') noteName = 'F';
        if (noteName === 'Cb') noteName = 'B';
        if (noteName === 'Fb') noteName = 'E';
        
        scale.push(noteName);
    }
    
    return scale;
}

function calculateBluesScale(root, formula, rootNoteIndex, rootChromaticIndex, noteNames, noteToIndex) {
    // Blues scales should share the same note collection with consistent spelling
    // Blues Major: 1, 2, b3, 3, 5, 6 
    // Blues Minor: 1, b3, 4, b5, 5, b7 (from the 6th degree of blues major)
    
    const scale = [root];
    let currentChromaticIndex = rootChromaticIndex;
    
    // First, determine if this is blues major or minor based on the formula
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
        // For blues major, calculate normally with flat-friendly spelling
        const flatChromatic = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
        
        for (let i = 0; i < formula.length - 1; i++) {
            currentChromaticIndex = (currentChromaticIndex + formula[i]) % 12;
            let noteName = flatChromatic[currentChromaticIndex];
            
            // Clean up problematic enharmonic spellings
            if (noteName === 'B#') noteName = 'C';
            if (noteName === 'E#') noteName = 'F';
            if (noteName === 'Cb') noteName = 'B';
            if (noteName === 'Fb') noteName = 'E';
            
            scale.push(noteName);
        }
    } else {
        // For blues minor, we need to inherit spelling from the parent blues major
        // Find the parent blues major scale (blues minor is 9 semitones up from blues major)
        
        // Calculate what the blues major root would be (9 semitones down = 3 semitones up from blues minor root)
        const bluesMajorRootIndex = (rootChromaticIndex + 3) % 12;
        const bluesMajorFormula = [2, 1, 1, 3, 2, 3]; // Blues major formula
        
        // Calculate the full blues major scale with consistent flat spelling
        const flatChromatic = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
        const bluesMajorNotes = [flatChromatic[bluesMajorRootIndex]];
        
        let bluesMajorIndex = bluesMajorRootIndex;
        for (let i = 0; i < bluesMajorFormula.length - 1; i++) {
            bluesMajorIndex = (bluesMajorIndex + bluesMajorFormula[i]) % 12;
            let noteName = flatChromatic[bluesMajorIndex];
            
            // Clean up problematic enharmonic spellings
            if (noteName === 'B#') noteName = 'C';
            if (noteName === 'E#') noteName = 'F';
            if (noteName === 'Cb') noteName = 'B';
            if (noteName === 'Fb') noteName = 'E';
            
            bluesMajorNotes.push(noteName);
        }
        
        // Now extract the blues minor notes starting from the 6th degree (index 5) of blues major
        // Blues minor uses: 6th, 1st, 2nd, 3rd, 4th, 5th degrees of blues major
        const bluesMinorIndices = [5, 0, 1, 2, 3, 4]; // Indices in blues major scale
        
        for (let i = 0; i < bluesMinorIndices.length; i++) {
            const noteIndex = bluesMinorIndices[i];
            if (i === 0) {
                // First note should be the root we were given
                scale[0] = root;
            } else {
                scale.push(bluesMajorNotes[noteIndex]);
            }
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

function calculateChromaticScale(root) {
    // Chromatic scale interval formula: 1 - ♭2 - 2 - ♭3 - 3 - 4 - ♭5 - 5 - ♭6 - 6 - ♭7 - 7 - 8
    // This creates a consistent flat-based spelling for all chromatic scales
    
    const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const noteToIndex = {
        'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11,
        'C#': 1, 'Db': 1, 'D#': 3, 'Eb': 3, 'F#': 6, 'Gb': 6,
        'G#': 8, 'Ab': 8, 'A#': 10, 'Bb': 10,
        'B#': 0, 'Cb': 11, 'E#': 5, 'Fb': 4
    };
    
    // Get root note information
    const rootNoteName = root.charAt(0);
    const rootNoteIndex = noteNames.indexOf(rootNoteName);
    const rootChromaticIndex = noteToIndex[root];
    
    if (rootNoteIndex === -1 || rootChromaticIndex === undefined) {
        console.warn('Invalid root note:', root);
        return [];
    }
    
    // Chromatic scale degree pattern (which scale degree each chromatic note represents)
    // 1, ♭2, 2, ♭3, 3, 4, ♭5, 5, ♭6, 6, ♭7, 7
    const chromaticDegreePattern = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6]; // 0-indexed scale degrees
    
    const scale = [root]; // Start with root
    
    for (let chromaticStep = 1; chromaticStep < 12; chromaticStep++) {
        // Calculate target chromatic position
        const targetChromaticIndex = (rootChromaticIndex + chromaticStep) % 12;
        
        // Get the scale degree this chromatic step represents
        const scaleDegreeIndex = chromaticDegreePattern[chromaticStep];
        const targetLetterIndex = (rootNoteIndex + scaleDegreeIndex) % 7;
        const targetLetter = noteNames[targetLetterIndex];
        
        // Get natural chromatic position of target letter
        const naturalChromaticIndex = noteToIndex[targetLetter];
        
        // Calculate accidental needed
        const chromaticDifference = (targetChromaticIndex - naturalChromaticIndex + 12) % 12;
        
        let noteName;
        if (chromaticDifference === 0) {
            noteName = targetLetter; // Natural
        } else if (chromaticDifference === 1) {
            noteName = targetLetter + '#'; // Sharp
        } else if (chromaticDifference === 11) {
            noteName = targetLetter + 'b'; // Flat
        } else {
            // This shouldn't happen with proper chromatic scale calculation
            console.warn('Unexpected chromatic difference:', chromaticDifference, 'for', targetLetter);
            noteName = targetLetter;
        }
        
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
    if (scaleType === 'blues') {
        // Blues scales generally prefer flats for altered notes
        chromaticScale = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    } else if (usesSharps) {
        chromaticScale = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
    } else if (usesFlats) {
        chromaticScale = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    } else {
        // Default for C and enharmonic roots
        chromaticScale = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
    }
    
    return chromaticScale[normalizedIndex];
}

function getModeNotes(parentScale, modeIndex, parentFormula, scaleType = 'major') {
    if (!parentScale || !Array.isArray(parentScale) || modeIndex >= parentScale.length) {
        return [];
    }
    
    const modeRoot = parentScale[modeIndex];
    const modeFormula = [...parentFormula.slice(modeIndex), ...parentFormula.slice(0, modeIndex)];
    
    const modeNotes = calculateScale(modeRoot, modeFormula, scaleType);
    return modeNotes;
}

// Export all functions to global scope
window.ScaleCalculator = {
    getProperNoteSpelling,
    calculateScale,
    calculateScaleWithDegrees,
    calculatePentatonicScale,
    calculateBluesScale,
    calculateHybridBluesScale,
    calculateAugmentedScale,
    calculateDiminishedScale,
    calculateChromaticScale,
    getChromatic,
    getModeNotes
}; 