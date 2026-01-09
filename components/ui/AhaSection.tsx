import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Zap, Wrench, Shield, PenTool, Box } from 'lucide-react';

const AhaSection: React.FC = () => {
    return (
        <section className="py-20 px-4 md:px-8 max-w-5xl mx-auto flex flex-col items-center text-center space-y-12">
            {/* Dynamic Toolkit Animation */}
            <div className="relative w-full max-w-[600px] h-[400px] flex items-center justify-center perspective-[1000px]">

                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple/20 via-transparent to-brand-yellow/20 blur-3xl opacity-50 rounded-full" />

                {/* Orbiting Tools */}
                {[
                    { Icon: Settings, color: "text-brand-cyan", delay: 0, x: -120, y: -60 },
                    { Icon: Zap, color: "text-brand-yellow", delay: 1, x: 120, y: -80 },
                    { Icon: Shield, color: "text-brand-green", delay: 2, x: -100, y: 80 },
                    { Icon: PenTool, color: "text-brand-pink", delay: 3, x: 100, y: 60 },
                    { Icon: Wrench, color: "text-brand-orange", delay: 1.5, x: 0, y: -130 },
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{
                            opacity: 1,
                            scale: 1,
                            x: item.x,
                            y: item.y,
                        }}
                        transition={{
                            type: "spring",
                            delay: i * 0.1,
                            duration: 0.8
                        }}
                        className={`absolute z-10 p-4 bg-[var(--bg-secondary)] border-2 border-black rounded-xl shadow-[4px_4px_0px_#000] ${item.color}`}
                    >
                        <motion.div
                            animate={{
                                y: [0, -10, 0],
                                rotate: [0, 10, -10, 0]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                repeatType: "reverse",
                                delay: item.delay
                            }}
                        >
                            <item.Icon size={32} strokeWidth={2.5} />
                        </motion.div>
                    </motion.div>
                ))}

                {/* Central Toolkit Box */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 1 }}
                    className="relative z-20 w-32 h-32 bg-black text-white rounded-2xl border-4 border-[var(--accent-primary)] flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.3)]"
                >
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Box size={64} strokeWidth={2} />
                    </motion.div>

                    {/* Floating Particles */}
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 bg-[var(--accent-primary)] rounded-full"
                            animate={{
                                x: [0, (Math.random() - 0.5) * 150],
                                y: [0, (Math.random() - 0.5) * 150],
                                opacity: [1, 0]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.2
                            }}
                        />
                    ))}
                </motion.div>

            </div>

            {/* Text Content */}
            <div className="space-y-6 max-w-3xl">
                <p className="text-secondary text-sm font-bold uppercase tracking-widest">
                    Optimize your workflow
                </p>

                <h2 className="font-display font-medium text-3xl md:text-5xl leading-tight text-primary">
                    Most tools engage in "subscription fatigue", charging you monthly for simple utilities. <span className="text-brand-pink block md:inline font-bold">We believe in free, local tools.</span>
                </h2>

                <p className="text-secondary text-lg leading-relaxed max-w-2xl mx-auto">
                    We don't upload your data. We don't track your keystrokes. We provide professional-grade utilities that run entirely in your browser, keeping your workflow fast, secure, and private.
                </p>
            </div>



            {/* Footer Link */}
            <p className="text-secondary pt-10">
                Not convinced? <a href="#" className="text-brand-yellow hover:underline">Read some reviews</a>
            </p>
        </section>
    );
};

export default AhaSection;
