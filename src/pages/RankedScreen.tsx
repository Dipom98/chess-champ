import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, Swords, Clock, ChevronRight, 
  Users, Zap, Shield
} from 'lucide-react';
import { MobileLayout } from '@/components/MobileLayout';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/utils/cn';
import { RANKS } from '@/systems/progression';
import { TimeControl } from '@/systems/types';

interface QueueStatus {
  isSearching: boolean;
  timeControl: TimeControl | null;
  searchTime: number;
}

export function RankedScreen() {
  const navigate = useNavigate();
  const { user, currentSeason, startPvpGame } = useGameStore();
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    isSearching: false,
    timeControl: null,
    searchTime: 0,
  });
  const [showMatchFound, setShowMatchFound] = useState(false);

  const rankInfo = RANKS[user.rank];

  const timeControls: { id: TimeControl; name: string; time: string; icon: typeof Clock; color: string }[] = [
    { id: 'bullet', name: 'Bullet', time: '1+0', icon: Zap, color: 'from-red-500 to-orange-600' },
    { id: 'blitz', name: 'Blitz', time: '3+2', icon: Zap, color: 'from-amber-500 to-yellow-600' },
    { id: 'rapid', name: 'Rapid', time: '10+5', icon: Clock, color: 'from-blue-500 to-cyan-600' },
  ];

  const handleStartQueue = (timeControl: TimeControl) => {
    setQueueStatus({
      isSearching: true,
      timeControl,
      searchTime: 0,
    });

    // Simulate matchmaking (in real app, this would be server-side)
    const searchInterval = setInterval(() => {
      setQueueStatus(prev => ({
        ...prev,
        searchTime: prev.searchTime + 1,
      }));
    }, 1000);

    // Simulate finding a match after 3-8 seconds
    const matchTime = 3000 + Math.random() * 5000;
    setTimeout(() => {
      clearInterval(searchInterval);
      setQueueStatus({
        isSearching: false,
        timeControl: null,
        searchTime: 0,
      });
      setShowMatchFound(true);

      // Auto-start game after showing match found
      setTimeout(() => {
        setShowMatchFound(false);
        // Start PvP game with stake based on level
        const stake = Math.floor(50 + user.level * 5);
        startPvpGame('classic', timeControl, stake, 'ranked_opponent');
        navigate('/game');
      }, 1500);
    }, matchTime);
  };

  const handleCancelQueue = () => {
    setQueueStatus({
      isSearching: false,
      timeControl: null,
      searchTime: 0,
    });
  };

  const formatSearchTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Mock leaderboard data
  const leaderboard = [
    { rank: 1, name: 'Magnus', level: 95, points: 2850, country: '🇳🇴' },
    { rank: 2, name: 'Hikaru', level: 92, points: 2780, country: '🇺🇸' },
    { rank: 3, name: 'Fabiano', level: 88, points: 2720, country: '🇺🇸' },
    { rank: 4, name: 'Ding', level: 85, points: 2680, country: '🇨🇳' },
    { rank: 5, name: 'Ian', level: 82, points: 2650, country: '🇷🇺' },
  ];

  return (
    <MobileLayout title="Ranked Play" showBack>
      <div className="p-4 space-y-5 pb-8">
        {/* Player Rank Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5 relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full blur-2xl" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className={cn(
              "w-16 h-16 rounded-xl flex items-center justify-center text-3xl bg-gradient-to-br",
              rankInfo.gradient
            )}>
              {rankInfo.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{user.country.flag}</span>
                <h2 className="text-xl font-bold text-white">{user.name}</h2>
              </div>
              <p className="text-white/50">{user.rank} • Level {user.level}</p>
            </div>
            <div className="text-right">
              <p className="text-amber-400 font-bold text-xl">{user.wins * 10 + user.level * 5}</p>
              <p className="text-white/50 text-xs">Ranked Points</p>
            </div>
          </div>

          {/* Win/Loss Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/5 rounded-xl p-2 text-center">
              <p className="text-lg font-bold text-green-400">{user.wins}</p>
              <p className="text-[10px] text-white/50">Wins</p>
            </div>
            <div className="bg-white/5 rounded-xl p-2 text-center">
              <p className="text-lg font-bold text-red-400">{user.losses}</p>
              <p className="text-[10px] text-white/50">Losses</p>
            </div>
            <div className="bg-white/5 rounded-xl p-2 text-center">
              <p className="text-lg font-bold text-white">
                {user.gamesPlayed > 0 ? Math.round((user.wins / user.gamesPlayed) * 100) : 0}%
              </p>
              <p className="text-[10px] text-white/50">Win Rate</p>
            </div>
          </div>
        </motion.div>

        {/* Season Info */}
        {currentSeason && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-4"
          >
            <div className="flex items-center gap-3">
              <Crown className="text-purple-400" size={24} />
              <div className="flex-1">
                <p className="text-white font-bold">Season {currentSeason.number}: {currentSeason.name}</p>
                <p className="text-white/50 text-sm">Compete for exclusive rewards!</p>
              </div>
              <ChevronRight className="text-white/40" size={20} />
            </div>
          </motion.div>
        )}

        {/* Time Control Selection */}
        <div>
          <h3 className="text-white/50 text-sm font-medium uppercase tracking-wider mb-3 px-1">
            Select Time Control
          </h3>
          <div className="space-y-3">
            {timeControls.map((tc, index) => (
              <motion.button
                key={tc.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                whileHover={{ scale: queueStatus.isSearching ? 1 : 1.02 }}
                whileTap={{ scale: queueStatus.isSearching ? 1 : 0.98 }}
                onClick={() => !queueStatus.isSearching && handleStartQueue(tc.id)}
                disabled={queueStatus.isSearching}
                className={cn(
                  "w-full rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden transition-all",
                  queueStatus.isSearching && queueStatus.timeControl === tc.id
                    ? "bg-gradient-to-r " + tc.color + " shadow-lg"
                    : "glass hover:bg-white/10",
                  queueStatus.isSearching && queueStatus.timeControl !== tc.id && "opacity-50"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                  queueStatus.isSearching && queueStatus.timeControl === tc.id
                    ? "bg-white/20"
                    : tc.color
                )}>
                  <tc.icon size={24} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-white font-bold">{tc.name}</h3>
                  <p className="text-white/70 text-sm">{tc.time}</p>
                </div>
                {queueStatus.isSearching && queueStatus.timeControl === tc.id ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                    <span className="text-white font-mono">{formatSearchTime(queueStatus.searchTime)}</span>
                  </div>
                ) : (
                  <Swords className="text-white/40" size={20} />
                )}
              </motion.button>
            ))}
          </div>

          {queueStatus.isSearching && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCancelQueue}
              className="w-full mt-3 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 font-medium"
            >
              Cancel Search
            </motion.button>
          )}
        </div>

        {/* Leaderboard Preview */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-white/50 text-sm font-medium uppercase tracking-wider">
              Top Players
            </h3>
            <button className="text-amber-400 text-sm font-medium">View All</button>
          </div>
          <div className="glass rounded-2xl overflow-hidden">
            {leaderboard.map((player, index) => (
              <motion.div
                key={player.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className={cn(
                  "flex items-center gap-3 p-3 border-b border-white/5 last:border-0",
                  player.rank <= 3 && "bg-gradient-to-r from-amber-500/10 to-transparent"
                )}
              >
                <span className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  player.rank === 1 && "bg-amber-400 text-black",
                  player.rank === 2 && "bg-gray-300 text-black",
                  player.rank === 3 && "bg-amber-600 text-white",
                  player.rank > 3 && "bg-white/10 text-white/70"
                )}>
                  {player.rank}
                </span>
                <span className="text-lg">{player.country}</span>
                <div className="flex-1">
                  <p className="text-white font-medium">{player.name}</p>
                  <p className="text-white/40 text-xs">Level {player.level}</p>
                </div>
                <div className="text-right">
                  <p className="text-amber-400 font-bold">{player.points}</p>
                  <p className="text-white/40 text-xs">pts</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Shield className="text-amber-400" size={18} />
            <h3 className="text-white font-medium">Ranked Tips</h3>
          </div>
          <ul className="text-white/60 text-sm space-y-1">
            <li>• Win ranked games to earn points and climb the leaderboard</li>
            <li>• Higher time controls give more points per win</li>
            <li>• Season rewards are based on your final ranking</li>
          </ul>
        </motion.div>
      </div>

      {/* Match Found Modal */}
      <AnimatePresence>
        {showMatchFound && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.5 }}
              className="text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50"
              >
                <Users size={48} className="text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">Match Found!</h2>
              <p className="text-white/60">Preparing game...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
