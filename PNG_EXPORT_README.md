# PNG Export Feature Documentation

## Overview

This document describes the PNG export functionality that has been added to the Guitar Tab Player application. The feature allows users to export guitar tablature as high-quality PNG images with customizable options.

## Features

### 🎯 Core Functionality
- **Export entire scores** or **specific bar ranges** as PNG images
- **Multiple quality levels** (1x, 2x, 3x, 4x scaling)
- **Automatic filename generation** based on song title and bar range
- **Modern modal interface** with intuitive controls
- **Real-time preview** of export selection

### 🎨 User Interface
- **Export button** (📷) in the horizontal controls section
- **Modal dialog** with clean, modern design
- **Bar range selection** with dropdown menus
- **Quality/scale selection** for different output resolutions
- **Loading states** with animated spinner during export
- **Responsive design** that works on mobile devices

## Implementation Details

### Files Modified

#### 1. `index.html`
- Added PNG export button to horizontal controls
- Added modal dialog structure with form controls
- Integrated seamlessly with existing UI

#### 2. `styles.css`
- Added comprehensive modal styling with animations
- Implemented modern gradient designs and hover effects
- Added responsive breakpoints for mobile compatibility
- Included loading states and visual feedback

#### 3. `app.js`
- Implemented complete PNG export functionality
- Added modal management and event handling
- Integrated with AlphaTab's rendering system
- Added error handling and user feedback

### Technical Architecture

```
PNG Export Flow:
1. User clicks export button → Opens modal
2. User selects bar range and quality → Updates preview
3. User clicks "Export PNG" → Starts export process
4. Creates temporary AlphaTab instance → Renders score
5. Extracts canvas elements → Combines into single image
6. Converts to PNG blob → Downloads file
7. Cleans up resources → Closes modal
```

### Key Functions

#### `initializePngExport()`
- Sets up event listeners for all export-related UI elements
- Handles modal open/close functionality
- Manages form validation and user interactions

#### `openExportModal()`
- Validates that a score is loaded
- Populates bar selection dropdowns based on score structure
- Shows modal with proper focus management

#### `populateBarSelections()`
- Dynamically generates bar options based on loaded score
- Handles different score formats and structures
- Sets sensible defaults (export all bars)

#### `performPngExport()`
- Creates temporary AlphaTab instance for rendering
- Uses HTML5 canvas engine for optimal PNG output
- Combines multiple canvas elements into single image
- Handles file download with proper naming

#### `updateScoreForExport()`
- Enables export button when score is loaded
- Stores score reference for export functionality
- Updates UI state appropriately

## Usage Instructions

### For Users

1. **Load a Guitar Pro file** using the file input
2. **Wait for the score to render** completely
3. **Click the PNG export button** (📷) in the controls
4. **Select your preferences:**
   - Start bar (default: 1)
   - End bar (default: last bar)
   - Quality/scale (default: 2x)
5. **Click "Export PNG"** to download the image
6. **Wait for processing** (indicated by loading spinner)
7. **Save the downloaded file** to your desired location

### Export Options

#### Bar Range Selection
- **Single bar**: Set start and end to the same bar number
- **Multiple bars**: Select different start and end bars
- **Entire score**: Use default selection (bar 1 to last bar)

#### Quality Levels
- **1x (Normal)**: Standard resolution, smaller file size
- **2x (High)**: Double resolution, recommended for most uses
- **3x (Very High)**: Triple resolution, great for printing
- **4x (Ultra)**: Quadruple resolution, maximum quality

### File Naming Convention

Generated filenames follow this pattern:
```
{song_title}_{bar_range}_{quality}.png

Examples:
- "stairway_to_heaven_bars_1-32_2x.png"
- "hotel_california_bar_15_3x.png"
- "unknown_title_bars_1-8_1x.png"
```

## Browser Compatibility

### Supported Browsers
- ✅ **Chrome 80+** (Recommended)
- ✅ **Firefox 75+**
- ✅ **Safari 13+**
- ✅ **Edge 80+**

### Required Features
- HTML5 Canvas support
- Blob API support
- File download API support
- ES6+ JavaScript features

## Performance Considerations

### Optimization Features
- **Temporary rendering**: Uses off-screen rendering to avoid UI interference
- **Memory management**: Properly cleans up resources after export
- **Canvas combination**: Efficiently combines multiple canvas elements
- **Timeout handling**: Prevents hanging on failed renders

### Performance Tips
- **Lower quality settings** export faster
- **Smaller bar ranges** process more quickly
- **Complex scores** may take longer to render
- **Large scales** (3x, 4x) require more memory

## Error Handling

### Common Issues and Solutions

#### "No score loaded"
- **Cause**: Trying to export before loading a file
- **Solution**: Load a Guitar Pro file first

#### "Export rendering timeout"
- **Cause**: Complex score taking too long to render
- **Solution**: Try smaller bar range or lower quality

#### "No canvas elements found"
- **Cause**: Rendering engine issue
- **Solution**: Refresh page and try again

#### Download not starting
- **Cause**: Browser blocking downloads
- **Solution**: Check browser download settings

## Development Notes

### Code Structure
```javascript
// Main export functionality
initializePngExport()     // Setup and event binding
openExportModal()         // Modal management
performPngExport()        // Core export logic
updateScoreForExport()    // Integration with score loading

// Helper functions
populateBarSelections()   // UI population
updateExportPreview()     // Real-time feedback
closeModal()             // Cleanup and reset
```

### Integration Points
- **Score loading**: Automatically enables export when score loads
- **Track visibility**: Respects current track visibility settings
- **UI state**: Maintains consistency with application state
- **Error handling**: Provides user-friendly error messages

### Future Enhancements
- **PDF export**: Similar modal for PDF generation
- **SVG export**: Vector format option
- **Batch export**: Multiple files at once
- **Custom dimensions**: User-specified width/height
- **Watermarking**: Optional branding/attribution

## Testing

### Manual Testing Checklist
- [ ] Export button appears after loading score
- [ ] Modal opens with correct bar options
- [ ] Bar range validation works correctly
- [ ] All quality levels produce different file sizes
- [ ] Filename generation works properly
- [ ] Loading states display correctly
- [ ] Error handling works for edge cases
- [ ] Mobile responsiveness functions properly

### Test Files
Use the provided sample files in `public/samples/`:
- `effects.gp4` - Test effects rendering
- `fingering.gp4` - Test fingering notation
- `vibrato.gp` - Test vibrato and ornaments

### Automated Testing
Run the test page at `test-export.html` to verify:
- DOM element presence
- JavaScript functionality
- AlphaTab integration
- Basic error handling

## Troubleshooting

### Debug Mode
Enable console logging to see detailed export process:
```javascript
// In browser console
localStorage.setItem('debug-export', 'true');
```

### Common Debug Steps
1. **Check browser console** for error messages
2. **Verify AlphaTab loading** (should see initialization logs)
3. **Test with simple files** first (like `fingering.gp4`)
4. **Try different quality settings** if export fails
5. **Clear browser cache** if issues persist

## Support

For issues or questions about the PNG export feature:
1. Check this documentation first
2. Review browser console for errors
3. Test with provided sample files
4. Verify browser compatibility
5. Report bugs with specific steps to reproduce

---

*This feature was implemented using AlphaTab's rendering capabilities and modern web APIs for optimal performance and user experience.* 