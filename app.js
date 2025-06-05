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

// Music theory-based key signatures
// Sharp keys naturally use sharps, flat keys naturally use flats
const musicTheoryKeys = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Key signature preference following traditional music theory
const keySignatures = {
    'C': 'C',   // Natural key (no sharps/flats)
    'C#': 'Db', // Prefer Db (5 flats) over C# (7 sharps)
    'Db': 'Db', 
    'D': 'D',   // Sharp key (2 sharps)
    'D#': 'Eb', // Prefer Eb (3 flats) over D# (9 sharps)
    'Eb': 'Eb', 
    'E': 'E',   // Sharp key (4 sharps)
    'F': 'F',   // Flat key (1 flat)
    'F#': 'Gb', // Prefer Gb (6 flats) over F# (6 sharps) 
    'Gb': 'Gb', 
    'G': 'G',   // Sharp key (1 sharp)
    'G#': 'Ab', // Prefer Ab (4 flats) over G# (8 sharps)
    'Ab': 'Ab', 
    'A': 'A',   // Sharp key (3 sharps)
    'A#': 'Bb', // Prefer Bb (2 flats) over A# (10 sharps)
    'Bb': 'Bb', 
    'B': 'B'    // Sharp key (5 sharps)
};

// Enharmonic equivalents explanation for educational purposes
const enharmonicExplanations = {
    'Db': 'Db is the same pitch as C#, but we use Db because the key signature (5 flats) is more practical than C# (7 sharps)',
    'Eb': 'Eb is the same pitch as D#, but we use Eb because the key signature (3 flats) is more practical than D# (9 sharps)', 
    'Gb': 'Gb is the same pitch as F#, but both are equally valid. Gb (6 flats) vs F# (6 sharps) - we chose Gb for consistency',
    'Ab': 'Ab is the same pitch as G#, but we use Ab because the key signature (4 flats) is more practical than G# (8 sharps)',
    'Bb': 'Bb is the same pitch as A#, but we use Bb because the key signature (2 flats) is more practical than A# (10 sharps)'
};

// Which keys naturally use flats vs sharps in traditional music theory
const naturalKeySignatures = {
    // Major scales that use flats
    flats: ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'],
    // Major scales that use sharps  
    sharps: ['G', 'D', 'A', 'E', 'B'],
    // C major uses neither
    natural: ['C']
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
            'Db': ['Db', 'Eb', 'E', 'Gb', 'Ab', 'A', 'C'],
            'D': ['D', 'E', 'F', 'G', 'A', 'Bb', 'C#'],
            'D#': ['D#', 'E#', 'F#', 'G#', 'A#', 'B', 'C##'],
            'Eb': ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'B', 'D'],
            'E': ['E', 'F#', 'G', 'A', 'B', 'C', 'D#'],
            'F': ['F', 'G', 'Ab', 'Bb', 'C', 'Db', 'E'],
            'F#': ['F#', 'G#', 'A', 'B', 'C#', 'D', 'E#'],
            'Gb': ['Gb', 'Ab', 'A', 'B', 'Db', 'D', 'F'],
            'G': ['G', 'A', 'Bb', 'C', 'D', 'Eb', 'F#'],
            'G#': ['G#', 'A#', 'B', 'C#', 'D#', 'E', 'F##'],
            'Ab': ['Ab', 'Bb', 'B', 'Db', 'Eb', 'E', 'G'],
            'A': ['A', 'B', 'C', 'D', 'E', 'F', 'G#'],
            'A#': ['A#', 'B#', 'C#', 'D#', 'E#', 'F#', 'G##'],
            'Bb': ['Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'A'],
            'B': ['B', 'C#', 'D', 'E', 'F#', 'G', 'A#']
        };
        
        // Get the spelling for this key
        const scaleNotes = harmonicMinorSpellings[key];
        if (scaleNotes) {
            // Map chromatic index to scale degree for harmonic minor
            const formula = [2, 1, 2, 2, 1, 3, 1]; // harmonic minor intervals
            // Use correct chromatic index for the key
            let rootIndex = chromaticScale.indexOf(key);
            if (rootIndex === -1) {
                // Handle flat keys correctly
                const flatToSharpMap = {
                    'Db': 1, 'Eb': 3, 'Gb': 6, 'Ab': 8, 'Bb': 10
                };
                rootIndex = flatToSharpMap[key];
                if (rootIndex === undefined) {
                    rootIndex = chromaticScale.indexOf(key.replace('b', '#'));
                }
            }
            
            // Check if this is the root note
            if (noteIndex === rootIndex) {
                return scaleNotes[0];
            }
            
            // Calculate the chromatic positions of each scale degree
            let currentIndex = rootIndex;
            for (let i = 0; i < formula.length; i++) {
                currentIndex = (currentIndex + formula[i]) % 12;
                if (noteIndex === currentIndex) {
                    return scaleNotes[i + 1];
                }
            }
        }
        
        return chromaticScale[noteIndex];
    }
    
    if (scaleType === 'melodicMinor') {
        const melodicMinorSpellings = {
            'C': ['C', 'D', 'Eb', 'F', 'G', 'A', 'B'],
            'C#': ['C#', 'D#', 'E', 'F#', 'G#', 'A#', 'B#'],
            'Db': ['Db', 'Eb', 'E', 'Gb', 'Ab', 'Bb', 'C'],
            'D': ['D', 'E', 'F', 'G', 'A', 'B', 'C#'],
            'D#': ['D#', 'E#', 'F#', 'G#', 'A#', 'B#', 'C##'],
            'Eb': ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'C', 'D'],
            'E': ['E', 'F#', 'G', 'A', 'B', 'C#', 'D#'],
            'F': ['F', 'G', 'Ab', 'Bb', 'C', 'D', 'E'],
            'F#': ['F#', 'G#', 'A', 'B', 'C#', 'D#', 'E#'],
            'Gb': ['Gb', 'Ab', 'A', 'B', 'Db', 'Eb', 'F'],
            'G': ['G', 'A', 'Bb', 'C', 'D', 'E', 'F#'],
            'G#': ['G#', 'A#', 'B', 'C#', 'D#', 'E#', 'F##'],
            'Ab': ['Ab', 'Bb', 'B', 'Db', 'Eb', 'F', 'G'],
            'A': ['A', 'B', 'C', 'D', 'E', 'F#', 'G#'],
            'A#': ['A#', 'B#', 'C#', 'D#', 'E#', 'F##', 'G##'],
            'Bb': ['Bb', 'C', 'Db', 'Eb', 'F', 'G', 'A'],
            'B': ['B', 'C#', 'D', 'E', 'F#', 'G#', 'A#']
        };
        
        // Get the spelling for this key
        const scaleNotes = melodicMinorSpellings[key];
        if (scaleNotes && scaleNotes.length === 7) {
            // Calculate which scale degree this chromatic index represents
            // Use correct chromatic index for the key
            let rootIndex = chromaticScale.indexOf(key);
            if (rootIndex === -1) {
                // Handle flat keys correctly
                const flatToSharpMap = {
                    'Db': 1, 'Eb': 3, 'Gb': 6, 'Ab': 8, 'Bb': 10
                };
                rootIndex = flatToSharpMap[key];
                if (rootIndex === undefined) {
                    rootIndex = chromaticScale.indexOf(key.replace('b', '#'));
                }
            }
            
            const formula = [2, 1, 2, 2, 2, 2, 1]; // melodic minor intervals
            
            // Check if this is the root note
            if (noteIndex === rootIndex) {
                return scaleNotes[0];
            }
            
            // Calculate the chromatic positions of each scale degree
            let currentIndex = rootIndex;
            for (let i = 0; i < formula.length; i++) {
                currentIndex = (currentIndex + formula[i]) % 12;
                if (noteIndex === currentIndex) {
                    return scaleNotes[i + 1];
                }
            }
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
    
    // Debug logging for specific cases
    if (root === 'Db' && scaleType === 'melodicMinor') {
        console.log('🎵 DEBUG: Calculating Db Melodic Minor');
        console.log('Formula:', formula);
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
    
    if (root === 'Db' && scaleType === 'melodicMinor') {
        console.log('🎵 DEBUG: Root index for Db:', rootIndex);
    }
    
    // Always use the original root name as the first note
    const notes = [root];
    let currentIndex = rootIndex;
    
    for (let i = 0; i < formula.length - 1; i++) {
        currentIndex = (currentIndex + formula[i]) % 12;
        const nextNote = getProperNoteSpelling(currentIndex, root, scaleType);
        
        if (root === 'Db' && scaleType === 'melodicMinor') {
            console.log(`🎵 DEBUG: Step ${i + 1}: chromatic index ${currentIndex} -> note "${nextNote}"`);
        }
        
        notes.push(nextNote);
    }
    
    if (root === 'Db' && scaleType === 'melodicMinor') {
        console.log('🎵 DEBUG: Final notes:', notes);
    }
    
    return notes;
}

// Function to calculate mode from parent scale formula
function getModeNotes(parentScale, modeIndex, parentFormula, scaleType = 'major') {
    if (!parentScale || !Array.isArray(parentScale) || parentScale.length === 0) {
        console.error('getModeNotes: Invalid parent scale', parentScale);
        return [];
    }
    
    if (modeIndex < 0 || modeIndex >= parentScale.length) {
        console.error('getModeNotes: Invalid mode index', modeIndex, 'for scale length', parentScale.length);
        return parentScale.slice(); // Return copy of original scale
    }

    // For mode 0, return the original parent scale
    if (modeIndex === 0) {
        return parentScale.slice();
    }

    // For all other modes, simply rotate the parent scale notes
    // This preserves the original parent scale's note spellings
    const rotatedNotes = [
        ...parentScale.slice(modeIndex), 
        ...parentScale.slice(0, modeIndex)
    ];
    
    return rotatedNotes;
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

    const rootIndex = noteToIndex(root);
    if (rootIndex === -1) {
        console.error('getIntervals: Invalid root note', root);
        return notes.map(() => '?');
    }

    // For whole tone scales, always return the characteristic whole tone intervals
    if (notes.length === 6) {
        return ['1', '2', '3', '#4', '#5', '#6'];
    }

    // For harmonic minor scales, use the known interval pattern
    if (notes.length === 7 && isHarmonicMinorPattern(notes, root)) {
        return ['1', '2', 'b3', '4', '5', 'b6', '7'];
    }

    // For melodic minor scales, use the known interval pattern
    if (notes.length === 7 && isMelodicMinorPattern(notes, root)) {
        return ['1', '2', 'b3', '4', '5', '6', '7'];
    }

    // For major scales, use the known interval pattern
    if (notes.length === 7 && isMajorPattern(notes, root)) {
        return ['1', '2', '3', '4', '5', '6', '7'];
    }

    // For other scale lengths or unidentified 7-note scales, use chromatic distance method
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

// Helper function to detect if a scale follows the harmonic minor pattern
function isHarmonicMinorPattern(notes, root) {
    if (notes.length !== 7) return false;
    
    function noteToIndex(note) {
        const noteMap = {
            'C': 0, 'B#': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4, 'Fb': 4, 'F': 5, 'E#': 5, 'F#': 6, 'Gb': 6, 'G': 7,
            'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11, 'Cb': 11,
            'Cx': 2, 'C##': 2, 'Dx': 4, 'D##': 4, 'Ex': 6, 'E##': 6,
            'Fx': 8, 'F##': 8, 'Gx': 10, 'G##': 10, 'Ax': 0, 'A##': 0,
            'Bx': 1, 'B##': 1, 'Dbb': 0, 'Ebb': 2, 'Fbb': 3,
            'Gbb': 5, 'Abb': 7, 'Bbb': 9, 'Cbb': 10
        };
        return noteMap[note] !== undefined ? noteMap[note] : -1;
    }
    
    const rootIndex = noteToIndex(root);
    const intervals = notes.map(note => (noteToIndex(note) - rootIndex + 12) % 12);
    
    // Harmonic minor pattern: 0, 2, 3, 5, 7, 8, 11 (1, 2, b3, 4, 5, b6, 7)
    const harmonicMinorPattern = [0, 2, 3, 5, 7, 8, 11];
    return JSON.stringify(intervals) === JSON.stringify(harmonicMinorPattern);
}

// Helper function to detect if a scale follows the melodic minor pattern
function isMelodicMinorPattern(notes, root) {
    if (notes.length !== 7) return false;
    
    function noteToIndex(note) {
        const noteMap = {
            'C': 0, 'B#': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4, 'Fb': 4, 'F': 5, 'E#': 5, 'F#': 6, 'Gb': 6, 'G': 7,
            'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11, 'Cb': 11,
            'Cx': 2, 'C##': 2, 'Dx': 4, 'D##': 4, 'Ex': 6, 'E##': 6,
            'Fx': 8, 'F##': 8, 'Gx': 10, 'G##': 10, 'Ax': 0, 'A##': 0,
            'Bx': 1, 'B##': 1, 'Dbb': 0, 'Ebb': 2, 'Fbb': 3,
            'Gbb': 5, 'Abb': 7, 'Bbb': 9, 'Cbb': 10
        };
        return noteMap[note] !== undefined ? noteMap[note] : -1;
    }
    
    const rootIndex = noteToIndex(root);
    const intervals = notes.map(note => (noteToIndex(note) - rootIndex + 12) % 12);
    
    // Melodic minor pattern: 0, 2, 3, 5, 7, 9, 11 (1, 2, b3, 4, 5, 6, 7)
    const melodicMinorPattern = [0, 2, 3, 5, 7, 9, 11];
    return JSON.stringify(intervals) === JSON.stringify(melodicMinorPattern);
}

// Helper function to detect if a scale follows the major pattern
function isMajorPattern(notes, root) {
    if (notes.length !== 7) return false;
    
    function noteToIndex(note) {
        const noteMap = {
            'C': 0, 'B#': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4, 'Fb': 4, 'F': 5, 'E#': 5, 'F#': 6, 'Gb': 6, 'G': 7,
            'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11, 'Cb': 11,
            'Cx': 2, 'C##': 2, 'Dx': 4, 'D##': 4, 'Ex': 6, 'E##': 6,
            'Fx': 8, 'F##': 8, 'Gx': 10, 'G##': 10, 'Ax': 0, 'A##': 0,
            'Bx': 1, 'B##': 1, 'Dbb': 0, 'Ebb': 2, 'Fbb': 3,
            'Gbb': 5, 'Abb': 7, 'Bbb': 9, 'Cbb': 10
        };
        return noteMap[note] !== undefined ? noteMap[note] : -1;
    }
    
    const rootIndex = noteToIndex(root);
    const intervals = notes.map(note => (noteToIndex(note) - rootIndex + 12) % 12);
    
    // Major pattern: 0, 2, 4, 5, 7, 9, 11 (1, 2, 3, 4, 5, 6, 7)
    const majorPattern = [0, 2, 4, 5, 7, 9, 11];
    return JSON.stringify(intervals) === JSON.stringify(majorPattern);
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
                const modeNotes = getModeNotes(majorScale, modeInfo.mode, scaleFormulas.major);
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
                const modeNotes = getModeNotes(harmonicMinorScale, modeInfo.mode, scaleFormulas.harmonicMinor, 'harmonicMinor');
                // The root of the mode is the note at the mode position in the original scale
                const modeRoot = harmonicMinorScale[modeInfo.mode];
                
                // For the first mode (index 0), use harmonic minor intervals
                let intervals;
                if (modeInfo.mode === 0) {
                    intervals = ['1', '2', 'b3', '4', '5', 'b6', '7'];
                } else {
                    intervals = getIntervals(modeNotes, modeRoot);
                }
                
                return {
                    id: `${modeRoot} ${modeInfo.name}`,
                    root: modeRoot,
                    notes: modeNotes,
                    intervals: intervals,
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
                const modeNotes = getModeNotes(melodicMinorScale, modeInfo.mode, scaleFormulas.melodicMinor, 'melodicMinor');
                // The root of the mode is the note at the mode position in the original scale
                const modeRoot = melodicMinorScale[modeInfo.mode];
                
                // For the first mode (index 0), use melodic minor intervals
                let intervals;
                if (modeInfo.mode === 0) {
                    intervals = ['1', '2', 'b3', '4', '5', '6', '7'];
                } else {
                    intervals = getIntervals(modeNotes, modeRoot);
                }
                
                return {
                    id: `${modeRoot} ${modeInfo.name}`,
                    root: modeRoot,
                    notes: modeNotes,
                    intervals: intervals,
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
                const modeNotes = getModeNotes(bluesScale, modeInfo.mode, scaleFormulas.blues);
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
    // Key selector change handler
    document.getElementById('key-selector').addEventListener('change', function() {
        currentKey = this.value; // Update the global currentKey variable
        updateParentScaleDisplay();
        const category = document.querySelector('.category-tab.active').dataset.category;
        switchCategory(category);
    });

    // Initialize key selector with music theory-based keys
    initializeKeySelector();

    // Category tab handlers
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.dataset.category;
            switchCategory(category);
            
            // Update active tab
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Pentatonic type selector change handler
    document.getElementById('pentatonic-type-selector').addEventListener('change', function() {
        currentPentatonicType = this.value; // Update the global currentPentatonicType variable
        if (document.querySelector('.category-tab.active').dataset.category === 'pentatonic') {
            renderPentatonicModes();
        }
    });

    // Back navigation handlers
    document.getElementById('back-to-grid')?.addEventListener('click', function() {
        document.getElementById('mode-detail').classList.add('hidden');
        document.getElementById('scale-library').classList.remove('hidden');
        renderModeGrid(); // Re-render the grid to show cards
    });

    document.getElementById('back-to-mode')?.addEventListener('click', function() {
        document.getElementById('tab-player').classList.add('hidden');
        document.getElementById('mode-detail').classList.remove('hidden');
    });

    // Modal close handler
    document.getElementById('close-modal')?.addEventListener('click', closeFretboardModal);

    // File upload handler
    document.getElementById('file-input')?.addEventListener('change', handleFileUpload);

    // Setup player controls if they exist
    setupPlayerControls();

    // Update parent scale display initially
    updateParentScaleDisplay();
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
                const modeNotes = getModeNotes(pentatonicScale, modeInfo.mode, pentatonicType.formula);
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

// Function to initialize key selector with music theory-based keys
function initializeKeySelector() {
    const keySelector = document.getElementById('key-selector');
    if (!keySelector) return;
    
    // Clear existing options
    keySelector.innerHTML = '';
    
    // Add music theory-based keys
    musicTheoryKeys.forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        keySelector.appendChild(option);
    });
    
    // Set default to C
    keySelector.value = 'C';
    currentKey = 'C';
    
    // Add event listener to update explanation when key changes
    keySelector.addEventListener('change', updateKeyExplanation);
    
    // Add the explanation section separately from the dropdown
    addKeyExplanationSection();
    
    // Initialize explanation for default key
    updateKeyExplanation();
}

// Function to add the key explanation section to the page
function addKeyExplanationSection() {
    // Find the key selector section
    const keySelectorSection = document.querySelector('.key-selector-section');
    if (!keySelectorSection) return;
    
    // Check if explanation section already exists
    if (document.getElementById('key-explanation-section')) return;
    
    // Create the explanation section after the key selector section
    const explanationSection = document.createElement('div');
    explanationSection.id = 'key-explanation-section';
    explanationSection.className = 'key-explanation-section';
    explanationSection.innerHTML = `
        <div id="key-explanation" class="key-explanation">
            <div class="key-explanation-header">
                <span class="icon">🎼</span>
                <h4>Music Theory Spelling System</h4>
            </div>
            <div class="key-explanation-content">
                Loading theoretical explanation...
            </div>
        </div>
    `;
    
    // Insert after the key selector section
    keySelectorSection.parentNode.insertBefore(explanationSection, keySelectorSection.nextSibling);
}

// Function to update the key explanation based on selected key
function updateKeyExplanation() {
    const keySelector = document.getElementById('key-selector');
    const currentKey = keySelector ? keySelector.value : 'C';
    const currentCategory = getCurrentCategory();
    
    const explanation = getContextualKeyExplanation(currentKey, currentCategory);
    
    const keyExplanation = document.getElementById('key-explanation');
    if (keyExplanation) {
        keyExplanation.className = `key-explanation ${explanation.type}`;
        keyExplanation.innerHTML = `
            <div class="key-explanation-header">
                <span class="icon">${getExplanationIcon(explanation.type)}</span>
                <h4>Music Theory Spelling System</h4>
            </div>
            <div class="key-explanation-content">
                ${explanation.text}
            </div>
        `;
    }
}

// Helper function to get appropriate icon for explanation type
function getExplanationIcon(type) {
    switch (type) {
        case 'traditional': return '🎼';
        case 'symmetric': return '🔄';
        case 'pentatonic': return '🎸';
        default: return '📝';
    }
}

// Helper function to get current category
function getCurrentCategory() {
    const activeTab = document.querySelector('.category-tab.active');
    if (activeTab) {
        const tabText = activeTab.textContent.toLowerCase().trim();
        if (tabText.includes('harmonic')) return 'harmonic-minor';
        if (tabText.includes('melodic')) return 'melodic-minor';
        if (tabText.includes('diminished')) return 'diminished';
        if (tabText.includes('chromatic')) return 'chromatic';
        if (tabText.includes('whole')) return 'whole-tone';
        if (tabText.includes('pentatonic')) return 'pentatonic';
        if (tabText.includes('blues')) return 'blues';
        return 'major';
    }
    return 'major';
}

// Function to get contextual explanation based on key and scale category
function getContextualKeyExplanation(key, category) {
    const isFlat = key.includes('b');
    const isSharp = key.includes('#');
    const keyName = key.replace('b', '♭').replace('#', '♯');
    
    let explanation = {
        text: '',
        type: 'traditional'
    };
    
    // Core theoretical foundation
    const coreTheory = `<div class="theory-foundation">
        <strong>Theoretical Foundation:</strong> Keys follow traditional music theory where <strong>sharp keys</strong> (G, D, A, E, B) use sharps, and <strong>flat keys</strong> (F, B♭, E♭, A♭, D♭, G♭) use flats consistently throughout their scales.
    </div>`;
    
    // Key-specific explanation
    let keySpecific = '';
    let scaleApplication = '';
    let enharmonicNote = '';
    
    // Determine key type and enharmonic information
    const keyTypes = {
        'C': { type: 'natural', enharmonic: null },
        'G': { type: 'sharp', enharmonic: null },
        'D': { type: 'sharp', enharmonic: null },
        'A': { type: 'sharp', enharmonic: null },
        'E': { type: 'sharp', enharmonic: null },
        'B': { type: 'sharp', enharmonic: 'C♭' },
        'F': { type: 'flat', enharmonic: null },
        'Bb': { type: 'flat', enharmonic: 'A♯' },
        'Eb': { type: 'flat', enharmonic: 'D♯' },
        'Ab': { type: 'flat', enharmonic: 'G♯' },
        'Db': { type: 'flat', enharmonic: 'C♯' },
        'Gb': { type: 'flat', enharmonic: 'F♯' }
    };
    
    const keyInfo = keyTypes[key] || { type: 'unknown', enharmonic: null };
    
    if (keyInfo.type === 'natural') {
        keySpecific = `<strong>${keyName}</strong> is the natural key with no sharps or flats in its key signature.`;
    } else if (keyInfo.type === 'sharp') {
        keySpecific = `<strong>${keyName}</strong> is a sharp key, using only sharp accidentals (♯) throughout its scales for consistent note spelling.`;
        if (keyInfo.enharmonic) {
            enharmonicNote = ` While enharmonically equivalent to ${keyInfo.enharmonic}, we use ${keyName} as the standard theoretical spelling.`;
        }
    } else if (keyInfo.type === 'flat') {
        keySpecific = `<strong>${keyName}</strong> is a flat key, using only flat accidentals (♭) throughout its scales for consistent note spelling.`;
        if (keyInfo.enharmonic) {
            enharmonicNote = ` While enharmonically equivalent to ${keyInfo.enharmonic}, we use ${keyName} as the standard theoretical spelling to avoid excessive sharps.`;
        }
    }
    
    // Scale application explanation
    if (category === 'major') {
        scaleApplication = `This applies directly to major scales where ${keyName} follows its traditional key signature.`;
        explanation.type = 'traditional';
    } else if (category === 'harmonic-minor' || category === 'melodic-minor') {
        scaleApplication = `For ${category.replace('-', ' ')} scales, we apply the same accidental consistency as the traditional ${keyName} key, even though these modes don't follow standard major/minor key signatures. This maintains readable patterns and theoretical consistency.`;
        explanation.type = 'traditional';
    } else if (category === 'diminished' || category === 'chromatic' || category === 'whole-tone') {
        scaleApplication = `For ${category.replace('-', ' ')} scales, we borrow the accidental pattern from traditional ${keyName} key theory. Although these symmetric scales don't have conventional key signatures, using consistent ${keyInfo.type === 'flat' ? 'flat' : keyInfo.type === 'sharp' ? 'sharp' : 'natural'} spellings maintains readability and theoretical logic.`;
        explanation.type = 'symmetric';
    } else if (category === 'pentatonic' || category === 'blues') {
        scaleApplication = `For ${category} scales, we follow the traditional ${keyName} key conventions. This aligns with how these scales are typically notated in folk, blues, and popular music traditions.`;
        explanation.type = 'pentatonic';
    } else {
        scaleApplication = `We apply traditional ${keyName} key spelling conventions to maintain theoretical consistency across all scale types.`;
        explanation.type = 'traditional';
    }
    
    // Simplification note
    const simplificationNote = `<div class="simplification-note">
        <strong>Simplification:</strong> We avoid double accidentals (like C♭♭ for B♭, or F♯♯ for G) to keep the notation clear and accessible. While these exist in advanced theory, simple single accidentals are more practical for learning and playing.
    </div>`;
    
    // Combine all parts
    explanation.text = `
        ${coreTheory}
        
        <div class="key-specific">
            ${keySpecific}${enharmonicNote}
        </div>
        
        <div class="scale-application">
            <strong>Application:</strong> ${scaleApplication}
        </div>
        
        ${simplificationNote}
    `;
    
    return explanation;
}
