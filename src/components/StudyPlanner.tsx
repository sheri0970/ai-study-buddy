import React, { useState } from 'react';
import { StudySchedule, StudyPlanItem, Subject } from '../types';
import { audioEngine } from '../lib/audio';
import { 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Target, 
  Award, 
  Trash2, 
  ChevronRight 
} from 'lucide-react';

interface StudyPlannerProps {
  selectedSubject: Subject;
  schedules: StudySchedule[];
  onCreateSchedule: (schedule: StudySchedule) => void;
  onToggleTaskComplete: (scheduleId: string, dayNumber: number) => void;
  onDeleteSchedule: (scheduleId: string) => void;
}

export const StudyPlanner: React.FC<StudyPlannerProps> = ({
  selectedSubject,
  schedules,
  onCreateSchedule,
  onToggleTaskComplete,
  onDeleteSchedule,
}) => {
  const [examName, setExamName] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [availableHours, setAvailableHours] = useState(2);
  const [masteryLevel, setMasteryLevel] = useState('Beginner');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim()) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examName,
          subject: selectedSubject,
          targetDate: targetDate || 'Next Week',
          availableHoursPerDay: availableHours,
          masteryLevel,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate study roadmap.');
      const data = await res.json();

      const newSchedule: StudySchedule = {
        id: `schedule-${Date.now()}`,
        examName,
        subject: selectedSubject,
        targetDate: targetDate || 'In 7 Days',
        availableHoursPerDay: availableHours,
        masteryLevel,
        createdAt: new Date().toISOString().split('T')[0],
        planItems: (data.planItems || []).map((item: any) => ({
          day: item.day,
          dateTitle: item.dateTitle || `Day ${item.day}`,
          focusTopic: item.focusTopic,
          keyTasks: item.keyTasks || [],
          estimatedMinutes: item.estimatedMinutes || 60,
          completed: false,
        })),
      };

      onCreateSchedule(newSchedule);
      setExamName('');
      setTargetDate('');
      audioEngine.playCompletionChime();
    } catch (err: any) {
      alert(err.message || 'Error generating roadmap');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            AI Exam Study Roadmap Planner
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Build a customized milestone schedule leading up to your midterms or finals
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Create Plan Form */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs h-fit space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600" />
            New Exam Plan
          </h3>

          <form onSubmit={handleGeneratePlan} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Exam / Course Name
              </label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g. AP Calculus Midterm"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Exam Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Daily Time (hrs)
                </label>
                <select
                  value={availableHours}
                  onChange={(e) => setAvailableHours(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium"
                >
                  <option value={1}>1 hour/day</option>
                  <option value={2}>2 hours/day</option>
                  <option value={3}>3 hours/day</option>
                  <option value={4}>4+ hours/day</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mastery Level
                </label>
                <select
                  value={masteryLevel}
                  onChange={(e) => setMasteryLevel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced Review</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              id="generate-plan-btn"
              disabled={isGenerating || !examName.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                'Building Roadmap...'
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Generate AI Roadmap
                </>
              )}
            </button>
          </form>
        </div>

        {/* Schedules Display */}
        <div className="lg:col-span-8 space-y-6">
          {schedules.length > 0 ? (
            schedules.map((schedule) => {
              const completedDays = schedule.planItems.filter((i) => i.completed).length;
              const percentReady = Math.round((completedDays / schedule.planItems.length) * 100);

              return (
                <div
                  key={schedule.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4"
                >
                  {/* Schedule Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">
                          {schedule.examName}
                        </h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                          {schedule.subject}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Exam Date: {schedule.targetDate} • {schedule.availableHoursPerDay} hrs/day
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-extrabold text-indigo-600">
                          {percentReady}% Ready
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {completedDays}/{schedule.planItems.length} Milestones
                        </div>
                      </div>

                      <button
                        id={`delete-schedule-${schedule.id}`}
                        onClick={() => onDeleteSchedule(schedule.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 cursor-pointer"
                        title="Delete schedule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Readiness Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 transition-all duration-500"
                      style={{ width: `${percentReady}%` }}
                    />
                  </div>

                  {/* Day Items List */}
                  <div className="space-y-3 pt-1">
                    {schedule.planItems.map((item) => (
                      <div
                        key={item.day}
                        onClick={() => onToggleTaskComplete(schedule.id, item.day)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          item.completed
                            ? 'bg-emerald-50/50 border-emerald-200 text-slate-700'
                            : 'bg-slate-50/70 border-slate-200 hover:border-indigo-300 text-slate-900'
                        }`}
                      >
                        <button className="mt-0.5 cursor-pointer">
                          {item.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                          )}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-indigo-900">
                              {item.dateTitle}: {item.focusTopic}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {item.estimatedMinutes} mins
                            </span>
                          </div>

                          <ul className="mt-2 space-y-1">
                            {item.keyTasks.map((task, tIdx) => (
                              <li
                                key={tIdx}
                                className={`text-xs flex items-center gap-1.5 ${
                                  item.completed ? 'line-through text-slate-400' : 'text-slate-600'
                                }`}
                              >
                                <span className="w-1 h-1 rounded-full bg-slate-400" />
                                <span>{task}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center text-slate-400 space-y-2">
              <Calendar className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No Study Roadmaps Yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Fill out your exam details on the left to generate an AI study milestone schedule.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
