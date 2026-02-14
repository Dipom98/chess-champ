import { motion } from 'framer-motion';
import appIcon from '@/assets/icon.png';

export function SplashScreen({ onComplete }: { onComplete?: () => void }) {
    return (
        <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 1, ease: [0.43, 0.13, 0.23, 0.96] }}
            onAnimationComplete={() => onComplete?.()}
            className="absolute inset-0 z-[100] bg-gradient-to-br from-[#0f0a1e] via-[#1a1333] to-[#0d1b2a] flex flex-col items-center justify-center overflow-hidden"
        >
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden">
                {['♔', '♕', '♖', '♗', '♘', '♙'].map((piece, i) => (
                    <motion.div
                        key={i}
                        className="absolute text-amber-400/10 text-3xl"
                        initial={{
                            x: Math.random() * (window.innerWidth || 400),
                            y: -50,
                            opacity: 0,
                            rotate: 0
                        }}
                        animate={{
                            y: [null, 900],
                            opacity: [0, 0.4, 0],
                            rotate: [0, 360]
                        }}
                        transition={{
                            duration: 10 + Math.random() * 5,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                            ease: "linear"
                        }}
                    >
                        {piece}
                    </motion.div>
                ))}
            </div>

            {/* Glowing Orbs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1],
                    x: [0, 20, 0]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-[100px]"
            />
            <motion.div
                animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.1, 0.2, 0.1],
                    x: [0, -20, 0]
                }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]"
            />

            {/* Logo Animation */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="relative z-10 flex flex-col items-center"
            >
                <div className="w-40 h-40 rounded-[2.5rem] bg-indigo-950/40 backdrop-blur-xl border border-white/10 flex items-center justify-center relative overflow-hidden shadow-2xl">
                    <motion.div
                        animate={{
                            rotate: 360,
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-2 border-2 border-amber-400/20 border-dashed rounded-[2rem]"
                    />
                    <motion.img
                        src={appIcon}
                        animate={{
                            y: [0, -10, 0],
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="w-24 h-24 relative z-10"
                        style={{ filter: 'drop-shadow(0 0 15px rgba(251,191,36,0.3))' }}
                        alt="App Logo"
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="mt-12 text-center"
                >
                    <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                        Chess Champ
                    </h1>
                    <p className="text-white/40 mt-3 tracking-[0.3em] text-xs uppercase font-medium">Master Your Game</p>

                    {/* Progress bar */}
                    <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mt-10 mx-auto">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 3, ease: 'easeInOut' }}
                            className="h-full bg-amber-500"
                        />
                    </div>
                </motion.div>
            </motion.div>

            {/* Version */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ delay: 1 }}
                className="absolute bottom-10 text-white font-mono text-xs tracking-widest uppercase"
            >
                Version 1.1.0
            </motion.div>
        </motion.div>
    );
}
