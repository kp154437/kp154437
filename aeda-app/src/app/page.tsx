'use client';

import { useState } from 'react';
import { CoachingLayout } from '@/components/CoachingLayout';
import { UploadZone } from '@/components/UploadZone';
import { JsonPreview } from '@/components/JsonPreview';
import { ChatInterface } from '@/components/ChatInterface';
import { UserRole, AedaFirestoreRecord, generateFirestorePayload } from '@/lib/aeda-protocol';
import { BrainCircuit, BookOpen, Clock, Activity, Zap, UploadCloud } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc } from "firebase/firestore";

export default function Home() {
  const [role, setRole] = useState<UserRole>('Student');
  const [activeTab, setActiveTab] = useState('ai-tutor');
  const [documentContext, setDocumentContext] = useState<string>("");
  const [lastRecord, setLastRecord] = useState<AedaFirestoreRecord | null>(null);

  const handleCurriculumUpload = (result: any) => {
    if (result.full_extraction) {
      setDocumentContext(result.full_extraction);
    }
    const record = generateFirestorePayload(
      'CONTENT_UPLOAD', 'Teacher', result.subject || 'General', result.topic || 'Upload',
      { summary: result.summary, full_extraction: result.full_extraction?.substring(0, 200) + "..." },
      result.keywords || []
    );
    setLastRecord(record);

    // Write to Firestore
    if (db) {
      addDoc(collection(db, "aeda_logs"), record)
        .then(() => console.log("Curriculum uploaded to Firestore"))
        .catch(e => console.error("Firestore Upload Error:", e));
    }
  };

  const handleStudentInteraction = (record: AedaFirestoreRecord) => {
    setLastRecord(record);
  };

  return (
    <CoachingLayout
      currentRole={role}
      onRoleChange={setRole}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <div className="max-w-6xl mx-auto h-full flex flex-col gap-8">

        {/* Dynamic Header */}
        <div className="animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-secondary">
              {activeTab === 'dashboard' && `Welcome back, ${role}.`}
              {activeTab === 'ai-tutor' && `Personal AI Tutor`}
              {activeTab === 'library' && `Curriculum Library`}
              {activeTab === 'uploads' && `My Uploads`}
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {activeTab === 'dashboard' && 'Your learning progress is looking great today.'}
            {activeTab === 'ai-tutor' && 'Ask doubts, solve PYQs, or get explanations instantly.'}
            {activeTab === 'library' && 'Access official study material and resources.'}
          </p>
        </div>

        {/* --- VIEW: AI TUTOR (Main) --- */}
        {activeTab === 'ai-tutor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-6">
            <div className="lg:col-span-2 h-full animate-in zoom-in-95 duration-500">
              <ChatInterface
                onInteractionComplete={handleStudentInteraction}
                baseContext={documentContext}
              />
            </div>
            <div className="hidden lg:flex flex-col gap-6">
              {/* Context Card */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4 text-primary font-bold text-sm uppercase tracking-wide">
                  <BookOpen className="w-4 h-4" />
                  <span>Active Context</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {documentContext ? (
                    <span className="text-foreground">{documentContext.substring(0, 300)}...</span>
                  ) : (
                    "No officical curriculum loaded. The AI is relying on its General Knowledge and any images you upload directly in the chat."
                  )}
                </p>
              </div>

              {/* Live Data Stream */}
              {lastRecord && (
                <div className="glass-card overflow-hidden h-fit">
                  <JsonPreview data={lastRecord} title="Live Data Sync" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- VIEW: DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-8 duration-700">
            {/* Premium Stat Card 1 */}
            <div className="relative overflow-hidden rounded-3xl p-8 text-white shadow-xl group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-indigo-600 transition-all duration-300 group-hover:scale-105" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                    <Clock className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">+12%</span>
                </div>
                <div className="text-5xl font-bold mb-2 tracking-tight">2.5<span className="text-2xl opacity-60">h</span></div>
                <div className="text-indigo-100 font-medium">Daily Study Time</div>
              </div>
            </div>

            {/* Premium Stat Card 2 */}
            <div className="glass-card p-8 group hover:border-primary/50">
              <div className="flex items-center justify-between mb-8">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                  <Activity className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full">Consistent</span>
              </div>
              <div className="text-5xl font-bold mb-2 tracking-tight text-foreground">85<span className="text-2xl opacity-40">%</span></div>
              <div className="text-muted-foreground font-medium">Concept Accuracy</div>
            </div>

            {/* Premium Stat Card 3 */}
            <div className="glass-card p-8 group hover:border-secondary/50">
              <div className="flex items-center justify-between mb-8">
                <div className="p-3 bg-sky-100 dark:bg-sky-500/10 text-secondary rounded-2xl">
                  <Zap className="w-6 h-6" />
                </div>
              </div>
              <div className="text-5xl font-bold mb-2 tracking-tight text-foreground">12</div>
              <div className="text-muted-foreground font-medium">Doubts Solved</div>
            </div>
          </div>
        )}

        {/* --- VIEW: LIBRARY / CURRICULUM --- */}
        {(activeTab === 'library' || activeTab === 'uploads') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in zoom-in-95 duration-500">
            <div className="glass-card p-8">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-primary" />
                Upload Reference Material
              </h3>
              <UploadZone onUploadComplete={handleCurriculumUpload} />
            </div>
          </div>
        )}

      </div>
    </CoachingLayout>
  );
}
