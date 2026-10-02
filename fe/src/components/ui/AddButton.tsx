import React from 'react';
import { Plus } from 'lucide-react';

interface AddButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label: string;
}

export default function AddButton({ label, className = '', ...props }: AddButtonProps) {
    return (
        <button
            className={`flex-1 md:flex-none px-8 py-3 bg-gradient-to-br from-primary-400 to-primary-600 hover:from-primary-500 hover:to-primary-700 text-white font-headline font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary-500/20 transition-all active:scale-95 border-t border-white/10 text-xs flex items-center justify-center gap-2 cursor-pointer ${className}`}
            {...props}
        >
            <Plus size={16} />
            {label}
        </button>
    );
}
