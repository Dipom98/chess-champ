import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Trophy, Target, Users, Gift, ChevronRight, Coins, Sparkles, Crown, Zap, TrendingUp, X, Check, Star } from 'lucide-react';
import { MobileLayout } from '@/components/MobileLayout';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/utils/cn';
import { RANKS } from '@/systems/progression';
import { getLevelProgressPercent, calculateLevelProgress } from '@/systems/progression';

export function HomeScreen() {
  const navigate = useNavigate();
  const { user, friends, gameHistory, currentSeason, dailyReward, claimDailyReward, canClaimDailyReward, claimSignupReward, settings } = useGameStore();

  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showSignupReward, setShowSignupReward] = useState(!user.hasClaimedSignupReward);
  const [rewardClaimed, setRewardClaimed] = useState<{ amount: number; streak: number } | null>(null);
  const [isClaimAnimating, setIsClaimAnimating] = useState(false);

  const onlineFriends = friends.filter(f => f.online);
  const rankInfo = RANKS[user.rank];
  const levelProgress = calculateLevelProgress(user.totalPveWins);
  const progressPercent = getLevelProgressPercent(levelProgress);
  const canClaim = canClaimDailyReward();

  // Apply dark mode class to body
  useEffect(() => {
    if (settings.darkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [settings.darkMode]);

  const handleOpenDailyReward = () => {
    setRewardClaimed(null);
    setShowDailyReward(true);
  };

  const handleClaimDailyReward = () => {
    if (!canClaim || isClaimAnimating) return;

    setIsClaimAnimating(true);

    setTimeout(() => {
      const result = claimDailyReward();
      if (result.success) {
        setRewardClaimed({ amount: result.amount, streak: result.streak });
      }
      setIsClaimAnimating(false);
    }, 500);
  };

  const streakDays = [1, 2, 3, 4, 5, 6, 7];
  const getRewardForDay = (day: number) => 100 + (day - 1) * 50;

  const quickActions = [
    {
      icon: Play,
      label: 'Quick Play',
      subtitle: 'Jump into a game',
      color: 'from-emerald-500 via-green-500 to-teal-600',
      glow: 'shadow-emerald-500/30',
      action: () => navigate('/play'),
    },
    {
      icon: Trophy,
      label: 'Ranked',
      subtitle: 'Climb the ladder',
      color: 'from-amber-500 via-orange-500 to-red-500',
      glow: 'shadow-amber-500/30',
      action: () => navigate('/ranked'),
    },
    {
      icon: Target,
      label: 'Puzzles',
      subtitle: 'Train your mind',
      color: 'from-violet-500 via-purple-500 to-fuchsia-600',
      glow: 'shadow-purple-500/30',
      action: () => navigate('/puzzles'),
    },
    {
      icon: Users,
      label: 'Friends',
      subtitle: 'Challenge others',
      color: 'from-blue-500 via-cyan-500 to-teal-500',
      glow: 'shadow-blue-500/30',
      action: () => navigate('/friends'),
    },
  ];

  return (
    <MobileLayout>
      <div className="p-4 space-y-5 pb-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-white/50 text-sm">Welcome back,</p>
            <h1 className="text-2xl font-bold text-white">{user.name} 👋</h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/settings')}
            className="relative"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30 overflow-hidden">
              {user.customProfilePicture ? (
                <img
                  src={user.customProfilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                user.avatar
              )}
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-[#0f0a1e] flex items-center justify-center">
              <Sparkles size={10} className="text-white" />
            </div>
          </motion.button>
        </motion.div>

        {/* Stats Card with Level & Rank */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-5 relative overflow-hidden"
        >
          {/* Decorative background */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl" />

          <div className="relative z-10">
            {/* Level & Rank */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center text-2xl",
                  `bg-gradient-to-br ${rankInfo.gradient}`
                )}>
                  {rankInfo.icon}
                </div>
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wider">Level {user.level}</p>
                  <p className="text-xl font-bold text-white">{user.rank}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                {user.country && <span className="text-xl">{user.country.flag}</span>}
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wider">Win Rate</p>
                  <p className="text-lg font-semibold text-amber-400">
                    {user.gamesPlayed > 0 ? Math.round((user.wins / user.gamesPlayed) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>

            {/* Level Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/50">Level Progress</span>
                <span className="text-amber-400">{user.currentLevelWins}/{user.winsRequiredForNextLevel} wins</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className={cn("h-full rounded-full bg-gradient-to-r", rankInfo.gradient)}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-2xl p-3 text-center backdrop-blur-sm">
                <p className="text-2xl font-bold text-white">{user.gamesPlayed}</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wider">Games</p>
              </div>
              <div className="bg-green-500/10 rounded-2xl p-3 text-center backdrop-blur-sm border border-green-500/20">
                <p className="text-2xl font-bold text-green-400">{user.wins}</p>
                <p className="text-[10px] text-green-400/70 uppercase tracking-wider">Wins</p>
              </div>
              <div className="bg-amber-500/10 rounded-2xl p-3 text-center backdrop-blur-sm border border-amber-500/20">
                <p className="text-2xl font-bold text-amber-400">{user.streaks.currentWinStreak}</p>
                <p className="text-[10px] text-amber-400/70 uppercase tracking-wider">Streak</p>
              </div>
            </div>

            {/* Wallet Row */}
            <div className="flex gap-3 mt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/wallet')}
                className="flex-1 flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 rounded-xl px-4 py-2.5 border border-amber-500/20"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                  <Coins className="text-white" size={16} />
                </div>
                <span className="text-amber-400 font-bold">{user.wallet.balance.toLocaleString()}</span>
              </motion.button>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex-1 flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/10 rounded-xl px-4 py-2.5 border border-purple-500/20"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <TrendingUp className="text-white" size={16} />
                </div>
                <span className="text-purple-400 font-bold">+{user.streaks.streakBonusMultiplier * 100}%</span>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.action}
              className={cn(
                'relative overflow-hidden rounded-2xl p-4 flex flex-col items-start gap-2',
                'bg-gradient-to-br shadow-lg card-hover',
                action.color,
                action.glow
              )}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent" />
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

              <div className="relative z-10 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <action.icon size={22} className="text-white" />
              </div>
              <div className="relative z-10">
                <span className="text-white font-bold block">{action.label}</span>
                <span className="text-white/70 text-xs">{action.subtitle}</span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Online Friends */}
        {onlineFriends.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Online Now
              </h3>
              <button
                onClick={() => navigate('/friends')}
                className="text-amber-400 text-sm font-medium hover:text-amber-300 transition-colors"
              >
                See All
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
              {onlineFriends.slice(0, 5).map((friend, index) => (
                <motion.button
                  key={friend.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  whileHover={{ y: -4 }}
                  onClick={() => navigate(`/friends?invite=${friend.id}`)}
                  className="flex flex-col items-center gap-2 min-w-[70px]"
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg">
                      {friend.avatar}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-lg border-2 border-[#1a1333] flex items-center justify-center">
                      <Zap size={10} className="text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-white/70 text-xs truncate max-w-[70px] font-medium block">{friend.name}</span>
                    <span className="text-white/40 text-[10px]">{friend.country.flag} Lv.{friend.level}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">Recent Games</h3>
            <button
              onClick={() => navigate('/history')}
              className="text-amber-400 text-sm font-medium hover:text-amber-300 transition-colors"
            >
              View All
            </button>
          </div>

          {gameHistory.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/5 flex items-center justify-center">
                <Trophy size={28} className="text-white/30" />
              </div>
              <p className="text-white/40">No games played yet</p>
              <p className="text-white/30 text-sm">Start your first game!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {gameHistory.slice(0, 3).map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl p-3 transition-colors cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg shadow-md">
                    {game.opponentAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{game.opponent}</p>
                    <p className="text-white/40 text-xs">{game.mode} • {game.moves} moves</p>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide',
                      game.result === 'win' && 'bg-green-500/20 text-green-400 border border-green-500/30',
                      game.result === 'loss' && 'bg-red-500/20 text-red-400 border border-red-500/30',
                      game.result === 'draw' && 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    )}>
                      {game.result}
                    </div>
                    {game.coinsWon > 0 && (
                      <span className="text-amber-400 text-xs">+{game.coinsWon} 🪙</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Daily Bonus */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenDailyReward}
          className={cn(
            "w-full relative overflow-hidden rounded-2xl p-4 flex items-center gap-4 border",
            canClaim
              ? "bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-red-500/20 border-amber-500/30"
              : "bg-white/5 border-white/10"
          )}
        >
          {/* Animated shine */}
          {canClaim && <div className="absolute inset-0 shimmer" />}

          <div className={cn(
            "relative w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
            canClaim
              ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/30"
              : "bg-white/20"
          )}>
            <Gift className={canClaim ? "text-white" : "text-white/50"} size={24} />
          </div>
          <div className="flex-1 text-left relative">
            <p className="text-white font-bold flex items-center gap-2">
              Daily Reward
              {canClaim && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
            </p>
            <p className={cn(
              "text-sm",
              canClaim ? "text-amber-400/80" : "text-white/40"
            )}>
              {canClaim ? "Claim your free coins!" : `Come back tomorrow! (Day ${dailyReward.currentStreak}/7)`}
            </p>
          </div>
          <ChevronRight className={canClaim ? "text-amber-400 relative" : "text-white/30"} size={20} />
        </motion.button>

        {/* Season Info */}
        {currentSeason && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/ranked')}
            className="w-full glass rounded-2xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Crown className="text-white" size={24} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-bold">Season {currentSeason.number}: {currentSeason.name}</p>
                <p className="text-white/50 text-sm">Compete for exclusive rewards!</p>
              </div>
              <ChevronRight className="text-white/30" size={20} />
            </div>
          </motion.button>
        )}

        {/* Premium Subscription Banner */}
        {!settings.isPremium && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/settings')}
            className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl p-4 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent" />
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute inset-0 shimmer" />

            <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Star size={24} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-bold">Go Premium</p>
                <p className="text-white/80 text-sm">Unlock exclusive themes • $1.99/mo</p>
              </div>
              <ChevronRight className="text-white/70" size={20} />
            </div>
          </motion.button>
        )}
      </div>

      {/* Daily Reward Modal */}
      <AnimatePresence>
        {showDailyReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowDailyReward(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-3xl p-6 w-full max-w-sm space-y-5 border border-amber-500/30 relative overflow-hidden"
            >
              {/* Background glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl" />

              {/* Close button */}
              <button
                onClick={() => setShowDailyReward(false)}
                className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors z-10"
              >
                <X size={20} />
              </button>

              <div className="text-center relative z-10">
                <motion.div
                  animate={rewardClaimed ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
                  className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30"
                >
                  {rewardClaimed ? (
                    <Check size={40} className="text-white" />
                  ) : (
                    <Gift size={40} className="text-white" />
                  )}
                </motion.div>
                <h2 className="text-2xl font-bold text-white">
                  {rewardClaimed ? "Reward Claimed!" : "Daily Reward"}
                </h2>
                {rewardClaimed ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mt-2"
                  >
                    <p className="text-amber-400 text-3xl font-bold">+{rewardClaimed.amount} 🪙</p>
                    <p className="text-white/50 text-sm mt-1">Day {rewardClaimed.streak} streak bonus!</p>
                  </motion.div>
                ) : (
                  <p className="text-white/50 mt-1">
                    {canClaim ? "Claim today's reward!" : "Come back tomorrow!"}
                  </p>
                )}
              </div>

              {/* Streak Calendar */}
              <div className="relative z-10">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-3 text-center">7-Day Streak</p>
                <div className="grid grid-cols-7 gap-2">
                  {streakDays.map((day) => {
                    const isCompleted = day <= dailyReward.currentStreak;
                    const isToday = day === dailyReward.currentStreak + 1 && canClaim;
                    const reward = getRewardForDay(day);

                    return (
                      <motion.div
                        key={day}
                        whileHover={{ scale: 1.1 }}
                        className={cn(
                          "aspect-square rounded-xl flex flex-col items-center justify-center p-1 relative",
                          isCompleted && "bg-gradient-to-br from-green-500 to-emerald-600",
                          isToday && "bg-gradient-to-br from-amber-400 to-orange-500 animate-pulse",
                          !isCompleted && !isToday && "bg-white/10"
                        )}
                      >
                        {isCompleted ? (
                          <Check size={16} className="text-white" />
                        ) : (
                          <>
                            <span className={cn(
                              "text-xs font-bold",
                              isToday ? "text-white" : "text-white/50"
                            )}>{day}</span>
                            <span className={cn(
                              "text-[8px]",
                              isToday ? "text-white/80" : "text-white/30"
                            )}>+{reward}</span>
                          </>
                        )}
                        {day === 7 && (
                          <div className="absolute -top-1 -right-1 text-xs">👑</div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Reward Info */}
              {!rewardClaimed && (
                <div className="bg-white/5 rounded-xl p-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70 text-sm">Today's Reward</span>
                    <span className="text-amber-400 font-bold">
                      +{getRewardForDay(Math.min(dailyReward.currentStreak + 1, 7))} 🪙
                    </span>
                  </div>
                  {dailyReward.currentStreak < 7 && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                      <span className="text-white/50 text-xs">Day 7 Bonus</span>
                      <span className="text-purple-400 font-bold text-xs">+400 🪙 + 👑</span>
                    </div>
                  )}
                </div>
              )}

              {/* Claim Button */}
              {!rewardClaimed && (
                <motion.button
                  whileHover={{ scale: canClaim ? 1.02 : 1 }}
                  whileTap={{ scale: canClaim ? 0.98 : 1 }}
                  onClick={handleClaimDailyReward}
                  disabled={!canClaim || isClaimAnimating}
                  className={cn(
                    "w-full py-4 rounded-xl font-bold relative overflow-hidden transition-all",
                    canClaim
                      ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30"
                      : "bg-white/10 text-white/40 cursor-not-allowed"
                  )}
                >
                  {canClaim && <div className="absolute inset-0 shimmer" />}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isClaimAnimating ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : canClaim ? (
                      <>
                        <Gift size={18} />
                        Claim Reward
                      </>
                    ) : (
                      "Already Claimed Today"
                    )}
                  </span>
                </motion.button>
              )}

              {/* Close after claim */}
              {rewardClaimed && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDailyReward(false)}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold text-white shadow-lg shadow-green-500/30"
                >
                  Awesome! 🎉
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signup Reward Modal */}
      <AnimatePresence>
        {showSignupReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="glass rounded-3xl p-8 w-full max-w-sm space-y-6 border border-amber-500/30 relative overflow-hidden text-center"
            >
              {/* Background glows */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-red-500/20 rounded-full blur-3xl" />

              <div className="relative z-10">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/40"
                >
                  <Gift size={48} className="text-white" />
                </motion.div>

                <h2 className="text-3xl font-bold text-white mb-2">Welcome Gift! 🎁</h2>
                <p className="text-white/60 mb-8 leading-relaxed">
                  Thanks for joining Chess Champ! We've got a special welcome reward for you to get started.
                </p>

                <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10 backdrop-blur-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-white/50 text-sm uppercase tracking-widest mb-1">Your Reward</p>
                  <p className="text-4xl font-black text-amber-400 flex items-center justify-center gap-2">
                    500 <span className="text-2xl">🪙</span>
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const result = claimSignupReward();
                    if (result.success) {
                      setShowSignupReward(false);
                    }
                  }}
                  className="w-full py-4 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-2xl text-white font-bold text-lg shadow-xl shadow-amber-500/30 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent" />
                  <div className="absolute inset-0 shimmer opacity-30" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Claim My Reward
                    <Sparkles size={18} />
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
