/**
 * Integrated Audio Controls - No separate UI, just click-to-play functionality
 * Adds audio playback to existing notes, intervals, and chords
 */

class AudioControls {
    constructor() {
        this.currentScale = [];
        this.currentChords = [];
        this.isPlaying = false;
    }

    // Initialize audio controls - just add click handlers, no UI
    initialize() {
        console.log('Audio Controls initialized');
        
        // Add click handlers after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.addNoteClickHandlers();
            this.addChordClickHandlers();
        }, 500);
    }

    // Update current scale for playback
    updateScale(scale) {
        this.currentScale = scale || [];
        
        // Re-add click handlers when scale updates
        setTimeout(() => {
            this.addNoteClickHandlers();
        }, 100);
    }

    // Update current chords for playback
    updateChords(chords) {
        this.currentChords = [];
        
        // Handle different chord data structures
        if (chords && chords.triads) {
            this.currentChords = chords.triads;
        } else if (Array.isArray(chords)) {
            this.currentChords = chords;
        }
        
        // Re-add click handlers when chords update
        setTimeout(() => {
            this.addChordClickHandlers();
        }, 100);
    }

    // Add click-to-play functionality to notes and intervals
    addNoteClickHandlers() {
        // Target all note elements: fretboard notes, scale notes, and intervals
        const noteSelectors = [
            '.fretboard-note',
            '.note-circle', 
            '.notes .note',
            '.intervals .interval'
        ];
        
        noteSelectors.forEach(selector => {
            const noteElements = document.querySelectorAll(selector);
            
            noteElements.forEach(noteElement => {
                // Remove existing listeners to avoid duplicates
                if (noteElement._audioHandler) {
                    noteElement.removeEventListener('click', noteElement._audioHandler);
                }
                
                noteElement.style.cursor = 'pointer';
                noteElement.title = 'Click to play';
                
                // Bind the handler to maintain 'this' context
                const boundHandler = this.handleNoteClick.bind(this);
                noteElement.addEventListener('click', boundHandler);
                
                // Store the handler for removal later
                noteElement._audioHandler = boundHandler;
            });
        });
    }

    // Handle note click events
    async handleNoteClick(e) {
        e.stopPropagation();
        
        if (this.isPlaying) return;
        
        // Ensure audio engine is initialized
        if (!window.AudioEngine.isInitialized) {
            await window.AudioEngine.initialize();
        }
        
        // Get note name from element
        let noteName = null;
        
        // Method 1: Direct text content
        noteName = e.target.textContent?.trim();
        
        // Method 2: Data attribute
        if (!noteName) {
            noteName = e.target.getAttribute('data-note');
        }
        
        // Method 3: If it's an interval, convert to corresponding note
        if (!noteName || noteName.match(/^[♭♯#b]?[1-7]$/)) {
            const noteElements = document.querySelectorAll('.notes .note');
            const intervalElements = document.querySelectorAll('.intervals .interval');
            
            const intervalIndex = Array.from(intervalElements).indexOf(e.target);
            if (intervalIndex >= 0 && noteElements[intervalIndex]) {
                noteName = noteElements[intervalIndex].textContent?.trim();
            }
        }
        
        // Clean up note name
        if (noteName) {
            noteName = noteName.replace(/[^\w#♯♭b]/g, '').replace(/♯/g, '#').replace(/♭/g, 'b');
            
            // Ensure we have a valid note name
            if (noteName && noteName.match(/^[A-G][#b]?$/)) {
                try {
                    await window.AudioEngine.playNote(noteName);
                    
                    // Brief visual feedback
                    e.target.style.transform = 'scale(1.1)';
                    setTimeout(() => {
                        e.target.style.transform = '';
                    }, 150);
                    
                } catch (error) {
                    console.error('Error playing note:', error);
                }
            }
        }
    }

    // Add click-to-play functionality to chord elements
    addChordClickHandlers() {
        const chordElements = document.querySelectorAll('.chord-item, .chord-button, .characteristic-chord');
        
        chordElements.forEach((chordElement, index) => {
            // Remove existing listeners to avoid duplicates
            if (chordElement._audioHandler) {
                chordElement.removeEventListener('click', chordElement._audioHandler);
            }
            
            chordElement.style.cursor = 'pointer';
            chordElement.title = 'Click to play chord';
            
            const boundHandler = this.handleChordClick.bind(this, chordElement, index);
            chordElement.addEventListener('click', boundHandler);
            
            // Store the handler for removal later
            chordElement._audioHandler = boundHandler;
        });
    }

    // Handle chord click events
    async handleChordClick(chordElement, index, e) {
        if (e.target.closest('.chord-notes')) return; // Don't interfere with existing functionality
        
        if (this.isPlaying) return;
        
        // Ensure audio engine is initialized
        if (!window.AudioEngine.isInitialized) {
            await window.AudioEngine.initialize();
        }
        
        let chordNotes = null;
        
        // Try to get chord notes from the current chords data
        if (this.currentChords[index] && this.currentChords[index].notes) {
            chordNotes = this.currentChords[index].notes;
        } else {
            // Try to extract notes from the chord element's text content
            const notesElement = chordElement.querySelector('.chord-notes');
            if (notesElement) {
                const notesText = notesElement.textContent;
                chordNotes = notesText.split(/[-–—]/).map(note => 
                    note.trim().replace(/[^\w#♯♭b]/g, '').replace(/♯/g, '#').replace(/♭/g, 'b')
                ).filter(note => note && note.match(/^[A-G][#b]?$/));
            }
        }
        
        if (chordNotes && chordNotes.length > 0) {
            try {
                // Play chord arpeggiated on click
                await window.AudioEngine.playChord(chordNotes, true);
                
                // Brief visual feedback
                chordElement.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    chordElement.style.transform = '';
                }, 300);
                
            } catch (error) {
                console.error('Error playing chord:', error);
            }
        }
    }
}

// Create global audio controls instance
window.AudioControls = new AudioControls();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioControls;
} 