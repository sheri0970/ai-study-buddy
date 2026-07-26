import { Subject, TutorPersona, FlashcardDeck, QuizSession, UserStats } from '../types';

export const SUBJECTS: Subject[] = [
  'General',
  'Mathematics',
  'Computer Science',
  'Biology',
  'Physics',
  'Chemistry',
  'History',
  'Literature',
  'Psychology',
];

export const TUTOR_PERSONAS: TutorPersona[] = [
  {
    id: 'socratic',
    name: 'Socratic Mentor',
    tagline: 'Guiding through thoughtful questions',
    description: 'Helps you solve problems step-by-step by asking guiding questions rather than just handing over answers.',
    avatarEmoji: '🦉',
    systemPrompt: 'Socratic mentor',
  },
  {
    id: 'eli5',
    name: 'ELI5 Explainer',
    tagline: 'Simple analogies for tough concepts',
    description: 'Breaks down tricky theories, math, and science into crystal clear real-world analogies suitable for beginners.',
    avatarEmoji: '💡',
    systemPrompt: 'ELI5 explainer',
  },
  {
    id: 'exam_coach',
    name: 'Exam Prep Coach',
    tagline: 'High-yield facts & test strategies',
    description: 'Focuses on test-taking strategy, high-frequency exam questions, common student traps, and golden rules.',
    avatarEmoji: '🎯',
    systemPrompt: 'Exam prep coach',
  },
  {
    id: 'supportive',
    name: 'Encouraging Buddy',
    tagline: 'Positive vibe & study motivator',
    description: 'Super friendly, uplifting companion to keep your morale high, manage exam anxiety, and keep you energized.',
    avatarEmoji: '🌟',
    systemPrompt: 'Encouraging study buddy',
  },
];

export const INITIAL_STATS: UserStats = {
  streakDays: 4,
  totalMinutesStudied: 145,
  cardsMastered: 24,
  quizzesTaken: 6,
  averageQuizScore: 88,
  lastStudyDate: new Date().toISOString().split('T')[0],
};

export const SAMPLE_DECKS: FlashcardDeck[] = [
  {
    id: 'deck-1',
    title: 'Cellular Biology Essentials',
    description: 'Key structures, mitochondria function, ATP synthesis, and cell membranes.',
    subject: 'Biology',
    createdAt: '2026-07-20',
    cards: [
      {
        id: 'c1',
        deckId: 'deck-1',
        subject: 'Biology',
        question: 'What is the primary function of the Mitochondria?',
        answer: 'Powerhouse of the cell: generates ATP through cellular respiration.',
        explanation: 'Mitochondria convert nutrients like glucose into chemical energy (ATP) through oxidative phosphorylation.',
        status: 'mastered',
      },
      {
        id: 'c2',
        deckId: 'deck-1',
        subject: 'Biology',
        question: 'What is the main difference between Prokaryotes and Eukaryotes?',
        answer: 'Prokaryotes lack a membrane-bound nucleus; Eukaryotes have a distinct nucleus enclosing DNA.',
        explanation: 'Prokaryotes (like bacteria) are simpler and smaller, whereas eukaryotes (plant/animal cells) contain complex organelles.',
        status: 'learning',
      },
      {
        id: 'c3',
        deckId: 'deck-1',
        subject: 'Biology',
        question: 'Define Osmosis.',
        answer: 'The passive movement of water molecules across a semipermeable membrane from low to high solute concentration.',
        explanation: 'Osmosis aims to equalize solute concentrations on both sides of a selective membrane without expending energy.',
        status: 'new',
      },
      {
        id: 'c4',
        deckId: 'deck-1',
        subject: 'Biology',
        question: 'What process occurs in the chloroplasts during photosynthesis?',
        answer: 'Conversion of light energy into chemical energy (glucose) using CO2 and water.',
        explanation: 'Chlorophyll pigments capture photons to fuel the light-dependent and Calvin cycle reactions.',
        status: 'new',
      },
    ],
  },
  {
    id: 'deck-2',
    title: 'Calculus Derivatives & Limits',
    description: 'Power rule, product rule, chain rule, and limits definitions.',
    subject: 'Mathematics',
    createdAt: '2026-07-22',
    cards: [
      {
        id: 'c2-1',
        deckId: 'deck-2',
        subject: 'Mathematics',
        question: 'What is the Power Rule for finding derivatives?',
        answer: 'd/dx (x^n) = n * x^(n-1)',
        explanation: 'Multiply by the exponent n, then subtract 1 from the original exponent.',
        status: 'mastered',
      },
      {
        id: 'c2-2',
        deckId: 'deck-2',
        subject: 'Mathematics',
        question: 'State the Product Rule formula for derivative of f(x)*g(x).',
        answer: "d/dx [f(x)g(x)] = f'(x)g(x) + f(x)g'(x)",
        explanation: "Derivative of the first times second, plus first times derivative of the second.",
        status: 'learning',
      },
      {
        id: 'c2-3',
        deckId: 'deck-2',
        subject: 'Mathematics',
        question: 'What does the derivative geometrically represent on a function graph?',
        answer: 'The slope of the tangent line at any given point x.',
        explanation: 'It measures the instantaneous rate of change of the output with respect to input.',
        status: 'new',
      },
    ],
  },
];

export const SAMPLE_QUIZZES: QuizSession[] = [
  {
    id: 'quiz-1',
    title: 'Computer Science: Algorithms & Big-O',
    subject: 'Computer Science',
    difficulty: 'Medium',
    completed: false,
    userAnswers: {},
    createdAt: '2026-07-25',
    questions: [
      {
        id: 'q1',
        question: 'What is the time complexity of Binary Search on a sorted array of size N?',
        options: ['O(N)', 'O(log N)', 'O(N^2)', 'O(1)'],
        correctAnswerIndex: 1,
        explanation: 'Binary Search repeatedly halves the remaining search space, yielding O(log N) operations.',
        hint: 'Think about how the search space divides with each comparison.',
      },
      {
        id: 'q2',
        question: 'Which data structure follows the First-In, First-Out (FIFO) principle?',
        options: ['Stack', 'Tree', 'Queue', 'Hash Table'],
        correctAnswerIndex: 2,
        explanation: 'A Queue works like a checkout line: the first person to enter is the first to be served.',
        hint: 'Like standing in a line at a store.',
      },
      {
        id: 'q3',
        question: 'What is the worst-case time complexity of standard QuickSort without randomized pivoting?',
        options: ['O(N log N)', 'O(N^2)', 'O(N)', 'O(2^N)'],
        correctAnswerIndex: 1,
        explanation: 'When the array is already sorted and the first element is picked as pivot, QuickSort degrades to O(N^2).',
        hint: 'Occurs when pivots continuously create heavily unbalanced partitions.',
      },
    ],
  },
];
