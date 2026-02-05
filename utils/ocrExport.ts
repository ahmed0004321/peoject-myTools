import { Document, Packer, Paragraph, TextRun } from 'docx';
import { jsPDF } from 'jspdf';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Interface mirrored from OcrTool for typing
 */
interface PreservedData {
    pages: {
        index: number;
        words: { text: string; x: number; y: number; w: number; h: number; fontSize: number }[];
        width: number;
        height: number;
        image: string;
    }[];
    originalFile?: File;
}

/**
 * Export to a PDF while preserving original layout
 */
export const exportToPreservedPdf = async (data: PreservedData, filename: string = 'restored_document.pdf') => {
    let pdfDoc: PDFDocument;

    if (data.originalFile) {
        const existingPdfBytes = await data.originalFile.arrayBuffer();
        pdfDoc = await PDFDocument.load(existingPdfBytes);
    } else {
        pdfDoc = await PDFDocument.create();
    }

    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    for (let i = 0; i < data.pages.length; i++) {
        const ocrPage = data.pages[i];
        const pdfPage = i < pages.length ? pages[i] : pdfDoc.addPage([ocrPage.width, ocrPage.height]);

        const { width, height } = pdfPage.getSize();

        // Scale factors if sizes differ
        const scaleX = width / ocrPage.width;
        const scaleY = height / ocrPage.height;

        for (const word of ocrPage.words) {
            // Draw a white rectangle to "hide" original text (optional but cleaner)
            pdfPage.drawRectangle({
                x: word.x * scaleX,
                y: height - (word.y * scaleY + word.h * scaleY), // PDF coordinates are bottom-up
                width: word.w * scaleX,
                height: word.h * scaleY,
                color: rgb(1, 1, 1),
            });

            pdfPage.drawText(word.text, {
                x: word.x * scaleX,
                y: height - (word.y * scaleY + word.h * scaleY) + (word.h * 0.1 * scaleY),
                size: word.fontSize * scaleY * 0.8,
                font: font,
                color: rgb(0, 0, 0),
            });
        }
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

/**
 * Export to an image with text overlay
 */
export const exportToPreservedImage = async (page: PreservedData['pages'][0], filename: string = 'restored_image.png') => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = page.width;
    canvas.height = page.height;

    const img = new Image();
    img.src = page.image;
    await new Promise(resolve => img.onload = resolve);

    ctx.drawImage(img, 0, 0);

    // Overlay text
    ctx.fillStyle = 'black';
    for (const word of page.words) {
        // Clean background for word
        ctx.fillStyle = 'white';
        ctx.fillRect(word.x, word.y, word.w, word.h);

        ctx.fillStyle = 'black';
        ctx.font = `${word.fontSize}px serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(word.text, word.x, word.y);
    }

    const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png'));
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

/**
 * Export text to a DOCX (Microsoft Word) file
 */
export const exportToDocx = async (text: string, filename: string = 'extracted_text.docx') => {
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: text.split('\n').map(line =>
                    new Paragraph({
                        children: [new TextRun(line)],
                    })
                ),
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

/**
 * Export text to a PDF file (Plain Text)
 */
export const exportToPdf = (text: string, filename: string = 'extracted_text.pdf') => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const maxLineWidth = pageWidth - margin * 2;

    const lines = doc.splitTextToSize(text, maxLineWidth);
    doc.text(lines, margin, 20);
    doc.save(filename);
};
