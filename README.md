App Name, Purpose & Target Audience:
Name: AI Study Buddy
Purpose: Solves passive reading, context switching, generic non-pedagogical AI responses, and exam cramming anxiety by providing an all-in-one AI learning suite.
Target Audience: High school, AP/IB students, university undergraduates, pre-med/STEM majors, and self-directed learners.
Live Deployed URL:
Clickable Link: https://ai-study-buddy-eight-woad.vercel.app
Complete Feature List:
Multimodal AI Tutor Chat (4 personas: Socratic Mentor, ELI5 Explainer, Exam Prep Coach, Encouraging Buddy) with voice input and Gemini Text-to-Speech (TTS) audio output.
3D Flashcard Deck Studio with active recall memory tracking.
Smart Note Summarizer & Cheat-Sheet Engine with bullet takeaways, key terms, and markdown cheat sheets.
Adaptive Practice Quiz Builder with hints, solution reasoning, scoring, and confetti rewards.
AI Exam Study Roadmap Planner with daily focus task lists and percentage readiness tracking.
Deep Concept Explainer across 3 academic difficulty levels.
Pomodoro Focus Timer & Web Audio Pink Noise Synthesizer.
AI Features & System Prompts:
Includes exact system instructions, persona logic, prompts, and structured JSON output schemas for all endpoints (/api/chat, /api/generate-flashcards, /api/generate-quiz, /api/summarize-notes, /api/generate-study-plan, /api/explain-concept, /api/tts).
Tools, Services & AI Models:
AI Models: Google Gemini 3.6 Flash & Gemini 3.1 Flash TTS Preview.
Frontend: React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion, React Markdown, Canvas Confetti.
Backend: Express.js, @google/genai SDK, esbuild.
Audio: Web Audio API (procedural pink noise & chimes).
Visual UI Experience & App Layout:
Detailed ASCII/Markdown UI workflow diagram illustrating the multi-module dashboard, Socratic mentor chat, flashcard decks, and quiz arena.
Local Setup & Production Build:
Step-by-step instructions for cloning, installing dependencies, configuring .env, running local dev mode (npm run dev), and building for production (npm run build).
