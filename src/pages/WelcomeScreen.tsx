import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Swords, Users, Trophy, Sparkles, Zap } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import appIcon from '@/assets/icon.png';

const slides = [
  {
    icon: null, // Using custom icon image for first slide
    title: 'Welcome to Chess Champ',
    description: 'The ultimate mobile chess experience with stunning graphics and smooth gameplay.',
    color: 'from-amber-400 via-orange-500 to-red-500',
    bgGlow: 'bg-amber-500/20',
  },
  {
    icon: Swords,
    title: 'Multiple Game Modes',
    description: 'Play Classic, Rapid, Blitz, or Bullet. Challenge yourself with puzzles or create custom games.',
    color: 'from-violet-500 via-purple-500 to-fuchsia-500',
    bgGlow: 'bg-purple-500/20',
  },
  {
    icon: Users,
    title: 'Play with Friends',
    description: 'Invite friends to play, track their status, and compete on the leaderboard.',
    color: 'from-blue-400 via-cyan-500 to-teal-500',
    bgGlow: 'bg-cyan-500/20',
  },
  {
    icon: Trophy,
    title: 'Track Your Progress',
    description: 'View your game history, analyze moves, and improve your rating over time.',
    color: 'from-emerald-400 via-green-500 to-teal-500',
    bgGlow: 'bg-green-500/20',
  },
];

export function WelcomeScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const { setHasSeenWelcome, updateUser, updateSettings } = useGameStore();
  const [name, setName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  // Auto-hide splash after animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setShowNameInput(true);
    }
  };

  const handleStart = () => {
    const trimmedName = name.trim();
    if (trimmedName) {
      updateUser({ name: trimmedName });

      // Special Reviewer Hook
      if (trimmedName.toLowerCase() === 'googlereviewer') {
        updateUser({
          level: 99,
          rank: 'Grandmaster',
          wallet: {
            balance: 99999,
            totalEarned: 99999,
            totalSpent: 0,
            totalBurned: 0,
            lockedBalance: 0,
            transactions: []
          }
        });
        updateSettings({
          isPremium: true,
          boardTheme: 'diamond'
        });
      }
    }
    setHasSeenWelcome(true);
    navigate('/home');
  };

  const handleSkip = () => {
    setShowNameInput(true);
  };

  const slide = slides[currentSlide];

  // Splash Screen
  if (showSplash) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0a1e] via-[#1a1333] to-[#0d1b2a] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Animated chess board pattern background */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(251, 191, 36, 0.1) 35px, rgba(251, 191, 36, 0.1) 70px)',
          }} />
        </div>

        {/* Animated background particles - Chess pieces floating */}
        <div className="absolute inset-0 overflow-hidden">
          {['♔', '♕', '♖', '♗', '♘', '♙', '♚', '♛', '♜', '♝', '♞', '♟'].map((piece, i) => (
            <motion.div
              key={i}
              className="absolute text-amber-400/20 text-3xl"
              initial={{
                x: Math.random() * 400,
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
                duration: 8 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "linear"
              }}
            >
              {piece}
            </motion.div>
          ))}
        </div>

        {/* Multiple glowing orbs with movement */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, 30, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-72 h-72 bg-amber-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.35, 0.15],
            x: [0, -40, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
          className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/25 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 6, repeat: Infinity, delay: 1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl"
        />

        {/* Main logo animation with enhanced effects */}
        <motion.div
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 150,
            damping: 12,
            duration: 1.2
          }}
          className="relative z-10"
        >
          {/* Triple rotating rings */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-6 rounded-full border-2 border-amber-400/40 border-dashed"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-12 rounded-full border border-purple-400/30"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-20 rounded-full border border-cyan-400/20 border-dotted"
          />

          {/* Orbiting chess pieces */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-16"
          >
            <motion.span
              className="absolute top-0 left-1/2 -translate-x-1/2 text-3xl filter drop-shadow-lg"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ♜
            </motion.span>
            <motion.span
              className="absolute bottom-0 left-1/2 -translate-x-1/2 text-3xl filter drop-shadow-lg"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              ♞
            </motion.span>
            <motion.span
              className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl filter drop-shadow-lg"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >
              ♝
            </motion.span>
            <motion.span
              className="absolute right-0 top-1/2 -translate-y-1/2 text-3xl filter drop-shadow-lg"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
            >
              ♛
            </motion.span>
          </motion.div>

          {/* Main icon with pulsing glow */}
          <motion.div
            animate={{
              boxShadow: [
                "0 0 30px rgba(251, 191, 36, 0.3), 0 0 60px rgba(251, 191, 36, 0.2)",
                "0 0 50px rgba(251, 191, 36, 0.5), 0 0 100px rgba(251, 191, 36, 0.3)",
                "0 0 30px rgba(251, 191, 36, 0.3), 0 0 60px rgba(251, 191, 36, 0.2)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-36 h-36 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center shadow-2xl relative overflow-hidden"
          >
            {/* Shimmer effect */}
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
            />
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/30 via-transparent to-transparent" />
            <motion.img
              src={appIcon}
              animate={{
                scale: [1, 1.15, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-24 h-24 relative z-10 filter drop-shadow-2xl"
              alt="App Logo"
            />
          </motion.div>
        </motion.div>

        {/* Title animation with letter-by-letter reveal */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-12 text-center relative z-10"
        >
          <motion.div className="flex justify-center gap-1">
            {'Chess Champ'.split('').map((letter, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20, rotate: -10 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ delay: 0.8 + i * 0.05, type: 'spring', stiffness: 200 }}
                className="text-4xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent"
                style={{ backgroundSize: "200% auto" }}
              >
                {letter === ' ' ? '\u00A0' : letter}
              </motion.span>
            ))}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5, type: 'spring', stiffness: 200 }}
            className="mt-3 flex items-center justify-center gap-2"
          >
            <motion.div
              animate={{ scaleX: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-px w-8 bg-gradient-to-r from-transparent via-amber-400 to-transparent"
            />
            <span className="text-amber-400/80 text-sm font-medium tracking-[0.3em]">MASTER YOUR GAME</span>
            <motion.div
              animate={{ scaleX: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-px w-8 bg-gradient-to-r from-transparent via-amber-400 to-transparent"
            />
          </motion.div>
        </motion.div>

        {/* Enhanced loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="mt-12 flex flex-col items-center gap-4"
        >
          {/* Progress bar */}
          <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, delay: 1.8, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 rounded-full"
            />
          </div>

          {/* Loading text */}
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-white/50 text-sm tracking-wide"
          >
            Loading your chess experience...
          </motion.p>
        </motion.div>

        {/* Version text with subtle animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="absolute bottom-8 flex flex-col items-center gap-1"
        >
          <div className="flex items-center gap-2">
            <span className="text-white/30 text-xs">♟️</span>
            <span className="text-white/30 text-sm">Version 1.0.0</span>
            <span className="text-white/30 text-xs">♟️</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0a1e] via-[#1a1333] to-[#0d1b2a] flex flex-col relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 ${slide.bgGlow} rounded-full blur-3xl`}
        />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <AnimatePresence mode="wait">
        {!showNameInput ? (
          <motion.div
            key="slides"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col relative z-10"
          >
            {/* Skip button */}
            <div className="flex justify-end p-5">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSkip}
                className="px-4 py-2 rounded-xl text-white/50 text-sm font-medium hover:text-white hover:bg-white/10 transition-all"
              >
                Skip
              </motion.button>
            </div>

            {/* Slide content */}
            <div className="flex-1 flex flex-col items-center justify-center px-8">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.95 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col items-center text-center"
              >
                {/* Icon with glow */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className={`relative w-40 h-40 rounded-3xl bg-gradient-to-br ${slide.color} flex items-center justify-center mb-8 shadow-2xl`}
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/30 via-transparent to-transparent" />
                  {slide.icon ? (
                    <slide.icon size={72} className="text-white relative z-10" />
                  ) : (
                    <img src={appIcon} className="w-32 h-32 relative z-10 p-2" alt="App Icon" />
                  )}
                  <div className={`absolute -inset-2 rounded-3xl bg-gradient-to-br ${slide.color} opacity-30 blur-xl -z-10`} />
                </motion.div>

                {/* Chess piece decorations */}
                <div className="flex gap-4 mb-8">
                  <motion.span
                    animate={{ rotate: [-8, 8, -8], y: [0, -5, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="text-5xl drop-shadow-lg"
                  >
                    ♔
                  </motion.span>
                  <motion.span
                    animate={{ rotate: [8, -8, 8], y: [0, -5, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
                    className="text-5xl drop-shadow-lg"
                  >
                    ♛
                  </motion.span>
                  <motion.span
                    animate={{ rotate: [-8, 8, -8], y: [0, -5, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.6 }}
                    className="text-5xl drop-shadow-lg"
                  >
                    ♜
                  </motion.span>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">
                  {slide.title}
                </h1>

                {/* Description */}
                <p className="text-lg text-white/60 max-w-sm leading-relaxed">
                  {slide.description}
                </p>
              </motion.div>
            </div>

            {/* Dots and button */}
            <div className="p-8 flex flex-col items-center gap-8">
              {/* Dots */}
              <div className="flex gap-3">
                {slides.map((_, index) => (
                  <motion.button
                    key={index}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                      ? 'w-8 bg-gradient-to-r from-amber-400 to-orange-500'
                      : 'w-2 bg-white/20 hover:bg-white/40'
                      }`}
                  />
                ))}
              </div>

              {/* Next button */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="w-full py-4 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent" />
                <span className="relative z-10">
                  {currentSlide === slides.length - 1 ? 'Get Started' : 'Continue'}
                </span>
                <ChevronRight size={20} className="relative z-10" />
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="name-input"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center px-8 relative z-10"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="text-amber-400 mb-6" size={56} />
            </motion.div>

            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">What's your name?</h1>
            <p className="text-white/50 mb-10 text-center">
              Let's personalize your chess journey
            </p>

            <div className="w-full max-w-sm relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-6 py-4 glass rounded-2xl text-white text-lg placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
                autoFocus
              />
              <Zap className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400/50" size={20} />
            </div>

            <div className="flex gap-4 w-full max-w-sm mt-8">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleStart}
                className="flex-1 py-4 glass rounded-2xl text-white/70 font-bold text-lg hover:bg-white/10 transition-all"
              >
                Skip
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStart}
                className="flex-1 py-4 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-2xl text-white font-bold text-lg shadow-lg shadow-amber-500/30 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent" />
                <span className="relative z-10">Continue</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
