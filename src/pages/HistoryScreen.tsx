import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Trophy, Swords,
  TrendingUp, TrendingDown, Minus, ChevronRight, Coins, X, Share2, Check, Download,
  MessageCircle, Send
} from 'lucide-react';
import { MobileLayout } from '@/components/MobileLayout';
import { useGameStore, GameHistory } from '@/store/gameStore';
import { cn } from '@/utils/cn';
import { RANKS } from '@/systems/progression';

type FilterType = 'all' | 'win' | 'loss' | 'draw';

export function HistoryScreen() {
  const { gameHistory, user } = useGameStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedGame, setSelectedGame] = useState<GameHistory | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

  // Get unique months from history
  const getMonthsFromHistory = () => {
    const months = new Set<string>();
    gameHistory.forEach(game => {
      const date = new Date(game.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  };

  const months = getMonthsFromHistory();

  // Filter by selected month
  const getFilteredByMonth = (games: GameHistory[]) => {
    if (!selectedMonth) return games;
    return games.filter(game => {
      const date = new Date(game.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return monthKey === selectedMonth;
    });
  };

  const filteredHistory = getFilteredByMonth(gameHistory.filter(game => {
    if (filter === 'all') return true;
    return game.result === filter;
  }));

  const stats = {
    total: gameHistory.length,
    wins: gameHistory.filter(g => g.result === 'win').length,
    losses: gameHistory.filter(g => g.result === 'loss').length,
    draws: gameHistory.filter(g => g.result === 'draw').length,
  };

  const winRate = stats.total > 0
    ? Math.round((stats.wins / stats.total) * 100)
    : 0;

  const rankInfo = RANKS[user.rank];

  const filters: { type: FilterType; label: string; color: string }[] = [
    { type: 'all', label: 'All', color: 'bg-white/10 text-white' },
    { type: 'win', label: 'Wins', color: 'bg-green-500/20 text-green-400' },
    { type: 'loss', label: 'Losses', color: 'bg-red-500/20 text-red-400' },
    { type: 'draw', label: 'Draws', color: 'bg-gray-500/20 text-gray-400' },
  ];

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'win': return <TrendingUp size={16} className="text-green-400" />;
      case 'loss': return <TrendingDown size={16} className="text-red-400" />;
      default: return <Minus size={16} className="text-gray-400" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatMonthName = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleShareGame = (game: GameHistory) => {
    setSelectedGame(game);
    setShowShareModal(true);
  };

  const getShareText = () => {
    if (!selectedGame) return '';
    const resultEmoji = selectedGame.result === 'win' ? '🏆' : selectedGame.result === 'loss' ? '😤' : '🤝';
    return `${resultEmoji} Chess Game Result\n\n` +
      `👤 ${user.name} vs ${selectedGame.opponent}\n` +
      `📊 Result: ${selectedGame.result.toUpperCase()}\n` +
      `♟️ Moves: ${selectedGame.moves}\n` +
      `⏱️ Duration: ${selectedGame.duration}\n` +
      `🎮 Mode: ${selectedGame.mode}\n` +
      `📅 Date: ${new Date(selectedGame.date).toLocaleDateString()}\n` +
      (selectedGame.coinsWon > 0 ? `💰 Coins Won: +${selectedGame.coinsWon}\n` : '') +
      `\n🎮 Play Chess Champ!\n#ChessChamp #Chess`;
  };

  const copyShareText = () => {
    navigator.clipboard.writeText(getShareText()).then(() => {
      setShareSuccess(true);
      setTimeout(() => {
        setShareSuccess(false);
      }, 2000);
    });
  };

  // Social share functions
  const shareToTwitter = () => {
    const text = getShareText();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(getShareText())}`;
    window.open(url, '_blank');
  };

  const shareToWhatsApp = () => {
    const text = getShareText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareToTelegram = () => {
    const text = getShareText();
    const url = `https://t.me/share/url?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareToLinkedIn = () => {
    const text = getShareText();
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://chesschamp.app')}&summary=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareToReddit = () => {
    const text = getShareText();
    const url = `https://www.reddit.com/submit?title=${encodeURIComponent('My Chess Game Result')}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareToDiscord = () => {
    // Discord doesn't have direct share URL, copy to clipboard instead
    copyShareText();
  };

  const shareViaEmail = () => {
    const subject = `Chess Game Result - ${selectedGame?.result.toUpperCase()}`;
    const body = getShareText();
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url);
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Chess Game Result',
          text: getShareText(),
          url: 'https://chesschamp.app'
        });
      } catch {
        copyShareText();
      }
    } else {
      copyShareText();
    }
  };

  const socialPlatforms = [
    { name: 'WhatsApp', icon: '💬', color: 'from-green-500 to-green-600', action: shareToWhatsApp },
    { name: 'Twitter', icon: '🐦', color: 'from-blue-400 to-blue-500', action: shareToTwitter },
    { name: 'Facebook', icon: '📘', color: 'from-blue-600 to-blue-700', action: shareToFacebook },
    { name: 'Telegram', icon: '✈️', color: 'from-sky-400 to-sky-500', action: shareToTelegram },
    { name: 'Discord', icon: '🎮', color: 'from-indigo-500 to-indigo-600', action: shareToDiscord },
    { name: 'LinkedIn', icon: '💼', color: 'from-blue-700 to-blue-800', action: shareToLinkedIn },
    { name: 'Reddit', icon: '🔴', color: 'from-orange-500 to-red-500', action: shareToReddit },
    { name: 'Email', icon: '📧', color: 'from-gray-500 to-gray-600', action: shareViaEmail },
  ];

  const GameCard = ({ game, index }: { game: GameHistory; index: number }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01 }}
      onClick={() => setSelectedGame(game)}
      className="glass rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-colors"
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg">
        {game.opponentAvatar}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white font-semibold truncate">{game.opponent}</p>
          {getResultIcon(game.result)}
        </div>
        <div className="flex items-center gap-2 text-white/40 text-xs mt-0.5">
          <span className="capitalize bg-white/10 px-2 py-0.5 rounded-md">{game.mode}</span>
          <span>{game.moves} moves</span>
          <span>•</span>
          <span>{game.duration}</span>
        </div>
      </div>

      <div className="text-right flex flex-col items-end gap-1">
        <div className={cn(
          'px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide',
          game.result === 'win' && 'bg-green-500/20 text-green-400 border border-green-500/30',
          game.result === 'loss' && 'bg-red-500/20 text-red-400 border border-red-500/30',
          game.result === 'draw' && 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
        )}>
          {game.result}
        </div>
        <div className="flex items-center gap-1">
          {game.coinsWon > 0 && (
            <span className="text-amber-400 text-xs flex items-center gap-1">
              <Coins size={10} />+{game.coinsWon}
            </span>
          )}
          <span className="text-white/30 text-xs">{formatDate(game.date)}</span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <MobileLayout title="Game History">
      <div className="p-4 space-y-6">
        {/* Stats Overview */}

        {/* Level & Rank */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <span className="text-white/60">Current Rank</span>
          <div className="flex items-center gap-2">
            <span className="text-xl">{rankInfo.icon}</span>
            <span className="font-bold" style={{ color: rankInfo.color }}>
              {user.rank} (Lv.{user.level})
            </span>
          </div>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.type}
            onClick={() => setFilter(f.type)}
            className={cn(
              'flex-1 py-2 rounded-xl text-sm font-medium transition-all',
              filter === f.type
                ? f.color + ' border border-current/30'
                : 'bg-white/5 text-white/40'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Selected Month Indicator */}
      {selectedMonth && (
        <div className="flex items-center justify-between bg-amber-500/20 border border-amber-500/30 rounded-xl px-4 py-2">
          <span className="text-amber-400 text-sm">
            Showing: {formatMonthName(selectedMonth)}
          </span>
          <button
            onClick={() => setSelectedMonth(null)}
            className="text-amber-400 text-sm font-medium"
          >
            Clear
          </button>
        </div>
      )}

      {/* Game History List */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
              <Swords size={32} className="text-white/40" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">No Games Found</h3>
            <p className="text-white/40">
              {filter === 'all'
                ? "You haven't played any games yet"
                : `No ${filter}s recorded`}
            </p>
          </motion.div>
        ) : (
          filteredHistory.map((game, index) => (
            <GameCard key={game.id} game={game} index={index} />
          ))
        )}
      </div>

      {/* View by Month Button */}
      {gameHistory.length > 0 && (
        <button
          onClick={() => setShowMonthPicker(true)}
          className="w-full py-4 bg-white/5 rounded-2xl text-white/60 font-medium flex items-center justify-center gap-2"
        >
          <Calendar size={18} />
          View by Month
          <ChevronRight size={18} className="ml-auto" />
        </button>
      )}
    </div>

      {/* Game Details Modal */ }
  <AnimatePresence>
    {selectedGame && !showShareModal && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
        onClick={() => setSelectedGame(null)}
      >
        <motion.div
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          onClick={(e) => e.stopPropagation()}
          className="glass rounded-3xl p-6 w-full max-w-sm space-y-4 border border-white/10 max-h-[80vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedGame(null)}
            className="absolute top-4 right-4 p-2 text-white/50 hover:text-white"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="text-center">
            <div className={cn(
              "w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl mb-4",
              selectedGame.result === 'win' && 'bg-gradient-to-br from-green-500 to-emerald-600',
              selectedGame.result === 'loss' && 'bg-gradient-to-br from-red-500 to-rose-600',
              selectedGame.result === 'draw' && 'bg-gradient-to-br from-gray-500 to-gray-600'
            )}>
              {selectedGame.result === 'win' ? '🏆' : selectedGame.result === 'loss' ? '😤' : '🤝'}
            </div>
            <h2 className="text-2xl font-bold text-white capitalize">{selectedGame.result}</h2>
            <p className="text-white/50">{new Date(selectedGame.date).toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}</p>
          </div>

          {/* Opponent */}
          <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl">
              {selectedGame.opponentAvatar}
            </div>
            <div>
              <p className="text-white/50 text-xs">Opponent</p>
              <p className="text-white font-bold text-lg">{selectedGame.opponent}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-white/50 text-xs mb-1">Mode</p>
              <p className="text-white font-bold capitalize">{selectedGame.mode}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-white/50 text-xs mb-1">Time Control</p>
              <p className="text-white font-bold capitalize">{selectedGame.timeControl}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-white/50 text-xs mb-1">Moves</p>
              <p className="text-white font-bold">{selectedGame.moves}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-white/50 text-xs mb-1">Duration</p>
              <p className="text-white font-bold">{selectedGame.duration}</p>
            </div>
          </div>

          {/* Rewards */}
          {(selectedGame.coinsWon > 0 || selectedGame.xpEarned > 0) && (
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-4">
              <p className="text-amber-400/70 text-xs mb-2">Rewards Earned</p>
              <div className="flex items-center gap-4">
                {selectedGame.coinsWon > 0 && (
                  <div className="flex items-center gap-2">
                    <Coins size={18} className="text-amber-400" />
                    <span className="text-amber-400 font-bold">+{selectedGame.coinsWon}</span>
                  </div>
                )}
                {selectedGame.xpEarned > 0 && (
                  <div className="flex items-center gap-2">
                    <TrendingUp size={18} className="text-purple-400" />
                    <span className="text-purple-400 font-bold">+{selectedGame.xpEarned} XP</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Difficulty (for PvE) */}
          {selectedGame.difficulty && (
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/50 text-xs mb-1">AI Difficulty</p>
              <p className="text-white font-bold capitalize">{selectedGame.difficulty}</p>
            </div>
          )}

          {/* Share Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleShareGame(selectedGame)}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white font-bold flex items-center justify-center gap-2"
          >
            <Share2 size={18} />
            Share Game Details
          </motion.button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* Share Modal */ }
  <AnimatePresence>
    {showShareModal && selectedGame && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4"
        onClick={() => setShowShareModal(false)}
      >
        <motion.div
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          onClick={(e) => e.stopPropagation()}
          className="glass rounded-3xl p-6 w-full max-w-sm space-y-5 border border-white/10 max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={() => setShowShareModal(false)}
            className="absolute top-4 right-4 p-2 text-white/50 hover:text-white z-10"
          >
            <X size={20} />
          </button>

          <h2 className="text-xl font-bold text-white text-center">Share Your Victory</h2>

          {/* Share Card Preview - Winning Poster */}
          <div
            ref={shareCardRef}
            className={cn(
              "rounded-2xl p-5 text-center relative overflow-hidden",
              selectedGame.result === 'win'
                ? "bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600"
                : selectedGame.result === 'loss'
                  ? "bg-gradient-to-br from-red-500 via-rose-500 to-orange-600"
                  : "bg-gradient-to-br from-gray-500 via-slate-500 to-zinc-600"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent" />

            {/* Decorative Elements */}
            <div className="absolute top-2 left-2 text-white/20 text-4xl">♔</div>
            <div className="absolute top-2 right-2 text-white/20 text-4xl">♚</div>
            <div className="absolute bottom-2 left-2 text-white/20 text-2xl">♞</div>
            <div className="absolute bottom-2 right-2 text-white/20 text-2xl">♝</div>

            <div className="relative z-10">
              {/* App Branding */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-2xl">♟️</span>
                <span className="text-white font-bold text-sm">Chess Champ</span>
              </div>

              {/* Result Icon */}
              <span className="text-6xl mb-2 block">
                {selectedGame.result === 'win' ? '🏆' : selectedGame.result === 'loss' ? '😤' : '🤝'}
              </span>

              {/* Result Text */}
              <h3 className="text-3xl font-bold text-white capitalize mb-1">
                {selectedGame.result === 'win' ? 'Victory!' : selectedGame.result === 'loss' ? 'Defeat' : 'Draw'}
              </h3>

              {/* Player Info */}
              <div className="bg-white/20 rounded-xl p-3 mt-3 mb-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">{user.avatar}</span>
                  <div className="text-left">
                    <p className="text-white font-bold">{user.name}</p>
                    <p className="text-white/70 text-xs">{user.country.flag} {user.country.name}</p>
                  </div>
                </div>
                <div className="text-white/80 text-sm mt-1">
                  vs <span className="font-semibold">{selectedGame.opponent}</span>
                </div>
              </div>

              {/* Game Stats */}
              <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                <div className="bg-white/20 rounded-lg px-2 py-2">
                  <p className="text-white/70 text-xs">Moves</p>
                  <p className="text-white font-bold">{selectedGame.moves}</p>
                </div>
                <div className="bg-white/20 rounded-lg px-2 py-2">
                  <p className="text-white/70 text-xs">Time</p>
                  <p className="text-white font-bold">{selectedGame.duration}</p>
                </div>
                <div className="bg-white/20 rounded-lg px-2 py-2">
                  <p className="text-white/70 text-xs">Mode</p>
                  <p className="text-white font-bold capitalize">{selectedGame.mode}</p>
                </div>
              </div>

              {/* QR Code Placeholder */}
              <div className="bg-white rounded-lg p-2 w-20 h-20 mx-auto mb-2">
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded flex items-center justify-center">
                  <div className="grid grid-cols-4 gap-0.5">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className={cn(
                        "w-2 h-2",
                        Math.random() > 0.5 ? "bg-white" : "bg-transparent"
                      )} />
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-white/80 text-xs">Scan to play • chesschamp.app</p>
            </div>
          </div>

          {shareSuccess ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-3">
                <Check size={32} className="text-white" />
              </div>
              <p className="text-green-400 font-bold">Copied to clipboard!</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {/* Social Media Grid */}
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider mb-3">Share to Social Media</p>
                <div className="grid grid-cols-4 gap-3">
                  {socialPlatforms.map((platform) => (
                    <motion.button
                      key={platform.name}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={platform.action}
                      className={cn(
                        "aspect-square rounded-xl flex flex-col items-center justify-center gap-1 bg-gradient-to-br shadow-lg",
                        platform.color
                      )}
                    >
                      <span className="text-2xl">{platform.icon}</span>
                      <span className="text-white text-[10px]">{platform.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Other Share Options */}
              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={shareNative}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-bold flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  More Sharing Options
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={copyShareText}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl text-white font-bold flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} />
                  Copy to Clipboard
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // Download poster functionality - would need html2canvas in real implementation
                    copyShareText();
                  }}
                  className="w-full py-3.5 glass rounded-xl text-white/70 font-bold flex items-center justify-center gap-2 border border-white/10"
                >
                  <Download size={18} />
                  Save Poster
                </motion.button>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowShareModal(false)}
                className="w-full py-3 text-white/50 font-medium"
              >
                Cancel
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* Month Picker Modal */ }
  <AnimatePresence>
    {showMonthPicker && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
        onClick={() => setShowMonthPicker(false)}
      >
        <motion.div
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          onClick={(e) => e.stopPropagation()}
          className="glass rounded-3xl p-6 w-full max-w-sm border border-white/10 max-h-[70vh] flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">View by Month</h2>
            <button
              onClick={() => setShowMonthPicker(false)}
              className="p-2 text-white/50 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {/* All time option */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedMonth(null);
                setShowMonthPicker(false);
              }}
              className={cn(
                "w-full p-4 rounded-xl flex items-center justify-between transition-all",
                !selectedMonth
                  ? "bg-amber-500/20 border border-amber-500/50"
                  : "bg-white/5 hover:bg-white/10"
              )}
            >
              <div className="flex items-center gap-3">
                <Calendar size={20} className={!selectedMonth ? "text-amber-400" : "text-white/50"} />
                <span className={cn("font-medium", !selectedMonth ? "text-amber-400" : "text-white")}>
                  All Time
                </span>
              </div>
              <span className="text-white/50 text-sm">{gameHistory.length} games</span>
            </motion.button>

            {/* Month options */}
            {months.map((monthKey) => {
              const gamesInMonth = gameHistory.filter(game => {
                const date = new Date(game.date);
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                return key === monthKey;
              }).length;

              return (
                <motion.button
                  key={monthKey}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedMonth(monthKey);
                    setShowMonthPicker(false);
                  }}
                  className={cn(
                    "w-full p-4 rounded-xl flex items-center justify-between transition-all",
                    selectedMonth === monthKey
                      ? "bg-amber-500/20 border border-amber-500/50"
                      : "bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Calendar size={20} className={selectedMonth === monthKey ? "text-amber-400" : "text-white/50"} />
                    <span className={cn("font-medium", selectedMonth === monthKey ? "text-amber-400" : "text-white")}>
                      {formatMonthName(monthKey)}
                    </span>
                  </div>
                  <span className="text-white/50 text-sm">{gamesInMonth} games</span>
                </motion.button>
              );
            })}

            {months.length === 0 && (
              <div className="text-center py-8">
                <p className="text-white/40">No game history available</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
    </MobileLayout >
  );
}
