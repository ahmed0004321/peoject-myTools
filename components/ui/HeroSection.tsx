import React, { Suspense } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import AntigravityScene from './AntigravityScene';

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
        <section className="relative w-full overflow-hidden bg-background text-primary pt-10 pb-20 min-h-screen flex flex-col">
            {/* 3D Antigravity Scene Background */}
            <Suspense fallback={<div className="absolute inset-0 bg-background" />}>
                <AntigravityScene />
            </Suspense>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full flex-1 flex flex-col justify-center relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-10 md:mt-0">
                    {/* Left Content */}
                    <div className="space-y-8 z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <h1 className="font-display font-black text-4xl md:text-5xl lg:text-7xl uppercase leading-[0.9] tracking-tight text-shadow-xl backdrop-blur-[2px]">
                                <span className="relative inline-block">
                                    <TypewriterText text="Professional Toolkit" />
                                </span>
                                <br />
                                <span className="relative inline-block mt-2">
                                    <motion.span
                                        className="absolute -inset-4 rounded-lg opacity-30 blur-2xl bg-brand-yellow/50"
                                        animate={{
                                            opacity: [0.2, 0.4, 0.2],
                                            scale: [1, 1.1, 1],
                                        }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                    />
                                    <span className="relative z-10 text-brand-yellow drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                                        <TypewriterText text="Simplified." delay={1.0} />
                                    </span>
                                </span>
                            </h1>
                            <p className="text-xl md:text-2xl font-bold text-primary/90 bg-white/5 dark:bg-black/5 backdrop-blur-sm rounded-lg py-1 px-2 inline-block">
                                Privacy-first. Local-first. Blazing fast.
                            </p>
                        </motion.div >

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-primary text-lg max-w-md leading-relaxed backdrop-blur-[1px]"
                        >
                            Stop uploading your data to random servers. Resize images, merge PDFs, and secure files directly in your browser. No sign-up required.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <a href="#tools" className="group relative inline-flex items-center gap-2 overflow-hidden px-8 py-4 rounded-full bg-brand-yellow text-black dark:text-white font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(234,179,8,0.4)] border-2 border-white/20">
                                <span className="relative z-10">Explore Tools</span>
                                <motion.div
                                    className="absolute inset-0 bg-white/20 translate-x-[-100%]"
                                    whileHover={{ translateX: '100%' }}
                                    transition={{ duration: 0.5 }}
                                />
                            </a>
                        </motion.div>
                    </div >

                    {/* Right Content - RESTORED Testimonial Card */}
                    <div className="relative h-[500px] w-full flex items-center justify-center lg:justify-end pr-0 lg:pr-10 perspective-[1000px]">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                            whileHover={{
                                scale: 1.05,
                                rotateY: 5,
                                rotateX: -5,
                                transition: { duration: 0.3, ease: "easeOut" }
                            }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="relative w-[340px] md:w-[380px] bg-white/5 dark:bg-black/20 backdrop-blur-[25px] border border-white/20 dark:border-white/10 rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col gap-6 transform-gpu group cursor-default"
                            style={{
                                boxShadow: 'inset 0 0 40px rgba(255,255,255,0.05)',
                                transformStyle: 'preserve-3d',
                            }}
                        >
                            {/* Hover Shine Effect */}
                            <motion.div
                                className="absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                initial={false}
                            />

                            {/* Profile Header */}
                            <div className="flex items-center gap-4" style={{ transform: 'translateZ(30px)' }}>
                                <div className="relative">
                                    <motion.div
                                        className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/50 shadow-xl"
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                    >
                                        <img src="/assets/testimonial_profile_real.png" alt="Developer" className="w-full h-full object-cover" />
                                    </motion.div>
                                    <div className="absolute -bottom-1 -right-1 bg-green-500 p-1.5 rounded-full border-2 border-white/50">
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-primary tracking-tight">Sarah Jenkins</h3>
                                    <p className="text-sm text-secondary font-medium">Product Manager @ TechCorp</p>
                                    <div className="flex gap-0.5 mt-1 text-yellow-400">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <motion.div
                                                key={i}
                                                whileHover={{ scale: 1.3, rotate: 15 }}
                                                className="cursor-pointer"
                                            >
                                                <Star size={14} fill="currentColor" />
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Testimonial Content */}
                            <div className="space-y-4" style={{ transform: 'translateZ(20px)' }}>
                                <p className="text-primary/90 text-[16px] leading-relaxed font-medium italic group-hover:text-primary transition-colors">
                                    "The privacy-first approach is exactly what our team needed. We can finally process sensitive documents without worrying about data leaving our devices. It's a game changer."
                                </p>

                                {/* Trust Badge */}
                                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[10px] text-secondary/70 uppercase tracking-[0.2em] font-black">
                                    <motion.span whileHover={{ color: '#fff' }} className="transition-colors">Verified User</motion.span>
                                    <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
                                        Active Now
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div >

            </div>
        </section>
    );
};

export default HeroSection;
