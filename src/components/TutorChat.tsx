import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, Subject, TutorPersonaId } from '../types';
import { TUTOR_PERSONAS } from '../lib/defaultData';
import { 
  Send, 
  Image as ImageIcon, 
  X, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Sparkles, 
  RefreshCw, 
  Bot, 
  User, 
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface TutorChatProps {
  selectedSubject: Subject;
  messages: ChatMessage[];
  onSendMessage: (text: string, imageBase64?: string, personaId?: TutorPersonaId) => Promise<void>;
  isLoading: boolean;
}

export const TutorChat: React.FC<TutorChatProps> = ({
  selectedSubject,
  messages,
  onSendMessage,
  isLoading,
}) => {
  const [activePersona, setActivePersona] = useState<TutorPersonaId>('socratic');
  const [input, setInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Speech Recognition Setup
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser tab. Please type your message.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsRecording(false);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Speak AI Answer
  const handleSpeakText = async (msgId: string, text: string) => {
    if (playingAudioId === msgId) {
      window.speechSynthesis?.cancel();
      setPlayingAudioId(null);
      return;
    }

    try {
      setPlayingAudioId(msgId);

      // Try server-side TTS
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audio) {
          const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
          audio.onended = () => setPlayingAudioId(null);
          audio.onerror = () => fallbackWebSpeech(msgId, text);
          await audio.play();
          return;
        }
      }
      fallbackWebSpeech(msgId, text);
    } catch (e) {
      fallbackWebSpeech(msgId, text);
    }
  };

  const fallbackWebSpeech = (msgId: string, text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleaned = text.replace(/[*#_`~]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.onend = () => setPlayingAudioId(null);
      utterance.onerror = () => setPlayingAudioId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingAudioId(null);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !imagePreview) || isLoading) return;

    const userText = input.trim();
    const currentImg = imagePreview || undefined;

    setInput('');
    setImagePreview(null);

    await onSendMessage(userText, currentImg, activePersona);
  };

  const currentPersonaObj = TUTOR_PERSONAS.find((p) => p.id === activePersona) || TUTOR_PERSONAS[0];

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      
      {/* Persona Selection Header */}
      <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        
        <div className="flex items-center gap-2">
          <span className="text-2xl">{currentPersonaObj.avatarEmoji}</span>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              {currentPersonaObj.name}
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                {selectedSubject}
              </span>
            </h2>
            <p className="text-xs text-slate-500">{currentPersonaObj.tagline}</p>
          </div>
        </div>

        {/* Persona Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {TUTOR_PERSONAS.map((p) => (
            <button
              key={p.id}
              id={`persona-${p.id}`}
              onClick={() => setActivePersona(p.id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activePersona === p.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white hover:bg-slate-200/80 text-slate-600 border border-slate-200'
              }`}
              title={p.description}
            >
              <span>{p.avatarEmoji}</span>
              <span className="hidden md:inline">{p.name}</span>
            </button>
          ))}
        </div>

      </div>

      {/* Chat Messages List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/40">
        
        {/* Welcome Banner if empty */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center my-8 px-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 text-3xl shadow-xs">
              {currentPersonaObj.avatarEmoji}
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Hi! I'm your {currentPersonaObj.name}
            </h3>
            <p className="text-sm text-slate-600 max-w-md mt-1 mb-6">
              Ask me anything in <strong className="text-indigo-600">{selectedSubject}</strong>! You can upload textbook photos, paste notes, or ask for step-by-step concept explanations.
            </p>

            {/* Starter Suggestion Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl w-full">
              {[
                `Explain the fundamental rules of ${selectedSubject}`,
                `Give me 3 high-yield exam practice questions`,
                `How do I approach solving complex problems in ${selectedSubject}?`,
                `Break down the most confusing topic in ${selectedSubject}`,
              ].map((starter, idx) => (
                <button
                  key={idx}
                  id={`starter-prompt-${idx}`}
                  onClick={() => {
                    setInput(starter);
                  }}
                  className="p-3 text-left bg-white hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-200 rounded-xl text-xs font-medium text-slate-700 hover:text-indigo-900 shadow-2xs transition-all flex items-center justify-between cursor-pointer group"
                >
                  <span>{starter}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 sm:gap-4 max-w-3xl ${
                isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm shadow-xs ${
                  isAssistant
                    ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white'
                    : 'bg-slate-800 text-white'
                }`}
              >
                {isAssistant ? (
                  currentPersonaObj.avatarEmoji
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>

              {/* Message Content */}
              <div
                className={`rounded-2xl p-4 sm:p-5 shadow-2xs ${
                  isAssistant
                    ? 'bg-white border border-slate-200 text-slate-900'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {/* Image Attachment if exists */}
                {msg.imageAttachment && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-slate-200/60 max-w-sm">
                    <img
                      src={msg.imageAttachment}
                      alt="Uploaded student work"
                      className="w-full object-cover max-h-60"
                    />
                  </div>
                )}

                {/* Markdown text */}
                <div
                  className={`text-sm leading-relaxed prose prose-slate max-w-none ${
                    !isAssistant ? 'text-white prose-invert' : ''
                  }`}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>

                {/* Speech audio trigger for AI messages */}
                {isAssistant && (
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      id={`speak-msg-${msg.id}`}
                      onClick={() => handleSpeakText(msg.id, msg.content)}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      {playingAudioId === msg.id ? (
                        <>
                          <VolumeX className="w-4 h-4 text-indigo-600 animate-pulse" />
                          <span className="text-indigo-600 font-semibold">Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4" />
                          <span>Listen Aloud</span>
                        </>
                      )}
                    </button>
                    <span className="text-[10px] text-slate-400">
                      {msg.timestamp}
                    </span>
                  </div>
                )}

                {/* AI Follow-up Suggestions */}
                {isAssistant && msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      Suggested Next Questions:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedFollowups.map((followup, idx) => (
                        <button
                          key={idx}
                          id={`followup-${msg.id}-${idx}`}
                          onClick={() => {
                            setInput(followup);
                          }}
                          className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-lg border border-indigo-200/80 transition-colors cursor-pointer font-medium text-left"
                        >
                          {followup}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-3xl mr-auto">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 animate-spin" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3 text-slate-600 text-sm">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
              <span>Thinking & formulating study response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Area */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
        
        {/* Attached Image Thumbnail Preview */}
        {imagePreview && (
          <div className="mb-2 inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg p-1.5 pr-3 text-xs">
            <img src={imagePreview} alt="Upload preview" className="w-8 h-8 rounded object-cover" />
            <span className="font-medium text-indigo-900 truncate max-w-xs">Attached Image</span>
            <button
              id="remove-image-btn"
              onClick={() => setImagePreview(null)}
              className="text-indigo-400 hover:text-indigo-700 ml-auto cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          
          {/* File Upload Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
            id="tutor-image-upload"
          />
          <button
            type="button"
            id="attach-image-btn"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer shrink-0"
            title="Upload photo of textbook or problem"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Voice Mic Record Button */}
          <button
            type="button"
            id="mic-record-btn"
            onClick={toggleRecording}
            className={`p-2.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
            title="Voice input"
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input Field */}
          <input
            id="tutor-text-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask a question or paste problem in ${selectedSubject}...`}
            className="flex-1 bg-slate-100/90 hover:bg-slate-100 text-slate-900 text-sm rounded-xl px-4 py-2.5 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            disabled={isLoading}
          />

          {/* Send Button */}
          <button
            type="submit"
            id="tutor-send-btn"
            disabled={(!input.trim() && !imagePreview) || isLoading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>

      </div>

    </div>
  );
};
