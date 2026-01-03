import React, { useState } from 'react';
import Card from '../components/ui/Card';
import ReactMarkdown from 'react-markdown';
import { FileText } from 'lucide-react';

const MarkdownPreview: React.FC = () => {
    const [input, setInput] = useState('# Hello Markdown\n\nStart typing to see the **preview** instantly.');

    return (
        <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col">
            <div className="mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2 px-2"><FileText className="text-indigo-600" /> Markdown Live Preview</h2>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                <Card className="flex flex-col h-full bg-slate-50 p-0 overflow-hidden border-2 border-slate-200 focus-within:border-indigo-400 transition-colors">
                    <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500 border-b border-slate-200 uppercase">Input</div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 w-full p-4 outline-none resize-none font-mono text-sm bg-transparent"
                        placeholder="Type markdown here..."
                    />
                </Card>

                <Card className="flex flex-col h-full p-0 overflow-hidden border-2 border-slate-100 shadow-lg">
                    <div className="bg-white px-4 py-2 text-xs font-bold text-slate-500 border-b border-slate-100 uppercase">Preview</div>
                    <div className="flex-1 overflow-y-auto p-8 prose prose-slate prose-sm max-w-none bg-white">
                        <ReactMarkdown>{input}</ReactMarkdown>
                    </div>
                </Card>
            </div>
        </div>
    );
};
export default MarkdownPreview;
