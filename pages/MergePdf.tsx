import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import { X, ArrowUp, ArrowDown, Combine, Loader2, FileText } from 'lucide-react';
import Button from '../components/ui/Button';

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
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Merge PDF</h1>
        <p className="text-[var(--text-secondary)] mt-2">Combine multiple PDF files into one. Drag and drop to reorder.</p>
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
              <div key={item.id} className="flex items-center justify-between bg-[var(--bg-secondary)] p-4 rounded-xl shadow-sm border border-[var(--border-color)]">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-primary)] truncate">{item.file.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{(item.file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex bg-inset rounded-lg p-1 mr-2 border border-[var(--border-color)]">
                    <button
                      onClick={() => movePdf(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 hover:bg-[var(--bg-primary)] hover:shadow-sm rounded-md disabled:opacity-30 transition-all text-slate-600 dark:text-slate-400"
                      title="Move Up"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      onClick={() => movePdf(idx, 1)}
                      disabled={idx === pdfs.length - 1}
                      className="p-1.5 hover:bg-[var(--bg-primary)] hover:shadow-sm rounded-md disabled:opacity-30 transition-all text-slate-600 dark:text-slate-400"
                      title="Move Down"
                    >
                      <ArrowDown size={16} />
                    </button>
                  </div>
                  <button
                    onClick={() => removePdf(idx)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}

            <Button
              variant="secondary"
              className="mt-4 border-2 border-dashed border-[var(--border-color)] rounded-xl p-4 text-slate-500 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-600 hover:bg-inset transition-all flex items-center justify-center gap-2 font-medium bg-inset"
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
            </Button>
          </div>

          <div className="flex justify-end gap-4 border-t border-[var(--border-color)] pt-6">
            <button
              onClick={() => setPdfs([])}
              className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors"
            >
              Clear All
            </button>
            <Button
              onClick={mergeFiles}
              disabled={isProcessing}
              className="px-8 py-3"
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
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MergePdf;