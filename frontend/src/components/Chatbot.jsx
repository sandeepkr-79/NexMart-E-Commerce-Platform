import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { MessageSquare, X, Send, Bot, RefreshCw, Sparkles, BookOpen, AlertCircle, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSendChatMessageMutation } from '../app/apiSlice.js';
import { selectCurrentUser } from '../app/authSlice.js';
import { Link } from 'react-router-dom';

const Chatbot = () => {
  const user = useSelector(selectCurrentUser);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  
  const messagesEndRef = useRef(null);
  const [sendMessage, { isLoading }] = useSendChatMessageMutation();

  // Initialize unique session ID per browser session
  useEffect(() => {
    let activeSession = sessionStorage.getItem('nexmart_ai_session');
    if (!activeSession) {
      activeSession = `session_${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem('nexmart_ai_session', activeSession);
    }
    setSessionId(activeSession);
    
    // Set up greeting message
    setMessages([
      {
        role: 'assistant',
        content: `Hi ${user ? user.name : 'there'}! I am **NexMart AI**, your personal shopping assistant. I can recommend items, look up manuals, compare specifications, and help you find deals. 

What can I help you find today?`,
        timestamp: new Date()
      }
    ]);
  }, [user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const text = textToSend || query;
    if (!text.trim() || isLoading) return;

    if (!textToSend) setQuery('');

    // Append user message
    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);

    if (!user) {
      // Prompt login required if not logged in
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `I'd love to help you find that! However, you need to **log in or sign up** first to start chatting with the NexMart AI assistant.`,
            isAuthPrompt: true,
            timestamp: new Date()
          }
        ]);
      }, 500);
      return;
    }

    try {
      const response = await sendMessage({ message: text, sessionId }).unwrap();
      
      const assistantMsg = {
        role: 'assistant',
        content: response.content,
        sources: response.sources || [],
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Oops, I encountered a temporary connection issue. Please try again.',
          timestamp: new Date()
        }
      ]);
    }
  };

  const handleClearChat = () => {
    const newSession = `session_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('nexmart_ai_session', newSession);
    setSessionId(newSession);
    setMessages([
      {
        role: 'assistant',
        content: `Chat history reset. How can I help you with your shopping search now?`,
        timestamp: new Date()
      }
    ]);
  };

  // Helper to extract product IDs (e.g. 24 char mongo IDs) and make clickable links
  const renderMessageContent = (content) => {
    const mongoIdRegex = /\b([a-f\d]{24})\b/g;
    const parts = content.split(mongoIdRegex);

    if (parts.length <= 1) return <p className="whitespace-pre-line text-sm">{content}</p>;

    return (
      <p className="whitespace-pre-line text-sm">
        {parts.map((part, index) => {
          if (mongoIdRegex.test(part)) {
            return (
              <Link 
                key={index} 
                to={`/product/${part}`} 
                onClick={() => setIsOpen(false)}
                className="btn btn-xs btn-primary inline-flex gap-1 items-center mx-1 font-semibold"
              >
                <ShoppingCart size={10} /> View Item
              </Link>
            );
          }
          return part;
        })}
      </p>
    );
  };

  // Starter query chips
  const starterChips = [
    "Best laptop under ₹60,000",
    "Compare AeroBook vs Aura Watch",
    "Show me headphones in stock"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="btn btn-circle bg-gradient-to-r from-violet-600 to-pink-600 text-white w-14 h-14 shadow-2xl border-none relative flex items-center justify-center"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div key="bot" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
              <Bot size={26} className="animate-bounce" />
            </motion.div>
          )}
        </AnimatePresence>
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-slate-900"></span>
      </motion.button>

      {/* Expanded Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-80 sm:w-96 h-[500px] rounded-2xl flex flex-col shadow-2xl border border-slate-800 bg-slate-950 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-violet-600/20 text-violet-400 rounded-lg">
                  <Bot size={18} />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                    NexMart AI Assistant
                  </h3>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    <span className="text-[10px] text-slate-400 font-medium">Online (RAG Enabled)</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleClearChat}
                  title="Clear chat history"
                  className="btn btn-ghost btn-circle btn-xs text-slate-400 hover:text-slate-200"
                >
                  <RefreshCw size={14} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="btn btn-ghost btn-circle btn-xs text-slate-400 hover:text-slate-200"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Message Pane */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`chat ${msg.role === 'user' ? 'chat-end' : 'chat-start'}`}
                >
                  <div className="chat-image avatar">
                    <div className="w-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-800">
                      {msg.role === 'user' ? (
                        <span className="text-xs font-bold text-slate-400">ME</span>
                      ) : (
                        <Bot size={16} className="text-violet-400" />
                      )}
                    </div>
                  </div>
                  
                  <div 
                    className={`chat-bubble py-2.5 px-3.5 rounded-2xl max-w-[85%] ${
                      msg.role === 'user' 
                        ? 'bg-violet-600 text-white rounded-tr-none' 
                        : 'bg-slate-900 text-slate-100 border border-slate-800/80 rounded-tl-none'
                    }`}
                  >
                    {renderMessageContent(msg.content)}

                    {/* Action button if user needs to login */}
                    {msg.isAuthPrompt && (
                      <Link 
                        to="/login" 
                        onClick={() => setIsOpen(false)} 
                        className="btn btn-sm btn-primary btn-block mt-3 text-xs font-bold"
                      >
                        Log In Now
                      </Link>
                    )}

                    {/* Render Citations sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap gap-1 items-center">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                          <BookOpen size={10} /> Sources:
                        </span>
                        {msg.sources.map((src, i) => (
                          <span 
                            key={i} 
                            className="badge badge-neutral text-[9px] border border-slate-800 py-0.5 px-1.5 rounded text-slate-300 font-medium"
                          >
                            {src}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Ingestion warning helper for admins */}
              {user && user.role === 'admin' && messages.length <= 2 && (
                <div className="alert bg-slate-900 border-slate-800 text-[11px] py-2 px-3 rounded-lg text-slate-400 flex gap-2 items-start">
                  <AlertCircle size={14} className="text-violet-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">Admin Tip:</span> Upload PDF manuals in the Admin dashboard to extend the chatbot knowledge base!
                  </div>
                </div>
              )}

              {/* Starter Query Chips for Empty Logs */}
              {messages.length <= 1 && (
                <div className="pt-2 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles size={11} className="text-violet-400" /> Suggested Queries
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {starterChips.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(chip)}
                        className="text-left text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-violet-500/40 p-2.5 rounded-xl transition-all text-slate-300 hover:text-slate-100"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading bubble */}
              {isLoading && (
                <div className="chat chat-start">
                  <div className="chat-image avatar">
                    <div className="w-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-800">
                      <Bot size={16} className="text-violet-400" />
                    </div>
                  </div>
                  <div className="chat-bubble bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl rounded-tl-none py-3 px-4">
                    <div className="flex gap-1.5 items-center">
                      <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
              className="p-3 border-t border-slate-800/80 bg-slate-950 flex gap-2"
            >
              <input
                type="text"
                placeholder="Ask AI about products or manuals..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="input input-sm input-bordered bg-slate-900 border-slate-800 text-slate-100 text-sm flex-1 focus:outline-none focus:border-violet-500 rounded-xl"
              />
              <button 
                type="submit" 
                disabled={isLoading || !query.trim()}
                className="btn btn-sm btn-primary bg-gradient-to-r from-violet-600 to-pink-600 border-none shadow text-white rounded-xl"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chatbot;
