import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Initialize GoogleGenAI client lazily or safely
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "dummy-key-for-dev",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// 1. Health Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// 2. AI Tutor Chat Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, subject, persona, imageBase64 } = req.body;
    const ai = getGenAI();

    // Construct system prompt based on persona and subject
    let personaInstruction = "You are an encouraging, expert AI Study Buddy and Tutor for students.";
    if (persona === "socratic") {
      personaInstruction += " Use the Socratic method: guide the student through questions, helping them arrive at answers themselves step-by-step. Never just give away final answers without explanation.";
    } else if (persona === "eli5") {
      personaInstruction += " Explain complex topics like I am 5 years old (ELI5). Use clear, relatable real-world analogies, simple language, and break things down effortlessly.";
    } else if (persona === "exam_coach") {
      personaInstruction += " Focus on exam preparation: highlight high-yield facts, key formulas, common student traps/mistakes, and test-taking strategies.";
    } else if (persona === "supportive") {
      personaInstruction += " Be super enthusiastic, encouraging, positive, and supportive! Celebrate progress, reduce academic stress, and provide friendly motivation.";
    }

    if (subject && subject !== "General") {
      personaInstruction += ` Focus on the subject area: ${subject}. Format math/formulas or code cleanly using markdown.`;
    }

    personaInstruction += ` Return your answer in JSON format with two properties:
1. "reply": Markdown formatted helpful study buddy response.
2. "suggestedFollowups": Array of 3 relevant follow-up questions the student can click next to continue learning.`;

    const contents: any[] = [];
    
    // Add history if present
    if (Array.isArray(messages)) {
      const lastMsg = messages[messages.length - 1];
      const contextPrompt = messages
        .slice(0, -1)
        .map((m: any) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`)
        .join("\n");

      let promptText = "";
      if (contextPrompt) {
        promptText += `Previous Conversation Context:\n${contextPrompt}\n\n`;
      }
      promptText += `Student Question: ${lastMsg.content || "Can you help me understand this topic?"}`;

      const parts: any[] = [{ text: promptText }];

      // Attach image if uploaded
      if (imageBase64) {
        const matches = imageBase64.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
        if (matches) {
          parts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2],
            },
          });
        }
      }

      contents.push({ parts });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: contents.length > 0 ? contents : "Hello AI Study Buddy!",
      config: {
        systemInstruction: personaInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            suggestedFollowups: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["reply"],
        },
      },
    });

    const responseText = response.text || "{}";
    const data = JSON.parse(responseText);
    res.json({
      reply: data.reply || "I'm ready to help you study! What topic shall we explore?",
      suggestedFollowups: data.suggestedFollowups || [
        "Can you explain this with an example?",
        "What are the key terms I should memorize?",
        "Can you quiz me on this?",
      ],
    });
  } catch (err: any) {
    console.error("Error in /api/chat:", err);
    res.status(500).json({ error: err.message || "Failed to generate AI response." });
  }
});

// 3. Generate Flashcards Endpoint
app.post("/api/generate-flashcards", async (req, res) => {
  try {
    const { topic, rawNotes, subject, cardCount = 6 } = req.body;
    const ai = getGenAI();

    const prompt = `Create a study flashcard deck of exactly ${cardCount} high-quality flashcards.
Subject: ${subject || "General"}
Topic/Keyword: ${topic || "General Study"}
${rawNotes ? `Source Notes:\n${rawNotes}` : ""}

Ensure each card tests a key concept, term, formula, or problem. Provide clear questions and precise answers with a brief explanation.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ["question", "answer"],
              },
            },
          },
          required: ["title", "cards"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (err: any) {
    console.error("Error in /api/generate-flashcards:", err);
    res.status(500).json({ error: err.message || "Failed to generate flashcards." });
  }
});

// 4. Generate Practice Quiz Endpoint
app.post("/api/generate-quiz", async (req, res) => {
  try {
    const { topic, rawNotes, subject, difficulty = "Medium", questionCount = 5 } = req.body;
    const ai = getGenAI();

    const prompt = `Generate a ${difficulty} difficulty practice quiz with ${questionCount} multiple-choice questions for a student.
Subject: ${subject || "General"}
Topic: ${topic || "General Knowledge"}
${rawNotes ? `Source Notes:\n${rawNotes}` : ""}

Each question must have 4 distinct options, exactly 1 correct option index (0 to 3), a helpful hint, and a detailed answer explanation.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quizTitle: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctAnswerIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                  hint: { type: Type.STRING },
                },
                required: ["question", "options", "correctAnswerIndex", "explanation"],
              },
            },
          },
          required: ["quizTitle", "questions"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (err: any) {
    console.error("Error in /api/generate-quiz:", err);
    res.status(500).json({ error: err.message || "Failed to generate practice quiz." });
  }
});

// 5. Summarize Notes Endpoint
app.post("/api/summarize-notes", async (req, res) => {
  try {
    const { rawNotes, subject, noteTitle } = req.body;
    const ai = getGenAI();

    const prompt = `Analyze and transform the following student notes into a structured study guide.
Note Title: ${noteTitle || "Lecture Notes"}
Subject: ${subject || "General"}

Source Notes:
${rawNotes}

Extract:
1. Executive Summary Bullet Points (4-6 key takeaways)
2. Key Vocabulary / Terms (with concise definitions)
3. Exam Cheat-Sheet Quick Reference (key formulas, theorems, dates, or golden rules)`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summaryBullets: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            keyTerms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING },
                },
                required: ["term", "definition"],
              },
            },
            cheatSheet: { type: Type.STRING },
          },
          required: ["summaryBullets", "keyTerms", "cheatSheet"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (err: any) {
    console.error("Error in /api/summarize-notes:", err);
    res.status(500).json({ error: err.message || "Failed to summarize notes." });
  }
});

// 6. Generate Study Schedule Roadmap Endpoint
app.post("/api/generate-study-plan", async (req, res) => {
  try {
    const { examName, subject, targetDate, availableHoursPerDay = 2, masteryLevel = "Beginner" } = req.body;
    const ai = getGenAI();

    const prompt = `Create a realistic, step-by-step day-by-day study plan leading up to an exam/test.
Exam Name: ${examName}
Subject: ${subject || "General"}
Target Exam Date: ${targetDate}
Daily Study Time: ${availableHoursPerDay} hours/day
Current Mastery Level: ${masteryLevel}

Generate 5-7 sequential milestone days/sessions with actionable daily tasks, focus topics, and estimated duration in minutes.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.INTEGER },
                  dateTitle: { type: Type.STRING },
                  focusTopic: { type: Type.STRING },
                  keyTasks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  estimatedMinutes: { type: Type.INTEGER },
                },
                required: ["day", "dateTitle", "focusTopic", "keyTasks", "estimatedMinutes"],
              },
            },
          },
          required: ["planItems"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (err: any) {
    console.error("Error in /api/generate-study-plan:", err);
    res.status(500).json({ error: err.message || "Failed to generate study plan." });
  }
});

// 7. Concept Deep Explainer Endpoint
app.post("/api/explain-concept", async (req, res) => {
  try {
    const { concept, subject, level = "Standard" } = req.body;
    const ai = getGenAI();

    const prompt = `Provide a comprehensive, engaging explanation of the concept "${concept}" in ${subject || "General"}. Level: ${level}.
Include:
1. Core Definition
2. Real-World Analogy
3. Step-by-Step Breakdown
4. Key Takeaways / Formulas
5. One Quick Practice Question with Solution`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert tutor known for making difficult academic topics extremely clear and enjoyable to learn.",
      },
    });

    res.json({ explanation: response.text });
  } catch (err: any) {
    console.error("Error in /api/explain-concept:", err);
    res.status(500).json({ error: err.message || "Failed to explain concept." });
  }
});

// 8. Text-to-Speech Endpoint for Study Buddy Voice
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice = "Kore" } = req.body;
    const ai = getGenAI();

    // Clean text before sending to TTS (remove markdown bold/italic formatting)
    const cleanedText = text.replace(/[*#_`~]/g, "").slice(0, 400);

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Speak in a warm tutor tone: ${cleanedText}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ audio: base64Audio });
    } else {
      res.status(400).json({ error: "No audio generated." });
    }
  } catch (err: any) {
    console.error("Error in /api/tts:", err);
    res.status(500).json({ error: err.message || "TTS generation failed." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
