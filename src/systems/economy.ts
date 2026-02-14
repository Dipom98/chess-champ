// ============================================
// COIN ECONOMY SYSTEM
// ============================================

import {
  Wallet, Transaction, TransactionType,
  AIDifficulty, TimeControl, StreakData,
  PveMatchResult, PvpMatchResult
} from './types';
import { getRankInfo, getMinLevelForDifficulty } from './progression';

// ---- CONSTANTS ----
const PVE_WIN_MULTIPLIER = 1.8; // 180% of bet
const PVP_WIN_MULTIPLIER = 1.8; // 180% of total pot
const PVP_BURN_RATE = 0.2; // 20% burned
const PVP_DRAW_REFUND_RATE = 0.9; // 90% refunded
const PVP_DRAW_BURN_RATE = 0.1; // 10% burned on draw

const MAX_WIN_STREAK_BONUS = 0.25; // 25% max
const WIN_STREAK_BONUS_PER_WIN = 0.05; // 5% per win
const LOSS_STREAK_PROTECTION_THRESHOLD = 3;
const LOSS_STREAK_REDUCTION = 0.5; // 50% reduced loss after 3 losses

const GIFT_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours
const MAX_GIFTS_PER_DAY = 5;
const GIFT_MIN_COINS = 10;
// Max gift amount is 1000 (see generateGiftReward function)

// Anti-farming
const LOW_DIFFICULTY_PENALTY_THRESHOLD = 10; // After 10 wins on beginner
const LOW_DIFFICULTY_COIN_REDUCTION = 0.5; // 50% reduced coins
const LOW_DIFFICULTY_XP_REDUCTION = 0.25; // 75% reduced XP

// ---- ENTRY COSTS ----

/**
 * Calculate PvE entry cost based on difficulty and player level
 * 
 * Base costs:
 * - Beginner: 10 coins
 * - Intermediate: 25 coins
 * - Advanced: 50 coins
 * - Expert: 100 coins
 * - Engine: 200 coins
 * 
 * Level scaling: +2% per level above minimum
 */
export function getPveEntryCost(difficulty: AIDifficulty, playerLevel: number): number {
  const baseCosts: Record<AIDifficulty, number> = {
    'beginner': 10,
    'intermediate': 25,
    'advanced': 50,
    'expert': 100,
    'engine': 200,
  };

  const baseCost = baseCosts[difficulty];
  const minLevel = getMinLevelForDifficulty(difficulty);
  const levelDiff = Math.max(0, playerLevel - minLevel);
  const scalingFactor = 1 + (levelDiff * 0.02);

  return Math.floor(baseCost * scalingFactor);
}

/**
 * Calculate PvE win reward
 */
export function getPveWinReward(betAmount: number): number {
  return Math.floor(betAmount * PVE_WIN_MULTIPLIER);
}

/**
 * Calculate PvP win payout
 */
export function getPvpWinPayout(totalPot: number): number {
  return Math.floor(totalPot * PVP_WIN_MULTIPLIER);
}

/**
 * Calculate PvP burn amount
 */
export function getPvpBurnAmount(totalPot: number): number {
  return Math.floor(totalPot * PVP_BURN_RATE);
}

/**
 * Calculate PvP draw refund
 */
export function getPvpDrawRefund(stakeAmount: number): number {
  return Math.floor(stakeAmount * PVP_DRAW_REFUND_RATE);
}

// ---- LEVEL UP REWARDS ----

/**
 * Calculate level-up coin reward
 * 
 * Formula: base + (level^1.5 * 10) + rank_bonus
 * 
 * Examples:
 * - Level 2: 50 + (2.83 * 10) = ~78 coins
 * - Level 10: 50 + (31.6 * 10) = ~366 coins
 * - Level 25: 50 + (125 * 10) = ~1300 coins
 * - Level 50: 50 + (354 * 10) = ~3590 coins
 * - Level 100: 50 + (1000 * 10) = ~10050 coins
 */
export function getLevelUpReward(level: number): number {
  const baseReward = 50;
  const scalingReward = Math.pow(level, 1.5) * 10;
  const rankInfo = getRankInfo(level);
  const rankBonus = (rankInfo.coinMultiplier - 1) * 100;

  return Math.floor(baseReward + scalingReward + rankBonus);
}

/**
 * Generate random gift reward (10-1000 coins)
 * Weighted towards lower values with diminishing returns
 */
export function generateGiftReward(
  giftClaimsToday: number,
  lastGiftTime: number
): { amount: number; canClaim: boolean; reason?: string } {
  const now = Date.now();

  // Cooldown check
  if (now - lastGiftTime < GIFT_COOLDOWN_MS) {
    const remainingMs = GIFT_COOLDOWN_MS - (now - lastGiftTime);
    const remainingMins = Math.ceil(remainingMs / 60000);
    return {
      amount: 0,
      canClaim: false,
      reason: `Cooldown: ${remainingMins} minutes remaining`
    };
  }

  // Daily limit check
  if (giftClaimsToday >= MAX_GIFTS_PER_DAY) {
    return {
      amount: 0,
      canClaim: false,
      reason: 'Daily gift limit reached'
    };
  }

  // Diminishing returns based on claims today
  const diminishingFactor = Math.pow(0.8, giftClaimsToday);

  // Weighted random (favor lower values)
  const random = Math.random();
  let baseAmount: number;

  if (random < 0.5) {
    // 50% chance: 10-100 coins
    baseAmount = GIFT_MIN_COINS + Math.floor(Math.random() * 90);
  } else if (random < 0.8) {
    // 30% chance: 100-300 coins
    baseAmount = 100 + Math.floor(Math.random() * 200);
  } else if (random < 0.95) {
    // 15% chance: 300-600 coins
    baseAmount = 300 + Math.floor(Math.random() * 300);
  } else {
    // 5% chance: 600-1000 coins
    baseAmount = 600 + Math.floor(Math.random() * 400);
  }

  const finalAmount = Math.floor(baseAmount * diminishingFactor);

  return {
    amount: Math.max(GIFT_MIN_COINS, finalAmount),
    canClaim: true,
  };
}

// ---- STREAKS ----

/**
 * Calculate streak bonus multiplier
 */
export function calculateStreakBonus(streakData: StreakData): number {
  const bonus = Math.min(
    streakData.currentWinStreak * WIN_STREAK_BONUS_PER_WIN,
    MAX_WIN_STREAK_BONUS
  );
  return bonus;
}

/**
 * Update streak data after match
 */
export function updateStreakData(
  current: StreakData,
  result: 'win' | 'loss' | 'draw'
): StreakData {
  const updated = { ...current };

  if (result === 'win') {
    updated.currentWinStreak += 1;
    updated.currentLossStreak = 0;
    updated.longestWinStreak = Math.max(
      updated.longestWinStreak,
      updated.currentWinStreak
    );
    updated.streakBonusMultiplier = calculateStreakBonus(updated);
  } else if (result === 'loss') {
    updated.currentWinStreak = 0;
    updated.currentLossStreak += 1;
    updated.streakBonusMultiplier = 0;
  } else {
    // Draw doesn't break win streak but doesn't add to it
    updated.currentLossStreak = 0;
  }

  updated.lastMatchResult = result;
  return updated;
}

/**
 * Check if loss protection applies
 */
export function hasLossProtection(streakData: StreakData): boolean {
  return streakData.currentLossStreak >= LOSS_STREAK_PROTECTION_THRESHOLD;
}

/**
 * Get loss amount after protection
 */
export function getProtectedLoss(originalLoss: number, streakData: StreakData): number {
  if (hasLossProtection(streakData)) {
    return Math.floor(originalLoss * LOSS_STREAK_REDUCTION);
  }
  return originalLoss;
}

// ---- TIME CONTROL MULTIPLIERS ----

export function getTimeControlMultipliers(timeControl: TimeControl): {
  xpMultiplier: number;
  coinMultiplier: number;
} {
  const multipliers: Record<TimeControl, { xpMultiplier: number; coinMultiplier: number }> = {
    'bullet': { xpMultiplier: 0.5, coinMultiplier: 0.8 },
    'blitz': { xpMultiplier: 0.75, coinMultiplier: 0.9 },
    'rapid': { xpMultiplier: 1.0, coinMultiplier: 1.0 },
    'classical': { xpMultiplier: 1.25, coinMultiplier: 1.1 },
    'unlimited': { xpMultiplier: 0.8, coinMultiplier: 0.9 },
  };
  return multipliers[timeControl];
}

// ---- ANTI-FARMING ----

/**
 * Check if player is farming low difficulty
 */
export function isFarmingLowDifficulty(
  difficulty: AIDifficulty,
  playerLevel: number,
  winsOnDifficulty: number
): boolean {
  // Only applies to beginner when player is above level 10
  if (difficulty !== 'beginner' || playerLevel <= 10) {
    return false;
  }
  return winsOnDifficulty >= LOW_DIFFICULTY_PENALTY_THRESHOLD;
}

/**
 * Apply farming penalty to rewards
 */
export function applyFarmingPenalty(
  coins: number,
  xp: number,
  isFarming: boolean
): { coins: number; xp: number } {
  if (!isFarming) {
    return { coins, xp };
  }
  return {
    coins: Math.floor(coins * LOW_DIFFICULTY_COIN_REDUCTION),
    xp: Math.floor(xp * LOW_DIFFICULTY_XP_REDUCTION),
  };
}

// ---- MATCH SETTLEMENT ----

/**
 * Calculate PvE match result
 */
export function calculatePveMatchResult(
  matchId: string,
  result: 'win' | 'loss' | 'draw',
  difficulty: AIDifficulty,
  timeControl: TimeControl,
  betAmount: number,
  playerLevel: number,
  streakData: StreakData,
  winsOnDifficulty: number
): PveMatchResult {
  const isFarming = isFarmingLowDifficulty(difficulty, playerLevel, winsOnDifficulty);
  const timeMultipliers = getTimeControlMultipliers(timeControl);
  const rankInfo = getRankInfo(playerLevel);

  let payout = 0;
  let xpEarned = 0;
  let winsEarned = 0;
  let farmingPenalty = 0;

  const baseXp: Record<AIDifficulty, number> = {
    'beginner': 25,
    'intermediate': 50,
    'advanced': 100,
    'expert': 200,
    'engine': 400,
  };

  if (result === 'win') {
    payout = getPveWinReward(betAmount);
    xpEarned = baseXp[difficulty];
    winsEarned = 1;

    // Apply streak bonus
    const streakBonus = calculateStreakBonus(streakData);
    payout = Math.floor(payout * (1 + streakBonus));

    // Apply rank multiplier
    payout = Math.floor(payout * rankInfo.coinMultiplier);

    // Apply time control multipliers
    payout = Math.floor(payout * timeMultipliers.coinMultiplier);
    xpEarned = Math.floor(xpEarned * timeMultipliers.xpMultiplier);

    // Apply farming penalty
    if (isFarming) {
      const penalized = applyFarmingPenalty(payout - betAmount, xpEarned, true);
      farmingPenalty = (payout - betAmount) - penalized.coins;
      payout = betAmount + penalized.coins;
      xpEarned = penalized.xp;
    }
  } else if (result === 'loss') {
    payout = 0; // Bet is lost
    xpEarned = Math.floor(baseXp[difficulty] * 0.1); // Small XP for trying
  } else {
    // Draw - return bet
    payout = betAmount;
    xpEarned = Math.floor(baseXp[difficulty] * 0.3);
  }

  return {
    matchId,
    result,
    difficulty,
    timeControl,
    betAmount,
    payout,
    xpEarned,
    winsEarned,
    isFarming,
    farmingPenalty,
  };
}

/**
 * Calculate PvP match result
 */
export function calculatePvpMatchResult(
  matchId: string,
  result: 'win' | 'loss' | 'draw',
  timeControl: TimeControl,
  stakeAmount: number,
  _playerLevel: number, // Reserved for future rank-based bonuses
  streakData: StreakData
): PvpMatchResult {
  const totalPot = stakeAmount * 2; // Both players stake
  const timeMultipliers = getTimeControlMultipliers(timeControl);

  let payout = 0;
  let burnAmount = 0;
  let xpEarned = 0;

  const baseXp = 100;

  if (result === 'win') {
    payout = getPvpWinPayout(totalPot);
    burnAmount = getPvpBurnAmount(totalPot);
    xpEarned = baseXp;

    // Apply streak bonus to XP only (not coins for PvP)
    const streakBonus = calculateStreakBonus(streakData);
    xpEarned = Math.floor(xpEarned * (1 + streakBonus));
  } else if (result === 'loss') {
    payout = 0;
    burnAmount = 0;
    xpEarned = Math.floor(baseXp * 0.2);

    // Apply loss protection
    if (hasLossProtection(streakData)) {
      payout = Math.floor(stakeAmount * 0.25); // Get 25% back
    }
  } else {
    // Draw
    payout = getPvpDrawRefund(stakeAmount);
    burnAmount = Math.floor(stakeAmount * PVP_DRAW_BURN_RATE);
    xpEarned = Math.floor(baseXp * 0.5);
  }

  // Apply time control multipliers
  xpEarned = Math.floor(xpEarned * timeMultipliers.xpMultiplier);

  return {
    matchId,
    result,
    timeControl,
    stakeAmount,
    totalPot,
    payout,
    burnAmount,
    xpEarned,
  };
}

// ---- WALLET OPERATIONS ----

/**
 * Create new wallet
 */
export function createWallet(initialBalance: number = 0): Wallet {
  const transactions: Transaction[] = [];

  if (initialBalance > 0) {
    transactions.push({
      id: crypto.randomUUID(),
      type: 'admin_adjustment',
      amount: initialBalance,
      balance: initialBalance,
      timestamp: Date.now(),
      description: 'Welcome bonus',
    });
  }

  return {
    balance: initialBalance,
    lockedBalance: 0,
    totalEarned: initialBalance,
    totalSpent: 0,
    totalBurned: 0,
    transactions,
  };
}

/**
 * Lock funds for match
 */
export function lockFunds(wallet: Wallet, amount: number): Wallet | null {
  if (wallet.balance < amount) {
    return null; // Insufficient funds
  }

  return {
    ...wallet,
    balance: wallet.balance - amount,
    lockedBalance: wallet.lockedBalance + amount,
  };
}

/**
 * Unlock funds (for cancellation)
 */
export function unlockFunds(wallet: Wallet, amount: number): Wallet {
  return {
    ...wallet,
    balance: wallet.balance + amount,
    lockedBalance: Math.max(0, wallet.lockedBalance - amount),
  };
}

/**
 * Process transaction
 */
export function processTransaction(
  wallet: Wallet,
  type: TransactionType,
  amount: number,
  matchId?: string,
  description?: string
): Wallet {
  const newBalance = wallet.balance + amount;

  const transaction: Transaction = {
    id: crypto.randomUUID(),
    type,
    amount,
    balance: newBalance,
    timestamp: Date.now(),
    matchId,
    description: description || getDefaultDescription(type, amount),
  };

  return {
    ...wallet,
    balance: newBalance,
    lockedBalance: type.includes('bet') ? wallet.lockedBalance :
      Math.max(0, wallet.lockedBalance - Math.abs(amount)),
    totalEarned: amount > 0 ? wallet.totalEarned + amount : wallet.totalEarned,
    totalSpent: amount < 0 ? wallet.totalSpent + Math.abs(amount) : wallet.totalSpent,
    totalBurned: type === 'burn' ? wallet.totalBurned + Math.abs(amount) : wallet.totalBurned,
    transactions: [transaction, ...wallet.transactions].slice(0, 100), // Keep last 100
  };
}

function getDefaultDescription(type: TransactionType, amount: number): string {
  const descriptions: Record<TransactionType, string> = {
    'level_up_reward': `Level up reward: +${amount} coins`,
    'gift_reward': `Gift reward: +${amount} coins`,
    'pve_bet': `PvE match entry: ${amount} coins`,
    'pve_win': `PvE win: +${amount} coins`,
    'pve_loss': 'PvE loss',
    'pvp_bet': `PvP stake: ${amount} coins`,
    'pvp_win': `PvP win: +${amount} coins`,
    'pvp_loss': 'PvP loss',
    'pvp_draw_refund': `PvP draw refund: +${amount} coins`,
    'daily_bonus': `Daily bonus: +${amount} coins`,
    'streak_bonus': `Streak bonus: +${amount} coins`,
    'season_reward': `Season reward: +${amount} coins`,
    'admin_adjustment': `Balance adjustment: ${amount > 0 ? '+' : ''}${amount} coins`,
    'burn': `Coins burned: ${Math.abs(amount)} coins`,
    'puzzle_reward': `Puzzle reward: +${amount} coins`,
    'ad_reward': `Ad reward: +${amount} coins`,
    'signup_reward': `Signup reward: +${amount} coins`,
    'subscription': `Premium subscription: ${amount} coins`,
  };
  return descriptions[type];
}

/**
 * Check if player can afford bet
 */
export function canAffordBet(wallet: Wallet, amount: number): boolean {
  return wallet.balance >= amount;
}
