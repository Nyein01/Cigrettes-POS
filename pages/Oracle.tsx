import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, User, HelpCircle, TrendingUp, Search } from 'lucide-react';
import { ChatMessage } from '../types';
import { interact } from '../services/interactionService';
import { createOracleSession } from '../services/geminiService';
import { getProductsOnce, subscribeToSales } from '../services/storeService';
import { Chat, GenerateContentResponse } from "@google/genai";

export const Oracle: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm K.A.I, your shop assistant. I know everything about your current stock and today's sales. How can I help?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const salesRef = useRef<any[]>([]);

  // Initialize Chat Session with real data
  useEffect(() => {
    const init = async () => {
      const products = await getProductsOnce();
      // We subscribe to sales to always have fresh data if we need to re-init, 
      // but for now we just capture current state for the session prompt.
      // In a more advanced version, we'd update the context dynamically.
      const unsubscribe = subscribeToSales((data) => {
        salesRef.current = data;
      });
      
      // Wait a tick for sales to populate if any
      setTimeout(async () => {
        const session = await createOracleSession(products, salesRef.current);
        setChatSession(session);
      }, 500);

      return () => unsubscribe();
    };
    init();
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string = input) => {
    if (!text.trim() || !chatSession) return;
    
    interact();
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
        const result = await chatSession.sendMessageStream({ message: text });
        
        const botMsgId = (Date.now() + 1).toString();
        // Create placeholder for bot message
        setMessages(prev => [...prev, {
            id: botMsgId,
            role: 'model',
            text: '',
            timestamp: Date.now(),
            isStreaming: true
        }]);

        let fullText = '';
        
        for await (const chunk of result) {
            const c = chunk as GenerateContentResponse;
            const newText = c.text || '';
            fullText += newText;
            
            setMessages(prev => prev.map(msg => 
                msg.id === botMsgId 
                ? { ...msg, text: fullText } 
                : msg
            ));
        }
        
        setMessages(prev => prev.map(msg => 
            msg.id === botMsgId 
            ? { ...msg, isStreaming: false } 
            : msg
        ));

    } catch (error) {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: "My neural network is glitching. Try again later!",
            timestamp: Date.now()
        }]);
    } finally {
        setIsTyping(false);
    }
  };

  const handleQuickAction = (action: string) => {
    let prompt = "";
    switch(action) {
        case 'status': prompt = "Give me a quick status report on inventory and sales."; break;
        case 'advice': prompt = "Based on today's performance, what should I focus on?"; break;
        case 'horoscope': prompt = "Generate a funny daily horoscope for this cigarette shop."; break;
        case 'joke': prompt = "Tell me a joke about retail or convenience stores."; break;
    }
    handleSendMessage(prompt);
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-hidden flex flex-col animate-fade-in">
        <div className="mb-4 lg:mb-6 shrink-0">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                The Oracle <Bot className="text-indigo-600" />
            </h2>
            <p className="text-slate-600 font-medium mt-1 text-sm lg:text-base">Ask K.A.I anything about your shop</p>
        </div>

        <div className="flex-1 min-h-0 flex flex-col glass-panel rounded-2xl overflow-hidden shadow-2xl relative">
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`flex gap-3 max-w-[90%] lg:max-w-[80%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                        <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-white'}`}>
                            {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                        </div>
                        
                        <div className={`rounded-2xl px-4 py-3 shadow-sm text-sm lg:text-base leading-relaxed whitespace-pre-wrap ${
                            msg.role === 'user' 
                            ? 'bg-white text-slate-800 rounded-tr-none' 
                            : 'bg-slate-800 text-slate-200 rounded-tl-none'
                        }`}>
                            {msg.text}
                            {msg.isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-emerald-400 animate-pulse align-middle"></span>}
                        </div>
                    </div>
                ))}
                {isTyping && !messages.find(m => m.isStreaming) && (
                    <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                             <Bot size={18} />
                        </div>
                        <div className="bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                            <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                            <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions (only if idle) */}
            {!isTyping && messages.length < 4 && (
                <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
                    <button onClick={() => handleQuickAction('status')} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold hover:bg-indigo-200 transition-colors whitespace-nowrap">
                        <TrendingUp size={14} /> Shop Status
                    </button>
                    <button onClick={() => handleQuickAction('advice')} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold hover:bg-emerald-200 transition-colors whitespace-nowrap">
                        <HelpCircle size={14} /> Advice
                    </button>
                    <button onClick={() => handleQuickAction('horoscope')} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold hover:bg-purple-200 transition-colors whitespace-nowrap">
                        <Sparkles size={14} /> Horoscope
                    </button>
                </div>
            )}

            {/* Input Area */}
            <div className="p-3 lg:p-4 bg-white/40 border-t border-white/40">
                <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                    className="flex items-center gap-2 lg:gap-3 bg-white/60 p-1.5 lg:p-2 rounded-xl border border-white/50 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all shadow-sm"
                >
                    <input 
                        type="text" 
                        className="flex-1 bg-transparent border-none outline-none px-2 lg:px-3 py-1 text-slate-800 placeholder-slate-500 font-medium text-sm lg:text-base"
                        placeholder="Ask K.A.I anything..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        disabled={isTyping}
                    />
                    <button 
                        type="submit" 
                        disabled={!input.trim() || isTyping || !chatSession}
                        className="p-2 lg:p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-indigo-500/20"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
};