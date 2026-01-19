
import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, ShieldCheck, Check, ArrowLeft, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionHeader from '../components/ui/SectionHeader';

const PasswordTool: React.FC = () => {
    const [password, setPassword] = useState("");
    const [length, setLength] = useState(16);
    const [includeUpper, setIncludeUpper] = useState(true);
    const [includeNums, setIncludeNums] = useState(true);
    const [includeSyms, setIncludeSyms] = useState(true);
    const [strength, setStrength] = useState(0);
    const [copied, setCopied] = useState(false);

    const generate = () => {
        const lower = "abcdefghijklmnopqrstuvwxyz";
        const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const nums = "0123456789";
        const syms = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

        let chars = lower;
        if (includeUpper) chars += upper;
        if (includeNums) chars += nums;
        if (includeSyms) chars += syms;

        let pass = "";
        for (let i = 0; i < length; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPassword(pass);
    };

    useEffect(() => {
        generate();
    }, [length, includeUpper, includeNums, includeSyms]);

    // Simple strength check
    useEffect(() => {
        let s = 0;
        if (password.length > 8) s += 1;
        if (password.length > 12) s += 1;
        if (/[A-Z]/.test(password)) s += 1;
        if (/[0-9]/.test(password)) s += 1;
        if (/[^A-Za-z0-9]/.test(password)) s += 1;
        setStrength(s);
    }, [password]);

    const strengthColor = () => {
        if (strength <= 2) return 'bg-rose-500';
        if (strength <= 4) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    const strengthText = () => {
        if (strength <= 2) return 'Weak';
        if (strength <= 4) return 'Good';
        return 'Strong';
    };

    return (
        <div className="min-h-screen bg-background pb-20 animate-fade-in text-primary">
            <SectionHeader
                title="Secure PassGen"
                subtitle="Generate encryption-grade passwords instantly."
                badge="Generator"
            />

            <div className="max-w-2xl mx-auto px-4 mt-8">
                <div className="bg-surface border border-border rounded-3xl shadow-xl overflow-hidden animate-slide-up">
                    <div className="p-12 bg-black relative group overflow-hidden border-b border-border">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/20 to-transparent opacity-50"></div>
                        <div className="text-4xl font-mono tracking-wider break-all mb-8 font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-white selection:bg-brand-purple selection:text-white">
                            {password}
                        </div>

                        <div className="flex justify-center gap-4 relative z-10">
                            <button
                                onClick={generate}
                                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold backdrop-blur-sm transition-all flex items-center gap-2"
                                title="Regenerate"
                            >
                                <RefreshCw size={20} /> Regenerate
                            </button>
                            <button
                                onClick={() => { navigator.clipboard.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                                className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg ${copied ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-white text-black hover:bg-indigo-50'}`}
                                title="Copy"
                            >
                                {copied ? <><Check size={20} /> Copied!</> : <><Copy size={20} /> Copy Password</>}
                            </button>
                        </div>

                        {/* Strength Meter */}
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
                            <div className={`h-full transition-all duration-500 ease-out ${strengthColor()} shadow-[0_-2px_10px_rgba(255,255,255,0.5)]`} style={{ width: `${(strength / 5) * 100}%` }}></div>
                        </div>
                    </div>

                    <div className="p-8 space-y-8 bg-surface">
                        <div className="flex items-center justify-between p-4 bg-inset rounded-xl border border-border">
                            <span className="font-bold text-secondary flex items-center gap-2 text-sm uppercase">
                                <ShieldCheck size={18} /> Security Level
                            </span>
                            <span className={`font-bold uppercase tracking-wider text-xs px-3 py-1 rounded-full ${strength <= 2 ? 'bg-rose-500/10 text-rose-500' : strength <= 4 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                {strengthText()}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs font-bold text-secondary uppercase tracking-widest">
                                <span>Length</span>
                                <span className="text-brand-purple">{length} characters</span>
                            </div>
                            <input
                                type="range"
                                min="6" max="32"
                                value={length}
                                onChange={(e) => setLength(Number(e.target.value))}
                                className="w-full h-2 bg-inset rounded-lg appearance-none cursor-pointer accent-brand-purple hover:accent-purple-600 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: 'Uppercase', checked: includeUpper, setter: setIncludeUpper, char: 'A-Z' },
                                { label: 'Numbers', checked: includeNums, setter: setIncludeNums, char: '0-9' },
                                { label: 'Symbols', checked: includeSyms, setter: setIncludeSyms, char: '!@#' },
                            ].map((opt) => (
                                <label key={opt.label} className={`flex flex-col items-center gap-2 p-4 border rounded-xl cursor-pointer transition-all duration-200 group ${opt.checked ? 'border-brand-purple bg-brand-purple/5 shadow-sm' : 'border-border bg-inset hover:bg-inset/80'}`}>
                                    <div className="flex justify-between w-full items-center mb-1">
                                        <span className="text-sm font-bold text-primary group-hover:text-brand-purple transition-colors">{opt.label}</span>
                                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${opt.checked ? 'bg-brand-purple text-white' : 'bg-surface border border-border'}`}>
                                            {opt.checked && <Check size={12} />}
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono text-secondary opacity-50">{opt.char}</span>
                                    <input type="checkbox" checked={opt.checked} onChange={(e) => opt.setter(e.target.checked)} className="hidden" />
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PasswordTool;
