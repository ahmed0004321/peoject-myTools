import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Type, AlignLeft, Bot, Trash2, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TextFormatter: React.FC = () => {
    const [text, setText] = useState('');
    const [stats, setStats] = useState({ chars: 0, words: 0, lines: 0 });
    const [copied, setCopied] = useState(false);

    const updateText = (newText: string) => {
        setText(newText);
        setStats({
            chars: newText.length,
            words: newText.trim() === '' ? 0 : newText.trim().split(/\s+/).length,
            lines: newText === '' ? 0 : newText.split(/\n/).length
        });
    };

    const transform = (type: string) => {
        let res = text;
        switch (type) {
            case 'upper': res = text.toUpperCase(); break;
            case 'lower': res = text.toLowerCase(); break;
            case 'title': res = text.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); break;
            case 'sentence': res = text.toLowerCase().replace(/(^\w|\.\s+\w)/gm, c => c.toUpperCase()); break;
            case 'reverse': res = text.split('').reverse().join(''); break;
            case 'trim': res = text.trim().replace(/\s+/g, ' '); break;
            case 'lines': res = text.split('\n').sort().join('\n'); break;
        }
        updateText(res);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Text copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-[var(--text-primary)]"><Type className="text-[var(--accent-primary)]" /> Text Tools</h2>
                    <div className="text-xs text-[var(--text-secondary)] opacity-50 font-mono space-x-4">
                        <span>{stats.chars} chars</span>
                        <span>{stats.words} words</span>
                        <span>{stats.lines} lines</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    <Button onClick={() => transform('upper')} className="text-xs py-1 px-3">UPPER CASE</Button>
                    <Button onClick={() => transform('lower')} className="text-xs py-1 px-3">lower case</Button>
                    <Button onClick={() => transform('title')} className="text-xs py-1 px-3">Title Case</Button>
                    <Button onClick={() => transform('sentence')} className="text-xs py-1 px-3">Sentence case</Button>
                    <div className="w-px bg-[var(--border-color)] mx-2 h-8 self-center"></div>
                    <Button onClick={() => transform('trim')} variant="secondary" className="text-xs py-1 px-3">Trim Space</Button>
                    <Button onClick={() => transform('reverse')} variant="secondary" className="text-xs py-1 px-3">Reverse</Button>
                    <Button onClick={() => transform('lines')} variant="secondary" className="text-xs py-1 px-3">Sort Lines</Button>
                </div>

                <textarea
                    value={text}
                    onChange={(e) => updateText(e.target.value)}
                    className="w-full h-64 p-4 rounded-xl border border-[var(--border-color)] bg-inset focus:border-indigo-500 outline-none font-mono text-sm resize-y text-[var(--text-primary)] placeholder-[var(--text-secondary)]/30"
                    placeholder="Paste or type text here..."
                />

                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="danger" onClick={() => updateText('')}><Trash2 size={16} className="mr-2" /> Clear</Button>
                    <Button onClick={handleCopy}>
                        {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                        {copied ? 'Copied' : 'Copy Text'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};
export default TextFormatter;
