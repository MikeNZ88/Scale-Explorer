import { useState, useRef, useEffect } from 'react'
import { AlphaTabApi, Settings } from '@coderline/alphatab'
import './App.css'

function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [songInfo, setSongInfo] = useState(null)
  const [alphaTabReady, setAlphaTabReady] = useState(false)
  
  const alphaTabRef = useRef(null)
  const apiRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    // Initialize AlphaTab with absolute minimal settings
    if (alphaTabRef.current && !apiRef.current) {
      try {
        console.log('Initializing AlphaTab with minimal setup...')
        
        // Create the most basic settings possible
        const settings = new Settings()
        settings.core.engine = 'html5'
        settings.core.logLevel = 1
        
        const api = new AlphaTabApi(alphaTabRef.current, settings)
        apiRef.current = api

        // Basic event listeners
        api.scoreLoaded.on((score) => {
          console.log('Score loaded:', score.title)
          setIsLoading(false)
          setError('')
          setSongInfo({
            title: score.title || 'Unknown',
            artist: score.artist || 'Unknown'
          })
        })

        api.renderFinished.on(() => {
          console.log('Render finished')
          setIsLoading(false)
        })

        api.error.on((error) => {
          console.error('AlphaTab error:', error)
          setIsLoading(false)
          setError(`Error: ${error.message || error}`)
        })

        setAlphaTabReady(true)
        console.log('AlphaTab initialized successfully')

      } catch (err) {
        console.error('Failed to initialize AlphaTab:', err)
        setError(`Failed to initialize: ${err.message}`)
      }
    }
  }, [])

  const loadBasicAlphaTex = () => {
    if (apiRef.current) {
      try {
        console.log('Loading basic AlphaTex...')
        setIsLoading(true)
        setError('')
        setSongInfo(null)
        
        // Try the most basic AlphaTex possible
        const tex = `\\title "Test"
.
0.0`
        
        console.log('TEX content:', tex)
        apiRef.current.tex(tex)
        
      } catch (err) {
        console.error('Error loading AlphaTex:', err)
        setIsLoading(false)
        setError(`AlphaTex error: ${err.message}`)
      }
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file && apiRef.current) {
      console.log('Loading file:', file.name)
      setIsLoading(true)
      setError('')
      setSongInfo(null)
      
      try {
        apiRef.current.load(file)
      } catch (err) {
        console.error('Error loading file:', err)
        setIsLoading(false)
        setError(`File error: ${err.message}`)
      }
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🎸 Minimal AlphaTab Test</h1>
        <p>Testing basic AlphaTab functionality</p>
      </header>

      <div className="controls">
        <div className="file-upload">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".gp3,.gp4,.gp5,.gpx"
            style={{ display: 'none' }}
          />
          <button
            className="file-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={!alphaTabReady}
          >
            📁 Load File
          </button>
          <button
            className="btn"
            onClick={loadBasicAlphaTex}
            disabled={!alphaTabReady}
          >
            📝 Test Basic AlphaTex
          </button>
        </div>
      </div>

      {!alphaTabReady && (
        <div className="library-status">
          <strong>Initializing AlphaTab...</strong>
        </div>
      )}

      {error && (
        <div className="error-message visible">
          {error}
        </div>
      )}

      {songInfo && (
        <div className="song-info visible">
          <div>Title: {songInfo.title}</div>
          <div>Artist: {songInfo.artist}</div>
        </div>
      )}

      <div className="alphatab-container">
        {isLoading && (
          <div className="loading">
            <div className="spinner"></div>
            <span>Loading...</span>
          </div>
        )}
        <div ref={alphaTabRef} className="alphatab"></div>
      </div>
    </div>
  )
}

export default App