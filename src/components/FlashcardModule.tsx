import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { FlashcardDeck, Flashcard, Subject } from '../types';
import { audioEngine } from '../lib/audio';
import { 
  Plus, 
  RotateCw, 
  Check, 
  Sparkles, 
  Layers, 
  Award, 
  Trash2, 
  Brain, 
  ArrowLeft, 
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface FlashcardModuleProps {
  decks: FlashcardDeck[];
  selectedSubject: Subject;
  onCreateDeck: (deck: FlashcardDeck) => void;
  onDeleteDeck: (deckId: string) => void;
  onUpdateDeckCards: (deckId: string, cards: Flashcard[]) => void;
  onIncrementMasteredCards: (count: number) => void;
}

export const FlashcardModule: React.FC<FlashcardModuleProps> = ({
  decks,
  selectedSubject,
  onCreateDeck,
  onDeleteDeck,
  onUpdateDeckCards,
  onIncrementMasteredCards,
}) => {
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [topicInput, setTopicInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [cardCount, setCardCount] = useState(5);

  const filteredDecks = decks.filter(
    (d) => selectedSubject === 'General' || d.subject === selectedSubject
  );

  const activeDeck = decks.find((d) => d.id === activeDeckId);

  // Generate AI Deck
  const handleGenerateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim() && !notesInput.trim()) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicInput,
          rawNotes: notesInput,
          subject: selectedSubject,
          cardCount,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate flashcards.');
      const data = await res.json();

      const newDeckId = `deck-${Date.now()}`;
      const newDeck: FlashcardDeck = {
        id: newDeckId,
        title: data.title || topicInput || 'AI Generated Deck',
        description: data.description || `Study flashcards for ${selectedSubject}`,
        subject: selectedSubject,
        createdAt: new Date().toISOString().split('T')[0],
        cards: (data.cards || []).map((c: any, idx: number) => ({
          id: `card-${newDeckId}-${idx}`,
          deckId: newDeckId,
          subject: selectedSubject,
          question: c.question,
          answer: c.answer,
          explanation: c.explanation,
          status: 'new',
        })),
      };

      onCreateDeck(newDeck);
      setActiveDeckId(newDeckId);
      setCurrentCardIdx(0);
      setIsFlipped(false);
      setShowCreateModal(false);
      setTopicInput('');
      setNotesInput('');
      audioEngine.playCompletionChime();
    } catch (err: any) {
      alert(err.message || 'Error generating flashcards');
    } finally {
      setIsGenerating(false);
    }
  };

  // Status Toggle
  const handleMarkStatus = (status: 'mastered' | 'learning') => {
    if (!activeDeck) return;

    const updatedCards = [...activeDeck.cards];
    const card = updatedCards[currentCardIdx];
    const wasMastered = card.status === 'mastered';
    card.status = status;

    if (status === 'mastered' && !wasMastered) {
      onIncrementMasteredCards(1);
    }

    onUpdateDeckCards(activeDeck.id, updatedCards);

    // Next Card
    if (currentCardIdx < activeDeck.cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentCardIdx((prev) => prev + 1), 150);
    } else {
      // Finished deck!
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      audioEngine.playCompletionChime();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Top Deck Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600" />
            Flashcard Decks
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Master terms, definitions, and equations through active recall
          </p>
        </div>

        <button
          id="create-deck-modal-btn"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate Deck with AI</span>
        </button>
      </div>

      {/* Active Deck Player View */}
      {activeDeck ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              id="back-to-decks-btn"
              onClick={() => setActiveDeckId(null)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to All Decks
            </button>
            <div className="text-sm font-bold text-slate-800">
              {activeDeck.title}
            </div>
          </div>

          {activeDeck.cards.length > 0 ? (
            <div className="max-w-2xl mx-auto space-y-6">
              
              {/* Progress Indicator */}
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>
                  Card {currentCardIdx + 1} of {activeDeck.cards.length}
                </span>
                <span>
                  {activeDeck.cards.filter((c) => c.status === 'mastered').length} Mastered
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 transition-all duration-300"
                  style={{
                    width: `${((currentCardIdx + 1) / activeDeck.cards.length) * 100}%`,
                  }}
                />
              </div>

              {/* 3D Flip Flashcard */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="perspective-1000 cursor-pointer min-h-[280px]"
              >
                <div
                  className={`relative w-full h-full rounded-2xl border border-slate-200/90 shadow-lg p-8 sm:p-10 flex flex-col justify-between transition-transform duration-500 transform-style-3d ${
                    isFlipped ? 'rotate-y-180 bg-indigo-950 text-white border-indigo-800' : 'bg-white text-slate-900'
                  }`}
                >
                  {/* Card Front / Back Header */}
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-400">
                    <span>{isFlipped ? 'Answer & Explanation' : 'Question'}</span>
                    <RotateCw className="w-4 h-4" />
                  </div>

                  {/* Card Content */}
                  <div className="my-6 text-center">
                    <p className={`text-lg sm:text-xl font-bold leading-relaxed ${isFlipped ? 'text-indigo-100' : 'text-slate-900'}`}>
                      {isFlipped
                        ? activeDeck.cards[currentCardIdx].answer
                        : activeDeck.cards[currentCardIdx].question}
                    </p>

                    {isFlipped && activeDeck.cards[currentCardIdx].explanation && (
                      <p className="mt-4 text-xs text-indigo-200/80 bg-indigo-900/60 p-3 rounded-xl border border-indigo-800/60 max-w-lg mx-auto">
                        <strong>Insight:</strong> {activeDeck.cards[currentCardIdx].explanation}
                      </p>
                    )}
                  </div>

                  {/* Card Flip Hint */}
                  <div className="text-center text-[11px] opacity-60 font-medium">
                    Click card to flip
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center justify-between gap-4">
                <button
                  id="prev-card-btn"
                  disabled={currentCardIdx === 0}
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentCardIdx((prev) => Math.max(0, prev - 1));
                  }}
                  className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 disabled:opacity-40 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3">
                  <button
                    id="mark-review-btn"
                    onClick={() => handleMarkStatus('learning')}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    <RotateCw className="w-4 h-4" /> Review Later
                  </button>

                  <button
                    id="mark-mastered-btn"
                    onClick={() => handleMarkStatus('mastered')}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Mastered!
                  </button>
                </div>

                <button
                  id="next-card-btn"
                  disabled={currentCardIdx === activeDeck.cards.length - 1}
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentCardIdx((prev) => Math.min(activeDeck.cards.length - 1, prev + 1));
                  }}
                  className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 disabled:opacity-40 cursor-pointer"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
              <p className="text-slate-500 text-sm">No cards in this deck yet.</p>
            </div>
          )}
        </div>
      ) : (
        /* Grid of All Available Decks */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDecks.map((deck) => {
            const masteredCount = deck.cards.filter((c) => c.status === 'mastered').length;
            return (
              <div
                key={deck.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                      {deck.subject}
                    </span>
                    <button
                      id={`delete-deck-${deck.id}`}
                      onClick={() => onDeleteDeck(deck.id)}
                      className="p-1 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete deck"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{deck.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {deck.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    {deck.cards.length} Cards • {masteredCount} Mastered
                  </span>

                  <button
                    id={`study-deck-${deck.id}`}
                    onClick={() => {
                      setActiveDeckId(deck.id);
                      setCurrentCardIdx(0);
                      setIsFlipped(false);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Study Deck
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Generate Deck Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 relative">
            
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Generate Flashcard Deck with AI
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Enter a subject topic or paste your lecture notes to auto-build flashcards.
            </p>

            <form onSubmit={handleGenerateDeck} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Topic / Concept Title
                </label>
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="e.g. Organic Chemistry Functional Groups"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Source Lecture Notes / Text (Optional)
                </label>
                <textarea
                  rows={4}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Paste lecture notes or article text here..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Number of Cards
                </label>
                <select
                  value={cardCount}
                  onChange={(e) => setCardCount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                >
                  <option value={4}>4 Cards</option>
                  <option value={6}>6 Cards</option>
                  <option value={8}>8 Cards</option>
                  <option value={10}>10 Cards</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  id="cancel-create-deck-btn"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  id="submit-generate-deck-btn"
                  disabled={isGenerating || (!topicInput.trim() && !notesInput.trim())}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>Generating Deck...</>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Create Deck
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
