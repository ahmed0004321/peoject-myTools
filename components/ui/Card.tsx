import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CardProps extends HTMLMotionProps<"div"> {
    hoverEffect?: boolean;
}

const Card: React.FC<CardProps> = ({ className, children, hoverEffect = false, ...props }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={hoverEffect ? { y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" } : {}}
            className={cn(
                'bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-[var(--border-color)] rounded-2xl shadow-sm p-6',
                hoverEffect && 'cursor-pointer hover:border-indigo-200/50 transition-colors',
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default Card;
