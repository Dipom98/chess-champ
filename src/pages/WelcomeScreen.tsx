import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Crown, Swords, Users, Trophy, Sparkles, Zap } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

const slides = [
  {
    icon: Crown,
    title: 'Welcome to Chess Master Pro',
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
  const { setHasSeenWelcome, updateUser } = useGameStore();
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
    if (name.trim()) {
      updateUser({ name: name.trim() });
    }
    setHasSeenWelcome(true);
    navigate('/home');
  };

  const handleSkip = () => {
    setShowNameInput(true);
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  // Splash Screen
  if (showSplash) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0a1e] via-[#1a1333] to-[#0d1b2a] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-amber-400/30 rounded-full"
              initial={{ 
                x: Math.random() * 400, 
                y: Math.random() * 800,
                opacity: 0,
                scale: 0
              }}
              animate={{ 
                y: [null, Math.random() * -200],
                opacity: [0, 0.8, 0],
                scale: [0, 1.5, 0]
              }}
              transition={{ 
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeOut"
              }}
            />
          ))}
        </div>

        {/* Glowing orbs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
          className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"
        />

        {/* Main logo animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 15,
            duration: 1
          }}
          className="relative z-10"
        >
          {/* Outer glow ring */}
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 8, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity }
            }}
            className="absolute -inset-8 rounded-full border-2 border-amber-400/30"
          />
          <motion.div
            animate={{ 
              rotate: -360,
              scale: [1.1, 1, 1.1]
            }}
            transition={{ 
              rotate: { duration: 12, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, delay: 0.5 }
            }}
            className="absolute -inset-16 rounded-full border border-purple-400/20"
          />

          {/* Chess pieces floating around */}
          <motion.span
            animate={{ 
              y: [-10, 10, -10],
              x: [-5, 5, -5],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -top-12 -left-8 text-4xl"
          >
            ♜
          </motion.span>
          <motion.span
            animate={{ 
              y: [10, -10, 10],
              x: [5, -5, 5],
              rotate: [0, -10, 10, 0]
            }}
            transition={{ duration: 4.5, repeat: Infinity }}
            className="absolute -top-8 -right-10 text-4xl"
          >
            ♞
          </motion.span>
          <motion.span
            animate={{ 
              y: [-8, 12, -8],
              x: [8, -3, 8],
              rotate: [0, 15, -5, 0]
            }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute -bottom-10 -left-6 text-4xl"
          >
            ♝
          </motion.span>
          <motion.span
            animate={{ 
              y: [5, -15, 5],
              x: [-10, 5, -10],
              rotate: [0, -8, 12, 0]
            }}
            transition={{ duration: 3.5, repeat: Infinity }}
            className="absolute -bottom-8 -right-8 text-4xl"
          >
            ♛
          </motion.span>

          {/* Main icon */}
          <motion.div
            animate={{ 
              boxShadow: [
                "0 0 30px rgba(251, 191, 36, 0.3)",
                "0 0 60px rgba(251, 191, 36, 0.5)",
                "0 0 30px rgba(251, 191, 36, 0.3)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-32 h-32 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center shadow-2xl relative"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/30 via-transparent to-transparent" />
            <motion.span
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl relative z-10"
            >
              ♔
            </motion.span>
          </motion.div>
        </motion.div>

        {/* Title animation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-10 text-center relative z-10"
        >
          <motion.h1 
            className="text-4xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent"
            animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ backgroundSize: "200% auto" }}
          >
            Chess Master
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-white/50 mt-2 text-lg tracking-wider"
          >
            PRO
          </motion.p>
        </motion.div>

        {/* Loading dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="flex gap-2 mt-12"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="w-2 h-2 bg-amber-400 rounded-full"
            />
          ))}
        </motion.div>

        {/* Version text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 text-white/30 text-sm"
        >
          Version 1.0.0
        </motion.p>
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
                  className={`relative w-36 h-36 rounded-3xl bg-gradient-to-br ${slide.color} flex items-center justify-center mb-8 shadow-2xl`}
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/30 via-transparent to-transparent" />
                  <Icon size={64} className="text-white relative z-10" />
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
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide 
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
