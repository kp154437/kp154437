'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Paperclip, X, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AedaFirestoreRecord, generateFirestorePayload } from '@/lib/aeda-protocol';
import { chatWithGemini } from '@/app/actions'; // processDocumentWithGemini removed
import { db } from '@/lib/firebase';
import { collection, addDoc } from "firebase/firestore";

interface ChatInterfaceProps {
    onInteractionComplete: (record: AedaFirestoreRecord) => void;
    baseContext?: string;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    attachment?: {
        name: string;
        type: string;
        base64?: string;
    };
}

export function ChatInterface({ onInteractionComplete, baseContext = "" }: ChatInterfaceProps) {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        { id: 'welcome', role: 'assistant', content: "Hello! I'm your Personal AI Tutor. Attach a photo of your homework doubt or ask me anything!" }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [attachment, setAttachment] = useState<File | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() && !attachment) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            attachment: attachment ? { name: attachment.name, type: attachment.type } : undefined
        };

        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);
        setInput("");
        const currentAttachment = attachment;
        setAttachment(null);

        try {
            let aiContext = baseContext;
            let aiPrompt = userMsg.content;

            if (currentAttachment) {
                const formData = new FormData();
                formData.append('file', currentAttachment);

                // Use API Route instead of Server Action
                const response = await fetch('/api/process-document', { method: 'POST', body: formData });
                const docResult = await response.json();

                if (response.ok && docResult.full_extraction) {
                    aiPrompt = `[User attached a file named ${currentAttachment.name}. Content: ${docResult.full_extraction}]\n\nQuestion: ${userMsg.content}`;
                } else {
                    console.error("Document processing failed. Status:", response.status, "Result:", JSON.stringify(docResult));
                    alert(`Processing Error: ${docResult.error || "Unknown error"}`);
                    aiPrompt = `[User attached a file ${currentAttachment.name} but processing failed]. Question: ${userMsg.content}`;
                }
            }

            const aiResponseText = await chatWithGemini(messages, aiPrompt, aiContext);

            const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: aiResponseText };
            setMessages(prev => [...prev, botMsg]);

            const record = generateFirestorePayload(
                'QA_INTERACTION', 'Student', 'StudentDoubt', 'Direct Upload',
                { qa_pair: { q: aiPrompt, a: aiResponseText } }, ['student-upload']
            );
            onInteractionComplete(record);
            if (db) {
                addDoc(collection(db, "aeda_logs"), record)
                    .then(() => console.log("Chat log saved to Firestore"))
                    .catch(e => console.error("Firestore Chat Save Error:", e));
            }

        } catch (error) {
            setMessages(prev => [...prev, { id: 'error', role: 'assistant', content: "Sorry, I couldn't process that. Check your internet or API Key." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-[700px] glass-card overflow-hidden relative border-0">

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 scroll-smooth">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2 duration-300`}>

                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'assistant'
                            ? 'bg-gradient-to-br from-primary to-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-500'
                            }`}>
                            {msg.role === 'assistant' ? <Zap className="w-5 h-5 fill-current" /> : <User className="w-5 h-5" />}
                        </div>

                        <div className={`max-w-[85%] space-y-2`}>
                            {msg.attachment && (
                                <div className="bg-slate-100 dark:bg-white/5 p-3 rounded-xl text-xs flex items-center gap-2 border border-slate-200 dark:border-white/10 w-fit backdrop-blur-sm">
                                    <Paperclip className="w-4 h-4 text-primary" />
                                    <span className="font-medium">{msg.attachment.name}</span>
                                </div>
                            )}

                            {/* Bubble */}
                            <div className={`p-5 rounded-3xl text-sm shadow-sm leading-relaxed ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-primary to-indigo-600 text-white rounded-br-sm'
                                : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-800 dark:text-slate-100 rounded-bl-sm border border-white/50 dark:border-white/10'
                                }`}>
                                {msg.content ? (
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <span className="italic opacity-70">Attached a file</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex items-center gap-2 text-primary text-xs ml-16 font-medium animate-pulse">
                        <Sparkles className="w-4 h-4" />
                        <span>Thinking...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Floating Glass Capsule */}
            <div className="absolute bottom-6 left-0 right-0 px-6">
                <div className="glass p-2 rounded-[2rem] flex items-end gap-2 shadow-2xl shadow-primary/10 relative">

                    {attachment && (
                        <div className="absolute -top-14 left-4 bg-white dark:bg-slate-800 text-foreground px-4 py-2 rounded-2xl text-xs flex items-center gap-2 shadow-lg animate-in slide-in-from-bottom-2">
                            <Paperclip className="w-4 h-4 text-primary" />
                            <span className="max-w-[200px] truncate font-medium">{attachment.name}</span>
                            <button onClick={() => setAttachment(null)} className="hover:text-red-500 ml-2"><X className="w-4 h-4" /></button>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 text-slate-400 hover:text-primary hover:bg-white/50 dark:hover:bg-white/10 rounded-full transition-all"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,application/pdf"
                    />

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask anything..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-foreground placeholder:text-muted-foreground py-3.5 max-h-[120px] resize-none"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />

                    <button
                        onClick={handleSubmit}
                        disabled={(!input.trim() && !attachment) || isTyping}
                        className="p-3 bg-primary text-white rounded-full hover:bg-indigo-600 disabled:opacity-50 disabled:grayscale transition-all shadow-lg hover:shadow-primary/30 active:scale-95 m-1"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                <div className="text-center mt-3 text-[10px] text-muted-foreground opacity-60">
                    Powered by Gemini 1.5 Flash • Context Aware
                </div>
            </div>
        </div>
    );
}
