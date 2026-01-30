'use client';

import { CheckCircle2, Copy } from 'lucide-react';
import { useState } from 'react';

interface JsonPreviewProps {
    data: any;
    title?: string;
}

export function JsonPreview({ data, title = "AEDA Firestore Output" }: JsonPreviewProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-sm">
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{title}</span>
                </div>
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                    title="Copy JSON"
                >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>
            <div className="p-4 overflow-x-auto max-h-[500px] overflow-y-auto">
                <pre className="text-slate-800 dark:text-slate-300">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 flex justify-between items-center text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800">
                <span>Status: <span className="text-green-600 font-medium">READY FOR FIRESTORE</span></span>
                <span>Size: {JSON.stringify(data).length} bytes</span>
            </div>
        </div>
    );
}
