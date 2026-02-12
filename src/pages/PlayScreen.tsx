import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Play, Clock, Zap, Target, Bot, Users, Crown, 
  ChevronRight, Timer, Puzzle, Swords, Check, Sparkles, Coins, AlertCircle
} from 'lucide-react';
import { MobileLayout } from '@/components/MobileLayout';
import { useGameStore, GameMode } from '@/store/gameStore';
import { cn } from '@/utils/cn';
import { PieceColor } from '@/chess/types';
import { AIDifficulty, TimeControl } from '@/systems/types';
import { getPveEntryCost } from '@/systems/economy';

const gameModes = [
  {
    id: 'classic' as GameMode,
    name: 'Classic',
    description: 'No time limit, play at your pace',
    icon: Crown,
    color: 'from-amber-400 via-orange-500 to-red-500',
    glow: 'shadow-amber-500/25',
    time: '∞',
    timeControl: 'unlimited' as TimeControl,
  },
  {
    id: 'rapid' as GameMode,
    name: 'Rapid',
    description: '10 minutes per player',
    icon: Clock,
    color: 'from-blue-400 via-cyan-500 to-teal-500',
    glow: 'shadow-cyan-500/25',
    time: '10:00',
    timeControl: 'rapid' as TimeControl,
  },
  {
    id: 'blitz' as GameMode,
    name: 'Blitz',
    description: '5 minutes per player',
    icon: Zap,
    color: 'from-violet-400 via-purple-500 to-fuchsia-500',
    glow: 'shadow-purple-500/25',
    time: '5:00',
    timeControl: 'blitz' as TimeControl,
  },
  {
    id: 'bullet' as GameMode,
    name: 'Bullet',
    description: '1 minute per player',
    icon: Target,
    color: 'from-rose-400 via-red-500 to-orange-500',
    glow: 'shadow-red-500/25',
    time: '1:00',
    timeControl: 'bullet' as TimeControl,
  },
  {
    id: 'puzzle' as GameMode,
    name: 'Puzzles',
    description: 'Solve chess puzzles',
    icon: Puzzle,
    color: 'from-emerald-400 via-green-500 to-teal-500',
    glow: 'shadow-green-500/25',
    time: '🧩',
    timeControl: 'unlimited' as TimeControl,
  },
];

const difficulties: { level: AIDifficulty; name: string; description: string; color: string; emoji: string }[] = [
  { level: 'beginner', name: 'Beginner', description: 'Perfect for learning', color: 'from-emerald-400 to-green-500', emoji: '🌱' },
  { level: 'intermediate', name: 'Intermediate', description: 'Balanced challenge', color: 'from-amber-400 to-orange-500', emoji: '⚔️' },
  { level: 'advanced', name: 'Advanced', description: 'For skilled players', color: 'from-rose-400 to-red-500', emoji: '🔥' },
  { level: 'expert', name: 'Expert', description: 'Very challenging', color: 'from-purple-400 to-violet-500', emoji: '💎' },
  { level: 'engine', name: 'Engine', description: 'Maximum strength', color: 'from-gray-600 to-gray-800', emoji: '🤖' },
];

export function PlayScreen() {
  const navigate = useNavigate();
  const { startPveGame, startPvpGame, user } = useGameStore();
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>('rapid');
  const [vsComputer, setVsComputer] = useState<boolean | null>(null);
  const [computerColor, setComputerColor] = useState<PieceColor>('black');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('intermediate');
  const [showCustomGame, setShowCustomGame] = useState(false);
  // Custom stake removed - using entry cost based on difficulty
  const [error, setError] = useState<string | null>(null);

  const handleStartPveGame = () => {
    if (!selectedMode) return;
    
    const success = startPveGame(
      selectedMode, 
      difficulty, 
      selectedTimeControl, 
      computerColor === 'black' ? 'white' : 'black'
    );
    
    if (success) {
      navigate('/game');
    } else {
      setError('Not enough coins! You need more coins to play this match.');
    }
  };

  const handleStartTwoPlayerGame = () => {
    if (!selectedMode) return;
    
    // For local two player, we use startPvpGame with 0 stake
    const success = startPvpGame(selectedMode, selectedTimeControl, 0, 'local');
    
    if (success) {
      navigate('/game');
    }
  };

  const handlePlayFriend = () => {
    navigate('/friends?invite=true');
  };

  const handleCustomGame = () => {
    setShowCustomGame(true);
  };

  const handleStartCustomGame = () => {
    const success = startPveGame('custom', difficulty, selectedTimeControl, computerColor === 'black' ? 'white' : 'black');
    if (success) {
      setShowCustomGame(false);
      navigate('/game');
    } else {
      setError('Not enough coins!');
    }
  };

  const entryCost = getPveEntryCost(difficulty, user.level);
  const canAfford = user.wallet.balance >= entryCost;

  // Mode selection screen
  if (!selectedMode && !showCustomGame) {
    return (
      <MobileLayout title="Play Chess">
        <div className="p-4 space-y-4 pb-8">
          {/* Header decoration */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-2"
          >
            <p className="text-white/40 text-sm">Choose your preferred</p>
            <h2 className="text-white font-bold text-lg">Game Mode</h2>
          </motion.div>
          
          {gameModes.map((mode, index) => (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.07, type: 'spring', stiffness: 100 }}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedMode(mode.id);
                setSelectedTimeControl(mode.timeControl);
              }}
              className={cn(
                'w-full bg-gradient-to-r rounded-2xl p-4 flex items-center gap-4 shadow-xl relative overflow-hidden card-hover',
                mode.color,
                mode.glow
              )}
            >
              {/* Shine overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/25 via-transparent to-transparent" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <mode.icon size={26} className="text-white" />
              </div>
              <div className="flex-1 text-left relative z-10">
                <h3 className="text-white font-bold text-lg">{mode.name}</h3>
                <p className="text-white/70 text-sm">{mode.description}</p>
              </div>
              <div className="relative z-10 flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1">
                  <Timer size={12} className="text-white/80" />
                  <span className="text-white font-medium text-sm">{mode.time}</span>
                </div>
              </div>
            </motion.button>
          ))}

          {/* Custom Game */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCustomGame}
            className="w-full glass rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-all"
          >
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
              <Swords size={26} className="text-white/60" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-white font-bold text-lg">Custom Game</h3>
              <p className="text-white/40 text-sm">Set your own rules & stakes</p>
            </div>
            <ChevronRight className="text-white/40" size={20} />
          </motion.button>

          {/* Wallet display */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 pt-4"
          >
            <Coins size={20} className="text-amber-400" />
            <span className="text-amber-400 font-bold">{user.wallet.balance.toLocaleString()} coins</span>
          </motion.div>
        </div>
      </MobileLayout>
    );
  }

  // Custom game modal
  if (showCustomGame) {
    return (
      <MobileLayout title="Custom Game" showBack>
        <div className="p-4 space-y-6 pb-8">
          {/* Time Control */}
          <div>
            <h2 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">
              Time Control
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {(['unlimited', 'rapid', 'blitz', 'bullet'] as TimeControl[]).map((tc) => (
                <motion.button
                  key={tc}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedTimeControl(tc)}
                  className={cn(
                    'p-3 rounded-xl border-2 transition-all capitalize',
                    selectedTimeControl === tc
                      ? 'border-amber-400 bg-amber-500/20'
                      : 'border-transparent glass'
                  )}
                >
                  <span className="text-white font-medium">{tc}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <h2 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">
              AI Difficulty
            </h2>
            <div className="space-y-2">
              {difficulties.map((diff) => (
                <motion.button
                  key={diff.level}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDifficulty(diff.level)}
                  className={cn(
                    'w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3',
                    difficulty === diff.level
                      ? 'border-amber-400 bg-amber-500/20'
                      : 'border-transparent glass'
                  )}
                >
                  <span className="text-2xl">{diff.emoji}</span>
                  <div className="flex-1 text-left">
                    <span className="text-white font-medium">{diff.name}</span>
                    <p className="text-white/40 text-xs">{diff.description}</p>
                  </div>
                  <span className="text-amber-400 text-sm">
                    {getPveEntryCost(diff.level, user.level)} 🪙
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <h2 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">
              Play As
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setComputerColor('black')}
                className={cn(
                  'p-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all',
                  computerColor === 'black'
                    ? 'border-amber-400 bg-amber-500/20'
                    : 'border-transparent glass'
                )}
              >
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-4xl">
                  ♔
                </div>
                <span className="text-white font-bold">White</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setComputerColor('white')}
                className={cn(
                  'p-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all',
                  computerColor === 'white'
                    ? 'border-amber-400 bg-amber-500/20'
                    : 'border-transparent glass'
                )}
              >
                <div className="w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center text-4xl text-gray-200">
                  ♚
                </div>
                <span className="text-white font-bold">Black</span>
              </motion.button>
            </div>
          </div>

          {/* Entry Cost Display */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Entry Cost</span>
              <span className="text-amber-400 font-bold text-lg">
                {getPveEntryCost(difficulty, user.level)} 🪙
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-white/60">Win Reward</span>
              <span className="text-green-400 font-bold">
                {Math.floor(getPveEntryCost(difficulty, user.level) * 1.8)} 🪙
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-white/60">Your Balance</span>
              <span className={cn(
                "font-bold",
                canAfford ? "text-white" : "text-red-400"
              )}>
                {user.wallet.balance.toLocaleString()} 🪙
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/20 p-3 rounded-xl">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Start Button */}
          <motion.button
            whileHover={{ scale: canAfford ? 1.02 : 1 }}
            whileTap={{ scale: canAfford ? 0.98 : 1 }}
            onClick={handleStartCustomGame}
            disabled={!canAfford}
            className={cn(
              'w-full py-5 rounded-2xl text-white font-bold text-xl flex items-center justify-center gap-3 relative overflow-hidden',
              canAfford
                ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 shadow-xl shadow-amber-500/30'
                : 'bg-gray-600 cursor-not-allowed'
            )}
          >
            {canAfford && <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent" />}
            <Play size={24} className="relative z-10" />
            <span className="relative z-10">Start Custom Game</span>
          </motion.button>
        </div>
      </MobileLayout>
    );
  }

  // Opponent selection screen
  if (vsComputer === null) {
    const currentMode = gameModes.find(m => m.id === selectedMode);
    
    return (
      <MobileLayout title={`${currentMode?.name} Game`} showBack>
        <div className="p-4 space-y-4 pb-8">
          {/* Mode indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r',
              currentMode?.color
            )}
          >
            {currentMode && <currentMode.icon size={24} className="text-white" />}
            <div>
              <p className="text-white/70 text-xs uppercase tracking-wider">Selected Mode</p>
              <p className="text-white font-bold">{currentMode?.name}</p>
            </div>
          </motion.div>
          
          <h2 className="text-white/40 text-sm font-medium uppercase tracking-wider pt-2">
            Choose Opponent
          </h2>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setVsComputer(true)}
            className="w-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl p-5 flex items-center gap-4 shadow-xl shadow-purple-500/25 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent" />
            <div className="relative w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Bot size={32} className="text-white" />
            </div>
            <div className="flex-1 text-left relative z-10">
              <h3 className="text-white font-bold text-xl">vs Computer</h3>
              <p className="text-white/70">Challenge the AI opponent</p>
            </div>
            <ChevronRight className="text-white/60 relative z-10" size={24} />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartTwoPlayerGame}
            className="w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-2xl p-5 flex items-center gap-4 shadow-xl shadow-cyan-500/25 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent" />
            <div className="relative w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Users size={32} className="text-white" />
            </div>
            <div className="flex-1 text-left relative z-10">
              <h3 className="text-white font-bold text-xl">Two Players</h3>
              <p className="text-white/70">Play on the same device</p>
            </div>
            <ChevronRight className="text-white/60 relative z-10" size={24} />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePlayFriend}
            className="w-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-2xl p-5 flex items-center gap-4 shadow-xl shadow-green-500/25 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent" />
            <div className="relative w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🎮</span>
            </div>
            <div className="flex-1 text-left relative z-10">
              <h3 className="text-white font-bold text-xl">Invite Friend</h3>
              <p className="text-white/70">Challenge a friend to play</p>
            </div>
            <ChevronRight className="text-white/60 relative z-10" size={24} />
          </motion.button>
        </div>
      </MobileLayout>
    );
  }

  // Computer difficulty selection
  return (
    <MobileLayout title="Game Setup" showBack>
      <div className="p-4 space-y-6 pb-8">
        {/* Difficulty Selection */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-amber-400" />
            <h2 className="text-white/60 text-sm font-medium uppercase tracking-wider">
              Select Difficulty
            </h2>
          </div>
          <div className="space-y-3">
            {difficulties.map((diff, index) => (
              <motion.button
                key={diff.level}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDifficulty(diff.level)}
                className={cn(
                  'w-full rounded-2xl p-4 flex items-center gap-4 border-2 transition-all relative overflow-hidden',
                  difficulty === diff.level 
                    ? 'glass border-amber-400/50 shadow-lg shadow-amber-500/10' 
                    : 'glass border-transparent hover:border-white/20'
                )}
              >
                {difficulty === diff.level && (
                  <motion.div 
                    layoutId="difficultyBg"
                    className={cn('absolute inset-0 bg-gradient-to-r opacity-20', diff.color)}
                  />
                )}
                <div className={cn('relative w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg', diff.color)}>
                  <span className="text-2xl">{diff.emoji}</span>
                </div>
                <div className="flex-1 text-left relative z-10">
                  <h3 className="text-white font-bold text-lg">{diff.name}</h3>
                  <p className="text-white/50 text-sm">{diff.description}</p>
                </div>
                <div className="text-right relative z-10">
                  <span className="text-amber-400 font-bold">
                    {getPveEntryCost(diff.level, user.level)} 🪙
                  </span>
                </div>
                {difficulty === diff.level && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Check size={16} className="text-white" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Color Selection */}
        <div>
          <h2 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">
            Play As
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setComputerColor('black')}
              className={cn(
                'p-5 rounded-2xl flex flex-col items-center gap-3 border-2 transition-all relative overflow-hidden',
                computerColor === 'black'
                  ? 'glass border-amber-400/50 shadow-lg shadow-amber-500/10'
                  : 'glass border-transparent'
              )}
            >
              {computerColor === 'black' && (
                <motion.div layoutId="colorBg" className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/10" />
              )}
              <div className="relative w-20 h-20 bg-gradient-to-br from-white to-gray-200 rounded-2xl flex items-center justify-center text-5xl shadow-xl">
                ♔
              </div>
              <span className="text-white font-bold text-lg relative z-10">White</span>
              <span className="text-white/40 text-xs relative z-10">Move first</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setComputerColor('white')}
              className={cn(
                'p-5 rounded-2xl flex flex-col items-center gap-3 border-2 transition-all relative overflow-hidden',
                computerColor === 'white'
                  ? 'glass border-amber-400/50 shadow-lg shadow-amber-500/10'
                  : 'glass border-transparent'
              )}
            >
              {computerColor === 'white' && (
                <motion.div layoutId="colorBg" className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/10" />
              )}
              <div className="relative w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center text-5xl shadow-xl border border-gray-700">
                <span className="text-gray-200">♚</span>
              </div>
              <span className="text-white font-bold text-lg relative z-10">Black</span>
              <span className="text-white/40 text-xs relative z-10">Move second</span>
            </motion.button>
          </div>
        </div>

        {/* Cost Info */}
        <div className="glass rounded-2xl p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-white/60">Entry Cost</span>
            <span className="text-amber-400 font-bold">{entryCost} 🪙</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Win Reward (180%)</span>
            <span className="text-green-400 font-bold">{Math.floor(entryCost * 1.8)} 🪙</span>
          </div>
          <div className="border-t border-white/10 pt-2 mt-2 flex justify-between">
            <span className="text-white/60">Your Balance</span>
            <span className={cn("font-bold", canAfford ? "text-white" : "text-red-400")}>
              {user.wallet.balance.toLocaleString()} 🪙
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-500/20 p-3 rounded-xl">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Start Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: canAfford ? 1.02 : 1, y: canAfford ? -2 : 0 }}
          whileTap={{ scale: canAfford ? 0.98 : 1 }}
          onClick={handleStartPveGame}
          disabled={!canAfford}
          className={cn(
            'w-full py-5 rounded-2xl text-white font-bold text-xl flex items-center justify-center gap-3 mt-4 relative overflow-hidden',
            canAfford 
              ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 shadow-xl shadow-amber-500/30'
              : 'bg-gray-600 cursor-not-allowed'
          )}
        >
          {canAfford && <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent" />}
          <Play size={24} className="relative z-10" />
          <span className="relative z-10">
            {canAfford ? 'Start Game' : 'Not Enough Coins'}
          </span>
        </motion.button>
      </div>
    </MobileLayout>
  );
}
