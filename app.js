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
    blues: [3, 2, 1, 1, 3, 2],
    // Other scales
    hungarian: [2, 1, 3, 1, 1, 3, 1], // Hungarian Minor
    neapolitan: [1, 2, 2, 2, 2, 2, 1], // Neapolitan Minor
    persian: [1, 3, 1, 1, 2, 3, 1], // Persian (Double Harmonic)
    bebopDominant: [2, 2, 1, 2, 2, 1, 1, 1], // Bebop Dominant (8 notes)
    bebopMajor: [2, 2, 1, 2, 1, 1, 2, 1], // Bebop Major (8 notes)
    hirajoshi: [2, 1, 4, 1, 4], // Hirajoshi
    inSen: [1, 4, 2, 3, 2], // Japanese In Sen (5 notes)
    augmented: [3, 1, 3, 1, 3, 1], // Augmented Scale (6 notes)
    halfWhole: [1, 2, 1, 2, 1, 2, 1, 2], // Half-Whole Diminished (8 notes)
    spanish: [1, 3, 1, 2, 1, 2, 2], // Spanish Scale (Phrygian Major)
    byzantine: [1, 3, 1, 2, 1, 3, 1] // Byzantine Scale
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
    },
    hirajoshi: {
        name: 'Hirajoshi',
        formula: [2, 1, 4, 1, 4],
        modes: [
            { name: 'Hirajoshi (Shape 1)', mode: 0, mood: 'Japanese, meditative, peaceful', description: 'Traditional Japanese pentatonic scale' },
            { name: 'Kumoi (Shape 2)', mode: 1, mood: 'Japanese, contemplative', description: 'Japanese Kumoi variation' },
            { name: 'Hon-Kumoi (Shape 3)', mode: 2, mood: 'Japanese, serene', description: 'Traditional Kumoi mode' },
            { name: 'Iwato (Shape 4)', mode: 3, mood: 'Japanese, dark, mysterious', description: 'Dark Japanese scale' },
            { name: 'Chinese (Shape 5)', mode: 4, mood: 'Asian, pentatonic', description: 'Chinese pentatonic variation' }
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

// Other scales types - World, Exotic, and Jazz scales
const otherScaleTypes = {
    hungarian: {
        name: 'Hungarian Minor',
        formula: [2, 1, 3, 1, 1, 3, 1],
        mood: 'Dark, exotic, mysterious',
        description: 'Eastern European folk scale with augmented second'
    },
    neapolitan: {
        name: 'Neapolitan Minor',
        formula: [1, 2, 2, 2, 2, 2, 1],
        mood: 'Classical, dramatic, Italian',
        description: 'Classical scale with distinctive flat second degree'
    },
    persian: {
        name: 'Persian (Double Harmonic)',
        formula: [1, 3, 1, 2, 1, 3, 1],
        mood: 'Exotic, Middle Eastern, mystical',
        description: 'Middle Eastern scale with two augmented seconds'
    },
    bebopDominant: {
        name: 'Bebop Dominant',
        formula: [2, 2, 1, 2, 2, 1, 1, 1],
        mood: 'Jazzy, sophisticated, swing',
        description: 'Mixolydian with added major 7th for smooth voice leading'
    },
    bebopMajor: {
        name: 'Bebop Major',
        formula: [2, 2, 1, 2, 1, 1, 2, 1],
        mood: 'Jazzy, sophisticated, major swing',
        description: 'Major scale with added augmented 5th for smooth voice leading'
    },
    hirajoshi: {
        name: 'Hirajoshi',
        formula: [2, 1, 4, 1, 4],
        mood: 'Japanese, contemplative, pentatonic',
        description: 'Traditional Japanese scale with distinctive wide intervals'
    },
    inSen: {
        name: 'In Sen',
        formula: [1, 4, 2, 3, 2],
        mood: 'Japanese, contemplative, serene',
        description: 'Japanese scale often used in meditation music'
    },
    augmented: {
        name: 'Augmented Scale',
        formula: [3, 1, 3, 1, 3, 1],
        mood: 'Mysterious, floating, symmetrical',
        description: 'Symmetrical scale with alternating minor thirds and semitones'
    },
    spanish: {
        name: 'Spanish Scale',
        formula: [1, 3, 1, 2, 1, 2, 2],
        mood: 'Flamenco, passionate, Spanish',
        description: 'Phrygian major scale with distinctive flat second'
    },
    byzantine: {
        name: 'Byzantine Scale',
        formula: [1, 3, 1, 2, 1, 3, 1],
        mood: 'Orthodox, ancient, ceremonial',
        description: 'Eastern Orthodox liturgical scale'
    }
};

// Global state for fretboard display mode
let fretboardDisplayMode = 'notes';

// === IMPROVED INTERVAL COLOR SYSTEM ===
// Refined based on musical theory and visual harmony with the app's warm theme
// Colors are more muted and harmonious while maintaining the tension-based logic

const intervalColors = {
  // STABLE INTERVALS (Low Tension) - Warm, stable tones
  '1': '#FFF5E6',   // Unison/Root - Warm white (stability, completeness)
  '3': '#F4D03F',   // Major Third - Warm golden yellow (happiness, brightness)
  '5': '#5DADE2',   // Perfect Fifth - Soft blue (stability, consonance)
  
  // MILD TENSION (Medium Tension) - Earth tones
  '2': '#E67E22',   // Major Second - Warm orange (movement, gentle tension)
  'b2': '#D35400',  // Minor Second - Burnt orange (mild tension, spice)
  '6': '#58D68D',   // Major Sixth - Soft green (yearning, natural)
  'b6': '#85929E',  // Minor Sixth - Muted blue-gray (melancholy, contemplative)
  
  // STRONG TENSION (High Tension) - Deeper, richer colors
  '4': '#E74C3C',   // Perfect Fourth - Rich red (suspension, strength)
  '7': '#C0392B',   // Major Seventh - Deep red (leading tone tension)
  'b7': '#CD6155',  // Minor Seventh - Rose red (bluesy, soulful)
  'b3': '#8E44AD',  // Minor Third - Rich purple (minor quality, depth)
  
  // EXTREME TENSION (Maximum Tension) - Dark, intense colors
  '#4': '#922B21',  // Tritone (Aug 4th) - Dark crimson (devil's interval)
  'b5': '#922B21',  // Tritone (Dim 5th) - Dark crimson (instability)
  
  // ENHARMONIC EQUIVALENTS - Consistent colors for same pitches
  '#5': '#85929E',  // Augmented Fifth = b6 (same pitch, same color)
  '#1': '#D35400',  // Augmented Unison = b2 (same pitch, same color)
  'bb7': '#58D68D', // Diminished Seventh = 6 (same pitch, same color)
  '#7': '#FFF5E6',  // Augmented Seventh = 1 (same pitch, same color)
  '#2': '#8E44AD',  // Augmented Second = b3 (same pitch, same color)
  'bb3': '#E67E22', // Diminished Third = 2 (same pitch, same color)
  '#6': '#CD6155'   // Augmented Sixth = b7 (same pitch, same color)
};

// Scale degree weights based on harmonic importance hierarchy
const scaleWeights = {
  '1': 3.0,  // Tonic - most stable and resolved tone
  '3': 2.5,  // Mediant - determines modal quality (major/minor)
  'b3': 2.5, // Minor third - equally important for modal character
  '5': 2.0,  // Dominant - next in importance to tonic
  '7': 1.8,  // Leading tone - peak of tension in tonal music
  'b7': 1.8, // Minor seventh - important in minor modes
  '4': 1.5,  // Subdominant - active, unstable tone
  '6': 1.2,  // Submediant - varies by major/minor
  'b6': 1.2, // Minor sixth - important in minor modes
  '2': 1.0,  // Supertonic - unstable and active
  'b2': 1.0, // Minor second - chromatic tension
  '#4': 2.2, // Tritone - extremely important dissonance
  'b5': 2.2  // Tritone - extremely important dissonance
};

// Helper functions for color calculations
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Calculate scale color using enhanced algorithm for better mode distinction
function calculateScaleColor(scaleIntervals) {
  if (!scaleIntervals || scaleIntervals.length === 0) {
    return '#8B4513'; // Default warm brown to match app theme
  }
  
  // Enhanced color mapping for better mode distinction
  const modeColorMap = {
    // Major modes - warm colors
    'Ionian': '#E67E22',      // Warm orange (bright, stable)
    'Lydian': '#F39C12',      // Golden orange (floating, ethereal)
    'Mixolydian': '#D35400',  // Burnt orange (dominant, bluesy)
    
    // Minor modes - cooler colors  
    'Dorian': '#8E44AD',      // Purple (sophisticated, jazzy)
    'Aeolian': '#2C3E50',     // Dark blue-gray (natural minor, sad)
    'Phrygian': '#C0392B',    // Deep red (exotic, Spanish)
    'Locrian': '#7F8C8D'      // Gray (unstable, diminished)
  };
  
  // Try to match mode by interval pattern
  const intervalString = scaleIntervals.join('');
  
  // Check for common mode patterns
  if (intervalString.includes('3') && intervalString.includes('7')) {
    return modeColorMap.Ionian; // Major quality
  } else if (intervalString.includes('b3') && intervalString.includes('6')) {
    return modeColorMap.Dorian; // Dorian quality
  } else if (intervalString.includes('b3') && intervalString.includes('b2')) {
    return modeColorMap.Phrygian; // Phrygian quality
  } else if (intervalString.includes('4') && intervalString.includes('#4')) {
    return modeColorMap.Lydian; // Lydian quality
  } else if (intervalString.includes('3') && intervalString.includes('b7')) {
    return modeColorMap.Mixolydian; // Mixolydian quality
  } else if (intervalString.includes('b3') && intervalString.includes('b6')) {
    return modeColorMap.Aeolian; // Natural minor
  } else if (intervalString.includes('b5') || intervalString.includes('#4')) {
    return modeColorMap.Locrian; // Unstable/diminished
  }
  
  // Fallback: enhanced weighted average with better contrast
  let totalR = 0, totalG = 0, totalB = 0, totalWeight = 0;
  
  scaleIntervals.forEach(interval => {
    const color = intervalColors[interval];
    if (color) {
      // Emphasize characteristic intervals more
      let weight = scaleWeights[interval] || 1.0;
      
      // Boost weight for characteristic intervals
      if (interval === '3' || interval === 'b3') weight *= 2.5; // Modal character
      if (interval === '7' || interval === 'b7') weight *= 2.0; // Leading tone
      if (interval === '#4' || interval === 'b5') weight *= 2.0; // Tritone
      if (interval === 'b2') weight *= 1.8; // Phrygian character
      if (interval === '#11') weight *= 1.8; // Lydian character
      
      const [r, g, b] = hexToRgb(color);
      
      totalR += r * weight;
      totalG += g * weight;
      totalB += b * weight;
      totalWeight += weight;
    }
  });
  
  if (totalWeight === 0) return '#8B4513';
  
  const avgR = Math.round(totalR / totalWeight);
  const avgG = Math.round(totalG / totalWeight);
  const avgB = Math.round(totalB / totalWeight);
  
  // Enhance saturation and contrast for better visibility
  const enhanceColor = (r, g, b) => {
    // Convert to HSL for better manipulation
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const diff = max - min;
    
    // Increase saturation by 20%
    const saturationBoost = 1.3;
    const newR = Math.min(255, Math.round(r + (r - avgR) * saturationBoost * 0.3));
    const newG = Math.min(255, Math.round(g + (g - avgG) * saturationBoost * 0.3));
    const newB = Math.min(255, Math.round(b + (b - avgB) * saturationBoost * 0.3));
    
    return [
      Math.max(0, Math.min(255, newR)),
      Math.max(0, Math.min(255, newG)), 
      Math.max(0, Math.min(255, newB))
    ];
  };
  
  const [enhancedR, enhancedG, enhancedB] = enhanceColor(avgR, avgG, avgB);
  
  return rgbToHex(enhancedR, enhancedG, enhancedB);
}

// Get interval color with fallback
function getIntervalColor(interval) {
  return intervalColors[interval] || '#CCCCCC';
}

// Calculate a lighter version of a color for backgrounds
function lightenColor(hex, percent = 50) {
  const [r, g, b] = hexToRgb(hex);
  const lighten = (color) => Math.min(255, Math.round(color + (255 - color) * (percent / 100)));
  return rgbToHex(lighten(r), lighten(g), lighten(b));
}

// Global flag for color mode - ENABLED BY DEFAULT
let colorModeEnabled = true;

// Function to generate fretboard SVG using the Fretboard class
function generateFretboard(scale, displayMode = 'notes', isModal = false) {
    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.visibility = 'hidden';
    document.body.appendChild(tempContainer);
    
    // Create fretboard instance with appropriate sizing for modal vs regular display
    const fretboardOptions = {
        frets: 12,
        strings: 6,
        startFret: 0,
        showFretNumbers: true,
        showStringLabels: true,
        dotSize: isModal ? 24 : 16,
        fretSpacing: isModal ? 90 : 50,
        stringSpacing: isModal ? 50 : 30,
        nutWidth: isModal ? 12 : 8,
        fontSize: isModal ? 14 : 10
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
            // Set explicit dimensions for modal fretboard to ensure it scales properly
            svgElement.setAttribute('width', '100%');
            svgElement.setAttribute('height', '100%');
            svgElement.setAttribute('viewBox', '0 0 1100 300');
            svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
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
    
    // For diminished scales, use proper music theory spelling
    if (scaleType === 'diminished') {
        const diminishedSpellings = {
            'C': ['C', 'D', 'Eb', 'F', 'Gb', 'Ab', 'A', 'B'],
            'C#': ['C#', 'D#', 'E', 'F#', 'G', 'A', 'Bb', 'B'],
            'Db': ['Db', 'Eb', 'E', 'Gb', 'G', 'A', 'Bb', 'C'],
            'D': ['D', 'E', 'F', 'G', 'Ab', 'Bb', 'B', 'C#'],
            'D#': ['D#', 'E#', 'F#', 'G#', 'A', 'B', 'C', 'D'],
            'Eb': ['Eb', 'F', 'Gb', 'Ab', 'A', 'B', 'C', 'D'],
            'E': ['E', 'F#', 'G', 'A', 'Bb', 'C', 'Db', 'D'],
            'F': ['F', 'G', 'Ab', 'Bb', 'B', 'Db', 'D', 'E'],
            'F#': ['F#', 'G#', 'A', 'B', 'C', 'D', 'Eb', 'E'],
            'Gb': ['Gb', 'Ab', 'A', 'B', 'C', 'D', 'Eb', 'F'],
            'G': ['G', 'A', 'Bb', 'C', 'Db', 'Eb', 'E', 'F#'],
            'G#': ['G#', 'A#', 'B', 'C#', 'D', 'E', 'E#', 'F##'],
            'Ab': ['Ab', 'Bb', 'B', 'Db', 'D', 'E', 'F', 'G'],
            'A': ['A', 'B', 'C', 'D', 'Eb', 'F', 'F#', 'G#'],
            'A#': ['A#', 'B#', 'C#', 'D#', 'E', 'F#', 'F##', 'G##'],
            'Bb': ['Bb', 'C', 'Db', 'Eb', 'E', 'Gb', 'G', 'A'],
            'B': ['B', 'C#', 'D', 'E', 'F', 'G', 'G#', 'A#']
        };

        const scaleNotes = diminishedSpellings[key];
        if (scaleNotes) {
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
    
    // For Other scales, use proper music theory spelling
    if (scaleType === 'other') {
        // Define correct spellings for Other scales
        const otherScaleSpellings = {
            // Hungarian Minor: 1, 2, b3, #4, 5, b6, 7
            'hungarian': {
                'C': ['C', 'D', 'Eb', 'F#', 'G', 'Ab', 'B'],
                'C#': ['C#', 'D#', 'E', 'F##', 'G#', 'A', 'B#'],
                'Db': ['Db', 'Eb', 'E', 'G', 'Ab', 'A', 'C'],
                'D': ['D', 'E', 'F', 'G#', 'A', 'Bb', 'C#'],
                'D#': ['D#', 'E#', 'F#', 'G##', 'A#', 'B', 'C##'],
                'Eb': ['Eb', 'F', 'Gb', 'A', 'Bb', 'B', 'D'],
                'E': ['E', 'F#', 'G', 'A#', 'B', 'C', 'D#'],
                'F': ['F', 'G', 'Ab', 'B', 'C', 'Db', 'E'],
                'F#': ['F#', 'G#', 'A', 'B#', 'C#', 'D', 'E#'],
                'Gb': ['Gb', 'Ab', 'A', 'C', 'Db', 'D', 'F'],
                'G': ['G', 'A', 'Bb', 'C#', 'D', 'Eb', 'F#'],
                'G#': ['G#', 'A#', 'B', 'C##', 'D#', 'E', 'F##'],
                'Ab': ['Ab', 'Bb', 'B', 'D', 'Eb', 'E', 'G'],
                'A': ['A', 'B', 'C', 'D#', 'E', 'F', 'G#'],
                'A#': ['A#', 'B#', 'C#', 'D##', 'E#', 'F#', 'G##'],
                'Bb': ['Bb', 'C', 'Db', 'E', 'F', 'Gb', 'A'],
                'B': ['B', 'C#', 'D', 'E#', 'F#', 'G', 'A#']
            },
            // Neapolitan Minor: 1, b2, b3, 4, 5, 6, 7
            'neapolitan': {
                'C': ['C', 'Db', 'Eb', 'F', 'G', 'A', 'B'],
                'C#': ['C#', 'D', 'E', 'F#', 'G#', 'A#', 'B#'],
                'Db': ['Db', 'D', 'E', 'Gb', 'Ab', 'Bb', 'C'],
                'D': ['D', 'Eb', 'F', 'G', 'A', 'B', 'C#'],
                'D#': ['D#', 'E', 'F#', 'G#', 'A#', 'B#', 'C##'],
                'Eb': ['Eb', 'E', 'Gb', 'Ab', 'Bb', 'C', 'D'],
                'E': ['E', 'F', 'G', 'A', 'B', 'C#', 'D#'],
                'F': ['F', 'Gb', 'Ab', 'Bb', 'C', 'D', 'E'],
                'F#': ['F#', 'G', 'A', 'B', 'C#', 'D#', 'E#'],
                'Gb': ['Gb', 'G', 'A', 'B', 'Db', 'Eb', 'F'],
                'G': ['G', 'Ab', 'Bb', 'C', 'D', 'E', 'F#'],
                'G#': ['G#', 'A', 'B', 'C#', 'D#', 'E#', 'F##'],
                'Ab': ['Ab', 'A', 'B', 'Db', 'Eb', 'F', 'G'],
                'A': ['A', 'Bb', 'C', 'D', 'E', 'F#', 'G#'],
                'A#': ['A#', 'B', 'C#', 'D#', 'E#', 'F##', 'G##'],
                'Bb': ['Bb', 'B', 'Db', 'Eb', 'F', 'G', 'A'],
                'B': ['B', 'C', 'D', 'E', 'F#', 'G#', 'A#']
            },
            // Persian (Double Harmonic): 1, b2, 3, 4, 5, b6, 7
            'persian': {
                'C': ['C', 'Db', 'E', 'F', 'G', 'Ab', 'B'],
                'C#': ['C#', 'D', 'E#', 'F#', 'G#', 'A', 'B#'],
                'Db': ['Db', 'D', 'F', 'Gb', 'Ab', 'A', 'C'],
                'D': ['D', 'Eb', 'F#', 'G', 'A', 'Bb', 'C#'],
                'D#': ['D#', 'E', 'F##', 'G#', 'A#', 'B', 'C##'],
                'Eb': ['Eb', 'E', 'G', 'Ab', 'Bb', 'B', 'D'],
                'E': ['E', 'F', 'G#', 'A', 'B', 'C', 'D#'],
                'F': ['F', 'Gb', 'A', 'Bb', 'C', 'Db', 'E'],
                'F#': ['F#', 'G', 'A#', 'B', 'C#', 'D', 'E#'],
                'Gb': ['Gb', 'G', 'Bb', 'B', 'Db', 'D', 'F'],
                'G': ['G', 'Ab', 'B', 'C', 'D', 'Eb', 'F#'],
                'G#': ['G#', 'A', 'B#', 'C#', 'D#', 'E', 'F##'],
                'Ab': ['Ab', 'A', 'C', 'Db', 'Eb', 'E', 'G'],
                'A': ['A', 'Bb', 'C#', 'D', 'E', 'F', 'G#'],
                'A#': ['A#', 'B', 'C##', 'D#', 'E#', 'F#', 'G##'],
                'Bb': ['Bb', 'B', 'D', 'Eb', 'F', 'Gb', 'A'],
                'B': ['B', 'C', 'D#', 'E', 'F#', 'G', 'A#']
            }
        };

        // Helper function to convert note to chromatic index for Other scales
        function noteToChromatic(note) {
            const noteMap = {
                'C': 0, 'B#': 0,
                'C#': 1, 'Db': 1, 
                'C##': 2, 'D': 2, 
                'D#': 3, 'Eb': 3,
                'D##': 4, 'E': 4, 'Fb': 4, 
                'E#': 5, 'F': 5,
                'F#': 6, 'Gb': 6, 
                'F##': 7, 'G': 7,
                'G#': 8, 'Ab': 8,
                'G##': 9, 'A': 9,
                'A#': 10, 'Bb': 10,
                'A##': 11, 'B': 11, 'Cb': 11
            };
            return noteMap[note] !== undefined ? noteMap[note] : -1;
        }

        // Get the current scale type from global state or determine it
        const currentOtherScale = getCurrentOtherScaleType(); // We'll need to implement this
        const scaleNotes = otherScaleSpellings[currentOtherScale] && otherScaleSpellings[currentOtherScale][key];
        
        if (scaleNotes) {
            for (let i = 0; i < scaleNotes.length; i++) {
                const scaleNote = scaleNotes[i];
                const scaleNoteIndex = noteToChromatic(scaleNote);
                if (scaleNoteIndex === noteIndex) {
                    return scaleNote;
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

    // For diminished scales (8 notes), use the known interval pattern
    if (notes.length === 8) {
        return ['1', '2', 'b3', '4', 'b5', 'b6', '6', '7'];
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
        harmonicMinor: {},
        melodicMinor: {},
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
        library.harmonicMinor[`${properKey} Harmonic Minor`] = {
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
        library.melodicMinor[`${properKey} Melodic Minor`] = {
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
        
        // Diminished scale with proper W-H and H-W modes
        const whDiminishedScale = calculateScale(properKey, scaleFormulas.diminished, 'diminished'); // W-H pattern
        
        library.diminished[`${properKey} Diminished`] = {
            root: properKey,
            parentScale: `${properKey} Diminished`,
            scale: whDiminishedScale,
            modes: whDiminishedScale.map((note, index) => {
                const modeNotes = getModeNotes(whDiminishedScale, index, scaleFormulas.diminished);
                const patternType = index % 2 === 0 ? 'Whole-Half' : 'Half-Whole';
                
                return {
                    id: `${note} ${patternType} Diminished`,
                    root: note,
                    notes: modeNotes,
                    intervals: getIntervals(modeNotes, note),
                    formula: index % 2 === 0 ? scaleFormulas.diminished : [1, 2, 1, 2, 1, 2, 1, 2],
                    mood: index % 2 === 0 ? 'Tense, symmetrical, dominant' : 'Tense, symmetrical, auxiliary',
                    description: index % 2 === 0 ? 
                        'Whole-half diminished pattern (over dominant 7th chords)' : 
                        'Half-whole diminished pattern (over diminished and minor 7♭5 chords)',
                    applications: index % 2 === 0 ? 
                        ['Jazz fusion', 'Over dominant 7th chords', 'Bebop', 'Modern jazz'] :
                        ['Jazz fusion', 'Over diminished chords', 'Minor 7♭5 chords', 'Modern jazz'],
                    parentScale: `${properKey} Diminished`
                };
            })
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
    // But we generate all 12 keys, each showing the 6 modes from their respective whole tone scale
    
    // Define the two unique whole tone scales
    const wholeToneScale1 = ['C', 'D', 'E', 'F#', 'G#', 'A#'];
    const wholeToneScale2 = ['C#', 'D#', 'F', 'G', 'A', 'B'];
    
    // Map each key to its whole tone scale
    const keyToWholeToneScale = {
        'C': wholeToneScale1, 'D': wholeToneScale1, 'E': wholeToneScale1, 
        'F#': wholeToneScale1, 'Gb': wholeToneScale1, 'G#': wholeToneScale1, 
        'Ab': wholeToneScale1, 'A#': wholeToneScale1, 'Bb': wholeToneScale1,
        'C#': wholeToneScale2, 'Db': wholeToneScale2, 'D#': wholeToneScale2, 
        'Eb': wholeToneScale2, 'F': wholeToneScale2, 'G': wholeToneScale2, 
        'A': wholeToneScale2, 'B': wholeToneScale2
    };
    
    chromaticScale.forEach(key => {
        const properKey = keySignatures[key] || key;
        const wholeToneScale = keyToWholeToneScale[properKey];
        
        if (wholeToneScale) {
            library.wholeTone[`${properKey} Whole Tone`] = {
                root: properKey,
                parentScale: `${properKey} Whole Tone`,
                scale: wholeToneScale,
                modes: wholeToneScale.map((note, index) => {
                    // Create mode starting from each note in the scale
                    const modeNotes = [...wholeToneScale.slice(index), ...wholeToneScale.slice(0, index)];
                    return {
                        id: `${note} Whole Tone Scale`,
                        root: note,
                        notes: modeNotes,
                        intervals: getIntervals(modeNotes, note),
                        formula: scaleFormulas.wholeTone,
                        mood: 'Dreamy, impressionistic, floating',
                        description: `6-note whole tone scale starting from ${note}. Contains only whole steps (2 semitones between each note).`,
                        applications: ['Impressionist music', 'Jazz fusion', 'Film scores', 'Ambient'],
                        parentScale: `${properKey} Whole Tone`
                    };
                })
            };
        }
    });
    
    return library;
}

// 🎸 SCALE-FIRST INTERFACE SYSTEM
let currentKey = 'C';
let currentCategory = 'major';
let currentPentatonicType = 'major';
let currentOtherType = 'hungarian';
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
    document.querySelectorAll('.category-tab:not(.color-toggle-tab)').forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.dataset.category;
            switchCategory(category);
            
            // Update active tab (only for non-color-toggle tabs)
            document.querySelectorAll('.category-tab:not(.color-toggle-tab)').forEach(t => t.classList.remove('active'));
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

    // Other type selector change handler
    document.getElementById('other-type-selector').addEventListener('change', function() {
        currentOtherType = this.value; // Update the global currentOtherType variable
        if (document.querySelector('.category-tab.active:not(.color-toggle-tab)').dataset.category === 'other') {
            updateParentScaleDisplay();
            renderOtherModes();
        }
    });

    // Back navigation handlers
    document.getElementById('back-to-top')?.addEventListener('click', function() {
        // Scroll to the top of the mode detail section
        const modeDetailElement = document.getElementById('mode-detail');
        if (modeDetailElement) {
            modeDetailElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
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

    // Initialize pentatonic controls visibility based on current category
    const pentatonicControls = document.getElementById('pentatonic-controls');
    if (pentatonicControls) {
        pentatonicControls.style.display = currentCategory === 'pentatonic' ? 'block' : 'none';
    }

    // Initialize other controls visibility based on current category
    const otherControls = document.getElementById('other-controls');
    if (otherControls) {
        otherControls.style.display = currentCategory === 'other' ? 'block' : 'none';
    }

    // Update parent scale display initially
    updateParentScaleDisplay();

    // Color mode toggle handler - Updated for new tab-style button
    document.getElementById('color-mode-toggle')?.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        colorModeEnabled = !colorModeEnabled;
        
        // Update button appearance
        if (colorModeEnabled) {
            this.classList.add('active');
            this.textContent = '🎨 Colors';
        } else {
            this.classList.remove('active');
            this.textContent = '🎨 Colors';
        }
        
        // Re-render the current grid to apply/remove colors
        const activeCategory = document.querySelector('.category-tab.active:not(.color-toggle-tab)').dataset.category;
        if (activeCategory === 'pentatonic') {
            renderPentatonicModes();
        } else {
            renderModeGrid();
        }
        
        // If in mode detail view, update the theory section
        const modeDetail = document.getElementById('mode-detail');
        if (!modeDetail.classList.contains('hidden')) {
            updateTheoryColors();
        }
    });

    // Initialize color toggle button as active since colors are enabled by default
    const colorToggleBtn = document.getElementById('color-mode-toggle');
    if (colorToggleBtn) {
        colorToggleBtn.classList.add('active');
        colorToggleBtn.textContent = '🎨 Colors';
    }
}

function updateParentScaleDisplay() {
    const parentScaleDisplay = document.getElementById('parent-scale-display');
    if (!parentScaleDisplay) return;
    
    try {
        const properKey = keySignatures[currentKey] || currentKey;
        let parentScaleName = '';
        
        switch(currentCategory) {
            case 'major':
                parentScaleName = `${properKey} Major`;
                break;
            case 'harmonicMinor':
                parentScaleName = `${properKey} Harmonic Minor`;
                break;
            case 'melodicMinor':
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
            case 'other':
                const otherTypeName = otherScaleTypes[currentOtherType]?.name || 'Other Scale';
                parentScaleName = `${properKey} ${otherTypeName}`;
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
    
    // Update active tab (only for non-color-toggle tabs)
    document.querySelectorAll('.category-tab:not(.color-toggle-tab)').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.category === category);
    });
    
    // Show/hide pentatonic selector
    const pentatonicControls = document.getElementById('pentatonic-controls');
    if (pentatonicControls) {
        pentatonicControls.style.display = category === 'pentatonic' ? 'block' : 'none';
    }
    
    // Show/hide other selector
    const otherControls = document.getElementById('other-controls');
    if (otherControls) {
        otherControls.style.display = category === 'other' ? 'block' : 'none';
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
        
        // Handle other scales specially
        if (currentCategory === 'other') {
            renderOtherModes();
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
        // Clear the grid container first to prevent accumulation
        gridContainer.innerHTML = '';
        
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

function renderOtherModes() {
    const gridContainer = document.getElementById('mode-grid');
    if (!gridContainer) {
        console.warn('Mode grid container not found');
        return;
    }
    
    try {
        // Clear the grid container first to prevent accumulation
        gridContainer.innerHTML = '';
        
        const otherScaleType = otherScaleTypes[currentOtherType];
        
        if (!otherScaleType) {
            gridContainer.innerHTML = '<p class="no-content">Invalid other scale type selected</p>';
            return;
        }
        
        const properKey = keySignatures[currentKey] || currentKey;
        const otherScale = calculateScale(properKey, otherScaleType.formula, 'other');
        
        if (!otherScale || otherScale.length === 0) {
            gridContainer.innerHTML = '<p class="no-content">Error generating other scale</p>';
            return;
        }
        
        // Create a single mode for the other scale (no modes like pentatonic)
        const mode = {
            id: `${properKey} ${otherScaleType.name}`,
            root: properKey,
            notes: otherScale,
            intervals: getIntervals(otherScale, properKey),
            formula: otherScaleType.formula,
            mood: otherScaleType.mood,
            description: otherScaleType.description,
            applications: ['World music', 'Exotic harmony', 'Modern composition', 'Jazz', 'Ethnic music'],
            parentScale: `${properKey} ${otherScaleType.name}`
        };
        
        const card = createModeCard(mode);
        if (card) {
            gridContainer.appendChild(card);
        }
    } catch (error) {
        console.error('Error rendering other modes:', error);
        gridContainer.innerHTML = '<p class="no-content">Error loading other scales. Please refresh the page.</p>';
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
        
        // Apply color styling if color mode is enabled
        if (colorModeEnabled && mode.intervals) {
            card.classList.add('colored');
            const scaleColor = calculateScaleColor(mode.intervals);
            const lightColor = lightenColor(scaleColor, 85);
            const darkColor = lightenColor(scaleColor, -20);
            
            card.style.setProperty('--scale-color', scaleColor);
            card.style.setProperty('--scale-color-light', lightColor);
            card.style.setProperty('--scale-color-dark', darkColor);
        }
        
        // Ensure all properties exist with fallbacks
        const notes = (mode.notes && Array.isArray(mode.notes)) ? mode.notes.join(' - ') : 'N/A';
        const intervals = (mode.intervals && Array.isArray(mode.intervals)) ? 
            (colorModeEnabled ? 
                mode.intervals.map(interval => `<span class="interval-colored" style="background-color: ${getIntervalColor(interval)}">${interval}</span>`).join(' ') :
                mode.intervals.join(' - ')
            ) : 'N/A';
        const parentScale = mode.parentScale || 'Unknown';
        const mood = mode.mood || 'Not specified';
        const description = mode.description || 'No description available';
        
        // Apply color to title if color mode is enabled
        const titleStyle = colorModeEnabled && mode.intervals ? 
            `style="color: ${calculateScaleColor(mode.intervals)}; font-weight: 800; text-shadow: 0 1px 2px rgba(0,0,0,0.1);"` : '';
        
        card.innerHTML = `
            <h3 class="mode-card-title" ${titleStyle}>${mode.id}</h3>
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
    
    // Hide scale library and show mode detail
    document.getElementById('scale-library').classList.add('hidden');
    
    renderModeDetails(mode);
    
    // Auto-scroll to the mode detail section to show theory and fretboard
    setTimeout(() => {
        const modeDetailElement = document.getElementById('mode-detail');
        if (modeDetailElement) {
            modeDetailElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }, 100); // Small delay to ensure DOM is updated
}

function renderModeDetails(mode) {
    const container = document.getElementById('mode-detail');
    if (!container) return;
    
    container.style.display = 'block';
    container.classList.remove('hidden');
    
    // Update intervals display based on color mode
    const intervalsDisplay = colorModeEnabled && mode.intervals ? 
        mode.intervals.map(interval => 
            `<span class="interval-colored" style="background-color: ${getIntervalColor(interval)}; color: white; padding: 2px 6px; border-radius: 3px; margin: 0 2px;">${interval}</span>`
        ).join(' ') :
        (mode.intervals ? mode.intervals.join(' - ') : 'N/A');
    
    // Apply color to title if color mode is enabled
    const titleStyle = colorModeEnabled && mode.intervals ? 
        `style="color: ${calculateScaleColor(mode.intervals)}; font-weight: 800; text-shadow: 0 1px 2px rgba(0,0,0,0.1);"` : '';
        
    container.innerHTML = `
        <div class="mode-detail-header">
            <h2 ${titleStyle}>${mode.id}</h2>
            <button id="back-btn" class="back-btn">← Back</button>
        </div>
        <div class="theory-section ${colorModeEnabled ? 'colored' : ''}">
            <div class="theory-value">
                <strong>Parent Scale:</strong> ${mode.parentScale || 'Unknown'}
            </div>
            <div class="theory-value">
                <strong>Notes:</strong> ${mode.notes ? mode.notes.join(' - ') : 'N/A'}
            </div>
            <div class="theory-value">
                <strong>Intervals:</strong> ${intervalsDisplay}
            </div>
            <div class="theory-value">
                <strong>Mood:</strong> ${mode.mood || 'Not specified'}
            </div>
            <div class="theory-value">
                <strong>Description:</strong> ${mode.description || 'No description available'}
            </div>
        </div>
        <div class="detail-tabs-container">
            <div class="detail-tabs">
                <button class="detail-tab active" data-tab="fretboard">Fretboard Pattern</button>
                <button class="detail-tab" data-tab="practice">Practice</button>
            </div>
        </div>
        <div id="fretboard-container" class="fretboard-container"></div>
        <div id="practice-container" class="practice-container" style="display: none;"></div>
    `;
    
    // Setup back button
    document.getElementById('back-btn').addEventListener('click', () => {
        container.style.display = 'none';
        container.classList.add('hidden');
        document.getElementById('scale-library').classList.remove('hidden');
    });
    
    // Setup tab functionality
    const tabButtons = container.querySelectorAll('.detail-tab');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.getAttribute('data-tab');
            
            // Update active tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show/hide content
            if (tab === 'fretboard') {
                document.getElementById('fretboard-container').style.display = 'block';
                document.getElementById('practice-container').style.display = 'none';
            } else if (tab === 'practice') {
                document.getElementById('fretboard-container').style.display = 'none';
                document.getElementById('practice-container').style.display = 'block';
                renderPracticeTabs([]);
            }
        });
    });
    
    // Render fretboard for the current mode
    if (mode.notes && mode.notes.length > 0) {
        const rootNote = mode.notes[0];
        const scaleName = mode.id;
        renderScaleFretboard({ notes: mode.notes, root: rootNote, name: scaleName });
    }
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
    let modal = document.getElementById('fretboard-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'fretboard-modal';
        modal.className = 'modal fretboard-modal';
        document.body.appendChild(modal);
    }
    
    // Get the display title, handling both scale.name and scale.id
    let scaleTitle = scale.name || scale.id || 'Scale';
    
    // Remove redundant root note patterns like "C Ionian - C" or "C - C"
    if (scale.root) {
        // Pattern 1: "Scale Name - Root" -> "Scale Name"
        if (scaleTitle.includes(' - ') && scaleTitle.endsWith(` - ${scale.root}`)) {
            scaleTitle = scaleTitle.replace(` - ${scale.root}`, '');
        }
        // Pattern 2: If the title already contains the root at the beginning, don't duplicate
        // This is already correct for patterns like "C Ionian"
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${scaleTitle}</h3>
                <div class="modal-controls">
                    <button class="modal-control-btn" onclick="toggleModalFullscreen()" title="Toggle Fullscreen">
                        <span class="fullscreen-icon">⛶</span>
                    </button>
                    <button class="close-btn" onclick="closeFretboardModal()">&times;</button>
                </div>
            </div>
            <div class="modal-body">
                <div class="fretboard-toggle-container modal-toggle">
                    <div class="fretboard-toggle-wrapper">
                        <button class="fretboard-toggle-btn active" onclick="toggleModalFretboardDisplay('notes')">Note Names</button>
                        <button class="fretboard-toggle-btn" onclick="toggleModalFretboardDisplay('intervals')">Intervals</button>
                    </div>
                </div>
                <div class="fretboard-container" id="modal-fretboard-container">
                    ${generateFretboard(scale, 'notes', true)}
                </div>
            </div>
            <div class="modal-resize-handle"></div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    
    // Set optimal size for the modal
    setOptimalModalSize();
    
    // Handle mobile orientation
    handleMobileOrientation();
    
    // Make modal draggable and resizable
    makeFretboardModalDraggable();
    makeFretboardModalResizable();
    
    // Setup additional modal controls
    setupModalControls();
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeFretboardModal();
        }
    });
}

function setOptimalModalSize() {
    const modal = document.getElementById('fretboard-modal-content');
    if (!modal) return;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth <= 768;
    
    if (isMobile) {
        // Mobile: Use most of the screen
        modal.style.width = '95vw';
        modal.style.height = '90vh';
        modal.style.maxWidth = '95vw';
        modal.style.maxHeight = '90vh';
        } else {
        // Desktop: Optimal size for fretboard viewing
        const optimalWidth = Math.min(viewportWidth * 0.85, 1400);
        const optimalHeight = Math.min(viewportHeight * 0.85, 900);
        
        modal.style.width = `${optimalWidth}px`;
        modal.style.height = `${optimalHeight}px`;
        modal.style.maxWidth = '90vw';
        modal.style.maxHeight = '90vh';
    }
    
    // Center the modal
    modal.style.left = '50%';
    modal.style.top = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.position = 'fixed';
}

function handleMobileOrientation() {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;
    
    // Suggest landscape orientation for better fretboard viewing
    if (window.orientation !== undefined) {
        const orientationBtn = document.getElementById('modal-rotate-btn');
        if (orientationBtn) {
            orientationBtn.style.display = 'block';
            
            // Add orientation change listener
            window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                    setOptimalModalSize();
                }, 100);
            });
        }
    }
}

function makeFretboardModalDraggable() {
    const modal = document.getElementById('fretboard-modal-content');
    const header = document.getElementById('modal-header');
    
    if (!modal || !header) return;
    
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
    header.style.cursor = 'move';
    header.addEventListener('mousedown', startDrag);
    header.addEventListener('touchstart', startDrag, { passive: false });
    
    function startDrag(e) {
        isDragging = true;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        startX = clientX;
        startY = clientY;
        
        const rect = modal.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('touchend', stopDrag);
        
        e.preventDefault();
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const deltaX = clientX - startX;
        const deltaY = clientY - startY;
        
        const newLeft = startLeft + deltaX;
        const newTop = startTop + deltaY;
        
        // Constrain to viewport
        const maxLeft = window.innerWidth - modal.offsetWidth;
        const maxTop = window.innerHeight - modal.offsetHeight;
        
        modal.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`;
        modal.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`;
        modal.style.transform = 'none';
        
        e.preventDefault();
    }
    
    function stopDrag() {
        isDragging = false;
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('touchend', stopDrag);
    }
}

function makeFretboardModalResizable() {
    const modal = document.getElementById('fretboard-modal-content');
    const resizeHandle = document.getElementById('resize-handle');
    
    if (!modal || !resizeHandle) return;
    
    let isResizing = false;
    let startX, startY, startWidth, startHeight;
    
    resizeHandle.addEventListener('mousedown', startResize);
    resizeHandle.addEventListener('touchstart', startResize, { passive: false });
    
    function startResize(e) {
        isResizing = true;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        startX = clientX;
        startY = clientY;
        startWidth = modal.offsetWidth;
        startHeight = modal.offsetHeight;
        
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
        document.addEventListener('touchmove', resize, { passive: false });
        document.addEventListener('touchend', stopResize);
        
        e.preventDefault();
    }
    
    function resize(e) {
        if (!isResizing) return;
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const deltaX = clientX - startX;
        const deltaY = clientY - startY;
        
        const newWidth = Math.max(400, Math.min(startWidth + deltaX, window.innerWidth * 0.95));
        const newHeight = Math.max(300, Math.min(startHeight + deltaY, window.innerHeight * 0.95));
        
        modal.style.width = `${newWidth}px`;
        modal.style.height = `${newHeight}px`;
        
        e.preventDefault();
    }
    
    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
        document.removeEventListener('touchmove', resize);
        document.removeEventListener('touchend', stopResize);
    }
}

function setupModalControls() {
    const fullscreenBtn = document.getElementById('modal-fullscreen-btn');
    const rotateBtn = document.getElementById('modal-rotate-btn');
    
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleModalFullscreen);
    }
    
    if (rotateBtn) {
        rotateBtn.addEventListener('click', suggestRotation);
        
        // Hide on desktop
        if (window.innerWidth > 768) {
            rotateBtn.style.display = 'none';
        }
    }
}

function toggleModalFullscreen() {
    const modal = document.getElementById('fretboard-modal-content');
    if (!modal) return;
    
    const isFullscreen = modal.classList.contains('fullscreen');
    
    if (isFullscreen) {
        modal.classList.remove('fullscreen');
        modal.style.width = '';
        modal.style.height = '';
        setOptimalModalSize();
    } else {
        modal.classList.add('fullscreen');
        modal.style.width = '98vw';
        modal.style.height = '98vh';
        modal.style.left = '50%';
        modal.style.top = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
    }
}

function suggestRotation() {
    // Create a temporary message suggesting rotation
    const message = document.createElement('div');
    message.className = 'rotation-suggestion';
    message.innerHTML = `
        <div class="rotation-message">
            <span class="rotation-icon">📱</span>
            <p>Rotate your device to landscape mode for a better fretboard view!</p>
        </div>
    `;
    
    document.body.appendChild(message);
    
        setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 3000);
}

function closeFretboardModal() {
    const modal = document.getElementById('fretboard-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Reset modal size and position for next time
        const modalContent = document.getElementById('fretboard-modal-content');
        if (modalContent) {
            modalContent.classList.remove('fullscreen');
            modalContent.style.transform = '';
            modalContent.style.left = '';
            modalContent.style.top = '';
            modalContent.style.width = '';
            modalContent.style.height = '';
        }
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

// Helper function to get interval color
function getIntervalColor(interval) {
    return intervalColors[interval] || '#E0E0E0'; // Default gray for unknown intervals
}

// Helper function to lighten or darken a color
function lightenColor(color, percent) {
    const rgb = hexToRgb(color);
    if (!rgb) return color;
    
    const factor = percent / 100;
    
    if (percent > 0) {
        // Lighten by mixing with white
        rgb.r = Math.round(rgb.r + (255 - rgb.r) * factor);
        rgb.g = Math.round(rgb.g + (255 - rgb.g) * factor);
        rgb.b = Math.round(rgb.b + (255 - rgb.b) * factor);
    } else {
        // Darken by reducing values
        const darkFactor = 1 + factor;
        rgb.r = Math.round(rgb.r * darkFactor);
        rgb.g = Math.round(rgb.g * darkFactor);
        rgb.b = Math.round(rgb.b * darkFactor);
    }
    
    return rgbToHex(rgb.r, rgb.g, rgb.b);
}

// Helper function to get current other scale type
function getCurrentOtherScaleType() {
    return currentOtherType || 'hungarian';
}

