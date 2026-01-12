
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Image as ImageIcon, Loader2, Activity } from 'lucide-react';
import { initializeCoachChat, sendMessageToCoach, generateCoachImage } from '../services/geminiService';

interface Message {
    id: string;
    role: 'user' | 'ai';
    text: string;
    imageUrl?: string;
    isTyping?: boolean;
    tokens?: number;
}

export const AIAssistantView: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const hasInitialized = useRef(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            initializeCoachChat();
            setTimeout(() => {
                setMessages([{
                    id: 'init',
                    role: 'ai',
                    text: "Hallo! 👋 Ich bin Buchi, dein persönlicher Coach.\n\nBuchhaltung wirkt am Anfang kompliziert, ist aber eigentlich ganz logisch. \n\nErzähl mir doch kurz: Hast du schon Erfahrung, oder fangen wir ganz von vorne an? Und was für ein Business hast du? 🚀"
                }]);
            }, 500);
        }
    }, []);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userText = inputValue;
        setInputValue('');
        
        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: userText };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const response = await sendMessageToCoach(userText);
            
            const aiMsgId = (Date.now() + 1).toString();
            const aiMsg: Message = { 
                id: aiMsgId, 
                role: 'ai', 
                text: response.text, 
                tokens: response.totalTokens 
            };
            setMessages(prev => [...prev, aiMsg]);

            if (response.imagePrompt) {
                const imgLoadingId = (Date.now() + 2).toString();
                setMessages(prev => [...prev, { id: imgLoadingId, role: 'ai', text: 'Moment, ich zeichne das kurz für dich auf... 🎨', isTyping: true }]);
                
                const base64Image = await generateCoachImage(response.imagePrompt);
                
                setMessages(prev => {
                    const filtered = prev.filter(m => m.id !== imgLoadingId);
                    if (base64Image) {
                        return [...filtered, { id: (Date.now() + 3).toString(), role: 'ai', text: '', imageUrl: base64Image }];
                    } else {
                        return [...filtered, { id: (Date.now() + 3).toString(), role: 'ai', text: '(Bild konnte leider nicht generiert werden 😔)' }];
                    }
                });
            }

        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: "Ups, da ist etwas schiefgelaufen." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center text-white gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg leading-tight">Buchi, der Coach</h2>
                        <p className="text-xs text-indigo-100 opacity-90">Immer für dich da</p>
                    </div>
                </div>
                <div className="bg-white/10 px-3 py-1 rounded-full text-xs text-white font-medium border border-white/20">
                    Lern-Modus Aktiv
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`flex max-w-[80%] md:max-w-[70%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                {msg.role === 'user' ? <User className="w-5 h-5"/> : <Sparkles className="w-5 h-5"/>}
                            </div>

                            <div className={`flex flex-col gap-2`}>
                                {msg.text && (
                                    <div className={`p-4 rounded-2xl shadow-sm whitespace-pre-wrap leading-relaxed relative ${
                                        msg.role === 'user' 
                                        ? 'bg-blue-600 text-white rounded-tr-none' 
                                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                                    }`}>
                                        {msg.text}
                                        {msg.tokens !== undefined && msg.tokens > 0 && (
                                            <div className="mt-2 pt-2 border-t border-slate-100 text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                                <Activity className="w-2.5 h-2.5" />
                                                {msg.tokens.toLocaleString()} TOKENS VERBRAUCHT
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {msg.imageUrl && (
                                    <div className="rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-white p-2">
                                        <img src={msg.imageUrl} alt="Generated visual" className="w-full h-auto rounded-xl max-w-sm" />
                                        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-end px-1">
                                            <ImageIcon className="w-3 h-3 mr-1"/> KI-generiert
                                        </div>
                                    </div>
                                )}

                                {msg.isTyping && (
                                    <div className="flex items-center text-slate-400 text-xs ml-1 animate-pulse">
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin"/> Buchi denkt nach...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                <div className="relative flex items-center gap-2">
                    <input 
                        type="text" 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Frag mich etwas über Buchhaltung..."
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        disabled={isLoading}
                    />
                    <button 
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        className={`absolute right-2 p-2 rounded-lg transition-all ${
                            !inputValue.trim() || isLoading 
                            ? 'text-slate-300 bg-transparent' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                        }`}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
