import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import { X, ArrowUp, ArrowDown, FileDown, Loader2 } from 'lucide-react';
import { FileWithPreview } from '../types';

const ImageToPdf: React.FC = () => {
  const [images, setImages] = useState<FileWithPreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = (files: File[]) => {
    const newImages = files.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7)
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview!);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= images.length) return;
    setImages(prev => {
      const newImages = [...prev];
      const temp = newImages[index];
      newImages[index] = newImages[index + direction];
      newImages[index + direction] = temp;
      return newImages;
    });
  };

  const convertToPdf = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);

    try {
      // @ts-ignore - Loaded via CDN
      const { PDFDocument } = window.PDFLib;
      const pdfDoc = await PDFDocument.create();

      for (const image of images) {
        const imageBytes = await image.arrayBuffer();
        let pdfImage;

        if (image.type === 'image/jpeg') {
          pdfImage = await pdfDoc.embedJpg(imageBytes);
        } else {
          pdfImage = await pdfDoc.embedPng(imageBytes);
        }

        const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
        page.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: pdfImage.width,
          height: pdfImage.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'converted-images.pdf';
      link.click();
    } catch (error) {
      console.error('Error creating PDF:', error);
      alert('Failed to create PDF. Please ensure files are valid JPG/PNG.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-display font-bold text-primary">Image to PDF</h1>
        <p className="text-secondary text-lg">Convert JPG and PNG images to PDF instantly.</p>
      </div>

      {images.length === 0 ? (
        <FileUploader
          onFilesSelected={handleFiles}
          accept="image/png, image/jpeg, image/jpg"
          multiple
          title="Drop your images here"
        />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img, idx) => (
              <div key={img.id} className="relative group bg-surface p-2 rounded-xl border border-border transition-all hover:border-[var(--accent-primary)] hover:shadow-lg">
                <div className="aspect-square w-full rounded-lg overflow-hidden bg-background">
                  <img
                    src={img.preview}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => removeImage(idx)}
                    className="p-1.5 bg-background/90 backdrop-blur rounded-full shadow-sm text-secondary hover:text-red-500 hover:bg-background border border-border"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="flex justify-center mt-3 gap-2">
                  <button
                    onClick={() => moveImage(idx, -1)}
                    disabled={idx === 0}
                    className="p-1.5 rounded-md hover:bg-background disabled:opacity-30 text-secondary transition-colors"
                  >
                    <ArrowUp size={16} className="rotate-[-90deg]" />
                  </button>
                  <span className="text-xs font-mono py-1.5 text-secondary">{idx + 1}</span>
                  <button
                    onClick={() => moveImage(idx, 1)}
                    disabled={idx === images.length - 1}
                    className="p-1.5 rounded-md hover:bg-background disabled:opacity-30 text-secondary transition-colors"
                  >
                    <ArrowDown size={16} className="rotate-[-90deg]" />
                  </button>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-center border-2 border-dashed border-border rounded-xl aspect-square hover:border-[var(--accent-primary)] hover:bg-surface/50 transition-all">
              <label className="cursor-pointer flex flex-col items-center p-4 text-secondary hover:text-[var(--accent-primary)] transition-colors">
                <span className="text-3xl font-light mb-2">+</span>
                <span className="text-sm font-medium">Add more</span>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/png, image/jpeg"
                  onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4 border-t border-border pt-8">
            <button
              onClick={() => setImages([])}
              className="px-6 py-3 text-secondary hover:text-red-500 transition-colors font-medium text-sm"
            >
              Clear All
            </button>
            <button
              onClick={convertToPdf}
              disabled={isProcessing}
              className="flex items-center gap-2 px-8 py-3 bg-[var(--accent-primary)] text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:scale-100"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Processing...
                </>
              ) : (
                <>
                  <FileDown size={20} /> Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageToPdf;