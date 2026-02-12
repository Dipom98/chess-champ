// ============================================
// SEASONAL LEAGUES SYSTEM
// ============================================

import { Season, SeasonStats, SeasonReward } from './types';

// ---- CONSTANTS ----
const SEASON_DURATION_DAYS = 30;
const SEASON_DURATION_MS = SEASON_DURATION_DAYS * 24 * 60 * 60 * 1000;

// ---- SEASON REWARDS ----
const DEFAULT_SEASON_REWARDS: SeasonReward[] = [
  { rankRange: [1, 1], coins: 10000, badge: '🥇', badgeColor: 'from-amber-300 to-yellow-500' },
  { rankRange: [2, 2], coins: 7500, badge: '🥈', badgeColor: 'from-slate-300 to-slate-400' },
  { rankRange: [3, 3], coins: 5000, badge: '🥉', badgeColor: 'from-amber-600 to-orange-700' },
  { rankRange: [4, 10], coins: 2500, badge: '⭐', badgeColor: 'from-purple-400 to-purple-600' },
  { rankRange: [11, 25], coins: 1500, badge: '🏅', badgeColor: 'from-blue-400 to-blue-600' },
  { rankRange: [26, 50], coins: 1000, badge: '🎖️', badgeColor: 'from-green-400 to-green-600' },
  { rankRange: [51, 100], coins: 500, badge: '🌟', badgeColor: 'from-cyan-400 to-cyan-600' },
  { rankRange: [101, 500], coins: 250, badge: '✨', badgeColor: 'from-pink-400 to-pink-600' },
  { rankRange: [501, 1000], coins: 100, badge: '💫', badgeColor: 'from-slate-400 to-slate-600' },
];

// ---- SEASON NAMES ----
const SEASON_NAMES = [
  'Opening Gambit',
  'Knight\'s Quest',
  'Bishop\'s Path',
  'Rook\'s Fortress',
  'Queen\'s Reign',
  'King\'s Glory',
  'Checkmate Championship',
  'Grand Prix',
  'Master\'s Cup',
  'Legend\'s Legacy',
];

// ---- SEASON MANAGEMENT ----

/**
 * Create a new season
 */
export function createSeason(seasonNumber: number): Season {
  const now = Date.now();
  const nameIndex = (seasonNumber - 1) % SEASON_NAMES.length;
  
  return {
    id: `season_${seasonNumber}_${now}`,
    number: seasonNumber,
    name: SEASON_NAMES[nameIndex],
    startDate: now,
    endDate: now + SEASON_DURATION_MS,
    isActive: true,
    rewards: DEFAULT_SEASON_REWARDS,
  };
}

/**
 * Check if season has ended
 */
export function isSeasonEnded(season: Season): boolean {
  return Date.now() >= season.endDate;
}

/**
 * Get remaining time in season
 */
export function getSeasonRemainingTime(season: Season): {
  days: number;
  hours: number;
  minutes: number;
  totalMs: number;
} {
  const remaining = Math.max(0, season.endDate - Date.now());
  
  return {
    days: Math.floor(remaining / (24 * 60 * 60 * 1000)),
    hours: Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
    minutes: Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000)),
    totalMs: remaining,
  };
}

/**
 * Format remaining time
 */
export function formatSeasonRemaining(season: Season): string {
  const time = getSeasonRemainingTime(season);
  
  if (time.days > 0) {
    return `${time.days}d ${time.hours}h remaining`;
  }
  if (time.hours > 0) {
    return `${time.hours}h ${time.minutes}m remaining`;
  }
  return `${time.minutes}m remaining`;
}

// ---- SEASON STATS ----

/**
 * Create new season stats for player
 */
export function createSeasonStats(season: Season, _playerId: string): SeasonStats {
  return {
    seasonId: season.id,
    seasonNumber: season.number,
    startDate: season.startDate,
    endDate: season.endDate,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    coinsEarned: 0,
    xpEarned: 0,
    highestStreak: 0,
    rank: 0,
  };
}

/**
 * Update season stats after match
 */
export function updateSeasonStats(
  stats: SeasonStats,
  result: 'win' | 'loss' | 'draw',
  coinsEarned: number,
  xpEarned: number,
  currentStreak: number
): SeasonStats {
  return {
    ...stats,
    gamesPlayed: stats.gamesPlayed + 1,
    wins: stats.wins + (result === 'win' ? 1 : 0),
    losses: stats.losses + (result === 'loss' ? 1 : 0),
    draws: stats.draws + (result === 'draw' ? 1 : 0),
    coinsEarned: stats.coinsEarned + coinsEarned,
    xpEarned: stats.xpEarned + xpEarned,
    highestStreak: Math.max(stats.highestStreak, currentStreak),
  };
}

// ---- LEADERBOARD ----

/**
 * Calculate season score for ranking
 * Score = wins * 100 + draws * 25 - losses * 10 + streak_bonus + coins_bonus
 */
export function calculateSeasonScore(stats: SeasonStats): number {
  const winPoints = stats.wins * 100;
  const drawPoints = stats.draws * 25;
  const lossPenalty = stats.losses * 10;
  const streakBonus = stats.highestStreak * 20;
  const coinsBonus = Math.floor(stats.coinsEarned / 100);
  
  return Math.max(0, winPoints + drawPoints - lossPenalty + streakBonus + coinsBonus);
}

/**
 * Rank players by season score
 */
export function rankPlayers(
  allStats: { playerId: string; stats: SeasonStats }[]
): { playerId: string; stats: SeasonStats; score: number; rank: number }[] {
  const scored = allStats.map(({ playerId, stats }) => ({
    playerId,
    stats,
    score: calculateSeasonScore(stats),
    rank: 0,
  }));
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  // Assign ranks
  scored.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  
  return scored;
}

/**
 * Get reward for rank
 */
export function getRewardForRank(rank: number, rewards: SeasonReward[]): SeasonReward | null {
  for (const reward of rewards) {
    if (rank >= reward.rankRange[0] && rank <= reward.rankRange[1]) {
      return reward;
    }
  }
  return null;
}

/**
 * Calculate all season end rewards
 */
export function calculateSeasonEndRewards(
  rankedPlayers: { playerId: string; rank: number }[],
  rewards: SeasonReward[]
): { playerId: string; coins: number; badge: string; badgeColor: string }[] {
  return rankedPlayers
    .map(({ playerId, rank }) => {
      const reward = getRewardForRank(rank, rewards);
      if (!reward) return null;
      
      return {
        playerId,
        coins: reward.coins,
        badge: reward.badge,
        badgeColor: reward.badgeColor,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
}

// ---- SEASON TRANSITION ----

/**
 * End current season and start new one
 */
export function transitionSeason(currentSeason: Season): {
  endedSeason: Season;
  newSeason: Season;
} {
  const endedSeason: Season = {
    ...currentSeason,
    isActive: false,
  };
  
  const newSeason = createSeason(currentSeason.number + 1);
  
  return { endedSeason, newSeason };
}

/**
 * Archive player stats for ended season
 */
export function archiveSeasonStats(
  currentStats: SeasonStats,
  finalRank: number
): SeasonStats {
  return {
    ...currentStats,
    rank: finalRank,
  };
}

// ---- SEASON DISPLAY ----

/**
 * Get season progress percentage
 */
export function getSeasonProgress(season: Season): number {
  const elapsed = Date.now() - season.startDate;
  const total = season.endDate - season.startDate;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

/**
 * Get tier name based on seasonal rank
 */
export function getSeasonTier(rank: number): {
  name: string;
  color: string;
  icon: string;
} {
  if (rank === 1) {
    return { name: 'Champion', color: 'text-amber-400', icon: '👑' };
  }
  if (rank <= 3) {
    return { name: 'Elite', color: 'text-purple-400', icon: '💎' };
  }
  if (rank <= 10) {
    return { name: 'Diamond', color: 'text-cyan-400', icon: '💠' };
  }
  if (rank <= 25) {
    return { name: 'Platinum', color: 'text-slate-300', icon: '🏆' };
  }
  if (rank <= 50) {
    return { name: 'Gold', color: 'text-amber-500', icon: '🥇' };
  }
  if (rank <= 100) {
    return { name: 'Silver', color: 'text-slate-400', icon: '🥈' };
  }
  if (rank <= 500) {
    return { name: 'Bronze', color: 'text-amber-600', icon: '🥉' };
  }
  return { name: 'Iron', color: 'text-gray-500', icon: '⚔️' };
}
