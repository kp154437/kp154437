'use client';

import { useState } from 'react';
import {
    BookOpen,
    MessageSquare,
    LayoutDashboard,
    Settings,
    LogOut,
    Menu,
    X,
    UploadCloud,
    Sparkles
} from 'lucide-react';
import clsx from 'clsx';
import { UserRole } from '@/lib/aeda-protocol';

interface CoachingLayoutProps {
    children: React.ReactNode;
    currentRole: UserRole;
    onRoleChange: (role: UserRole) => void;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function CoachingLayout({
    children,
    currentRole,
    onRoleChange,
    activeTab,
    onTabChange
}: CoachingLayoutProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'ai-tutor', label: 'AI Tutor', icon: MessageSquare },
        { id: 'library', label: 'Curriculum', icon: BookOpen },
        { id: 'uploads', label: 'My Uploads', icon: UploadCloud, role: 'Student' },
    ];

    return (
        <div className="flex h-screen overflow-hidden text-foreground">

            {/* BACKGROUND ELEMENTS (Decorative) */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-float opacity-60" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-secondary/20 blur-[100px] rounded-full animate-float opacity-50" style={{ animationDelay: '2s' }} />
            </div>

            {/* Sidebar (Desktop) - Glass Effect */}
            <aside className="hidden md:flex w-72 flex-col p-4 z-20">
                <div className="h-full glass rounded-3xl flex flex-col p-5">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-2 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <Sparkles className="text-white w-5 h-5" />
                        </div>
                        <div>
                            <span className="font-bold text-xl tracking-tight block leading-none">Aspect<span className="text-primary">Ed</span></span>
                            <span className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase">Intelligence</span>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 space-y-2">
                        {navItems.map((item) => (
                            (!item.role || item.role === currentRole) && (
                                <button
                                    key={item.id}
                                    onClick={() => onTabChange(item.id)}
                                    className={clsx(
                                        "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300",
                                        activeTab === item.id
                                            ? "bg-primary text-white shadow-lg shadow-primary/30 scale-[1.02]"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-foreground"
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </button>
                            )
                        ))}
                    </nav>

                    {/* Footer / Role Switcher */}
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 space-y-4">
                        <div className="bg-slate-100 dark:bg-white/5 p-1 rounded-xl flex">
                            {['Student', 'Teacher'].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => onRoleChange(r as UserRole)}
                                    className={clsx(
                                        "flex-1 text-xs py-2 rounded-lg font-medium transition-all duration-300",
                                        currentRole === r
                                            ? "bg-white dark:bg-slate-800 text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>

                        <button className="w-full flex items-center justify-center gap-2 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 py-2 rounded-lg transition-colors">
                            <LogOut className="w-4 h-4" />
                            Disconnect
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative z-10">
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </div>
            </main>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-xl p-8 flex flex-col md:hidden animate-in fade-in">
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="self-end p-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-8"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <nav className="flex flex-col gap-4">
                        {navItems.map(item => (
                            (!item.role || item.role === currentRole) && (
                                <button
                                    key={item.id}
                                    onClick={() => { onTabChange(item.id); setMobileMenuOpen(false); }}
                                    className="text-xl font-medium p-4 bg-white/5 rounded-xl border border-white/10"
                                >
                                    {item.label}
                                </button>
                            )
                        ))}
                    </nav>
                </div>
            )}

            {/* Mobile Header Button */}
            {!mobileMenuOpen && (
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="md:hidden absolute top-4 right-4 p-3 glass rounded-full z-40"
                >
                    <Menu className="w-6 h-6" />
                </button>
            )}

        </div>
    );
}
