
import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, ShieldCheck, Check, ArrowLeft } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';

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
        if (strength <= 2) return 'bg-red-500';
        if (strength <= 4) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    const strengthText = () => {
        if (strength <= 2) return 'Weak';
        if (strength <= 4) return 'Good';
        return 'Strong';
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Link to="/" className="inline-flex items-center text-[var(--text-secondary)] hover:text-[var(--accent-primary)] mb-6 transition-colors">
                <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
            </Link>

            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Secure PassGen</h1>
                <p className="text-[var(--text-secondary)] mt-2">Generate encryption-grade passwords instantly.</p>
            </div>

            <Card className="p-0 overflow-hidden shadow-xl shadow-indigo-100/10 border-[var(--border-color)]">
                <div className="p-12 bg-black text-white text-center relative group overflow-hidden border-b border-[var(--border-color)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-transparent opacity-50"></div>
                    <div className="text-4xl font-mono tracking-wider break-all mb-8 font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-white selection:bg-indigo-500 selection:text-white">
                        {password}
                    </div>

                    <div className="flex justify-center gap-4 relative z-10">
                        <Button
                            variant="ghost"
                            onClick={generate}
                            className="bg-white/10 hover:bg-white/20 text-white border-0"
                            title="Regenerate"
                        >
                            <RefreshCw size={20} className="mr-2" /> Regenerate
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => { navigator.clipboard.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                            className={`transition-all duration-300 ${copied ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-900/20' : ''}`}
                            title="Copy"
                        >
                            {copied ? <><Check size={20} className="mr-2" /> Copied!</> : <><Copy size={20} className="mr-2" /> Copy Password</>}
                        </Button>
                    </div>

                    {/* Strength Meter */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/5">
                        <div className={`h-full transition-all duration-500 ease-out ${strengthColor()} shadow-[0_-2px_10px_rgba(255,255,255,0.2)]`} style={{ width: `${(strength / 5) * 100}%` }}></div>
                    </div>
                </div>

                <div className="p-8 space-y-8 bg-[var(--bg-secondary)]/80 backdrop-blur-md">
                    <div className="flex items-center justify-between p-4 bg-inset rounded-xl border border-[var(--border-color)]">
                        <span className="font-semibold text-[var(--text-secondary)] flex items-center gap-2">
                            <ShieldCheck size={18} /> Security Level
                        </span>
                        <span className={`font-bold uppercase tracking-wider text-xs px-3 py-1 rounded-full ${strength <= 2 ? 'bg-red-500/10 text-red-500' : strength <= 4 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                            {strengthText()}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <span>Length</span>
                            <span className="text-indigo-600 dark:text-indigo-400">{length} characters</span>
                        </div>
                        <input
                            type="range"
                            min="6" max="32"
                            value={length}
                            onChange={(e) => setLength(Number(e.target.value))}
                            className="w-full h-1.5 bg-inset rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { label: 'Uppercase', checked: includeUpper, setter: setIncludeUpper, char: 'A-Z' },
                            { label: 'Numbers', checked: includeNums, setter: setIncludeNums, char: '0-9' },
                            { label: 'Symbols', checked: includeSyms, setter: setIncludeSyms, char: '!@#' },
                        ].map((opt) => (
                            <label key={opt.label} className={`flex flex-col items-center gap-2 p-4 border rounded-xl cursor-pointer transition-all duration-200 ${opt.checked ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/10 shadow-sm' : 'border-[var(--border-color)] bg-inset hover:bg-white/5'}`}>
                                <div className="flex justify-between w-full items-center mb-1">
                                    <span className="text-sm font-bold text-[var(--text-primary)]">{opt.label}</span>
                                    <input type="checkbox" checked={opt.checked} onChange={(e) => opt.setter(e.target.checked)} className="w-4 h-4 accent-indigo-600 rounded" />
                                </div>
                                <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{opt.char}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default PasswordTool;

