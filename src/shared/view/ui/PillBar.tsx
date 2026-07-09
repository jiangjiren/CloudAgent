import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

/* ── Container ─────────────────────────────────────────────────── */
type PillBarProps = {
  children: ReactNode;
  className?: string;
};

export function PillBar({ children, className }: PillBarProps) {
  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-slate-200/60 p-1 shadow-inner dark:bg-slate-800/60 backdrop-blur-md', 
        className
      )}
    >
      {children}
    </div>
  );
}

/* ── Individual pill button ────────────────────────────────────── */
type PillProps = {
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
};

export function Pill({ isActive, onClick, children, className }: PillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex z-10 touch-manipulation items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-300 ease-out',
        isActive
          ? 'bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:bg-slate-700 dark:text-slate-100'
          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
        className,
      )}
    >
      {children}
    </button>
  );
}
