import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import { X, ArrowUp, ArrowDown, Combine, Loader2, FileText } from 'lucide-react';

interface PdfFile {
  file: File;
  id: string;
  pageCount?: number;
}

const MergePdf: React.FC = () => {
  const [pdfs, setPdfs] = useState<PdfFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = async (files: File[]) => {
    // Basic validation
    const validFiles = files.filter(f => f.type === 'application/pdf');
    if (validFiles.length !== files.length) {
        alert("Some files were skipped because they are not PDFs.");
    }

    const newPdfs = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7)
    }));
    
    setPdfs(prev => [...prev, ...newPdfs]);
    
    // In a real app, we might load them here to count pages, 
    // but for speed we'll skip page counting preview until necessary.
  };

  const removePdf = (index: number) => {
    setPdfs(prev => {
      const newPdfs = [...prev];
      newPdfs.splice(index, 1);
      return newPdfs;
    });
  };

  const movePdf = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= pdfs.length) return;
    setPdfs(prev => {
      const newPdfs = [...prev];
      const temp = newPdfs[index];
      newPdfs[index] = newPdfs[index + direction];
      newPdfs[index + direction] = temp;
      return newPdfs;
    });
  };

  const mergeFiles = async () => {
    if (pdfs.length < 2) {
        alert("Please select at least 2 PDF files to merge.");
        return;
    }
    setIsProcessing(true);

    try {
      // @ts-ignore
      const { PDFDocument } = window.PDFLib;
      const mergedPdf = await PDFDocument.create();

      for (const pdfItem of pdfs) {
        const arrayBuffer = await pdfItem.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page: any) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `merged-document-${Date.now()}.pdf`;
      link.click();
    } catch (error) {
      console.error('Error merging PDF:', error);
      alert('Failed to merge PDFs. One of the files might be encrypted or corrupted.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Merge PDF</h1>
        <p className="text-slate-500 mt-2">Combine multiple PDF files into one. Drag and drop to reorder.</p>
      </div>

      {pdfs.length === 0 ? (
        <FileUploader 
          onFilesSelected={handleFiles} 
          accept="application/pdf" 
          multiple
          title="Drop PDFs here to merge"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-3">
            {pdfs.map((item, idx) => (
              <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{item.file.name}</p>
                        <p className="text-xs text-slate-500">{(item.file.size / 1024).toFixed(1)} KB</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex bg-slate-100 rounded-lg p-1 mr-2">
                    <button 
                        onClick={() => movePdf(idx, -1)}
                        disabled={idx === 0}
                        className="p-1.5 hover:bg-white hover:shadow-sm rounded-md disabled:opacity-30 transition-all text-slate-600"
                        title="Move Up"
                    >
                        <ArrowUp size={16} />
                    </button>
                    <button 
                        onClick={() => movePdf(idx, 1)}
                        disabled={idx === pdfs.length - 1}
                        className="p-1.5 hover:bg-white hover:shadow-sm rounded-md disabled:opacity-30 transition-all text-slate-600"
                        title="Move Down"
                    >
                        <ArrowDown size={16} />
                    </button>
                  </div>
                  <button 
                    onClick={() => removePdf(idx)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
            
            <button 
               className="mt-4 border-2 border-dashed border-slate-300 rounded-xl p-4 text-slate-500 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 font-medium"
               onClick={() => document.getElementById('add-more-input')?.click()}
            >
                <input 
                  id="add-more-input"
                  type="file" 
                  className="hidden" 
                  multiple 
                  accept="application/pdf" 
                  onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))} 
                />
                <Combine size={18} /> Add more PDFs
            </button>
          </div>

          <div className="flex justify-end gap-4 border-t pt-6">
             <button 
              onClick={() => setPdfs([])}
              className="px-4 py-2 text-slate-600 hover:text-red-600 font-medium transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={mergeFiles}
              disabled={isProcessing}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:scale-100"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Merging...
                </>
              ) : (
                <>
                  <Combine size={20} /> Merge PDFs
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MergePdf;