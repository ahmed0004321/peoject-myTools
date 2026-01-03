import React, { useState } from 'react';
import Card from '../components/ui/Card';
import ReactMarkdown from 'react-markdown';
import { FileText } from 'lucide-react';

const MarkdownPreview: React.FC = () => {
    const [input, setInput] = useState('# Hello Markdown\n\nStart typing to see the **preview** instantly.');

    return (
        <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col">
            <div className="mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2 px-2 text-[var(--text-primary)]"><FileText className="text-[var(--accent-primary)]" /> Markdown Live Preview</h2>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                <Card className="flex flex-col h-full bg-inset p-0 overflow-hidden border-2 border-[var(--border-color)] focus-within:border-indigo-500 transition-colors">
                    <div className="bg-[var(--bg-secondary)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] opacity-50 border-b border-[var(--border-color)] uppercase">Input</div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 w-full p-6 outline-none resize-none font-mono text-sm bg-transparent text-[var(--text-primary)] placeholder-[var(--text-secondary)]/20"
                        placeholder="Type markdown here..."
                    />
                </Card>

                <Card className="flex flex-col h-full bg-inset p-0 overflow-hidden border-2 border-[var(--border-color)] shadow-lg shadow-black/20">
                    <div className="bg-[var(--bg-secondary)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] opacity-50 border-b border-[var(--border-color)] uppercase">Preview</div>
                    <div className="flex-1 overflow-y-auto p-8 prose prose-indigo dark:prose-invert prose-sm max-w-none bg-white/5 backdrop-blur-sm">
                        <ReactMarkdown>{input}</ReactMarkdown>
                    </div>
                </Card>
            </div>
        </div>
    );
};
export default MarkdownPreview;
