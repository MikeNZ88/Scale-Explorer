let api = null;
let isPlayerReady = false;
let trackStates = {}; // Store track states (visible, muted, solo)
let currentScore = null; // Global score reference
let isRenderingComplete = false; // Track rendering state

// GP Files Browser State
let gpFiles = [];
let filteredFiles = [];
let currentFilter = 'scale-exercises';
let currentSort = 'name';
let searchQuery = '';

// DOM elements
const fileInput = document.getElementById('fileInput');
const fileInputContainer = document.getElementById('fileInputContainer');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const trackInfo = document.getElementById('trackInfo');
const trackControls = document.querySelector('.track-controls');
const tracksGrid = document.getElementById('tracksGrid');
const songTitle = document.getElementById('songTitle');
const songArtist = document.getElementById('songArtist');
const trackCount = document.getElementById('trackCount');
const horizontalControls = document.getElementById('horizontalControls');

// Track control buttons
const showAllTracks = document.getElementById('showAllTracks');
const hideAllTracks = document.getElementById('hideAllTracks');
const unmuteAllTracks = document.getElementById('unmuteAllTracks');
const unsoloAllTracks = document.getElementById('unsoloAllTracks');

// Print and download buttons
const printBtn = document.getElementById('printBtn');
const downloadBtn = document.getElementById('downloadBtn');
const scaleDiagramBtn = document.getElementById('scaleDiagramBtn');

// Current file tracking for download functionality
let currentFileData = null;
let currentFileName = null;

// 🎼 COMPREHENSIVE SCALE LIBRARY FOR ALL 12 KEYS
// Musical theory data with complete scale calculations
const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const flatKeys = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Key signature preference (which keys use flats vs sharps)
const keySignatures = {
    'C': 'C', 'C#': 'Db', 'D': 'D', 'D#': 'Eb', 'E': 'E', 'F': 'F', 
    'F#': 'Gb', 'G': 'G', 'G#': 'Ab', 'A': 'A', 'A#': 'Bb', 'B': 'B'
};

const preferredAccidentals = {
    'C': [], 'Db': ['Db', 'Eb', 'Gb', 'Ab', 'Bb'], 'D': ['C#', 'F#'],
    'Eb': ['Bb', 'Eb', 'Ab'], 'E': ['C#', 'D#', 'F#', 'G#'],
    'F': ['Bb'], 'Gb': ['Db', 'Eb', 'Gb', 'Ab', 'Bb', 'Cb'],
    'G': ['F#'], 'Ab': ['Bb', 'Db', 'Eb', 'Ab'], 'A': ['C#', 'F#', 'G#'],
    'Bb': ['Bb', 'Eb'], 'B': ['C#', 'D#', 'F#', 'G#', 'A#']
};

// Scale formulas (intervals in semitones)
const scaleFormulas = {
    major: [2, 2, 1, 2, 2, 2, 1],
    harmonicMinor: [2, 1, 2, 2, 1, 3, 1],
    melodicMinor: [2, 1, 2, 2, 2, 2, 1],
    wholeTone: [2, 2, 2, 2, 2, 2], // 6 intervals to generate 6 notes plus octave
    diminished: [2, 1, 2, 1, 2, 1, 2, 1], // Whole-Half
    chromatic: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    pentatonicMajor: [2, 2, 3, 2, 3],
    pentatonicMinor: [3, 2, 2, 3, 2],
    pentatonicEgyptian: [2, 3, 2, 3, 2],
    pentatonicBluesMajor: [3, 2, 1, 1, 3, 2], // Actually blues major
    pentatonicBluesMinor: [3, 2, 1, 1, 3, 2], // Blues scale
    blues: [3, 2, 1, 1, 3, 2]
};

// Mode data for major scale
const majorModes = [
    { name: 'Ionian', mode: 0, mood: 'Happy, bright, resolved', description: 'The natural major scale' },
    { name: 'Dorian', mode: 1, mood: 'Sophisticated, jazzy, slightly melancholic', description: 'Minor mode with natural 6th' },
    { name: 'Phrygian', mode: 2, mood: 'Dark, Spanish, exotic, mysterious', description: 'Minor mode with flat 2nd' },
    { name: 'Lydian', mode: 3, mood: 'Dreamy, floating, ethereal, cinematic', description: 'Major mode with sharp 4th' },
    { name: 'Mixolydian', mode: 4, mood: 'Bluesy, funky, dominant, resolving', description: 'Major mode with flat 7th' },
    { name: 'Aeolian', mode: 5, mood: 'Sad, melancholic, natural minor sound', description: 'The natural minor scale' },
    { name: 'Locrian', mode: 6, mood: 'Unstable, diminished, unresolved, dark', description: 'Diminished mode with flat 5th' }
];

// Mode data for harmonic minor scale
const harmonicMinorModes = [
    { name: 'Harmonic Minor', mode: 0, mood: 'Classical, dramatic, Middle Eastern', description: 'Minor scale with natural 7th' },
    { name: 'Locrian ♮6', mode: 1, mood: 'Unstable, exotic, mysterious', description: 'Locrian with natural 6th' },
    { name: 'Ionian ♯5', mode: 2, mood: 'Augmented, dreamy, unstable', description: 'Major with augmented 5th' },
    { name: 'Dorian ♯4', mode: 3, mood: 'Lydian-like minor, sophisticated', description: 'Dorian with sharp 4th' },
    { name: 'Phrygian Dominant', mode: 4, mood: 'Spanish, flamenco, exotic', description: 'Major with flat 2nd and 6th' },
    { name: 'Lydian ♯2', mode: 5, mood: 'Ethereal, augmented, floating', description: 'Lydian with sharp 2nd' },
    { name: 'Ultralocrian', mode: 6, mood: 'Extremely diminished, unstable', description: 'Double diminished scale' }
];

// Mode data for melodic minor scale
const melodicMinorModes = [
    { name: 'Melodic Minor', mode: 0, mood: 'Smooth minor with major qualities', description: 'Minor with natural 6th and 7th' },
    { name: 'Dorian ♭2', mode: 1, mood: 'Dark Dorian with exotic flat 2nd', description: 'Phrygian-Dorian hybrid' },
    { name: 'Lydian Augmented', mode: 2, mood: 'Dreamy with augmented mystery', description: 'Lydian with sharp 5th' },
    { name: 'Lydian Dominant', mode: 3, mood: 'Bright dominant with Lydian color', description: 'Mixolydian with sharp 4th' },
    { name: 'Mixolydian ♭6', mode: 4, mood: 'Bluesy with minor coloring', description: 'Mixolydian with flat 6th' },
    { name: 'Locrian ♮2', mode: 5, mood: 'Half-diminished, jazzy', description: 'Aeolian with flat 5th' },
    { name: 'Altered', mode: 6, mood: 'Highly altered, jazz fusion', description: 'Super locrian, all alterations' }
];

// Pentatonic scale types
const pentatonicTypes = {
    major: {
        name: 'Major Pentatonic',
        formula: [2, 2, 3, 2, 3],
        modes: [
            { name: 'Major Pentatonic (Shape 1)', mode: 0, mood: 'Happy, folk-like, simple', description: 'Basic major pentatonic pattern' },
            { name: 'Suspended Pentatonic (Shape 2)', mode: 1, mood: 'Floating, unresolved', description: 'Pentatonic starting on 2nd' },
            { name: 'Man Gong (Shape 3)', mode: 2, mood: 'Asian, contemplative', description: 'Pentatonic starting on 3rd' },
            { name: 'Ritusen (Shape 4)', mode: 3, mood: 'Japanese, meditative', description: 'Pentatonic starting on 5th' },
            { name: 'Minor Pentatonic (Shape 5)', mode: 4, mood: 'Bluesy, rock, powerful', description: 'Basic minor pentatonic' }
        ]
    },
    minor: {
        name: 'Minor Pentatonic',
        formula: [3, 2, 2, 3, 2],
        modes: [
            { name: 'Minor Pentatonic (Shape 1)', mode: 0, mood: 'Bluesy, rock, powerful', description: 'Basic minor pentatonic pattern' },
            { name: 'Major Pentatonic (Shape 2)', mode: 1, mood: 'Happy, folk-like, simple', description: 'Relative major pentatonic' },
            { name: 'Dorian Pentatonic (Shape 3)', mode: 2, mood: 'Jazzy, sophisticated', description: 'Dorian-flavored pentatonic' },
            { name: 'Mixolydian Pentatonic (Shape 4)', mode: 3, mood: 'Bluesy, dominant', description: 'Dominant pentatonic' },
            { name: 'Minor 6 Pentatonic (Shape 5)', mode: 4, mood: 'Sweet minor, folk', description: 'Minor with 6th emphasis' }
        ]
    },
    egyptian: {
        name: 'Egyptian Pentatonic',
        formula: [2, 3, 2, 3, 2],
        modes: [
            { name: 'Egyptian (Shape 1)', mode: 0, mood: 'Exotic, ancient, mysterious', description: 'Ancient Egyptian scale' },
            { name: 'Kumoi (Shape 2)', mode: 1, mood: 'Japanese, meditative', description: 'Japanese Kumoi scale' },
            { name: 'Hirajoshi (Shape 3)', mode: 2, mood: 'Japanese, contemplative', description: 'Japanese Hirajoshi scale' },
            { name: 'Iwato (Shape 4)', mode: 3, mood: 'Japanese, dark', description: 'Japanese Iwato scale' },
            { name: 'In (Shape 5)', mode: 4, mood: 'Japanese, bright', description: 'Japanese In scale' }
        ]
    }
};

// Blues scale modes
const bluesScaleModes = [
    { name: 'Minor Blues', mode: 0, mood: 'Bluesy, soulful, expressive', description: 'Minor pentatonic with added flat 5th (blue note)' },
    { name: 'Major Blues', mode: 1, mood: 'Happy blues, country, folk', description: 'Major pentatonic with added flat 3rd (blue note)' },
    { name: 'Dorian Blues', mode: 2, mood: 'Sophisticated blues, jazzy', description: 'Blues scale starting on the flat 3rd' },
    { name: 'Mixolydian Blues', mode: 3, mood: 'Dominant blues, funky', description: 'Blues scale starting on the 4th' },
    { name: 'Phrygian Blues', mode: 4, mood: 'Dark blues, Spanish flavor', description: 'Blues scale starting on the flat 5th' },
    { name: 'Lydian Blues', mode: 5, mood: 'Floating blues, ethereal', description: 'Blues scale starting on the 5th' }
];

// Global state for fretboard display mode
let fretboardDisplayMode = 'notes'; // 'notes' or 'intervals'

// Function to generate fretboard SVG using the Fretboard class
function generateFretboard(scale, displayMode = 'notes', isModal = false) {
    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.visibility = 'hidden';
    document.body.appendChild(tempContainer);
    
    // Create fretboard instance with appropriate sizing
    const fretboardOptions = {
        frets: 12,
        strings: 6,
        startFret: 0,
        showFretNumbers: true,
        showStringLabels: true,
        dotSize: isModal ? 20 : 16,
        fretSpacing: isModal ? 70 : 50,
        stringSpacing: isModal ? 40 : 30,
        nutWidth: 8
    };
    
    const fretboard = new Fretboard(tempContainer, fretboardOptions);
    
    // Generate the scale pattern on the fretboard
    if (scale && scale.notes && Array.isArray(scale.notes)) {
        const pattern = fretboard.generatePattern(scale.notes, scale.root);
        
        // Convert pattern to display format based on mode
        const displayPattern = pattern.map(note => {
            let displayText = '';
            
            if (displayMode === 'intervals' && scale.intervals) {
                // Find the interval for this note
                const noteIndex = scale.notes.findIndex(scaleNote => {
                    // Handle enharmonic equivalents
                    const noteChromatic = fretboard.chromaticScale.indexOf(note.note.replace('b', '#'));
                    const scaleNoteChromatic = fretboard.chromaticScale.indexOf(scaleNote.replace('b', '#'));
                    return noteChromatic === scaleNoteChromatic;
                });
                
                if (noteIndex !== -1 && scale.intervals[noteIndex]) {
                    displayText = scale.intervals[noteIndex];
                }
            } else {
                displayText = note.note;
            }
            
            return {
                ...note,
                note: displayText
            };
        });
        
        fretboard.render(displayPattern);
    }
    
    // Get the SVG element and add classes
    const svgElement = tempContainer.querySelector('svg');
    if (svgElement) {
        svgElement.classList.add('fretboard-svg');
        if (isModal) {
            svgElement.classList.add('modal-fretboard');
        }
        
        // Return the outer HTML of the SVG
        const svgHTML = svgElement.outerHTML;
        
        // Clean up
        document.body.removeChild(tempContainer);
        
        return svgHTML;
    }
    
    // Clean up and return empty string if failed
    document.body.removeChild(tempContainer);
    return '<p>Error generating fretboard</p>';
}

// Function to get proper note spelling based on key signature and scale type
function getProperNoteSpelling(noteIndex, key, scaleType = 'major') {
    // For whole tone scales, use the 2-scale system
    if (scaleType === 'wholeTone') {
        const wholeToneScale1Notes = ['C', 'D', 'E', 'F#', 'G#', 'A#'];
        const wholeToneScale2Notes = ['Db', 'Eb', 'F', 'G', 'A', 'B'];
        
        const wholeToneMapping = {
            'C': wholeToneScale1Notes, 'D': wholeToneScale1Notes, 'E': wholeToneScale1Notes,
            'F#': wholeToneScale1Notes, 'G#': wholeToneScale1Notes, 'A#': wholeToneScale1Notes,
            'Gb': wholeToneScale1Notes, 'Ab': wholeToneScale1Notes, 'Bb': wholeToneScale1Notes,
            
            'Db': wholeToneScale2Notes, 'Eb': wholeToneScale2Notes, 'F': wholeToneScale2Notes,
            'G': wholeToneScale2Notes, 'A': wholeToneScale2Notes, 'B': wholeToneScale2Notes,
            'C#': wholeToneScale2Notes, 'D#': wholeToneScale2Notes
        };
        
        const scaleNotes = wholeToneMapping[key];
        if (scaleNotes) {
            // Find which note in the scale corresponds to this chromatic index
            for (let note of scaleNotes) {
                const chromIndex = chromaticScale.indexOf(note.replace('b', '#'));
                if (chromIndex === noteIndex) {
                    return note;
                }
            }
        }
        
        return chromaticScale[noteIndex];
    }
    
    // For harmonic and melodic minor, use direct note mapping
    if (scaleType === 'harmonicMinor') {
        const harmonicMinorSpellings = {
            'C': ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'B'],
            'C#': ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B#'],
            'Db': ['Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bbb', 'C'],
            'D': ['D', 'E', 'F', 'G', 'A', 'Bb', 'C#'],
            'D#': ['D#', 'E#', 'F#', 'G#', 'A#', 'B', 'Cx'],
            'Eb': ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'Cb', 'D'],
            'E': ['E', 'F#', 'G', 'A', 'B', 'C', 'D#'],
            'F': ['F', 'G', 'Ab', 'Bb', 'C', 'Db', 'E'],
            'F#': ['F#', 'G#', 'A', 'B', 'C#', 'D', 'E#'],
            'Gb': ['Gb', 'Ab', 'Bbb', 'Cb', 'Db', 'Ebb', 'F'],
            'G': ['G', 'A', 'Bb', 'C', 'D', 'Eb', 'F#'],
            'G#': ['G#', 'A#', 'B', 'C#', 'D#', 'E', 'Fx'],
            'Ab': ['Ab', 'Bb', 'Cb', 'Db', 'Eb', 'Fb', 'G'],
            'A': ['A', 'B', 'C', 'D', 'E', 'F', 'G#'],
            'A#': ['A#', 'B#', 'C#', 'D#', 'E#', 'F#', 'Gx'],
            'Bb': ['Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'A'],
            'B': ['B', 'C#', 'D', 'E', 'F#', 'G', 'A#']
        };
        
        // Map chromatic index to scale degree for harmonic minor
        const formula = [2, 1, 2, 2, 1, 3, 1]; // harmonic minor intervals
        const rootIndex = chromaticScale.indexOf(key.replace('b', '#'));
        let scaleDegree = 0;
        let currentSum = 0;
        
        for (let i = 0; i < formula.length; i++) {
            if (noteIndex === (rootIndex + currentSum) % 12) {
                return harmonicMinorSpellings[key] ? harmonicMinorSpellings[key][i] : chromaticScale[noteIndex];
            }
            currentSum += formula[i];
        }
        
        return chromaticScale[noteIndex];
    }
    
    if (scaleType === 'melodicMinor') {
        const melodicMinorSpellings = {
            'C': ['C', 'D', 'Eb', 'F', 'G', 'A', 'B'],
            'C#': ['C#', 'D#', 'E', 'F#', 'G#', 'A#', 'B#'],
            'Db': ['Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bb', 'C'],
            'D': ['D', 'E', 'F', 'G', 'A', 'B', 'C#'],
            'D#': ['D#', 'E#', 'F#', 'G#', 'A#', 'B#', 'Cx'],
            'Eb': ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'C', 'D'],
            'E': ['E', 'F#', 'G', 'A', 'B', 'C#', 'D#'],
            'F': ['F', 'G', 'Ab', 'Bb', 'C', 'D', 'E'],
            'F#': ['F#', 'G#', 'A', 'B', 'C#', 'D#', 'E#'],
            'Gb': ['Gb', 'Ab', 'Bbb', 'Cb', 'Db', 'Eb', 'F'],
            'G': ['G', 'A', 'Bb', 'C', 'D', 'E', 'F#'],
            'G#': ['G#', 'A#', 'B', 'C#', 'D#', 'E#', 'Fx'],
            'Ab': ['Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F', 'G'],
            'A': ['A', 'B', 'C', 'D', 'E', 'F#', 'G#'],
            'A#': ['A#', 'B#', 'C#', 'D#', 'E#', 'Fx', 'Gx'],
            'Bb': ['Bb', 'C', 'Db', 'Eb', 'F', 'G', 'A'],
            'B': ['B', 'C#', 'D', 'E', 'F#', 'G#', 'A#']
        };
        
        // Map chromatic index to scale degree for melodic minor
        const formula = [2, 1, 2, 2, 2, 2, 1]; // melodic minor intervals
        const rootIndex = chromaticScale.indexOf(key.replace('b', '#'));
        let scaleDegree = 0;
        let currentSum = 0;
        
        for (let i = 0; i < formula.length; i++) {
            if (noteIndex === (rootIndex + currentSum) % 12) {
                return melodicMinorSpellings[key] ? melodicMinorSpellings[key][i] : chromaticScale[noteIndex];
            }
            currentSum += formula[i];
        }
        
        return chromaticScale[noteIndex];
    }
    
    // For major scales, use proper music theory spelling
    if (scaleType === 'major') {
        // Define correct major scale spellings for all keys
        const majorScaleSpellings = {
            'C': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
            'C#': ['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B#'],
            'Db': ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
            'D': ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
            'D#': ['D#', 'E#', 'F##', 'G#', 'A#', 'B#', 'C##'],
            'Eb': ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
            'E': ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
            'F': ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
            'F#': ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'],
            'Gb': ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F'],
            'G': ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
            'G#': ['G#', 'A#', 'B#', 'C#', 'D#', 'E#', 'F##'],
            'Ab': ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
            'A': ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
            'A#': ['A#', 'B#', 'C##', 'D#', 'E#', 'F##', 'G##'],
            'Bb': ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
            'B': ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#']
        };
        
        // Helper function to convert note to chromatic index
        function noteToChromatic(note) {
            const noteMap = {
                'C': 0, 'B#': 0,
                'C#': 1, 'Db': 1, 
                'C##': 2, 'D': 2, 
                'D#': 3, 'Eb': 3,
                'E': 4, 'Fb': 4, 
                'E#': 5, 'F': 5,
                'F#': 6, 'Gb': 6, 
                'F##': 8, 'G': 7,
                'G#': 8, 'Ab': 8,
                'G##': 10, 'A': 9,
                'A#': 10, 'Bb': 10,
                'B': 11, 'Cb': 11
            };
            return noteMap[note] !== undefined ? noteMap[note] : -1;
        }
        
        // Find which scale degree this note represents in the major scale
        const scaleNotes = majorScaleSpellings[key];
        if (scaleNotes) {
            for (let i = 0; i < scaleNotes.length; i++) {
                const scaleNote = scaleNotes[i];
                const scaleNoteIndex = noteToChromatic(scaleNote);
                if (scaleNoteIndex === noteIndex) {
                    return scaleNote;
                }
            }
        }
        
        // Fallback to chromatic scale
        return chromaticScale[noteIndex];
    }
    
    // For other scale types, use the old chromatic spelling rules
    const majorSpellingRules = {
        'C': ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
        'C#': ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
        'Db': ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
        'D': ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
        'D#': ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
        'Eb': ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
        'E': ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
        'F': ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
        'F#': ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
        'Gb': ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
        'G': ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
        'G#': ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
        'Ab': ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
        'A': ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
        'A#': ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
        'Bb': ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
        'B': ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    };
    
    const keyRules = majorSpellingRules[key] || chromaticScale;
    return keyRules[noteIndex] || chromaticScale[noteIndex];
}

// Function to calculate notes from root and formula with proper spelling
function calculateScale(root, formula, scaleType = 'major') {
    if (!root || !formula) {
        console.error('calculateScale: Invalid root or formula', root, formula);
        return [];
    }
    
    // Improved root note normalization to handle both sharp and flat names
    let rootIndex = chromaticScale.indexOf(root);
    
    // If not found, try converting flats to sharps
    if (rootIndex === -1) {
        const flatToSharpMap = {
            'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
        };
        const sharpEquivalent = flatToSharpMap[root];
        if (sharpEquivalent) {
            rootIndex = chromaticScale.indexOf(sharpEquivalent);
        }
    }
    
    // If still not found, try converting sharps to flats for reverse lookup
    if (rootIndex === -1) {
        const sharpToFlatMap = {
            'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'
        };
        const flatEquivalent = sharpToFlatMap[root];
        if (flatEquivalent) {
            rootIndex = chromaticScale.indexOf(root.replace('#', ''));
            if (rootIndex !== -1) {
                rootIndex = (rootIndex + 1) % 12; // Sharp is one semitone up
            }
        }
    }
    
    if (rootIndex === -1) {
        console.error('calculateScale: Invalid root note', root);
        return [];
    }
    
    const notes = [getProperNoteSpelling(rootIndex, root, scaleType)];
    let currentIndex = rootIndex;
    
    for (let i = 0; i < formula.length - 1; i++) {
        currentIndex = (currentIndex + formula[i]) % 12;
        notes.push(getProperNoteSpelling(currentIndex, root, scaleType));
    }
    
    return notes;
}

// Function to get mode from parent scale
function getModeNotes(parentScale, modeIndex) {
    if (!parentScale || !Array.isArray(parentScale) || parentScale.length === 0) {
        console.error('getModeNotes: Invalid parent scale', parentScale);
        return [];
    }
    
    if (modeIndex < 0 || modeIndex >= parentScale.length) {
        console.error('getModeNotes: Invalid mode index', modeIndex, 'for scale length', parentScale.length);
        return parentScale.slice(); // Return copy of original scale
    }
    
    return [...parentScale.slice(modeIndex), ...parentScale.slice(0, modeIndex)];
}

// Function to get interval names
function getIntervals(notes, root) {
    if (!notes || !Array.isArray(notes) || !root) {
        console.error('getIntervals: Invalid notes or root', notes, root);
        return [];
    }
    
    // Simple and direct note to chromatic index mapping
    function noteToIndex(note) {
        if (!note || typeof note !== 'string') return -1;
        
        // Direct mapping of all possible note names to chromatic indices
        const noteMap = {
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
            'B': 11, 'Cb': 11,
            // Double sharps and flats
            'Cx': 2, 'C##': 2,
            'Dx': 4, 'D##': 4,
            'Ex': 6, 'E##': 6,
            'Fx': 8, 'F##': 8,
            'Gx': 10, 'G##': 10,
            'Ax': 0, 'A##': 0,
            'Bx': 1, 'B##': 1,
            'Dbb': 0, 'Ebb': 2, 'Fbb': 3,
            'Gbb': 5, 'Abb': 7, 'Bbb': 9, 'Cbb': 10
        };
        
        return noteMap[note] !== undefined ? noteMap[note] : -1;
    }
    
    // For whole tone scales, always return the characteristic whole tone intervals
    if (notes.length === 6) {
        // Check if this is a whole tone scale by verifying all intervals are whole steps
        const isWholeToneScale = notes.every((note, index) => {
            if (index === 0) return true; // Skip root
            const prevNote = notes[index - 1];
            const currentIndex = noteToIndex(note);
            const prevIndex = noteToIndex(prevNote);
            if (currentIndex === -1 || prevIndex === -1) return false;
            const interval = (currentIndex - prevIndex + 12) % 12;
            return interval === 2; // Whole step = 2 semitones
        });
        
        if (isWholeToneScale) {
            return ['1', '2', '3', '#4', '#5', '#6'];
        }
    }
    
    const rootIndex = noteToIndex(root);
    
    if (rootIndex === -1) {
        console.error('getIntervals: Invalid root note', root);
        return notes.map(() => '?');
    }
    
    const intervalNames = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];
    
    return notes.map(note => {
        const noteIndex = noteToIndex(note);
        
        if (noteIndex === -1) {
            console.error('getIntervals: Invalid note', note);
            return '?';
        }
        
        let interval = (noteIndex - rootIndex + 12) % 12;
        return intervalNames[interval] || '?';
    });
}

// Generate comprehensive scale library
function generateScaleLibrary() {
    const library = {
        major: {},
        harmonic: {},
        melodic: {},
        diminished: {},
        chromatic: {},
        wholeTone: {},
        pentatonic: {},
        blues: {}
    };
    
    // Generate for all 12 keys
    chromaticScale.forEach(key => {
        const properKey = keySignatures[key];
        
        // Major scales and modes
        const majorScale = calculateScale(properKey, scaleFormulas.major);
        
        library.major[`${properKey} Major`] = {
            root: properKey,
            parentScale: `${properKey} Major`,
            scale: majorScale,
            modes: majorModes.map(modeInfo => {
                const modeNotes = getModeNotes(majorScale, modeInfo.mode);
                // The root of the mode is the note at the mode position in the original scale
                const modeRoot = majorScale[modeInfo.mode];
                return {
                    id: `${modeRoot} ${modeInfo.name}`,
                    root: modeRoot,
                    notes: modeNotes,
                    intervals: getIntervals(modeNotes, modeRoot),
                    formula: scaleFormulas.major,
                    mood: modeInfo.mood,
                    description: modeInfo.description,
                    applications: ['Jazz', 'Classical', 'Pop', 'Rock'],
                    parentScale: `${properKey} Major`
                };
            })
        };
        
        // Harmonic Minor scales and modes
        const harmonicMinorScale = calculateScale(properKey, scaleFormulas.harmonicMinor, 'harmonicMinor');
        library.harmonic[`${properKey} Harmonic Minor`] = {
            root: properKey,
            parentScale: `${properKey} Harmonic Minor`,
            scale: harmonicMinorScale,
            modes: harmonicMinorModes.map(modeInfo => {
                const modeNotes = getModeNotes(harmonicMinorScale, modeInfo.mode);
                // The root of the mode is the note at the mode position in the original scale
                const modeRoot = harmonicMinorScale[modeInfo.mode];
                return {
                    id: `${modeRoot} ${modeInfo.name}`,
                    root: modeRoot,
                    notes: modeNotes,
                    intervals: getIntervals(modeNotes, modeRoot),
                    formula: scaleFormulas.harmonicMinor,
                    mood: modeInfo.mood,
                    description: modeInfo.description,
                    applications: ['Classical', 'Neoclassical metal', 'Middle Eastern', 'Jazz'],
                    parentScale: `${properKey} Harmonic Minor`
                };
            })
        };
        
        // Melodic Minor scales and modes
        const melodicMinorScale = calculateScale(properKey, scaleFormulas.melodicMinor, 'melodicMinor');
        library.melodic[`${properKey} Melodic Minor`] = {
            root: properKey,
            parentScale: `${properKey} Melodic Minor`,
            scale: melodicMinorScale,
            modes: melodicMinorModes.map(modeInfo => {
                const modeNotes = getModeNotes(melodicMinorScale, modeInfo.mode);
                // The root of the mode is the note at the mode position in the original scale
                const modeRoot = melodicMinorScale[modeInfo.mode];
                return {
                    id: `${modeRoot} ${modeInfo.name}`,
                    root: modeRoot,
                    notes: modeNotes,
                    intervals: getIntervals(modeNotes, modeRoot),
                    formula: scaleFormulas.melodicMinor,
                    mood: modeInfo.mood,
                    description: modeInfo.description,
                    applications: ['Jazz', 'Modern classical', 'Fusion', 'Film scores'],
                    parentScale: `${properKey} Melodic Minor`
                };
            })
        };
        
        // Diminished scale
        const diminishedScale = calculateScale(properKey, scaleFormulas.diminished);
        library.diminished[`${properKey} Diminished`] = {
            root: properKey,
            parentScale: `${properKey} Diminished`,
            scale: diminishedScale,
            modes: [{
                id: `${properKey} Diminished (W-H)`,
                root: properKey,
                notes: diminishedScale,
                intervals: getIntervals(diminishedScale, properKey),
                formula: scaleFormulas.diminished,
                mood: 'Tense, symmetrical, diminished',
                description: 'Whole-half diminished pattern',
                applications: ['Jazz fusion', 'Modern jazz', 'Diminished harmony'],
                parentScale: `${properKey} Diminished`
            }]
        };
        
        // Chromatic scale (no modes, same for all keys)
        const chromaticScaleNotes = calculateScale(properKey, scaleFormulas.chromatic);
        library.chromatic[`${properKey} Chromatic`] = {
            root: properKey,
            parentScale: `${properKey} Chromatic`,
            scale: chromaticScaleNotes,
            modes: [{
                id: `${properKey} Chromatic`,
                root: properKey,
                notes: chromaticScaleNotes,
                intervals: getIntervals(chromaticScaleNotes, properKey),
                formula: scaleFormulas.chromatic,
                mood: 'Complete, chromatic, all possibilities',
                description: 'All 12 semitones',
                applications: ['Jazz', 'Classical', 'Atonal music', 'Chromatic runs'],
                parentScale: `${properKey} Chromatic`
            }]
        };
        
        // Blues Scale with modes
        const bluesScale = calculateScale(properKey, scaleFormulas.blues);
        library.blues[`${properKey} Blues`] = {
            root: properKey,
            parentScale: `${properKey} Blues`,
            scale: bluesScale,
            modes: bluesScaleModes.map(modeInfo => {
                const modeNotes = getModeNotes(bluesScale, modeInfo.mode);
                // The root of the mode is the note at the mode position in the original scale
                const modeRoot = bluesScale[modeInfo.mode];
                return {
                    id: `${modeRoot} ${modeInfo.name}`,
                    root: modeRoot,
                    notes: modeNotes,
                    intervals: getIntervals(modeNotes, modeRoot),
                    formula: scaleFormulas.blues,
                    mood: modeInfo.mood,
                    description: modeInfo.description,
                    applications: ['Blues', 'Jazz', 'Rock', 'Soul', 'R&B', 'Country'],
                    parentScale: `${properKey} Blues`
                };
            })
        };
    });
    
    // Whole Tone scales - there are only 2 unique whole tone scales in all of music
    // Each root note belongs to one specific whole tone scale - they are NOT modes of each other
    
    // Whole Tone Scale 1: C-D-E-F#-G#-A#
    const wholeToneScale1 = ['C', 'D', 'E', 'F#', 'G#', 'A#'];
    
    // Whole Tone Scale 2: Db-Eb-F-G-A-B  
    const wholeToneScale2 = ['Db', 'Eb', 'F', 'G', 'A', 'B'];
    
    // Map each root note to its specific whole tone scale
    const rootToWholeToneScale = {
        // Whole Tone Scale 1 roots
        'C': wholeToneScale1,
        'D': wholeToneScale1, 
        'E': wholeToneScale1,
        'F#': wholeToneScale1,
        'Gb': wholeToneScale1, // F# enharmonic
        'G#': wholeToneScale1,
        'Ab': wholeToneScale1, // G# enharmonic
        'A#': wholeToneScale1,
        'Bb': wholeToneScale1, // A# enharmonic
        
        // Whole Tone Scale 2 roots
        'C#': wholeToneScale2,
        'Db': wholeToneScale2, // C# enharmonic
        'D#': wholeToneScale2,
        'Eb': wholeToneScale2, // D# enharmonic
        'F': wholeToneScale2,
        'G': wholeToneScale2,
        'A': wholeToneScale2,
        'B': wholeToneScale2
    };
    
    // Generate whole tone scale for each key
    chromaticScale.forEach(key => {
        const properKey = keySignatures[key] || key;
        const scaleNotes = rootToWholeToneScale[properKey];
        
        if (scaleNotes) {
            // Find the starting position of the root in its whole tone scale
            const rootIndex = scaleNotes.indexOf(properKey);
            
            // If exact match not found, try enharmonic equivalents
            let startIndex = rootIndex;
            if (rootIndex === -1) {
                // Handle enharmonic equivalents
                for (let i = 0; i < scaleNotes.length; i++) {
                    const scaleNote = scaleNotes[i];
                    const scaleNoteSharp = scaleNote.replace('b', '#');
                    const properKeySharp = properKey.replace('b', '#');
                    
                    if (scaleNoteSharp === properKeySharp) {
                        startIndex = i;
                        break;
                    }
                }
            }
            
            if (startIndex !== -1) {
                // Rotate the scale to start from the selected key
                const rotatedScale = [...scaleNotes.slice(startIndex), ...scaleNotes.slice(0, startIndex)];
                
                // Determine which scale group this belongs to
                const scaleGroup = scaleNotes === wholeToneScale1 ? 1 : 2;
                
                library.wholeTone[`${properKey} Whole Tone`] = {
                    root: properKey,
                    parentScale: `Whole Tone Scale ${scaleGroup}`,
                    scale: rotatedScale,
                    modes: [{
                        id: `${properKey} Whole Tone Scale`,
                        root: properKey,
                        notes: rotatedScale,
                        intervals: getIntervals(rotatedScale, properKey),
                        formula: scaleFormulas.wholeTone,
                        mood: 'Dreamy, impressionistic, floating',
                        description: `6-note whole tone scale. Contains only whole steps (2 semitones between each note).`,
                        applications: ['Impressionist music', 'Jazz fusion', 'Film scores', 'Ambient'],
                        parentScale: `Whole Tone Scale ${scaleGroup}`
                    }]
                };
            }
        }
    });
    
    return library;
}

// 🎸 SCALE-FIRST INTERFACE SYSTEM
let currentKey = 'C';
let currentCategory = 'major';
let currentPentatonicType = 'major';
let currentMode = null;
let currentPracticeTab = null;
let alphaTabApi = null;

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎸 Initializing Guitar Scale Explorer...');
    
    // Verify required elements exist
    const requiredElements = [
        'scale-library',
        'key-selector', 
        'parent-scale-display',
        'mode-grid'
    ];
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.error('Missing required DOM elements:', missingElements);
        return;
    }
    
    try {
        // Initialize scale library with fixed mode logic
        const scaleLibrary = generateScaleLibrary();
        
        console.log('🎼 Scale Library initialized with', 
            Object.values(scaleLibrary).reduce((total, category) => {
                return total + Object.values(category).reduce((catTotal, key) => {
                    return catTotal + (key.modes ? key.modes.length : 0);
                }, 0);
            }, 0), 
            'scales and modes');
        
        // Make scaleLibrary globally available
        window.scaleLibrary = scaleLibrary;
        
        initializeScaleLibrary();
        setupEventListeners();
        updateParentScaleDisplay();
        renderModeGrid();
        console.log('✅ Guitar Scale Explorer initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing Guitar Scale Explorer:', error);
    }
});

function initializeScaleLibrary() {
    // Hide old elements and show scale library
    const oldElements = ['fileList', 'trackInfo', 'tabPlayer'];
    oldElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });
    
    const scaleLibraryElement = document.getElementById('scale-library');
    if (scaleLibraryElement) scaleLibraryElement.style.display = 'block';
}

function setupEventListeners() {
    // Key selector
    const keySelector = document.getElementById('key-selector');
    if (keySelector) {
        keySelector.addEventListener('change', (e) => {
            currentKey = e.target.value;
            try {
                updateParentScaleDisplay();
                renderModeGrid();
            } catch (error) {
                console.error('Error updating key selection:', error);
            }
        });
    } else {
        console.warn('Key selector not found');
    }
    
    // Pentatonic type selector
    const pentatonicSelector = document.getElementById('pentatonic-type-selector');
    if (pentatonicSelector) {
        pentatonicSelector.addEventListener('change', (e) => {
            currentPentatonicType = e.target.value;
            if (currentCategory === 'pentatonic') {
                try {
                    renderModeGrid();
                } catch (error) {
                    console.error('Error updating pentatonic type:', error);
                }
            }
        });
    }
    
    // Category tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const category = tab.dataset.category;
            if (category) {
                try {
                    switchCategory(category);
                } catch (error) {
                    console.error('Error switching category:', error);
                }
            }
        });
    });
    
    // Navigation buttons
    const backToGridBtn = document.getElementById('back-to-grid');
    if (backToGridBtn) {
        backToGridBtn.addEventListener('click', () => {
            try {
                const modeDetail = document.getElementById('mode-detail');
                const scaleGrid = document.getElementById('scale-grid');
                if (modeDetail) modeDetail.classList.add('hidden');
                if (scaleGrid) scaleGrid.classList.remove('hidden');
            } catch (error) {
                console.error('Error navigating back to grid:', error);
            }
        });
    }
    
    const backToModeBtn = document.getElementById('back-to-mode');
    if (backToModeBtn) {
        backToModeBtn.addEventListener('click', () => {
            try {
                const tabPlayer = document.getElementById('tab-player');
                const modeDetail = document.getElementById('mode-detail');
                if (tabPlayer) tabPlayer.classList.add('hidden');
                if (modeDetail) modeDetail.classList.remove('hidden');
            } catch (error) {
                console.error('Error navigating back to mode:', error);
            }
        });
    }
    
    // File upload
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
    
    // Modal controls
    const modal = document.getElementById('scale-modal');
    const closeModal = document.getElementById('close-modal');
    if (closeModal && modal) {
        closeModal.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }
    
    // Player controls
    setupPlayerControls();
}

function updateParentScaleDisplay() {
    const parentScaleDisplay = document.getElementById('parent-scale-display');
    if (!parentScaleDisplay) {
        console.warn('Parent scale display element not found');
        return;
    }
    
    try {
        // Get the parent scale name based on current category and key
        let parentScaleName = '';
        const properKey = keySignatures[currentKey] || currentKey;
        
        switch (currentCategory) {
            case 'major':
                parentScaleName = `${properKey} Major`;
                break;
            case 'harmonic':
                parentScaleName = `${properKey} Harmonic Minor`;
                break;
            case 'melodic':
                parentScaleName = `${properKey} Melodic Minor`;
                break;
            case 'diminished':
                parentScaleName = `${properKey} Diminished`;
                break;
            case 'chromatic':
                parentScaleName = `${properKey} Chromatic`;
                break;
            case 'wholeTone':
                parentScaleName = `Whole Tone`;
                break;
            case 'pentatonic':
                const pentatonicTypeName = pentatonicTypes[currentPentatonicType]?.name || 'Pentatonic';
                parentScaleName = `${properKey} ${pentatonicTypeName}`;
                break;
            case 'blues':
                parentScaleName = `${properKey} Blues`;
                break;
            default:
                parentScaleName = `${properKey} Scales`;
        }
        
        parentScaleDisplay.textContent = parentScaleName;
    } catch (error) {
        console.error('Error updating parent scale display:', error);
        parentScaleDisplay.textContent = 'Scale Explorer';
    }
}

function switchCategory(category) {
    currentCategory = category;
    
    // Update active tab
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.category === category);
    });
    
    // Show/hide pentatonic selector
    const pentatonicControls = document.getElementById('pentatonic-controls');
    if (pentatonicControls) {
        pentatonicControls.style.display = category === 'pentatonic' ? 'block' : 'none';
    }
    
    updateParentScaleDisplay();
    renderModeGrid();
}

function renderModeGrid() {
    const gridContainer = document.getElementById('mode-grid');
    if (!gridContainer) {
        console.warn('Mode grid container not found');
        return;
    }
    
    try {
        gridContainer.innerHTML = '';
        
        // Handle pentatonic scales specially
        if (currentCategory === 'pentatonic') {
            renderPentatonicModes();
            return;
        }
        
        // Get scales for current category and key
        let scales = [];
        const scaleLibrary = window.scaleLibrary;
        
        if (!scaleLibrary) {
            gridContainer.innerHTML = '<p class="no-content">Scale library not initialized</p>';
            return;
        }
        
        const categoryData = scaleLibrary[currentCategory];
        
        if (categoryData) {
            const properKey = keySignatures[currentKey] || currentKey;
            
            // Find scales that match the current key
            Object.entries(categoryData).forEach(([scaleName, scaleData]) => {
                if (scaleName.startsWith(properKey + ' ')) {
                    scales.push(scaleData);
                }
            });
        }
        
        if (scales.length === 0) {
            gridContainer.innerHTML = '<p class="no-content">No scales available for this key in this category</p>';
            return;
        }
        
        // Display all modes from all matching scales
        scales.forEach(scale => {
            if (scale && scale.modes && Array.isArray(scale.modes)) {
                scale.modes.forEach(mode => {
                    try {
                        const card = createModeCard(mode);
                        if (card) {
                            gridContainer.appendChild(card);
                        }
                    } catch (error) {
                        console.error('Error creating mode card:', error, mode);
                    }
                });
            }
        });
    } catch (error) {
        console.error('Error rendering mode grid:', error);
        gridContainer.innerHTML = '<p class="no-content">Error loading scales. Please refresh the page.</p>';
    }
}

function renderPentatonicModes() {
    const gridContainer = document.getElementById('mode-grid');
    if (!gridContainer) {
        console.warn('Mode grid container not found');
        return;
    }
    
    try {
        const pentatonicType = pentatonicTypes[currentPentatonicType];
        
        if (!pentatonicType) {
            gridContainer.innerHTML = '<p class="no-content">Invalid pentatonic type selected</p>';
            return;
        }
        
        const properKey = keySignatures[currentKey] || currentKey;
        const pentatonicScale = calculateScale(properKey, pentatonicType.formula);
        
        if (!pentatonicScale || pentatonicScale.length === 0) {
            gridContainer.innerHTML = '<p class="no-content">Error generating pentatonic scale</p>';
            return;
        }
        
        pentatonicType.modes.forEach(modeInfo => {
            try {
                const modeNotes = getModeNotes(pentatonicScale, modeInfo.mode);
                if (modeNotes && modeNotes.length > 0) {
                    // The root of the mode is the note at the mode position in the original scale
                    const modeRoot = pentatonicScale[modeInfo.mode];
                    
                    const mode = {
                        id: `${modeRoot} ${modeInfo.name}`,
                        root: modeRoot,
                        notes: modeNotes,
                        intervals: getIntervals(modeNotes, modeRoot),
                        formula: pentatonicType.formula,
                        mood: modeInfo.mood,
                        description: modeInfo.description,
                        applications: ['Folk', 'Country', 'Rock solos', 'Pop melodies', 'Blues', 'Jazz'],
                        parentScale: `${properKey} ${pentatonicType.name}`
                    };
                    
                    const card = createModeCard(mode);
                    if (card) {
                        gridContainer.appendChild(card);
                    }
                }
            } catch (error) {
                console.error('Error creating pentatonic mode:', error, modeInfo);
            }
        });
    } catch (error) {
        console.error('Error rendering pentatonic modes:', error);
        gridContainer.innerHTML = '<p class="no-content">Error loading pentatonic scales. Please refresh the page.</p>';
    }
}

function createModeCard(mode) {
    if (!mode || !mode.id) {
        console.error('Invalid mode data:', mode);
        return null;
    }
    
    try {
        const card = document.createElement('div');
        card.className = 'mode-card';
        
        // Ensure all properties exist with fallbacks
        const notes = (mode.notes && Array.isArray(mode.notes)) ? mode.notes.join(' - ') : 'N/A';
        const intervals = (mode.intervals && Array.isArray(mode.intervals)) ? mode.intervals.join(' - ') : 'N/A';
        const parentScale = mode.parentScale || 'Unknown';
        const mood = mode.mood || 'Not specified';
        const description = mode.description || 'No description available';
        
        card.innerHTML = `
            <h3 class="mode-card-title">${mode.id}</h3>
            <p class="mode-card-parent">From: ${parentScale}</p>
            <p class="mode-card-mood">${mood}</p>
            <p class="mode-card-description">${description}</p>
            <div class="mode-card-details">
                <div class="mode-card-notes"><strong>Notes:</strong> ${notes}</div>
                <div class="mode-card-intervals"><strong>Intervals:</strong> ${intervals}</div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            try {
                openModeDetail(mode);
            } catch (error) {
                console.error('Error opening mode detail:', error);
            }
        });
        
        return card;
    } catch (error) {
        console.error('Error creating mode card element:', error);
        return null;
    }
}

function openModeDetail(mode) {
    currentMode = mode;
    renderModeDetails(mode);
}

function renderModeDetails(mode) {
    if (!mode) return;
    
    // Update header
    document.getElementById('mode-name').textContent = mode.id;
    document.getElementById('mode-root').textContent = mode.root;
    
    // Update theory section
    document.getElementById('mode-formula').textContent = mode.intervals.join(' - ');
    document.getElementById('mode-intervals').textContent = mode.intervals.join(' - ');
    document.getElementById('mode-notes').textContent = mode.notes.join(' - ');
    document.getElementById('mode-mood').textContent = mode.mood;
    document.getElementById('mode-description').textContent = mode.description;
    
    // Update applications
    const applicationsList = document.getElementById('mode-applications');
    applicationsList.innerHTML = '';
    mode.applications.forEach(app => {
        const li = document.createElement('li');
        li.textContent = app;
        applicationsList.appendChild(li);
    });
    
    // Render fretboard patterns using the fretboard library
    renderScaleFretboard(mode, 'fretboard-container');
    
    // Render practice tabs (placeholder for now)
    renderPracticeTabs([]);
    
    // Show mode detail view
    document.getElementById('mode-detail').classList.remove('hidden');
    document.getElementById('scale-grid').classList.add('hidden');
}

function renderScaleFretboard(scale, containerId = 'fretboard-container') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Fretboard container not found:', containerId);
        return;
    }

    // Create toggle button container
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'fretboard-toggle-container';
    toggleContainer.innerHTML = `
        <div class="fretboard-toggle-wrapper">
            <button class="fretboard-toggle-btn ${fretboardDisplayMode === 'notes' ? 'active' : ''}" 
                    onclick="toggleFretboardDisplay('notes', '${containerId}', '${scale.root}', '${scale.id || scale.name || 'Scale'}')">
                Note Names
            </button>
            <button class="fretboard-toggle-btn ${fretboardDisplayMode === 'intervals' ? 'active' : ''}" 
                    onclick="toggleFretboardDisplay('intervals', '${containerId}', '${scale.root}', '${scale.id || scale.name || 'Scale'}')">
                Intervals
            </button>
        </div>
    `;

    // Create fretboard container
    const fretboardContainer = document.createElement('div');
    fretboardContainer.className = 'fretboard-display-container';
    
    // Clear container and add both toggle and fretboard
    container.innerHTML = '';
    container.appendChild(toggleContainer);
    container.appendChild(fretboardContainer);

    // Generate the fretboard SVG
    const fretboardSVG = generateFretboard(scale, fretboardDisplayMode);
    fretboardContainer.innerHTML = fretboardSVG;

    // Make fretboard clickable for modal
    const svgElement = fretboardContainer.querySelector('.fretboard-svg');
    if (svgElement) {
        svgElement.style.cursor = 'pointer';
        svgElement.onclick = () => openFretboardModal(scale);
    }
}

function openFretboardModal(scale) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('fretboard-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'fretboard-modal';
        modal.className = 'modal fretboard-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="fretboard-modal-title">Fretboard Pattern</h3>
                    <button class="close-btn" onclick="closeFretboardModal()">×</button>
                </div>
                <div class="modal-body" id="fretboard-modal-body">
                    <!-- Modal content will be populated here -->
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeFretboardModal();
            }
        });
    }
    
    // Update modal content
    const title = document.getElementById('fretboard-modal-title');
    const body = document.getElementById('fretboard-modal-body');
    
    title.textContent = `${scale.id} - ${scale.root}`;
    
    // Create scale info section
    const scaleInfo = document.createElement('div');
    scaleInfo.className = 'scale-info';
    scaleInfo.innerHTML = `
        <h3>${scale.id}</h3>
        <div class="scale-details">
            <div class="scale-detail-item">
                <strong>Root:</strong>
                ${scale.root}
            </div>
            <div class="scale-detail-item">
                <strong>Notes:</strong>
                ${scale.notes.join(' - ')}
            </div>
            <div class="scale-detail-item">
                <strong>Intervals:</strong>
                ${scale.intervals.join(' - ')}
            </div>
        </div>
    `;
    
    // Create toggle buttons for modal
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'fretboard-toggle-container';
    toggleContainer.innerHTML = `
        <div class="fretboard-toggle-wrapper">
            <button class="fretboard-toggle-btn ${fretboardDisplayMode === 'notes' ? 'active' : ''}" 
                    onclick="toggleModalFretboardDisplay('notes')">
                Note Names
            </button>
            <button class="fretboard-toggle-btn ${fretboardDisplayMode === 'intervals' ? 'active' : ''}" 
                    onclick="toggleModalFretboardDisplay('intervals')">
                Intervals
            </button>
        </div>
    `;
    
    // Create fretboard container for modal
    const fretboardContainer = document.createElement('div');
    fretboardContainer.className = 'fretboard-container';
    fretboardContainer.id = 'modal-fretboard-container';
    
    // Generate enlarged fretboard
    const fretboardSVG = generateFretboard(scale, fretboardDisplayMode, true);
    fretboardContainer.innerHTML = fretboardSVG;
    
    // Clear and populate modal body
    body.innerHTML = '';
    body.appendChild(scaleInfo);
    body.appendChild(toggleContainer);
    body.appendChild(fretboardContainer);
    
    // Show modal
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeFretboardModal() {
    const modal = document.getElementById('fretboard-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function toggleModalFretboardDisplay(mode) {
    fretboardDisplayMode = mode;
    
    // Update button states in modal
    const modal = document.getElementById('fretboard-modal');
    if (modal) {
        const buttons = modal.querySelectorAll('.fretboard-toggle-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        buttons.forEach(btn => {
            if ((mode === 'notes' && btn.textContent.trim() === 'Note Names') ||
                (mode === 'intervals' && btn.textContent.trim() === 'Intervals')) {
                btn.classList.add('active');
            }
        });
        
        // Regenerate fretboard with new display mode
        const fretboardContainer = document.getElementById('modal-fretboard-container');
        if (fretboardContainer && currentMode) {
            const fretboardSVG = generateFretboard(currentMode, fretboardDisplayMode, true);
            fretboardContainer.innerHTML = fretboardSVG;
        }
    }
}

// Function to toggle fretboard display between notes and intervals
function toggleFretboardDisplay(mode, containerId, root, scaleName) {
    fretboardDisplayMode = mode;
    
    // Update button states
    const container = document.getElementById(containerId);
    if (container) {
        const buttons = container.querySelectorAll('.fretboard-toggle-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        buttons.forEach(btn => {
            if ((mode === 'notes' && btn.textContent.trim() === 'Note Names') ||
                (mode === 'intervals' && btn.textContent.trim() === 'Intervals')) {
                btn.classList.add('active');
            }
        });
        
        // Get the current scale data
        const scale = getCurrentScale();
        if (scale) {
            // Regenerate fretboard with new display mode
            const fretboardContainer = container.querySelector('.fretboard-display-container');
            if (fretboardContainer) {
                const fretboardSVG = generateFretboard(scale, fretboardDisplayMode);
                fretboardContainer.innerHTML = fretboardSVG;
                
                // Re-add click handler for modal
                const svgElement = fretboardContainer.querySelector('.fretboard-svg');
                if (svgElement) {
                    svgElement.style.cursor = 'pointer';
                    svgElement.onclick = () => openFretboardModal(scale);
                }
            }
        }
    }
}

// Function to get current scale data
function getCurrentScale() {
    return currentMode;
}

// Function to render practice tabs (placeholder for now)
function renderPracticeTabs(tabs = []) {
    const practiceContainer = document.getElementById('practice-tabs');
    if (!practiceContainer) {
        console.warn('Practice tabs container not found');
        return;
    }
    
    if (tabs.length === 0) {
        practiceContainer.innerHTML = '<p class="no-content">Practice exercises coming soon!</p>';
        return;
    }
    
    practiceContainer.innerHTML = '';
    
    tabs.forEach(tab => {
        const tabCard = document.createElement('div');
        tabCard.className = 'practice-tab-card';
        tabCard.innerHTML = `
            <h4 class="practice-tab-title">${tab.title}</h4>
            <p class="practice-tab-description">${tab.description}</p>
            <div class="practice-tab-meta">
                <span class="practice-tab-tempo">♩ = ${tab.tempo || 120}</span>
                <span class="practice-tab-difficulty ${tab.difficulty || 'beginner'}">${tab.difficulty || 'Beginner'}</span>
            </div>
        `;
        
        tabCard.addEventListener('click', () => {
            // Load practice tab (placeholder)
            console.log('Loading practice tab:', tab.title);
        });
        
        practiceContainer.appendChild(tabCard);
    });
}

// Function to setup player controls (placeholder)
function setupPlayerControls() {
    // Player controls setup would go here
    // This is a placeholder for future guitar tab player functionality
    console.log('Player controls setup - placeholder');
}

// Function to handle file upload (placeholder)
function handleFileUpload(event) {
    // File upload handling would go here
    // This is a placeholder for future file upload functionality
    console.log('File upload handled - placeholder');
}
