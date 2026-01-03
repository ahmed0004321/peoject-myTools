import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Plus, Trash, Copy, Eye, EyeOff, Lock, Search, Save, X, Key } from 'lucide-react';

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
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Password Vault</h1>
                    <p className="text-[var(--text-secondary)] opacity-60">Securely store your passwords locally in your browser.</p>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2">
                    {isAdding ? <X size={18} /> : <Plus size={18} />}
                    {isAdding ? 'Cancel' : 'Add New'}
                </Button>
            </div>

            {isAdding && (
                <Card className="bg-inset border-[var(--border-color)]">
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[var(--text-secondary)] opacity-50 uppercase">Website / App</label>
                            <input
                                className="w-full p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:border-indigo-500 outline-none transition-all"
                                placeholder="e.g. Google"
                                value={site}
                                onChange={e => setSite(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[var(--text-secondary)] opacity-50 uppercase">Username (Optional)</label>
                            <input
                                className="w-full p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:border-indigo-500 outline-none transition-all"
                                placeholder="user@email.com"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[var(--text-secondary)] opacity-50 uppercase">Password</label>
                            <div className="relative">
                                <input
                                    className="w-full p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:border-indigo-500 outline-none pr-10 transition-all font-mono"
                                    placeholder="********"
                                    type="text"
                                    value={pass}
                                    onChange={e => setPass(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="md:col-span-3 flex justify-end mt-2">
                            <Button onClick={handleAdd} disabled={!site || !pass} className="bg-emerald-600 hover:bg-emerald-700 border-0 shadow-lg shadow-emerald-900/10">
                                <Save size={18} className="mr-2" /> Save Entry
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] opacity-40" size={18} />
                <input
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-[var(--border-color)] bg-inset text-[var(--text-primary)] focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder-[var(--text-secondary)]/30"
                    placeholder="Search stored passwords..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filtered.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <Lock size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No passwords stored yet.</p>
                    </div>
                ) : (
                    filtered.map(entry => (
                        <Card key={entry.id} className="hover:shadow-md transition-shadow">
                            <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)] font-bold shrink-0 shadow-sm">
                                        {entry.site.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="font-bold text-[var(--text-primary)] truncate">{entry.site}</h3>
                                        {entry.username && <p className="text-sm text-[var(--text-secondary)] opacity-50 truncate">{entry.username}</p>}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full md:w-auto bg-inset border border-[var(--border-color)] p-2 rounded-xl justify-between md:justify-start">
                                    <div className="font-mono text-sm relative px-2">
                                        {showPass[entry.id] ? (
                                            <span className="text-[var(--text-primary)]">{entry.pass}</span>
                                        ) : (
                                            <span className="text-[var(--text-secondary)] opacity-20 tracking-widest">••••••••••••</span>
                                        )}
                                    </div>
                                    <button onClick={() => toggleShow(entry.id)} className="text-[var(--text-secondary)] hover:text-indigo-400 p-2 transition-colors">
                                        {showPass[entry.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                    <button onClick={() => copyToClipboard(entry.pass)} className="text-[var(--text-secondary)] hover:text-green-400 p-2 transition-colors" title="Copy Password">
                                        <Copy size={16} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                                    <button onClick={() => handleDelete(entry.id)} className="text-[var(--text-secondary)] opacity-30 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-all">
                                        <Trash size={18} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
export default PasswordManager;
