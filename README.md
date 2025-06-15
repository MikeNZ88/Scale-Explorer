# 🎵 Scale Explorer

An interactive music theory tool for exploring scales, modes, and chord progressions with visual fretboard display.

![Scale Explorer](https://img.shields.io/badge/Scale-Explorer-8B4513?style=for-the-badge&logo=music&logoColor=white)
![MIT License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-FF6B6B?style=for-the-badge)

## ✨ Features

### 🎸 **Interactive Fretboard**
- **Visual Scale Display**: See scales and modes on a guitar fretboard
- **Note Highlighting**: Color-coded notes and intervals
- **Multiple Viewing Modes**: Notes, intervals, and scale degrees
- **Responsive Design**: Works on desktop and mobile

### 🎼 **Comprehensive Music Theory**
- **200+ Scales**: Major, minor, modes, exotic scales, and more
- **Chord Analysis**: Real-time chord detection and naming
- **Interval Recognition**: Perfect, major, minor, augmented, diminished
- **Scale Relationships**: See parent scales and related modes

### 🎵 **Audio Playback**
- **Scale Playback**: Hear scales ascending and descending
- **Web Audio API**: High-quality audio synthesis
- **Tempo Control**: Adjustable playback speed
- **Note Highlighting**: Visual feedback during playback

### 🎯 **Chord Explorer**
- **Chord Categories**: Organized by type (7th, 9th, 11th, 13th, etc.)
- **Chord Voicings**: Multiple fingering options
- **Quality Analysis**: Major, minor, diminished, augmented, and more
- **Symbol Recognition**: Proper chord symbol formatting

### 🔍 **Smart Search**
- **Scale Search**: Find scales by name or characteristics
- **Mode Discovery**: Explore related modes and variations
- **Filter Options**: Search by scale type, category, or interval pattern

## 🚀 Quick Start

### **Run Locally**

1. **Clone the repository**
   ```bash
   git clone https://github.com/MikeNZ88/Scale-Explorer.git
   cd Scale-Explorer
   ```

2. **Start a local server**
   ```bash
   # Using Python 3
   python -m http.server 3000
   
   # Or using Python 2
   python -m SimpleHTTPServer 3000
   
   # Or using Node.js
   npx http-server -p 3000
   ```

3. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📖 How to Use

### **Exploring Scales**
1. **Select a Key**: Choose your root note (C, D, E, etc.)
2. **Pick a Scale**: Browse categories or use the search
3. **View on Fretboard**: See the scale highlighted on the guitar neck
4. **Play Audio**: Click the play button to hear the scale

### **Chord Analysis**
1. **Navigate to Chords**: Scroll down to see chord progressions
2. **Explore Categories**: Browse by chord type (triads, 7ths, etc.)
3. **View Voicings**: Click on chords to see fretboard positions
4. **Analyze Quality**: See chord symbols and quality descriptions

### **Scale Comparison**
1. **Enter Compare Mode**: Click the compare button
2. **Select Second Scale**: Choose another scale to compare
3. **Visual Overlay**: See both scales on the same fretboard
4. **Spot Differences**: Identify unique and shared notes

## 🛠️ Technical Details

### **Built With**
- **Vanilla JavaScript**: No framework dependencies
- **Web Audio API**: Real-time audio synthesis
- **SVG Graphics**: Scalable fretboard visualization
- **CSS Grid/Flexbox**: Responsive layout system

### **Browser Support**
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+

### **Key Features**
- ✅ 200+ scales and modes
- ✅ Real-time chord analysis
- ✅ Audio playback with Web Audio API
- ✅ Responsive design for all devices
- ✅ No external dependencies

## 📁 Project Structure

```
Scale-Explorer/
├── index.html              # Main application file
├── styles.css              # Main stylesheet
├── app.js                  # Application entry point
├── js/
│   ├── core/
│   │   ├── constants.js        # Musical constants and data
│   │   ├── scale-calculator.js # Scale generation logic
│   │   ├── chord-analyzer.js   # Chord analysis engine
│   │   ├── music-theory.js     # Core music theory functions
│   │   ├── audio-engine.js     # Web Audio API integration
│   │   ├── app-controller.js   # Main application controller
│   │   ├── color-utils.js      # Color generation utilities
│   │   ├── interval-utils.js   # Interval calculation functions
│   │   └── pattern-detection.js # Scale pattern recognition
│   └── ui/
│       ├── components.js       # UI components and rendering
│       └── audio-controls.js   # Audio control interface
├── README.md               # This file
├── LICENSE                 # MIT License
└── .gitignore             # Git ignore rules
```

## 🎓 Music Theory Coverage

### **Scale Types**
- **Major Scales**: Ionian and all modes
- **Minor Scales**: Natural, harmonic, melodic
- **Pentatonic**: Major and minor pentatonic scales
- **Blues**: Traditional and modern blues scales
- **Exotic**: Hungarian, Japanese, Arabic, and more
- **Synthetic**: Whole tone, diminished, chromatic

### **Chord Types**
- **Triads**: Major, minor, diminished, augmented
- **Seventh Chords**: Major 7, minor 7, dominant 7, half-diminished
- **Extended Chords**: 9th, 11th, 13th chords
- **Altered Chords**: Various alterations and tensions
- **Sus Chords**: Sus2, sus4, and combinations

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Music Theory Community** - For comprehensive scale and chord knowledge
- **Web Audio API** - For enabling real-time audio synthesis
- **Open Source Community** - For inspiration and best practices

## 📞 Support

If you encounter any issues or have questions:

1. **Check the Issues**: Look for existing solutions
2. **Create an Issue**: Report bugs or request features
3. **Discussions**: Ask questions in GitHub Discussions

---

**Made with ❤️ for musicians and music theory enthusiasts**
