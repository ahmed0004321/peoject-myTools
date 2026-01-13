import React from 'react';
import { Star, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

// Brand colors for letter-by-letter coloring
const LETTER_COLORS = [
    '#10b981', // green
    '#ec4899', // pink
    '#eab308', // yellow
    '#06b6d4', // cyan
    '#f97316', // orange
    '#a855f7', // purple
    '#14b8a6', // teal
    '#84cc16', // lime
];

const TypewriterText = ({ text, className, delay = 0, colorful = false }: { text: string, className?: string, delay?: number, colorful?: boolean }) => {
    return (
        <span className={className}>
            {text.split('').map((char, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0, delay: delay + i * 0.05 }}
                    style={colorful && char !== ' ' ? { color: LETTER_COLORS[i % LETTER_COLORS.length] } : {}}
                >
                    {char}
                </motion.span>
            ))}
        </span>
    );
};


const HeroSection: React.FC = () => {
    return (
        <section className="relative w-full overflow-hidden bg-background text-primary pt-10 pb-20 px-4 md:px-8 max-w-7xl mx-auto min-h-screen flex flex-col">
            {/* Navbar Placeholder Removed - Layout handles Top Bar */}

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-10 md:mt-0">
                {/* Left Content */}
                <div className="space-y-8 z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <h1 className="font-display font-black text-4xl md:text-5xl lg:text-7xl uppercase leading-[0.9] tracking-tight">
                            <TypewriterText text="Professional Toolkit" colorful /> <br />
                            <TypewriterText text="Simplified." className="text-brand-yellow" delay={1.0} />
                        </h1>
                        <p className="text-xl md:text-2xl font-medium text-primary">
                            Privacy-first. Local-first. Blazing fast.
                        </p>
                    </motion.div >

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-primary text-lg max-w-md leading-relaxed"
                    >
                        Stop uploading your data to random servers. Resize images, merge PDFs, and secure files directly in your browser. No sign-up required.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <a href="#tools" className="inline-block bg-brand-yellow text-black dark:bg-zinc-800 dark:text-white font-black text-sm md:text-base px-8 py-4 rounded-full uppercase tracking-wider hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(234,179,8,0.3)] dark:shadow-[0_0_20px_rgba(255,255,255,0.1)] border-2 border-transparent dark:border-white/20">
                            Explore Tools
                        </a>
                    </motion.div>
                </div >

                {/* Right Content - Visual Stack */}
                < div className="relative h-[500px] w-full flex items-center justify-center lg:justify-end pr-0 lg:pr-10 perspective-[1000px]" >
                    {/* Back Card - Blue */}
                    < motion.div
                        initial={{ rotate: 15, x: 40 }}
                        animate={{ rotate: 12, x: 60 }}
                        className="absolute w-[280px] h-[400px] bg-brand-cyan rounded-2xl border-2 border-black -z-20"
                    />
                    {/* Back Card - Purple */}
                    < motion.div
                        initial={{ rotate: -5, x: 20 }}
                        animate={{ rotate: -8, x: 30 }}
                        className="absolute w-[280px] h-[400px] bg-brand-purple rounded-2xl border-2 border-black -z-10"
                    />

                    {/* Main Card - Green */}
                    < motion.div
                        initial={{ rotate: 0, scale: 0.9 }}
                        animate={{ rotate: 2, scale: 1 }}
                        transition={{ type: "spring", stiffness: 100 }}
                        className="relative w-[300px] h-[440px] bg-brand-green rounded-2xl border-3 border-black p-6 flex flex-col shadow-2xl skew-x-1"
                    >
                        {/* Profile Image Blob Mask */}
                        < div className="relative w-full flex justify-center mt-4" >
                            <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-black bg-brand-pink relative z-0">
                                <img src="/assets/testimonial_profile_real.png" alt="Developer" className="w-full h-full object-cover" />
                            </div>
                            {/* Badge */}
                            <div className="absolute -bottom-6 right-2 bg-brand-cream dark:bg-zinc-800 border-2 border-black rounded-lg p-3 shadow-[4px_4px_0px_#000] z-10 transform rotate-[-2deg] max-w-[180px]">
                                <p className="font-bold text-black dark:text-white">Sarah Jenkins</p>
                                <p className="text-xs text-black dark:text-gray-300">Product Manager</p>
                                <div className="flex gap-0.5 mt-1 text-brand-yellow">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} fill="currentColor" />)}
                                </div>
                            </div>
                        </div >

                        <div className="mt-auto mb-4 font-medium text-black text-sm text-center leading-relaxed">
                            "Finally, a PDF merger that doesn't upload my confidential contracts to a cloud server. OmniTools is my daily driver for secure document handling."
                        </div>
                    </motion.div >
                </div >
            </div >

            {/* Logo Strip */}
            < div className="mt-20 flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale pt-10 border-t border-border" >
                {
                    ['Adobe', 'DocuSign', 'Notion', 'Figma', 'Dropbox', 'Slack'].map(brand => (
                        <span key={brand} className="font-display font-bold text-xl md:text-2xl tracking-widest uppercase text-secondary/50">{brand}</span>
                    ))
                }
            </div >
        </section >
    );
};

export default HeroSection;
