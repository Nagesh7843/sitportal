import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Sparkles, Send, X, MessageSquare, 
  ChevronRight, Copy, Check, GraduationCap, 
  Users, Bell, Trash2
} from 'lucide-react';
import { aiService, ChatMessage } from '@/services/aiService';
import { NoticeItem, FacultyMember, StudentRecord, UploadAsset } from '@/types';

interface AiHelpdeskChatbotProps {
  notices: NoticeItem[];
  faculty: FacultyMember[];
  students: StudentRecord[];
  documents: UploadAsset[];
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

type ModeType = 'general' | 'academic' | 'faculty' | 'notices';

export function AiHelpdeskChatbot({ notices, faculty, students, documents }: AiHelpdeskChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ModeType>('general');
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Conversation History
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text: '### 👋 SIT AI Assistant\n\nHow can I help you today? Ask about **faculty location**, **urgent circulars**, **syllabus**, or department events.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setIsTyping(true);

    // Build chat history for Gemini multi-turn context
    const history: ChatMessage[] = messages
      .filter(m => m.id !== 'msg-welcome')
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

    try {
      const responseText = await aiService.askDepartmentAssistant(
        textToSend,
        history,
        selectedMode,
        { notices, faculty, students, documents }
      );

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: '⚠️ Unable to process request. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'msg-welcome',
        sender: 'bot',
        text: '### 👋 Chat Cleared\n\nHow else can I assist you with SIT CSE Department records?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <>
      {/* Minimal Launcher Floating Pill */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2.5 bg-zinc-900 border border-zinc-700/80 hover:border-zinc-500 text-zinc-100 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full shadow-2xl hover:bg-zinc-800 transition-all group"
          aria-label="Open AI Assistant"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full" />
          </div>
          <span className="text-xs font-bold tracking-tight">SIT AI</span>
          <Sparkles className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
        </button>
      )}

      {/* Sleek Minimal Floating Window / Mobile Sheet */}
      {isOpen && (
        <div className="fixed bottom-0 sm:bottom-6 right-0 sm:right-6 inset-x-0 sm:inset-x-auto z-50 w-full sm:w-[420px] max-w-full sm:max-w-md h-[85vh] sm:h-[560px] bg-slate-900 border-t sm:border border-slate-700/60 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden font-sans text-slate-100 animate-in fade-in slide-in-from-bottom-3 duration-200">
          
          {/* Minimal Header */}
          <div className="px-4 py-3 bg-[#000666] border-b border-white/10 flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-indigo-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs text-zinc-100">SIT AI</h3>
                  <span className="text-[10px] text-indigo-300 bg-indigo-950 border border-indigo-700 px-1.5 py-0.2 rounded font-semibold">Gemini Powered</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                title="Clear Chat History"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode Selector Bar */}
          <div className="px-3 py-2 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {[
              { id: 'general', label: 'General', icon: Sparkles },
              { id: 'faculty', label: 'Faculty Status', icon: Users },
              { id: 'notices', label: 'Notices', icon: Bell },
              { id: 'academic', label: 'Academic', icon: GraduationCap },
            ].map(mode => {
              const Icon = mode.icon;
              const isSelected = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id as ModeType)}
                  className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-indigo-950 border border-indigo-700 text-indigo-200'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {mode.label}
                </button>
              );
            })}
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs bg-zinc-950">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-xl px-3.5 py-2.5 relative group leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none font-normal'
                      : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-line">
                    {msg.text}
                  </div>

                  {/* Copy Action */}
                  {msg.sender === 'bot' && (
                    <div className="mt-2 pt-1.5 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500">
                      <span>{msg.timestamp}</span>
                      <button
                        onClick={() => copyToClipboard(msg.text, msg.id)}
                        className="text-zinc-400 hover:text-zinc-200 transition-colors"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl w-fit">
                <Bot className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span className="text-[11px]">Thinking...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Minimal Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-zinc-900/80 border-t border-zinc-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={`Ask about ${selectedMode}...`}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isTyping}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white p-2 rounded-xl transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
