import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';

interface ImageCropperProps {
    image: string;
    onCrop: (croppedImage: string) => void;
    onCancel: () => void;
}

export function ImageCropper({ image, onCrop, onCancel }: ImageCropperProps) {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Zoom limits
    const minZoom = 0.5;
    const maxZoom = 5;

    const handleCrop = async () => {
        if (!imageRef.current) return;
        setIsProcessing(true);

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const img = imageRef.current;
            const size = 512; // Higher resolution for better quality
            canvas.width = size;
            canvas.height = size;

            // Get the current transform of the image relative to the crop area
            // This is a simplified version using the DOM position
            const cropRect = document.getElementById('crop-area')?.getBoundingClientRect();
            const imgRect = img.getBoundingClientRect();

            if (cropRect) {
                const scaleX = img.naturalWidth / imgRect.width;
                const scaleY = img.naturalHeight / imgRect.height;

                const offsetX = (cropRect.left - imgRect.left) * scaleX;
                const offsetY = (cropRect.top - imgRect.top) * scaleY;
                const width = cropRect.width * scaleX;
                const height = cropRect.height * scaleY;

                ctx.drawImage(
                    img,
                    offsetX, offsetY, width, height,
                    0, 0, size, size
                );

                const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                onCrop(croppedDataUrl);
            }
        } catch (err) {
            console.error('Cropping failed:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-4"
        >
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Refine Photo</h2>
                    <p className="text-white/50 text-xs">Drag and zoom to fit the frame. You can now show any part of your image.</p>
                </div>

                {/* Crop Container */}
                <div
                    ref={containerRef}
                    className="relative aspect-square w-full bg-white/5 rounded-3xl overflow-hidden touch-none"
                >
                    {/* Draggable Image */}
                    <motion.img
                        ref={imageRef}
                        src={image}
                        drag
                        dragMomentum={false}
                        style={{
                            scale: zoom,
                            rotate: rotation,
                            cursor: 'move'
                        }}
                        className="absolute inset-0 w-full h-full object-contain"
                    />

                    {/* Mask / Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        {/* The flexible square crop area */}
                        <div
                            id="crop-area"
                            className="w-72 h-72 rounded-xl border-2 border-amber-400/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] relative"
                        >
                            {/* Corner indicators for a premium feel */}
                            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-400 rounded-tl-sm" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-400 rounded-tr-sm" />
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-400 rounded-bl-sm" />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-400 rounded-br-sm" />
                        </div>
                    </div>

                    {/* Overlay Helper Text */}
                    <div className="absolute top-4 left-0 right-0 text-center pointer-events-none">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-[10px] text-white/70 uppercase tracking-widest">
                            <Move size={12} className="text-amber-400" />
                            Drag to Position
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="glass rounded-2xl p-5 space-y-5 border border-white/10">
                    <div className="flex items-center gap-4">
                        <ZoomOut size={18} className="text-white/40" />
                        <input
                            type="range"
                            min={minZoom}
                            max={maxZoom}
                            step={0.1}
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-amber-400"
                        />
                        <ZoomIn size={18} className="text-white/40" />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setRotation(prev => prev - 90)}
                            className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/70 hover:bg-white/10"
                        >
                            <RotateCcw size={20} className="-scale-x-100" />
                        </motion.button>
                        <div className="flex-1 flex gap-3">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={onCancel}
                                className="flex-1 py-3.5 rounded-xl glass text-white font-bold border border-white/10"
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCrop}
                                disabled={isProcessing}
                                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Check size={20} />
                                        Done
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
