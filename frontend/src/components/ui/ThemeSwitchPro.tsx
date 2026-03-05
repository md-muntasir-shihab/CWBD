import { Moon, Sun } from 'lucide-react';

type ThemeSwitchProProps = {
    checked: boolean;
    onToggle: () => void;
    className?: string;
};

export default function ThemeSwitchPro({ checked, onToggle, className = '' }: ThemeSwitchProProps) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-label="Toggle dark mode"
            aria-pressed={checked}
            className={`group relative inline-flex h-10 w-[88px] items-center rounded-full border border-slate-300/60 bg-sky-500/80 p-1 shadow-inner transition-all duration-500 dark:border-white/15 dark:bg-slate-900 ${className}`}
        >
            <div className={`absolute inset-0 rounded-full transition-opacity duration-500 ${checked ? 'opacity-100' : 'opacity-0'} bg-[radial-gradient(circle_at_20%_30%,rgba(148,163,184,0.4),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.25),transparent_40%)]`} />
            <div className={`absolute left-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white/80 transition-all duration-500 ${checked ? 'opacity-100' : 'opacity-0'}`} />
            <div className={`absolute left-7 top-[30%] h-1 w-1 rounded-full bg-white/70 transition-all duration-500 ${checked ? 'opacity-100' : 'opacity-0'}`} />
            <div className={`absolute right-2 top-1/2 h-4 w-8 -translate-y-1/2 rounded-full bg-white/70 shadow-sm transition-all duration-500 ${checked ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100'}`} />
            <span
                className={`relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full shadow-lg transition-all duration-500 ${checked
                    ? 'translate-x-[44px] bg-slate-200 text-slate-700'
                    : 'translate-x-0 bg-yellow-300 text-amber-700'
                    }`}
            >
                {checked ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </span>
        </button>
    );
}
