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
                            <TypewriterText text="Professional Toolkit" /> <br />
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

                {/* Right Content - Professional Glass Card */}
                <div className="relative h-[500px] w-full flex items-center justify-center lg:justify-end pr-0 lg:pr-10 perspective-[1000px]">
                    {/* Abstract Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/30 to-purple-500/30 blur-[80px] rounded-full transform scale-75 animate-pulse" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative w-[340px] md:w-[380px] bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-8 shadow-2xl shadow-indigo-500/10 flex flex-col gap-6"
                    >
                        {/* Profile Header */}
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/50 shadow-lg">
                                    <img src="/assets/testimonial_profile_real.png" alt="Developer" className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-green-500 p-1 rounded-full border-2 border-white dark:border-zinc-900">
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-primary">Sarah Jenkins</h3>
                                <p className="text-sm text-secondary">Product Manager @ TechCorp</p>
                                <div className="flex gap-0.5 mt-1 text-yellow-400">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                                </div>
                            </div>
                        </div>

                        {/* Testimonial Content */}
                        <div className="space-y-4">
                            <p className="text-primary/90 text-[15px] leading-relaxed font-medium">
                                "The privacy-first approach is exactly what our team needed. We can finally process sensitive documents without worrying about data leaving our devices. It's a game changer."
                            </p>

                            {/* Trust Badge */}
                            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-secondary/70 uppercase tracking-widest font-semibold">
                                <span>Verified User</span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    Active Now
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
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
