import React from 'react';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ToolCardProps {
    name: string;
    description: string;
    icon: LucideIcon;
    path: string;
    color: string; // Hex or Tailwind class
    textColor?: string;
}

const ToolCard: React.FC<ToolCardProps> = ({ name, description, icon: Icon, path, color, textColor = 'text-black' }) => {
    return (
        <Link to={path} className="block group">
            <motion.article
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, boxShadow: '5px 5px 0px rgba(0,0,0,1)' }}
                style={{ backgroundColor: color }}
                className={`relative h-full p-8 rounded-xl border-3 border-black flex flex-col justify-between min-h-[320px] transition-all duration-200`}
            >
                {/* Top Icon */}
                <div className="mb-6">
                    <div className="w-12 h-12 flex items-center justify-center">
                        <Icon size={48} className={textColor} strokeWidth={1.5} />
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <h3 className={`font-display font-black text-3xl uppercase tracking-tighter leading-none ${textColor}`}>
                        {name}
                    </h3>
                    <p className={`font-medium text-lg leading-snug ${textColor === 'text-white' ? 'text-white/90' : 'text-black/80'}`}>
                        {description}
                    </p>
                </div>

                {/* Footer Link */}
                <div className={`mt-8 font-bold text-sm uppercase tracking-wider flex items-center gap-2 group-hover:gap-4 transition-all ${textColor}`}>
                    Learn More <ArrowRight size={16} />
                </div>
            </motion.article>
        </Link>
    );
};

export default ToolCard;
