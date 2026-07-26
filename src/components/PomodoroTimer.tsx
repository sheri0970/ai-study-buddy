import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Bell, CheckCircle2 } from 'lucide-react';
import { audioEngine } from '../lib/audio';

interface PomodoroTimerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudyMinutes: (mins: number) => void;
}

type Mode = 'focus' | 'shortBreak' | 'longBreak';

const MODE_CONFIGS: Record<Mode, { name: string; minutes: number; color: string }> = {
  focus: { name: 'Focus Study', minutes: 25, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  shortBreak: { name: 'Short Break', minutes: 5, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  longBreak: { name: 'Long Break', minutes: 15, color: 'text-violet-600 bg-violet-50 border-violet-200' },
};

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  isOpen,
  onClose,
  onAddStudyMinutes,
}) => {
  const [mode, setMode] = useState<Mode>('focus');
  const [timeLeft, setTimeLeft] = useState(MODE_CONFIGS['focus'].minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  useEffect(() => {
    let timer: any = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      audioEngine.playTimerBell();
      if (mode === 'focus') {
        setCompletedSessions((prev) => prev + 1);
        onAddStudyMinutes(MODE_CONFIGS['focus'].minutes);
      }
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, mode, onAddStudyMinutes]);

  if (!isOpen) return null;

  const totalSeconds = MODE_CONFIGS[mode].minutes * 60;
  const progressPercent = Math.round(((totalSeconds - timeLeft) / totalSeconds) * 100);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(MODE_CONFIGS[newMode].minutes * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(MODE_CONFIGS[mode].minutes * 60);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 relative">
        
        {/* Close Button */}
        <button
          id="close-pomodoro-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Focus Pomodoro Timer</h2>
          <p className="text-xs text-slate-500 mt-1">Boost study endurance & prevent burnout</p>
        </div>

        {/* Mode Selector */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-8">
          {(Object.keys(MODE_CONFIGS) as Mode[]).map((m) => (
            <button
              key={m}
              id={`pomodoro-mode-${m}`}
              onClick={() => handleModeChange(m)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === m
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {MODE_CONFIGS[m].name}
            </button>
          ))}
        </div>

        {/* Timer Display Circle */}
        <div className="flex flex-col items-center justify-center my-4">
          <div className="relative w-56 h-56 flex items-center justify-center">
            {/* SVG Progress Ring */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="112"
                cy="112"
                r="96"
                stroke="currentColor"
                strokeWidth="10"
                className="text-slate-100"
                fill="transparent"
              />
              <circle
                cx="112"
                cy="112"
                r="96"
                stroke="currentColor"
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 96}
                strokeDashoffset={2 * Math.PI * 96 * (1 - progressPercent / 100)}
                strokeLinecap="round"
                className="text-indigo-600 transition-all duration-1000 ease-linear"
                fill="transparent"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-5xl font-extrabold text-slate-900 tracking-tight font-mono">
                {formatTime(timeLeft)}
              </span>
              <span className={`text-xs font-semibold mt-2 px-2.5 py-0.5 rounded-full border ${MODE_CONFIGS[mode].color}`}>
                {MODE_CONFIGS[mode].name}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            id="reset-pomodoro-btn"
            onClick={handleReset}
            className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            id="toggle-pomodoro-btn"
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-white font-bold shadow-md transition-all cursor-pointer ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" /> Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" /> Start Focus
              </>
            )}
          </button>
        </div>

        {/* Completed Count */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Completed Sessions Today:
          </span>
          <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-full">
            {completedSessions} {completedSessions === 1 ? 'session' : 'sessions'}
          </span>
        </div>

      </div>
    </div>
  );
};
