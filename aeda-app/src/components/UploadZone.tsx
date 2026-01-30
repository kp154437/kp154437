'use client';

import { useState } from 'react';
import { Upload, FileText, Loader2, CloudLightning } from 'lucide-react';
// import { processDocumentWithGemini } from '@/app/actions'; // Removed

interface UploadZoneProps {
    onUploadComplete: (result: any) => void;
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const processFile = async (file: File) => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            // Replaced Server Action with API Route
            const response = await fetch('/api/process-document', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok || result.error) {
                const errorMsg = result.error || response.statusText;
                console.error(errorMsg);
                alert("Error: " + errorMsg);
            } else {
                onUploadComplete(result);
            }
        } catch (e) {
            console.error("Upload failed", e);
            alert("Upload failed. Check console.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    return (
        <div
            className={`relative group border-2 border-dashed rounded-3xl p-16 transition-all duration-500 text-center overflow-hidden
        ${dragActive
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-slate-200 dark:border-white/10 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-white/5"
                }
      `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleChange}
                disabled={isProcessing}
                accept="application/pdf,image/png,image/jpeg"
            />

            {/* Animated Background Rings */}
            {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[300px] h-[300px] rounded-full border border-primary/20 animate-ping absolute opacity-20" />
                    <div className="w-[200px] h-[200px] rounded-full border border-primary/40 animate-ping absolute opacity-30 animation-delay-200" />
                </div>
            )}

            <div className="relative z-20 flex flex-col items-center justify-center space-y-6">
                <div className={`
             w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl
             ${isProcessing
                        ? "bg-white dark:bg-slate-800 scale-110"
                        : "bg-gradient-to-br from-primary to-indigo-600 text-white group-hover:scale-110 group-hover:rotate-3"
                    }
        `}>
                    {isProcessing ? (
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    ) : (
                        <CloudLightning className="w-8 h-8" />
                    )}
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-bold tracking-tight text-foreground">
                        {isProcessing ? "Analyzing Document..." : "Drop Curriculum Here"}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                        {isProcessing ? "Our AI is extracting text, diagrams, and mathematical formulas." : "Support for high-res PDF chapters, lecture slides, or handwritten notes."}
                    </p>
                </div>

                {!isProcessing && (
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-xs font-medium text-slate-500">PDF</span>
                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-xs font-medium text-slate-500">JPG</span>
                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-xs font-medium text-slate-500">PNG</span>
                    </div>
                )}
            </div>
        </div>
    );
}
