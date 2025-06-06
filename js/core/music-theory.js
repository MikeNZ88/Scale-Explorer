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
    const normalizedIndex = ((noteIndex % 12) + 12) % 12;
    
    // Handle major scales and their modes with proper key signatures
    if (scaleType === 'major' || scaleType === 'harmonic-minor' || scaleType === 'melodic-minor') {
        // Define proper note spellings for each key signature
        const majorScaleSpellings = {
            // Sharp keys (use sharps consistently)
            'C': ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C', 'D', 'E', 'F', 'G'],
            'G': ['C', 'D', 'E', 'F#', 'G', 'A', 'B', 'C', 'D', 'E', 'F#', 'G'],
            'D': ['C#', 'D', 'E', 'F#', 'G', 'A', 'B', 'C#', 'D', 'E', 'F#', 'G'],
            'A': ['C#', 'D', 'E', 'F#', 'G#', 'A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
            'E': ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B', 'C#', 'D#', 'E', 'F#', 'G#'],
            'B': ['C#', 'D#', 'E', 'F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E', 'F#', 'G#'],
            'F#': ['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#', 'F#', 'G#'],
            
            // Flat keys (use flats consistently)
            'F': ['C', 'D', 'E', 'F', 'G', 'A', 'Bb', 'C', 'D', 'E', 'F', 'G'],
            'Bb': ['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb', 'C', 'D', 'Eb', 'F', 'G'],
            'Eb': ['C', 'Db', 'Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
            'Ab': ['C', 'Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'Gb'],
            'Db': ['C', 'Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'Gb'],
            'Gb': ['C', 'Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'Gb']
        };
        
        // Get the spelling array for this key
        const keySpelling = majorScaleSpellings[key];
        if (keySpelling) {
            // Find the note at this chromatic index
            function noteToChromatic(note) {
                const noteMap = {
                    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'E#': 5, 'Fb': 4,
                    'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 
                    'B': 11, 'B#': 0, 'Cb': 11
                };
                return noteMap[note] !== undefined ? noteMap[note] : 0;
            }
            
            for (let note of keySpelling) {
                if (noteToChromatic(note) === normalizedIndex) {
                    return note;
                }
            }
        }
    }
    
    // Handle specific scale types
    if (scaleType === 'whole-tone') {
        const wholeToneSpellings = {
            'C': ['C', 'D', 'E', 'F#', 'G#', 'A#'],
            'C#': ['C#', 'D#', 'F', 'G', 'A', 'B'],
            'D': ['C', 'D', 'E', 'F#', 'G#', 'A#'],
            'D#': ['C#', 'D#', 'F', 'G', 'A', 'B'],
            'E': ['C', 'D', 'E', 'F#', 'G#', 'A#'],
            'F': ['C#', 'D#', 'F', 'G', 'A', 'B'],
            'F#': ['C', 'D', 'E', 'F#', 'G#', 'A#'],
            'G': ['C#', 'D#', 'F', 'G', 'A', 'B'],
            'G#': ['C', 'D', 'E', 'F#', 'G#', 'A#'],
            'A': ['C#', 'D#', 'F', 'G', 'A', 'B'],
            'A#': ['C', 'D', 'E', 'F#', 'G#', 'A#'],
            'B': ['C#', 'D#', 'F', 'G', 'A', 'B']
        };
        
        const scaleNotes = wholeToneSpellings[key] || wholeToneSpellings['C'];
        
        function noteToChromatic(note) {
            const noteMap = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11};
            return noteMap[note] !== undefined ? noteMap[note] : 0;
        }
        
        for (let note of scaleNotes) {
            if (noteToChromatic(note) === normalizedIndex) {
                return note;
            }
        }
        
        return MusicConstants.chromaticScale[normalizedIndex];
    }
    
    if (scaleType === 'diminished') {
        const diminishedSpellings = {
            'C': ['C', 'D', 'Eb', 'F', 'Gb', 'Ab', 'A', 'B'],
            'C#': ['C#', 'D#', 'E', 'F#', 'G', 'A', 'Bb', 'C'],
            'D': ['D', 'E', 'F', 'G', 'Ab', 'Bb', 'B', 'C#'],
            'D#': ['D#', 'F', 'F#', 'G#', 'A', 'B', 'C', 'D'],
            'E': ['E', 'F#', 'G', 'A', 'Bb', 'C', 'Db', 'Eb'],
            'F': ['F', 'G', 'Ab', 'Bb', 'B', 'Db', 'D', 'E'],
            'F#': ['F#', 'G#', 'A', 'B', 'C', 'D', 'Eb', 'F'],
            'G': ['G', 'A', 'Bb', 'C', 'Db', 'Eb', 'E', 'F#'],
            'G#': ['G#', 'Bb', 'B', 'C#', 'D', 'E', 'F', 'G'],
            'A': ['A', 'B', 'C', 'D', 'Eb', 'F', 'Gb', 'Ab'],
            'A#': ['A#', 'C', 'C#', 'D#', 'E', 'F#', 'G', 'A'],
            'B': ['B', 'C#', 'D', 'E', 'F', 'G', 'Ab', 'Bb']
        };
        
        const scaleNotes = diminishedSpellings[key] || diminishedSpellings['C'];
        
        function noteToChromatic(note) {
            const noteMap = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11};
            return noteMap[note] !== undefined ? noteMap[note] : 0;
        }
        
        for (let note of scaleNotes) {
            if (noteToChromatic(note) === normalizedIndex) {
                return note;
            }
        }
        
        return MusicConstants.chromaticScale[normalizedIndex];
    }
    
    // Default chromatic spelling
    return MusicConstants.chromaticScale[normalizedIndex];
}

// Scale calculation functions
function calculateScale(root, formula, scaleType = 'major') {
    if (!formula || !Array.isArray(formula)) {
        console.warn('Invalid formula provided to calculateScale:', formula);
        return [];
    }
    
    // Helper function to convert note names to chromatic indices (handles both sharps and flats)
    function noteToIndex(note) {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
            'A#': 10, 'Bb': 10, 'B': 11
        };
        return noteMap[note] !== undefined ? noteMap[note] : -1;
    }
    
    const rootIndex = noteToIndex(root);
    if (rootIndex === -1) {
        console.warn('Invalid root note:', root);
        return [];
    }
    
    const scale = [root];
    let currentIndex = rootIndex;
    
    for (let i = 0; i < formula.length - 1; i++) {
        currentIndex = (currentIndex + formula[i]) % 12;
        const note = getProperNoteSpelling(currentIndex, root, scaleType);
        scale.push(note);
    }
    
    return scale;
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
            'A#': 10, 'Bb': 10, 'B': 11
        };
        return noteMap[cleanNote] !== undefined ? noteMap[cleanNote] : 0;
    }
    
    const rootIndex = noteToIndex(root);
    const intervals = [];
    
    // Special handling for different scale types
    if (notes.length === 6) {
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
        const noteMap = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11};
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
        const noteMap = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11};
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
        const noteMap = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11};
        return noteMap[note] !== undefined ? noteMap[note] : 0;
    }
    
    const rootIndex = noteToIndex(root);
    const intervals = notes.map(note => (noteToIndex(note) - rootIndex + 12) % 12).sort((a, b) => a - b);
    const majorIntervals = [0, 2, 4, 5, 7, 9, 11];
    
    return JSON.stringify(intervals) === JSON.stringify(majorIntervals);
}

// Check if two notes are enharmonic equivalents
function areEnharmonicEquivalents(note1, note2) {
    if (note1 === note2) return true;
    
    // Map enharmonic equivalents
    const enharmonicMap = {
        'C#': 'Db', 'Db': 'C#',
        'D#': 'Eb', 'Eb': 'D#',
        'F#': 'Gb', 'Gb': 'F#',
        'G#': 'Ab', 'Ab': 'G#',
        'A#': 'Bb', 'Bb': 'A#'
    };
    
    return enharmonicMap[note1] === note2 || enharmonicMap[note2] === note1;
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
    areEnharmonicEquivalents
}; 