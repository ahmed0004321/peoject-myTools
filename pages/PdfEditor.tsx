import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
    Upload, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
    Download, Loader2, FileText, CheckCircle2,
    Bold, Italic, Type, Palette, Baseline, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

// Setup worker using the version from the imported library
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface TextItemStyle {
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    fontStyle: string;
    color: string;
}

interface TextItem extends TextItemStyle {
    id: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    baseX: number;
    baseY: number;
    baseWidth: number;
    baseHeight: number;
    baseFontSize: number;
    pageIndex: number;
    rawFontName?: string;
}

const PdfEditor: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [pdfDoc, setPdfDoc] = useState<any>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.5);
    const [loading, setLoading] = useState<boolean>(false);
    const [textItems, setTextItems] = useState<TextItem[]>([]);
    const [allTextItems, setAllTextItems] = useState<Record<number, TextItem[]>>({});
    const [editedText, setEditedText] = useState<Record<string, string>>({});
    const [itemStyles, setItemStyles] = useState<Record<string, Partial<TextItemStyle>>>({});
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [originalBytes, setOriginalBytes] = useState<ArrayBuffer | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = event.target.files?.[0];
        if (uploadedFile && uploadedFile.type === 'application/pdf') {
            try {
                setLoading(true);
                setFile(uploadedFile);
                const arrayBuffer = await uploadedFile.arrayBuffer();
                setOriginalBytes(arrayBuffer);

                const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) });
                const pdf = await loadingTask.promise;
                setPdfDoc(pdf);
                setNumPages(pdf.numPages);
                setCurrentPage(1);
                setLoading(false);
                toast.success('PDF loaded successfully!');
            } catch (error: any) {
                console.error('Error loading PDF:', error);
                toast.error(`Error: ${error.message || 'Check connection'}`);
                setLoading(false);
            }
        }
    };

    const getInitialFontProps = (fontName: string, styles: any) => {
        const style = styles[fontName];
        const family = style?.fontFamily || fontName || '';
        const name = family.toLowerCase();

        let fontFamily = '"Times New Roman", Times, serif';
        let fontWeight = '400';
        let fontStyle = 'normal';

        if (name.includes('arial') || name.includes('helvetica') || name.includes('sans')) {
            fontFamily = 'Arial, Helvetica, sans-serif';
        } else if (name.includes('times') || name.includes('serif') || name.includes('roman')) {
            fontFamily = '"Times New Roman", Times, serif';
        } else if (name.includes('courier') || name.includes('mono')) {
            fontFamily = '"Courier New", Courier, monospace';
        }

        if (name.includes('bold') || name.includes('700') || name.includes('bd')) fontWeight = '700';
        if (name.includes('italic') || name.includes('oblique') || name.includes('it')) fontStyle = 'italic';

        return { fontFamily, fontWeight, fontStyle };
    };

    const renderPage = useCallback(async (pageNum: number, currentScale: number) => {
        if (!pdfDoc || !canvasRef.current) return;

        try {
            setLoading(true);
            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: currentScale });
            const baseViewport = page.getViewport({ scale: 1.0 });

            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            if (!context) return;

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            const textContent = await page.getTextContent();
            const styles = textContent.styles;

            const items: TextItem[] = textContent.items.map((item: any, index: number) => {
                const transform = item.transform;
                const baseFontSize = Math.abs(transform[3]);
                const currentFontSize = baseFontSize * currentScale;

                const [x, y] = viewport.convertToViewportPoint(transform[4], transform[5]);
                const [bx, by] = baseViewport.convertToViewportPoint(transform[4], transform[5]);

                const fontProps = getInitialFontProps(item.fontName, styles);
                if (Math.abs(transform[0]) > 0.7 && fontProps.fontWeight === '400') fontProps.fontWeight = '700';

                let color = '#000000';
                if (item.color && Array.isArray(item.color)) {
                    color = `rgb(${Math.round(item.color[0] * 255)}, ${Math.round(item.color[1] * 255)}, ${Math.round(item.color[2] * 255)})`;
                }

                return {
                    id: `${pageNum}-${index}`,
                    text: item.str,
                    x: x,
                    y: y - currentFontSize,
                    width: item.width * currentScale,
                    height: currentFontSize,
                    fontSize: currentFontSize,
                    fontFamily: fontProps.fontFamily,
                    fontWeight: fontProps.fontWeight,
                    fontStyle: fontProps.fontStyle,
                    color: color,
                    baseX: bx,
                    baseY: by - baseFontSize,
                    baseWidth: item.width,
                    baseHeight: baseFontSize,
                    baseFontSize: baseFontSize,
                    pageIndex: pageNum - 1
                };
            }).filter((item: any) => item.text.trim().length > 0);

            setTextItems(items);
            setAllTextItems(prev => ({ ...prev, [pageNum]: items }));
            setLoading(false);
        } catch (error) {
            console.error('Error:', error);
            setLoading(false);
        }
    }, [pdfDoc]);

    useEffect(() => {
        if (pdfDoc) renderPage(currentPage, scale);
    }, [pdfDoc, currentPage, scale, renderPage]);

    const updateItemStyle = (id: string, updates: Partial<TextItemStyle>) => {
        setItemStyles(prev => ({
            ...prev,
            [id]: { ...(prev[id] || {}), ...updates }
        }));
    };

    const downloadEditedPDF = async () => {
        if (!originalBytes || !file) return;
        setLoading(true);
        try {
            const pdfLibDoc = await PDFDocument.load(new Uint8Array(originalBytes), { ignoreEncryption: true });
            const pages = pdfLibDoc.getPages();

            for (const [id, text] of Object.entries(editedText)) {
                const [pageNumStr] = id.split('-');
                const item = allTextItems[parseInt(pageNumStr)]?.find(i => i.id === id);
                if (!item) continue;

                const page = pages[item.pageIndex];
                const { height } = page.getSize();
                const style = { ...item, ...(itemStyles[id] || {}) };

                // Exact white-out patch
                page.drawRectangle({
                    x: item.baseX - 1,
                    y: height - item.baseY - item.baseHeight - 1,
                    width: item.baseWidth + 3,
                    height: item.baseHeight + 3,
                    color: rgb(1, 1, 1),
                });

                const font = await getEmbeddedFont(pdfLibDoc, style);
                let color = rgb(0, 0, 0);
                const match = style.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (match) color = rgb(parseInt(match[1]) / 255, parseInt(match[2]) / 255, parseInt(match[3]) / 255);

                page.drawText(text.replace(/[^\x20-\x7E]/g, ' '), {
                    x: item.baseX,
                    y: height - item.baseY - item.baseHeight + (item.baseHeight * 0.1),
                    size: style.fontSize / scale,
                    font: font,
                    color: color,
                });
            }

            const bytes = await pdfLibDoc.save();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
            link.download = `edited_${file.name}`;
            link.click();
            toast.success('Saved!');
        } catch (e) {
            console.error(e);
            toast.error('Save failed');
        }
        setLoading(false);
    };

    const getEmbeddedFont = async (pdfLibDoc: any, style: TextItemStyle) => {
        const isBold = style.fontWeight === '700';
        const isItalic = style.fontStyle === 'italic';
        if (style.fontFamily.includes('serif')) {
            if (isBold && isItalic) return await pdfLibDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
            if (isBold) return await pdfLibDoc.embedFont(StandardFonts.TimesRomanBold);
            if (isItalic) return await pdfLibDoc.embedFont(StandardFonts.TimesRomanItalic);
            return await pdfLibDoc.embedFont(StandardFonts.TimesRoman);
        }
        if (isBold && isItalic) return await pdfLibDoc.embedFont(StandardFonts.HelveticaBoldOblique);
        if (isBold) return await pdfLibDoc.embedFont(StandardFonts.HelveticaBold);
        if (isItalic) return await pdfLibDoc.embedFont(StandardFonts.HelveticaOblique);
        return await pdfLibDoc.embedFont(StandardFonts.Helvetica);
    };

    return (
        <div className="min-h-screen bg-[#F0F2F5] selection:bg-blue-100 antialiased p-4">
            <div className="max-w-[1400px] mx-auto">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                    {/* Main SaaS Toolbar */}
                    <div className="px-8 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-50">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-600 p-2.5 rounded-xl"><FileText className="text-white" size={20} /></div>
                            <h2 className="font-bold text-gray-800">Files Editor</h2>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex bg-gray-100 rounded-xl p-1">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronLeft size={18} /></button>
                                <div className="px-4 flex items-center text-sm font-bold">{currentPage} / {numPages}</div>
                                <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronRight size={18} /></button>
                            </div>

                            <div className="flex bg-gray-100 rounded-xl p-1 ml-2">
                                <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-2 hover:bg-white rounded-lg transition-all"><ZoomOut size={18} /></button>
                                <div className="w-16 text-center flex items-center justify-center text-xs font-bold uppercase">{Math.round(scale * 100)}%</div>
                                <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-2 hover:bg-white rounded-lg transition-all"><ZoomIn size={18} /></button>
                            </div>

                            <button onClick={downloadEditedPDF} className="ml-4 bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95">
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Canvas Area */}
                    <div className="bg-[#F8F9FA] p-12 min-h-[700px] flex items-center justify-center relative">
                        {!pdfDoc ? (
                            <div onClick={() => fileInputRef.current?.click()} className="w-full max-w-xl border-2 border-dashed border-gray-300 rounded-[40px] p-24 text-center cursor-pointer hover:border-blue-500 hover:bg-white transition-all bg-white shadow-sm">
                                <Upload className="mx-auto text-blue-600 mb-6" size={48} />
                                <h3 className="text-xl font-bold mb-2">Editor Launchpad</h3>
                                <p className="text-gray-500 mb-8">Click to start your surgical PDF session.</p>
                                <button className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all">Select Document</button>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" />
                            </div>
                        ) : (
                            <div className="relative shadow-[0_40px_80px_rgba(0,0,0,0.12)] bg-white border border-gray-200 rounded-sm">
                                <canvas ref={canvasRef} className="block" />

                                {/* Interaction & Editing Layer */}
                                <div className="absolute top-0 left-0" style={{ width: canvasRef.current?.width, height: canvasRef.current?.height }}>
                                    {textItems.map((item) => {
                                        const style = { ...item, ...(itemStyles[item.id] || {}) };
                                        const isEdited = editedText[item.id] !== undefined;
                                        const isSelected = selectedId === item.id;
                                        const isEditing = editingId === item.id;
                                        const textValue = editedText[item.id] ?? item.text;

                                        // Contextual Toolbar inside the loop to position it above the item
                                        const showToolbar = isSelected && !isEditing;

                                        return (
                                            <React.Fragment key={item.id}>
                                                {showToolbar && (
                                                    <div className="absolute z-[1001] bottom-full mb-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gray-900 text-white p-1 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                                                        <button onClick={(e) => { e.stopPropagation(); updateItemStyle(item.id, { fontFamily: style.fontFamily.includes('serif') ? 'Arial, sans-serif' : '"Times New Roman", serif' }) }} className="p-2 hover:bg-gray-800 rounded-lg"><Type size={16} /></button>
                                                        <div className="w-px h-6 bg-gray-700 mx-1"></div>
                                                        <button onClick={(e) => { e.stopPropagation(); updateItemStyle(item.id, { fontWeight: style.fontWeight === '700' ? '400' : '700' }) }} className={`p-2 hover:bg-gray-800 rounded-lg ${style.fontWeight === '700' ? 'text-blue-400' : ''}`}><Bold size={16} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); updateItemStyle(item.id, { fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' }) }} className={`p-2 hover:bg-gray-800 rounded-lg ${style.fontStyle === 'italic' ? 'text-blue-400' : ''}`}><Italic size={16} /></button>
                                                        <div className="w-px h-6 bg-gray-700 mx-1"></div>
                                                        <button onClick={(e) => { e.stopPropagation(); updateItemStyle(item.id, { fontSize: style.fontSize + 1 }) }} className="p-2 hover:bg-gray-800 rounded-lg font-bold text-xs">A+</button>
                                                        <button onClick={(e) => { e.stopPropagation(); updateItemStyle(item.id, { fontSize: style.fontSize - 1 }) }} className="p-2 hover:bg-gray-800 rounded-lg font-bold text-xs">A-</button>
                                                        <div className="w-px h-6 bg-gray-700 mx-1"></div>
                                                        <button onClick={(e) => { e.stopPropagation(); updateItemStyle(item.id, { color: style.color === 'rgb(0, 0, 0)' ? 'rgb(255, 0, 0)' : 'rgb(0, 0, 0)' }) }} className="p-2 hover:bg-gray-800 rounded-lg"><Palette size={16} /></button>
                                                        <div className="w-px h-6 bg-gray-700 mx-1"></div>
                                                        <button onClick={(e) => { e.stopPropagation(); setEditingId(item.id) }} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold transition-all">EDIT</button>
                                                    </div>
                                                )}

                                                {isEditing ? (
                                                    <input
                                                        autoFocus
                                                        defaultValue={textValue}
                                                        onBlur={(e) => { setEditedText(p => ({ ...p, [item.id]: e.target.value })); setEditingId(null); setSelectedId(item.id); }}
                                                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                                        className="absolute z-[1000] border-none outline-none shadow-[0_0_0_2px_#3b82f6]"
                                                        style={{
                                                            left: item.x - 2,
                                                            top: item.y - 2,
                                                            width: Math.max(item.width + 100, 200),
                                                            height: item.height + 4,
                                                            fontSize: `${style.fontSize}px`,
                                                            fontFamily: style.fontFamily,
                                                            fontWeight: style.fontWeight,
                                                            fontStyle: style.fontStyle,
                                                            color: style.color,
                                                            backgroundColor: '#FFFFFF', // SOLID WHITE MASK
                                                            padding: '0 2px',
                                                            lineHeight: 1
                                                        }}
                                                    />
                                                ) : (
                                                    <div
                                                        onClick={(e) => { e.stopPropagation(); setSelectedId(isSelected ? null : item.id); }}
                                                        className={`absolute cursor-pointer transition-all ${isSelected ? 'shadow-[0_0_0_1px_#3b82f6] outline-[1px] outline-dashed outline-[#3b82f6] z-[50]' : 'hover:outline-[1px] hover:outline-dashed hover:outline-blue-300'}`}
                                                        style={{
                                                            left: item.x,
                                                            top: item.y,
                                                            width: item.width,
                                                            height: item.height,
                                                            fontSize: `${style.fontSize}px`,
                                                            fontFamily: style.fontFamily,
                                                            fontWeight: style.fontWeight,
                                                            fontStyle: style.fontStyle,
                                                            color: style.color,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            whiteSpace: 'nowrap',
                                                            backgroundColor: isEdited ? 'white' : 'transparent',
                                                            opacity: isSelected ? 1 : (isEdited ? 1 : 0), // GHOST OVERLAY
                                                            pointerEvents: 'auto'
                                                        }}
                                                    >
                                                        {isEdited && textValue}
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PdfEditor;
