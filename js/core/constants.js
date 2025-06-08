// Music Theory Constants
const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const musicTheoryKeys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

// Scale Formulas
const scaleFormulas = {
    // Major modes
    major: [2, 2, 1, 2, 2, 2, 1],
    dorian: [2, 1, 2, 2, 2, 1, 2],
    phrygian: [1, 2, 2, 2, 1, 2, 2],
    lydian: [2, 2, 2, 1, 2, 2, 1],
    mixolydian: [2, 2, 1, 2, 2, 1, 2],
    aeolian: [2, 1, 2, 2, 1, 2, 2],
    locrian: [1, 2, 2, 1, 2, 2, 2],
    
    // Harmonic Minor modes
    'harmonic-minor': [2, 1, 2, 2, 1, 3, 1],
    'locrian-natural-6': [1, 2, 2, 1, 3, 1, 2],
    'ionian-sharp-5': [2, 2, 1, 3, 1, 2, 1],
    'dorian-sharp-4': [2, 1, 3, 1, 2, 1, 2],
    'phrygian-dominant': [1, 3, 1, 2, 1, 2, 2],
    'lydian-sharp-2': [3, 1, 2, 1, 2, 2, 1],
    'altered-dominant': [1, 2, 1, 2, 2, 1, 3],
    
    // Harmonic Major modes
    'harmonic-major': [2, 2, 1, 2, 1, 3, 1],
    'dorian-b5': [2, 1, 2, 1, 3, 1, 2],
    'phrygian-b4': [1, 2, 1, 3, 1, 2, 2],
    'lydian-b3': [2, 1, 3, 1, 2, 2, 1],
    'mixolydian-b2': [1, 3, 1, 2, 2, 1, 2],
    'lydian-augmented-sharp-2': [3, 1, 2, 2, 1, 2, 1],
    'locrian-double-flat-7': [1, 2, 2, 1, 2, 1, 3],
    
    // Melodic Minor modes
    'melodic-minor': [2, 1, 2, 2, 2, 2, 1],
    'dorian-b2': [1, 2, 2, 2, 2, 1, 2],
    'lydian-augmented': [2, 2, 2, 2, 1, 2, 1],
    'lydian-dominant': [2, 2, 2, 1, 2, 1, 2],
    'mixolydian-b6': [2, 2, 1, 2, 1, 2, 2],
    'locrian-natural-2': [2, 1, 2, 1, 2, 2, 2],
    'super-locrian': [1, 2, 1, 2, 2, 2, 2],
    
    // Hungarian Minor modes
    'hungarian-minor': [2, 1, 3, 1, 1, 3, 1],
    'oriental': [1, 3, 1, 1, 3, 1, 2],
    'ionian-augmented-sharp-2': [3, 1, 1, 3, 1, 2, 1],
    'locrian-double-flat-3-double-flat-7': [1, 1, 3, 1, 2, 1, 3],
    'double-harmonic-major': [1, 3, 1, 2, 1, 3, 1],
    'lydian-sharp-2-sharp-6': [3, 1, 2, 1, 3, 1, 1],
    'ultra-locrian': [1, 2, 1, 3, 1, 1, 3],
    
    // Neapolitan Minor modes
    'neapolitan-minor': [1, 2, 2, 2, 1, 3, 1],
    'leading-whole-tone': [2, 2, 2, 1, 3, 1, 1],
    'lydian-augmented-dominant': [2, 2, 1, 3, 1, 1, 2],
    'lydian-dominant-flat-6': [2, 1, 3, 1, 1, 2, 2],
    'major-locrian': [1, 3, 1, 1, 2, 2, 2],
    'half-diminished-flat-2': [3, 1, 1, 2, 2, 2, 1],
    'altered-diminished': [1, 1, 2, 2, 2, 1, 3],
    
    // Neapolitan Major modes
    'neapolitan-major': [1, 2, 2, 2, 2, 2, 1],
    'leading-whole-tone-major': [2, 2, 2, 2, 2, 1, 1],
    'lydian-augmented-major': [2, 2, 2, 2, 1, 1, 2],
    'lydian-dominant-major': [2, 2, 2, 1, 1, 2, 2],
    'major-locrian-major': [2, 2, 1, 1, 2, 2, 2],
    'half-diminished-major': [2, 1, 1, 2, 2, 2, 2],
    'altered-major': [1, 1, 2, 2, 2, 2, 2],
    
    // Diminished modes
    'diminished': [2, 1, 2, 1, 2, 1, 2, 1],
    'half-diminished': [1, 2, 1, 2, 1, 2, 1, 2],
    
    // Pentatonic scales
    'major-pentatonic': [2, 2, 3, 2, 3],
    'suspended-pentatonic': [2, 3, 2, 3, 2],
    'man-gong': [3, 2, 3, 2, 2],
    'ritusen': [2, 3, 2, 2, 3],
    'minor-pentatonic': [3, 2, 2, 3, 2],
    
    // Symmetrical and other scales
    'whole-tone': [2, 2, 2, 2, 2, 2],
    'chromatic': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    'augmented': [1, 3, 1, 3, 1, 3],
    'bebop-major': [2, 2, 1, 2, 1, 1, 2, 1]
};

// Scale Degree Weights for Color Calculation
const scaleDegreeWeights = {
    1: 10,   // Tonic - most stable
    5: 8,    // Dominant - very stable
    3: 6,    // Mediant - moderately stable
    4: 4,    // Subdominant - mild tension
    6: 4,    // Submediant - mild tension
    2: 3,    // Supertonic - more tension
    7: 2     // Leading tone - most tension
};

// Interval Color Mappings
const intervalColors = {
    // STABLE INTERVALS (Low Tension) - Warm, stable tones
    '1': '#E8B4B8',   // Unison/Root - Dusty rose pink (stability, completeness) - much better contrast
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

// Scale Categories and Metadata - REORDERED FROM MOST COMMON TO LEAST COMMON
const scaleCategories = {
    'major-modes': {
        name: 'Major',
        description: 'The seven modes of the major scale',
        modes: ['major', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'],
        formulas: {
            'major': [2, 2, 1, 2, 2, 2, 1],
            'dorian': [2, 1, 2, 2, 2, 1, 2],
            'phrygian': [1, 2, 2, 2, 1, 2, 2],
            'lydian': [2, 2, 2, 1, 2, 2, 1],
            'mixolydian': [2, 2, 1, 2, 2, 1, 2],
            'aeolian': [2, 1, 2, 2, 1, 2, 2],
            'locrian': [1, 2, 2, 1, 2, 2, 2]
        }
    },
    'pentatonic': {
        name: 'Major Pentatonic',
        description: 'The five modes of the major pentatonic scale',
        modes: ['major-pentatonic', 'suspended-pentatonic', 'man-gong', 'ritusen', 'minor-pentatonic'],
        formulas: {
            'major-pentatonic': [2, 2, 3, 2, 3],
            'suspended-pentatonic': [2, 3, 2, 3, 2],
            'man-gong': [3, 2, 3, 2, 2],
            'ritusen': [2, 3, 2, 2, 3],
            'minor-pentatonic': [3, 2, 2, 3, 2]
        }
    },
    'blues-scales': {
        name: 'Blues',
        description: 'Six-note blues scales with added chromatic notes',
        modes: ['blues-major', 'blues-minor'],
        formulas: {
            'blues-major': [2, 1, 1, 3, 2, 3],
            'blues-minor': [3, 2, 1, 1, 3, 2]
        }
    },
    'harmonic-minor-modes': {
        name: 'Harmonic Minor',
        description: 'The seven modes of the harmonic minor scale',
        modes: ['harmonic-minor', 'locrian-natural-6', 'ionian-sharp-5', 'dorian-sharp-4', 'phrygian-dominant', 'lydian-sharp-2', 'altered-dominant'],
        formulas: {
            'harmonic-minor': [2, 1, 2, 2, 1, 3, 1],
            'locrian-natural-6': [1, 2, 2, 1, 3, 1, 2],
            'ionian-sharp-5': [2, 2, 1, 3, 1, 2, 1],
            'dorian-sharp-4': [2, 1, 3, 1, 2, 1, 2],
            'phrygian-dominant': [1, 3, 1, 2, 1, 2, 2],
            'lydian-sharp-2': [3, 1, 2, 1, 2, 2, 1],
            'altered-dominant': [1, 2, 1, 2, 2, 1, 3]
        }
    },
    'melodic-minor-modes': {
        name: 'Melodic Minor',
        description: 'The seven modes of the melodic minor scale',
        modes: ['melodic-minor', 'dorian-b2', 'lydian-augmented', 'lydian-dominant', 'mixolydian-b6', 'locrian-natural-2', 'super-locrian'],
        formulas: {
            'melodic-minor': [2, 1, 2, 2, 2, 2, 1],
            'dorian-b2': [1, 2, 2, 2, 2, 1, 2],
            'lydian-augmented': [2, 2, 2, 2, 1, 2, 1],
            'lydian-dominant': [2, 2, 2, 1, 2, 1, 2],
            'mixolydian-b6': [2, 2, 1, 2, 1, 2, 2],
            'locrian-natural-2': [2, 1, 2, 1, 2, 2, 2],
            'super-locrian': [1, 2, 1, 2, 2, 2, 2]
        }
    },
    'diminished-modes': {
        name: 'Diminished',
        description: 'Symmetrical diminished scales',
        modes: ['diminished', 'half-diminished'],
        formulas: {
            'diminished': [2, 1, 2, 1, 2, 1, 2, 1],
            'half-diminished': [1, 2, 1, 2, 1, 2, 1, 2]
        }
    },
    'whole-tone': {
        name: 'Whole Tone',
        description: 'Six-note scale of equal whole steps',
        modes: ['whole-tone'],
        formulas: {
            'whole-tone': [2, 2, 2, 2, 2, 2]
        }
    },
    'japanese-pentatonic': {
        name: 'Japanese Pentatonic',
        description: 'Traditional Japanese pentatonic scales',
        modes: ['hirojoshi-pentatonic', 'iwato-scale'],
        formulas: {
            'hirojoshi-pentatonic': [2, 1, 4, 1, 4],
            'iwato-scale': [1, 4, 1, 4, 2]
        }
    },
    'hungarian-minor-modes': {
        name: 'Hungarian Minor',
        description: 'The seven modes of the Hungarian minor scale',
        modes: ['hungarian-minor', 'oriental', 'ionian-augmented-sharp-2', 'locrian-double-flat-3-double-flat-7', 'double-harmonic-major', 'lydian-sharp-2-sharp-6', 'ultra-locrian'],
        formulas: {
            'hungarian-minor': [2, 1, 3, 1, 1, 3, 1],
            'oriental': [1, 3, 1, 1, 3, 1, 2],
            'ionian-augmented-sharp-2': [3, 1, 1, 3, 1, 2, 1],
            'locrian-double-flat-3-double-flat-7': [1, 1, 3, 1, 2, 1, 3],
            'double-harmonic-major': [1, 3, 1, 2, 1, 3, 1],
            'lydian-sharp-2-sharp-6': [3, 1, 2, 1, 3, 1, 1],
            'ultra-locrian': [1, 2, 1, 3, 1, 1, 3]
        }
    },
    'neapolitan-minor-modes': {
        name: 'Neapolitan Minor',
        description: 'The seven modes of the neapolitan minor scale',
        modes: ['neapolitan-minor', 'leading-whole-tone', 'lydian-augmented-dominant', 'lydian-dominant-flat-6', 'major-locrian', 'half-diminished-flat-2', 'altered-diminished'],
        formulas: {
            'neapolitan-minor': [1, 2, 2, 2, 1, 3, 1],
            'leading-whole-tone': [2, 2, 2, 1, 3, 1, 1],
            'lydian-augmented-dominant': [2, 2, 1, 3, 1, 1, 2],
            'lydian-dominant-flat-6': [2, 1, 3, 1, 1, 2, 2],
            'major-locrian': [1, 3, 1, 1, 2, 2, 2],
            'half-diminished-flat-2': [3, 1, 1, 2, 2, 2, 1],
            'altered-diminished': [1, 1, 2, 2, 2, 1, 3]
        }
    },
    'neapolitan-major-modes': {
        name: 'Neapolitan Major',
        description: 'The seven modes of the neapolitan major scale',
        modes: ['neapolitan-major', 'leading-whole-tone-major', 'lydian-augmented-major', 'lydian-dominant-major', 'major-locrian-major', 'half-diminished-major', 'altered-major'],
        formulas: {
            'neapolitan-major': [1, 2, 2, 2, 2, 2, 1],
            'leading-whole-tone-major': [2, 2, 2, 2, 2, 1, 1],
            'lydian-augmented-major': [2, 2, 2, 2, 1, 1, 2],
            'lydian-dominant-major': [2, 2, 2, 1, 1, 2, 2],
            'major-locrian-major': [2, 2, 1, 1, 2, 2, 2],
            'half-diminished-major': [2, 1, 1, 2, 2, 2, 2],
            'altered-major': [1, 1, 2, 2, 2, 2, 2]
        }
    },
    'harmonic-major-modes': {
        name: 'Harmonic Major',
        description: 'The seven modes of the harmonic major scale',
        modes: ['harmonic-major', 'dorian-b5', 'phrygian-b4', 'lydian-b3', 'mixolydian-b2', 'lydian-augmented-sharp-2', 'locrian-double-flat-7'],
        formulas: {
            'harmonic-major': [2, 2, 1, 2, 1, 3, 1],
            'dorian-b5': [2, 1, 2, 1, 3, 1, 2],
            'phrygian-b4': [1, 2, 1, 3, 1, 2, 2],
            'lydian-b3': [2, 1, 3, 1, 2, 2, 1],
            'mixolydian-b2': [1, 3, 1, 2, 2, 1, 2],
            'lydian-augmented-sharp-2': [3, 1, 2, 2, 1, 2, 1],
            'locrian-double-flat-7': [1, 2, 2, 1, 2, 1, 3]
        }
    },
    'augmented-scale': {
        name: 'Augmented',
        description: 'Six-note symmetrical scale',
        modes: ['augmented'],
        formulas: {
            'augmented': [1, 3, 1, 3, 1, 3]
        }
    },
    'chromatic-scale': {
        name: 'Chromatic',
        description: 'All twelve chromatic pitches',
        modes: ['chromatic'],
        formulas: {
            'chromatic': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        }
    }
};

// Mode Metadata
const modeMetadata = {
    // Major modes
    major: { mood: 'Happy', description: 'Bright and uplifting, the foundation of Western music. Also known as the Major scale.', applications: ['Pop', 'rock', 'folk', 'classical'] },
    dorian: { mood: 'Sophisticated', description: 'Minor with a natural 6th, creating a sophisticated, jazzy sound', applications: ['Jazz', 'folk', 'modal jazz'] },
    phrygian: { mood: 'Exotic', description: 'Dark and mysterious with a distinctive Spanish/Middle Eastern flavor', applications: ['Flamenco', 'metal', 'world music'] },
    lydian: { mood: 'Dreamy', description: 'Major with a raised 4th, creating an ethereal, floating quality', applications: ['Film scores', 'prog rock', 'jazz'] },
    mixolydian: { mood: 'Bluesy', description: 'Major with a flat 7th, the sound of blues and rock', applications: ['Blues', 'rock', 'country', 'folk'] },
    aeolian: { mood: 'Melancholy', description: 'Natural minor scale, emotional and introspective', applications: ['Pop', 'rock', 'classical', 'folk'] },
    locrian: { mood: 'Unstable', description: 'The most dissonant mode, rarely used as a tonal center', applications: ['Jazz', 'experimental', 'metal'] },
    
    // Harmonic minor modes
    'harmonic-minor': { mood: 'Dramatic', description: 'Classical minor scale with raised 7th, very dramatic', applications: ['Classical', 'neoclassical metal', 'film'] },
    'locrian-natural-6': { mood: 'Dark', description: 'Locrian with natural 6th, still unstable but more usable', applications: ['Jazz', 'experimental'] },
    'ionian-sharp-5': { mood: 'Augmented', description: 'Major scale with augmented 5th, creates tension', applications: ['Jazz', 'experimental'] },
    'dorian-sharp-4': { mood: 'Ukrainian', description: 'Dorian with raised 4th, common in Eastern European music', applications: ['Folk', 'world music'] },
    'phrygian-dominant': { mood: 'Spanish', description: 'The quintessential Spanish/Arabic sound', applications: ['Flamenco', 'metal', 'world music'] },
    'lydian-sharp-2': { mood: 'Exotic', description: 'Very exotic sound with unusual intervals', applications: ['World music', 'experimental'] },
    'altered-dominant': { mood: 'Jazzy', description: 'Ultimate jazz dominant sound with altered tensions', applications: ['Jazz', 'fusion'] },
    
    // Harmonic major modes
    'harmonic-major': { mood: 'Bright', description: 'Major scale with flat 6th, creates unique harmonic color', applications: ['Classical', 'jazz', 'film'] },
    'dorian-b5': { mood: 'Diminished', description: 'Dorian with flat 5th, half-diminished character', applications: ['Jazz', 'experimental'] },
    'phrygian-b4': { mood: 'Exotic', description: 'Phrygian with flat 4th, very exotic sound', applications: ['World music', 'experimental'] },
    'lydian-b3': { mood: 'Modal', description: 'Lydian with flat 3rd, unique modal character', applications: ['Jazz', 'modal music'] },
    'mixolydian-b2': { mood: 'Eastern', description: 'Mixolydian with flat 2nd, Eastern flavor', applications: ['World music', 'modal jazz'] },
    'lydian-augmented-sharp-2': { mood: 'Complex', description: 'Complex lydian variation with multiple alterations', applications: ['Experimental', 'modern classical'] },
    'locrian-double-flat-7': { mood: 'Unstable', description: 'Extremely unstable locrian variation', applications: ['Experimental', 'avant-garde'] },
    
    // Melodic minor modes
    'melodic-minor': { mood: 'Ascending', description: 'Jazz minor, bright ascending character', applications: ['Jazz', 'classical', 'film'] },
    'dorian-b2': { mood: 'Phrygian', description: 'Dorian with flat 2nd, creates Phrygian-like character', applications: ['Jazz', 'world music'] },
    'lydian-augmented': { mood: 'Ethereal', description: 'Lydian with augmented 5th, very ethereal', applications: ['Jazz', 'film scores'] },
    'lydian-dominant': { mood: 'Floating', description: 'The Lydian b7 scale, perfect for dominant chords', applications: ['Jazz', 'fusion', 'prog rock'] },
    'mixolydian-b6': { mood: 'Hindu', description: 'Mixolydian with flat 6th, common in Indian music', applications: ['Jazz', 'world music', 'fusion'] },
    'locrian-natural-2': { mood: 'Half-diminished', description: 'Perfect for half-diminished chords', applications: ['Jazz', 'fusion'] },
    'super-locrian': { mood: 'Altered', description: 'The altered scale, ultimate jazz tension', applications: ['Jazz', 'fusion'] },
    
    // Hungarian minor modes
    'hungarian-minor': { mood: 'Gypsy', description: 'Exotic scale with augmented 2nd intervals', applications: ['Gypsy', 'Eastern European', 'metal'] },
    'oriental': { mood: 'Eastern', description: 'Oriental scale with distinctive Middle Eastern character', applications: ['World music', 'film scores'] },
    'ionian-augmented-sharp-2': { mood: 'Exotic', description: 'Major scale with augmented intervals', applications: ['Experimental', 'world music'] },
    'locrian-double-flat-3-double-flat-7': { mood: 'Dissonant', description: 'Extremely dissonant mode with double flats', applications: ['Experimental', 'avant-garde'] },
    'double-harmonic-major': { mood: 'Arabic', description: 'Classic Arabic/Byzantine scale', applications: ['World music', 'metal', 'film'] },
    'lydian-sharp-2-sharp-6': { mood: 'Complex', description: 'Lydian with multiple sharp alterations', applications: ['Experimental', 'modern classical'] },
    'ultra-locrian': { mood: 'Unstable', description: 'Extremely unstable and dissonant', applications: ['Experimental', 'noise music'] },
    
    // Neapolitan minor modes
    'neapolitan-minor': { mood: 'Classical', description: 'Classical minor scale with flat 2nd degree', applications: ['Classical', 'neoclassical'] },
    'leading-whole-tone': { mood: 'Impressionist', description: 'Whole tone character with leading tone', applications: ['Impressionist', 'film'] },
    'lydian-augmented-dominant': { mood: 'Complex', description: 'Lydian augmented with dominant function', applications: ['Jazz', 'experimental'] },
    'lydian-dominant-flat-6': { mood: 'Modal', description: 'Lydian dominant with flat 6th', applications: ['Jazz', 'modal music'] },
    'major-locrian': { mood: 'Paradoxical', description: 'Major scale with locrian instability', applications: ['Experimental', 'modern jazz'] },
    'half-diminished-flat-2': { mood: 'Dark', description: 'Half-diminished with flat 2nd', applications: ['Jazz', 'experimental'] },
    'altered-diminished': { mood: 'Tense', description: 'Altered scale with diminished character', applications: ['Jazz', 'fusion'] },
    
    // Neapolitan major modes
    'neapolitan-major': { mood: 'Bright', description: 'Major version of Neapolitan scale', applications: ['Classical', 'experimental'] },
    'leading-whole-tone-major': { mood: 'Impressionist', description: 'Major version of leading whole tone', applications: ['Impressionist', 'film'] },
    'lydian-augmented-major': { mood: 'Ethereal', description: 'Major lydian augmented variation', applications: ['Film scores', 'ambient'] },
    'lydian-dominant-major': { mood: 'Floating', description: 'Major lydian dominant variation', applications: ['Jazz', 'fusion'] },
    'major-locrian-major': { mood: 'Unique', description: 'Unique major-locrian hybrid', applications: ['Experimental', 'modern classical'] },
    'half-diminished-major': { mood: 'Complex', description: 'Major scale with half-diminished elements', applications: ['Jazz', 'experimental'] },
    'altered-major': { mood: 'Colorful', description: 'Major scale with altered tensions', applications: ['Jazz', 'fusion'] },
    
    // Diminished modes
    'diminished': { mood: 'Symmetrical', description: 'Eight-note symmetrical scale, alternating whole-half steps', applications: ['Jazz', 'classical', 'metal'] },
    'half-diminished': { mood: 'Symmetrical', description: 'Eight-note symmetrical scale, alternating half-whole steps', applications: ['Jazz', 'classical', 'experimental'] },
    
    // Pentatonic scales
    'major-pentatonic': { mood: 'Universal', description: 'Five notes that work everywhere, no wrong notes', applications: ['Rock', 'country', 'pop', 'world'] },
    'suspended-pentatonic': { mood: 'Ancient', description: 'Suspended pentatonic with ancient, mystical character', applications: ['World music', 'ambient'] },
    'man-gong': { mood: 'Phrygian', description: 'Third mode of major pentatonic, known as Man Gong in Asian traditions', applications: ['Blues', 'rock', 'world music'] },
    'ritusen': { mood: 'Lydian', description: 'Fourth mode of major pentatonic, traditional Japanese Ritusen scale', applications: ['Country', 'folk', 'world music'] },
    'minor-pentatonic': { mood: 'Soulful', description: 'Classic minor pentatonic scale', applications: ['Blues', 'rock', 'jazz'] },
    'hirojoshi-pentatonic': { mood: 'Japanese', description: 'Traditional Japanese pentatonic scale', applications: ['World music', 'ambient', 'film'] },
    'iwato-scale': { mood: 'Japanese', description: 'Traditional Japanese scale with distinctive character', applications: ['World music', 'ambient', 'film'] },
    
    // Blues scales
    'blues-major': { mood: 'Country', description: 'Six-note blues scale with chromatic passing tones (blue notes)', applications: ['Blues', 'country', 'rock'] },
    'blues-minor': { mood: 'Soulful', description: 'Six-note blues scale with characteristic blue notes', applications: ['Blues', 'rock', 'jazz'] },
    
    // Other scales
    'whole-tone': { mood: 'Dreamy', description: 'Six notes separated by whole steps, creates floating ambiguity. Note: The whole tone scale doesn\'t have traditional modes since every rotation produces the same interval pattern. There are only two distinct whole tone scales: one starting on C (C-D-E-F#-G#-A#) and one starting on Db (Db-Eb-F-G-A-B), which together contain all 12 chromatic notes.', applications: ['Impressionist', 'jazz', 'film'] },
    'chromatic': { mood: 'Chromatic', description: 'All twelve pitches, ultimate color and tension', applications: ['Jazz', 'classical', 'experimental'] },
    'augmented': { mood: 'Symmetrical', description: 'Six-note symmetrical scale with augmented character', applications: ['Jazz', 'experimental', 'modern classical'] },
    'bebop-major': { mood: 'Jazzy', description: 'Major scale with added chromatic passing tone', applications: ['Bebop jazz', 'jazz improvisation'] }
};

// Mode Numbers and Names
const modeNumbers = {
    // Major modes
    'major': { number: 1, properName: 'Ionian' },
    'dorian': { number: 2, properName: 'Dorian' },
    'phrygian': { number: 3, properName: 'Phrygian' },
    'lydian': { number: 4, properName: 'Lydian' },
    'mixolydian': { number: 5, properName: 'Mixolydian' },
    'aeolian': { number: 6, properName: 'Aeolian' },
    'locrian': { number: 7, properName: 'Locrian' },
    
    // Harmonic Minor modes
    'harmonic-minor': { number: 1, properName: 'Harmonic Minor' },
    'locrian-natural-6': { number: 2, properName: 'Locrian ♮6' },
    'ionian-sharp-5': { number: 3, properName: 'Ionian #5' },
    'dorian-sharp-4': { number: 4, properName: 'Dorian #4' },
    'phrygian-dominant': { number: 5, properName: 'Phrygian Dominant' },
    'lydian-sharp-2': { number: 6, properName: 'Lydian #2' },
    'altered-dominant': { number: 7, properName: 'Altered Dominant' },
    
    // Harmonic Major modes
    'harmonic-major': { number: 1, properName: 'Harmonic Major' },
    'dorian-b5': { number: 2, properName: 'Dorian ♭5' },
    'phrygian-b4': { number: 3, properName: 'Phrygian ♭4' },
    'lydian-b3': { number: 4, properName: 'Lydian ♭3' },
    'mixolydian-b2': { number: 5, properName: 'Mixolydian ♭2' },
    'lydian-augmented-sharp-2': { number: 6, properName: 'Lydian Aug #2' },
    'locrian-double-flat-7': { number: 7, properName: 'Locrian ♭♭7' },
    
    // Melodic Minor modes
    'melodic-minor': { number: 1, properName: 'Melodic Minor' },
    'dorian-b2': { number: 2, properName: 'Dorian ♭2' },
    'lydian-augmented': { number: 3, properName: 'Lydian Augmented' },
    'lydian-dominant': { number: 4, properName: 'Lydian Dominant' },
    'mixolydian-b6': { number: 5, properName: 'Mixolydian ♭6' },
    'locrian-natural-2': { number: 6, properName: 'Locrian ♮2' },
    'super-locrian': { number: 7, properName: 'Super Locrian' },
    
    // Hungarian Minor modes
    'hungarian-minor': { number: 1, properName: 'Hungarian Minor' },
    'oriental': { number: 2, properName: 'Oriental' },
    'ionian-augmented-sharp-2': { number: 3, properName: 'Ionian Aug #2' },
    'locrian-double-flat-3-double-flat-7': { number: 4, properName: 'Locrian ♭♭3 ♭♭7' },
    'double-harmonic-major': { number: 5, properName: 'Double Harmonic Major' },
    'lydian-sharp-2-sharp-6': { number: 6, properName: 'Lydian #2 #6' },
    'ultra-locrian': { number: 7, properName: 'Ultra Locrian' },
    
    // Neapolitan Minor modes
    'neapolitan-minor': { number: 1, properName: 'Neapolitan Minor' },
    'leading-whole-tone': { number: 2, properName: 'Leading Whole Tone' },
    'lydian-augmented-dominant': { number: 3, properName: 'Lydian Aug Dom' },
    'lydian-dominant-flat-6': { number: 4, properName: 'Lydian Dom ♭6' },
    'major-locrian': { number: 5, properName: 'Major Locrian' },
    'half-diminished-flat-2': { number: 6, properName: 'Half Dim ♭2' },
    'altered-diminished': { number: 7, properName: 'Altered Diminished' },
    
    // Neapolitan Major modes
    'neapolitan-major': { number: 1, properName: 'Neapolitan Major' },
    'leading-whole-tone-major': { number: 2, properName: 'Leading Whole Tone Maj' },
    'lydian-augmented-major': { number: 3, properName: 'Lydian Aug Major' },
    'lydian-dominant-major': { number: 4, properName: 'Lydian Dom Major' },
    'major-locrian-major': { number: 5, properName: 'Major Locrian Major' },
    'half-diminished-major': { number: 6, properName: 'Half Dim Major' },
    'altered-major': { number: 7, properName: 'Altered Major' },
    
    // Diminished modes
    'diminished': { number: 1, properName: 'Whole Half Diminished' },
    'half-diminished': { number: 2, properName: 'Half Whole Diminished' },
    
    // Pentatonic scales
    'major-pentatonic': { number: 1, properName: 'Major Pentatonic' },
    'suspended-pentatonic': { number: 2, properName: 'Suspended Pentatonic' },
    'man-gong': { number: 3, properName: 'Man Gong' },
    'ritusen': { number: 4, properName: 'Ritusen' },
    'minor-pentatonic': { number: 5, properName: 'Minor Pentatonic' },
    'hirojoshi-pentatonic': { number: 1, properName: 'Hirojoshi Pentatonic' },
    'iwato-scale': { number: 2, properName: 'Iwato Scale' },
    
    // Blues scales
    'blues-major': { number: 1, properName: 'Blues Major' },
    'blues-minor': { number: 2, properName: 'Blues Minor' },
    
    // Other scales
    'whole-tone': { number: 1, properName: 'Whole Tone' },
    'chromatic': { number: 1, properName: 'Chromatic' },
    'augmented': { number: 1, properName: 'Augmented' },
    'bebop-major': { number: 1, properName: 'Bebop Major' }
};

// Export all constants
window.MusicConstants = {
    chromaticScale,
    musicTheoryKeys,
    scaleFormulas,
    scaleDegreeWeights,
    intervalColors,
    scaleCategories,
    modeMetadata,
    modeNumbers
}; 