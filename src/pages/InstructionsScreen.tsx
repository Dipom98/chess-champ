import { motion } from 'framer-motion';
import { 
  Pointer, Target, Shield, Crown, Zap, 
  RotateCcw, Users, Bot, Trophy
} from 'lucide-react';
import { MobileLayout } from '@/components/MobileLayout';

const instructions = [
  {
    icon: Pointer,
    title: 'Select a Piece',
    description: 'Tap on any of your pieces to select it. Selected pieces will be highlighted.',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    icon: Target,
    title: 'Make a Move',
    description: 'Legal moves are shown with dots. Capture moves are shown with circles around enemy pieces.',
    color: 'from-green-500 to-emerald-600',
  },
  {
    icon: Shield,
    title: 'Check & Checkmate',
    description: 'When your king is in check, it will glow red. Protect your king to avoid checkmate!',
    color: 'from-red-500 to-rose-600',
  },
  {
    icon: Crown,
    title: 'Pawn Promotion',
    description: 'When a pawn reaches the opposite end of the board, choose which piece to promote it to.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: Zap,
    title: 'Special Moves',
    description: 'Castling: Move king two squares toward a rook. En passant: Capture a pawn that just moved two squares.',
    color: 'from-purple-500 to-pink-600',
  },
  {
    icon: RotateCcw,
    title: 'Game Controls',
    description: 'Use the pause button to access menu options. Flip the board to change perspective.',
    color: 'from-indigo-500 to-violet-600',
  },
];

const gameModes = [
  {
    icon: Crown,
    name: 'Classic',
    description: 'No time limit, perfect for learning and casual play',
  },
  {
    icon: Zap,
    name: 'Rapid',
    description: '10 minutes per player, balanced competitive play',
  },
  {
    icon: Target,
    name: 'Blitz',
    description: '5 minutes per player, fast-paced action',
  },
  {
    icon: Zap,
    name: 'Bullet',
    description: '1 minute per player, lightning-fast chess',
  },
];

export function InstructionsScreen() {
  return (
    <MobileLayout title="How to Play" showBack>
      <div className="p-4 space-y-6">
        {/* Basic Controls */}
        <div>
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Pointer className="text-amber-400" size={20} />
            Basic Controls
          </h2>
          <div className="space-y-3">
            {instructions.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 rounded-2xl p-4 flex gap-4"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
                  <item.icon size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">{item.title}</h3>
                  <p className="text-white/60 text-sm">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Game Modes */}
        <div>
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Trophy className="text-amber-400" size={20} />
            Game Modes
          </h2>
          <div className="bg-white/5 rounded-2xl p-4 space-y-4">
            {gameModes.map((mode, index) => (
              <motion.div
                key={mode.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-3 pb-3 border-b border-white/5 last:border-0 last:pb-0"
              >
                <mode.icon size={20} className="text-amber-400" />
                <div className="flex-1">
                  <h3 className="text-white font-medium">{mode.name}</h3>
                  <p className="text-white/40 text-sm">{mode.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Opponent Types */}
        <div>
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Users className="text-amber-400" size={20} />
            Play Against
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-4 text-center"
            >
              <Bot size={32} className="text-purple-400 mx-auto mb-2" />
              <h3 className="text-white font-bold">Computer</h3>
              <p className="text-white/50 text-sm">3 difficulty levels</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 }}
              className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-4 text-center"
            >
              <Users size={32} className="text-blue-400 mx-auto mb-2" />
              <h3 className="text-white font-bold">Friends</h3>
              <p className="text-white/50 text-sm">Invite to play</p>
            </motion.div>
          </div>
        </div>

        {/* Piece Values */}
        <div>
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Crown className="text-amber-400" size={20} />
            Piece Values
          </h2>
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { symbol: '♟', name: 'Pawn', value: 1 },
                { symbol: '♞', name: 'Knight', value: 3 },
                { symbol: '♝', name: 'Bishop', value: 3 },
                { symbol: '♜', name: 'Rook', value: 5 },
                { symbol: '♛', name: 'Queen', value: 9 },
                { symbol: '♚', name: 'King', value: '∞' },
              ].map((piece) => (
                <div key={piece.name} className="text-center">
                  <span className="text-4xl">{piece.symbol}</span>
                  <p className="text-white/60 text-sm mt-1">{piece.name}</p>
                  <p className="text-amber-400 font-bold">{piece.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-4"
        >
          <h3 className="text-amber-400 font-bold mb-2">💡 Pro Tips</h3>
          <ul className="text-white/70 text-sm space-y-2">
            <li>• Control the center of the board early</li>
            <li>• Develop your knights and bishops before moving the queen</li>
            <li>• Castle early to protect your king</li>
            <li>• Don't move the same piece twice in the opening</li>
            <li>• Think ahead - anticipate your opponent's moves</li>
          </ul>
        </motion.div>
      </div>
    </MobileLayout>
  );
}
