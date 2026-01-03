import React, { useState, useEffect } from 'react';
import {
    Plus, Trash2, FileText, Download, Edit3, Save, X, Search,
    Tag, Calendar, Clock, ChevronRight, FileDown, Bold, Italic, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';

interface Note {
    id: string;
    title: string;
    content: string;
    tag: string;
    date: string;
    lastModified: number;
}

const CATEGORIES = ['General', 'Work', 'Personal', 'Ideas', 'Urgent'];

const NoteGenerator: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>(() => {
        const saved = localStorage.getItem('mytools_notes');
        return saved ? JSON.parse(saved) : [];
    });
    const [activeNote, setActiveNote] = useState<Note | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        localStorage.setItem('mytools_notes', JSON.stringify(notes));
    }, [notes]);

    const createNote = () => {
        const newNote: Note = {
            id: Math.random().toString(36).substr(2, 9),
            title: 'New Note',
            content: '',
            tag: 'General',
            date: new Date().toLocaleDateString(),
            lastModified: Date.now(),
        };
        setNotes([newNote, ...notes]);
        setActiveNote(newNote);
        setIsEditing(true);
    };

    const deleteNote = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (confirm('Are you sure you want to delete this note?')) {
            const filtered = notes.filter(n => n.id !== id);
            setNotes(filtered);
            if (activeNote?.id === id) {
                setActiveNote(null);
                setIsEditing(false);
            }
        }
    };

    const updateNote = (patch: Partial<Note>) => {
        if (!activeNote) return;
        const updated = { ...activeNote, ...patch, lastModified: Date.now() };
        setActiveNote(updated);
        setNotes(notes.map(n => n.id === activeNote.id ? updated : n));
    };

    const exportToPdf = async (note: Note) => {
        try {
            // @ts-ignore
            const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage([595.28, 841.89]); // A4
            const { width, height } = page.getSize();

            const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

            page.drawText(note.title || 'Untitled Note', {
                x: 50,
                y: height - 60,
                size: 24,
                font: fontBold,
                color: rgb(0.07, 0.09, 0.15),
            });

            page.drawText(`${note.tag} | ${note.date}`, {
                x: 50,
                y: height - 85,
                size: 10,
                font: fontRegular,
                color: rgb(0.4, 0.45, 0.5),
            });

            // Simple text wrapping for content
            const lines = note.content.split('\n');
            let currentY = height - 120;
            const fontSize = 12;
            const margin = 50;

            for (const line of lines) {
                if (currentY < 50) break; // Simple page break prevention (one page only for now)
                page.drawText(line, {
                    x: margin,
                    y: currentY,
                    size: fontSize,
                    font: fontRegular,
                    color: rgb(0.1, 0.1, 0.1),
                });
                currentY -= fontSize * 1.5;
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${note.title.replace(/\s+/g, '_')}_mytools.pdf`;
            link.click();
        } catch (error) {
            console.error('PDF Export failed:', error);
            alert('Failed to export PDF. Ensure PDF-Lib is loaded.');
        }
    };

    const filteredNotes = notes.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tag.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in relative">
            <div className="flex flex-1 overflow-hidden luxe-card glass">

                {/* --- Sidebar: Notes List --- */}
                <div className="w-80 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col">
                    <div className="p-6 border-b border-[var(--border-color)] space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-lg font-[Outfit]">Your Notes</h2>
                            <button
                                onClick={createNote}
                                className="w-8 h-8 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                            <input
                                type="text"
                                placeholder="Search notes..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-white/5 border border-[var(--border-color)] rounded-lg py-2 pl-9 pr-4 text-xs focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        <AnimatePresence>
                            {filteredNotes.map(note => (
                                <motion.div
                                    key={note.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ x: 4 }}
                                    onClick={() => { setActiveNote(note); setIsEditing(false); }}
                                    className={`p-4 rounded-xl cursor-pointer border transition-all ${activeNote?.id === note.id ? 'bg-white dark:bg-white/10 border-[var(--accent-primary)] shadow-sm' : 'border-transparent hover:bg-white/50 dark:hover:bg-white/5'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-sm truncate pr-2">{note.title || 'Untitled'}</span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-[var(--text-secondary)]">
                                            {note.tag}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                                        {note.content || 'No content yet...'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-3 text-[9px] font-bold opacity-30">
                                        <Calendar size={10} />
                                        <span>{note.date}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {filteredNotes.length === 0 && (
                            <div className="text-center py-10 opacity-20">
                                <FileText size={40} className="mx-auto mb-2" />
                                <p className="text-xs">No notes found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- Main Workspace --- */}
                <div className="flex-1 flex flex-col bg-[var(--bg-primary)]">
                    {activeNote ? (
                        <div className="flex-1 flex flex-col">
                            {/* Note Header / Toolbar */}
                            <div className="p-6 border-b border-[var(--border-color)] glass-toolbar flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`p-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--accent-primary)] border border-[var(--border-color)]`}>
                                        <FileText size={20} />
                                    </div>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={activeNote.title}
                                            onChange={e => updateNote({ title: e.target.value })}
                                            placeholder="Note Title"
                                            className="bg-transparent text-xl font-bold outline-none border-b border-transparent focus:border-[var(--accent-primary)] transition-all flex-1"
                                        />
                                    ) : (
                                        <h1 className="text-xl font-bold">{activeNote.title}</h1>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsEditing(!isEditing)}
                                        className={`p-2.5 rounded-xl transition-all ${isEditing ? 'bg-[var(--accent-primary)] text-white' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-[var(--text-secondary)]'}`}
                                        title={isEditing ? 'View Mode' : 'Edit Mode'}
                                    >
                                        {isEditing ? <Save size={18} /> : <Edit3 size={18} />}
                                    </button>
                                    <button
                                        onClick={() => exportToPdf(activeNote)}
                                        className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-emerald-500 transition-all"
                                        title="Download as PDF"
                                    >
                                        <Download size={18} />
                                    </button>
                                    <button
                                        onClick={() => deleteNote(activeNote.id)}
                                        className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all"
                                        title="Delete Note"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Tag Selection (Editing) */}
                            {isEditing && (
                                <div className="px-6 py-3 border-b border-[var(--border-color)] flex items-center gap-3 overflow-x-auto no-scrollbar">
                                    <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] opacity-50 flex items-center gap-1 shrink-0">
                                        <Tag size={12} /> Category:
                                    </span>
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => updateNote({ tag: cat })}
                                            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 ${activeNote.tag === cat ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-secondary)]'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Editor / Content Area */}
                            <div className="flex-1 p-6 lg:p-10 overflow-y-auto">
                                {isEditing ? (
                                    <textarea
                                        value={activeNote.content}
                                        onChange={e => updateNote({ content: e.target.value })}
                                        placeholder="Start typing your brilliance here..."
                                        className="w-full h-full bg-transparent resize-none outline-none font-sans text-base leading-relaxed text-[var(--text-primary)] transition-all placeholder:opacity-20"
                                    />
                                ) : (
                                    <div className="prose dark:prose-invert max-w-none">
                                        <p className="whitespace-pre-wrap leading-relaxed text-[var(--text-secondary)]">
                                            {activeNote.content || 'This note is empty. Click edit to start writing.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                            <div className="w-20 h-20 rounded-3xl bg-[var(--bg-secondary)] flex items-center justify-center mb-6 text-[var(--accent-primary)] opacity-40">
                                <FileText size={40} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Select a note to view</h3>
                            <p className="text-sm text-[var(--text-secondary)] max-w-xs">
                                Create meaningful notes and export them as professional PDFs.
                            </p>
                            <button
                                onClick={createNote}
                                className="mt-6 btn-luxe px-8 py-3 flex items-center gap-2"
                            >
                                <Plus size={18} /> New Note
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NoteGenerator;
