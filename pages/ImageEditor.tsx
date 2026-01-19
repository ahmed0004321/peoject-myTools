import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Crop as CropIcon, Download, Sliders, Upload } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';

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
        <div className="min-h-screen bg-background pb-20 animate-fade-in">
            <SectionHeader
                title="Crop & Resize Station"
                subtitle="Adjust your images to perfect dimensions."
            />

            <div className={`max-w-6xl mx-auto px-4 ${!imgSrc ? 'max-w-3xl' : ''}`}>
                {!imgSrc ? (
                    /* Initial State: Standard Centered Card */
                    <div className="bg-surface border border-border rounded-3xl p-8 shadow-xl text-center space-y-8 animate-slide-up">
                        <div className="space-y-6">
                            <div className="w-24 h-24 bg-brand-pink/10 text-brand-pink rounded-full flex items-center justify-center mx-auto mb-6">
                                <CropIcon size={48} />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">Upload Image to Edit</h3>
                                <p className="text-secondary">Crop, resize, and prepare your images for any platform.</p>
                            </div>

                            <label className="inline-flex items-center gap-3 px-8 py-4 bg-brand-pink text-white rounded-xl font-bold text-lg cursor-pointer hover:bg-pink-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-pink-500/20">
                                <Upload size={24} />
                                Select Image
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => onSelectFile(Array.from(e.target.files || []))} />
                            </label>

                            <p className="text-xs text-secondary/60 pt-4">
                                *All edits happen locally on your device.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Editor View */
                    <div className="grid lg:grid-cols-[300px,1fr] gap-8 items-start animate-fade-in">
                        <div className="bg-surface p-6 rounded-2xl shadow-xl border border-border">
                            <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                                <Sliders size={18} /> Controls
                            </h3>

                            <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold uppercase text-secondary">Aspect Ratio</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button onClick={() => setAspect(undefined)} className={`py-2 text-sm border rounded-lg transition-colors ${!aspect ? 'border-brand-pink text-brand-pink bg-pink-50 dark:bg-pink-900/20' : 'border-border text-secondary hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>Free</button>
                                        <button onClick={() => setAspect(1)} className={`py-2 text-sm border rounded-lg transition-colors ${aspect === 1 ? 'border-brand-pink text-brand-pink bg-pink-50 dark:bg-pink-900/20' : 'border-border text-secondary hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>Square</button>
                                        <button onClick={() => setAspect(16 / 9)} className={`py-2 text-sm border rounded-lg transition-colors ${aspect === 16 / 9 ? 'border-brand-pink text-brand-pink bg-pink-50 dark:bg-pink-900/20' : 'border-border text-secondary hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>16:9</button>
                                    </div>
                                </div>

                                <button
                                    onClick={onDownloadCropClick}
                                    className="w-full py-3 bg-brand-pink text-white font-bold rounded-xl mt-4 hover:bg-pink-600 shadow-lg shadow-pink-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Download size={18} /> Download Crop
                                </button>

                                <button
                                    onClick={() => setImgSrc('')}
                                    className="w-full py-2 text-secondary text-sm hover:text-primary transition-colors"
                                >
                                    Choose Different Image
                                </button>
                            </div>
                        </div>

                        <div className="bg-zinc-900 rounded-2xl overflow-hidden p-8 flex items-center justify-center min-h-[500px] shadow-2xl border border-zinc-800">
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
                                    style={{ transform: `scale(1)` }}
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
        </div>
    );
};

export default ImageEditor;
