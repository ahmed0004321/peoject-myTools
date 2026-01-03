import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ className, label, icon, ...props }) => {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">{label}</label>}
            <div className="relative group">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    className={cn(
                        'w-full bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 text-slate-700 outline-none transition-all duration-200',
                        'focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100',
                        'placeholder:text-slate-400',
                        icon && 'pl-10',
                        className
                    )}
                    {...props}
                />
            </div>
        </div>
    );
};

export default Input;
