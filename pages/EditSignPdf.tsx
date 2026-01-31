import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Upload, FileDown, Loader2, Type, Square, Circle, Minus,
    PenTool, Calendar, User, CheckSquare, Trash2, Undo2, Redo2,
    ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download, Save, X, Plus,
    MousePointer2, DownloadCloud, Image as ImageIcon, Type as TypeIcon
} from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// PDF Libraries
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Set worker source
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// --- Types ---
interface Annotation {
    id: string;
    type: 'text' | 'signature' | 'shape' | 'date' | 'initials' | 'checkbox' | 'highlighter';
    page: number;
    x: number; // percentage
    y: number; // percentage
    width: number; // percentage
    height: number; // percentage
    content?: string;
    color?: string;
    opacity?: number;
    fontSize?: number;
    shapeType?: 'rectangle' | 'circle' | 'line';
    isSignature?: boolean;
}

// --- Sub-components ---

const ToolButton: React.FC<{ icon: any, label: string, active: boolean, onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all w-full ${active ? 'bg-brand-yellow border-black shadow-[4px_4px_0px_#000] translate-y-[-2px]' : 'bg-transparent border-transparent hover:bg-black/5 hover:border-black/10'}`}
    >
        <Icon size={20} className="mb-2" />
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </button>
);

const AnnotationItem: React.FC<{
    ann: Annotation,
    selected: boolean,
    dragging: boolean,
    onSelect: () => void,
    onMouseDown: (e: React.MouseEvent) => void,
    onRemove: () => void,
    onUpdateContent: (content: string) => void,
    onUpdateColor: (color: string) => void
}> = ({ ann, selected, dragging, onSelect, onMouseDown, onRemove, onUpdateContent, onUpdateColor }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (isEditing) inputRef.current?.focus();
    }, [isEditing]);

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onMouseDown={onMouseDown}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            onDoubleClick={() => ann.type === 'text' && setIsEditing(true)}
            className={`absolute pointer-events-auto cursor-grab active:cursor-grabbing group ${selected ? 'ring-2 ring-brand-cyan ring-offset-2' : ''} ${dragging ? 'opacity-50' : ''}`}
            style={{
                left: `${ann.x}%`,
                top: `${ann.y}%`,
                width: `${ann.width}%`,
                height: `${ann.height}%`,
            }}
        >
            {ann.type === 'text' && (
                <div className="w-full h-full flex items-center font-sans font-medium" style={{ fontSize: `${ann.fontSize}px`, color: ann.color }}>
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            className="bg-brand-cyan/20 border-none outline-none w-full h-full p-0"
                            value={ann.content}
                            onChange={(e) => onUpdateContent(e.target.value)}
                            onBlur={() => setIsEditing(false)}
                            onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
                        />
                    ) : (
                        ann.content
                    )}
                </div>
            )}

            {ann.type === 'signature' && (
                <img src={ann.content} alt="Signature" className="w-full h-full object-contain pointer-events-none" />
            )}

            {ann.type === 'date' && (
                <div className="w-full h-full flex items-center border-b border-dashed border-black/30 font-display font-bold text-sm">
                    {ann.content || new Date().toLocaleDateString()}
                </div>
            )}

            {ann.type === 'initials' && (
                <div className="w-full h-full flex items-center border-b-2 border-black font-display font-black text-xl italic bg-brand-yellow/10 p-1">
                    AS
                </div>
            )}

            {ann.type === 'checkbox' && (
                <div className="w-4 h-4 border-2 border-black flex items-center justify-center bg-white">
                    <CheckSquare size={12} strokeWidth={3} />
                </div>
            )}

            {ann.type === 'shape' && ann.shapeType === 'rectangle' && (
                <div className="w-full h-full border-2 border-black" style={{ borderColor: ann.color }} />
            )}

            {ann.type === 'shape' && ann.shapeType === 'circle' && (
                <div className="w-full h-full border-2 border-black rounded-full" style={{ borderColor: ann.color }} />
            )}

            {ann.type === 'shape' && ann.shapeType === 'line' && (
                <div className="w-full h-[2px] bg-black absolute top-1/2 -translate-y-1/2" style={{ backgroundColor: ann.color }} />
            )}

            {ann.type === 'highlighter' && (
                <div className="w-full h-full" style={{ backgroundColor: ann.color || '#fde047', opacity: ann.opacity || 0.3 }} />
            )}

            {selected && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white px-3 py-2 rounded-xl flex items-center gap-3 shadow-2xl z-[100] border-2 border-white/20 whitespace-nowrap scale-90 group-hover:scale-100 transition-transform">
                    <div className="flex items-center gap-1.5 px-2 mr-1">
                        {['#000000', '#ef4444', '#3b82f6', '#22c55e', '#fde047'].map(c => (
                            <button
                                key={c}
                                onClick={(e) => { e.stopPropagation(); onUpdateColor(c); }}
                                className={`w-4 h-4 rounded-full border border-white/20 ${ann.color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-black' : ''}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                    <div className="w-px h-4 bg-white/20" />
                    <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1 hover:text-red-400 transition-colors flex items-center gap-2 font-black text-[10px]">
                        <Trash2 size={14} /> DELETE
                    </button>
                    <div className="w-px h-4 bg-white/20" />
                    {ann.type === 'text' && (
                        <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-1 hover:text-brand-cyan transition-colors font-black text-[10px] flex items-center gap-2">
                            <TypeIcon size={14} /> EDIT
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
};

const SignatureModal: React.FC<{ isOpen: boolean, onClose: () => void, onSave: (data: string) => void }> = ({ isOpen, onClose, onSave }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tab, setTab] = useState<'draw' | 'type' | 'upload'>('draw');
    const [typedName, setTypedName] = useState('');

    useEffect(() => {
        if (isOpen && tab === 'draw') {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 3;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                }
            }
        }
    }, [isOpen, tab]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const pos = getPos(e);
        const ctx = canvasRef.current?.getContext('2d');
        ctx?.beginPath();
        ctx?.moveTo(pos.x, pos.y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const pos = getPos(e);
        const ctx = canvasRef.current?.getContext('2d');
        ctx?.lineTo(pos.x, pos.y);
        ctx?.stroke();
    };

    const stopDrawing = () => setIsDrawing(false);

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const handleSave = () => {
        if (tab === 'draw') {
            const dataUrl = canvasRef.current?.toDataURL('image/png');
            if (dataUrl) onSave(dataUrl);
        } else if (tab === 'type') {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 400;
            tempCanvas.height = 150;
            const ctx = tempCanvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = 'black';
                ctx.font = 'italic bold 48px cursive';
                ctx.fillText(typedName, 20, 90);
                onSave(tempCanvas.toDataURL('image/png'));
            }
        }
    };

    const clearCanvas = () => {
        const ctx = canvasRef.current?.getContext('2d');
        ctx?.clearRect(0, 0, 600, 300);
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) onSave(ev.target.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000] flex items-center justify-center p-6">
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-white rounded-3xl w-full max-w-2xl border-4 border-black overflow-hidden shadow-[20px_20px_0px_rgba(0,0,0,0.5)]"
            >
                <div className="p-8 border-b-2 border-black flex justify-between items-center bg-brand-yellow/10">
                    <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                        <PenTool size={24} /> Create Signature
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-xl transition-all"><X size={24} /></button>
                </div>

                <div className="p-2 bg-zinc-100 flex gap-1 border-b-2 border-black">
                    <button onClick={() => setTab('draw')} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${tab === 'draw' ? 'bg-white shadow-[2px_2px_0px_#000] border-2 border-black' : 'hover:bg-white/50'}`}>
                        <PenTool size={16} /> Draw
                    </button>
                    <button onClick={() => setTab('type')} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${tab === 'type' ? 'bg-white shadow-[2px_2px_0px_#000] border-2 border-black' : 'hover:bg-white/50'}`}>
                        <TypeIcon size={16} /> Type
                    </button>
                    <button onClick={() => setTab('upload')} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${tab === 'upload' ? 'bg-white shadow-[2px_2px_0px_#000] border-2 border-black' : 'hover:bg-white/50'}`}>
                        <ImageIcon size={16} /> Upload
                    </button>
                </div>

                <div className="p-8">
                    {tab === 'draw' && (
                        <div className="space-y-4">
                            <div className="bg-zinc-50 border-2 border-dashed border-black/20 rounded-2xl h-[250px] relative overflow-hidden bg-grid-slate-100">
                                <canvas
                                    ref={canvasRef}
                                    width={600}
                                    height={250}
                                    className="w-full h-full cursor-crosshair touch-none"
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                />
                                <div className="absolute bottom-4 right-4 pointer-events-none opacity-20 font-black uppercase tracking-widest text-xs italic">Sign Here</div>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <p className="text-xs text-secondary font-medium italic opacity-60">Your signature remains processing locally in the browser.</p>
                                <button onClick={clearCanvas} className="text-xs font-black uppercase hover:text-red-500 transition-colors">Clear Drawing</button>
                            </div>
                        </div>
                    )}

                    {tab === 'type' && (
                        <div className="space-y-6">
                            <input
                                type="text"
                                placeholder="Type your name here..."
                                className="w-full p-6 text-3xl italic font-serif border-2 border-black rounded-2xl shadow-[4px_4px_0px_#000] outline-none focus:bg-brand-yellow/5"
                                value={typedName}
                                onChange={(e) => setTypedName(e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-8 border-2 border-black rounded-2xl flex items-center justify-center text-2xl font-serif italic shadow-[4px_4px_0px_rgba(0,0,0,0.1)] hover:bg-zinc-50 transition-all cursor-pointer">
                                    {typedName || 'Script Style'}
                                </div>
                                <div className="p-8 border-2 border-black rounded-2xl flex items-center justify-center text-2xl font-mono shadow-[4px_4px_0px_rgba(0,0,0,0.1)] hover:bg-zinc-50 transition-all cursor-pointer">
                                    {typedName || 'Mono Style'}
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 'upload' && (
                        <label className="border-2 border-dashed border-black/20 rounded-2xl h-[250px] flex flex-col items-center justify-center gap-4 hover:bg-zinc-50 transition-all cursor-pointer group">
                            <div className="p-6 bg-brand-cyan/20 text-brand-cyan rounded-2xl transition-transform group-hover:scale-110">
                                <ImageIcon size={32} />
                            </div>
                            <div className="text-center">
                                <p className="font-black uppercase text-sm">Choose transparent PNG</p>
                                <p className="text-xs text-secondary font-medium">JPG/PNG also supported.</p>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                        </label>
                    )}
                </div>

                <div className="p-8 bg-zinc-50 border-t-2 border-black flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 bg-white text-black font-black uppercase tracking-widest border-2 border-black rounded-2xl shadow-[4px_4px_0px_#000] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] transition-all">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-4 bg-brand-pink text-white font-black uppercase tracking-widest border-2 border-black rounded-2xl shadow-[4px_4px_0px_#000] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] transition-all">Apply Signature</button>
                </div>
            </motion.div>
        </div>
    );
};


// --- Main Component ---
const EditSignPdf: React.FC = () => {
    // --- State ---
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [zoom, setZoom] = useState(1.0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<'select' | 'text' | 'signature' | 'shape' | 'date' | 'initials' | 'checkbox' | 'highlighter'>('select');
    const [activeColor, setActiveColor] = useState('#000000');
    const [activeShape, setActiveShape] = useState<'rectangle' | 'circle' | 'line'>('rectangle');

    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, annX: 0, annY: 0 });

    // --- Refs ---
    const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- PDF Loading ---
    const loadPdf = async (file: File) => {
        setIsProcessing(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            setNumPages(pdf.numPages);
            setPdfFile(file);
            setCurrentPage(1);
            setAnnotations([]);
            toast.success('PDF loaded successfully!');
        } catch (error) {
            console.error('Error loading PDF:', error);
            toast.error('Failed to load PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            loadPdf(file);
        } else {
            toast.error('Please upload a valid PDF file.');
        }
    };

    // --- Rendering Page ---
    const renderPage = useCallback(async (pageNum: number) => {
        if (!pdfFile) return;
        const canvas = canvasRefs.current[pageNum];
        if (!canvas) return;

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const page = await pdf.getPage(pageNum);

            const viewport = page.getViewport({ scale: zoom * 2 }); // Render at 2x for clarity
            const context = canvas.getContext('2d');
            if (!context) return;

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Adjust canvas style size for zoom
            canvas.style.width = `${viewport.width / 2}px`;
            canvas.style.height = `${viewport.height / 2}px`;

            // Casting to any to avoid strict type issues with pdfjs-dist versions
            await (page as any).render({
                canvasContext: context,
                viewport: viewport
            }).promise;
        } catch (error) {
            console.error('Error rendering page:', error);
        }
    }, [pdfFile, zoom]);

    useEffect(() => {
        if (pdfFile) {
            renderPage(currentPage);
        }
    }, [pdfFile, currentPage, zoom, renderPage]);

    // --- Annotation Interaction ---
    const addAnnotation = (type: Annotation['type'], x: number, y: number, content?: string) => {
        const newAnnotation: Annotation = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            page: currentPage,
            x: x - 5, // Center roughly
            y: y - 2,
            width: type === 'signature' ? 25 : (type === 'highlighter' ? 20 : 15),
            height: type === 'signature' ? 10 : (type === 'highlighter' ? 4 : 5),
            content: content || (type === 'text' ? 'Double click to edit' : ''),
            color: type === 'highlighter' && activeColor === '#000000' ? '#fde047' : activeColor,
            opacity: type === 'highlighter' ? 0.3 : 1.0,
            fontSize: 16,
            shapeType: type === 'shape' ? activeShape : undefined
        };
        setAnnotations(prev => [...prev, newAnnotation]);
        setSelectedId(newAnnotation.id);
        setActiveTool('select');
    };

    const handleContainerClick = (e: React.MouseEvent) => {
        if (activeTool === 'select') {
            if (e.target === containerRef.current) setSelectedId(null);
            return;
        }
        if (activeTool === 'signature') return;

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        addAnnotation(activeTool as any, x, y);
    };

    const handleMouseDown = (e: React.MouseEvent, ann: Annotation) => {
        if (activeTool !== 'select') return;
        e.stopPropagation();
        setSelectedId(ann.id);
        setDraggingId(ann.id);
        setDragStart({
            x: e.clientX,
            y: e.clientY,
            annX: ann.x,
            annY: ann.y
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggingId) return;

        const dx = ((e.clientX - dragStart.x) / (containerRef.current?.offsetWidth || 1)) * 100;
        const dy = ((e.clientY - dragStart.y) / (containerRef.current?.offsetHeight || 1)) * 100;

        setAnnotations(prev => prev.map(ann =>
            ann.id === draggingId
                ? { ...ann, x: Math.max(0, Math.min(100 - ann.width, dragStart.annX + dx)), y: Math.max(0, Math.min(100 - ann.height, dragStart.annY + dy)) }
                : ann
        ));
    };

    const handleMouseUp = () => {
        setDraggingId(null);
    };

    const updateAnnotation = (id: string, updates: Partial<Annotation>) => {
        setAnnotations(prev => prev.map(ann => ann.id === id ? { ...ann, ...updates } : ann));
    };

    const removeAnnotation = (id: string) => {
        setAnnotations(prev => prev.filter(ann => ann.id !== id));
        setSelectedId(null);
    };

    const addSignature = (dataUrl: string) => {
        addAnnotation('signature', 40, 40, dataUrl);
        setIsSignatureModalOpen(false);
    };

    // --- Export Logic ---
    const exportPdf = async () => {
        if (!pdfFile) return;
        setIsProcessing(true);
        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const standardFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

            const pages = pdfDoc.getPages();

            for (const ann of annotations) {
                const page = pages[ann.page - 1];
                const { width, height } = page.getSize();

                const pdfX = (ann.x / 100) * width;
                const pdfY = height - ((ann.y / 100) * height) - ((ann.height) / 100 * height);
                const pdfWidth = (ann.width / 100) * width;
                const pdfHeight = (ann.height / 100) * height;

                const hexToRgb = (hex?: string) => {
                    const h = hex || '#000000';
                    const r = parseInt(h.slice(1, 3), 16) / 255;
                    const g = parseInt(h.slice(3, 5), 16) / 255;
                    const b = parseInt(h.slice(5, 7), 16) / 255;
                    return rgb(r, g, b);
                };

                if (ann.type === 'text') {
                    page.drawText(ann.content || '', {
                        x: pdfX,
                        y: pdfY + (pdfHeight * 0.2),
                        size: (ann.fontSize || 16) * (height / 842),
                        font: standardFont,
                        color: hexToRgb(ann.color)
                    });
                } else if (ann.type === 'signature' && ann.content) {
                    try {
                        const signatureImg = await pdfDoc.embedPng(ann.content);
                        page.drawImage(signatureImg, {
                            x: pdfX,
                            y: pdfY,
                            width: pdfWidth,
                            height: pdfHeight
                        });
                    } catch (e) {
                        const signatureImg = await pdfDoc.embedJpg(ann.content);
                        page.drawImage(signatureImg, {
                            x: pdfX,
                            y: pdfY,
                            width: pdfWidth,
                            height: pdfHeight
                        });
                    }
                } else if (ann.type === 'date') {
                    page.drawText(new Date().toLocaleDateString(), {
                        x: pdfX,
                        y: pdfY + (pdfHeight * 0.2),
                        size: 14 * (height / 842),
                        font: standardFont,
                        color: rgb(0, 0, 0)
                    });
                } else if (ann.type === 'checkbox') {
                    page.drawRectangle({
                        x: pdfX,
                        y: pdfY,
                        width: pdfHeight,
                        height: pdfHeight,
                        borderColor: rgb(0, 0, 0),
                        borderWidth: 1
                    });
                    page.drawText('X', {
                        x: pdfX + 2,
                        y: pdfY + 2,
                        size: pdfHeight - 4,
                        font: standardFont,
                        color: rgb(0, 0, 0)
                    });
                } else if (ann.type === 'highlighter') {
                    page.drawRectangle({
                        x: pdfX,
                        y: pdfY,
                        width: pdfWidth,
                        height: pdfHeight,
                        color: hexToRgb(ann.color || '#fde047'),
                        opacity: ann.opacity || 0.3
                    });
                } else if (ann.type === 'shape') {
                    const color = hexToRgb(ann.color);

                    if (ann.shapeType === 'rectangle') {
                        page.drawRectangle({
                            x: pdfX,
                            y: pdfY,
                            width: pdfWidth,
                            height: pdfHeight,
                            borderColor: color,
                            borderWidth: 2
                        });
                    } else if (ann.shapeType === 'circle') {
                        page.drawEllipse({
                            x: pdfX + pdfWidth / 2,
                            y: pdfY + pdfHeight / 2,
                            xScale: pdfWidth / 2,
                            yScale: pdfHeight / 2,
                            borderColor: color,
                            borderWidth: 2
                        });
                    } else if (ann.shapeType === 'line') {
                        page.drawLine({
                            start: { x: pdfX, y: pdfY + pdfHeight / 2 },
                            end: { x: pdfX + pdfWidth, y: pdfY + pdfHeight / 2 },
                            color: color,
                            thickness: 2
                        });
                    }
                }
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${pdfFile.name.replace('.pdf', '')}_signed.pdf`;
            link.click();
            toast.success('PDF exported successfully!');
        } catch (error) {
            console.error('Export Error:', error);
            toast.error('Failed to export PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <SectionHeader
                title="Edit & Sign PDF"
                subtitle="High-fidelity PDF editing and digital signatures. Fast, local, and secure."
            />

            <div className="max-w-7xl mx-auto px-4">
                {!pdfFile ? (
                    <div className="bg-surface border-2 border-black rounded-3xl p-16 shadow-[12px_12px_0px_#000] dark:border-white dark:shadow-[12px_12px_0px_#ffffff] text-center space-y-10 group transition-all hover:translate-y-[-4px]">
                        <div className="w-28 h-28 bg-[#3b82f6]/20 text-[#3b82f6] rounded-3xl flex items-center justify-center mx-auto border-2 border-black shadow-[6px_6px_0px_#000] transition-transform group-hover:rotate-6">
                            <PenTool size={56} />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-4xl font-black font-display uppercase tracking-tight">Digital Document Studio</h3>
                            <p className="text-secondary max-w-lg mx-auto text-lg">Professional tools to sign, annotate, and edit PDF files in seconds. No cloud uploads, all processing is local.</p>
                        </div>
                        <label className="inline-flex items-center gap-4 px-12 py-6 bg-[#3b82f6] text-white rounded-2xl font-black text-2xl cursor-pointer hover:translate-y-[-6px] hover:shadow-[12px_12px_0px_#000] transition-all border-2 border-black shadow-[8px_8px_0px_#000] active:translate-y-0 active:shadow-none">
                            <Upload size={32} />
                            Choose PDF File
                            <input type="file" className="hidden" accept="application/pdf" onChange={handleFileUpload} />
                        </label>
                        <div className="flex items-center justify-center gap-8 text-xs font-bold uppercase tracking-widest opacity-40">
                            <span className="flex items-center gap-2 transition-opacity hover:opacity-100"><CheckSquare size={14} /> Local Processing</span>
                            <span className="flex items-center gap-2 transition-opacity hover:opacity-100"><CheckSquare size={14} /> No Watermarks</span>
                            <span className="flex items-center gap-2 transition-opacity hover:opacity-100"><CheckSquare size={14} /> Multi-page Support</span>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 h-[calc(100vh-280px)]">
                        {/* Sidebar Tools */}
                        <div className="bg-surface border-2 border-black rounded-2xl p-6 shadow-[8px_8px_0px_#000] dark:border-white overflow-y-auto flex flex-col">
                            <div className="flex-1 space-y-8">
                                <div>
                                    <h4 className="font-black uppercase text-[10px] tracking-[0.2em] mb-4 opacity-50 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full" /> Selection
                                    </h4>
                                    <ToolButton icon={MousePointer2} label="Select" active={activeTool === 'select'} onClick={() => setActiveTool('select')} />
                                </div>

                                <div>
                                    <h4 className="font-black uppercase text-[10px] tracking-[0.2em] mb-4 opacity-50 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full" /> Annotate
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <ToolButton icon={Type} label="Text" active={activeTool === 'text'} onClick={() => setActiveTool('text')} />
                                        <ToolButton icon={PenTool} label="Sign" active={activeTool === 'signature'} onClick={() => setIsSignatureModalOpen(true)} />
                                        <ToolButton icon={Calendar} label="Date" active={activeTool === 'date'} onClick={() => setActiveTool('date')} />
                                        <ToolButton icon={User} label="Initials" active={activeTool === 'initials'} onClick={() => setActiveTool('initials')} />
                                        <ToolButton icon={Square} label="Square" active={activeTool === 'shape' && activeShape === 'rectangle'} onClick={() => { setActiveTool('shape'); setActiveShape('rectangle'); }} />
                                        <ToolButton icon={Circle} label="Circle" active={activeTool === 'shape' && activeShape === 'circle'} onClick={() => { setActiveTool('shape'); setActiveShape('circle'); }} />
                                        <ToolButton icon={Minus} label="Line" active={activeTool === 'shape' && activeShape === 'line'} onClick={() => { setActiveTool('shape'); setActiveShape('line'); }} />
                                        <ToolButton icon={Plus} label="Highlight" active={activeTool === 'highlighter'} onClick={() => setActiveTool('highlighter')} />
                                        <ToolButton icon={CheckSquare} label="Check" active={activeTool === 'checkbox'} onClick={() => setActiveTool('checkbox')} />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t-2 border-black/5 pt-6 mt-6 space-y-4">
                                <button
                                    onClick={exportPdf}
                                    disabled={isProcessing}
                                    className="w-full py-5 bg-[#3b82f6] text-white rounded-2xl font-black text-lg border-2 border-black shadow-[6px_6px_0px_#000] flex items-center justify-center gap-3 hover:translate-y-[-4px] hover:shadow-[10px_10px_0px_#000] transition-all disabled:opacity-50 active:translate-y-0 active:shadow-none"
                                >
                                    {isProcessing ? <Loader2 size={24} className="animate-spin" /> : <DownloadCloud size={24} />}
                                    Export & Download
                                </button>
                                <p className="text-[10px] text-center font-bold opacity-30 uppercase tracking-widest">Saved locally to Downloads</p>
                            </div>
                        </div>

                        {/* Editor Canvas Area */}
                        <div className="flex flex-col gap-6">
                            {/* Toolbar Top */}
                            <div className="bg-surface border-2 border-black rounded-2xl p-4 shadow-[6px_6px_0px_#000] dark:border-white flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center bg-black/5 rounded-xl p-1.5 border-2 border-black/10">
                                        <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className="p-2 hover:bg-white rounded-lg transition-all active:scale-95"><ChevronLeft size={20} /></button>
                                        <div className="px-5 flex flex-col items-center">
                                            <span className="text-[10px] font-black opacity-40 uppercase">Page</span>
                                            <span className="font-black text-sm">{currentPage} / {numPages}</span>
                                        </div>
                                        <button onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))} className="p-2 hover:bg-white rounded-lg transition-all active:scale-95"><ChevronRight size={20} /></button>
                                    </div>

                                    <div className="h-10 w-px bg-black/10" />

                                    <div className="flex items-center bg-black/5 rounded-xl p-1.5 border-2 border-black/10">
                                        <button onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))} className="p-2 hover:bg-white rounded-lg transition-all active:scale-95"><ZoomOut size={20} /></button>
                                        <div className="px-5 flex flex-col items-center">
                                            <span className="text-[10px] font-black opacity-40 uppercase">Zoom</span>
                                            <span className="font-black text-sm">{Math.round(zoom * 100)}%</span>
                                        </div>
                                        <button onClick={() => setZoom(prev => Math.min(2.0, prev + 0.1))} className="p-2 hover:bg-white rounded-lg transition-all active:scale-95"><ZoomIn size={20} /></button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button className="w-10 h-10 flex items-center justify-center hover:bg-black/5 rounded-xl border-2 border-transparent transition-all"><Undo2 size={20} /></button>
                                    <button className="w-10 h-10 flex items-center justify-center hover:bg-black/5 rounded-xl border-2 border-transparent opacity-20"><Redo2 size={20} /></button>
                                    <div className="w-px h-8 bg-black/10 mx-2" />
                                    <button onClick={() => setPdfFile(null)} className="flex items-center gap-2 px-4 py-2 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-all border-2 border-transparent hover:border-red-200">
                                        <X size={20} /> Close
                                    </button>
                                </div>
                            </div>

                            {/* Canvas Wrapper */}
                            <div className="flex-1 bg-zinc-200 dark:bg-zinc-900 rounded-2xl overflow-auto p-12 flex justify-center border-2 border-black/5 relative custom-scrollbar">
                                <div
                                    ref={containerRef}
                                    onClick={handleContainerClick}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                    className="relative bg-white shadow-[0px_20px_50px_rgba(0,0,0,0.1)] transition-shadow hover:shadow-[0px_30px_70px_rgba(0,0,0,0.15)]"
                                    style={{
                                        width: canvasRefs.current[currentPage]?.style.width,
                                        height: canvasRefs.current[currentPage]?.style.height,
                                        cursor: activeTool === 'select' ? 'default' : 'crosshair'
                                    }}
                                >
                                    <canvas ref={el => { canvasRefs.current[currentPage] = el; }} className="block shadow-xl" />

                                    {/* Annotations Overlay */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        <AnimatePresence>
                                            {annotations.filter(ann => ann.page === currentPage).map(ann => (
                                                <AnnotationItem
                                                    key={ann.id}
                                                    ann={ann}
                                                    selected={selectedId === ann.id}
                                                    dragging={draggingId === ann.id}
                                                    onSelect={() => setSelectedId(ann.id)}
                                                    onMouseDown={(e) => handleMouseDown(e, ann)}
                                                    onRemove={() => removeAnnotation(ann.id)}
                                                    onUpdateContent={(content) => updateAnnotation(ann.id, { content })}
                                                    onUpdateColor={(color) => updateAnnotation(ann.id, { color })}
                                                />
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <SignatureModal
                isOpen={isSignatureModalOpen}
                onClose={() => setIsSignatureModalOpen(false)}
                onSave={addSignature}
            />
        </div>
    );
};

export default EditSignPdf;
