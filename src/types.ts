export type Subject = 
  | 'Mathematics'
  | 'Computer Science'
  | 'Biology'
  | 'Physics'
  | 'Chemistry'
  | 'History'
  | 'Literature'
  | 'Psychology'
  | 'General';

export type TutorPersonaId = 'socratic' | 'eli5' | 'exam_coach' | 'supportive';

export interface TutorPersona {
  id: TutorPersonaId;
  name: string;
  tagline: string;
  description: string;
  avatarEmoji: string;
  systemPrompt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  subject?: Subject;
  imageAttachment?: string; // base64 data URL
  suggestedFollowups?: string[];
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  subject: Subject;
  deckId: string;
  status: 'new' | 'learning' | 'mastered';
  lastReviewed?: string;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  description: string;
  subject: Subject;
  cards: Flashcard[];
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  hint?: string;
}

export interface QuizSession {
  id: string;
  title: string;
  subject: Subject;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questions: QuizQuestion[];
  userAnswers: Record<number, number>;
  completed: boolean;
  score?: number;
  createdAt: string;
}

export interface NoteSummary {
  id: string;
  title: string;
  subject: Subject;
  rawNotes: string;
  summaryBullets: string[];
  keyTerms: { term: string; definition: string }[];
  cheatSheet: string;
  createdAt: string;
}

export interface StudyPlanItem {
  day: number;
  dateTitle: string;
  focusTopic: string;
  keyTasks: string[];
  estimatedMinutes: number;
  completed?: boolean;
}

export interface StudySchedule {
  id: string;
  examName: string;
  subject: Subject;
  targetDate: string;
  availableHoursPerDay: number;
  masteryLevel: string;
  planItems: StudyPlanItem[];
  createdAt: string;
}

export interface UserStats {
  streakDays: number;
  totalMinutesStudied: number;
  cardsMastered: number;
  quizzesTaken: number;
  averageQuizScore: number;
  lastStudyDate: string;
}
