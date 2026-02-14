import { useState } from 'react';
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const { setHasSeenWelcome, updateUser, updateSettings } = useGameStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);



  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setShowNameInput(true);
    }
  };

  const handleStart = () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (trimmedName) {
      updateUser({
        name: trimmedName,
        phoneNumber: trimmedPhone
      });

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

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0a1e] via-[#1a1333] to-[#0d1b2a] flex flex-col relative overflow-hidden">
      <AnimatePresence mode="wait">
        {!showNameInput ? (
          <motion.div
            key="slides"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex-1 flex flex-col relative z-10"
          >
            {/* Skip button */}
            <div className="flex justify-end p-6 pt-safe-top">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowNameInput(true)}
                className="px-4 py-2 glass rounded-full text-white/50 text-sm font-medium"
              >
                Skip
              </motion.button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="mb-12"
              >
                {slide.icon ? (
                  <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${slide.color} flex items-center justify-center shadow-2xl`}>
                    <slide.icon size={48} className="text-white" />
                  </div>
                ) : (
                  <div className={`w-28 h-28 rounded-3xl bg-indigo-950/40 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden`}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-1 border border-amber-400/20 border-dashed rounded-2xl"
                    />
                    <img src={appIcon} className="w-16 h-16 relative z-10" alt="App Logo" />
                  </div>
                )}
              </motion.div>

              <motion.h1
                key={`title-${currentSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold text-white mb-4 tracking-tight"
              >
                {slide.title}
              </motion.h1>

              <motion.p
                key={`desc-${currentSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-white/60 leading-relaxed text-lg"
              >
                {slide.description}
              </motion.p>
            </div>

            <div className="p-10 pb-16 flex flex-col items-center gap-10">
              <div className="flex gap-3">
                {slides.map((_, index) => (
                  <motion.div
                    key={index}
                    animate={{
                      width: index === currentSlide ? 32 : 8,
                      backgroundColor: index === currentSlide ? '#fbbf24' : 'rgba(255,255,255,0.2)'
                    }}
                    className="h-2 rounded-full transition-all duration-300"
                  />
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="w-full py-5 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-[2rem] text-white font-bold text-xl flex items-center justify-center gap-3 shadow-2xl shadow-amber-500/30 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent" />
                <span className="relative z-10">
                  {currentSlide === slides.length - 1 ? 'Start Playing' : 'Continue'}
                </span>
                <ChevronRight size={24} className="relative z-10" />
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="name-input"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex-1 flex flex-col px-8 relative z-10"
          >
            <div className="flex-1 flex flex-col items-center justify-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mb-8"
              >
                <Sparkles className="text-amber-400" size={64} />
              </motion.div>

              <h1 className="text-3xl font-bold text-white mb-3 text-center tracking-tight">One last thing...</h1>
              <p className="text-white/50 mb-10 text-center text-lg">
                What should we call you?
              </p>

              <div className="w-full max-w-sm space-y-4">
                <div className="relative group">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-8 py-5 glass rounded-[2rem] text-white text-xl placeholder:text-white/20 focus:outline-none focus:ring-4 focus:ring-amber-400/20 transition-all border border-white/5"
                    autoFocus
                  />
                  <Zap className="absolute right-6 top-1/2 -translate-y-1/2 text-amber-400/30 group-focus-within:text-amber-400 transition-colors" size={24} />
                </div>

                <div className="relative group">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Mobile (Optional)"
                    className="w-full px-8 py-5 glass rounded-[2rem] text-white text-xl placeholder:text-white/20 focus:outline-none focus:ring-4 focus:ring-amber-400/20 transition-all border border-white/5 font-mono"
                  />
                </div>

                <p className="text-white/30 text-xs text-center px-4 leading-relaxed">
                  Adding your number helps friends find you. We'll never share it with anyone else. 🛡️
                </p>
              </div>
            </div>

            <div className="p-10 pb-16 flex gap-4">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleStart}
                className="flex-1 py-5 glass rounded-[2rem] text-white/50 font-bold text-xl hover:bg-white/10 transition-all border border-white/5"
              >
                Skip
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStart}
                disabled={!name.trim()}
                className={`flex-[1.5] py-5 rounded-[2rem] font-bold text-xl transition-all shadow-xl flex items-center justify-center gap-2 ${name.trim()
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-amber-500/20'
                  : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                  }`}
              >
                Let's Go!
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
