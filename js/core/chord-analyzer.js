/**
 * Chord Analysis Module
 * Comprehensive chord analysis and calculation functions
 */

// Core chord calculation functions
function calculateTriads(scale, scaleType = 'major', category = null) {
    if (!scale || scale.length < 3) {
        return [];
    }
    
    if (!window.PatternDetection.shouldDisplayChords(scaleType, scale.length, category)) {
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
        
        // Calculate intervals from the chord root using the improved function
        let thirdInterval = window.IntervalUtils.getIntervalBetweenNotes(root, third);
        let fifthInterval = window.IntervalUtils.getIntervalBetweenNotes(root, fifth);
        
        // Debug logging for problematic chords
        if (root === 'Db' || root === 'Fb') {
            console.log(`Chord analysis for ${root}:`, {
                root, third, fifth,
                thirdInterval, fifthInterval,
                scaleType
            });
        }
        
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
            roman: window.IntervalUtils.getRomanNumeral(i + 1, chordAnalysis.quality),
            root: root,
            notes: [root, third, fifth],
            quality: chordAnalysis.quality,
            symbol: chordAnalysis.symbol,
            name: `${root}${chordAnalysis.symbol}`,
            intervals: [thirdInterval, fifthInterval],
            function: window.IntervalUtils.getChordFunction(i + 1, scaleType, category),
            isNonStandard: chordAnalysis.isNonStandard,
            description: chordAnalysis.description,
            inversion: chordAnalysis.inversion
        });
    }
    
    return triads;
}

function calculateSeventhChords(scale, scaleType = 'major', category = null) {
    if (!scale || scale.length < 4) {
        return [];
    }
    
    if (!window.PatternDetection.shouldDisplayChords(scaleType, scale.length, category)) {
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
        let thirdInterval = window.IntervalUtils.getIntervalBetweenNotes(root, third);
        let fifthInterval = window.IntervalUtils.getIntervalBetweenNotes(root, fifth);
        let seventhInterval = window.IntervalUtils.getIntervalBetweenNotes(root, seventh);
        
        // Debug logging for problematic chords
        if (root === 'Db' || root === 'Fb') {
            console.log(`7th Chord analysis for ${root}:`, {
                root, third, fifth, seventh,
                thirdInterval, fifthInterval, seventhInterval,
                scaleType
            });
        }
        
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
            roman: window.IntervalUtils.getRomanNumeral(i + 1, chordAnalysis.quality),
            root: root,
            notes: [root, third, fifth, seventh],
            quality: chordAnalysis.quality,
            symbol: chordAnalysis.symbol,
            name: `${root}${chordAnalysis.symbol}`,
            intervals: [thirdInterval, fifthInterval, seventhInterval],
            function: window.IntervalUtils.getChordFunction(i + 1, scaleType, category),
            isNonStandard: chordAnalysis.isNonStandard,
            description: chordAnalysis.description,
            inversion: chordAnalysis.inversion
        });
    }
    
    return seventhChords;
}

// Triad analysis functions
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
    
    // Check for inversions
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
    
    // Better fallback for exotic chords - try to identify meaningful intervals
    const intervalNames = {
        1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: 'b5', 7: '5', 8: '#5', 9: '6', 10: 'b7', 11: '7'
    };
    
    const thirdName = intervalNames[thirdInterval] || thirdInterval;
    const fifthName = intervalNames[fifthInterval] || fifthInterval;
    
    // Try to create a meaningful chord name
    if (thirdInterval === 0) {
        // Power chord (no third)
        return {
            quality: 'power chord',
            symbol: '5',
            isNonStandard: false,
            description: 'Power chord (no third)'
        };
    }
    
    // If it has a recognizable third but unusual fifth
    if (thirdInterval === 3 || thirdInterval === 4) {
        const quality = thirdInterval === 3 ? 'minor' : 'Major';
        const baseSymbol = thirdInterval === 3 ? 'm' : '';
        
        if (fifthInterval === 6) {
            return {
                quality: `${quality} ♭5`,
                symbol: `${baseSymbol}♭5`,
                isNonStandard: false,
                description: `${quality} chord with flattened fifth`
            };
        } else if (fifthInterval === 8) {
            return {
                quality: `${quality} #5`,
                symbol: `${baseSymbol}#5`,
                isNonStandard: false,
                description: `${quality} chord with sharpened fifth`
            };
        }
    }
    
    // Enhanced fallback for melodic minor and complex scales
    if (scaleType === 'melodic-minor' || scaleType.includes('melodic')) {
        // Common melodic minor chord types
        if (thirdInterval === 4 && fifthInterval === 8) {
            return { quality: 'Augmented', symbol: '+', isNonStandard: false, description: 'Augmented triad' };
        }
        if (thirdInterval === 3 && fifthInterval === 6) {
            return { quality: 'diminished', symbol: '°', isNonStandard: false, description: 'Diminished triad' };
        }
    }
    
    // Final fallback - create simple, readable names without complex interval notation
    let baseQuality = 'Unknown';
    let baseSymbol = '';
    
    if (thirdInterval === 4) {
        baseQuality = 'Major';
        baseSymbol = '';
    } else if (thirdInterval === 3) {
        baseQuality = 'minor';
        baseSymbol = 'm';
    } else if (thirdInterval === 2) {
        baseQuality = 'sus2';
        baseSymbol = 'sus2';
    } else if (thirdInterval === 5) {
        baseQuality = 'sus4';
        baseSymbol = 'sus4';
    } else if (thirdInterval === 0) {
        baseQuality = 'power chord';
        baseSymbol = '5';
    }
    
    // Add fifth alteration if needed
    if (fifthInterval === 6 && baseQuality !== 'Unknown') {
        baseSymbol += '♭5';
        baseQuality += ' ♭5';
    } else if (fifthInterval === 8 && baseQuality !== 'Unknown') {
        baseSymbol += '#5';
        baseQuality += ' #5';
    }
    
    // If we still have an unknown chord, use a simple description
    if (baseQuality === 'Unknown') {
        return {
            quality: 'Non-standard',
            symbol: 'alt',
            isNonStandard: true,
            description: 'Non-standard chord structure'
        };
    }
    
    return {
        quality: baseQuality,
        symbol: baseSymbol,
        isNonStandard: baseQuality.includes('Unknown') || baseQuality.includes('Non-standard'),
        description: `${baseQuality} chord`
    };
}

// Seventh chord analysis
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
        return { quality: 'Minor 7 ♭5', symbol: 'm7♭5', isNonStandard: false, description: 'half-diminished' };
    }
    if (thirdInterval === 3 && fifthInterval === 6 && seventhInterval === 9) {
        return { quality: 'diminished 7th', symbol: '°7', isNonStandard: false, description: 'Diminished seventh chord' };
    }
    
    // Minor major seventh (characteristic of harmonic minor)
    if (thirdInterval === 3 && fifthInterval === 7 && seventhInterval === 11) {
        return { quality: 'minor Major 7th', symbol: 'mMaj7', isNonStandard: false, description: 'Minor major seventh' };
    }
    
    // Augmented seventh chords
    if (thirdInterval === 4 && fifthInterval === 8 && seventhInterval === 10) {
        return { quality: 'Augmented 7th', symbol: '+7', isNonStandard: false, description: 'Augmented seventh chord' };
    }
    if (thirdInterval === 4 && fifthInterval === 8 && seventhInterval === 11) {
        return { quality: 'Augmented Major 7th', symbol: '+maj7', isNonStandard: false, description: 'Augmented major seventh chord' };
    }
    
    // Special handling for pentatonic scales
    if (scale.length === 5) {
        return analyzePentatonicSeventhChord(thirdInterval, fifthInterval, seventhInterval, scaleType);
    }
    
    // Special handling for diminished scales
    if (scale.length === 8) {
        return analyzeDiminishedSeventhChord(thirdInterval, fifthInterval, seventhInterval);
    }
    
    // Try to identify the chord based on its triad quality first
    let triadQuality = '';
    let triadSymbol = '';
    
    if (thirdInterval === 4 && fifthInterval === 7) {
        triadQuality = 'Major';
        triadSymbol = '';
    } else if (thirdInterval === 3 && fifthInterval === 7) {
        triadQuality = 'minor';
        triadSymbol = 'm';
    } else if (thirdInterval === 3 && fifthInterval === 6) {
        triadQuality = 'diminished';
        triadSymbol = '°';
    } else if (thirdInterval === 4 && fifthInterval === 8) {
        triadQuality = 'Augmented';
        triadSymbol = '+';
    } else if (thirdInterval === 2 && fifthInterval === 7) {
        triadQuality = 'sus2';
        triadSymbol = 'sus2';
    } else if (thirdInterval === 5 && fifthInterval === 7) {
        triadQuality = 'sus4';
        triadSymbol = 'sus4';
    }
    
    // If we identified the triad, add the seventh
    if (triadQuality) {
        let seventhSymbol = '';
        if (seventhInterval === 11) {
            seventhSymbol = triadSymbol ? `${triadSymbol}maj7` : 'maj7';
        } else if (seventhInterval === 10) {
            seventhSymbol = triadSymbol ? `${triadSymbol}7` : '7';
        } else if (seventhInterval === 9) {
            seventhSymbol = triadSymbol ? `${triadSymbol}6` : '6'; // Diminished seventh is often notated as 6
        }
        
        if (seventhSymbol) {
            return {
                quality: `${triadQuality} 7th`,
                symbol: seventhSymbol,
                isNonStandard: false,
                description: `${triadQuality} seventh chord`
            };
        }
    }
    
    // Fallback for non-standard seventh chords
    return {
        quality: 'Non-standard 7th',
        symbol: 'alt7',
        isNonStandard: true,
        description: 'Non-standard seventh chord'
    };
}

// Helper functions for chord validation and scoring
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

// Inversion detection
function detectTriadInversion(thirdInterval, fifthInterval) {
    // First inversion patterns (bass note is the third of the chord)
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

// Specialized chord analysis for different scale types
function analyzePentatonicChord(thirdInterval, fifthInterval, scaleType) {
    // Pentatonic scales often create open, quartal, and added-tone harmonies
    
    if (thirdInterval === 2 && fifthInterval === 7) {
        return { quality: 'sus2', symbol: 'sus2', isNonStandard: false, description: 'Suspended second (pentatonic)' };
    }
    if (thirdInterval === 5 && fifthInterval === 7) {
        return { quality: 'sus4', symbol: 'sus4', isNonStandard: false, description: 'Suspended fourth (pentatonic)' };
    }
    if (thirdInterval === 0 && fifthInterval === 7) {
        return { quality: 'power chord', symbol: '5', isNonStandard: true, description: 'Power chord (pentatonic)' };
    }
    
    // Get interval names for analysis
    const thirdName = window.IntervalUtils.getIntervalName(thirdInterval);
    const fifthName = window.IntervalUtils.getIntervalName(fifthInterval);
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
    
    // Standard diminished triad (3, 6)
    if (thirdInterval === 3 && fifthInterval === 6) {
        return { quality: 'diminished', symbol: '°', isNonStandard: false, description: 'Diminished triad' };
    }
    
    // Standard augmented triad (4, 8)
    if (thirdInterval === 4 && fifthInterval === 8) {
        return { quality: 'Augmented', symbol: '+', isNonStandard: false, description: 'Augmented triad' };
    }
    
    // For any other exotic intervals in diminished scales, default to diminished
    return { quality: 'diminished', symbol: '°', isNonStandard: false, description: 'Diminished triad' };
}

// Specialized seventh chord analysis
function analyzePentatonicSeventhChord(thirdInterval, fifthInterval, seventhInterval, scaleType) {
    // Pentatonic scales create unique seventh chord qualities
    
    if (thirdInterval === 2 && fifthInterval === 7 && seventhInterval === 10) {
        return { quality: 'sus2 7th', symbol: '7sus2', isNonStandard: false, description: 'Suspended second seventh (pentatonic)' };
    }
    if (thirdInterval === 5 && fifthInterval === 7 && seventhInterval === 10) {
        return { quality: 'sus4 7th', symbol: '7sus4', isNonStandard: false, description: 'Suspended fourth seventh (pentatonic)' };
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
    return { quality: 'Dominant 7th', symbol: '7', isNonStandard: false, description: 'Dominant seventh chord' };
}

// Diminished scale specific functions
function calculateDiminishedScaleTriads(scale, scaleType) {
    if (!scale || scale.length !== 8) {
        return [];
    }
    
    const triads = [];
    
    // For each scale degree, calculate all possible triads
    for (let i = 0; i < scale.length; i++) {
        const root = scale[i];
        
        // Find all possible thirds and fifths from the scale
        const possibleTriads = [];
        
        for (let thirdIdx = 0; thirdIdx < scale.length; thirdIdx++) {
            if (thirdIdx === i) continue;
            
            for (let fifthIdx = 0; fifthIdx < scale.length; fifthIdx++) {
                if (fifthIdx === i || fifthIdx === thirdIdx) continue;
                
                const third = scale[thirdIdx];
                const fifth = scale[fifthIdx];
                
                // Calculate intervals from root
                const thirdInterval = window.IntervalUtils.getIntervalBetweenNotes(root, third);
                const fifthInterval = window.IntervalUtils.getIntervalBetweenNotes(root, fifth);
                
                // Normalize intervals to 0-11 range
                const normalizedThird = ((thirdInterval % 12) + 12) % 12;
                const normalizedFifth = ((fifthInterval % 12) + 12) % 12;
                
                // Check for valid triad intervals
                let quality = '';
                let symbol = '';
                
                // Major triad: Major 3rd (4) + Perfect 5th (7)
                if (normalizedThird === 4 && normalizedFifth === 7) {
                    quality = 'major';
                    symbol = '';
                }
                // Minor triad: Minor 3rd (3) + Perfect 5th (7)
                else if (normalizedThird === 3 && normalizedFifth === 7) {
                    quality = 'minor';
                    symbol = 'm';
                }
                // Diminished triad: Minor 3rd (3) + Diminished 5th (6)
                else if (normalizedThird === 3 && normalizedFifth === 6) {
                    quality = 'diminished';
                    symbol = '°';
                }
                
                if (quality) {
                    possibleTriads.push({
                        root: root,
                        third: third,
                        fifth: fifth,
                        quality: quality,
                        symbol: symbol,
                        name: `${root}${symbol}`,
                        degree: i + 1,
                        intervals: [normalizedThird, normalizedFifth]
                    });
                }
            }
        }
        
        // Add all valid triads for this root
        triads.push(...possibleTriads);
    }
    
    // Remove duplicates based on chord name
    const uniqueTriads = [];
    const seenChords = new Set();
    
    triads.forEach(triad => {
        if (!seenChords.has(triad.name)) {
            seenChords.add(triad.name);
            uniqueTriads.push(triad);
        }
    });
    
    return uniqueTriads;
}

function calculateDiminishedScaleSeventhChords(scale, scaleType) {
    if (!scale || scale.length !== 8) {
        return [];
    }
    
    const seventhChords = [];
    
    // For each scale degree, calculate all possible seventh chords
    for (let i = 0; i < scale.length; i++) {
        const root = scale[i];
        
        // Find all possible thirds, fifths, and sevenths from the scale
        const possibleSeventhChords = [];
        
        for (let thirdIdx = 0; thirdIdx < scale.length; thirdIdx++) {
            if (thirdIdx === i) continue;
            
            for (let fifthIdx = 0; fifthIdx < scale.length; fifthIdx++) {
                if (fifthIdx === i || fifthIdx === thirdIdx) continue;
                
                for (let seventhIdx = 0; seventhIdx < scale.length; seventhIdx++) {
                    if (seventhIdx === i || seventhIdx === thirdIdx || seventhIdx === fifthIdx) continue;
                    
                    const third = scale[thirdIdx];
                    const fifth = scale[fifthIdx];
                    const seventh = scale[seventhIdx];
                    
                    // Calculate intervals from root
                    const thirdInterval = window.IntervalUtils.getIntervalBetweenNotes(root, third);
                    const fifthInterval = window.IntervalUtils.getIntervalBetweenNotes(root, fifth);
                    const seventhInterval = window.IntervalUtils.getIntervalBetweenNotes(root, seventh);
                    
                    // Normalize intervals to 0-11 range
                    const normalizedThird = ((thirdInterval % 12) + 12) % 12;
                    const normalizedFifth = ((fifthInterval % 12) + 12) % 12;
                    const normalizedSeventh = ((seventhInterval % 12) + 12) % 12;
                    
                    // Check for valid seventh chord intervals
                    let quality = '';
                    let symbol = '';
                    
                    // Dominant 7th: Major 3rd (4) + Perfect 5th (7) + Minor 7th (10)
                    if (normalizedThird === 4 && normalizedFifth === 7 && normalizedSeventh === 10) {
                        quality = 'dominant 7th';
                        symbol = '7';
                    }
                    // Minor 7th: Minor 3rd (3) + Perfect 5th (7) + Minor 7th (10)
                    else if (normalizedThird === 3 && normalizedFifth === 7 && normalizedSeventh === 10) {
                        quality = 'minor 7th';
                        symbol = 'm7';
                    }
                    // Diminished 7th: Minor 3rd (3) + Diminished 5th (6) + Diminished 7th (9)
                    else if (normalizedThird === 3 && normalizedFifth === 6 && normalizedSeventh === 9) {
                        quality = 'diminished 7th';
                        symbol = '°7';
                    }
                    // Half-diminished 7th: Minor 3rd (3) + Diminished 5th (6) + Minor 7th (10)
                    else if (normalizedThird === 3 && normalizedFifth === 6 && normalizedSeventh === 10) {
                        quality = 'half-diminished 7th';
                        symbol = 'ø7';
                    }
                    // Major 7th: Major 3rd (4) + Perfect 5th (7) + Major 7th (11)
                    else if (normalizedThird === 4 && normalizedFifth === 7 && normalizedSeventh === 11) {
                        quality = 'major 7th';
                        symbol = 'maj7';
                    }
                    // Minor Major 7th: Minor 3rd (3) + Perfect 5th (7) + Major 7th (11)
                    else if (normalizedThird === 3 && normalizedFifth === 7 && normalizedSeventh === 11) {
                        quality = 'minor major 7th';
                        symbol = 'mMaj7';
                    }
                    
                    if (quality) {
                        possibleSeventhChords.push({
                            root: root,
                            third: third,
                            fifth: fifth,
                            seventh: seventh,
                            quality: quality,
                            symbol: symbol,
                            name: `${root}${symbol}`,
                            notes: [root, third, fifth, seventh],
                            degree: i + 1,
                            intervals: [normalizedThird, normalizedFifth, normalizedSeventh]
                        });
                    }
                }
            }
        }
        
        // Add all valid seventh chords for this root
        seventhChords.push(...possibleSeventhChords);
    }
    
    // Remove duplicates based on chord name
    const uniqueSeventhChords = [];
    const seenChords = new Set();
    
    seventhChords.forEach(chord => {
        if (!seenChords.has(chord.name)) {
            seenChords.add(chord.name);
            uniqueSeventhChords.push(chord);
        }
    });
    
    return uniqueSeventhChords;
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
        let thirdInterval = window.IntervalUtils.getIntervalBetweenNotes(root, third);
        let fifthInterval = window.IntervalUtils.getIntervalBetweenNotes(root, fifth);
        let sixthInterval = window.IntervalUtils.getIntervalBetweenNotes(root, sixth);
        
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
            roman: window.IntervalUtils.getRomanNumeral(i + 1, chordAnalysis.quality),
            root: root,
            notes: [root, third, fifth, sixth],
            quality: chordAnalysis.quality,
            symbol: chordAnalysis.symbol,
            name: `${root}${chordAnalysis.symbol}`,
            intervals: [thirdInterval, fifthInterval, sixthInterval],
            function: window.IntervalUtils.getChordFunction(i + 1, scaleType, category),
            isNonStandard: chordAnalysis.isNonStandard,
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
        const secondInterval = window.IntervalUtils.getIntervalBetweenNotes(root, second);
        const fifthInterval = window.IntervalUtils.getIntervalBetweenNotes(root, fifth);
        
        const analysis = analyzeSus2Chord(secondInterval, fifthInterval);
        const function_ = window.IntervalUtils.getChordFunction(degree, scaleType, category);
        
        chords.push({
            degree: degree,
            roman: window.IntervalUtils.getRomanNumeral(degree, 'sus2'),
            root: root,
            name: `${root}${analysis.symbol}`,
            notes: notes,
            quality: analysis.quality,
            symbol: `${root}${analysis.symbol}`,
            description: `${analysis.quality} sus2 chord`,
            intervals: ['1', '2', '5'],
            function: function_
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
        const fourthInterval = window.IntervalUtils.getIntervalBetweenNotes(root, fourth);
        const fifthInterval = window.IntervalUtils.getIntervalBetweenNotes(root, fifth);
        
        const analysis = analyzeSus4Chord(fourthInterval, fifthInterval);
        const function_ = window.IntervalUtils.getChordFunction(degree, scaleType, category);
        
        chords.push({
            degree: degree,
            roman: window.IntervalUtils.getRomanNumeral(degree, 'sus4'),
            root: root,
            name: `${root}${analysis.symbol}`,
            notes: notes,
            quality: analysis.quality,
            symbol: `${root}${analysis.symbol}`,
            description: `${analysis.quality} sus4 chord`,
            intervals: ['1', '4', '5'],
            function: function_
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
        const fourthInterval = window.IntervalUtils.getIntervalBetweenNotes(root, fourth);
        const fifthInterval = window.IntervalUtils.getIntervalBetweenNotes(root, fifth);
        const seventhInterval = window.IntervalUtils.getIntervalBetweenNotes(root, seventh);
        
        const analysis = analyzeSus4SeventhChord(fourthInterval, fifthInterval, seventhInterval);
        const function_ = window.IntervalUtils.getChordFunction(degree, scaleType, category);
        
        chords.push({
            degree: degree,
            roman: window.IntervalUtils.getRomanNumeral(degree, 'sus4seventh'),
            root: root,
            name: `${root}${analysis.symbol}`,
            notes: notes,
            quality: analysis.quality,
            symbol: `${root}${analysis.symbol}`,
            description: `${analysis.quality} sus4 seventh chord`,
            intervals: ['1', '4', '5', analysis.seventhInterval],
            function: function_
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
        // Minor 7th
        quality = 'Dominant 7';
        symbol = '7sus4';
        seventhIntervalName = 'b7';
    } else {
        // Other sevenths
        quality = 'Sus4 7th';
        symbol = '7sus4';
        seventhIntervalName = 'b7';
    }
    
    return { quality, symbol, seventhInterval: seventhIntervalName };
}

function calculateNinthChords(scale, scaleType = 'major', category = null) {
    if (!scale || scale.length < 7) return [];
    
    const ninthChords = [];
    
    for (let i = 0; i < scale.length; i++) {
        const root = scale[i];
        
        // Calculate scale degrees for chord tones
        const thirdIndex = (i + 2) % scale.length;
        const fifthIndex = (i + 4) % scale.length;
        const seventhIndex = (i + 6) % scale.length;
        const ninthIndex = (i + 1) % scale.length; // 9th is same as 2nd
        
        const third = scale[thirdIndex];
        const fifth = scale[fifthIndex];
        const seventh = scale[seventhIndex];
        const ninth = scale[ninthIndex];
        
        // Calculate intervals from the chord root
        let thirdInterval = window.IntervalUtils.getIntervalBetweenNotes(root, third);
        let fifthInterval = window.IntervalUtils.getIntervalBetweenNotes(root, fifth);
        let seventhInterval = window.IntervalUtils.getIntervalBetweenNotes(root, seventh);
        let ninthInterval = window.IntervalUtils.getIntervalBetweenNotes(root, ninth);
        
        // Fix octave wrapping issues
        while (thirdInterval > 6) thirdInterval -= 12;
        while (thirdInterval < 0) thirdInterval += 12;
        while (fifthInterval > 11) fifthInterval -= 12;
        while (fifthInterval < 4) fifthInterval += 12;
        while (seventhInterval > 11) seventhInterval -= 12;
        while (seventhInterval < 9) seventhInterval += 12;
        while (ninthInterval > 3) ninthInterval += 12;
        while (ninthInterval < 1) ninthInterval += 12;
        
        const chordAnalysis = analyzeNinthChord(thirdInterval, fifthInterval, seventhInterval, ninthInterval);
        
        ninthChords.push({
            degree: i + 1,
            roman: window.IntervalUtils.getRomanNumeral(i + 1, chordAnalysis.quality),
            root: root,
            notes: [root, third, fifth, seventh, ninth],
            quality: chordAnalysis.quality,
            symbol: chordAnalysis.symbol,
            name: `${root}${chordAnalysis.symbol}`,
            intervals: [thirdInterval, fifthInterval, seventhInterval, ninthInterval],
            function: window.IntervalUtils.getChordFunction(i + 1, scaleType, category),
            isNonStandard: chordAnalysis.isNonStandard,
            description: chordAnalysis.description
        });
    }
    
    return ninthChords;
}

function analyzeNinthChord(thirdInterval, fifthInterval, seventhInterval, ninthInterval) {
    let isNonStandard = false;
    let description = '';
    
    // Determine base chord quality
    let baseQuality = '';
    let baseSymbol = '';
    
    if (thirdInterval === 4 && fifthInterval === 7) {
        if (seventhInterval === 11) {
            baseQuality = 'Major';
            baseSymbol = 'maj';
        } else if (seventhInterval === 10) {
            baseQuality = 'Dominant';
            baseSymbol = '';
        }
    } else if (thirdInterval === 3 && fifthInterval === 7) {
        if (seventhInterval === 10) {
            baseQuality = 'Minor';
            baseSymbol = 'm';
        } else if (seventhInterval === 11) {
            baseQuality = 'Minor Major';
            baseSymbol = 'mMaj';
        }
    } else if (thirdInterval === 3 && fifthInterval === 6) {
        if (seventhInterval === 10) {
            baseQuality = 'Half-Diminished';
            baseSymbol = 'm';
        } else {
            isNonStandard = true;
            baseQuality = 'Diminished';
            baseSymbol = '°';
        }
    } else {
        isNonStandard = true;
        baseQuality = 'Non-standard';
        baseSymbol = '';
    }
    
    // Start with the highest extension (9th)
    let symbol = baseSymbol + '9';
    let quality = baseQuality + ' 9th';
    
    // Check for altered ninth
    if (ninthInterval === 1) {
        symbol = baseSymbol + '♭9';
        quality = baseQuality + ' ♭9th';
    } else if (ninthInterval === 3) {
        symbol = baseSymbol + '#9';
        quality = baseQuality + ' #9th';
    }
    
    // Add alterations from highest to lowest: only 5th for 9th chords
    let alterations = [];
    
    // Check for fifth alterations (always last)
    if (fifthInterval === 6) {
        alterations.push('♭5');
    } else if (fifthInterval === 8) {
        alterations.push('#5');
    }
    
    // Add alterations to symbol
    if (alterations.length > 0) {
        symbol += alterations.join('');
    }
    
    // Build quality description properly - specify 9th extension for half-diminished
    if (baseQuality === 'Half-Diminished') {
        // For half-diminished 9th chords, specify the extension
        if (ninthInterval === 1) {
            quality = 'half-diminished ♭9';
        } else if (ninthInterval === 3) {
            quality = 'half-diminished #9';
        } else {
            quality = 'half-diminished 9th';
        }
    } else if (alterations.length > 0) {
        // For other chord types, build description with extensions
        let extensionParts = [];
        
        // Start with the main extension
        if (ninthInterval === 1) {
            extensionParts.push('♭9th');
        } else if (ninthInterval === 3) {
            extensionParts.push('#9th');
        } else {
            extensionParts.push('9th');
        }
        
        // Add fifth alterations
        if (fifthInterval === 6) {
            extensionParts.push('♭5');
        } else if (fifthInterval === 8) {
            extensionParts.push('#5');
        }
        
        quality = `${baseQuality} ${extensionParts.join(' ')}`;
    }
    
    description = `${quality} chord`;
    
    return { quality, symbol, isNonStandard, description };
}

function calculateEleventhChords(scale, scaleType = 'major', category = null) {
    if (!scale || scale.length < 7) return [];
    
    const eleventhChords = [];
    
    for (let i = 0; i < scale.length; i++) {
        const root = scale[i];
        
        // Calculate scale degrees for chord tones
        const thirdIndex = (i + 2) % scale.length;
        const fifthIndex = (i + 4) % scale.length;
        const seventhIndex = (i + 6) % scale.length;
        const ninthIndex = (i + 1) % scale.length;
        const eleventhIndex = (i + 3) % scale.length; // 11th is same as 4th
        
        const third = scale[thirdIndex];
        const fifth = scale[fifthIndex];
        const seventh = scale[seventhIndex];
        const ninth = scale[ninthIndex];
        const eleventh = scale[eleventhIndex];
        
        // Calculate intervals from the chord root
        let thirdInterval = window.IntervalUtils.getIntervalBetweenNotes(root, third);
        let fifthInterval = window.IntervalUtils.getIntervalBetweenNotes(root, fifth);
        let seventhInterval = window.IntervalUtils.getIntervalBetweenNotes(root, seventh);
        let ninthInterval = window.IntervalUtils.getIntervalBetweenNotes(root, ninth);
        let eleventhInterval = window.IntervalUtils.getIntervalBetweenNotes(root, eleventh);
        
        // Fix octave wrapping issues
        while (thirdInterval > 6) thirdInterval -= 12;
        while (thirdInterval < 0) thirdInterval += 12;
        while (fifthInterval > 11) fifthInterval -= 12;
        while (fifthInterval < 4) fifthInterval += 12;
        while (seventhInterval > 11) seventhInterval -= 12;
        while (seventhInterval < 9) seventhInterval += 12;
        while (ninthInterval > 3) ninthInterval += 12;
        while (ninthInterval < 1) ninthInterval += 12;
        while (eleventhInterval > 6) eleventhInterval += 12;
        while (eleventhInterval < 4) eleventhInterval += 12;
        
        const chordAnalysis = analyzeEleventhChord(thirdInterval, fifthInterval, seventhInterval, ninthInterval, eleventhInterval);
        
        eleventhChords.push({
            degree: i + 1,
            roman: window.IntervalUtils.getRomanNumeral(i + 1, chordAnalysis.quality),
            root: root,
            notes: [root, third, fifth, seventh, ninth, eleventh],
            quality: chordAnalysis.quality,
            symbol: chordAnalysis.symbol,
            name: `${root}${chordAnalysis.symbol}`,
            intervals: [thirdInterval, fifthInterval, seventhInterval, ninthInterval, eleventhInterval],
            function: window.IntervalUtils.getChordFunction(i + 1, scaleType, category),
            isNonStandard: chordAnalysis.isNonStandard,
            description: chordAnalysis.description
        });
    }
    
    return eleventhChords;
}

function analyzeEleventhChord(thirdInterval, fifthInterval, seventhInterval, ninthInterval, eleventhInterval) {
    let isNonStandard = false;
    let description = '';
    
    // Determine base chord quality
    let baseQuality = '';
    let baseSymbol = '';
    
    if (thirdInterval === 4 && fifthInterval === 7) {
        if (seventhInterval === 11) {
            baseQuality = 'Major';
            baseSymbol = 'maj';
        } else if (seventhInterval === 10) {
            baseQuality = 'Dominant';
            baseSymbol = '';
        }
    } else if (thirdInterval === 3 && fifthInterval === 7) {
        if (seventhInterval === 10) {
            baseQuality = 'Minor';
            baseSymbol = 'm';
        } else if (seventhInterval === 11) {
            baseQuality = 'Minor Major';
            baseSymbol = 'mMaj';
        }
    } else if (thirdInterval === 3 && fifthInterval === 6) {
        if (seventhInterval === 10) {
            baseQuality = 'Half-Diminished';
            baseSymbol = 'm';
        } else {
            isNonStandard = true;
            baseQuality = 'Diminished';
            baseSymbol = '°';
        }
    } else {
        isNonStandard = true;
        baseQuality = 'Non-standard';
        baseSymbol = '';
    }
    
    // Start with the highest extension (11th)
    let symbol = baseSymbol + '11';
    let quality = baseQuality + ' 11th';
    
    // Check for altered eleventh
    if (eleventhInterval === 6) {
        symbol = baseSymbol + '#11';
        quality = baseQuality + ' #11th';
    } else if (eleventhInterval === 4) {
        symbol = baseSymbol + '♭11';
        quality = baseQuality + ' ♭11th';
    }
    
    // Add alterations from highest to lowest: 9th, then 5th
    let alterations = [];
    
    // Check for altered ninths
    if (ninthInterval === 1) {
        alterations.push('♭9');
    } else if (ninthInterval === 3) {
        alterations.push('#9');
    }
    
    // Check for fifth alterations (always last)
    if (fifthInterval === 6) {
        alterations.push('♭5');
    } else if (fifthInterval === 8) {
        alterations.push('#5');
    }
    
    // Add alterations to symbol
    if (alterations.length > 0) {
        symbol += alterations.join('');
    }
    
    // Build quality description properly - specify 11th extension for half-diminished
    if (baseQuality === 'Half-Diminished') {
        // For half-diminished 11th chords, specify the extension and alterations
        let extensionParts = [];
        
        // Start with 11th extension
        if (eleventhInterval === 6) {
            extensionParts.push('#11th');
        } else if (eleventhInterval === 4) {
            extensionParts.push('♭11th');
        } else {
            extensionParts.push('11th');
        }
        
        // Add 9th alterations
        if (ninthInterval === 1) {
            extensionParts.push('♭9');
        } else if (ninthInterval === 3) {
            extensionParts.push('#9');
        }
        
        quality = `half-diminished ${extensionParts.join(' ')}`;
    } else if (alterations.length > 0) {
        // For other chord types, build description with extensions in descending order
        let extensionParts = [];
        
        // Start with the main extension
        if (eleventhInterval === 6) {
            extensionParts.push('#11th');
        } else if (eleventhInterval === 4) {
            extensionParts.push('♭11th');
        } else {
            extensionParts.push('11th');
        }
        
        // Add alterations in descending order: 9th, then 5th
        if (ninthInterval === 1) {
            extensionParts.push('♭9');
        } else if (ninthInterval === 3) {
            extensionParts.push('#9');
        }
        
        if (fifthInterval === 6) {
            extensionParts.push('♭5');
        } else if (fifthInterval === 8) {
            extensionParts.push('#5');
        }
        
        quality = `${baseQuality} ${extensionParts.join(' ')}`;
    }
    
    description = `${quality} chord`;
    
    return { quality, symbol, isNonStandard, description };
}

function calculateThirteenthChords(scale, scaleType = 'major', category = null) {
    if (!scale || scale.length < 7) return [];
    
    const thirteenthChords = [];
    
    for (let i = 0; i < scale.length; i++) {
        const root = scale[i];
        
        // Calculate scale degrees for chord tones
        const thirdIndex = (i + 2) % scale.length;
        const fifthIndex = (i + 4) % scale.length;
        const seventhIndex = (i + 6) % scale.length;
        const ninthIndex = (i + 1) % scale.length;
        const eleventhIndex = (i + 3) % scale.length;
        const thirteenthIndex = (i + 5) % scale.length; // 13th is same as 6th
        
        const third = scale[thirdIndex];
        const fifth = scale[fifthIndex];
        const seventh = scale[seventhIndex];
        const ninth = scale[ninthIndex];
        const eleventh = scale[eleventhIndex];
        const thirteenth = scale[thirteenthIndex];
        
        // Calculate intervals from the chord root
        let thirdInterval = window.IntervalUtils.getIntervalBetweenNotes(root, third);
        let fifthInterval = window.IntervalUtils.getIntervalBetweenNotes(root, fifth);
        let seventhInterval = window.IntervalUtils.getIntervalBetweenNotes(root, seventh);
        let ninthInterval = window.IntervalUtils.getIntervalBetweenNotes(root, ninth);
        let eleventhInterval = window.IntervalUtils.getIntervalBetweenNotes(root, eleventh);
        let thirteenthInterval = window.IntervalUtils.getIntervalBetweenNotes(root, thirteenth);
        
        // Fix octave wrapping issues
        while (thirdInterval > 6) thirdInterval -= 12;
        while (thirdInterval < 0) thirdInterval += 12;
        while (fifthInterval > 11) fifthInterval -= 12;
        while (fifthInterval < 4) fifthInterval += 12;
        while (seventhInterval > 11) seventhInterval -= 12;
        while (seventhInterval < 9) seventhInterval += 12;
        while (ninthInterval > 3) ninthInterval += 12;
        while (ninthInterval < 1) ninthInterval += 12;
        while (eleventhInterval > 6) eleventhInterval += 12;
        while (eleventhInterval < 4) eleventhInterval += 12;
        while (thirteenthInterval > 10) thirteenthInterval += 12;
        while (thirteenthInterval < 8) thirteenthInterval += 12;
        
        const chordAnalysis = analyzeThirteenthChord(thirdInterval, fifthInterval, seventhInterval, ninthInterval, eleventhInterval, thirteenthInterval);
        
        thirteenthChords.push({
            degree: i + 1,
            roman: window.IntervalUtils.getRomanNumeral(i + 1, chordAnalysis.quality),
            root: root,
            notes: [root, third, fifth, seventh, ninth, eleventh, thirteenth],
            quality: chordAnalysis.quality,
            symbol: chordAnalysis.symbol,
            name: `${root}${chordAnalysis.symbol}`,
            intervals: [thirdInterval, fifthInterval, seventhInterval, ninthInterval, eleventhInterval, thirteenthInterval],
            function: window.IntervalUtils.getChordFunction(i + 1, scaleType, category),
            isNonStandard: chordAnalysis.isNonStandard,
            description: chordAnalysis.description
        });
    }
    
    return thirteenthChords;
}

function analyzeThirteenthChord(thirdInterval, fifthInterval, seventhInterval, ninthInterval, eleventhInterval, thirteenthInterval) {
    let isNonStandard = false;
    let description = '';
    
    // Determine base chord quality
    let baseQuality = '';
    let baseSymbol = '';
    
    if (thirdInterval === 4 && fifthInterval === 7) {
        if (seventhInterval === 11) {
            baseQuality = 'Major';
            baseSymbol = 'maj';
        } else if (seventhInterval === 10) {
            baseQuality = 'Dominant';
            baseSymbol = '';
        }
    } else if (thirdInterval === 3 && fifthInterval === 7) {
        if (seventhInterval === 10) {
            baseQuality = 'Minor';
            baseSymbol = 'm';
        } else if (seventhInterval === 11) {
            baseQuality = 'Minor Major';
            baseSymbol = 'mMaj';
        }
    } else if (thirdInterval === 3 && fifthInterval === 6) {
        if (seventhInterval === 10) {
            baseQuality = 'Half-Diminished';
            baseSymbol = 'm';
        } else {
            isNonStandard = true;
            baseQuality = 'Diminished';
            baseSymbol = '°';
        }
    } else {
        isNonStandard = true;
        baseQuality = 'Non-standard';
        baseSymbol = '';
    }
    
    // Start with the highest extension (13th)
    let symbol = baseSymbol + '13';
    let quality = baseQuality + ' 13th';
    
    // Check for altered thirteenth
    if (thirteenthInterval === 8) {
        symbol = baseSymbol + '♭13';
        quality = baseQuality + ' ♭13th';
    } else if (thirteenthInterval === 10) {
        symbol = baseSymbol + '#13';
        quality = baseQuality + ' #13th';
    }
    
    // Add alterations from highest to lowest: 11th, then 9th, then 5th
    let alterations = [];
    
    // Check for altered elevenths
    if (eleventhInterval === 6) {
        alterations.push('#11');
    } else if (eleventhInterval === 4) {
        alterations.push('♭11');
    }
    
    // Check for altered ninths
    if (ninthInterval === 1) {
        alterations.push('♭9');
    } else if (ninthInterval === 3) {
        alterations.push('#9');
    }
    
    // Check for fifth alterations (always last)
    if (fifthInterval === 6) {
        alterations.push('♭5');
    } else if (fifthInterval === 8) {
        alterations.push('#5');
    }
    
    // Add alterations to symbol
    if (alterations.length > 0) {
        symbol += alterations.join('');
    }
    
    // Build quality description properly - specify 13th extension for half-diminished
    if (baseQuality === 'Half-Diminished') {
        // For half-diminished 13th chords, specify the extension and alterations
        let extensionParts = [];
        
        // Start with 13th extension
        if (thirteenthInterval === 8) {
            extensionParts.push('♭13th');
        } else if (thirteenthInterval === 10) {
            extensionParts.push('#13th');
        } else {
            extensionParts.push('13th');
        }
        
        // Add 11th alterations
        if (eleventhInterval === 6) {
            extensionParts.push('#11');
        } else if (eleventhInterval === 4) {
            extensionParts.push('♭11');
        }
        
        // Add 9th alterations
        if (ninthInterval === 1) {
            extensionParts.push('♭9');
        } else if (ninthInterval === 3) {
            extensionParts.push('#9');
        }
        
        quality = `half-diminished ${extensionParts.join(' ')}`;
    } else if (alterations.length > 0) {
        // For other chord types, build description with extensions in descending order
        let extensionParts = [];
        
        // Start with the main extension
        if (thirteenthInterval === 8) {
            extensionParts.push('♭13th');
        } else if (thirteenthInterval === 10) {
            extensionParts.push('#13th');
        } else {
            extensionParts.push('13th');
        }
        
        // Add alterations in descending order: 11th, 9th, then 5th
        if (eleventhInterval === 6) {
            extensionParts.push('#11');
        } else if (eleventhInterval === 4) {
            extensionParts.push('♭11');
        }
        
        if (ninthInterval === 1) {
            extensionParts.push('♭9');
        } else if (ninthInterval === 3) {
            extensionParts.push('#9');
        }
        
        if (fifthInterval === 6) {
            extensionParts.push('♭5');
        } else if (fifthInterval === 8) {
            extensionParts.push('#5');
        }
        
        quality = `${baseQuality} ${extensionParts.join(' ')}`;
    }
    
    description = `${quality} chord`;
    
    return { quality, symbol, isNonStandard, description };
}

// Missing helper functions for seventh chords
function isValidSeventhChord(thirdInterval, fifthInterval, seventhInterval) {
    // Define what constitutes a valid seventh chord
    const validSeventhChords = [
        [4, 7, 11], // Major 7th
        [3, 7, 10], // minor 7th
        [4, 7, 10], // Dominant 7th
        [3, 6, 10], // half-diminished 7th
        [3, 6, 9],  // diminished 7th
        [3, 7, 11]  // minor Major 7th
    ];
    
    return validSeventhChords.some(([third, fifth, seventh]) => 
        thirdInterval === third && fifthInterval === fifth && seventhInterval === seventh
    );
}

function getSeventhChordScore(thirdInterval, fifthInterval, seventhInterval) {
    // Score seventh chords to prioritize standard ones
    if (thirdInterval === 4 && fifthInterval === 7 && seventhInterval === 11) return 100; // Major 7th
    if (thirdInterval === 3 && fifthInterval === 7 && seventhInterval === 10) return 90;  // minor 7th
    if (thirdInterval === 4 && fifthInterval === 7 && seventhInterval === 10) return 95;  // Dominant 7th
    if (thirdInterval === 3 && fifthInterval === 6 && seventhInterval === 10) return 80;  // half-diminished 7th
    if (thirdInterval === 3 && fifthInterval === 6 && seventhInterval === 9) return 85;   // diminished 7th
    if (thirdInterval === 3 && fifthInterval === 7 && seventhInterval === 11) return 75;  // minor Major 7th
    return 0; // Invalid/exotic
}

// Export all functions to global scope
window.ChordAnalyzer = {
    calculateTriads,
    calculateSeventhChords,
    analyzeTriadComprehensive,
    analyzeSeventhChordComprehensive,
    isValidTriad,
    getTriadScore,
    detectTriadInversion,
    analyzePentatonicChord,
    analyzeDiminishedChord,
    analyzePentatonicSeventhChord,
    analyzeDiminishedSeventhChord,
    calculateDiminishedScaleTriads,
    calculateDiminishedScaleSeventhChords,
    isValidSeventhChord,
    getSeventhChordScore,
    calculateSixthChords,
    analyzeSixthChord,
    calculateSus2Chords,
    analyzeSus2Chord,
    calculateSus4Chords,
    analyzeSus4Chord,
    calculateSus4SeventhChords,
    analyzeSus4SeventhChord,
    calculateNinthChords,
    analyzeNinthChord,
    calculateEleventhChords,
    analyzeEleventhChord,
    calculateThirteenthChords,
    analyzeThirteenthChord
}; 