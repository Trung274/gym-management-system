import React from 'react';

interface AddButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label: string;
}

export default function AddButton({ label, className = '', ...props }: AddButtonProps) {
    return (
        <button
            className={`flex-1 md:flex-none px-8 py-3 bg-gradient-to-br from-primary-400 to-primary-600 hover:from-primary-500 hover:to-primary-700 text-white font-headline font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary-500/20 transition-all active:scale-95 border-t border-white/10 text-xs flex items-center justify-center gap-2 cursor-pointer ${className}`}
            {...props}
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {label}
        </button>
    );
}
