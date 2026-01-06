
import React, { useState } from 'react';
import { Layers, FileText, Play, CheckCircle2, RotateCcw, Download, Sparkles, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiUrl } from '../utils/apiConfig';
import FileUploader from '../components/FileUploader';
import { extractTextFromFile } from '../utils/textProcessor';
import jsPDF from 'jspdf';

interface Flashcard {
    front: string;
    back: string;
    tag: string;
    learned?: boolean;
}

const FlashcardGenerator: React.FC = () => {
    const [mode, setMode] = useState<'upload' | 'study'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [textInput, setTextInput] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [cards, setCards] = useState<Flashcard[]>([]);



    // Study State
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [learnedCount, setLearnedCount] = useState(0);

    const activeCards = cards.filter(c => !c.learned);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            let textToProcess = textInput;
            if (file) {
                textToProcess = await extractTextFromFile(file);
            }

            if (!textToProcess || textToProcess.length < 50) {
                alert("Please provide more text (min 50 chars).");
                setIsGenerating(false);
                return;
            }

            const res = await fetch(`${getApiUrl()}/flashcards`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textToProcess })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Generation Failed: ${res.statusText}`);
            }

            const data = await res.json();
            setCards(data.cards);
            setMode('study');
            setCurrentCardIndex(0);
            setLearnedCount(0);

        } catch (error: any) {
            console.error(error);
            alert("Flashcards temporarily unavailable. Please try again later.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFlip = () => setIsFlipped(!isFlipped);

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentCardIndex((prev) => (prev + 1) % activeCards.length);
        }, 200);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentCardIndex((prev) => (prev - 1 + activeCards.length) % activeCards.length);
        }, 200);
    };

    const markLearned = () => {
        const updatedCards = [...cards];
        const activeCard = activeCards[currentCardIndex];
        const realIndex = cards.findIndex(c => c === activeCard);

        if (realIndex !== -1) {
            updatedCards[realIndex].learned = true;
            setCards(updatedCards);
            setLearnedCount(prev => prev + 1);
            setIsFlipped(false);

            // If was last card, reset index logic handled by re-render activeCards
            if (currentCardIndex >= activeCards.length - 1) {
                setCurrentCardIndex(0);
            }
        }
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text("Study Flashcards", 20, 20);
        doc.setFontSize(10);
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 30);

        let y = 40;
        cards.forEach((card, i) => {
            if (y > 250) { doc.addPage(); y = 20; }

            doc.setDrawColor(200);
            doc.rect(20, y, 170, 30);

            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Card ${i + 1} - ${card.tag}`, 22, y + 5);

            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.setFont("helvetica", "bold");
            doc.text(`Q: ${card.front}`, 25, y + 15);

            doc.setFont("helvetica", "normal");
            doc.text(`A: ${card.back}`, 25, y + 25);

            y += 35;
        });

        doc.save("flashcards.pdf");
    };

    const reset = () => {
        if (confirm("Start over? Current cards will be lost.")) {
            setCards([]);
            setMode('upload');
            setFile(null);
            setTextInput("");
            setLearnedCount(0);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent flex items-center gap-2">
                        <Layers className="text-emerald-500" /> AI Flashcards
                    </h1>
                    <p className="text-[var(--text-secondary)]">Turn documents into interactive memory cards.</p>
                </div>
                {mode === 'study' && (
                    <div className="flex gap-2">
                        <button onClick={exportPDF} className="btn-secondary text-sm flex items-center gap-2">
                            <Download size={14} /> PDF
                        </button>
                        <button onClick={reset} className="btn-secondary text-sm flex items-center gap-2 text-red-500 hover:bg-red-500/10 hover:border-red-500/20">
                            <RotateCcw size={14} /> New
                        </button>
                    </div>
                )}
            </div>

            {mode === 'upload' ? (
                <div className="space-y-8">
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-8 shadow-xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <FileUploader
                                    onFilesSelected={(files) => setFile(files[0])}
                                    accept=".pdf,.docx,.txt"
                                    title="Upload Study Material"
                                    subtitle="PDF, DOCX, TXT supported"
                                />
                                {file && (
                                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-emerald-600 text-sm font-medium">
                                        <span className="flex items-center gap-2"><FileText size={16} /> {file.name}</span>
                                        <button onClick={() => setFile(null)}><X size={16} /></button>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <textarea
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder="Or paste text directly here..."
                                    className="w-full h-48 md:h-full p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] focus:ring-2 focus:ring-emerald-500 resize-none outline-none"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={() => handleGenerate()}
                                disabled={isGenerating || (!file && !textInput)}
                                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/25 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isGenerating ? <><Sparkles className="animate-spin" /> Generating...</> : <><Play className="fill-current" /> Generate Cards</>}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Progress Bar */}
                    <div className="flex items-center justify-between text-sm font-medium text-[var(--text-secondary)] mb-4">
                        <span>Progress: {learnedCount} / {cards.length} Learned</span>
                        <span>{activeCards.length} Remaining</span>
                    </div>
                    <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(learnedCount / cards.length) * 100}%` }} />
                    </div>

                    {/* Card Container */}
                    {activeCards.length > 0 ? (
                        <div className="relative perspective-1000 h-[400px]">
                            <motion.div
                                className="w-full h-full relative preserve-3d cursor-pointer transition-all duration-500"
                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                                onClick={handleFlip}
                                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                style={{ transformStyle: 'preserve-3d' }}
                            >
                                {/* Front */}
                                <div className="absolute inset-0 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl backface-hidden">
                                    <span className="absolute top-6 right-6 px-3 py-1 bg-[var(--bg-secondary)] rounded-full text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                                        {activeCards[currentCardIndex].tag}
                                    </span>
                                    <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                                        {activeCards[currentCardIndex].front}
                                    </h3>
                                    <p className="mt-8 text-sm text-[var(--text-secondary)] opacity-50 font-medium uppercase tracking-widest">Tap to Flip</p>
                                </div>

                                {/* Back */}
                                <div className="absolute inset-0 bg-emerald-600 text-white rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl backface-hidden rotate-y-180">
                                    <p className="text-xl font-medium leading-relaxed">
                                        {activeCards[currentCardIndex].back}
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    ) : (
                        <div className="h-[400px] flex flex-col items-center justify-center bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl text-center p-8">
                            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-500 mb-6">
                                <CheckCircle2 size={40} />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">You've mastered all cards!</h2>
                            <p className="text-[var(--text-secondary)] mb-6">Great job. Want to restart or try a new deck?</p>
                            <button onClick={reset} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold">Start New Session</button>
                        </div>
                    )}

                    {/* Controls */}
                    {activeCards.length > 0 && (
                        <div className="flex justify-between items-center px-4">
                            <div className="flex gap-4">
                                <button onClick={handlePrev} className="p-4 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] transition-colors">
                                    <ChevronLeft size={24} />
                                </button>
                                <button onClick={handleNext} className="p-4 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] transition-colors">
                                    <ChevronRight size={24} />
                                </button>
                            </div>

                            <button
                                onClick={markLearned}
                                className="px-8 py-3 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl font-bold flex items-center gap-2 transition-all"
                            >
                                <CheckCircle2 size={20} /> Mark Learned
                            </button>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

export default FlashcardGenerator;
