// Color utility functions for music theory visualization
// Depends on: constants.js

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
    // First try direct lookup
    let color = MusicConstants.intervalColors[interval];
    
    // If not found, try enharmonic equivalent
    if (!color) {
        // Inline enharmonic equivalent mapping for performance
        const enharmonicMap = {
            '#4': 'b5', 'b5': '#4',
            '#1': 'b2', 'b2': '#1',
            '#2': 'b3', 'b3': '#2',
            '#5': 'b6', 'b6': '#5',
            '#6': 'b7', 'b7': '#6',
            'b4': '3', '#3': '4',  // b4 = 3, #3 = 4
            'bb7': '6', '##1': '2', 
            '##2': '3', '##4': '5',
            '##5': '6', '##6': '7',
            '#7': '1', 'bb2': '1',
            'bb3': '2', 'bb4': '3',
            'bb5': '4', 'bb6': '5'
        };
        
        const enharmonicEquivalent = enharmonicMap[interval];
        if (enharmonicEquivalent) {
            color = MusicConstants.intervalColors[enharmonicEquivalent];
        }
    }
    
    return color || '#8B5CF6';
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

function getChordColor(chordFunction, quality) {
    const functionColors = {
        // Traditional functional harmony colors
        'Tonic': '#4CAF50',           // Green
        'Dominant': '#FF9800',        // Orange
        'Predominant': '#9C27B0',     // Purple
        
        // Modal function colors
        'Center': '#4CAF50',          // Green (same as Tonic)
        'Stable': '#66BB6A',          // Light Green
        'Tension': '#FF7043',         // Orange-Red
        'Color': '#AB47BC',           // Purple-Pink
        'Characteristic': '#42A5F5',  // Blue
        'Resolution': '#FF9800',      // Orange (same as Dominant)
        'Subtonic': '#FFA726',        // Light Orange
        'Neapolitan': '#EC407A',      // Pink
        'Chromatic': '#8D6E63',       // Brown
        'Augmented': '#FFCA28',       // Yellow
        'Diminished Center': '#F44336', // Red
        'Modal': '#78909C',           // Blue Grey
        
        // Legacy colors for compatibility
        'Secondary': '#607D8B',       // Blue Grey
        'Substitute': '#E91E63'       // Pink
    };
    
    let baseColor = functionColors[chordFunction] || '#8B5CF6';
    
    // Modify color based on quality
    if (quality === 'minor' || quality === 'diminished') {
        // Darken for minor/diminished
        const rgb = hexToRgb(baseColor);
        if (rgb) {
            baseColor = rgbToHex(
                Math.max(0, rgb.r - 40),
                Math.max(0, rgb.g - 40),
                Math.max(0, rgb.b - 40)
            );
        }
    } else if (quality === 'augmented') {
        // Brighten for augmented
        const rgb = hexToRgb(baseColor);
        if (rgb) {
            baseColor = rgbToHex(
                Math.min(255, rgb.r + 40),
                Math.min(255, rgb.g + 40),
                Math.min(255, rgb.b + 40)
            );
        }
    }
    
    return baseColor;
}

// Export all functions to global scope
window.ColorUtils = {
    hexToRgb,
    rgbToHex,
    calculateScaleColor,
    enhanceScaleColor,
    getIntervalColor,
    lightenColor,
    getChordColor
}; 