import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, LucideIcon } from 'lucide-react';

interface GlassNavItemProps {
    item: {
        name: string;
        path: string;
        icon: LucideIcon;
    };
    isActive: boolean;
    colorClass?: string;
}

const GlassNavItem: React.FC<GlassNavItemProps> = ({ item, isActive }) => {
    return (
        <Link
            to={item.path}
            className="block relative group outline-none"
        >
            {/* --- Glass Container (Track) --- */}
            <div
                className={`
          relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 overflow-hidden
          border border-white/10
          ${isActive
                        ? 'bg-white/10 dark:bg-black/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-md border-t-white/20 border-l-white/20'
                        : 'bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 backdrop-blur-sm border-transparent hover:border-white/5'
                    }
        `}
                style={{
                    boxShadow: isActive
                        ? 'inset 0 0 20px rgba(255,255,255,0.05), 0 4px 6px rgba(0,0,0,0.1)'
                        : 'none'
                }}
            >
                {/* Active Glow/Reflection Background */}
                {isActive && (
                    <motion.div
                        layoutId="glass-glow"
                        className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-blue-600/10 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    />
                )}

                {/* --- Knob / Floating Droplet (Icon Container) --- */}
                <div className="relative z-10">
                    <motion.div
                        className={`
              w-8 h-8 rounded-full flex items-center justify-center
              border border-white/20
              backdrop-blur-md shadow-sm
              ${isActive ? 'bg-cyan-400/20 text-cyan-100 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'bg-white/10 text-white/50 group-hover:bg-white/20 group-hover:text-white'}
            `}
                        animate={{
                            scale: isActive ? 1.1 : 1,
                            // "Liquid" squash/stretch effect could be added here
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                        {/* Specular Highlight on Knob */}
                        <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white/40 blur-[1px]" />

                        <item.icon size={16} strokeWidth={2.5} />
                    </motion.div>
                </div>

                {/* --- Text Content --- */}
                <div className="relative z-10 flex-1">
                    <span
                        className={`
              font-display tracking-wide text-sm font-medium transition-colors duration-300
              ${isActive ? 'text-white drop-shadow-md' : 'text-zinc-400 group-hover:text-zinc-200'}
            `}
                    >
                        {item.name}
                    </span>
                </div>

                {/* --- Chevron (Indicator) --- */}
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative z-10 text-cyan-200/70"
                    >
                        <ChevronRight size={14} />
                    </motion.div>
                )}

                {/* Subtle distortion mesh (simulated with gradient) */}
                <div className="absolute inset-0 z-0 opacity-20 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
            </div>
        </Link>
    );
};

export default GlassNavItem;
