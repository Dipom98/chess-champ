import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, Move, PieceColor } from '@/chess/types';
import { createInitialGameState, makeMove, getAllLegalMoves, getBestMove } from '@/chess/logic';
import { 
  RankName, Wallet, StreakData, SeasonStats, Season,
  TimeControl, AIDifficulty, Gender, Country
} from '@/systems/types';
import { 
  calculateLevelProgress, getRankFromLevel,
  checkLevelUp, getAIDepth, migrateRatingToLevel
} from '@/systems/progression';
import {
  createWallet, lockFunds, processTransaction,
  getPveEntryCost, calculatePveMatchResult, calculatePvpMatchResult,
  getLevelUpReward, generateGiftReward, updateStreakData, canAffordBet
} from '@/systems/economy';
import { TransactionType } from '@/systems/types';
import { createSeason, createSeasonStats, updateSeasonStats, isSeasonEnded, transitionSeason } from '@/systems/seasons';
import { getDefaultCountry, getDefaultAvatar } from '@/systems/countries';

export type GameMode = 'classic' | 'rapid' | 'blitz' | 'bullet' | 'puzzle' | 'custom';

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  lastSeen?: string;
  level: number;
  rank: RankName;
  country: Country;
}

export interface GameHistory {
  id: string;
  opponent: string;
  opponentAvatar: string;
  result: 'win' | 'loss' | 'draw';
  mode: GameMode;
  date: string;
  moves: number;
  duration: string;
  coinsWon: number;
  xpEarned: number;
  timeControl: TimeControl;
  difficulty?: AIDifficulty;
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
  totalPveWins: number;
  currentLevelWins: number;
  winsRequiredForNextLevel: number;
  wallet: Wallet;
  streaks: StreakData;
  currentSeasonStats: SeasonStats | null;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  // Anti-farming tracking
  beginnerWins: number;
  giftClaimsToday: number;
  lastGiftClaimTime: number;
}

export type BoardTheme = 'classic' | 'wood' | 'ocean' | 'forest' | 'ice' | 'neon' | 'royal' | 'midnight' | 'marble' | 'diamond' | 'ruby' | 'emerald' | 'gold' | 'obsidian';

export interface Settings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showLegalMoves: boolean;
  autoQueen: boolean;
  boardTheme: BoardTheme;
  pieceStyle: 'standard' | 'neo' | 'alpha';
  notifications: boolean;
  darkMode: boolean;
  isPremium: boolean;
  premiumExpiry: number | null;
}

export interface BoardThemeConfig {
  name: string;
  light: string;
  dark: string;
  border: string;
  isPremium?: boolean;
}

export const BOARD_THEMES: Record<BoardTheme, BoardThemeConfig> = {
  classic: { name: 'Classic', light: 'bg-amber-100', dark: 'bg-amber-700', border: 'border-amber-800' },
  wood: { name: 'Wood', light: 'bg-orange-200', dark: 'bg-orange-800', border: 'border-orange-900' },
  ocean: { name: 'Ocean', light: 'bg-cyan-100', dark: 'bg-cyan-600', border: 'border-cyan-800' },
  forest: { name: 'Forest', light: 'bg-green-100', dark: 'bg-green-700', border: 'border-green-900' },
  ice: { name: 'Ice', light: 'bg-blue-50', dark: 'bg-blue-400', border: 'border-blue-600' },
  neon: { name: 'Neon', light: 'bg-fuchsia-200', dark: 'bg-purple-700', border: 'border-purple-500' },
  royal: { name: 'Royal', light: 'bg-yellow-100', dark: 'bg-indigo-700', border: 'border-indigo-900' },
  midnight: { name: 'Midnight', light: 'bg-slate-400', dark: 'bg-slate-800', border: 'border-slate-900' },
  marble: { name: 'Marble', light: 'bg-gray-100', dark: 'bg-gray-500', border: 'border-gray-700' },
  // Premium Themes
  diamond: { name: '💎 Diamond', light: 'bg-sky-100', dark: 'bg-sky-600', border: 'border-sky-400', isPremium: true },
  ruby: { name: '❤️ Ruby', light: 'bg-rose-100', dark: 'bg-rose-700', border: 'border-rose-500', isPremium: true },
  emerald: { name: '💚 Emerald', light: 'bg-emerald-100', dark: 'bg-emerald-700', border: 'border-emerald-500', isPremium: true },
  gold: { name: '🌟 Gold', light: 'bg-yellow-200', dark: 'bg-yellow-600', border: 'border-yellow-500', isPremium: true },
  obsidian: { name: '🖤 Obsidian', light: 'bg-zinc-300', dark: 'bg-zinc-900', border: 'border-zinc-700', isPremium: true },
};

export interface ActiveMatch {
  type: 'pve' | 'pvp';
  difficulty?: AIDifficulty;
  timeControl: TimeControl;
  betAmount: number;
  opponentId?: string;
  startTime: number;
}

export interface DailyRewardState {
  lastClaimDate: string | null;
  currentStreak: number;
  totalClaimed: number;
}

interface AppState {
  // User
  user: UserProfile;
  hasSeenWelcome: boolean;
  currentSeason: Season | null;
  dailyReward: DailyRewardState;
  
  // Game
  currentGame: GameState | null;
  gameMode: GameMode | null;
  isVsComputer: boolean;
  computerColor: PieceColor;
  computerDifficulty: AIDifficulty;
  timeControl: TimeControl;
  activeMatch: ActiveMatch | null;
  
  // Friends
  friends: Friend[];
  pendingInvites: string[];
  
  // History
  gameHistory: GameHistory[];
  
  // Settings
  settings: Settings;
  
  // Actions - User
  setHasSeenWelcome: (seen: boolean) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  updateProfile: (name: string, email: string, gender: Gender, country: Country, avatar: string) => void;
  migrateFromOldRating: (oldRating: number) => void;
  
  // Actions - Economy
  claimGift: () => { success: boolean; amount: number; reason?: string };
  canAffordMatch: (difficulty: AIDifficulty) => boolean;
  claimDailyReward: () => { success: boolean; amount: number; streak: number; reason?: string };
  canClaimDailyReward: () => boolean;
  addTransaction: (amount: number, type: TransactionType, description: string) => void;
  
  // Actions - Game
  startPveGame: (mode: GameMode, difficulty: AIDifficulty, timeControl: TimeControl, playerColor: PieceColor) => boolean;
  startPvpGame: (mode: GameMode, timeControl: TimeControl, stakeAmount: number, opponentId: string) => boolean;
  makeGameMove: (move: Move) => void;
  makeComputerMove: () => Promise<void>;
  resetGame: () => void;
  endGame: (result: 'win' | 'loss' | 'draw') => void;
  
  // Actions - Friends
  addFriend: (friend: Friend) => void;
  removeFriend: (id: string) => void;
  sendInvite: (friendId: string) => void;
  
  // Actions - Settings
  updateSettings: (updates: Partial<Settings>) => void;
  
  // Actions - Season
  checkSeasonTransition: () => void;
}

const createDefaultUser = (): UserProfile => {
  const levelProgress = calculateLevelProgress(0);
  const gender: Gender = 'prefer_not_to_say';
  
  return {
    id: crypto.randomUUID(),
    name: 'Player',
    email: '',
    gender,
    country: getDefaultCountry(),
    avatar: getDefaultAvatar(gender),
    level: 1,
    rank: 'Pawn',
    totalPveWins: 0,
    currentLevelWins: 0,
    winsRequiredForNextLevel: levelProgress.winsRequiredForNextLevel,
    wallet: createWallet(500),
    streaks: {
      currentWinStreak: 0,
      currentLossStreak: 0,
      longestWinStreak: 0,
      lastMatchResult: null,
      streakBonusMultiplier: 0,
    },
    currentSeasonStats: null,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    beginnerWins: 0,
    giftClaimsToday: 0,
    lastGiftClaimTime: 0,
  };
};

const defaultSettings: Settings = {
  soundEnabled: true,
  vibrationEnabled: true,
  showLegalMoves: true,
  autoQueen: false,
  boardTheme: 'classic',
  pieceStyle: 'standard',
  notifications: true,
  darkMode: true,
  isPremium: false,
  premiumExpiry: null,
};

const createDefaultFriends = (): Friend[] => [
  { id: '1', name: 'Magnus', avatar: '🧙‍♂️', online: true, level: 85, rank: 'Grandmaster', country: { code: 'NO', name: 'Norway', flag: '🇳🇴' } },
  { id: '2', name: 'Hikaru', avatar: '⚡', online: true, level: 78, rank: 'Master', country: { code: 'US', name: 'United States', flag: '🇺🇸' } },
  { id: '3', name: 'Anna', avatar: '👸', online: false, lastSeen: '2h ago', level: 45, rank: 'Squire', country: { code: 'UA', name: 'Ukraine', flag: '🇺🇦' } },
  { id: '4', name: 'Bobby', avatar: '🎩', online: false, lastSeen: '1d ago', level: 62, rank: 'Elite', country: { code: 'US', name: 'United States', flag: '🇺🇸' } },
  { id: '5', name: 'Garry', avatar: '🏆', online: true, level: 71, rank: 'Master', country: { code: 'RU', name: 'Russia', flag: '🇷🇺' } },
];

const defaultHistory: GameHistory[] = [
  { id: '1', opponent: 'Magnus', opponentAvatar: '🧙‍♂️', result: 'loss', mode: 'rapid', date: '2024-01-15', moves: 42, duration: '15:30', coinsWon: 0, xpEarned: 10, timeControl: 'rapid' },
  { id: '2', opponent: 'Computer (Easy)', opponentAvatar: '🤖', result: 'win', mode: 'classic', date: '2024-01-14', moves: 28, duration: '8:45', coinsWon: 18, xpEarned: 25, timeControl: 'unlimited', difficulty: 'beginner' },
  { id: '3', opponent: 'Hikaru', opponentAvatar: '⚡', result: 'draw', mode: 'blitz', date: '2024-01-13', moves: 65, duration: '5:00', coinsWon: 45, xpEarned: 50, timeControl: 'blitz' },
];

export const useGameStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: createDefaultUser(),
      hasSeenWelcome: false,
      currentSeason: createSeason(1),
      dailyReward: {
        lastClaimDate: null,
        currentStreak: 0,
        totalClaimed: 0,
      },
      currentGame: null,
      gameMode: null,
      isVsComputer: false,
      computerColor: 'black',
      computerDifficulty: 'intermediate',
      timeControl: 'rapid',
      activeMatch: null,
      friends: createDefaultFriends(),
      pendingInvites: [],
      gameHistory: defaultHistory,
      settings: defaultSettings,

      setHasSeenWelcome: (seen) => set({ hasSeenWelcome: seen }),
      
      updateUser: (updates) => set((state) => ({ 
        user: { ...state.user, ...updates } 
      })),

      updateProfile: (name, email, gender, country, avatar) => set((state) => ({
        user: {
          ...state.user,
          name,
          email,
          gender,
          country,
          avatar,
        }
      })),

      migrateFromOldRating: (oldRating: number) => set((state) => {
        const newLevel = migrateRatingToLevel(oldRating);
        const levelProgress = calculateLevelProgress(state.user.totalPveWins);
        const newRank = getRankFromLevel(newLevel);
        
        return {
          user: {
            ...state.user,
            level: newLevel,
            rank: newRank,
            currentLevelWins: levelProgress.currentLevelWins,
            winsRequiredForNextLevel: levelProgress.winsRequiredForNextLevel,
          }
        };
      }),

      claimGift: () => {
        const state = get();
        const result = generateGiftReward(
          state.user.giftClaimsToday,
          state.user.lastGiftClaimTime
        );
        
        if (!result.canClaim) {
          return { success: false, amount: 0, reason: result.reason };
        }
        
        set((state) => ({
          user: {
            ...state.user,
            wallet: processTransaction(
              state.user.wallet,
              'gift_reward',
              result.amount,
              undefined,
              `Gift reward: +${result.amount} coins`
            ),
            giftClaimsToday: state.user.giftClaimsToday + 1,
            lastGiftClaimTime: Date.now(),
          }
        }));
        
        return { success: true, amount: result.amount };
      },

      canAffordMatch: (difficulty: AIDifficulty) => {
        const state = get();
        const cost = getPveEntryCost(difficulty, state.user.level);
        return canAffordBet(state.user.wallet, cost);
      },

      canClaimDailyReward: () => {
        const state = get();
        const today = new Date().toDateString();
        return state.dailyReward.lastClaimDate !== today;
      },

      claimDailyReward: () => {
        const state = get();
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        // Check if already claimed today
        if (state.dailyReward.lastClaimDate === today) {
          return { success: false, amount: 0, streak: state.dailyReward.currentStreak, reason: 'Already claimed today!' };
        }
        
        // Calculate streak
        let newStreak = 1;
        if (state.dailyReward.lastClaimDate === yesterday) {
          newStreak = Math.min(state.dailyReward.currentStreak + 1, 7);
        }
        
        // Calculate reward based on streak (100 base + 50 per streak day, max 7)
        const baseReward = 100;
        const streakBonus = (newStreak - 1) * 50;
        const amount = baseReward + streakBonus;
        
        // Update wallet balance directly
        const currentWallet = state.user.wallet;
        const newBalance = currentWallet.balance + amount;
        
        const transaction = {
          id: crypto.randomUUID(),
          type: 'daily_bonus' as const,
          amount: amount,
          balance: newBalance,
          timestamp: Date.now(),
          description: `Daily reward (Day ${newStreak}): +${amount} coins`
        };
        
        set({
          dailyReward: {
            lastClaimDate: today,
            currentStreak: newStreak,
            totalClaimed: state.dailyReward.totalClaimed + amount,
          },
          user: {
            ...state.user,
            wallet: {
              ...currentWallet,
              balance: newBalance,
              totalEarned: currentWallet.totalEarned + amount,
              transactions: [transaction, ...currentWallet.transactions].slice(0, 100),
            },
          }
        });
        
        return { success: true, amount, streak: newStreak };
      },

      startPveGame: (mode, difficulty, timeControl, playerColor) => {
        const state = get();
        const betAmount = getPveEntryCost(difficulty, state.user.level);
        
        // Check if can afford
        if (!canAffordBet(state.user.wallet, betAmount)) {
          return false;
        }
        
        // Lock funds
        const lockedWallet = lockFunds(state.user.wallet, betAmount);
        if (!lockedWallet) return false;
        
        const gameState = createInitialGameState();
        const computerColor = playerColor === 'white' ? 'black' : 'white';
        
        set({
          currentGame: gameState,
          gameMode: mode,
          isVsComputer: true,
          computerColor,
          computerDifficulty: difficulty,
          timeControl,
          activeMatch: {
            type: 'pve',
            difficulty,
            timeControl,
            betAmount,
            startTime: Date.now(),
          },
          user: {
            ...state.user,
            wallet: lockedWallet,
          }
        });
        
        return true;
      },

      startPvpGame: (mode, timeControl, stakeAmount, opponentId) => {
        const state = get();
        
        // For local games (no stake), skip wallet check
        if (stakeAmount > 0) {
          // Check if can afford
          if (!canAffordBet(state.user.wallet, stakeAmount)) {
            return false;
          }
          
          // Lock funds
          const lockedWallet = lockFunds(state.user.wallet, stakeAmount);
          if (!lockedWallet) return false;
          
          const gameState = createInitialGameState();
          
          set({
            currentGame: gameState,
            gameMode: mode,
            isVsComputer: false,
            computerColor: 'black',
            timeControl,
            activeMatch: {
              type: 'pvp',
              timeControl,
              betAmount: stakeAmount,
              opponentId,
              startTime: Date.now(),
            },
            user: {
              ...state.user,
              wallet: lockedWallet,
            }
          });
        } else {
          // Local two-player game with no stake
          const gameState = createInitialGameState();
          
          set({
            currentGame: gameState,
            gameMode: mode,
            isVsComputer: false,
            computerColor: 'black',
            timeControl,
            activeMatch: {
              type: 'pvp',
              timeControl,
              betAmount: 0,
              opponentId,
              startTime: Date.now(),
            },
          });
        }
        
        return true;
      },

      makeGameMove: (move) => set((state) => {
        if (!state.currentGame) return state;
        const newGameState = makeMove(state.currentGame, move);
        return { currentGame: newGameState };
      }),

      makeComputerMove: async () => {
        const state = get();
        if (!state.currentGame) return;
        
        const moves = getAllLegalMoves(state.currentGame);
        if (moves.length === 0) return;

        // Faster delay for better UX (200ms instead of 500ms)
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const depth = getAIDepth(state.user.level, state.computerDifficulty);
        const bestMove = getBestMove(state.currentGame, depth);
        if (bestMove) {
          const newGameState = makeMove(state.currentGame, bestMove);
          set({ currentGame: newGameState });
        }
      },

      resetGame: () => {
        const state = get();
        if (state.gameMode) {
          const newGameState = createInitialGameState();
          set({ currentGame: newGameState });
        }
      },

      endGame: (result) => set((state) => {
        const { activeMatch, user, currentSeason } = state;
        
        if (!activeMatch) {
          return state;
        }
        
        let updatedWallet = { ...user.wallet };
        let coinsWon = 0;
        let xpEarned = 0;
        let winsEarned = 0;
        const betAmount = activeMatch.betAmount;
        
        // First, unlock the locked funds (they were locked when game started)
        updatedWallet = {
          ...updatedWallet,
          lockedBalance: Math.max(0, updatedWallet.lockedBalance - betAmount),
        };
        
        // Calculate match result
        if (activeMatch.type === 'pve' && activeMatch.difficulty) {
          const pveResult = calculatePveMatchResult(
            crypto.randomUUID(),
            result,
            activeMatch.difficulty,
            activeMatch.timeControl,
            betAmount,
            user.level,
            user.streaks,
            user.beginnerWins
          );
          
          coinsWon = pveResult.payout;
          xpEarned = pveResult.xpEarned;
          winsEarned = pveResult.winsEarned;
          
          // Calculate net result (payout - bet = profit/loss)
          // Win: Get payout (180% of bet), so profit = payout - bet
          // Loss: Get 0, so loss = -bet (but bet was already deducted when locked)
          // Draw: Get bet back
          
          let netChange = 0;
          let description = '';
          
          if (result === 'win') {
            netChange = coinsWon; // Full payout including original bet
            description = `PvE Win: +${coinsWon} coins (180% of ${betAmount})`;
          } else if (result === 'loss') {
            netChange = 0; // Bet is lost, nothing returned
            description = `PvE Loss: -${betAmount} coins`;
          } else {
            netChange = betAmount; // Draw - return bet
            description = `PvE Draw: ${betAmount} coins returned`;
          }
          
          // Add the net change to wallet
          const newBalance = updatedWallet.balance + netChange;
          const transaction = {
            id: crypto.randomUUID(),
            type: (result === 'win' ? 'pve_win' : result === 'loss' ? 'pve_loss' : 'pve_win') as TransactionType,
            amount: result === 'loss' ? -betAmount : netChange,
            balance: newBalance,
            timestamp: Date.now(),
            description,
          };
          
          updatedWallet = {
            ...updatedWallet,
            balance: newBalance,
            totalEarned: result === 'win' ? updatedWallet.totalEarned + coinsWon : updatedWallet.totalEarned,
            totalSpent: result === 'loss' ? updatedWallet.totalSpent + betAmount : updatedWallet.totalSpent,
            transactions: [transaction, ...updatedWallet.transactions].slice(0, 100),
          };
          
        } else if (activeMatch.type === 'pvp' && betAmount > 0) {
          const pvpResult = calculatePvpMatchResult(
            crypto.randomUUID(),
            result,
            activeMatch.timeControl,
            betAmount,
            user.level,
            user.streaks
          );
          
          coinsWon = pvpResult.payout;
          xpEarned = pvpResult.xpEarned;
          
          let netChange = 0;
          let description = '';
          
          if (result === 'win') {
            netChange = coinsWon;
            description = `PvP Win: +${coinsWon} coins`;
          } else if (result === 'loss') {
            netChange = 0;
            description = `PvP Loss: -${betAmount} coins`;
          } else {
            netChange = pvpResult.payout;
            description = `PvP Draw: ${netChange} coins refunded (90%)`;
          }
          
          const newBalance = updatedWallet.balance + netChange;
          const transactionType = (result === 'win' ? 'pvp_win' : 
                                  result === 'draw' ? 'pvp_draw_refund' : 'pvp_loss') as TransactionType;
          
          const transaction = {
            id: crypto.randomUUID(),
            type: transactionType,
            amount: result === 'loss' ? -betAmount : netChange,
            balance: newBalance,
            timestamp: Date.now(),
            description,
          };
          
          updatedWallet = {
            ...updatedWallet,
            balance: newBalance,
            totalEarned: result !== 'loss' ? updatedWallet.totalEarned + netChange : updatedWallet.totalEarned,
            totalSpent: result === 'loss' ? updatedWallet.totalSpent + betAmount : updatedWallet.totalSpent,
            transactions: [transaction, ...updatedWallet.transactions].slice(0, 100),
          };
        }
        
        // Update streaks
        const updatedStreaks = updateStreakData(user.streaks, result);
        
        // Update level progress
        const newTotalPveWins = user.totalPveWins + winsEarned;
        const levelProgress = calculateLevelProgress(newTotalPveWins);
        const levelUp = checkLevelUp(user.totalPveWins, newTotalPveWins);
        
        // Level up reward
        if (levelUp.leveledUp) {
          for (let lvl = levelUp.oldLevel + 1; lvl <= levelUp.newLevel; lvl++) {
            const reward = getLevelUpReward(lvl);
            updatedWallet = processTransaction(
              updatedWallet,
              'level_up_reward',
              reward,
              undefined,
              `Level ${lvl} reward: +${reward} coins`
            );
          }
        }
        
        // Update season stats
        let updatedSeasonStats = user.currentSeasonStats;
        if (currentSeason && updatedSeasonStats) {
          updatedSeasonStats = updateSeasonStats(
            updatedSeasonStats,
            result,
            coinsWon,
            xpEarned,
            updatedStreaks.currentWinStreak
          );
        } else if (currentSeason) {
          updatedSeasonStats = createSeasonStats(currentSeason, user.id);
          updatedSeasonStats = updateSeasonStats(
            updatedSeasonStats,
            result,
            coinsWon,
            xpEarned,
            updatedStreaks.currentWinStreak
          );
        }
        
        // Create history entry
        const difficultyName = activeMatch.difficulty ? 
          activeMatch.difficulty.charAt(0).toUpperCase() + activeMatch.difficulty.slice(1) : '';
        
        const newHistory: GameHistory = {
          id: Date.now().toString(),
          opponent: activeMatch.type === 'pve' ? 
            `Computer (${difficultyName})` : 
            state.friends.find(f => f.id === activeMatch.opponentId)?.name || 'Player 2',
          opponentAvatar: activeMatch.type === 'pve' ? '🤖' : '👤',
          result,
          mode: state.gameMode || 'classic',
          date: new Date().toISOString().split('T')[0],
          moves: state.currentGame?.moveHistory.length || 0,
          duration: formatDuration(Date.now() - activeMatch.startTime),
          coinsWon: Math.max(0, coinsWon - activeMatch.betAmount),
          xpEarned,
          timeControl: activeMatch.timeControl,
          difficulty: activeMatch.difficulty,
        };

        return {
          gameHistory: [newHistory, ...state.gameHistory].slice(0, 100),
          user: {
            ...user,
            wallet: updatedWallet,
            streaks: updatedStreaks,
            level: levelProgress.level,
            rank: getRankFromLevel(levelProgress.level),
            totalPveWins: newTotalPveWins,
            currentLevelWins: levelProgress.currentLevelWins,
            winsRequiredForNextLevel: levelProgress.winsRequiredForNextLevel,
            currentSeasonStats: updatedSeasonStats,
            gamesPlayed: user.gamesPlayed + 1,
            wins: user.wins + (result === 'win' ? 1 : 0),
            losses: user.losses + (result === 'loss' ? 1 : 0),
            draws: user.draws + (result === 'draw' ? 1 : 0),
            beginnerWins: activeMatch.difficulty === 'beginner' && result === 'win' ? 
              user.beginnerWins + 1 : user.beginnerWins,
          },
          currentGame: null,
          gameMode: null,
          activeMatch: null,
        };
      }),

      addFriend: (friend) => set((state) => ({
        friends: [...state.friends, friend],
      })),

      removeFriend: (id) => set((state) => ({
        friends: state.friends.filter(f => f.id !== id),
      })),

      sendInvite: (friendId) => set((state) => ({
        pendingInvites: [...state.pendingInvites, friendId],
      })),

      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates },
      })),

      checkSeasonTransition: () => {
        const state = get();
        if (state.currentSeason && isSeasonEnded(state.currentSeason)) {
          const { newSeason } = transitionSeason(state.currentSeason);
          
          // Archive current stats and create new ones
          const newSeasonStats = createSeasonStats(newSeason, state.user.id);
          
          set({
            currentSeason: newSeason,
            user: {
              ...state.user,
              currentSeasonStats: newSeasonStats,
            }
          });
        }
      },

      addTransaction: (amount, type, description) => {
        set((state) => {
          const currentWallet = state.user.wallet;
          const newBalance = currentWallet.balance + amount;
          
          const transaction = {
            id: crypto.randomUUID(),
            type,
            amount,
            balance: newBalance,
            timestamp: Date.now(),
            description,
          };
          
          return {
            user: {
              ...state.user,
              wallet: {
                ...currentWallet,
                balance: newBalance,
                totalEarned: amount > 0 ? currentWallet.totalEarned + amount : currentWallet.totalEarned,
                transactions: [transaction, ...currentWallet.transactions].slice(0, 100),
              },
            },
          };
        });
      },
    }),
    {
      name: 'chess-master-storage',
      partialize: (state) => ({
        user: state.user,
        hasSeenWelcome: state.hasSeenWelcome,
        currentSeason: state.currentSeason,
        dailyReward: state.dailyReward,
        friends: state.friends,
        gameHistory: state.gameHistory,
        settings: state.settings,
      }),
    }
  )
);

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
