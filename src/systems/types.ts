// ============================================
// SYSTEM TYPES & INTERFACES
// ============================================

// ---- LEVEL & RANK SYSTEM ----
export type RankName = 
  | 'Pawn' | 'Knight' | 'Bishop' | 'Rook' | 'Squire' 
  | 'Champion' | 'Elite' | 'Master' | 'Grandmaster' | 'Legend';

export interface RankInfo {
  name: RankName;
  minLevel: number;
  maxLevel: number;
  icon: string;
  color: string;
  gradient: string;
  aiDepthBonus: number;
  coinMultiplier: number;
}

export interface LevelProgress {
  level: number;
  currentLevelWins: number;
  winsRequiredForNextLevel: number;
  totalPveWins: number;
  xp: number;
  totalXp: number;
}

// ---- COIN ECONOMY ----
export type TransactionType = 
  | 'level_up_reward' 
  | 'gift_reward' 
  | 'pve_bet' 
  | 'pve_win' 
  | 'pve_loss'
  | 'pvp_bet' 
  | 'pvp_win' 
  | 'pvp_loss' 
  | 'pvp_draw_refund'
  | 'daily_bonus'
  | 'streak_bonus'
  | 'season_reward'
  | 'admin_adjustment'
  | 'burn'
  | 'puzzle_reward'
  | 'subscription';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  balance: number;
  timestamp: number;
  matchId?: string;
  description: string;
}

export interface Wallet {
  balance: number;
  lockedBalance: number; // During active matches
  totalEarned: number;
  totalSpent: number;
  totalBurned: number;
  transactions: Transaction[];
}

// ---- TIME CONTROLS ----
export type TimeControl = 'bullet' | 'blitz' | 'rapid' | 'classical' | 'unlimited';

export interface TimeControlConfig {
  id: TimeControl;
  name: string;
  baseTime: number; // seconds
  increment: number; // seconds per move
  xpMultiplier: number;
  coinMultiplier: number;
}

// ---- AI DIFFICULTY ----
export type AIDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'engine';

export interface AIDifficultyConfig {
  id: AIDifficulty;
  name: string;
  depth: number;
  entryCostBase: number;
  winRewardMultiplier: number;
  xpReward: number;
  minLevel: number;
}

// ---- PVE MATCH ----
export interface PveMatchConfig {
  difficulty: AIDifficulty;
  timeControl: TimeControl;
  betAmount: number;
  playerColor: 'white' | 'black';
}

export interface PveMatchResult {
  matchId: string;
  result: 'win' | 'loss' | 'draw';
  difficulty: AIDifficulty;
  timeControl: TimeControl;
  betAmount: number;
  payout: number;
  xpEarned: number;
  winsEarned: number;
  isFarming: boolean;
  farmingPenalty: number;
}

// ---- PVP MATCH ----
export interface PvpMatchConfig {
  opponentId: string;
  timeControl: TimeControl;
  stakeAmount: number;
}

export interface PvpMatchResult {
  matchId: string;
  result: 'win' | 'loss' | 'draw';
  timeControl: TimeControl;
  stakeAmount: number;
  totalPot: number;
  payout: number;
  burnAmount: number;
  xpEarned: number;
}

// ---- STREAKS ----
export interface StreakData {
  currentWinStreak: number;
  currentLossStreak: number;
  longestWinStreak: number;
  lastMatchResult: 'win' | 'loss' | 'draw' | null;
  streakBonusMultiplier: number; // 0-0.25 (0-25%)
}

// ---- ANTI-CHEAT ----
export type CheatFlag = 
  | 'engine_pattern' 
  | 'sudden_spike' 
  | 'suspicious_accuracy'
  | 'move_timing'
  | 'collusion_suspected';

export interface AntiCheatData {
  flags: CheatFlag[];
  flagCount: number;
  isFrozen: boolean;
  lastReviewDate: number | null;
  accuracy: number[];
  suspiciousMatches: string[];
}

// ---- GAME ANALYSIS ----
export interface MoveAnalysis {
  moveNumber: number;
  move: string;
  evaluation: number;
  bestMove: string;
  category: 'brilliant' | 'great' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
}

export interface GameAnalysis {
  matchId: string;
  playerAccuracy: number;
  blunders: number;
  mistakes: number;
  inaccuracies: number;
  bestMoves: number;
  topMistakes: MoveAnalysis[];
  improvementTip: string;
}

// ---- SEASONS ----
export interface SeasonStats {
  seasonId: string;
  seasonNumber: number;
  startDate: number;
  endDate: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  coinsEarned: number;
  xpEarned: number;
  highestStreak: number;
  rank: number; // Position in leaderboard
}

export interface Season {
  id: string;
  number: number;
  name: string;
  startDate: number;
  endDate: number;
  isActive: boolean;
  rewards: SeasonReward[];
}

export interface SeasonReward {
  rankRange: [number, number]; // e.g., [1, 10] for top 10
  coins: number;
  badge: string;
  badgeColor: string;
}

// ---- PROFILE ----
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface Country {
  code: string;
  name: string;
  flag: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  gender: Gender;
  country: Country;
  avatar: string;
  level: number;
  rank: RankName;
  levelProgress: LevelProgress;
  wallet: Wallet;
  streaks: StreakData;
  antiCheat: AntiCheatData;
  currentSeasonStats: SeasonStats | null;
  pastSeasons: SeasonStats[];
  createdAt: number;
  lastLoginAt: number;
}

// ---- ANTI-ABUSE ----
export interface AbuseDetection {
  pveGamesLast24h: number;
  pveWinsOnLowDifficulty: number;
  pvpGamesWithSameOpponent: Map<string, number>;
  giftClaimsToday: number;
  lastGiftClaimTime: number;
  accountAge: number;
  ipAddresses: string[];
  deviceIds: string[];
}

// ---- MATCH RECORDS ----
export interface MatchRecord {
  id: string;
  type: 'pve' | 'pvp';
  playerId: string;
  opponentId: string | null; // null for PvE
  result: 'win' | 'loss' | 'draw' | 'in_progress' | 'abandoned';
  timeControl: TimeControl;
  difficulty?: AIDifficulty;
  playerColor: 'white' | 'black';
  moves: string[];
  startTime: number;
  endTime: number | null;
  betAmount: number;
  payout: number;
  xpEarned: number;
  analysis?: GameAnalysis;
  isFlagged: boolean;
  flagReasons: CheatFlag[];
}

// ---- DATABASE SCHEMA ----
export interface DatabaseSchema {
  users: UserProfile[];
  matches: MatchRecord[];
  seasons: Season[];
  transactions: Transaction[];
  antiCheatLogs: {
    matchId: string;
    playerId: string;
    flags: CheatFlag[];
    timestamp: number;
  }[];
}
