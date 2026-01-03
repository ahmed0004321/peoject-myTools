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
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Password Vault</h1>
                    <p className="text-slate-500">Securely store your passwords locally in your browser.</p>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2">
                    {isAdding ? <X size={18} /> : <Plus size={18} />}
                    {isAdding ? 'Cancel' : 'Add New'}
                </Button>
            </div>

            {isAdding && (
                <Card className="bg-indigo-50/50 border-indigo-100">
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Website / App</label>
                            <input
                                className="w-full p-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none"
                                placeholder="e.g. Google"
                                value={site}
                                onChange={e => setSite(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Username (Optional)</label>
                            <input
                                className="w-full p-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none"
                                placeholder="user@email.com"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                            <div className="relative">
                                <input
                                    className="w-full p-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none pr-10"
                                    placeholder="********"
                                    type="text"
                                    value={pass}
                                    onChange={e => setPass(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="md:col-span-3 flex justify-end mt-2">
                            <Button onClick={handleAdd} disabled={!site || !pass} className="bg-green-600 hover:bg-green-700">
                                <Save size={18} className="mr-2" /> Save Entry
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none"
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
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0">
                                        {entry.site.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="font-bold text-slate-800 truncate">{entry.site}</h3>
                                        {entry.username && <p className="text-sm text-slate-500 truncate">{entry.username}</p>}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full md:w-auto bg-slate-50 p-2 rounded-lg justify-between md:justify-start">
                                    <div className="font-mono text-sm relative">
                                        {showPass[entry.id] ? (
                                            <span className="text-slate-700">{entry.pass}</span>
                                        ) : (
                                            <span className="text-slate-400">••••••••••••</span>
                                        )}
                                    </div>
                                    <button onClick={() => toggleShow(entry.id)} className="text-slate-400 hover:text-indigo-600 p-1">
                                        {showPass[entry.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                    <button onClick={() => copyToClipboard(entry.pass)} className="text-slate-400 hover:text-green-600 p-1" title="Copy Password">
                                        <Copy size={16} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                                    <button onClick={() => handleDelete(entry.id)} className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors">
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
