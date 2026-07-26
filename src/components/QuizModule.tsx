import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { QuizSession, Subject } from '../types';
import { audioEngine } from '../lib/audio';
import { 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Lightbulb, 
  RotateCcw, 
  ArrowRight, 
  Trophy, 
  BookOpen 
} from 'lucide-react';

interface QuizModuleProps {
  quizzes: QuizSession[];
  selectedSubject: Subject;
  onCreateQuiz: (quiz: QuizSession) => void;
  onCompleteQuiz: (quizId: string, score: number) => void;
}

export const QuizModule: React.FC<QuizModuleProps> = ({
  quizzes,
  selectedSubject,
  onCreateQuiz,
  onCompleteQuiz,
}) => {
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [showHint, setShowHint] = useState<Record<number, boolean>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [isFinished, setIsFinished] = useState(false);

  // Generator Modal State
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [topicInput, setTopicInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredQuizzes = quizzes.filter(
    (q) => selectedSubject === 'General' || q.subject === selectedSubject
  );

  const activeQuiz = quizzes.find((q) => q.id === activeQuizId);

  // AI Quiz Generation
  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim() && !notesInput.trim()) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicInput,
          rawNotes: notesInput,
          subject: selectedSubject,
          difficulty,
          questionCount,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate quiz.');
      const data = await res.json();

      const newQuizId = `quiz-${Date.now()}`;
      const newQuiz: QuizSession = {
        id: newQuizId,
        title: data.quizTitle || topicInput || 'Practice Quiz',
        subject: selectedSubject,
        difficulty,
        completed: false,
        userAnswers: {},
        createdAt: new Date().toISOString().split('T')[0],
        questions: (data.questions || []).map((q: any, idx: number) => ({
          id: `q-${newQuizId}-${idx}`,
          question: q.question,
          options: q.options || [],
          correctAnswerIndex: q.correctAnswerIndex ?? 0,
          explanation: q.explanation,
          hint: q.hint,
        })),
      };

      onCreateQuiz(newQuiz);
      setActiveQuizId(newQuizId);
      setCurrentQIdx(0);
      setSelectedOptions({});
      setShowHint({});
      setShowExplanation({});
      setIsFinished(false);
      setShowGeneratorModal(false);
      setTopicInput('');
      setNotesInput('');
      audioEngine.playCompletionChime();
    } catch (err: any) {
      alert(err.message || 'Error generating practice quiz');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (qIdx: number, optionIdx: number) => {
    if (showExplanation[qIdx]) return; // Already checked
    setSelectedOptions((prev) => ({ ...prev, [qIdx]: optionIdx }));
  };

  const handleCheckAnswer = (qIdx: number) => {
    setShowExplanation((prev) => ({ ...prev, [qIdx]: true }));
  };

  const handleFinishQuiz = () => {
    if (!activeQuiz) return;

    let correctCount = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (selectedOptions[idx] === q.correctAnswerIndex) {
        correctCount += 1;
      }
    });

    const scorePercent = Math.round((correctCount / activeQuiz.questions.length) * 100);
    setIsFinished(true);
    onCompleteQuiz(activeQuiz.id, scorePercent);

    if (scorePercent >= 70) {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    }
    audioEngine.playCompletionChime();
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-indigo-600" />
            Practice Quizzes & Knowledge Check
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Test your understanding with instant feedback and answer explanations
          </p>
        </div>

        <button
          id="open-quiz-generator-btn"
          onClick={() => setShowGeneratorModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate Quiz with AI</span>
        </button>
      </div>

      {/* Active Quiz Player */}
      {activeQuiz ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <button
              id="exit-quiz-btn"
              onClick={() => setActiveQuizId(null)}
              className="text-xs font-semibold text-slate-500 hover:text-indigo-600 cursor-pointer"
            >
              ← Exit Quiz
            </button>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              {activeQuiz.title} ({activeQuiz.difficulty})
            </span>
          </div>

          {!isFinished ? (
            <div className="space-y-6 max-w-2xl mx-auto">
              
              {/* Question Navigation Header */}
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>
                  Question {currentQIdx + 1} of {activeQuiz.questions.length}
                </span>
                {activeQuiz.questions[currentQIdx].hint && (
                  <button
                    id="toggle-hint-btn"
                    onClick={() => setShowHint((prev) => ({ ...prev, [currentQIdx]: !prev[currentQIdx] }))}
                    className="flex items-center gap-1 text-amber-600 hover:text-amber-700 font-semibold cursor-pointer"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span>{showHint[currentQIdx] ? 'Hide Hint' : 'Show Hint'}</span>
                  </button>
                )}
              </div>

              {/* Hint Box */}
              {showHint[currentQIdx] && activeQuiz.questions[currentQIdx].hint && (
                <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-800 animate-in fade-in">
                  <strong>Hint:</strong> {activeQuiz.questions[currentQIdx].hint}
                </div>
              )}

              {/* Question Prompt */}
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {activeQuiz.questions[currentQIdx].question}
              </h3>

              {/* Options */}
              <div className="space-y-2.5">
                {activeQuiz.questions[currentQIdx].options.map((opt, optIdx) => {
                  const isSelected = selectedOptions[currentQIdx] === optIdx;
                  const isChecked = showExplanation[currentQIdx];
                  const isCorrect = optIdx === activeQuiz.questions[currentQIdx].correctAnswerIndex;

                  let optionStyle = 'border-slate-200 hover:border-indigo-300 bg-slate-50/50 hover:bg-slate-50 text-slate-800';
                  if (isSelected) {
                    optionStyle = 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-semibold ring-2 ring-indigo-500/20';
                  }

                  if (isChecked) {
                    if (isCorrect) {
                      optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold';
                    } else if (isSelected && !isCorrect) {
                      optionStyle = 'border-rose-500 bg-rose-50 text-rose-950 font-semibold';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      id={`quiz-opt-${currentQIdx}-${optIdx}`}
                      onClick={() => handleSelectOption(currentQIdx, optIdx)}
                      className={`w-full p-4 rounded-xl border text-left text-sm transition-all flex items-center justify-between cursor-pointer ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>

                      {isChecked && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />
                      )}
                      {isChecked && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Check Answer Button / Explanation Box */}
              {selectedOptions[currentQIdx] !== undefined && !showExplanation[currentQIdx] && (
                <button
                  id={`check-answer-btn-${currentQIdx}`}
                  onClick={() => handleCheckAnswer(currentQIdx)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Check Answer
                </button>
              )}

              {showExplanation[currentQIdx] && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 animate-in fade-in">
                  <div className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    Explanation:
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {activeQuiz.questions[currentQIdx].explanation}
                  </p>
                </div>
              )}

              {/* Question Footer Nav */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  id="quiz-prev-q-btn"
                  disabled={currentQIdx === 0}
                  onClick={() => setCurrentQIdx((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>

                {currentQIdx < activeQuiz.questions.length - 1 ? (
                  <button
                    id="quiz-next-q-btn"
                    onClick={() => setCurrentQIdx((prev) => Math.min(activeQuiz.questions.length - 1, prev + 1))}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Next Question →
                  </button>
                ) : (
                  <button
                    id="quiz-finish-btn"
                    onClick={handleFinishQuiz}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    Finish & Grade Quiz
                  </button>
                )}
              </div>

            </div>
          ) : (
            /* Quiz Results Summary */
            <div className="text-center py-8 space-y-6 max-w-md mx-auto">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-xs">
                <Trophy className="w-10 h-10 text-indigo-600" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-900">Quiz Completed!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Great effort testing your knowledge on {activeQuiz.title}
                </p>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-4xl font-extrabold text-indigo-600">
                  {Math.round(
                    (activeQuiz.questions.filter((q, idx) => selectedOptions[idx] === q.correctAnswerIndex).length /
                      activeQuiz.questions.length) *
                      100
                  )}%
                </div>
                <div className="text-xs text-slate-600 font-medium mt-1">
                  {activeQuiz.questions.filter((q, idx) => selectedOptions[idx] === q.correctAnswerIndex).length} out of {activeQuiz.questions.length} correct
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  id="retry-quiz-btn"
                  onClick={() => {
                    setSelectedOptions({});
                    setShowExplanation({});
                    setShowHint({});
                    setCurrentQIdx(0);
                    setIsFinished(false);
                  }}
                  className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" /> Retake Quiz
                </button>

                <button
                  id="quiz-done-btn"
                  onClick={() => setActiveQuizId(null)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* List of Quizzes */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                    {quiz.subject}
                  </span>
                  <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                    {quiz.difficulty}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{quiz.title}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {quiz.questions.length} Multiple choice questions
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {quiz.score !== undefined ? `Last Score: ${quiz.score}%` : 'Not completed yet'}
                </span>

                <button
                  id={`start-quiz-${quiz.id}`}
                  onClick={() => {
                    setActiveQuizId(quiz.id);
                    setCurrentQIdx(0);
                    setSelectedOptions({});
                    setShowExplanation({});
                    setShowHint({});
                    setIsFinished(false);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Start Quiz
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generator Modal */}
      {showGeneratorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 relative">
            
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Generate Practice Quiz with AI
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Create a custom multiple-choice test on any academic topic.
            </p>

            <form onSubmit={handleGenerateQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Topic / Exam Title
                </label>
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="e.g. World War II Turning Points"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Source Lecture Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Paste lecture notes or chapter summary..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Questions Count
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={8}>8 Questions</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  id="cancel-quiz-gen-btn"
                  onClick={() => setShowGeneratorModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  id="submit-quiz-gen-btn"
                  disabled={isGenerating || (!topicInput.trim() && !notesInput.trim())}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
                >
                  {isGenerating ? 'Generating Quiz...' : 'Create Quiz'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
