// ============================================
// LEVEL & RANK PROGRESSION SYSTEM
// ============================================

import { RankInfo, RankName, LevelProgress, AIDifficulty } from './types';

// ---- RANK DEFINITIONS ----
export const RANKS: Record<RankName, RankInfo> = {
  'Pawn': {
    name: 'Pawn',
    minLevel: 1,
    maxLevel: 10,
    icon: '♟',
    color: '#94a3b8',
    gradient: 'from-slate-400 to-slate-600',
    aiDepthBonus: 0,
    coinMultiplier: 1.0,
  },
  'Knight': {
    name: 'Knight',
    minLevel: 11,
    maxLevel: 20,
    icon: '♞',
    color: '#22c55e',
    gradient: 'from-green-400 to-green-600',
    aiDepthBonus: 1,
    coinMultiplier: 1.1,
  },
  'Bishop': {
    name: 'Bishop',
    minLevel: 21,
    maxLevel: 30,
    icon: '♝',
    color: '#3b82f6',
    gradient: 'from-blue-400 to-blue-600',
    aiDepthBonus: 1,
    coinMultiplier: 1.2,
  },
  'Rook': {
    name: 'Rook',
    minLevel: 31,
    maxLevel: 40,
    icon: '♜',
    color: '#8b5cf6',
    gradient: 'from-violet-400 to-violet-600',
    aiDepthBonus: 2,
    coinMultiplier: 1.3,
  },
  'Squire': {
    name: 'Squire',
    minLevel: 41,
    maxLevel: 50,
    icon: '⚔️',
    color: '#f59e0b',
    gradient: 'from-amber-400 to-amber-600',
    aiDepthBonus: 2,
    coinMultiplier: 1.4,
  },
  'Champion': {
    name: 'Champion',
    minLevel: 51,
    maxLevel: 60,
    icon: '🏆',
    color: '#ef4444',
    gradient: 'from-red-400 to-red-600',
    aiDepthBonus: 3,
    coinMultiplier: 1.5,
  },
  'Elite': {
    name: 'Elite',
    minLevel: 61,
    maxLevel: 70,
    icon: '💎',
    color: '#06b6d4',
    gradient: 'from-cyan-400 to-cyan-600',
    aiDepthBonus: 3,
    coinMultiplier: 1.6,
  },
  'Master': {
    name: 'Master',
    minLevel: 71,
    maxLevel: 80,
    icon: '👑',
    color: '#d97706',
    gradient: 'from-orange-400 to-orange-600',
    aiDepthBonus: 4,
    coinMultiplier: 1.8,
  },
  'Grandmaster': {
    name: 'Grandmaster',
    minLevel: 81,
    maxLevel: 90,
    icon: '🎖️',
    color: '#7c3aed',
    gradient: 'from-purple-500 to-purple-700',
    aiDepthBonus: 4,
    coinMultiplier: 2.0,
  },
  'Legend': {
    name: 'Legend',
    minLevel: 91,
    maxLevel: 100,
    icon: '🌟',
    color: '#fbbf24',
    gradient: 'from-amber-300 via-yellow-400 to-orange-500',
    aiDepthBonus: 5,
    coinMultiplier: 2.5,
  },
};

// ---- LEVEL PROGRESSION FORMULAS ----

/**
 * Calculate wins required for next level
 * 
 * Hardcoded for levels 1-5:
 * L1 → L2 = 2 wins
 * L2 → L3 = 5 wins
 * L3 → L4 = 10 wins
 * L4 → L5 = 20 wins
 * L5 → L6 = 30 wins
 * 
 * Formula for L6+:
 * wins = floor(30 + (level - 5) * 5 + (level - 5)^1.3)
 */
export function getWinsRequiredForLevel(level: number): number {
  if (level <= 0) return 0;

  const hardcodedThresholds: Record<number, number> = {
    1: 2,
    2: 5,
    3: 10,
    4: 20,
    5: 30,
  };

  if (level <= 5) {
    return hardcodedThresholds[level] || 2;
  }

  // Scalable formula for L6+
  // Base: 30, linear scaling: 5 per level, exponential factor: 1.3
  const base = 30;
  const levelDiff = level - 5;
  const linearPart = levelDiff * 5;
  const exponentialPart = Math.pow(levelDiff, 1.3);

  return Math.floor(base + linearPart + exponentialPart);
}

/**
 * Get cumulative wins needed to reach a level
 */
export function getCumulativeWinsForLevel(targetLevel: number): number {
  let total = 0;
  for (let i = 1; i < targetLevel; i++) {
    total += getWinsRequiredForLevel(i);
  }
  return total;
}

/**
 * Calculate level from total PvE wins
 */
export function getLevelFromWins(totalWins: number): number {
  let level = 1;
  let winsNeeded = 0;

  while (level < 100) {
    winsNeeded += getWinsRequiredForLevel(level);
    if (totalWins < winsNeeded) {
      return level;
    }
    level++;
  }

  return 100; // Max level
}

/**
 * Get rank from level
 */
export function getRankFromLevel(level: number): RankName {
  if (level <= 10) return 'Pawn';
  if (level <= 20) return 'Knight';
  if (level <= 30) return 'Bishop';
  if (level <= 40) return 'Rook';
  if (level <= 50) return 'Squire';
  if (level <= 60) return 'Champion';
  if (level <= 70) return 'Elite';
  if (level <= 80) return 'Master';
  if (level <= 90) return 'Grandmaster';
  return 'Legend';
}

/**
 * Get detailed rank info
 */
export function getRankInfo(level: number): RankInfo {
  const rankName = getRankFromLevel(level);
  return RANKS[rankName];
}

/**
 * Calculate full level progress
 */
export function calculateLevelProgress(totalPveWins: number): LevelProgress {
  const level = getLevelFromWins(totalPveWins);
  const winsForCurrentLevel = getCumulativeWinsForLevel(level);
  const winsForNextLevel = level < 100 ? getWinsRequiredForLevel(level) : 0;
  const currentLevelWins = totalPveWins - winsForCurrentLevel;

  return {
    level,
    currentLevelWins,
    winsRequiredForNextLevel: winsForNextLevel,
    totalPveWins: totalPveWins,
    xp: currentLevelWins * 100, // Simple XP calculation
    totalXp: totalPveWins * 100,
  };
}

/**
 * Check if player leveled up after a win
 */
export function checkLevelUp(
  previousWins: number,
  newWins: number
): { leveledUp: boolean; oldLevel: number; newLevel: number; levelsGained: number } {
  const oldLevel = getLevelFromWins(previousWins);
  const newLevel = getLevelFromWins(newWins);

  return {
    leveledUp: newLevel > oldLevel,
    oldLevel,
    newLevel,
    levelsGained: newLevel - oldLevel,
  };
}

// ---- AI DIFFICULTY SCALING ----

/**
 * Get AI depth based on player level and difficulty
 */
export function getAIDepth(playerLevel: number, difficulty: AIDifficulty): number {
  const baseDepths: Record<AIDifficulty, number> = {
    'beginner': 2,
    'intermediate': 3,
    'advanced': 4,
    'expert': 5,
    'engine': 5, // Reduced from 6 to prevent deep freezes
  };

  const rankInfo = getRankInfo(playerLevel);
  const baseDepth = baseDepths[difficulty];

  // Add rank bonus for higher difficulties
  if (difficulty === 'advanced' || difficulty === 'expert' || difficulty === 'engine') {
    // Legends and Grandmasters get a significant boost to engine depth
    const bonus = Math.floor(rankInfo.aiDepthBonus / 2);
    // Hard cap at 6 to prevent freezing on mobile
    return Math.min(baseDepth + bonus, 6);
  }

  return baseDepth;
}

/**
 * Get minimum level required for difficulty
 */
export function getMinLevelForDifficulty(difficulty: AIDifficulty): number {
  const minLevels: Record<AIDifficulty, number> = {
    'beginner': 1,
    'intermediate': 5,
    'advanced': 15,
    'expert': 30,
    'engine': 50,
  };
  return minLevels[difficulty];
}

/**
 * Check if player can access difficulty
 */
export function canAccessDifficulty(playerLevel: number, difficulty: AIDifficulty): boolean {
  return playerLevel >= getMinLevelForDifficulty(difficulty);
}

// ---- RATING MIGRATION ----

/**
 * Convert old rating to approximate starting level
 * Rating ranges: 400-3000
 * Level ranges: 1-100
 */
export function migrateRatingToLevel(oldRating: number): number {
  // Clamp rating
  const rating = Math.max(400, Math.min(3000, oldRating));

  // Linear mapping with some curve
  // 400 → Level 1
  // 1000 → Level 15
  // 1200 → Level 20 (default starting)
  // 1500 → Level 35
  // 2000 → Level 55
  // 2500 → Level 80
  // 3000 → Level 100

  if (rating <= 1000) {
    return Math.floor(1 + ((rating - 400) / 600) * 14);
  } else if (rating <= 1500) {
    return Math.floor(15 + ((rating - 1000) / 500) * 20);
  } else if (rating <= 2000) {
    return Math.floor(35 + ((rating - 1500) / 500) * 20);
  } else if (rating <= 2500) {
    return Math.floor(55 + ((rating - 2000) / 500) * 25);
  } else {
    return Math.floor(80 + ((rating - 2500) / 500) * 20);
  }
}

/**
 * Estimate wins needed to reach migrated level
 */
export function getWinsForMigratedLevel(level: number): number {
  return getCumulativeWinsForLevel(level);
}

// ---- LEVEL PROGRESS DISPLAY ----

/**
 * Get progress percentage to next level
 */
export function getLevelProgressPercent(progress: LevelProgress): number {
  if (progress.level >= 100) return 100;
  if (progress.winsRequiredForNextLevel === 0) return 100;
  return Math.min(100, (progress.currentLevelWins / progress.winsRequiredForNextLevel) * 100);
}

/**
 * Get formatted level display
 */
export function formatLevelDisplay(level: number): string {
  const rankInfo = getRankInfo(level);
  return `${rankInfo.icon} ${rankInfo.name} (Lv.${level})`;
}
