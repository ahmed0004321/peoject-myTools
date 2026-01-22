export interface PDFLib {
  PDFDocument: any;
  rgb: (r: number, g: number, b: number) => any;
  StandardFonts: any;
}

export interface PDFJS {
  getDocument: (src: string | Uint8Array) => any;
  GlobalWorkerOptions: {
    workerSrc: string;
  };
}

declare global {
  interface Window {
    PDFLib: PDFLib;
    pdfjsLib: PDFJS;
    JSZip: any;
    Tesseract: any;
  }
}

export type ToolType = 'img-to-pdf' | 'pdf-to-img' | 'merge-pdf' | 'img-toolkit' | 'image-gen';

export interface FileWithPreview extends File {
  preview?: string;
  id?: string;
}