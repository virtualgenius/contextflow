import React, { useState, useEffect, useCallback } from 'react'
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react'

const PHASES = [
  { name: 'Chaotic Exploration', minutes: 10, color: '#ff9800' },
  { name: 'Enforce Timeline', minutes: 5, color: '#42a5f5' },
  { name: 'Identify Aggregates', minutes: 10, color: '#ffeb3b' },
  { name: 'Identify Bounded Contexts', minutes: 5, color: '#ce93d8' },
  { name: 'Review & Refine', minutes: 5, color: '#10b981' },
]

export function ESWorkshopTimer() {
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(PHASES[0].minutes * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isStarted, setIsStarted] = useState(false)

  const currentPhase = PHASES[phaseIndex]

  useEffect(() => {
    if (!isRunning) return
    if (secondsLeft <= 0) {
      setIsRunning(false)
      return
    }
    const timer = setInterval(() => {
      setSecondsLeft((s) => s - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [isRunning, secondsLeft])

  const nextPhase = useCallback(() => {
    const next = (phaseIndex + 1) % PHASES.length
    setPhaseIndex(next)
    setSecondsLeft(PHASES[next].minutes * 60)
    setIsRunning(false)
  }, [phaseIndex])

  const resetTimer = useCallback(() => {
    setPhaseIndex(0)
    setSecondsLeft(PHASES[0].minutes * 60)
    setIsRunning(false)
    setIsStarted(false)
  }, [])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60

  if (!isStarted) {
    return (
      <button
        onClick={() => {
          setIsStarted(true)
          setIsRunning(true)
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
      >
        <Play size={12} />
        Start Workshop
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {/* Phase indicator */}
      <div
        className="px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider"
        style={{
          backgroundColor: currentPhase.color + '30',
          color: currentPhase.color,
          borderLeft: `3px solid ${currentPhase.color}`,
        }}
      >
        {currentPhase.name}
      </div>

      {/* Timer */}
      <div
        className={`text-sm font-mono font-bold ${secondsLeft <= 60 ? 'text-red-500 animate-pulse' : 'text-slate-700 dark:text-slate-200'}`}
      >
        {minutes}:{seconds.toString().padStart(2, '0')}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-500"
        >
          {isRunning ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          onClick={nextPhase}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-500"
        >
          <SkipForward size={14} />
        </button>
        <button
          onClick={resetTimer}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-500"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Phase dots */}
      <div className="flex items-center gap-1">
        {PHASES.map((p, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor:
                i === phaseIndex ? p.color : i < phaseIndex ? p.color + '60' : '#d1d5db',
            }}
          />
        ))}
      </div>
    </div>
  )
}
