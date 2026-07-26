import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PomodoroTimer } from './components/PomodoroTimer';
import { TutorChat } from './components/TutorChat';
import { FlashcardModule } from './components/FlashcardModule';
import { QuizModule } from './components/QuizModule';
import { NotesSummarizer } from './components/NotesSummarizer';
import { StudyPlanner } from './components/StudyPlanner';
import { ConceptExplainer } from './components/ConceptExplainer';

import { 
  Subject, 
  ChatMessage, 
  FlashcardDeck, 
  QuizSession, 
  StudySchedule, 
  UserStats, 
  TutorPersonaId,
  Flashcard 
} from './types';
import { INITIAL_STATS, SAMPLE_DECKS, SAMPLE_QUIZZES } from './lib/defaultData';
import { audioEngine } from './lib/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState('tutor');
  const [selectedSubject, setSelectedSubject] = useState<Subject>('General');

  // Local Storage Persistent State
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('study_buddy_stats');
    return saved ? JSON.parse(saved) : INITIAL_STATS;
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('study_buddy_chat');
    return saved ? JSON.parse(saved) : [];
  });

  const [flashcardDecks, setFlashcardDecks] = useState<FlashcardDeck[]>(() => {
    const saved = localStorage.getItem('study_buddy_decks');
    return saved ? JSON.parse(saved) : SAMPLE_DECKS;
  });

  const [quizzes, setQuizzes] = useState<QuizSession[]>(() => {
    const saved = localStorage.getItem('study_buddy_quizzes');
    return saved ? JSON.parse(saved) : SAMPLE_QUIZZES;
  });

  const [schedules, setSchedules] = useState<StudySchedule[]>(() => {
    const saved = localStorage.getItem('study_buddy_schedules');
    return saved ? JSON.parse(saved) : [];
  });

  // UI state
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('study_buddy_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('study_buddy_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem('study_buddy_decks', JSON.stringify(flashcardDecks));
  }, [flashcardDecks]);

  useEffect(() => {
    localStorage.setItem('study_buddy_quizzes', JSON.stringify(quizzes));
  }, [quizzes]);

  useEffect(() => {
    localStorage.setItem('study_buddy_schedules', JSON.stringify(schedules));
  }, [schedules]);

  // Ambient Noise Toggle
  const handleToggleAmbient = () => {
    const nextState = !isAmbientPlaying;
    setIsAmbientPlaying(nextState);
    audioEngine.toggleAmbientNoise(nextState);
  };

  // Add Study Minutes
  const handleAddStudyMinutes = (mins: number) => {
    setStats((prev) => ({
      ...prev,
      totalMinutesStudied: prev.totalMinutesStudied + mins,
    }));
  };

  // Increment Mastered Cards
  const handleIncrementMasteredCards = (count: number) => {
    setStats((prev) => ({
      ...prev,
      cardsMastered: prev.cardsMastered + count,
    }));
  };

  // Chat Send Handler
  const handleSendMessage = async (text: string, imageBase64?: string, personaId?: TutorPersonaId) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject: selectedSubject,
      imageAttachment: imageBase64,
    };

    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory,
          subject: selectedSubject,
          persona: personaId || 'socratic',
          imageBase64,
        }),
      });

      if (!res.ok) throw new Error('Failed to reach AI Tutor.');
      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply || "I'm here to help you study!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        subject: selectedSubject,
        suggestedFollowups: data.suggestedFollowups || [],
      };

      setChatMessages([...newHistory, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `⚠️ Error: ${err.message || 'Trouble connecting to tutor service. Please try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages([...newHistory, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Flashcard Deck Handlers
  const handleCreateDeck = (deck: FlashcardDeck) => {
    setFlashcardDecks((prev) => [deck, ...prev]);
  };

  const handleDeleteDeck = (deckId: string) => {
    setFlashcardDecks((prev) => prev.filter((d) => d.id !== deckId));
  };

  const handleUpdateDeckCards = (deckId: string, cards: Flashcard[]) => {
    setFlashcardDecks((prev) =>
      prev.map((d) => (d.id === deckId ? { ...d, cards } : d))
    );
  };

  // Convert Note -> Flashcard Deck
  const handleGenerateFlashcardsFromNotes = (title: string, rawNotes: string) => {
    setActiveTab('flashcards');
  };

  // Convert Note -> Quiz
  const handleGenerateQuizFromNotes = (title: string, rawNotes: string) => {
    setActiveTab('quiz');
  };

  // Quiz Handlers
  const handleCreateQuiz = (quiz: QuizSession) => {
    setQuizzes((prev) => [quiz, ...prev]);
  };

  const handleCompleteQuiz = (quizId: string, score: number) => {
    setQuizzes((prev) =>
      prev.map((q) => (q.id === quizId ? { ...q, completed: true, score } : q))
    );
    setStats((prev) => {
      const newTotalQuizzes = prev.quizzesTaken + 1;
      const newAvgScore = Math.round(
        (prev.averageQuizScore * prev.quizzesTaken + score) / newTotalQuizzes
      );
      return {
        ...prev,
        quizzesTaken: newTotalQuizzes,
        averageQuizScore: newAvgScore,
      };
    });
  };

  // Schedule Handlers
  const handleCreateSchedule = (schedule: StudySchedule) => {
    setSchedules((prev) => [schedule, ...prev]);
  };

  const handleToggleScheduleTask = (scheduleId: string, dayNumber: number) => {
    setSchedules((prev) =>
      prev.map((sch) => {
        if (sch.id !== scheduleId) return sch;
        const updatedItems = sch.planItems.map((item) =>
          item.day === dayNumber ? { ...item, completed: !item.completed } : item
        );
        return { ...sch, planItems: updatedItems };
      })
    );
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedSubject={selectedSubject}
        setSelectedSubject={setSelectedSubject}
        stats={stats}
        isAmbientPlaying={isAmbientPlaying}
        onToggleAmbient={handleToggleAmbient}
        onOpenPomodoro={() => setIsPomodoroOpen(true)}
      />

      {/* Main Study Content Area */}
      <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {activeTab === 'tutor' && (
          <TutorChat
            selectedSubject={selectedSubject}
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isLoading={isChatLoading}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardModule
            decks={flashcardDecks}
            selectedSubject={selectedSubject}
            onCreateDeck={handleCreateDeck}
            onDeleteDeck={handleDeleteDeck}
            onUpdateDeckCards={handleUpdateDeckCards}
            onIncrementMasteredCards={handleIncrementMasteredCards}
          />
        )}

        {activeTab === 'notes' && (
          <NotesSummarizer
            selectedSubject={selectedSubject}
            onGenerateFlashcardsFromNotes={handleGenerateFlashcardsFromNotes}
            onGenerateQuizFromNotes={handleGenerateQuizFromNotes}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizModule
            quizzes={quizzes}
            selectedSubject={selectedSubject}
            onCreateQuiz={handleCreateQuiz}
            onCompleteQuiz={handleCompleteQuiz}
          />
        )}

        {activeTab === 'roadmap' && (
          <StudyPlanner
            selectedSubject={selectedSubject}
            schedules={schedules}
            onCreateSchedule={handleCreateSchedule}
            onToggleTaskComplete={handleToggleScheduleTask}
            onDeleteSchedule={handleDeleteSchedule}
          />
        )}

        {activeTab === 'explainer' && (
          <ConceptExplainer selectedSubject={selectedSubject} />
        )}
      </main>

      {/* Pomodoro Focus Timer Modal */}
      <PomodoroTimer
        isOpen={isPomodoroOpen}
        onClose={() => setIsPomodoroOpen(false)}
        onAddStudyMinutes={handleAddStudyMinutes}
      />

      {/* Footer */}
      <footer className="py-4 border-t border-slate-200/80 text-center text-xs text-slate-500 bg-white/60">
        AI Study Buddy • Powered by Gemini 3.6 Flash • Made for Students 🎓
      </footer>

    </div>
  );
}
