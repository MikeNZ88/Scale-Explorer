// Interval utility functions for music theory
// Depends on: constants.js

function getIntervalName(semitones) {
    const intervalNames = {
        0: 'Unison', 1: 'Minor 2nd', 2: 'Major 2nd', 3: 'Minor 3rd',
        4: 'Major 3rd', 5: 'Perfect 4th', 6: 'Tritone', 7: 'Perfect 5th',
        8: 'Minor 6th', 9: 'Major 6th', 10: 'Minor 7th', 11: 'Major 7th',
        12: 'Octave', 13: 'Minor 9th', 14: 'Major 9th', 15: 'Minor 10th',
        16: 'Major 10th', 17: 'Perfect 11th', 18: 'Augmented 11th',
        19: 'Perfect 12th', 20: 'Minor 13th', 21: 'Major 13th'
    };
    
    return intervalNames[semitones] || `${semitones} semitones`;
}

function getIntervalBetweenNotes(note1, note2) {
    const noteToIndex = (note) => {
        // Handle double accidentals first
        if (note.includes('bb')) {
            const naturalNote = note.replace('bb', '');
            const naturalIndex = {
                'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
            }[naturalNote];
            return naturalIndex !== undefined ? (naturalIndex - 2 + 12) % 12 : 0;
        } else if (note.includes('##')) {
            const naturalNote = note.replace('##', '');
            const naturalIndex = {
                'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
            }[naturalNote];
            return naturalIndex !== undefined ? (naturalIndex + 2) % 12 : 0;
        } else {
            // Single accidental or natural - comprehensive mapping
            const noteMap = {
                // Natural notes
                'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11,
                // Sharp notes
                'C#': 1, 'D#': 3, 'F#': 6, 'G#': 8, 'A#': 10,
                // Flat notes
                'Db': 1, 'Eb': 3, 'Gb': 6, 'Ab': 8, 'Bb': 10,
                // Enharmonic equivalents
                'B#': 0, 'Cb': 11, 'E#': 5, 'Fb': 4
            };
            return noteMap[note] !== undefined ? noteMap[note] : 0;
        }
    };
    
    const index1 = noteToIndex(note1);
    const index2 = noteToIndex(note2);
    return (index2 - index1 + 12) % 12;
}

function getIntervals(notes, root, scaleType = 'major', mode = null) {
    if (!notes || notes.length === 0) return [];
    
    function noteToIndex(note) {
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
    }
    
    const rootIndex = noteToIndex(root);
    if (rootIndex === undefined) return [];
    
    return notes.map(note => {
        const noteIndex = noteToIndex(note);
        if (noteIndex === undefined) return '1';
        
        const semitones = (noteIndex - rootIndex + 12) % 12;
        
        // Map semitones to interval names
        const intervalMap = {
            0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4',
            6: 'b5', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7'
        };
        
        return intervalMap[semitones] || '1';
    });
}

function getRomanNumeral(degree, quality) {
    const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    const numeral = numerals[degree - 1] || 'I';
    
    if (quality === 'minor' || quality === 'diminished') {
        return numeral.toLowerCase();
    } else if (quality === 'diminished') {
        return numeral.toLowerCase() + '°';
    } else if (quality === 'half-diminished') {
        return numeral.toLowerCase() + 'ø';
    } else if (quality === 'augmented') {
        return numeral + '+';
    }
    
    return numeral;
}

function getChordFunction(degree, scaleType = 'major') {
    const majorFunctions = {
        1: 'Tonic', 2: 'Predominant', 3: 'Tonic', 4: 'Subdominant',
        5: 'Dominant', 6: 'Tonic', 7: 'Dominant'
    };
    
    const minorFunctions = {
        1: 'Tonic', 2: 'Predominant', 3: 'Tonic', 4: 'Subdominant',
        5: 'Dominant', 6: 'Subdominant', 7: 'Dominant'
    };
    
    if (scaleType === 'minor' || scaleType === 'natural minor' || 
        scaleType === 'harmonic minor' || scaleType === 'melodic minor') {
        return minorFunctions[degree] || 'Tonic';
    }
    
    return majorFunctions[degree] || 'Tonic';
}

function areEnharmonicEquivalents(note1, note2) {
    if (note1 === note2) return true;
    
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
    
    const getNoteIndex = (note) => {
        const index = noteToIndex(note);
        return index !== undefined ? index : -1;
    };
    
    return getNoteIndex(note1) === getNoteIndex(note2);
}

function getEnharmonicEquivalent(note) {
    const enharmonicMap = {
        'C#': 'Db', 'Db': 'C#',
        'D#': 'Eb', 'Eb': 'D#',
        'F#': 'Gb', 'Gb': 'F#',
        'G#': 'Ab', 'Ab': 'G#',
        'A#': 'Bb', 'Bb': 'A#',
        'B#': 'C', 'C': 'B#',
        'E#': 'F', 'F': 'E#',
        'Cb': 'B', 'B': 'Cb',
        'Fb': 'E', 'E': 'Fb',
        // Double sharps and flats
        'C##': 'D', 'D': 'C##',
        'D##': 'E', 'E': 'D##',
        'F##': 'G', 'G': 'F##',
        'G##': 'A', 'A': 'G##',
        'A##': 'B', 'B': 'A##',
        'Dbb': 'C', 'C': 'Dbb',
        'Ebb': 'D', 'D': 'Ebb',
        'Gbb': 'F', 'F': 'Gbb',
        'Abb': 'G', 'G': 'Abb',
        'Bbb': 'A', 'A': 'Bbb'
    };
    
    return enharmonicMap[note] || note;
}

function getIntervalEnharmonicEquivalent(interval) {
    const enharmonicMap = {
        '#4': 'b5', 'b5': '#4',
        '#1': 'b2', 'b2': '#1',
        '#2': 'b3', 'b3': '#2',
        '#5': 'b6', 'b6': '#5',
        '#6': 'b7', 'b7': '#6',
        'b4': '3', '#3': '4',
        'bb7': '6', '##1': '2',
        '##2': '3', '##4': '5',
        '##5': '6', '##6': '7',
        '#7': '1', 'bb2': '1',
        'bb3': '2', 'bb4': '3',
        'bb5': '4', 'bb6': '5'
    };
    
    return enharmonicMap[interval] || interval;
}

function getEnharmonicTooltip(value, type = 'note') {
    if (type === 'note') {
        const equivalent = getEnharmonicEquivalent(value);
        return equivalent !== value ? `Enharmonic: ${equivalent}` : null;
    } else if (type === 'interval') {
        const equivalent = getIntervalEnharmonicEquivalent(value);
        return equivalent !== value ? `Enharmonic: ${equivalent}` : null;
    }
    return null;
}

function getChordIntervals(chordNotes, rootNote) {
    if (!chordNotes || chordNotes.length === 0) return [];
    
    function noteToIndex(note) {
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
    }
    
    const rootIndex = noteToIndex(rootNote);
    if (rootIndex === undefined) return [];
    
    return chordNotes.map(note => {
        const noteIndex = noteToIndex(note);
        if (noteIndex === undefined) return '1';
        
        const semitones = (noteIndex - rootIndex + 12) % 12;
        
        // Map semitones to interval names with extensions
        const intervalMap = {
            0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4',
            6: 'b5', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7'
        };
        
        return intervalMap[semitones] || '1';
    });
}

// Export all functions to global scope
window.IntervalUtils = {
    getIntervalName,
    getIntervalBetweenNotes,
    getIntervals,
    getRomanNumeral,
    getChordFunction,
    areEnharmonicEquivalents,
    getEnharmonicEquivalent,
    getIntervalEnharmonicEquivalent,
    getEnharmonicTooltip,
    getChordIntervals
}; 