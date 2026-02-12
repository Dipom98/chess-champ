// ============================================
// ANTI-CHEAT & FAIR PLAY SYSTEM
// ============================================

import { AntiCheatData, CheatFlag, MoveAnalysis, GameAnalysis } from './types';

// ---- CONSTANTS ----
const ACCURACY_THRESHOLD = 95; // Flag if accuracy > 95%
const SUDDEN_SPIKE_THRESHOLD = 25; // Flag if accuracy jumps 25+ points
const ENGINE_MOVE_PATTERN_THRESHOLD = 10; // Flag after 10 engine-like moves in a row
const SUSPICIOUS_TIMING_MIN_MS = 100; // Too fast
const SUSPICIOUS_TIMING_MAX_MS = 200; // Consistent fast moves
const MIN_MATCHES_FOR_ANALYSIS = 5;

// ---- ANTI-CHEAT DATA CREATION ----

export function createAntiCheatData(): AntiCheatData {
  return {
    flags: [],
    flagCount: 0,
    isFrozen: false,
    lastReviewDate: null,
    accuracy: [],
    suspiciousMatches: [],
  };
}

// ---- DETECTION FUNCTIONS ----

/**
 * Analyze move timings for suspicious patterns
 */
export function analyzeMoveTiming(moveTimes: number[]): CheatFlag | null {
  if (moveTimes.length < 10) return null;
  
  // Check for consistently fast moves
  const fastMoves = moveTimes.filter(t => t >= SUSPICIOUS_TIMING_MIN_MS && t <= SUSPICIOUS_TIMING_MAX_MS);
  const fastMoveRatio = fastMoves.length / moveTimes.length;
  
  if (fastMoveRatio > 0.8) {
    return 'move_timing';
  }
  
  // Check for inhuman consistency
  const avgTime = moveTimes.reduce((a, b) => a + b, 0) / moveTimes.length;
  const variance = moveTimes.reduce((sum, t) => sum + Math.pow(t - avgTime, 2), 0) / moveTimes.length;
  const stdDev = Math.sqrt(variance);
  
  // Very low variance in move times is suspicious
  if (avgTime < 1000 && stdDev < 50) {
    return 'move_timing';
  }
  
  return null;
}

/**
 * Check for engine-like move patterns
 */
export function detectEnginePattern(
  playerMoves: string[],
  engineMoves: string[],
  _consecutiveMatches: number = 0 // Historical streak tracking
): { isEngine: boolean; streak: number } {
  let currentStreak = 0;
  let maxStreak = 0;
  
  for (let i = 0; i < playerMoves.length && i < engineMoves.length; i++) {
    if (playerMoves[i] === engineMoves[i]) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  
  return {
    isEngine: maxStreak >= ENGINE_MOVE_PATTERN_THRESHOLD,
    streak: maxStreak,
  };
}

/**
 * Detect sudden strength spike
 */
export function detectSuddenSpike(
  recentAccuracies: number[],
  currentAccuracy: number
): boolean {
  if (recentAccuracies.length < MIN_MATCHES_FOR_ANALYSIS) {
    return false;
  }
  
  const avgAccuracy = recentAccuracies.reduce((a, b) => a + b, 0) / recentAccuracies.length;
  return currentAccuracy - avgAccuracy >= SUDDEN_SPIKE_THRESHOLD;
}

/**
 * Check if accuracy is suspiciously high
 */
export function isSuspiciousAccuracy(accuracy: number): boolean {
  return accuracy >= ACCURACY_THRESHOLD;
}

/**
 * Full anti-cheat analysis for a match
 */
export function analyzeMatchForCheating(
  playerMoves: string[],
  engineMoves: string[],
  moveTimes: number[],
  accuracy: number,
  historicalAccuracies: number[]
): { flags: CheatFlag[]; shouldFreezeRewards: boolean } {
  const flags: CheatFlag[] = [];
  
  // Check move timing
  const timingFlag = analyzeMoveTiming(moveTimes);
  if (timingFlag) flags.push(timingFlag);
  
  // Check for engine pattern
  const engineAnalysis = detectEnginePattern(playerMoves, engineMoves, 0);
  if (engineAnalysis.isEngine) flags.push('engine_pattern');
  
  // Check for sudden spike
  if (detectSuddenSpike(historicalAccuracies, accuracy)) {
    flags.push('sudden_spike');
  }
  
  // Check suspicious accuracy
  if (isSuspiciousAccuracy(accuracy)) {
    flags.push('suspicious_accuracy');
  }
  
  // Freeze rewards if 2+ flags
  const shouldFreezeRewards = flags.length >= 2;
  
  return { flags, shouldFreezeRewards };
}

/**
 * Update anti-cheat data after match
 */
export function updateAntiCheatData(
  data: AntiCheatData,
  matchId: string,
  flags: CheatFlag[],
  accuracy: number,
  shouldFreeze: boolean
): AntiCheatData {
  const newData = { ...data };
  
  // Add new flags (dedupe)
  const existingFlags = new Set(data.flags);
  flags.forEach(f => existingFlags.add(f));
  newData.flags = Array.from(existingFlags);
  
  // Update flag count
  newData.flagCount += flags.length;
  
  // Track accuracy
  newData.accuracy = [...data.accuracy.slice(-19), accuracy]; // Keep last 20
  
  // Track suspicious matches
  if (flags.length > 0) {
    newData.suspiciousMatches = [...data.suspiciousMatches.slice(-9), matchId];
  }
  
  // Freeze if needed
  if (shouldFreeze && !data.isFrozen) {
    newData.isFrozen = true;
  }
  
  return newData;
}

// ---- PVP COLLUSION DETECTION ----

/**
 * Detect potential collusion between players
 */
export function detectCollusion(
  gamesWithSameOpponent: number,
  winRateAgainstOpponent: number,
  avgGameLength: number
): { isCollusion: boolean; reason: string | null } {
  // Too many games with same opponent
  if (gamesWithSameOpponent > 20) {
    // Check for suspicious patterns
    if (winRateAgainstOpponent > 0.9 || winRateAgainstOpponent < 0.1) {
      return {
        isCollusion: true,
        reason: 'Extreme win rate with frequent opponent',
      };
    }
    
    // Very short games
    if (avgGameLength < 5) {
      return {
        isCollusion: true,
        reason: 'Suspiciously short games with frequent opponent',
      };
    }
  }
  
  return { isCollusion: false, reason: null };
}

// ---- GAME ANALYSIS ----

/**
 * Analyze a chess game for mistakes
 */
export function analyzeGame(
  matchId: string,
  moves: string[],
  evaluations: number[],
  bestMoves: string[]
): GameAnalysis {
  const moveAnalysis: MoveAnalysis[] = [];
  let blunders = 0;
  let mistakes = 0;
  let inaccuracies = 0;
  let bestMoveCount = 0;
  
  for (let i = 0; i < moves.length; i++) {
    const evalDiff = i > 0 ? Math.abs(evaluations[i] - evaluations[i-1]) : 0;
    let category: MoveAnalysis['category'] = 'good';
    
    if (moves[i] === bestMoves[i]) {
      bestMoveCount++;
      if (evalDiff > 50) {
        category = 'brilliant';
      } else {
        category = 'great';
      }
    } else if (evalDiff > 300) {
      category = 'blunder';
      blunders++;
    } else if (evalDiff > 150) {
      category = 'mistake';
      mistakes++;
    } else if (evalDiff > 50) {
      category = 'inaccuracy';
      inaccuracies++;
    }
    
    moveAnalysis.push({
      moveNumber: Math.floor(i / 2) + 1,
      move: moves[i],
      evaluation: evaluations[i],
      bestMove: bestMoves[i],
      category,
    });
  }
  
  // Calculate accuracy (simplified)
  const totalMoves = moves.length;
  const goodMoves = totalMoves - blunders * 3 - mistakes * 2 - inaccuracies;
  const accuracy = Math.max(0, Math.min(100, (goodMoves / totalMoves) * 100));
  
  // Get top 3 mistakes
  const topMistakes = moveAnalysis
    .filter(m => m.category === 'blunder' || m.category === 'mistake')
    .sort((a, b) => {
      const scoreA = a.category === 'blunder' ? 3 : 2;
      const scoreB = b.category === 'blunder' ? 3 : 2;
      return scoreB - scoreA;
    })
    .slice(0, 3);
  
  // Generate improvement tip
  const improvementTip = generateImprovementTip(blunders, mistakes, inaccuracies, accuracy);
  
  return {
    matchId,
    playerAccuracy: accuracy,
    blunders,
    mistakes,
    inaccuracies,
    bestMoves: bestMoveCount,
    topMistakes,
    improvementTip,
  };
}

/**
 * Generate improvement tip based on analysis
 */
function generateImprovementTip(
  blunders: number,
  mistakes: number,
  inaccuracies: number,
  accuracy: number
): string {
  if (blunders >= 3) {
    return "Focus on checking for hanging pieces before each move. Take a moment to scan the board for threats.";
  }
  
  if (mistakes >= 5) {
    return "Practice tactical puzzles to improve pattern recognition. Look for forks, pins, and skewers.";
  }
  
  if (inaccuracies >= 8) {
    return "Work on your opening repertoire. A solid opening leads to better middlegame positions.";
  }
  
  if (accuracy < 50) {
    return "Review basic checkmate patterns and endgame techniques. Consider studying classic games.";
  }
  
  if (accuracy < 70) {
    return "Your calculation skills need improvement. Practice visualizing 2-3 moves ahead.";
  }
  
  if (accuracy < 85) {
    return "Good game! Focus on the critical moments where the evaluation shifted significantly.";
  }
  
  return "Excellent game! Keep analyzing your wins and losses to maintain this level of play.";
}

// ---- ABUSE DETECTION ----

/**
 * Check for multi-account abuse
 */
export function checkMultiAccountAbuse(
  ipAddresses: string[],
  deviceIds: string[],
  commonIpThreshold: number = 3
): { isAbuse: boolean; reason: string | null } {
  // Check for too many accounts from same IP
  const ipCounts = new Map<string, number>();
  ipAddresses.forEach(ip => {
    ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);
  });
  
  for (const [ip, count] of ipCounts) {
    if (count >= commonIpThreshold) {
      return {
        isAbuse: true,
        reason: `Multiple accounts from IP: ${ip.substring(0, 8)}...`,
      };
    }
  }
  
  // Check for same device
  const deviceCounts = new Map<string, number>();
  deviceIds.forEach(id => {
    deviceCounts.set(id, (deviceCounts.get(id) || 0) + 1);
  });
  
  for (const [, count] of deviceCounts) {
    if (count >= 2) {
      return {
        isAbuse: true,
        reason: 'Multiple accounts on same device',
      };
    }
  }
  
  return { isAbuse: false, reason: null };
}

/**
 * Check for draw abuse (intentional draws for rewards)
 */
export function checkDrawAbuse(
  recentResults: ('win' | 'loss' | 'draw')[],
  drawThreshold: number = 5
): boolean {
  if (recentResults.length < 10) return false;
  
  const recentDraws = recentResults.slice(-10).filter(r => r === 'draw').length;
  return recentDraws >= drawThreshold;
}

/**
 * Check for disconnect abuse
 */
export function checkDisconnectAbuse(
  recentDisconnects: number,
  disconnectThreshold: number = 3
): boolean {
  return recentDisconnects >= disconnectThreshold;
}
