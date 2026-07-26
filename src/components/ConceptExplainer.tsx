import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Subject } from '../types';
import { audioEngine } from '../lib/audio';
import { 
  Compass, 
  Sparkles, 
  Search, 
  BookOpen, 
  Lightbulb, 
  Zap, 
  ArrowRight,
  HelpCircle
} from 'lucide-react';

interface ConceptExplainerProps {
  selectedSubject: Subject;
}

export const ConceptExplainer: React.FC<ConceptExplainerProps> = ({
  selectedSubject,
}) => {
  const [concept, setConcept] = useState('');
  const [level, setLevel] = useState('Standard');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  const popularConceptsBySubject: Record<string, string[]> = {
    Mathematics: ['Eigenvalues & Eigenvectors', 'Taylor Series Expansion', 'L\'Hôpital\'s Rule', 'Matrix Multiplication'],
    'Computer Science': ['Recursion & Dynamic Programming', 'Hash Tables & Collisions', 'Big-O Notation', 'TCP/IP vs UDP'],
    Biology: ['Cellular Respiration & Krebs Cycle', 'DNA Replication Fork', 'Mendelian Genetics', 'CRISPR-Cas9'],
    Physics: ['Quantum Superposition', 'Bernoulli\'s Principle', 'Special Relativity', 'Electromagnetic Induction'],
    Chemistry: ['Le Chatelier\'s Principle', 'Acid-Base Titration', 'Electronegativity', 'Hybridization'],
    History: ['Industrial Revolution Impact', 'Cold War Containment Policy', 'Silk Road Trade Network'],
    General: ['Thermodynamics First Law', 'Inflation & Interest Rates', 'Cognitive Dissonance'],
  };

  const currentSuggestions = popularConceptsBySubject[selectedSubject] || popularConceptsBySubject['General'];

  const handleExplain = async (conceptToExplain?: string) => {
    const term = conceptToExplain || concept;
    if (!term.trim()) return;

    setConcept(term);
    setIsExplaining(true);
    try {
      const res = await fetch('/api/explain-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: term,
          subject: selectedSubject,
          level,
        }),
      });

      if (!res.ok) throw new Error('Failed to explain concept.');
      const data = await res.json();

      setExplanation(data.explanation || 'No explanation generated.');
      audioEngine.playCompletionChime();
    } catch (err: any) {
      alert(err.message || 'Error explaining concept');
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 rounded-2xl text-white shadow-md space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
            <Compass className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">AI Concept Explainer</h2>
            <p className="text-xs text-indigo-200 mt-0.5">
              Demystify any complex theory, formula, or topic with intuitive analogies
            </p>
          </div>
        </div>

        {/* Search Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExplain();
          }}
          className="flex flex-col sm:flex-row items-center gap-2 pt-2"
        >
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="concept-search-input"
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder={`Search any concept in ${selectedSubject} (e.g. ${currentSuggestions[0]})...`}
              className="w-full bg-white text-slate-900 placeholder-slate-400 text-sm rounded-xl pl-11 pr-4 py-3 border-0 focus:ring-2 focus:ring-indigo-400 shadow-inner"
            />
          </div>

          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="bg-white/10 text-white font-medium text-xs rounded-xl px-3 py-3 border border-white/20 cursor-pointer"
          >
            <option value="Simple" className="text-slate-900">ELI5 Simple</option>
            <option value="Standard" className="text-slate-900">Standard High School/College</option>
            <option value="Advanced" className="text-slate-900">Advanced Academic</option>
          </select>

          <button
            type="submit"
            id="explain-concept-btn"
            disabled={isExplaining || !concept.trim()}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            {isExplaining ? (
              <span>Explaining...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Explain Concept
              </>
            )}
          </button>
        </form>

        {/* Popular Topic Pills */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-indigo-300 font-semibold text-[11px]">Popular in {selectedSubject}:</span>
          {currentSuggestions.map((item, idx) => (
            <button
              key={idx}
              id={`concept-pill-${idx}`}
              onClick={() => handleExplain(item)}
              className="bg-white/10 hover:bg-white/20 text-indigo-100 px-2.5 py-1 rounded-lg border border-white/10 text-[11px] font-medium transition-colors cursor-pointer"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Explanation Results Container */}
      {explanation ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-indigo-600" />
              Concept Analysis: <span className="text-indigo-600">{concept}</span>
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
              {level} Level
            </span>
          </div>

          <div className="text-sm text-slate-800 leading-relaxed prose prose-slate max-w-none">
            <ReactMarkdown>{explanation}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center text-slate-400 space-y-2">
          <Compass className="w-12 h-12 mx-auto text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">Enter a concept above to get a deep breakdown</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Get instant definitions, analogies, and practice problems to master difficult material quickly.
          </p>
        </div>
      )}

    </div>
  );
};
