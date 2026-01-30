'use client';

import clsx from 'clsx';
import { UserRole } from '@/lib/aeda-protocol';
import { GraduationCap, School } from 'lucide-react';

interface RoleSwitcherProps {
    currentRole: UserRole;
    onRoleChange: (role: UserRole) => void;
}

export function RoleSwitcher({ currentRole, onRoleChange }: RoleSwitcherProps) {
    return (
        <div className="flex items-center space-x-1 bg-secondary/20 p-1 rounded-lg border border-secondary/30">
            <button
                onClick={() => onRoleChange('Teacher')}
                className={clsx(
                    "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    currentRole === 'Teacher'
                        ? "bg-white text-secondary-900 shadow-sm dark:bg-slate-700 dark:text-white"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
            >
                <School className="w-4 h-4" />
                <span>Teacher Mode</span>
            </button>
            <button
                onClick={() => onRoleChange('Student')}
                className={clsx(
                    "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    currentRole === 'Student'
                        ? "bg-white text-secondary-900 shadow-sm dark:bg-slate-700 dark:text-white"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
            >
                <GraduationCap className="w-4 h-4" />
                <span>Student Mode</span>
            </button>
        </div>
    );
}
