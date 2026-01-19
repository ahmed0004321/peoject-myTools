import React, { useState } from 'react';
import { X, ArrowUp, ArrowDown, FileDown, Loader2, ImageMinus, Upload, Plus } from 'lucide-react';
import { FileWithPreview } from '../types';
import SectionHeader from '../components/ui/SectionHeader';

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
    <div className="min-h-screen bg-background pb-20 animate-fade-in">
      <SectionHeader
        title="Image to PDF"
        subtitle="Combine multiple images into a single PDF document."
      />

      <div className={`max-w-6xl mx-auto px-4 ${images.length === 0 ? 'max-w-3xl' : ''}`}>

        {images.length === 0 ? (
          /* Initial State: Standard Centered Card */
          <div className="bg-surface border border-border rounded-3xl p-8 shadow-xl text-center space-y-8 animate-slide-up">
            <div className="space-y-6">
              <div className="w-24 h-24 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto mb-6">
                <ImageMinus size={48} />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Upload Images</h3>
                <p className="text-secondary">Convert JPGs and PNGs into a PDF document.</p>
              </div>

              <label className="inline-flex items-center gap-3 px-8 py-4 bg-brand-green text-white rounded-xl font-bold text-lg cursor-pointer hover:bg-emerald-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20">
                <Upload size={24} />
                Select Images
                <input
                  type="file"
                  className="hidden"
                  accept="image/png, image/jpeg, image/jpg"
                  multiple
                  onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                />
              </label>
            </div>
          </div>
        ) : (
          /* Workspace State */
          <div className="space-y-8 animate-fade-in">
            {/* Toolbar setup */}
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xl font-bold text-primary">Selected Images ({images.length})</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => setImages([])}
                  className="text-secondary hover:text-red-500 font-bold text-sm transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={convertToPdf}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-6 py-2.5 bg-brand-green text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <FileDown size={18} />}
                  Convert to PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {images.map((img, idx) => (
                <div key={img.id || idx} className="relative group bg-surface p-2 rounded-2xl border border-border transition-all hover:border-brand-green hover:shadow-lg">
                  <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                    <img
                      src={img.preview}
                      alt="preview"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => removeImage(idx)}
                      className="p-1.5 bg-black/50 backdrop-blur rounded-full text-white hover:bg-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="flex justify-center mt-3 gap-2">
                    <button
                      onClick={() => moveImage(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 text-secondary transition-colors"
                    >
                      <ArrowUp size={16} className="rotate-[-90deg]" />
                    </button>
                    <span className="text-xs font-mono py-1.5 text-secondary">{idx + 1}</span>
                    <button
                      onClick={() => moveImage(idx, 1)}
                      disabled={idx === images.length - 1}
                      className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 text-secondary transition-colors"
                    >
                      <ArrowDown size={16} className="rotate-[-90deg]" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add More Card */}
              <label className="flex flex-col items-center justify-center aspect-[3/4] border-2 border-dashed border-border rounded-2xl hover:border-brand-green hover:bg-brand-green/5 cursor-pointer transition-all group">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 group-hover:bg-brand-green/20 rounded-full flex items-center justify-center mb-3 text-secondary group-hover:text-brand-green transition-colors">
                  <Plus size={24} />
                </div>
                <span className="text-sm font-bold text-secondary group-hover:text-brand-green">Add Images</span>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageToPdf;