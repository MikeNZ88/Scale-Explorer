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
    
    // Melodic Minor modes
    'melodic-minor': [2, 1, 2, 2, 2, 2, 1],
    'dorian-b2': [1, 2, 2, 2, 2, 1, 2],
    'lydian-augmented': [2, 2, 2, 2, 1, 2, 1],
    'lydian-dominant': [2, 2, 2, 1, 2, 1, 2],
    'mixolydian-b6': [2, 2, 1, 2, 1, 2, 2],
    'locrian-natural-2': [2, 1, 2, 1, 2, 2, 2],
    'super-locrian': [1, 2, 1, 2, 2, 2, 2],
    
    // Diminished modes
    'wh-diminished': [2, 1, 2, 1, 2, 1, 2, 1],  // W-H pattern
    'hw-diminished': [1, 2, 1, 2, 1, 2, 1, 2],   // H-W pattern
    
    // Pentatonic scales
    'major-pentatonic': [2, 2, 3, 2, 3],
    'suspended-pentatonic': [2, 3, 2, 3, 2],
    'man-gong': [3, 2, 3, 2, 2],
    'ritusen': [2, 3, 2, 2, 3],
    'minor-pentatonic': [3, 2, 2, 3, 2],
    
    // Whole tone scales
    'whole-tone-1': [2, 2, 2, 2, 2, 2],  // Rotation 1
    'whole-tone-2': [2, 2, 2, 2, 2, 2],  // Rotation 2
    'whole-tone-3': [2, 2, 2, 2, 2, 2],  // Rotation 3
    'whole-tone-4': [2, 2, 2, 2, 2, 2],  // Rotation 4
    'whole-tone-5': [2, 2, 2, 2, 2, 2],  // Rotation 5
    'whole-tone-6': [2, 2, 2, 2, 2, 2],  // Rotation 6
    
    // Blues scales
    'blues-major': [2, 1, 1, 3, 2, 3],
    'blues-minor': [3, 2, 1, 1, 3, 2],
    
    // Other scales
    'chromatic': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
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

// Scale Categories and Metadata
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
        name: 'Octatonic/Diminished',
        description: 'Two complementary eight-note symmetrical scales with 4 rotations each (only 2 unique transpositions)',
        modes: ['wh-diminished', 'hw-diminished'],
        formulas: {
            'wh-diminished': [2, 1, 2, 1, 2, 1, 2, 1],  // W-H pattern
            'hw-diminished': [1, 2, 1, 2, 1, 2, 1, 2]   // H-W pattern
        }
    },
    'whole-tone': {
        name: 'Whole Tone',
        description: 'Six-note scale of equal whole steps (6 rotations, only 2 unique transpositions)',
        modes: ['whole-tone-1', 'whole-tone-2', 'whole-tone-3', 'whole-tone-4', 'whole-tone-5', 'whole-tone-6'],
        formulas: {
            'whole-tone-1': [2, 2, 2, 2, 2, 2],  // Rotation 1
            'whole-tone-2': [2, 2, 2, 2, 2, 2],  // Rotation 2
            'whole-tone-3': [2, 2, 2, 2, 2, 2],  // Rotation 3
            'whole-tone-4': [2, 2, 2, 2, 2, 2],  // Rotation 4
            'whole-tone-5': [2, 2, 2, 2, 2, 2],  // Rotation 5
            'whole-tone-6': [2, 2, 2, 2, 2, 2]   // Rotation 6
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
    
    // Melodic minor modes
    'melodic-minor': { mood: 'Ascending', description: 'Jazz minor, bright ascending character', applications: ['Jazz', 'classical', 'film'] },
    'dorian-b2': { mood: 'Phrygian', description: 'Dorian with flat 2nd, creates Phrygian-like character', applications: ['Jazz', 'world music'] },
    'lydian-augmented': { mood: 'Ethereal', description: 'Lydian with augmented 5th, very ethereal', applications: ['Jazz', 'film scores'] },
    'lydian-dominant': { mood: 'Floating', description: 'The Lydian b7 scale, perfect for dominant chords', applications: ['Jazz', 'fusion', 'prog rock'] },
    'mixolydian-b6': { mood: 'Hindu', description: 'Mixolydian with flat 6th, common in Indian music', applications: ['Jazz', 'world music', 'fusion'] },
    'locrian-natural-2': { mood: 'Half-diminished', description: 'Perfect for half-diminished chords', applications: ['Jazz', 'fusion'] },
    'super-locrian': { mood: 'Altered', description: 'The altered scale, ultimate jazz tension', applications: ['Jazz', 'fusion'] },
    
    // Diminished modes
    'wh-diminished': { mood: 'Symmetrical', description: 'Eight-note symmetrical scale, alternating whole-half steps', applications: ['Jazz', 'classical', 'metal'] },
    'hw-diminished': { mood: 'Symmetrical', description: 'Eight-note symmetrical scale, alternating half-whole steps', applications: ['Jazz', 'classical', 'experimental'] },
    
    // Pentatonic scales
    'major-pentatonic': { mood: 'Universal', description: 'Five notes that work everywhere, no wrong notes', applications: ['Rock', 'country', 'pop', 'world'] },
    'suspended-pentatonic': { mood: 'Ancient', description: 'Suspended pentatonic with ancient, mystical character', applications: ['World music', 'ambient'] },
    'man-gong': { mood: 'Phrygian', description: 'Third mode of major pentatonic, known as Man Gong in Asian traditions', applications: ['Blues', 'rock', 'world music'] },
    'ritusen': { mood: 'Lydian', description: 'Fourth mode of major pentatonic, traditional Japanese Ritusen scale', applications: ['Country', 'folk', 'world music'] },
    'minor-pentatonic': { mood: 'Soulful', description: 'Classic minor pentatonic scale', applications: ['Blues', 'rock', 'jazz'] },
    
    // Blues scales
    'blues-major': { mood: 'Country', description: 'Six-note blues scale with chromatic passing tones (blue notes)', applications: ['Blues', 'country', 'rock'] },
    'blues-minor': { mood: 'Soulful', description: 'Six-note blues scale with characteristic blue notes', applications: ['Blues', 'rock', 'jazz'] },
    
    // Whole tone scales
    'whole-tone-1': { mood: 'Dreamy', description: 'First rotation of the whole tone scale, creates floating ambiguity', applications: ['Impressionist', 'jazz', 'film'] },
    'whole-tone-2': { mood: 'Dreamy', description: 'Second rotation of the whole tone scale', applications: ['Impressionist', 'jazz', 'film'] },
    'whole-tone-3': { mood: 'Dreamy', description: 'Third rotation of the whole tone scale', applications: ['Impressionist', 'jazz', 'film'] },
    'whole-tone-4': { mood: 'Dreamy', description: 'Fourth rotation of the whole tone scale', applications: ['Impressionist', 'jazz', 'film'] },
    'whole-tone-5': { mood: 'Dreamy', description: 'Fifth rotation of the whole tone scale', applications: ['Impressionist', 'jazz', 'film'] },
    'whole-tone-6': { mood: 'Dreamy', description: 'Sixth rotation of the whole tone scale', applications: ['Impressionist', 'jazz', 'film'] },
    
    // Other scales
    'chromatic': { mood: 'Chromatic', description: 'All twelve pitches, ultimate color and tension', applications: ['Jazz', 'classical', 'experimental'] }
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
    
    // Melodic Minor modes
    'melodic-minor': { number: 1, properName: 'Melodic Minor' },
    'dorian-b2': { number: 2, properName: 'Dorian ♭2' },
    'lydian-augmented': { number: 3, properName: 'Lydian Augmented' },
    'lydian-dominant': { number: 4, properName: 'Lydian Dominant' },
    'mixolydian-b6': { number: 5, properName: 'Mixolydian ♭6' },
    'locrian-natural-2': { number: 6, properName: 'Locrian ♮2' },
    'super-locrian': { number: 7, properName: 'Super Locrian' },
    
    // Diminished modes
    'wh-diminished': { number: 1, properName: 'WH Diminished' },
    'hw-diminished': { number: 2, properName: 'HW Diminished' },
    
    // Pentatonic scales
    'major-pentatonic': { number: 1, properName: 'Major Pentatonic' },
    'suspended-pentatonic': { number: 2, properName: 'Suspended Pentatonic' },
    'man-gong': { number: 3, properName: 'Man Gong' },
    'ritusen': { number: 4, properName: 'Ritusen' },
    'minor-pentatonic': { number: 5, properName: 'Minor Pentatonic' },
    
    // Blues scales
    'blues-major': { number: 1, properName: 'Blues Major' },
    'blues-minor': { number: 2, properName: 'Blues Minor' },
    
    // Whole tone scales
    'whole-tone-1': { number: 1, properName: 'Whole Tone' },
    'whole-tone-2': { number: 2, properName: 'Whole Tone' },
    'whole-tone-3': { number: 3, properName: 'Whole Tone' },
    'whole-tone-4': { number: 4, properName: 'Whole Tone' },
    'whole-tone-5': { number: 5, properName: 'Whole Tone' },
    'whole-tone-6': { number: 6, properName: 'Whole Tone' },
    
    // Other scales
    'chromatic': { number: 1, properName: 'Chromatic' }
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