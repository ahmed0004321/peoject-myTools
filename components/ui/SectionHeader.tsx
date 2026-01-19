import React from 'react';
import { motion } from 'framer-motion';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    badge?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, badge }) => {
    return (
        <div className="flex flex-col items-center justify-center text-center py-20 px-4 space-y-6">
            {/* Sticker Badge */}
            {badge && (
                <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="bg-brand-pink text-white font-display font-black text-xl md:text-2xl px-6 py-2 rounded-full border-4 border-white shadow-[0_0_0_3px_#000] rotate-[-5deg] transform mb-6 inline-block tracking-wider uppercase"
                >
                    {badge}
                </motion.div>
            )}

            <h2 className="font-display font-black text-5xl md:text-7xl uppercase text-primary max-w-4xl leading-[0.9]">
                {title}
            </h2>

            {subtitle && (
                <p className="text-secondary text-lg max-w-xl font-medium">
                    {subtitle}
                    <br />
                    <span className="opacity-60 text-sm">(and that learning budget is not going to spend itself)</span>
                </p>
            )}
        </div>
    );
};

export default SectionHeader;
