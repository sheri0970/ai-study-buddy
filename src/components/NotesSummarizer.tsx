import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { NoteSummary, Subject } from '../types';
import { audioEngine } from '../lib/audio';
import { 
  FileText, 
  Sparkles, 
  BookOpen, 
  Layers, 
  HelpCircle, 
  Check, 
  Copy, 
  ListChecks, 
  KeyRound, 
  Zap 
} from 'lucide-react';

interface NotesSummarizerProps {
  selectedSubject: Subject;
  onGenerateFlashcardsFromNotes: (title: string, rawNotes: string) => void;
  onGenerateQuizFromNotes: (title: string, rawNotes: string) => void;
}

export const NotesSummarizer: React.FC<NotesSummarizerProps> = ({
  selectedSubject,
  onGenerateFlashcardsFromNotes,
  onGenerateQuizFromNotes,
}) => {
  const [noteTitle, setNoteTitle] = useState('');
  const [rawNotes, setRawNotes] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<NoteSummary | null>(null);
  const [copied, setCopied] = useState(false);

  // Sample notes loader for instant preview
  const handleLoadSampleNotes = () => {
    setNoteTitle('Photosynthesis & Light Reactions');
    setRawNotes(
      `Photosynthesis is the process by which green plants, algae, and some bacteria convert light energy into chemical energy stored in glucose. It takes place in the chloroplasts, specifically within the thylakoid membranes for light-dependent reactions and the stroma for the Calvin cycle (light-independent reactions).

Overall Equation: 6CO2 + 6H2O + Light Energy -> C6H12O6 + 6O2

Light-dependent reactions require sunlight and water. Water molecules are split through photolysis, releasing O2 as a byproduct, and producing ATP and NADPH. These energy carriers power the Calvin cycle in the stroma.

The Calvin cycle uses NADPH and ATP to fix atmospheric CO2 into G3P, a 3-carbon sugar precursor to glucose. The key enzyme responsible for carbon fixation is RuBisCO, which is considered the most abundant enzyme on Earth.`
    );
  };

  const handleSummarize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawNotes.trim()) return;

    setIsSummarizing(true);
    try {
      const res = await fetch('/api/summarize-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawNotes,
          subject: selectedSubject,
          noteTitle: noteTitle || 'Lecture Notes',
        }),
      });

      if (!res.ok) throw new Error('Failed to summarize notes.');
      const data = await res.json();

      const newSummary: NoteSummary = {
        id: `summary-${Date.now()}`,
        title: noteTitle || 'Lecture Notes Summary',
        subject: selectedSubject,
        rawNotes,
        summaryBullets: data.summaryBullets || [],
        keyTerms: data.keyTerms || [],
        cheatSheet: data.cheatSheet || '',
        createdAt: new Date().toISOString().split('T')[0],
      };

      setSummary(newSummary);
      audioEngine.playCompletionChime();
    } catch (err: any) {
      alert(err.message || 'Error processing notes');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopyCheatSheet = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary.cheatSheet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Smart Notes & Cheat-Sheet Generator
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Turn long lecture slides, articles, or chapters into structured bullet points & key terms
          </p>
        </div>

        <button
          id="load-sample-notes-btn"
          onClick={handleLoadSampleNotes}
          className="text-xs font-semibold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          Load Sample Notes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Form Column */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs h-fit space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Input Raw Notes
          </h3>

          <form onSubmit={handleSummarize} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Note Title / Subject Topic
              </label>
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="e.g. Bio Chapter 4 Photosynthesis"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Paste Text / Lecture Transcript
              </label>
              <textarea
                rows={10}
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                placeholder="Paste lecture text, textbook paragraphs, or class notes..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              id="summarize-notes-btn"
              disabled={isSummarizing || !rawNotes.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isSummarizing ? (
                <span>Analyzing Notes...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Summarize & Build Guide
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Summary Column */}
        <div className="lg:col-span-7">
          {summary ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6 animate-in fade-in">
              
              {/* Actions Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-base">
                  {summary.title}
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    id="create-cards-from-notes-btn"
                    onClick={() => onGenerateFlashcardsFromNotes(summary.title, summary.rawNotes)}
                    className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200/60 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Make Flashcards</span>
                  </button>

                  <button
                    id="create-quiz-from-notes-btn"
                    onClick={() => onGenerateQuizFromNotes(summary.title, summary.rawNotes)}
                    className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200/60 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Make Quiz</span>
                  </button>
                </div>
              </div>

              {/* Key Bullet Summary */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-indigo-600">
                  <ListChecks className="w-4 h-4" />
                  Key Summary Takeaways
                </h4>
                <ul className="space-y-2">
                  {summary.summaryBullets.map((bullet, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Vocabulary Terms */}
              {summary.keyTerms.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-violet-600">
                    <KeyRound className="w-4 h-4" />
                    Vocabulary & Key Terms
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {summary.keyTerms.map((item, idx) => (
                      <div key={idx} className="p-3 bg-violet-50/50 rounded-xl border border-violet-100">
                        <span className="font-bold text-xs text-violet-950 block">
                          {item.term}
                        </span>
                        <span className="text-[11px] text-slate-600 mt-0.5 block leading-snug">
                          {item.definition}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Exam Cheat Sheet */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-amber-600">
                    <Zap className="w-4 h-4" />
                    Exam Quick Cheat-Sheet
                  </h4>
                  <button
                    id="copy-cheatsheet-btn"
                    onClick={handleCopyCheatSheet}
                    className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Sheet'}</span>
                  </button>
                </div>

                <div className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono leading-relaxed overflow-x-auto">
                  <ReactMarkdown>{summary.cheatSheet}</ReactMarkdown>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center text-slate-400 space-y-2">
              <FileText className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No Summary Generated Yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Paste your notes on the left and click "Summarize & Build Guide" to auto-extract key facts and cheat-sheets.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
