import React, { useState, useEffect, useRef, useCallback } from 'react';
import Card from '../components/ui/Card';
import { RotateCcw, AlertTriangle, Monitor, Crown } from 'lucide-react';

const WORDS_POOL = [
    "the", "be", "of", "and", "a", "to", "in", "he", "have", "it", "that", "for", "they", "i", "with", "as", "not", "on", "she", "at", "by", "this", "we", "you", "do", "but", "from", "or", "which", "one", "would", "all", "will", "there", "say", "who", "make", "when", "can", "more", "if", "no", "man", "out", "other", "so", "what", "time", "up", "go", "about", "than", "into", "could", "state", "only", "new", "year", "some", "take", "come", "these", "know", "see", "use", "get", "like", "then", "first", "any", "work", "now", "may", "such", "give", "over", "think", "most", "even", "find", "day", "also", "after", "way", "many", "must", "look", "before", "great", "back", "through", "long", "where", "much", "should", "well", "people", "down", "own", "just", "because", "good", "each", "those", "feel", "seem", "how", "high", "too", "place", "little", "world", "very", "still", "nation", "hand", "old", "life", "tell", "write", "become", "here", "show", "house", "both", "between", "need", "mean", "call", "develop", "under", "last", "right", "move", "thing", "general", "school", "never", "same", "another", "begin", "while", "number", "part", "turn", "real", "leave", "might", "want", "point", "form", "off", "child", "few", "small", "since", "against", "ask", "late", "home", "interest", "large", "person", "end", "open", "public", "follow", "during", "present", "without", "again", "hold", "govern", "around", "possible", "head", "consider", "word", "program", "problem", "however", "lead", "system", "set", "order", "eye", "plan", "run", "keep", "face", "fact", "group", "play", "stand", "increase", "early", "course", "change", "help", "line"
];

// Configuration
const TEST_DURATION = 30; // Seconds
const WORD_COUNT = 50;

const TypingTest: React.FC = () => {
    // Game State
    const [words, setWords] = useState<string[]>([]);
    const [status, setStatus] = useState<'idle' | 'running' | 'finished'>('idle');
    const [timeLeft, setTimeLeft] = useState(TEST_DURATION);

    // Stats
    const [wpm, setWpm] = useState(0);
    const [acc, setAcc] = useState(100);
    const [correctChars, setCorrectChars] = useState(0);
    const [incorrectChars, setIncorrectChars] = useState(0);
    const [extraChars, setExtraChars] = useState(0);

    // Input Tracking
    const [currInput, setCurrInput] = useState('');
    const [currWordIdx, setCurrWordIdx] = useState(0);
    const [currCharIdx, setCurrCharIdx] = useState(0); // Validated char index within word

    // History Tracking (for results)
    const [history, setHistory] = useState<{ wordIdx: number, isCorrect: boolean }[]>([]);

    const inputRef = useRef<HTMLInputElement>(null);
    const wordsContainerRef = useRef<HTMLDivElement>(null);

    // Init Test
    const initTest = useCallback(() => {
        const shuffled = [...WORDS_POOL].sort(() => 0.5 - Math.random()).slice(0, WORD_COUNT);
        setWords(shuffled);
        setStatus('idle');
        setTimeLeft(TEST_DURATION);
        setCurrInput('');
        setCurrWordIdx(0);
        setCurrCharIdx(0);
        setCorrectChars(0);
        setIncorrectChars(0);
        setExtraChars(0);
        setWpm(0);
        setAcc(100);
        setHistory([]);
        if (inputRef.current) inputRef.current.focus();
    }, []);

    useEffect(() => {
        initTest();
    }, [initTest]);

    // Timer Logic
    useEffect(() => {
        let interval: any;
        if (status === 'running') {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        finishTest();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [status]);

    // Live WPM Calc
    useEffect(() => {
        if (status === 'running' || status === 'finished') {
            const timeElapsed = TEST_DURATION - timeLeft;
            if (timeElapsed > 0) {
                // Standard WPM = (Total Characters / 5) / TimeInMinutes
                // We count ALL typed characters (correct + incorrect)? 
                // Usually Net WPM = ((All - Uncorrected Errors) / 5) / Time
                // Monkeytype: WPM based on correct chars?
                // Let's use: (Correct Chars / 5) / Minutes
                const minutes = timeElapsed / 60;
                const rawWpm = Math.round((correctChars / 5) / minutes);
                setWpm(rawWpm);

                const total = correctChars + incorrectChars + extraChars;
                if (total > 0) setAcc(Math.round((correctChars / total) * 100));
            }
        }
    }, [timeLeft, correctChars, incorrectChars, extraChars, status]);

    const finishTest = () => {
        setStatus('finished');
        if (inputRef.current) inputRef.current.blur();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (status === 'finished') return;
        if (status === 'idle') setStatus('running');

        const key = e.key;
        const currentWord = words[currWordIdx];

        // Backspace
        if (key === 'Backspace') {
            if (currInput.length > 0) {
                // If removing last char, was it correct?
                const removedChar = currInput.slice(-1);
                const charIndex = currInput.length - 1;

                // Logic to decrement stats? Monkeytype usually doesn't decrement "Total Typed" but for live WPM we might need to adjust "Correct chars" count
                // A simpler way for React: Re-calculate derived stats from state?
                // For high performance, we track delta.
                // If we backspace a correct char, decrement correct count.
                // If we backspace an extra char, decrement extra count.

                // Check what this char WAS
                if (charIndex >= currentWord.length) {
                    setExtraChars(prev => Math.max(0, prev - 1));
                } else if (removedChar === currentWord[charIndex]) {
                    setCorrectChars(prev => Math.max(0, prev - 1));
                } else {
                    setIncorrectChars(prev => Math.max(0, prev - 1));
                }

                setCurrInput(prev => prev.slice(0, -1));
                setCurrCharIdx(prev => prev - 1);
            }
            return;
        }

        // Space (Next Word)
        if (key === ' ') {
            e.preventDefault();
            if (currInput.length > 0) {
                // Check skipped chars as errors?
                // Monkeytype marks mixed words as error.
                // We will just commit this word.
                // Stats for skipped chars? 
                // If I typed "th" for "the", 'e' is missed.
                const missed = currentWord.length - currInput.length;
                if (missed > 0) {
                    setIncorrectChars(prev => prev + missed);
                }

                setHistory(prev => [...prev, {
                    wordIdx: currWordIdx,
                    isCorrect: currInput === currentWord
                }]);

                setCurrWordIdx(prev => prev + 1);
                setCurrInput('');
                setCurrCharIdx(0);

                // Auto scroll logic (simplified)
                if (currWordIdx > 0 && currWordIdx % 10 === 0) {
                    // trigger scroll or simpler: just keep focused line
                }

                // End if out of words
                if (currWordIdx >= words.length - 1) finishTest();
            }
            return;
        }

        // Generic Character Input
        if (key.length === 1) {
            const desiredChar = currentWord[currInput.length];
            const isExtra = currInput.length >= currentWord.length;

            if (isExtra) {
                setExtraChars(prev => prev + 1);
            } else {
                if (key === desiredChar) {
                    setCorrectChars(prev => prev + 1);
                } else {
                    setIncorrectChars(prev => prev + 1);
                }
            }

            setCurrInput(prev => prev + key);
            setCurrCharIdx(prev => prev + 1);
        }
    };

    // Render Helpers
    const getCharClass = (wordIdx: number, charIdx: number, char: string) => {
        if (wordIdx !== currWordIdx) {
            return 'text-slate-500/50';
        }

        // Current Word
        if (charIdx < currInput.length) {
            return currInput[charIdx] === char ? 'text-[var(--text-primary)]' : 'text-red-500';
        }
        return 'text-[var(--text-secondary)]/40';
    };

    return (
        <div className="max-w-5xl mx-auto min-h-[60vh] flex flex-col justify-center font-mono" onClick={() => inputRef.current?.focus()}>

            {/* HUD */}
            <div className="flex justify-between items-end mb-8 text-[var(--text-secondary)] select-none">
                <div className="text-xl">
                    <span className="text-[var(--accent-primary)] font-bold">{timeLeft}</span>s
                </div>
                <div className="flex gap-8">
                    <div className="flex flex-col items-end">
                        <span className="text-xs uppercase font-bold tracking-widest opacity-40">Accuracy</span>
                        <span className="text-2xl font-bold text-[var(--text-primary)]">{acc}%</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xs uppercase font-bold tracking-widest opacity-40">WPM</span>
                        <span className="text-4xl font-bold text-[var(--accent-primary)]">{wpm}</span>
                    </div>
                </div>
            </div>

            {/* Config & Reset */}
            {status === 'idle' && (
                <div className="flex justify-center mb-12">
                    <div className="bg-inset border border-[var(--border-color)] rounded-lg p-1 flex gap-2 text-sm text-[var(--text-secondary)]">
                        <span className="px-3 py-1 bg-[var(--bg-secondary)] text-indigo-400 shadow-sm rounded cursor-pointer">Word 50</span>
                        <span className="px-3 py-1 hover:text-indigo-400 cursor-pointer">Time 30s</span>
                        <span className="px-3 py-1 hover:text-indigo-400 cursor-pointer">Quote</span>
                    </div>
                </div>
            )}

            {/* Test Area */}
            {status !== 'finished' ? (
                <div className="relative text-2xl leading-relaxed break-all tracking-wide outline-none" tabIndex={0}>
                    {/* Hidden Input for Focus */}
                    <input
                        ref={inputRef}
                        className="absolute inset-0 opacity-0 cursor-default"
                        value={currInput}
                        onChange={() => { }} // Handle via keyDown
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />

                    {/* Text Renderer */}
                    <div ref={wordsContainerRef} className="flex flex-wrap gap-x-4 gap-y-6 text-[var(--text-secondary)]/30 max-h-[200px] overflow-hidden transition-all duration-200 mask-image">
                        {words.map((word, wIdx) => {
                            // active word logic
                            if (wIdx < currWordIdx) return null; // Hide passed words or style them differently? 
                            // Monkeytype keeps them but scrolls. 
                            // Simple scrolling: Filter out completed lines.
                            // For now: Hide previous words

                            // Only show next 20 words for clean UI
                            if (wIdx > currWordIdx + 20) return null;

                            return (
                                <div key={wIdx} className={`relative flex ${wIdx === currWordIdx ? 'border-b-0' : ''}`}>
                                    {word.split('').map((char, cIdx) => (
                                        <span key={cIdx} className={getCharClass(wIdx, cIdx, char)}>
                                            {char}
                                        </span>
                                    ))}
                                    {/* Input Handling for Current Word Errors/Extras */}
                                    {wIdx === currWordIdx && currInput.length > word.length && (
                                        currInput.slice(word.length).split('').map((char, i) => (
                                            <span key={i + 100} className="text-red-500 opacity-70 border-b border-red-500/50">{char}</span>
                                        ))
                                    )}

                                    {/* Caret */}
                                    {wIdx === currWordIdx && status !== 'idle' && (
                                        <div
                                            className="absolute w-0.5 h-6 bg-indigo-500 animate-pulse transition-all duration-75"
                                            style={{ left: `${Math.min(currInput.length, word.length + 10) * 14.4}px` }} // Approx measure, needs real logic for perfect caret
                                        />
                                    )}
                                    {/* Simplified caret: CSS based on active char class? Hard in React list. 
                                          Let's skip generic px calc and put caret ON the active character 
                                      */}
                                </div>
                            );
                        })}
                    </div>

                    {/* Caret Implementation 2 (Better) */}
                    {/* We can place the caret explicitly after the last rendered character of current word? */}
                </div>
            ) : (
                <div className="text-center animate-in fade-in zoom-in duration-300">
                    <div className="inline-block p-10 rounded-3xl bg-inset border border-[var(--border-color)] mb-8 backdrop-blur-xl">
                        <div className="grid grid-cols-2 gap-12 text-left">
                            <div>
                                <div className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider mb-1 opacity-40">WPM</div>
                                <div className="text-6xl font-bold text-[var(--accent-primary)]">{wpm}</div>
                            </div>
                            <div>
                                <div className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider mb-1 opacity-40">Accuracy</div>
                                <div className="text-6xl font-bold text-emerald-400">{acc}%</div>
                            </div>
                            <div>
                                <div className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider mb-1 opacity-40">Raw</div>
                                <div className="text-2xl font-bold text-[var(--text-primary)]">{wpm} <span className="text-sm text-[var(--text-secondary)]/50">chars</span></div>
                            </div>
                            <div>
                                <div className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider mb-1 opacity-40">Characters</div>
                                <div className="text-2xl font-bold text-[var(--text-primary)]">
                                    {correctChars}/<span className="text-red-500">{incorrectChars}</span>/<span className="text-[var(--text-secondary)]/30">{extraChars}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <button
                            onClick={initTest}
                            className="inline-flex items-center gap-3 px-8 py-3 bg-[var(--bg-secondary)] hover:bg-inset text-[var(--text-primary)] rounded-xl transition-all font-bold border border-[var(--border-color)] hover:border-[var(--accent-primary)] shadow-lg shadow-black/20"
                        >
                            <RotateCcw size={20} /> Restart Test
                        </button>
                    </div>
                </div>
            )}

            {status === 'idle' && (
                <div className="mt-20 text-center text-[var(--text-secondary)]/40 text-sm">
                    <p>Start typing to begin...</p>
                </div>
            )}
        </div>
    );
};
export default TypingTest;
