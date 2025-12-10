import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X, Bot, User, Loader2, Sparkles, ChevronUp, ChevronDown, MessageSquare, TextSelect } from 'lucide-react';
import { ChatMessage, ToolCall } from '../types';
import { sendChatMessage } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';

interface ChatInterfaceProps {
  onGenerateImageRequest: (prompt: string) => void;
  onToolCall: (toolCalls: ToolCall[]) => void;
  selectedContext?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onGenerateImageRequest, onToolCall, selectedContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Bonjour! I am L'ami Charrette. Tell me what you want to create or design.",
      timestamp: Date.now()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isHistoryOpen]);

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedImage) || isLoading) return;

    // Check for explicit generation commands (client side shortcut)
    if (inputText.toLowerCase().startsWith('/gen') || inputText.toLowerCase().startsWith('generate')) {
        onGenerateImageRequest(inputText.replace(/^\/gen|generate/i, '').trim());
        const userMsg: ChatMessage = { id: uuidv4(), role: 'user', text: inputText, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        return;
    }

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      text: inputText,
      image: selectedImage || undefined,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setSelectedImage(null);
    setIsLoading(true);

    // Auto-open history to show the interaction
    setIsHistoryOpen(true);

    try {
      // Pass selectedContext to the service
      const response = await sendChatMessage(messages, userMsg.text, userMsg.image, selectedContext);
      
      const aiMsg: ChatMessage = {
        id: uuidv4(),
        role: 'model',
        text: response.text,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);

      // Handle Function/Tool Calls
      if (response.toolCalls && response.toolCalls.length > 0) {
        onToolCall(response.toolCalls);
        // Add a system message indicating action
        const actionMsg: ChatMessage = {
            id: uuidv4(),
            role: 'model',
            text: "🎨 Updating your board...",
            timestamp: Date.now() + 100
        };
        setMessages(prev => [...prev, actionMsg]);
      }

    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: uuidv4(),
        role: 'model',
        text: "Sorry, I encountered an error processing your request.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSelectedImage(ev.target?.result as string);
        inputRef.current?.focus();
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-[2000] flex flex-col items-center gap-2 pointer-events-none">
      
      {/* Floating Chat History (Popover) */}
      {isHistoryOpen && (
        <div className="w-full bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl mb-2 overflow-hidden flex flex-col max-h-[50vh] animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto">
            {/* Header */}
            <div className="h-12 border-b border-slate-100 flex items-center justify-between px-6 bg-white/50">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={12} className="text-indigo-500" />
                    Gemini 3 Pro
                </span>
                <button 
                    onClick={() => setIsHistoryOpen(false)} 
                    className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                    <ChevronDown size={18} />
                </button>
            </div>

            {/* Messages List */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${
                        msg.role === 'model' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-transparent text-white' : 'bg-white border-slate-200 text-slate-600'
                    }`}>
                        {msg.role === 'model' ? <Bot size={14} /> : <User size={14} />}
                    </div>
                    <div className={`max-w-[85%] space-y-2`}>
                        {msg.image && (
                            <img src={msg.image} alt="User upload" className="w-48 rounded-lg border border-slate-200 mb-1 shadow-sm" />
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            msg.role === 'user' 
                                ? 'bg-slate-800 text-white rounded-tr-sm' 
                                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                </div>
                ))}
                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 animate-pulse">
                            <Bot size={14} className="text-white" />
                        </div>
                        <div className="bg-white px-4 py-2 rounded-full border border-slate-100 text-slate-500 text-xs flex items-center gap-2 shadow-sm">
                            Thinking <Loader2 size={12} className="animate-spin" />
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Main Input Bar (The "Pill") */}
      <div className="w-full relative shadow-2xl rounded-full group transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] pointer-events-auto">
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-full border border-white/60"></div>
        
        {/* Toggle History Button (Left) */}
        <button 
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className={`absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full transition-all z-10 ${
                isHistoryOpen ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            title="Toggle History"
        >
            {isHistoryOpen ? <ChevronDown size={20} /> : <MessageSquare size={20} />}
        </button>

        {/* Input Field */}
        <div className="relative z-0 pl-14 pr-14 py-2">
             
             {/* Context Badge */}
             {selectedContext && (
                <div className="flex items-center gap-1.5 mb-1 animate-in fade-in slide-in-from-bottom-1">
                    <TextSelect size={12} className="text-green-600" />
                    <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-md border border-green-100">
                        {selectedContext.length > 30 ? selectedContext.substring(0, 30) + '...' : selectedContext}
                    </span>
                </div>
             )}

             {selectedImage && (
                <div className="absolute top-2 left-14 z-20 flex items-center gap-2 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100">
                    <ImageIcon size={12} className="text-indigo-600"/>
                    <span className="text-[10px] text-indigo-700 font-medium">Image attached</span>
                    <button onClick={() => setSelectedImage(null)} className="text-indigo-400 hover:text-indigo-700"><X size={10}/></button>
                </div>
            )}
            <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                placeholder={selectedContext ? "Ask about selection..." : selectedImage ? "Ask about this image..." : "Decorate my office in Japandi style..."}
                className={`w-full bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 text-lg py-2 resize-none overflow-hidden ${selectedImage ? 'pt-8' : ''}`}
                rows={1}
                style={{ minHeight: '48px' }}
            />
        </div>

        {/* Action Buttons (Right) */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
            <label className="p-2 text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors rounded-full hover:bg-slate-50" title="Upload Image">
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                <ImageIcon size={20} />
            </label>
            <button 
                onClick={handleSend}
                disabled={!inputText.trim() && !selectedImage}
                className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:shadow-none disabled:transform-none"
            >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
            </button>
        </div>
      </div>
      
      <p className="text-[10px] text-slate-400 font-medium tracking-wide">
        Powered by <span className="text-indigo-500">Gemini 3 Pro</span> • L'ami Charrette
      </p>

    </div>
  );
};

export default ChatInterface;