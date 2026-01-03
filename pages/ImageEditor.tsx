import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import FileUploader from '../components/FileUploader';
import { Crop as CropIcon, Download, Sliders } from 'lucide-react';

// Helper to center crop initially
function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
    return centerCrop(
        makeAspectCrop(
            { unit: '%', width: 90 },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    )
}

const ImageEditor: React.FC = () => {
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [aspect, setAspect] = useState<number | undefined>(undefined);

    const imgRef = useRef<HTMLImageElement>(null);
    const hiddenAnchorRef = useRef<HTMLAnchorElement>(null);
    const blobUrlRef = useRef('');

    const onSelectFile = (files: File[]) => {
        if (files && files.length > 0) {
            setCrop(undefined); // Makes crop preview update between images
            const reader = new FileReader();
            reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
            reader.readAsDataURL(files[0]);
        }
    };

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        if (aspect) {
            const { width, height } = e.currentTarget;
            setCrop(centerAspectCrop(width, height, aspect));
        }
    };

    const onDownloadCropClick = async () => {
        const image = imgRef.current;
        const previewCanvas = document.createElement('canvas');
        if (!image || !completedCrop) return;

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        const ctx = previewCanvas.getContext('2d');
        if (!ctx) return;

        const pixelRatio = window.devicePixelRatio;
        previewCanvas.width = completedCrop.width * pixelRatio * scaleX;
        previewCanvas.height = completedCrop.height * pixelRatio * scaleY;

        ctx.scale(pixelRatio, pixelRatio);
        ctx.imageSmoothingQuality = 'high';

        const cropX = completedCrop.x * scaleX;
        const cropY = completedCrop.y * scaleY;
        const cropWidth = completedCrop.width * scaleX;
        const cropHeight = completedCrop.height * scaleY;

        ctx.drawImage(
            image,
            cropX, cropY, cropWidth, cropHeight,
            0, 0,
            cropWidth, cropHeight,
        );

        previewCanvas.toBlob((blob) => {
            if (!blob) return;
            if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
            blobUrlRef.current = URL.createObjectURL(blob);
            hiddenAnchorRef.current!.href = blobUrlRef.current;
            hiddenAnchorRef.current!.click();
        });
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Crop & Resize Station</h1>
                <p className="text-[var(--text-secondary)] mt-2">Adjust your images to perfect dimensions.</p>
            </div>

            {!imgSrc ? (
                <FileUploader
                    onFilesSelected={onSelectFile}
                    accept="image/*"
                    title="Upload image to edit"
                />
            ) : (
                <div className="grid lg:grid-cols-[300px,1fr] gap-8 items-start">
                    <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl shadow-sm border border-[var(--border-color)]">
                        <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                            <Sliders size={18} /> Controls
                        </h3>

                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">Aspect Ratio</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button onClick={() => setAspect(undefined)} className={`py-2 text-sm border rounded hover:bg-inset ${!aspect ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}>Free</button>
                                    <button onClick={() => setAspect(1)} className={`py-2 text-sm border rounded hover:bg-inset ${aspect === 1 ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}>Square</button>
                                    <button onClick={() => setAspect(16 / 9)} className={`py-2 text-sm border rounded hover:bg-inset ${aspect === 16 / 9 ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}>16:9</button>
                                </div>
                            </div>

                            <button
                                onClick={onDownloadCropClick}
                                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-4 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Download size={18} /> Download Crop
                            </button>

                            <button
                                onClick={() => setImgSrc('')}
                                className="w-full py-2 text-[var(--text-secondary)] text-sm hover:text-[var(--text-primary)]"
                            >
                                Choose Different Image
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-2xl overflow-hidden p-8 flex items-center justify-center min-h-[500px]">
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={aspect}
                            className="max-h-[70vh]"
                        >
                            <img
                                ref={imgRef}
                                alt="Crop me"
                                src={imgSrc}
                                onLoad={onImageLoad}
                                style={{ transform: `scale(1)` }} // Add simple zoom later if needed
                            />
                        </ReactCrop>
                    </div>
                </div>
            )}
            <a
                ref={hiddenAnchorRef}
                download="cropped-image.png"
                style={{ position: 'absolute', top: -2000, left: -2000 }}
            >Hidden Download Anchor</a>
        </div>
    );
};

export default ImageEditor;
