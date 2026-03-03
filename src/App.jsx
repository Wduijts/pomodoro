import { useState, useEffect, useRef, useCallback } from 'react'


const MODES = {
  focus: { label: 'Focus', duration: 25 * 60, color: '#f97316', glow: '#f9731640' },
  break: { label: 'Break', duration: 1 * 60, color: '#22d3ee', glow: '#22d3ee40' },
}

const RADIUS = 120
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function playChime() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const notes = [523, 659, 784]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = freq
    const start = ctx.currentTime + i * 0.35
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.35, start + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 1.4)
    osc.start(start)
    osc.stop(start + 1.4)
  })
}

export default function App() {
  const [mode, setMode] = useState('focus')
  const [timeLeft, setTimeLeft] = useState(MODES.focus.duration)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef(null)
  const rainRef = useRef(new Audio('/rain.wav'))

  const currentMode = MODES[mode]
  const progress = timeLeft / currentMode.duration
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const seconds = String(timeLeft % 60).padStart(2, '0')
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress)

  const handleComplete = useCallback(() => {
    setIsRunning(false)
    playChime()
  }, [])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            handleComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [isRunning, handleComplete])

  useEffect(() => {
    const audio = rainRef.current
    audio.loop = true
    audio.volume = 0.4

    if (mode === 'break' && isRunning) {
      audio.play()
    } else {
      audio.pause()
      audio.currentTime = 0
    }
  }, [mode, isRunning])

  const switchMode = (newMode) => {
    clearInterval(intervalRef.current)
    setIsRunning(false)
    setMode(newMode)
    setTimeLeft(MODES[newMode].duration)
  }

  const reset = () => {
    clearInterval(intervalRef.current)
    setIsRunning(false)
    setTimeLeft(currentMode.duration)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-10 select-none">

      {/* Mode tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-full p-1">
        {Object.entries(MODES).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`px-6 py-2 rounded-full text-sm font-medium tracking-wide transition-all duration-300 cursor-pointer ${
              mode === key
                ? 'bg-gray-800 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Timer ring */}
      <div className="relative flex items-center justify-center">
        <svg width="300" height="300" className="-rotate-90">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track */}
          <circle
            cx="150" cy="150" r={RADIUS}
            fill="none"
            stroke="#1f2937"
            strokeWidth="6"
          />

          {/* Progress */}
          <circle
            cx="150" cy="150" r={RADIUS}
            fill="none"
            stroke={currentMode.color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            filter="url(#glow)"
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease' }}
          />
        </svg>

        {/* Time display */}
        <div className="absolute flex flex-col items-center gap-2">
          <span className="text-7xl font-extralight text-white tracking-widest tabular-nums">
            {minutes}:{seconds}
          </span>
          <span
            className="text-xs font-semibold uppercase tracking-[0.25em] transition-colors duration-500"
            style={{ color: currentMode.color }}
          >
            {currentMode.label}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-5">
        {/* Reset */}
        <button
          onClick={reset}
          className="w-12 h-12 rounded-full bg-gray-900 text-gray-600 hover:text-gray-300 hover:bg-gray-800 transition-all duration-200 flex items-center justify-center cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>

        {/* Play / Pause */}
        <button
          onClick={() => setIsRunning(r => !r)}
          className="w-20 h-20 rounded-full text-white flex items-center justify-center transition-all duration-300 cursor-pointer"
          style={{
            backgroundColor: currentMode.color,
            boxShadow: `0 0 40px ${currentMode.glow}`,
          }}
        >
          {isRunning ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6 3 20 12 6 21 6 3" />
            </svg>
          )}
        </button>

        {/* Spacer to balance reset button */}
        <div className="w-12 h-12" />
      </div>
    </div>
  )
}
