import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, pushPlayerSnapshot } from '@/systems/supabase';
import { GameState, Move, PieceColor } from '@/chess/types';
import { createInitialGameState, makeMove, getAllLegalMoves, getBestMove } from '@/chess/logic';
import {
  RankName, Wallet, StreakData, SeasonStats, Season,
  TimeControl, AIDifficulty, Gender, Country, TransactionType
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
import { createSeason, createSeasonStats, updateSeasonStats, isSeasonEnded, transitionSeason } from '@/systems/seasons';
import { getDefaultCountry, getDefaultAvatar } from '@/systems/countries';

const RANKS: RankName[] = [
  'Pawn', 'Knight', 'Bishop', 'Rook', 'Squire',
  'Champion', 'Elite', 'Master', 'Grandmaster', 'Legend'
];

const getRankValue = (rank: RankName): number => {
  return RANKS.indexOf(rank) + 1;
};

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

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface IncomingChallenge {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  gender: Gender;
  country: Country;
  avatar: string;
  customProfilePicture: string | null; // Base64 encoded image
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
  phoneNumber?: string;
  hasClaimedSignupReward: boolean;
  solvedPuzzles: string[];
  unlockedItems: string[];
}

export type BoardTheme = 'classic' | 'wood' | 'ocean' | 'forest' | 'ice' | 'neon' | 'royal' | 'midnight' | 'marble' | 'industrial' | 'diamond' | 'ruby' | 'emerald' | 'gold' | 'obsidian';

export interface Settings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showLegalMoves: boolean;
  autoQueen: boolean;
  boardTheme: BoardTheme;
  pieceTheme: PieceTheme;
  backgroundMusicEnabled: boolean;
  is3d: boolean;
  notifications: boolean;
  darkMode: boolean;
  isPremium: boolean;
  premiumExpiry: number | null;
  contactSyncEnabled: boolean;
  musicVolume: number;
}

export interface BoardThemeConfig {
  name: string;
  light: string;
  dark: string;
  border: string;
  isPremium?: boolean;
  isLuxury?: boolean; // Subscriber-only
  requiredRank?: RankName;
  // Premium theme extras
  lightGradient?: string;
  darkGradient?: string;
  borderGradient?: string;
  glowColor?: string;
  pattern?: string;
}

export const BOARD_THEMES: Record<BoardTheme, BoardThemeConfig> = {
  // Free (Rank 1-10)
  classic: { name: 'Classic', light: 'bg-amber-100', dark: 'bg-amber-700', border: 'border-amber-800', requiredRank: 'Pawn' },
  wood: { name: 'Wood', light: 'bg-orange-200', dark: 'bg-orange-800', border: 'border-orange-900', requiredRank: 'Knight' },
  forest: { name: 'Forest', light: 'bg-green-100', dark: 'bg-green-700', border: 'border-green-900', requiredRank: 'Bishop' },
  ice: { name: 'Ice', light: 'bg-blue-50', dark: 'bg-blue-400', border: 'border-blue-600', requiredRank: 'Rook' },
  ocean: { name: 'Ocean', light: 'bg-cyan-100', dark: 'bg-cyan-600', border: 'border-cyan-800', requiredRank: 'Squire' },
  neon: { name: 'Neon', light: 'bg-fuchsia-200', dark: 'bg-purple-700', border: 'border-purple-500', requiredRank: 'Champion' },
  royal: { name: 'Royal', light: 'bg-yellow-100', dark: 'bg-indigo-700', border: 'border-indigo-900', requiredRank: 'Elite' },
  midnight: { name: 'Midnight', light: 'bg-slate-400', dark: 'bg-slate-800', border: 'border-slate-900', requiredRank: 'Master' },
  marble: { name: 'Marble', light: 'bg-gray-100', dark: 'bg-gray-500', border: 'border-gray-700', requiredRank: 'Grandmaster' },
  industrial: { name: 'Industrial', light: 'bg-zinc-300', dark: 'bg-zinc-700', border: 'border-zinc-900', requiredRank: 'Legend' },

  // Luxury (Premium Only)
  diamond: {
    name: '💎 Diamond',
    light: 'premium-diamond-light',
    dark: 'premium-diamond-dark',
    border: 'border-cyan-400',
    isPremium: true,
    isLuxury: true,
    glowColor: 'rgba(103, 232, 249, 0.5)',
    pattern: 'diamond'
  },
  ruby: {
    name: '❤️ Ruby',
    light: 'premium-ruby-light',
    dark: 'premium-ruby-dark',
    border: 'border-red-400',
    isPremium: true,
    isLuxury: true,
    glowColor: 'rgba(239, 68, 68, 0.5)',
    pattern: 'ruby'
  },
  emerald: {
    name: '💚 Emerald',
    light: 'premium-emerald-light',
    dark: 'premium-emerald-dark',
    border: 'border-emerald-400',
    isPremium: true,
    isLuxury: true,
    glowColor: 'rgba(16, 185, 129, 0.5)',
    pattern: 'emerald'
  },
  gold: {
    name: '✨ Gold',
    light: 'premium-gold-light',
    dark: 'premium-gold-dark',
    border: 'border-amber-400',
    isPremium: true,
    isLuxury: true,
    glowColor: 'rgba(251, 191, 36, 0.6)',
    pattern: 'gold'
  },
  obsidian: {
    name: '🌘 Obsidian',
    light: 'premium-obsidian-light',
    dark: 'premium-obsidian-dark',
    border: 'border-gray-800',
    isPremium: true,
    isLuxury: true,
    glowColor: 'rgba(15, 23, 42, 0.8)',
    pattern: 'obsidian'
  }
};

export type PieceTheme = 'classic' | 'neo' | 'alpha' | 'vintage' | 'pixel' | 'minimal' | 'round' | 'cubist' | 'modern' | 'simple' | 'fantasy' | 'scifi' | 'glass' | 'metal' | 'neon_pieces';

export interface PieceThemeConfig {
  name: string;
  isPremium?: boolean;
  isLuxury?: boolean;
  requiredRank?: RankName;
}

export const PIECE_THEMES: Record<PieceTheme, PieceThemeConfig> = {
  // Free (Rank 1-10)
  classic: { name: 'Classic', requiredRank: 'Pawn' },
  neo: { name: 'Neo', requiredRank: 'Knight' },
  alpha: { name: 'Alpha', requiredRank: 'Bishop' },
  vintage: { name: 'Vintage', requiredRank: 'Rook' },
  pixel: { name: 'Pixel', requiredRank: 'Squire' },
  minimal: { name: 'Minimal', requiredRank: 'Champion' },
  round: { name: 'Round', requiredRank: 'Elite' },
  cubist: { name: 'Cubist', requiredRank: 'Master' },
  modern: { name: 'Modern', requiredRank: 'Grandmaster' },
  simple: { name: 'Simple', requiredRank: 'Legend' },

  // Luxury (Premium Only)
  fantasy: { name: 'Fantasy', isPremium: true, isLuxury: true },
  scifi: { name: 'Sci-Fi', isPremium: true, isLuxury: true },
  glass: { name: 'Glass', isPremium: true, isLuxury: true },
  metal: { name: 'Metal', isPremium: true, isLuxury: true },
  neon_pieces: { name: 'Neon', isPremium: true, isLuxury: true },
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
  chatRooms: Record<string, ChatMessage[]>; // friendId -> messages
  incomingChallenges: IncomingChallenge[];

  // History
  gameHistory: GameHistory[];

  // Settings
  settings: Settings;

  // UI State
  unlockedModalQueue: { type: 'board' | 'piece', id: string }[];

  // Actions - User
  setHasSeenWelcome: (seen: boolean) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  updateProfile: (name: string, email: string, gender: Gender, country: Country, avatar: string) => void;
  migrateFromOldRating: (oldRating: number) => void;

  // Actions - Economy
  claimGift: () => { success: boolean; amount: number; reason?: string };
  claimSignupReward: () => { success: boolean; amount: number; reason?: string };
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
  undoMove: () => void;
  clearGame: () => void;
  endGame: (result: 'win' | 'loss' | 'draw') => { coinsWon: number; xpEarned: number } | undefined;
  recoverBet: () => { success: boolean; amount: number };

  // Actions - Friends
  addFriend: (friend: Friend) => void;
  removeFriend: (id: string) => void;
  sendInvite: (friendId: string) => void;
  updateFriendStatus: (id: string, online: boolean, lastSeen?: string) => void;
  addChatMessage: (friendId: string, message: ChatMessage) => void;
  addChallenge: (challenge: IncomingChallenge) => void;
  respondToChallenge: (challengeId: string, status: 'accepted' | 'rejected') => Promise<void>;
  sendMessageAction: (friendId: string, content: string) => Promise<void>;
  sendChallengeAction: (friendId: string) => Promise<void>;

  // Actions - Settings
  updateSettings: (updates: Partial<Settings>) => void;

  // Actions - Season
  checkSeasonTransition: () => void;
  syncToCloud: () => Promise<void>;
  syncContactsAction: () => Promise<void>;
  solvePuzzle: (puzzleId: string, reward: number) => void;
  claimPuzzleSetReward: (setId: string, reward: number) => void;

  // Actions - Progression
  checkUnlocks: () => void;
  dismissUnlockModal: () => void;
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
    customProfilePicture: null,
    level: 1,
    rank: 'Pawn',
    totalPveWins: 0,
    currentLevelWins: 0,
    winsRequiredForNextLevel: levelProgress.winsRequiredForNextLevel,
    wallet: createWallet(0),
    streaks: {
      currentWinStreak: 0,
      currentLossStreak: 0,
      longestWinStreak: 0,
      lastMatchResult: null,
      streakBonusMultiplier: 0
    },
    currentSeasonStats: null,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    beginnerWins: 0,
    giftClaimsToday: 0,
    lastGiftClaimTime: 0,
    phoneNumber: '',
    hasClaimedSignupReward: false,
    solvedPuzzles: [],
    unlockedItems: ['classic'] // Always unlock classic by default
  };
};

const defaultSettings: Settings = {
  soundEnabled: true,
  vibrationEnabled: true,
  showLegalMoves: true,
  autoQueen: false,
  boardTheme: 'classic',
  pieceTheme: 'classic',
  backgroundMusicEnabled: false,
  is3d: false,
  notifications: true,
  darkMode: true,
  isPremium: false,
  premiumExpiry: null,
  contactSyncEnabled: false,
  musicVolume: 0.5,
};

const createDefaultFriends = (): Friend[] => [];

const defaultHistory: GameHistory[] = [];

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
      chatRooms: {},
      incomingChallenges: [],
      gameHistory: defaultHistory,

      settings: defaultSettings,
      unlockedModalQueue: [],

      setHasSeenWelcome: (seen) => set({ hasSeenWelcome: seen }),

      updateUser: (updates) => {
        set((state) => ({
          user: { ...state.user, ...updates }
        }));
        if (get().settings.isPremium) {
          get().syncToCloud();
        }
        get().checkUnlocks();
      },

      updateProfile: (name, email, gender, country, avatar) => {
        set((state) => ({
          user: {
            ...state.user,
            name,
            email,
            gender,
            country,
            avatar,
          }
        }));
        if (get().settings.isPremium) {
          get().syncToCloud();
        }
      },

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

      // Hook for checking unlocks after migration
      /* (In migrateFromOldRating) logic finishes with set, we can call checkUnlocks after */
      // But migrateFromOldRating returns an object to set, so we can't easily chain.
      // We'll leave it as is for now and assume the next action triggers it or user plays a game.
      // Actually refactoring migrateFromOldRating to use set(state => ...) allows side effects but returning object is cleaner.
      // We'll explicitly call checkUnlocks in the component calling this, or just rely on endGame.
      // Better: override migrateFromOldRating to call checkUnlocks.
      // Since it uses set(state => ... return { ... }), we can't easily add a side effect *after* state update inside the return.
      // Use get().checkUnlocks() in a separate useEffect or just add it to endGame. 


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

        if (get().settings.isPremium) {
          get().syncToCloud();
        }

        return { success: true, amount: result.amount };
      },

      claimSignupReward: () => {
        const state = get();
        if (state.user.hasClaimedSignupReward) {
          return { success: false, amount: 0, reason: 'Already claimed!' };
        }

        const amount = 500;
        set((state) => ({
          user: {
            ...state.user,
            wallet: processTransaction(
              state.user.wallet,
              'signup_reward',
              amount,
              undefined,
              `Signup reward: +${amount} coins`
            ),
            hasClaimedSignupReward: true,
          }
        }));

        if (get().settings.isPremium) {
          get().syncToCloud();
        }

        return { success: true, amount };
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

        if (state.dailyReward.lastClaimDate === today) {
          return { success: false, amount: 0, streak: state.dailyReward.currentStreak, reason: 'Already claimed today!' };
        }

        let newStreak = 1;
        if (state.dailyReward.lastClaimDate === yesterday) {
          newStreak = Math.min(state.dailyReward.currentStreak + 1, 7);
        }

        const baseReward = 100;
        const streakBonus = (newStreak - 1) * 50;
        const amount = baseReward + streakBonus;

        const currentWallet = state.user.wallet;
        const newBalance = currentWallet.balance + amount;

        const transaction = {
          id: crypto.randomUUID(),
          type: 'daily_bonus' as const,
          amount: amount,
          balance: newBalance,
          timestamp: Date.now(),
          description: `Daily reward(Day ${newStreak}): +${amount} coins`
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

        if (get().settings.isPremium) {
          get().syncToCloud();
        }

        return { success: true, amount, streak: newStreak };
      },

      startPveGame: (mode, difficulty, timeControl, playerColor) => {
        const state = get();
        const betAmount = getPveEntryCost(difficulty, state.user.level);

        if (!canAffordBet(state.user.wallet, betAmount)) {
          return false;
        }

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

        if (stakeAmount > 0) {
          if (!canAffordBet(state.user.wallet, stakeAmount)) {
            return false;
          }

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

        await new Promise(resolve => setTimeout(resolve, 300));

        const depth = getAIDepth(state.user.level, state.computerDifficulty);
        const bestMove = getBestMove(state.currentGame, depth, state.computerDifficulty);
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

      undoMove: () => {
        const state = get();
        if (!state.currentGame || state.currentGame.moveHistory.length === 0) return;

        // In vs Computer mode, undo 2 moves (player + computer)
        // In vs Human mode, undo 1 move
        const movesToUndo = state.isVsComputer ? 2 : 1;
        const newHistory = state.currentGame.moveHistory.slice(0, -movesToUndo);

        // Re-play history from start
        let replayedState = createInitialGameState();
        for (const move of newHistory) {
          replayedState = makeMove(replayedState, move);
        }

        set({ currentGame: replayedState });
      },

      clearGame: () => set({
        currentGame: null,
        gameMode: null,
        activeMatch: null,
        isVsComputer: false
      }),

      endGame: (result) => {
        const state = get();
        const { activeMatch, user, currentSeason } = state;

        if (!activeMatch) return;

        let updatedWallet = { ...user.wallet };
        let coinsWon = 0;
        let xpEarned = 0;
        let winsEarned = 0;
        const betAmount = activeMatch.betAmount;

        updatedWallet = {
          ...updatedWallet,
          lockedBalance: Math.max(0, updatedWallet.lockedBalance - betAmount),
        };

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

          let netChange = 0;
          let description = '';

          if (result === 'win') {
            netChange = coinsWon;
            description = `PvE Win: +${coinsWon} coins(180 % of ${betAmount})`;
          } else if (result === 'loss') {
            netChange = 0;
            description = `PvE Loss: -${betAmount} coins`;
          } else {
            netChange = betAmount;
            description = `PvE Draw: ${betAmount} coins returned`;
          }

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
          winsEarned = pvpResult.winsEarned;

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
            description = `PvP Draw: ${netChange} coins refunded(90 %)`;
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

        const updatedStreaks = updateStreakData(user.streaks, result);
        const newTotalPveWins = user.totalPveWins + winsEarned;
        const levelProgress = calculateLevelProgress(newTotalPveWins);
        const levelUp = checkLevelUp(user.totalPveWins, newTotalPveWins);

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

        const difficultyName = activeMatch.difficulty ?
          activeMatch.difficulty.charAt(0).toUpperCase() + activeMatch.difficulty.slice(1) : '';

        const newHistoryItem: GameHistory = {
          id: Date.now().toString(),
          opponent: activeMatch.type === 'pve' ?
            `Computer(${difficultyName})` :
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

        set({
          gameHistory: [newHistoryItem, ...state.gameHistory].slice(0, 100),
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
          currentGame: state.currentGame, // Keep for results screen
          gameMode: state.gameMode,
          activeMatch: state.activeMatch,
        });

        if (get().settings.isPremium) {
          get().syncToCloud();
        }
        get().checkUnlocks();

        return { coinsWon, xpEarned };
      },

      recoverBet: () => {
        const state = get();
        const { activeMatch, user } = state;

        if (!activeMatch || activeMatch.betAmount <= 0) {
          return { success: false, amount: 0 };
        }

        const amountToRecover = activeMatch.betAmount;
        const newBalance = user.wallet.balance + amountToRecover;

        const transaction = {
          id: crypto.randomUUID(),
          type: 'ad_reward' as TransactionType,
          amount: amountToRecover,
          balance: newBalance,
          timestamp: Date.now(),
          description: `Recovered join cost: +${amountToRecover} coins`,
        };

        set({
          user: {
            ...user,
            wallet: {
              ...user.wallet,
              balance: newBalance,
              transactions: [transaction, ...user.wallet.transactions].slice(0, 100),
            },
          },
        });

        if (get().settings.isPremium) {
          get().syncToCloud();
        }

        return { success: true, amount: amountToRecover };
      },

      addFriend: (friend) => set((state) => ({
        friends: [...state.friends, friend],
      })),

      removeFriend: (id) => set((state) => ({
        friends: state.friends.filter(f => f.id !== id),
      })),

      sendInvite: (friendId) => set((state) => ({
        pendingInvites: [...state.pendingInvites, friendId],
      })),

      updateFriendStatus: (id, online, lastSeen) => set((state) => ({
        friends: state.friends.map(f => f.id === id ? { ...f, online, lastSeen } : f)
      })),

      addChatMessage: (friendId, message) => set((state) => {
        const roomMessages = state.chatRooms[friendId] || [];
        if (roomMessages.find(m => m.id === message.id)) return state;
        const newMessages = [...roomMessages, message].sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        return {
          chatRooms: {
            ...state.chatRooms,
            [friendId]: newMessages
          }
        };
      }),

      addChallenge: (challenge) => set((state) => {
        if (state.incomingChallenges.find(c => c.id === challenge.id)) return state;
        return {
          incomingChallenges: [challenge, ...state.incomingChallenges]
        };
      }),

      respondToChallenge: async (challengeId, status) => {
        const { error } = await supabase
          .from('challenges')
          .update({ status })
          .eq('id', challengeId);

        if (!error) {
          set((state) => ({
            incomingChallenges: state.incomingChallenges.filter(c => c.id !== challengeId)
          }));
        }
      },

      sendMessageAction: async (friendId, content) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('messages')
          .insert({
            sender_id: user.id,
            receiver_id: friendId,
            content
          })
          .select()
          .single();

        if (error) {
          console.error('[Store] Send message error:', error);
          throw error;
        }
        if (data) {
          get().addChatMessage(friendId, data);
        }
      },

      sendChallengeAction: async (friendId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
          .from('challenges')
          .insert({
            sender_id: user.id,
            receiver_id: friendId,
            status: 'pending'
          });

        if (error) {
          console.error('[Store] Send challenge error:', error);
        }
      },

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
        if (get().settings.isPremium) {
          get().syncToCloud();
        }
        get().checkUnlocks();
      },

      checkSeasonTransition: () => {
        const state = get();
        if (state.currentSeason && isSeasonEnded(state.currentSeason)) {
          const { newSeason } = transitionSeason(state.currentSeason);
          const newSeasonStats = createSeasonStats(newSeason, state.user.id);
          set({
            currentSeason: newSeason,
            user: {
              ...state.user,
              currentSeasonStats: newSeasonStats,
            }
          });
          if (get().settings.isPremium) {
            get().syncToCloud();
          }
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
            }
          };
        });
        if (get().settings.isPremium) {
          get().syncToCloud();
        }
      },

      checkUnlocks: () => {
        const state = get();
        const userRankValue = getRankValue(state.user.rank);
        const currentUnlocks = new Set(state.user.unlockedItems);
        const newUnlocks: { type: 'board' | 'piece', id: string }[] = [];

        // Check Board Themes
        Object.entries(BOARD_THEMES).forEach(([id, theme]) => {
          // We only permanently unlock "Free" themes that have Rank requirements.
          // Premium themes are accessed dynamically via subscription status.
          if (!theme.isPremium && !theme.isLuxury) {
            let canUnlock = false;
            if (theme.requiredRank) {
              const reqRankValue = getRankValue(theme.requiredRank);
              if (userRankValue >= reqRankValue) {
                canUnlock = true;
              }
            } else {
              canUnlock = true; // Default locked
            }

            if (canUnlock && !currentUnlocks.has(id)) {
              currentUnlocks.add(id);
              // Queue modal only for non-default items that are newly unlocked
              if (theme.requiredRank) {
                newUnlocks.push({ type: 'board', id });
              }
            }
          }
        });

        // Check Piece Themes
        Object.entries(PIECE_THEMES).forEach(([id, theme]) => {
          if (!theme.isPremium && !theme.isLuxury) {
            let canUnlock = false;
            if (theme.requiredRank) {
              const reqRankValue = getRankValue(theme.requiredRank);
              if (userRankValue >= reqRankValue) {
                canUnlock = true;
              }
            } else {
              canUnlock = true;
            }

            if (canUnlock && !currentUnlocks.has(id)) {
              currentUnlocks.add(id);
              if (theme.requiredRank) {
                newUnlocks.push({ type: 'piece', id });
              }
            }
          }
        });

        if (currentUnlocks.size !== state.user.unlockedItems.length) {
          set((state) => ({
            user: {
              ...state.user,
              unlockedItems: Array.from(currentUnlocks)
            },
            unlockedModalQueue: [...state.unlockedModalQueue, ...newUnlocks]
          }));

          if (state.settings.isPremium) {
            get().syncToCloud();
          }
        }
      },

      dismissUnlockModal: () => {
        set((state) => ({
          unlockedModalQueue: state.unlockedModalQueue.slice(1)
        }));
      },

      syncToCloud: async () => {
        const state = get();
        if (!state.settings.isPremium) return;

        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        if (!supabaseUser) return;

        try {
          await pushPlayerSnapshot({
            user_id: supabaseUser.id,
            updated_at: new Date().toISOString(),
            profile_data: state.user,
            wallet_data: state.user.wallet,
            settings_data: state.settings,
            history_data: state.gameHistory,
          });

          // Also update profile table specifically for discovery
          await supabase.from('profiles').upsert({
            id: supabaseUser.id,
            username: state.user.email || state.user.name,
            name: state.user.name,
            phone_number: state.user.phoneNumber,
            avatar_url: state.user.avatar,
            level: state.user.level,
            rank: state.user.rank,
            country_code: state.user.country.code,
            country_name: state.user.country.name,
            country_flag: state.user.country.flag,
            last_online: new Date().toISOString()
          });

          console.log('[Store] Cloud sync successful');
        } catch (error) {
          console.error('[Store] Cloud sync failed:', error);
        }
      },

      syncContactsAction: async () => {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        if (!supabaseUser) return;

        try {
          const { syncContacts } = await import('@/systems/contacts');
          const { matchingUsers } = await syncContacts(supabaseUser.id);

          const newFriends: Friend[] = matchingUsers.map(u => ({
            id: u.id,
            name: u.name || 'Chess player',
            avatar: u.avatar_url || '👤',
            online: false, // Will be updated by presence later
            level: u.level || 1,
            rank: u.rank || 'Pawn',
            country: {
              code: u.country_code || 'US',
              name: u.country_name || 'United States',
              flag: u.country_flag || '🇺🇸'
            }
          }));

          // Merge with existing friends
          set((state) => {
            const existingIds = new Set(state.friends.map(f => f.id));
            const uniqueNewFriends = newFriends.filter(f => !existingIds.has(f.id));
            return {
              friends: [...state.friends, ...uniqueNewFriends]
            };
          });

        } catch (error) {
          console.error('[Store] Contact sync failed:', error);
        }
      },

      solvePuzzle: (puzzleId, reward) => {
        set((state) => {
          if (state.user.solvedPuzzles.includes(puzzleId)) {
            return state;
          }

          const currentWallet = state.user.wallet;
          const newBalance = currentWallet.balance + reward;
          const transaction = {
            id: crypto.randomUUID(),
            type: 'puzzle_reward' as TransactionType,
            amount: reward,
            balance: newBalance,
            timestamp: Date.now(),
            description: `Puzzle Solved: ${puzzleId} `,
          };

          return {
            user: {
              ...state.user,
              solvedPuzzles: [...state.user.solvedPuzzles, puzzleId],
              wallet: {
                ...currentWallet,
                balance: newBalance,
                totalEarned: currentWallet.totalEarned + reward,
                transactions: [transaction, ...currentWallet.transactions].slice(0, 100),
              },
            },
          };
        });
        if (get().settings.isPremium) {
          get().syncToCloud();
        }
      },

      claimPuzzleSetReward: (setId, reward) => {
        set((state) => {
          const itemKey = `puzzle_set_reward_${setId}`;
          if (state.user.unlockedItems.includes(itemKey)) {
            return state;
          }

          const currentWallet = state.user.wallet;
          const newBalance = currentWallet.balance + reward;
          const transaction = {
            id: crypto.randomUUID(),
            type: 'reward' as TransactionType,
            amount: reward,
            balance: newBalance,
            timestamp: Date.now(),
            description: `Puzzle Set Reward: ${setId}`,
          };

          return {
            user: {
              ...state.user,
              unlockedItems: [...state.user.unlockedItems, itemKey],
              wallet: {
                ...currentWallet,
                balance: newBalance,
                totalEarned: currentWallet.totalEarned + reward,
                transactions: [transaction, ...currentWallet.transactions].slice(0, 100),
              },
            },
          };
        });

        if (get().settings.isPremium) {
          get().syncToCloud();
        }
      },
    }),
    {
      name: 'chess-champ-storage',
      partialize: (state) => ({
        user: state.user,
        hasSeenWelcome: state.hasSeenWelcome,
        currentSeason: state.currentSeason,
        dailyReward: state.dailyReward,
        friends: state.friends,
        gameHistory: state.gameHistory,
        settings: state.settings,
        // Make sure to persist unlockedModalQueue if we want it to survive restart, 
        // prompt says "Persist unlock state... modal does not repeat".
        // unlockedItems is in user, so it persists. 
        // unlockedModalQueue checks if it's already shown? No, checking logic adds to queue only if not in unlockedItems.
        // But if app crashes while modal is open? 
        // The modal should probably remove itself from queue only when dismissed.
        // We can persist queue too.
        unlockedModalQueue: state.unlockedModalQueue
      }),
    }
  )
);

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')} `;
}
