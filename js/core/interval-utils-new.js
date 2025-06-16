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
    
    // Special handling for whole tone scales
    if (scaleType && (scaleType.includes('whole-tone') || scaleType.includes('whole_tone') || 
                      mode && mode.includes('whole-tone'))) {
        // Whole tone scale uses sharps: 1, 2, 3, #4, #5, #6
        return notes.map(note => {
            const noteIndex = noteToIndex(note);
            if (noteIndex === undefined) return '1';
            
            const semitones = (noteIndex - rootIndex + 12) % 12;
            
            // Whole tone interval mapping with sharps
            const wholeToneIntervalMap = {
                0: '1',   // Root
                2: '2',   // Major 2nd
                4: '3',   // Major 3rd
                6: '#4',  // Augmented 4th (not b5)
                8: '#5',  // Augmented 5th (not b6)
                10: '#6'  // Augmented 6th (not b7)
            };
            
            return wholeToneIntervalMap[semitones] || '1';
        });
    }
    
    return notes.map(note => {
        const noteIndex = noteToIndex(note);
        if (noteIndex === undefined) return '1';
        
        const semitones = (noteIndex - rootIndex + 12) % 12;
        
        // Map semitones to interval names
        const intervalMap = {
            0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4',
            6: 'b5', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7'
        };
        
        let interval = intervalMap[semitones] || '1';
        
        // Context-aware interval naming for specific modes
        if (semitones === 6) { // Tritone - can be b5 or #4
            if (mode === 'lydian' || scaleType === 'lydian') {
                interval = '#4'; // Lydian mode uses #4, not b5
            }
            // Other Lydian-related modes that use #4 instead of b5
            else if (mode === 'lydian-dominant' || scaleType === 'lydian-dominant' || 
                     mode === 'lydian-augmented' || scaleType === 'lydian-augmented' || 
                     mode === 'lydian-sharp-2' || scaleType === 'lydian-sharp-2') {
                interval = '#4';
            }
        }
        
        return interval;
    });
}

function getRomanNumeral(degree, quality) {
    const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    const numeral = numerals[degree - 1] || 'I';
    
    if (quality === 'diminished') {
        return numeral.toLowerCase() + '°';
    } else if (quality === 'half-diminished') {
        return numeral.toLowerCase() + 'ø';
    } else if (quality === 'augmented') {
        return numeral + '+';
    } else if (quality === 'minor') {
        return numeral.toLowerCase();
    }
    
    return numeral;
}

function getChordFunction(degree, scaleType, category) {
    console.log('getChordFunction called with degree:', degree, 'scaleType:', scaleType, 'category:', category);
    
    // Handle modal scales - use modal terminology for major-modes category
    if (category === 'major-modes' && scaleType === 'major') {
        console.log('Using modal functions for major mode in major-modes category');
        return getModalFunction(degree, 'ionian', category);
    }
    
    if (scaleType === 'ionian') {
        console.log('Using modal functions for ionian');
        return getModalFunction(degree, scaleType, category);
    }
    
    // Check for other modal scales
    if (scaleType === 'dorian' || scaleType === 'phrygian' || scaleType === 'lydian' || 
        scaleType === 'mixolydian' || scaleType === 'aeolian' || scaleType === 'locrian' ||
        scaleType === 'harmonic-minor' || scaleType === 'melodic-minor' ||
        scaleType === 'locrian-natural-6' || scaleType === 'ionian-sharp-5' || 
        scaleType === 'dorian-sharp-4' || scaleType === 'phrygian-dominant' || 
        scaleType === 'lydian-sharp-2' || scaleType === 'altered-dominant' ||
        scaleType === 'dorian-b2' || scaleType === 'lydian-augmented' || 
        scaleType === 'lydian-dominant' || scaleType === 'mixolydian-b6' || 
        scaleType === 'locrian-natural-2' || scaleType === 'super-locrian') {
        console.log('Using modal functions for', scaleType);
        return getModalFunction(degree, scaleType, category);
    }
    
    // Traditional functional harmony for major and minor scales
    if (scaleType === 'major') {
        console.log('Using major scale functions');
        const majorFunctions = ['Tonic', 'Supertonic', 'Mediant', 'Subdominant', 'Dominant', 'Submediant', 'Leading Tone'];
        return majorFunctions[degree - 1] || 'Unknown';
    }
    
    if (scaleType === 'minor' || scaleType === 'natural-minor') {
        console.log('Using minor scale functions');
        const minorFunctions = ['Tonic', 'Supertonic', 'Mediant', 'Subdominant', 'Dominant', 'Submediant', 'Subtonic'];
        return minorFunctions[degree - 1] || 'Unknown';
    }
    
    // Default fallback
    console.log('Using default chord function');
    return `Degree ${degree}`;
}

function getModalFunction(degree, scaleType, category) {
    // For modal scales, use Modal Tonic and characteristic chord labels
    
    if (scaleType === 'ionian' || (category === 'major-modes' && scaleType === 'ionian')) {
        // Ionian mode (major scale) - use functional harmony groupings
        switch (degree) {
            case 1: return 'Tonic';           // I (tonic function)
            case 2: return 'Predominant';    // ii (predominant function)
            case 3: return 'Tonic';          // iii (tonic function)
            case 4: return 'Predominant';    // IV (predominant function)
            case 5: return 'Dominant';       // V (dominant function)
            case 6: return 'Tonic';          // vi (tonic function)
            case 7: return 'Dominant';       // vii° (dominant function)
            default: return '';
        }
    } else if (scaleType === 'dorian' || (category === 'major-modes' && scaleType === 'dorian')) {
        // Dorian mode - characteristic: minor i + major IV
        switch (degree) {
            case 1: return 'Modal Tonic';     // i (minor tonic)
            case 2: return '';                // ii
            case 3: return '';                // ♭III
            case 4: return 'Characteristic';  // IV (major IV - distinguishes from natural minor)
            case 5: return '';                // v
            case 6: return '';                // vi°
            case 7: return '';                // ♭VII
            default: return '';
        }
    } else if (scaleType === 'phrygian' || (category === 'major-modes' && scaleType === 'phrygian')) {
        // Phrygian mode - characteristic: minor i + major ♭II
        switch (degree) {
            case 1: return 'Modal Tonic';     // i (minor tonic)
            case 2: return 'Characteristic';  // ♭II (major ♭II - Spanish/flamenco sound)
            case 3: return '';                // ♭III
            case 4: return '';                // iv
            case 5: return '';                // v°
            case 6: return '';                // ♭VI
            case 7: return '';                // ♭vii
            default: return '';
        }
    } else if (scaleType === 'lydian' || (category === 'major-modes' && scaleType === 'lydian')) {
        // Lydian mode - characteristic: major I + major II
        switch (degree) {
            case 1: return 'Modal Tonic';     // I (major tonic)
            case 2: return 'Characteristic';  // II (major II - bright, dreamy sound)
            case 3: return '';                // iii
            case 4: return '';                // #iv° (tritone, avoid)
            case 5: return '';                // V
            case 6: return '';                // vi
            case 7: return '';                // vii
            default: return '';
        }
    } else if (scaleType === 'mixolydian' || (category === 'major-modes' && scaleType === 'mixolydian')) {
        // Mixolydian mode - characteristic: major I + major ♭VII
        switch (degree) {
            case 1: return 'Modal Tonic';     // I (major tonic)
            case 2: return '';                // ii
            case 3: return '';                // iii°
            case 4: return '';                // IV
            case 5: return '';                // v
            case 6: return '';                // vi
            case 7: return 'Characteristic';  // ♭VII (major ♭VII - rock/blues sound)
            default: return '';
        }
    } else if (scaleType === 'aeolian' || (category === 'major-modes' && scaleType === 'aeolian')) {
        // Aeolian mode (natural minor) - characteristic: minor i + minor v
        switch (degree) {
            case 1: return 'Modal Tonic';     // i (minor tonic)
            case 2: return '';                // ii°
            case 3: return '';                // ♭III
            case 4: return '';                // iv
            case 5: return 'Characteristic';  // v (minor v - distinguishes from harmonic minor)
            case 6: return '';                // ♭VI
            case 7: return '';                // ♭VII
            default: return '';
        }
    } else if (scaleType === 'locrian' || (category === 'major-modes' && scaleType === 'locrian')) {
        // Locrian mode - characteristic: diminished i° + major ♭II
        switch (degree) {
            case 1: return 'Modal Tonic';     // i° (diminished tonic - unstable)
            case 2: return 'Characteristic';  // ♭II (major ♭II - provides stability)
            case 3: return '';                // ♭iii
            case 4: return '';                // iv
            case 5: return '';                // ♭v
            case 6: return '';                // ♭VI
            case 7: return '';                // ♭vii
            default: return '';
        }
    } else if (scaleType === 'locrian-natural-6' || (category === 'harmonic-minor-modes' && scaleType === 'locrian-natural-6')) {
        // Locrian ♮6 (2nd mode of harmonic minor) - characteristic: diminished i° + major ♭II
        switch (degree) {
            case 1: return 'Modal Tonic';     // i° (diminished tonic)
            case 2: return 'Characteristic';  // ♭II (major ♭II - provides resolution)
            case 3: return '';                // ♭iii
            case 4: return '';                // iv
            case 5: return '';                // ♭v
            case 6: return '';                // VI (natural 6th - distinguishes from regular Locrian)
            case 7: return '';                // ♭vii
            default: return '';
        }
    } else if (scaleType === 'ionian-sharp-5' || (category === 'harmonic-minor-modes' && scaleType === 'ionian-sharp-5')) {
        // Ionian ♯5 (3rd mode of harmonic minor) - characteristic: major I + augmented ♯V
        switch (degree) {
            case 1: return 'Modal Tonic';     // I (major tonic)
            case 2: return '';                // ii
            case 3: return '';                // iii
            case 4: return '';                // IV
            case 5: return 'Characteristic';  // ♯V+ (augmented - unique harmonic color)
            case 6: return '';                // vi
            case 7: return '';                // vii
            default: return '';
        }
    } else if (scaleType === 'dorian-sharp-4' || (category === 'harmonic-minor-modes' && scaleType === 'dorian-sharp-4')) {
        // Dorian ♯4 (4th mode of harmonic minor) - characteristic: minor i + major ♯IV
        switch (degree) {
            case 1: return 'Modal Tonic';     // i (minor tonic)
            case 2: return '';                // ii
            case 3: return '';                // ♭III
            case 4: return 'Characteristic';  // ♯IV (major ♯IV - Lydian-like brightness in minor context)
            case 5: return '';                // v
            case 6: return '';                // vi°
            case 7: return '';                // ♭VII
            default: return '';
        }
    } else if (scaleType === 'phrygian-dominant' || (category === 'harmonic-minor-modes' && scaleType === 'phrygian-dominant')) {
        // Phrygian Dominant (5th mode of harmonic minor) - characteristic: major I + major ♭II
        switch (degree) {
            case 1: return 'Modal Tonic';     // I (major tonic)
            case 2: return 'Characteristic';  // ♭II (major ♭II - Spanish/Middle Eastern sound)
            case 3: return '';                // 3
            case 4: return '';                // 4
            case 5: return '';                // 5
            case 6: return '';                // ♭6
            case 7: return '';                // ♭7
            default: return '';
        }
    } else if (scaleType === 'lydian-sharp-2' || (category === 'harmonic-minor-modes' && scaleType === 'lydian-sharp-2')) {
        // Lydian ♯2 (6th mode of harmonic minor) - characteristic: major I + major ♯II
        switch (degree) {
            case 1: return 'Modal Tonic';     // I (major tonic)
            case 2: return 'Characteristic';  // ♯II (major ♯II - very bright, exotic)
            case 3: return '';                // iii
            case 4: return '';                // ♯iv°
            case 5: return '';                // V
            case 6: return '';                // vi
            case 7: return '';                // vii
            default: return '';
        }
    } else if (scaleType === 'super-locrian' || scaleType === 'altered' || (category === 'harmonic-minor-modes' && (scaleType === 'super-locrian' || scaleType === 'altered'))) {
        // Super Locrian/Altered (7th mode of harmonic minor) - characteristic: diminished i° + major ♭II
        switch (degree) {
            case 1: return 'Modal Tonic';     // i° (diminished tonic - very unstable)
            case 2: return 'Characteristic';  // ♭II (major ♭II - provides some stability)
            case 3: return '';                // ♭iii
            case 4: return '';                // ♭iv
            case 5: return '';                // ♭v
            case 6: return '';                // ♭vi
            case 7: return '';                // ♭♭vii (double flat 7)
            default: return '';
        }
    } else if (scaleType === 'melodic-minor') {
        // Melodic minor - characteristic: minor i + major V
        switch (degree) {
            case 1: return 'Modal Tonic';     // i (minor tonic)
            case 2: return '';                // ii
            case 3: return '';                // ♭III+
            case 4: return '';                // IV
            case 5: return 'Characteristic';  // V (major V - distinguishes from natural minor)
            case 6: return '';                // vi°
            case 7: return '';                // vii°
            default: return '';
        }
    } else if (scaleType === 'dorian-b2' || (category === 'melodic-minor-modes' && scaleType === 'dorian-b2')) {
        // Dorian ♭2 (2nd mode of melodic minor) - characteristic: minor i + major ♭VII
        switch (degree) {
            case 1: return 'Modal Tonic';     // i (minor tonic)
            case 2: return 'Characteristic';  // ♭II (major ♭II - Phrygian-like but softer)
            case 3: return '';                // ♭III
            case 4: return '';                // IV
            case 5: return '';                // V
            case 6: return '';                // VI (natural 6th - distinguishes from Phrygian)
            case 7: return '';                // ♭VII
            default: return '';
        }
    } else if (scaleType === 'lydian-augmented' || (category === 'melodic-minor-modes' && scaleType === 'lydian-augmented')) {
        // Lydian Augmented (3rd mode of melodic minor) - characteristic: major I + augmented ♯V
        switch (degree) {
            case 1: return 'Modal Tonic';     // I (major tonic)
            case 2: return '';                // II
            case 3: return '';                // III
            case 4: return '';                // ♯IV
            case 5: return 'Characteristic';  // ♯V+ (augmented - bright, floating quality)
            case 6: return '';                // VI
            case 7: return '';                // VII
            default: return '';
        }
    } else if (scaleType === 'lydian-dominant' || (category === 'melodic-minor-modes' && scaleType === 'lydian-dominant')) {
        // Lydian Dominant (4th mode of melodic minor) - characteristic: major I + major ♯IV
        switch (degree) {
            case 1: return 'Modal Tonic';     // I (major tonic)
            case 2: return '';                // II
            case 3: return '';                // III
            case 4: return 'Characteristic';  // ♯IV (major ♯IV - Lydian brightness with dominant function)
            case 5: return '';                // V
            case 6: return '';                // VI
            case 7: return '';                // ♭VII
            default: return '';
        }
    } else if (scaleType === 'mixolydian-b6' || (category === 'melodic-minor-modes' && scaleType === 'mixolydian-b6')) {
        // Mixolydian ♭6 (5th mode of melodic minor) - characteristic: major I + major ♭VI
        switch (degree) {
            case 1: return 'Modal Tonic';     // I (major tonic)
            case 2: return '';                // II
            case 3: return '';                // III
            case 4: return '';                // IV
            case 5: return '';                // V
            case 6: return 'Characteristic';  // ♭VI (major ♭VI - exotic, Eastern flavor)
            case 7: return '';                // ♭VII
            default: return '';
        }
    } else if (scaleType === 'locrian-natural-2' || (category === 'melodic-minor-modes' && scaleType === 'locrian-natural-2')) {
        // Locrian ♮2 (6th mode of melodic minor) - characteristic: diminished i° + major II
        switch (degree) {
            case 1: return 'Modal Tonic';     // i° (diminished tonic - unstable but usable)
            case 2: return 'Characteristic';  // II (major II - provides brightness and stability)
            case 3: return '';                // ♭III
            case 4: return '';                // IV
            case 5: return '';                // ♭V
            case 6: return '';                // ♭VI
            case 7: return '';                // ♭VII
            default: return '';
        }
    } else if (scaleType === 'super-locrian' || scaleType === 'altered-dominant' || 
               (category === 'melodic-minor-modes' && (scaleType === 'super-locrian' || scaleType === 'altered-dominant')) ||
               (category === 'harmonic-minor-modes' && (scaleType === 'super-locrian' || scaleType === 'altered'))) {
        // Super Locrian/Altered Dominant (7th mode of melodic minor OR harmonic minor)
        // characteristic: diminished i° + major ♭II
        switch (degree) {
            case 1: return 'Modal Tonic';     // i° (diminished tonic - extremely unstable)
            case 2: return 'Characteristic';  // ♭II (major ♭II - provides some resolution)
            case 3: return '';                // ♭III
            case 4: return '';                // ♭IV
            case 5: return '';                // ♭V
            case 6: return '';                // ♭VI
            case 7: return '';                // ♭VII (or ♭♭VII in harmonic minor context)
            default: return '';
        }
    } else if (scaleType === 'harmonic-minor') {
        // Harmonic minor - use grouped functional harmony
        switch (degree) {
            case 1: return 'Tonic';           // i (tonic function)
            case 2: return 'Predominant';    // ii° (predominant function)
            case 3: return 'Tonic';          // ♭III+ (tonic function)
            case 4: return 'Predominant';    // iv (predominant function)
            case 5: return 'Dominant';       // V (dominant function)
            case 6: return 'Tonic';          // ♭VI (tonic function)
            case 7: return 'Dominant';       // vii° (dominant function)
            default: return '';
        }
    }
    
    // For other exotic scales, return empty string (no function label)
    return '';
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