import React from 'react';
import { Subject, UserStats } from '../types';
import { SUBJECTS as ALL_SUBJECTS } from '../lib/defaultData';
import { 
  GraduationCap, 
  MessageSquareText, 
  Layers, 
  FileText, 
  HelpCircle, 
  Calendar, 
  Compass, 
  Flame, 
  Clock, 
  Award, 
  Headphones, 
  Timer
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedSubject: Subject;
  setSelectedSubject: (subj: Subject) => void;
  stats: UserStats;
  isAmbientPlaying: boolean;
  onToggleAmbient: () => void;
  onOpenPomodoro: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedSubject,
  setSelectedSubject,
  stats,
  isAmbientPlaying,
  onToggleAmbient,
  onOpenPomodoro,
}) => {
  const tabs = [
    { id: 'tutor', label: 'AI Tutor', icon: MessageSquareText },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'notes', label: 'Smart Notes', icon: FileText },
    { id: 'quiz', label: 'Practice Quiz', icon: HelpCircle },
    { id: 'roadmap', label: 'Study Roadmap', icon: Calendar },
    { id: 'explainer', label: 'Concept Explainer', icon: Compass },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 bg-clip-text text-transparent tracking-tight">
                  Study Buddy
                </h1>
                <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-semibold border border-indigo-200/60">
                  AI
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Your intelligent academic companion
              </p>
            </div>
          </div>

          {/* Subject Selector & Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Subject Selector */}
            <div className="flex items-center bg-slate-100/80 rounded-lg p-1 border border-slate-200/80">
              <span className="text-xs font-medium text-slate-500 px-2 hidden md:inline">Subject:</span>
              <select
                id="subject-selector"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value as Subject)}
                className="bg-white text-slate-800 font-medium text-xs sm:text-sm rounded-md px-2.5 py-1 border border-slate-200 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {ALL_SUBJECTS.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>

            {/* Pomodoro Timer Toggle */}
            <button
              id="pomodoro-timer-btn"
              onClick={onOpenPomodoro}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/80 transition-all cursor-pointer"
              title="Open Focus Pomodoro Timer"
            >
              <Timer className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Focus Timer</span>
            </button>

            {/* Ambient Audio Toggle */}
            <button
              id="ambient-noise-btn"
              onClick={onToggleAmbient}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isAmbientPlaying
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700 border-slate-200/80'
              }`}
              title="Toggle Ambient Study Noise"
            >
              <Headphones className={`w-4 h-4 ${isAmbientPlaying ? 'text-emerald-600 animate-pulse' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">
                {isAmbientPlaying ? 'Focus Noise On' : 'Focus Noise'}
              </span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs & Stats Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 pb-3 border-t border-slate-100">
          
          {/* Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Mini Stats Badges */}
          <div className="flex items-center gap-3 text-xs bg-slate-50 border border-slate-200/70 rounded-lg px-3 py-1.5 self-start md:self-auto">
            <div className="flex items-center gap-1 text-amber-600 font-semibold" title="Daily Study Streak">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>{stats.streakDays} Day Streak</span>
            </div>
            <div className="h-3.5 w-px bg-slate-200" />
            <div className="flex items-center gap-1 text-slate-700 font-medium" title="Total Study Time">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>{stats.totalMinutesStudied} mins</span>
            </div>
            <div className="h-3.5 w-px bg-slate-200" />
            <div className="flex items-center gap-1 text-slate-700 font-medium" title="Mastered Cards">
              <Award className="w-3.5 h-3.5 text-emerald-500" />
              <span>{stats.cardsMastered} Mastered</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
