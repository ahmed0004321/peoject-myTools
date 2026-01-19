import React, { useState, useEffect } from 'react';
import { Plus, Trash, Copy, Eye, EyeOff, Lock, Search, Save, X, Key, Shield, User } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';

interface PasswordEntry {
    id: string;
    site: string;
    username: string;
    pass: string;
    created: number;
}

const PasswordManager: React.FC = () => {
    const [entries, setEntries] = useState<PasswordEntry[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPass, setShowPass] = useState<Record<string, boolean>>({});

    // Form state
    const [site, setSite] = useState('');
    const [username, setUsername] = useState('');
    const [pass, setPass] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('omnitools_passwords');
        if (saved) {
            try {
                setEntries(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse passwords", e);
            }
        }
    }, []);

    const saveEntries = (newEntries: PasswordEntry[]) => {
        setEntries(newEntries);
        localStorage.setItem('omnitools_passwords', JSON.stringify(newEntries));
    };

    const handleAdd = () => {
        if (!site || !pass) return;
        const newEntry: PasswordEntry = {
            id: crypto.randomUUID(),
            site,
            username,
            pass,
            created: Date.now()
        };
        saveEntries([newEntry, ...entries]);
        setSite('');
        setUsername('');
        setPass('');
        setIsAdding(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this password?')) {
            saveEntries(entries.filter(e => e.id !== id));
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could show toast
    };

    const toggleShow = (id: string) => {
        setShowPass(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const filtered = entries.filter(e =>
        e.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background pb-20 animate-fade-in">
            <SectionHeader
                title="Password Vault"
                subtitle="Securely store your credentials locally in your browser."
                badge="Local Only"
            />

            <div className="max-w-4xl mx-auto px-4 mt-8">
                <div className="flex justify-end mb-6">
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg ${isAdding ? 'bg-surface text-secondary hover:text-primary' : 'bg-brand-purple text-white hover:bg-purple-600 hover:scale-105 shadow-purple-500/20'}`}
                    >
                        {isAdding ? <X size={20} /> : <Plus size={20} />}
                        {isAdding ? 'Cancel' : 'Add New Password'}
                    </button>
                </div>

                {isAdding && (
                    <div className="bg-surface border border-border rounded-3xl shadow-xl p-6 mb-8 animate-slide-up">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Website / App</label>
                                <div className="relative">
                                    <Shield size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                                    <input
                                        className="w-full pl-10 p-3 rounded-xl border border-border bg-inset text-primary focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple outline-none transition-all"
                                        placeholder="e.g. Google"
                                        value={site}
                                        onChange={e => setSite(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Username (Optional)</label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                                    <input
                                        className="w-full pl-10 p-3 rounded-xl border border-border bg-inset text-primary focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple outline-none transition-all"
                                        placeholder="user@email.com"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Password</label>
                                <div className="relative">
                                    <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                                    <input
                                        className="w-full pl-10 p-3 rounded-xl border border-border bg-inset text-primary focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple outline-none transition-all font-mono"
                                        placeholder="********"
                                        type="text"
                                        value={pass}
                                        onChange={e => setPass(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-3 flex justify-end">
                                <button
                                    onClick={handleAdd}
                                    disabled={!site || !pass}
                                    className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all hover:scale-105 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                                >
                                    <Save size={18} /> Save Entry
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={20} />
                    <input
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border bg-surface text-primary focus:ring-2 focus:ring-brand-purple/50 outline-none transition-all placeholder:text-secondary/50 shadow-sm font-medium"
                        placeholder="Search stored passwords..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {filtered.length === 0 ? (
                        <div className="text-center py-20 text-secondary bg-surface/50 rounded-3xl border border-border/50 border-dashed">
                            <Lock size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="font-bold">No passwords found.</p>
                            <p className="text-sm opacity-60">Add a new entry to get started.</p>
                        </div>
                    ) : (
                        filtered.map(entry => (
                            <div key={entry.id} className="bg-surface border border-border rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all hover:border-brand-purple/30 group">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-purple to-indigo-600 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-lg shadow-brand-purple/20">
                                            {entry.site.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="overflow-hidden min-w-0">
                                            <h3 className="font-bold text-primary truncate text-lg">{entry.site}</h3>
                                            {entry.username && <p className="text-sm text-secondary truncate flex items-center gap-1"><User size={12} /> {entry.username}</p>}
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto bg-inset/50 hover:bg-inset border border-border p-2 rounded-xl justify-between md:justify-start transition-colors">
                                        <div className="font-mono text-sm relative px-4 flex-1 md:flex-initial text-center md:text-left min-w-[150px]">
                                            {showPass[entry.id] ? (
                                                <span className="text-primary break-all">{entry.pass}</span>
                                            ) : (
                                                <span className="text-secondary opacity-30 tracking-[0.2em] font-bold text-lg">••••••••</span>
                                            )}
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <button
                                                onClick={() => toggleShow(entry.id)}
                                                className="p-2 rounded-lg hover:bg-surface text-secondary hover:text-brand-purple transition-colors"
                                            >
                                                {showPass[entry.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                            <button
                                                onClick={() => copyToClipboard(entry.pass)}
                                                className="p-2 rounded-lg hover:bg-surface text-secondary hover:text-emerald-500 transition-colors"
                                                title="Copy Password"
                                            >
                                                <Copy size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                                        <button
                                            onClick={() => handleDelete(entry.id)}
                                            className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            title="Delete Entry"
                                        >
                                            <Trash size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default PasswordManager;
