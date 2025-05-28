# 🎸 Guitar Tab Player

A modern, web-based Guitar Pro file player with beautiful UI and comprehensive playback controls.

![Guitar Tab Player](https://img.shields.io/badge/Guitar-Tab%20Player-8B4513?style=for-the-badge&logo=music&logoColor=white)
![MIT License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![AlphaTab](https://img.shields.io/badge/AlphaTab-Latest-orange?style=for-the-badge)

## ✨ Features

### 🎵 **File Support**
- **Guitar Pro Files**: Load `.gp3`, `.gp4`, `.gp5`, `.gpx` files
- **Drag & Drop**: Simply drag files onto the interface
- **File Browser**: Traditional file selection

### 🎮 **Playback Controls**
- **Play/Pause/Stop**: Full transport controls
- **Master Volume**: Global volume control
- **Progress Tracking**: Visual playback progress
- **Loop Support**: Repeat sections

### 🎛️ **Track Management**
- **Individual Track Controls**: Solo, mute, and volume per track
- **Track Visibility**: Show/hide specific instruments
- **Real-time Updates**: Instant response to control changes

### 🖼️ **Export Features**
- **PNG Export**: High-quality image export
- **Selection Options**: Export specific sections
- **Multiple Formats**: Various image sizes and qualities

### 🎨 **Modern UI**
- **Beautiful Design**: Wood-grain inspired theme
- **Responsive Layout**: Works on desktop and mobile
- **Smooth Animations**: Polished user experience
- **Clean Interface**: Intuitive controls

## 🚀 Quick Start

### **Option 1: Run Locally**

1. **Clone the repository**
   ```bash
   git clone https://github.com/MikeNZ88/guitar-tab-player.git
   cd guitar-tab-player
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

### **Option 2: Use with Vite (No npm install needed)**

1. **Clone the repository**
   ```bash
   git clone https://github.com/MikeNZ88/guitar-tab-player.git
   cd guitar-tab-player
   ```

2. **Run with npx**
   ```bash
   npx vite --host
   ```

3. **Open in browser**
   ```
   http://localhost:5173
   ```

## 📖 How to Use

### **Loading Files**
1. Click the **"Choose Guitar Pro File"** button
2. Select a `.gp3`, `.gp4`, `.gp5`, or `.gpx` file
3. The tab will automatically load and display

### **Playback**
- **Play**: Click the play button to start playback
- **Pause**: Click pause to temporarily stop
- **Stop**: Click stop to return to the beginning
- **Volume**: Adjust the master volume slider

### **Track Controls**
- **Solo**: Click the solo button to hear only that track
- **Mute**: Click mute to silence a specific track
- **Volume**: Adjust individual track volumes
- **Visibility**: Toggle track display on/off

### **Export**
1. Load a Guitar Pro file
2. Click the **"Export as PNG"** button
3. Choose your export options
4. Download the generated image

## 🛠️ Technical Details

### **Built With**
- **[AlphaTab](https://alphatab.net/)**: Guitar tablature rendering engine
- **[Vite](https://vitejs.dev/)**: Fast build tool and dev server
- **Vanilla JavaScript**: No framework dependencies
- **Modern CSS**: Grid, Flexbox, and CSS Variables

### **Browser Support**
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

### **File Format Support**
- ✅ Guitar Pro 3 (`.gp3`)
- ✅ Guitar Pro 4 (`.gp4`)
- ✅ Guitar Pro 5 (`.gp5`)
- ✅ Guitar Pro X (`.gpx`)

## 📁 Project Structure

```
guitar-tab-player/
├── index.html          # Main application file
├── package.json        # Dependencies and scripts
├── vite.config.js      # Vite configuration
├── public/             # Static assets
│   └── vite.svg       # Vite logo
├── README.md           # This file
├── LICENSE             # MIT License
└── .gitignore         # Git ignore rules
```

## 🔧 Development

### **Scripts**
```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run preview # Preview production build
```

### **Configuration**
The project uses Vite with minimal configuration. See `vite.config.js` for details.

### **Dependencies**
- **AlphaTab**: Loaded via CDN for optimal performance
- **Vite**: Development server and build tool

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[AlphaTab](https://alphatab.net/)** - Excellent guitar tablature rendering
- **[Vite](https://vitejs.dev/)** - Lightning-fast development experience
- **Guitar Pro** - For creating the file format standard

## 📞 Support

If you encounter any issues or have questions:

1. **Check the Issues**: Look for existing solutions
2. **Create an Issue**: Report bugs or request features
3. **Discussions**: Ask questions in GitHub Discussions

---

**Made with ❤️ for guitarists and developers**