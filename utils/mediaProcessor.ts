import imageCompression from 'browser-image-compression';
import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';
import pica from 'pica';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface OptimizationOptions {
    maxSizeMB?: number;
    // New specific dimension controls
    targetWidth?: number;
    targetHeight?: number;
    maintainAspectRatio?: boolean;
    fitMode?: 'stretch' | 'cover' | 'contain'; // New Fit Modes

    // Legacy support (to be deprecated or mapped)
    maxWidthOrHeight?: number;

    targetFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
    useWebWorker?: boolean;
}

export const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Core Resizing & Sharpening Engine (The "Magic")
 * - Handles both simple Resizing and Binary Search Compression
 * - Applies Smart Sharpening based on scale factor
 */

// Internal helper for the actual Pica Resize + Sharpening operation
const performSmartResize = async (
    img: HTMLImageElement,
    width: number,
    height: number,
    format: string,
    fitMode: 'stretch' | 'cover' | 'contain' = 'stretch'
): Promise<{ blob: Blob, canvas: HTMLCanvasElement }> => {
    const picaInstance = pica();

    // 1. Calculate Source Crop (for 'cover' / 'contain' logic if needed)
    let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;

    // "Cover" logic (Crop Center)
    if (fitMode === 'cover') {
        const aspectSrc = srcW / srcH;
        const aspectDest = width / height;

        if (aspectSrc > aspectDest) {
            // Source is wider, crop sides
            const newSrcW = srcH * aspectDest;
            srcX = (srcW - newSrcW) / 2;
            srcW = newSrcW;
        } else {
            // Source is taller, crop top/bottom
            const newSrcH = srcW / aspectDest;
            srcY = (srcH - newSrcH) / 2;
            srcH = newSrcH;
        }
    }

    // 2. Prepare Source Element (Crop if needed)
    let sourceElement: HTMLImageElement | HTMLCanvasElement = img;
    if (fitMode === 'cover') {
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = srcW;
        cropCanvas.height = srcH;
        const ctx = cropCanvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
            sourceElement = cropCanvas;
        }
    }

    // 3. Smart Sharpening Calculation
    // Logic: Apply more sharpening for Upscales, less for Downscales
    // Scale Factor > 1.0 = Upscale
    const scaleX = width / srcW;
    const scaleY = height / srcH;
    const avgScale = (scaleX + scaleY) / 2;

    let unsharpAmount = 0;
    let unsharpRadius = 0.5;
    let unsharpThreshold = 0;

    if (avgScale > 1.0) {
        // Upscale: Boost sharpness significantly to combat blur
        // Cap at 150 to avoid deep frying the image
        unsharpAmount = Math.min(150, 60 * avgScale);
        unsharpRadius = 0.6;
        unsharpThreshold = 1; // Lower threshold to catch more edges in upscale
    } else if (avgScale < 1.0) {
        // Downscale: Very mild sharpening to restore crispness lost in resampling
        unsharpAmount = 20;
        unsharpRadius = 0.5;
        unsharpThreshold = 5; // Higher threshold to avoid noise
    }

    // 4. Perform Resize
    const offScreenCanvas = document.createElement('canvas');
    offScreenCanvas.width = width;
    offScreenCanvas.height = height;

    await picaInstance.resize(sourceElement, offScreenCanvas, {
        unsharpAmount: unsharpAmount,
        unsharpRadius: unsharpRadius,
        unsharpThreshold: unsharpThreshold
    });

    // 5. Initial Blob Export
    const blob = await picaInstance.toBlob(offScreenCanvas, format, 0.90);

    return { blob, canvas: offScreenCanvas };
};

/**
 * Binary Search Compression Loop
 * Targets a specific file size within ±5% tolerance.
 */
const compressBinarySearch = async (
    file: File,
    targetSizeByte: number,
    width: number,
    height: number,
    format: string,
    fitMode: 'stretch' | 'cover' | 'contain' = 'stretch'
): Promise<Blob> => {

    // 1. Load Image
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    await new Promise(r => img.onload = r);

    // 2. Perform ONE high-quality resize + sharpening
    // This gives us a Canvas with the perfect pixels
    const { canvas: resizedCanvas, blob: initialBlob } = await performSmartResize(img, width, height, format, fitMode);

    URL.revokeObjectURL(objectUrl);

    // If no target size, just return the high quality resize
    if (!targetSizeByte || targetSizeByte <= 0) {
        return initialBlob;
    }

    // 3. Binary Search for Target Size using the Resized Canvas
    // We re-encode the ALREADY RESIZED canvas at different qualities
    let minQ = 0.01;
    let maxQ = 1.0;
    const picaInstance = pica(); // Use pica's toBlob for consistency or canvas.toBlob

    let bestBlob: Blob | null = null;
    let bestDiff = Infinity;
    const MAX_STEPS = 8;

    for (let i = 0; i < MAX_STEPS; i++) {
        const midQ = (minQ + maxQ) / 2;

        // Pica's toBlob is usually cleaner, but standard canvas.toBlob is faster. 
        // Using pica instance for consistency with the resize call.
        const currentBlob = await picaInstance.toBlob(resizedCanvas, format, midQ);

        const size = currentBlob.size;
        const diff = Math.abs(size - targetSizeByte);

        // Track best
        if (diff < bestDiff) {
            bestDiff = diff;
            bestBlob = currentBlob;
        }

        // Tolerance ±5%
        const tolerance = targetSizeByte * 0.05;
        if (diff <= tolerance) {
            return currentBlob;
        }

        if (size > targetSizeByte) {
            maxQ = midQ;
        } else {
            minQ = midQ;
        }
    }

    return bestBlob || initialBlob;
};

export const compressImage = async (file: File, options: OptimizationOptions): Promise<Blob> => {
    try {
        let targetWidth = options.targetWidth;
        let targetHeight = options.targetHeight;

        if (!targetWidth || !targetHeight) {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            await new Promise(r => img.onload = r);
            targetWidth = img.width;
            targetHeight = img.height;
            // Legacy maxWidth support
            if (options.maxWidthOrHeight) {
                const scale = Math.min(1, options.maxWidthOrHeight / Math.max(img.width, img.height));
                targetWidth = Math.round(img.width * scale);
                targetHeight = Math.round(img.height * scale);
            }
        }

        const targetFormat = options.targetFormat || (file.type === 'image/png' ? 'image/png' : 'image/jpeg');
        const targetSizeByte = options.maxSizeMB ? (options.maxSizeMB * 1024 * 1024) : 0;

        return await compressBinarySearch(file, targetSizeByte, targetWidth, targetHeight, targetFormat, options.fitMode);

    } catch (error) {
        console.error("Smart compression failed:", error);
        return file;
    }
};

/**
 * Optimizes a PDF file by Physically Resizing Pages
 */
export const optimizePdf = async (file: File, options: OptimizationOptions): Promise<Blob> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();

        // Standard size targets: A4 is roughly 595 x 842 points (72 DPI)
        // If user creates a custom size (e.g. 500px width), we need to map that.
        // PDF units are points (1/72 inch). 
        // If options.targetWidth is provided in PIXELS (assumed 72DPI for PDF generic), we map directly.

        const targetW = options.targetWidth;
        const targetH = options.targetHeight;

        if (targetW && targetH) {
            pages.forEach(page => {
                const { width, height } = page.getSize();

                // Calculate Scale needed
                const scaleX = targetW / width;
                const scaleY = targetH / height;

                // For PDF, "Stretching" is essentially scaling the content
                // But we also need to set the new MediaBox

                // Standard approach: Scale content to fit new box
                page.scale(scaleX, scaleY);

                // Reset media box to new dimensions
                // page.setSize(targetW, targetH); // scale() usually updates dimensions, but verify
            });
        }

        // Metadata Cleanup
        pdfDoc.setTitle('');
        pdfDoc.setProducer('');
        pdfDoc.setCreator('');

        const compressedBytes = await pdfDoc.save();
        return new Blob([compressedBytes as BlobPart], { type: 'application/pdf' });
    } catch (error) {
        console.error("PDF optimization failed:", error);
        throw error;
    }
};
