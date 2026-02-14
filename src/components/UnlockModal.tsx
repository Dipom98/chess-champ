import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, BOARD_THEMES, PIECE_THEMES, BoardThemeConfig, PieceThemeConfig } from '@/store/gameStore';
import { ChessPieceRenderer } from './ChessPieceRenderer';
import { LockOpen, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';

export function UnlockModal() {
    const { unlockedModalQueue, dismissUnlockModal } = useGameStore();

    if (unlockedModalQueue.length === 0) return null;

    const currentUnlock = unlockedModalQueue[0];
    const { type, id } = currentUnlock;

    let itemConfig: BoardThemeConfig | PieceThemeConfig;
    let DisplayComponent: React.FC;

    if (type === 'board') {
        const config = BOARD_THEMES[id as keyof typeof BOARD_THEMES];
        itemConfig = config;
        DisplayComponent = () => (
            <div className="relative w-32 h-32 rounded-xl overflow-hidden shadow-2xl border-4 border-amber-400">
                <div className="grid grid-cols-2 w-full h-full">
                    <div className={cn(config.light, 'w-full h-full')} />
                    <div className={cn(config.dark, 'w-full h-full')} />
                    <div className={cn(config.dark, 'w-full h-full')} />
                    <div className={cn(config.light, 'w-full h-full')} />
                </div>
                {config.isPremium && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shimmer" />
                    </div>
                )}
            </div>
        );
    } else {
        const config = PIECE_THEMES[id as keyof typeof PIECE_THEMES];
        itemConfig = config;
        DisplayComponent = () => (
            <div className="relative w-32 h-32 bg-white/10 rounded-xl flex items-center justify-center border-4 border-amber-400 shadow-2xl backdrop-blur-sm">
                <div className="w-24 h-24 relative">
                    <ChessPieceRenderer
                        type="knight"
                        color="white"
                        theme={id as any}
                        className="w-full h-full"
                    />
                </div>
            </div>
        );
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={dismissUnlockModal}
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.5, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.5, opacity: 0, y: 20 }}
                    className="bg-gradient-to-br from-slate-900 to-slate-800 p-1 rounded-3xl w-full max-w-sm relative z-10 overflow-hidden shadow-2xl shadow-amber-500/20"
                >
                    {/* Shine effect border */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/50 via-transparent to-amber-600/50 opacity-50 rounded-3xl pointer-events-none" />

                    <div className="bg-slate-900 rounded-[22px] p-6 flex flex-col items-center text-center relative overflow-hidden">

                        {/* Background Rays */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-20 -left-20 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(251,191,36,0.1)_20deg,transparent_40deg)] opacity-50 pointer-events-none"
                        />

                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
                            className="mb-6 relative"
                        >
                            <div className="absolute -inset-4 bg-amber-500/20 blur-xl rounded-full" />
                            <DisplayComponent />
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5 }}
                                className="absolute -top-3 -right-3 bg-amber-500 text-white p-2 rounded-full shadow-lg"
                            >
                                <LockOpen size={20} fill="currentColor" />
                            </motion.div>
                        </motion.div>

                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl font-bold text-white mb-2"
                        >
                            New {type === 'board' ? 'Theme' : 'Style'} Unlocked!
                        </motion.h2>

                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-amber-400 font-bold text-lg mb-1"
                        >
                            {itemConfig?.name}
                        </motion.p>

                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-white/50 text-sm mb-8"
                        >
                            You've reached rank <span className="text-white font-medium">{itemConfig?.requiredRank}</span>
                        </motion.p>

                        <motion.button
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={dismissUnlockModal}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
                        >
                            <span className="text-lg">Awesome!</span>
                            <Sparkles size={20} />
                        </motion.button>

                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
