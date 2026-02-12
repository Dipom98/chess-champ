import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Zap, Trophy, Lock, Check, 
  Lightbulb, Star, Gift, Target, Flame, X, RotateCcw
} from 'lucide-react';
import { MobileLayout } from '../components/MobileLayout';
import { useGameStore } from '../store/gameStore';
import {
  ChessPuzzle,
  getDailyPuzzle,
  getPuzzlesByType,
  getPuzzleRushPuzzles,
  puzzleSets,
  mateIn1Puzzles,
  mateIn2Puzzles,
  mateIn3Puzzles,
  mateIn4Puzzles
} from '../data/puzzles';
import { cn } from '../utils/cn';

type PuzzleMode = 'menu' | 'daily' | 'rush' | 'sets' | 'mate' | 'playing';

// Chess piece unicode
const PIECE_UNICODE: Record<string, string> = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

interface BoardPosition {
  [square: string]: string;
}

interface PuzzleState {
  puzzle: ChessPuzzle | null;
  currentMoveIndex: number;
  solved: boolean;
  failed: boolean;
  hintsUsed: number;
  maxHints: number;
  startTime: number;
  board: BoardPosition;
  selectedSquare: string | null;
  highlightedSquare: string | null;
  lastMove: { from: string; to: string } | null;
  playerTurn: boolean;
  message: string;
}

// Parse FEN to board position
const parseFEN = (fen: string): BoardPosition => {
  const board: BoardPosition = {};
  const [position] = fen.split(' ');
  const rows = position.split('/');
  
  rows.forEach((row, rowIndex) => {
    let colIndex = 0;
    for (const char of row) {
      if (isNaN(parseInt(char))) {
        const file = String.fromCharCode(97 + colIndex);
        const rank = 8 - rowIndex;
        board[`${file}${rank}`] = char;
        colIndex++;
      } else {
        colIndex += parseInt(char);
      }
    }
  });
  
  return board;
};

// Convert algebraic notation to from/to squares
const parseMove = (move: string, board: BoardPosition, isWhite: boolean): { from: string; to: string; promotion?: string } | null => {
  // Handle castling
  if (move === 'O-O' || move === '0-0') {
    const rank = isWhite ? '1' : '8';
    return { from: `e${rank}`, to: `g${rank}` };
  }
  if (move === 'O-O-O' || move === '0-0-0') {
    const rank = isWhite ? '1' : '8';
    return { from: `e${rank}`, to: `c${rank}` };
  }

  // Clean the move string
  let cleanMove = move.replace(/[+#!?]/g, '');
  let promotion: string | undefined;
  
  // Check for promotion
  if (cleanMove.includes('=')) {
    const parts = cleanMove.split('=');
    cleanMove = parts[0];
    promotion = parts[1];
  }

  // Extract target square (always last 2 chars for standard moves)
  const targetMatch = cleanMove.match(/([a-h][1-8])$/);
  if (!targetMatch) return null;
  const to = targetMatch[1];

  // Determine piece type
  let pieceType = 'P';
  if (/^[KQRBN]/.test(cleanMove)) {
    pieceType = cleanMove[0];
  }

  // Find the piece that can make this move
  const targetPiece = isWhite ? pieceType : pieceType.toLowerCase();
  
  for (const [square, piece] of Object.entries(board)) {
    if (piece === targetPiece) {
      // Simple validation - check if piece could theoretically move there
      // For puzzles we assume moves are valid
      const fromFile = square[0];
      const fromRank = parseInt(square[1]);
      const toFile = to[0];
      const toRank = parseInt(to[1]);
      
      // Check disambiguation
      if (cleanMove.length > 3 && pieceType !== 'P') {
        const disambig = cleanMove.substring(1, cleanMove.length - 2).replace('x', '');
        if (disambig.length === 1) {
          if (/[a-h]/.test(disambig) && fromFile !== disambig) continue;
          if (/[1-8]/.test(disambig) && fromRank !== parseInt(disambig)) continue;
        }
      }
      
      // Pawn moves
      if (pieceType === 'P') {
        // Pawn captures include file
        if (cleanMove.includes('x') || cleanMove.length === 4) {
          if (cleanMove[0] !== fromFile) continue;
        }
        // Check valid pawn move
        const direction = isWhite ? 1 : -1;
        const fileDiff = Math.abs(toFile.charCodeAt(0) - fromFile.charCodeAt(0));
        const rankDiff = toRank - fromRank;
        
        if (fileDiff === 0 && (rankDiff === direction || (rankDiff === 2 * direction && (fromRank === 2 || fromRank === 7)))) {
          return { from: square, to, promotion };
        }
        if (fileDiff === 1 && rankDiff === direction) {
          return { from: square, to, promotion };
        }
        continue;
      }
      
      // Other pieces - simple validation
      const fileDiff = Math.abs(toFile.charCodeAt(0) - fromFile.charCodeAt(0));
      const rankDiff = Math.abs(toRank - fromRank);
      
      if (pieceType === 'N') {
        if ((fileDiff === 2 && rankDiff === 1) || (fileDiff === 1 && rankDiff === 2)) {
          return { from: square, to, promotion };
        }
      } else if (pieceType === 'B') {
        if (fileDiff === rankDiff && fileDiff > 0) {
          return { from: square, to, promotion };
        }
      } else if (pieceType === 'R') {
        if (fileDiff === 0 || rankDiff === 0) {
          return { from: square, to, promotion };
        }
      } else if (pieceType === 'Q') {
        if (fileDiff === rankDiff || fileDiff === 0 || rankDiff === 0) {
          return { from: square, to, promotion };
        }
      } else if (pieceType === 'K') {
        if (fileDiff <= 1 && rankDiff <= 1) {
          return { from: square, to, promotion };
        }
      }
    }
  }
  
  return null;
};

// Make a move on the board
const makeMove = (board: BoardPosition, from: string, to: string, promotion?: string): BoardPosition => {
  const newBoard = { ...board };
  const piece = newBoard[from];
  
  // Handle promotion
  if (promotion && (piece === 'P' || piece === 'p')) {
    newBoard[to] = piece === 'P' ? promotion.toUpperCase() : promotion.toLowerCase();
  } else {
    newBoard[to] = piece;
  }
  
  delete newBoard[from];
  
  // Handle castling
  if ((piece === 'K' || piece === 'k') && Math.abs(to.charCodeAt(0) - from.charCodeAt(0)) === 2) {
    const rank = from[1];
    if (to[0] === 'g') {
      // Kingside
      newBoard[`f${rank}`] = newBoard[`h${rank}`];
      delete newBoard[`h${rank}`];
    } else if (to[0] === 'c') {
      // Queenside
      newBoard[`d${rank}`] = newBoard[`a${rank}`];
      delete newBoard[`a${rank}`];
    }
  }
  
  // Handle en passant
  if ((piece === 'P' || piece === 'p') && from[0] !== to[0] && !board[to]) {
    const captureRank = piece === 'P' ? parseInt(to[1]) - 1 : parseInt(to[1]) + 1;
    delete newBoard[`${to[0]}${captureRank}`];
  }
  
  return newBoard;
};

export const PuzzlesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, addTransaction } = useGameStore();
  const [mode, setMode] = useState<PuzzleMode>('menu');
  const [puzzleState, setPuzzleState] = useState<PuzzleState>({
    puzzle: null,
    currentMoveIndex: 0,
    solved: false,
    failed: false,
    hintsUsed: 0,
    maxHints: 3,
    startTime: 0,
    board: {},
    selectedSquare: null,
    highlightedSquare: null,
    lastMove: null,
    playerTurn: true,
    message: ''
  });
  
  // Puzzle Rush state
  const [rushState, setRushState] = useState({
    puzzles: [] as ChessPuzzle[],
    currentIndex: 0,
    score: 0,
    timeLeft: 180,
    isActive: false,
    difficulty: 'easy' as 'easy' | 'medium' | 'hard'
  });
  
  // Mate puzzles state
  const [mateType, setMateType] = useState<1 | 2 | 3 | 4>(1);
  const [, setSelectedSet] = useState<string | null>(null);
  
  // Daily puzzle tracking
  const [dailyCompleted, setDailyCompleted] = useState(false);
  
  useEffect(() => {
    const lastDaily = localStorage.getItem('lastDailyPuzzle');
    const today = new Date().toDateString();
    setDailyCompleted(lastDaily === today);
  }, []);
  
  // Timer for Puzzle Rush
  useEffect(() => {
    if (rushState.isActive && rushState.timeLeft > 0) {
      const timer = setInterval(() => {
        setRushState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
      return () => clearInterval(timer);
    } else if (rushState.isActive && rushState.timeLeft <= 0) {
      endPuzzleRush();
    }
  }, [rushState.isActive, rushState.timeLeft]);

  // Initialize puzzle board
  const initializePuzzle = useCallback((puzzle: ChessPuzzle, isRush: boolean = false) => {
    const board = parseFEN(puzzle.fen);
    
    // Determine who moves first from FEN
    const fenParts = puzzle.fen.split(' ');
    const isWhiteToMove = fenParts[1] === 'w';
    
    setPuzzleState({
      puzzle,
      currentMoveIndex: 0,
      solved: false,
      failed: false,
      hintsUsed: 0,
      maxHints: isRush ? 1 : 3,
      startTime: Date.now(),
      board,
      selectedSquare: null,
      highlightedSquare: null,
      lastMove: null,
      playerTurn: true,
      message: isWhiteToMove ? 'White to move' : 'Black to move'
    });
  }, []);
  
  const startDailyPuzzle = () => {
    const puzzle = getDailyPuzzle();
    initializePuzzle(puzzle);
    setMode('daily');
  };
  
  const startPuzzleRush = (difficulty: 'easy' | 'medium' | 'hard') => {
    const puzzles = getPuzzleRushPuzzles(difficulty, 20);
    setRushState({
      puzzles,
      currentIndex: 0,
      score: 0,
      timeLeft: difficulty === 'easy' ? 300 : difficulty === 'medium' ? 240 : 180,
      isActive: true,
      difficulty
    });
    if (puzzles.length > 0) {
      initializePuzzle(puzzles[0], true);
    }
    setMode('rush');
  };
  
  const endPuzzleRush = () => {
    setRushState(prev => ({ ...prev, isActive: false }));
    const reward = rushState.score * 10;
    if (reward > 0) {
      addTransaction(reward, 'puzzle_reward', `Puzzle Rush: ${rushState.score} solved`);
    }
  };
  
  const startMatePuzzles = (type: 1 | 2 | 3 | 4) => {
    setMateType(type);
    setMode('mate');
  };
  
  const startPuzzle = (puzzle: ChessPuzzle) => {
    initializePuzzle(puzzle);
    setMode('playing');
  };

  // Handle square click
  const handleSquareClick = (square: string) => {
    if (puzzleState.solved || puzzleState.failed || !puzzleState.playerTurn) return;
    
    const { board, selectedSquare, puzzle, currentMoveIndex } = puzzleState;
    
    if (!puzzle) return;
    
    // If clicking on own piece, select it
    const piece = board[square];
    const fenParts = puzzle.fen.split(' ');
    const isWhiteToMove = fenParts[1] === 'w';
    const isOwnPiece = piece && (isWhiteToMove ? piece === piece.toUpperCase() : piece === piece.toLowerCase());
    
    if (!selectedSquare && isOwnPiece) {
      setPuzzleState(prev => ({ ...prev, selectedSquare: square, message: 'Select target square' }));
      return;
    }
    
    if (selectedSquare) {
      if (selectedSquare === square) {
        // Deselect
        setPuzzleState(prev => ({ ...prev, selectedSquare: null, message: isWhiteToMove ? 'White to move' : 'Black to move' }));
        return;
      }
      
      if (isOwnPiece) {
        // Select different piece
        setPuzzleState(prev => ({ ...prev, selectedSquare: square }));
        return;
      }
      
      // Try to make move
      const expectedMove = puzzle.solution[currentMoveIndex];
      const expectedParsed = parseMove(expectedMove, board, isWhiteToMove);
      
      if (expectedParsed && expectedParsed.from === selectedSquare && expectedParsed.to === square) {
        // Correct move!
        const newBoard = makeMove(board, selectedSquare, square, expectedParsed.promotion);
        const nextMoveIndex = currentMoveIndex + 1;
        
        if (nextMoveIndex >= puzzle.solution.length) {
          // Puzzle solved!
          setPuzzleState(prev => ({
            ...prev,
            board: newBoard,
            selectedSquare: null,
            lastMove: { from: selectedSquare, to: square },
            currentMoveIndex: nextMoveIndex,
            solved: true,
            message: '🎉 Correct! Puzzle solved!'
          }));
          
          // Award coins
          if (mode === 'daily' && !dailyCompleted) {
            localStorage.setItem('lastDailyPuzzle', new Date().toDateString());
            setDailyCompleted(true);
            addTransaction(50, 'puzzle_reward', 'Daily Puzzle Completed');
          } else if (mode === 'rush') {
            const nextIndex = rushState.currentIndex + 1;
            if (nextIndex < rushState.puzzles.length) {
              setTimeout(() => {
                setRushState(prev => ({
                  ...prev,
                  currentIndex: nextIndex,
                  score: prev.score + 1
                }));
                initializePuzzle(rushState.puzzles[nextIndex], true);
              }, 1000);
            } else {
              setRushState(prev => ({ ...prev, score: prev.score + 1 }));
              setTimeout(endPuzzleRush, 1000);
            }
          } else {
            addTransaction(20, 'puzzle_reward', `Puzzle Solved: ${puzzle.title}`);
          }
        } else {
          // More moves to go - computer responds
          setPuzzleState(prev => ({
            ...prev,
            board: newBoard,
            selectedSquare: null,
            lastMove: { from: selectedSquare, to: square },
            currentMoveIndex: nextMoveIndex,
            playerTurn: false,
            message: '✓ Correct! Opponent moving...'
          }));
          
          // Computer makes next move after delay
          setTimeout(() => {
            const computerMove = puzzle.solution[nextMoveIndex];
            const computerParsed = parseMove(computerMove, newBoard, !isWhiteToMove);
            
            if (computerParsed) {
              const afterComputerBoard = makeMove(newBoard, computerParsed.from, computerParsed.to, computerParsed.promotion);
              const afterComputerMoveIndex = nextMoveIndex + 1;
              
              if (afterComputerMoveIndex >= puzzle.solution.length) {
                setPuzzleState(prev => ({
                  ...prev,
                  board: afterComputerBoard,
                  lastMove: { from: computerParsed.from, to: computerParsed.to },
                  currentMoveIndex: afterComputerMoveIndex,
                  solved: true,
                  playerTurn: true,
                  message: '🎉 Correct! Puzzle solved!'
                }));
              } else {
                setPuzzleState(prev => ({
                  ...prev,
                  board: afterComputerBoard,
                  lastMove: { from: computerParsed.from, to: computerParsed.to },
                  currentMoveIndex: afterComputerMoveIndex,
                  playerTurn: true,
                  message: 'Your turn'
                }));
              }
            }
          }, 500);
        }
      } else {
        // Wrong move
        setPuzzleState(prev => ({
          ...prev,
          selectedSquare: null,
          failed: true,
          message: '✗ Wrong move! Try again.'
        }));
      }
    }
  };

  // Use hint
  const useHint = () => {
    if (puzzleState.hintsUsed >= puzzleState.maxHints || !puzzleState.puzzle || puzzleState.solved || puzzleState.failed) return;
    
    const { puzzle, currentMoveIndex, board } = puzzleState;
    const fenParts = puzzle.fen.split(' ');
    const isWhiteToMove = fenParts[1] === 'w';
    
    const nextMove = puzzle.solution[currentMoveIndex];
    const parsed = parseMove(nextMove, board, isWhiteToMove);
    
    if (parsed) {
      setPuzzleState(prev => ({
        ...prev,
        hintsUsed: prev.hintsUsed + 1,
        highlightedSquare: parsed.from,
        message: `Hint: Move the piece on ${parsed.from}`
      }));
      
      // Clear hint after 3 seconds
      setTimeout(() => {
        setPuzzleState(prev => ({
          ...prev,
          highlightedSquare: null
        }));
      }, 3000);
    }
  };

  // Reset puzzle
  const resetPuzzle = () => {
    if (puzzleState.puzzle) {
      initializePuzzle(puzzleState.puzzle, mode === 'rush');
    }
  };
  
  const getMateInfo = (type: 1 | 2 | 3 | 4) => {
    const puzzleMap = {
      1: mateIn1Puzzles,
      2: mateIn2Puzzles,
      3: mateIn3Puzzles,
      4: mateIn4Puzzles
    };
    const puzzles = puzzleMap[type];
    const { available, locked } = getPuzzlesByType(`mate_in_${type}` as ChessPuzzle['type'], user.level);
    const requiredLevel = type === 1 ? 1 : type === 2 ? 10 : type === 3 ? 20 : 40;
    const isLocked = user.level < requiredLevel;
    
    return { puzzles, available, locked, requiredLevel, isLocked };
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const renderPuzzleBoard = () => {
    if (!puzzleState.puzzle) return null;
    
    const { board, selectedSquare, highlightedSquare, lastMove, solved, failed, message } = puzzleState;
    
    return (
      <div className="relative">
        {/* Message Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "mb-3 px-4 py-2.5 rounded-xl text-center font-medium",
            solved && "bg-green-500/20 text-green-400 border border-green-500/30",
            failed && "bg-red-500/20 text-red-400 border border-red-500/30",
            !solved && !failed && "bg-white/10 text-white/80"
          )}
        >
          {message}
        </motion.div>

        {/* Puzzle Board */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass rounded-2xl p-3 border border-white/10"
        >
          <div className="grid grid-cols-8 gap-0 rounded-xl overflow-hidden shadow-xl border-2 border-amber-600/30">
            {Array.from({ length: 64 }).map((_, i) => {
              const row = Math.floor(i / 8);
              const col = i % 8;
              const file = String.fromCharCode(97 + col);
              const rank = 8 - row;
              const square = `${file}${rank}`;
              const isLight = (row + col) % 2 === 0;
              const piece = board[square];
              const isSelected = selectedSquare === square;
              const isHighlighted = highlightedSquare === square;
              const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
              
              return (
                <motion.div
                  key={square}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'aspect-square flex items-center justify-center cursor-pointer relative transition-colors',
                    isLight ? 'bg-amber-100' : 'bg-amber-700',
                    isSelected && 'ring-4 ring-blue-400 ring-inset',
                    isHighlighted && 'ring-4 ring-green-400 ring-inset animate-pulse',
                    isLastMove && 'bg-yellow-400/50'
                  )}
                  onClick={() => handleSquareClick(square)}
                >
                  {piece && (
                    <span className={cn(
                      "text-3xl md:text-4xl select-none",
                      piece === piece.toUpperCase() ? "text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" : "text-gray-900"
                    )}>
                      {PIECE_UNICODE[piece]}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
        
        {/* Puzzle Info Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-4 glass rounded-2xl p-4 border border-white/10"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-lg text-white">{puzzleState.puzzle.title}</h3>
              <p className="text-sm text-white/60">{puzzleState.puzzle.description}</p>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-lg text-xs font-bold",
              puzzleState.puzzle.difficulty === 'beginner' && "bg-green-500/20 text-green-400",
              puzzleState.puzzle.difficulty === 'intermediate' && "bg-amber-500/20 text-amber-400",
              puzzleState.puzzle.difficulty === 'advanced' && "bg-orange-500/20 text-orange-400",
              puzzleState.puzzle.difficulty === 'expert' && "bg-red-500/20 text-red-400",
            )}>
              {puzzleState.puzzle.difficulty}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Star size={14} className="text-amber-400" />
              <span className="text-amber-400 font-medium">{puzzleState.puzzle.rating}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Target size={14} className="text-emerald-400" />
              <span className="text-emerald-400">{puzzleState.puzzle.solution.length} move(s)</span>
            </div>
          </div>
        </motion.div>
        
        {/* Controls */}
        <div className="flex gap-3 mt-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={useHint}
            disabled={puzzleState.hintsUsed >= puzzleState.maxHints || solved}
            className={cn(
              "flex-1 py-3.5 rounded-xl font-medium flex items-center justify-center gap-2",
              "glass border border-white/10",
              puzzleState.hintsUsed < puzzleState.maxHints && !solved
                ? "text-amber-400 hover:bg-white/5" 
                : "text-white/30 cursor-not-allowed"
            )}
          >
            <Lightbulb size={18} />
            Hint ({puzzleState.maxHints - puzzleState.hintsUsed})
          </motion.button>
          
          {failed && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={resetPuzzle}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              <RotateCcw size={18} />
              Try Again
            </motion.button>
          )}
        </div>
        
        {/* Solved Overlay */}
        <AnimatePresence>
          {solved && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="text-center p-6"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="text-7xl mb-4"
                >
                  🎉
                </motion.div>
                <h3 className="text-2xl font-bold text-emerald-400 mb-2">Puzzle Solved!</h3>
                <p className="text-amber-400 font-bold text-lg mb-6">
                  +{mode === 'daily' ? 50 : 20} coins
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMode('menu')}
                  className="px-8 py-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl font-bold text-white shadow-lg shadow-amber-500/30"
                >
                  Continue
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };
  
  const renderMenu = () => (
    <div className="space-y-4">
      {/* Daily Puzzle */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: dailyCompleted ? 1 : 1.02 }}
        whileTap={{ scale: dailyCompleted ? 1 : 0.98 }}
        onClick={() => !dailyCompleted && startDailyPuzzle()}
        disabled={dailyCompleted}
        className={cn(
          "w-full p-4 rounded-2xl flex items-center gap-4 relative overflow-hidden",
          dailyCompleted 
            ? "glass opacity-60" 
            : "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 shadow-lg shadow-amber-500/25"
        )}
      >
        {!dailyCompleted && (
          <>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent" />
            <div className="absolute inset-0 shimmer" />
          </>
        )}
        <div className={cn(
          "relative w-14 h-14 rounded-xl flex items-center justify-center text-3xl",
          dailyCompleted ? "bg-white/10" : "bg-white/20"
        )}>
          {dailyCompleted ? <Check size={28} className="text-emerald-400" /> : <Gift size={28} className="text-white" />}
        </div>
        <div className="flex-1 text-left relative z-10">
          <h3 className="font-bold text-lg text-white">Daily Puzzle</h3>
          <p className={cn("text-sm", dailyCompleted ? "text-white/50" : "text-white/80")}>
            {dailyCompleted ? "Completed! Come back tomorrow" : "New puzzle every day"}
          </p>
        </div>
        <div className="relative z-10 text-right">
          {dailyCompleted ? (
            <span className="text-emerald-400 text-sm font-medium">✓ Done</span>
          ) : (
            <span className="text-white font-bold">+50 🪙</span>
          )}
        </div>
      </motion.button>
      
      {/* Puzzle Rush */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-4 border border-white/10"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg shadow-red-500/25">
            <Zap size={28} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-white">Puzzle Rush</h3>
            <p className="text-sm text-white/60">Solve as many as you can!</p>
          </div>
          <Flame className="text-orange-400" size={20} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { diff: 'easy', time: '5 min', color: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/25' },
            { diff: 'medium', time: '4 min', color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/25' },
            { diff: 'hard', time: '3 min', color: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/25' },
          ].map((item) => (
            <motion.button
              key={item.diff}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => startPuzzleRush(item.diff as 'easy' | 'medium' | 'hard')}
              className={cn(
                "py-3 rounded-xl font-medium text-white text-sm bg-gradient-to-br shadow-lg capitalize",
                item.color,
                item.shadow
              )}
            >
              {item.diff}
              <span className="block text-[10px] text-white/70">{item.time}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
      
      {/* Puzzle Sets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-4 border border-white/10"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Target size={28} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-white">Puzzle Sets</h3>
            <p className="text-sm text-white/60">Themed collections</p>
          </div>
        </div>
        <div className="space-y-2">
          {puzzleSets.map((set, index) => {
            const isLocked = user.level < set.requiredLevel;
            return (
              <motion.button
                key={set.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                whileTap={{ scale: isLocked ? 1 : 0.98 }}
                onClick={() => !isLocked && setSelectedSet(set.id)}
                disabled={isLocked}
                className={cn(
                  "w-full p-3 rounded-xl flex items-center justify-between transition-all",
                  isLocked 
                    ? "bg-white/5 opacity-50" 
                    : "bg-white/10 hover:bg-white/15"
                )}
              >
                <div className="flex items-center gap-3">
                  {isLocked ? (
                    <Lock size={16} className="text-white/40" />
                  ) : (
                    <Target size={16} className="text-emerald-400" />
                  )}
                  <div className="text-left">
                    <span className="font-medium text-white">{set.name}</span>
                    <p className="text-xs text-white/50">{set.description}</p>
                  </div>
                </div>
                {isLocked ? (
                  <span className="text-xs text-red-400">Lvl {set.requiredLevel}</span>
                ) : (
                  <span className="text-amber-400 text-sm font-medium">+{set.reward} 🪙</span>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
      
      {/* Mate In X */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-4 border border-white/10"
      >
        <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">♔</span>
          Checkmate Puzzles
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {([1, 2, 3, 4] as const).map((num) => {
            const info = getMateInfo(num);
            const icons = ['♟️', '♞', '♝', '♜'];
            const colors = [
              'from-green-500 to-emerald-600',
              'from-blue-500 to-cyan-600',
              'from-purple-500 to-violet-600',
              'from-red-500 to-rose-600'
            ];
            
            return (
              <motion.button
                key={num}
                whileHover={{ scale: info.isLocked ? 1 : 1.05 }}
                whileTap={{ scale: info.isLocked ? 1 : 0.95 }}
                onClick={() => !info.isLocked && startMatePuzzles(num)}
                disabled={info.isLocked}
                className={cn(
                  "p-4 rounded-xl text-center relative overflow-hidden",
                  info.isLocked 
                    ? "bg-white/5 opacity-50" 
                    : `bg-gradient-to-br ${colors[num - 1]} shadow-lg`
                )}
              >
                {!info.isLocked && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent" />
                )}
                <div className="relative z-10">
                  <div className="text-3xl mb-2">
                    {info.isLocked ? '🔒' : icons[num - 1]}
                  </div>
                  <div className="font-bold text-white">Mate in {num}</div>
                  <div className="text-xs text-white/70 mt-1">
                    {info.isLocked 
                      ? `Unlock at Lvl ${info.requiredLevel}` 
                      : `${info.available.length} puzzles`
                    }
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
      
      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-2xl p-4 border border-white/10"
      >
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <Trophy size={18} className="text-amber-400" />
          Your Stats
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-2xl font-bold text-emerald-400">{user.gamesPlayed}</div>
            <div className="text-xs text-white/50">Played</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-2xl font-bold text-amber-400">Lv.{user.level}</div>
            <div className="text-xs text-white/50">Level</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-2xl font-bold text-purple-400">
              {Math.round((user.wins / Math.max(user.gamesPlayed, 1)) * 100)}%
            </div>
            <div className="text-xs text-white/50">Win Rate</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
  
  const renderMatePuzzles = () => {
    const info = getMateInfo(mateType);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Mate in {mateType}</h2>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setMode('menu')}
            className="px-4 py-2 rounded-xl glass text-sm text-white/70 flex items-center gap-2"
          >
            <ChevronLeft size={16} />
            Back
          </motion.button>
        </div>
        
        {/* Available Puzzles */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-white/70 px-1">
            Available ({info.available.length})
          </h3>
          {info.available.map((puzzle, index) => (
            <motion.button
              key={puzzle.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => startPuzzle(puzzle)}
              className="w-full glass rounded-xl p-4 flex items-center gap-4 border border-white/10"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/25">
                ♔
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-medium text-white">{puzzle.title}</h4>
                <p className="text-sm text-white/50">{puzzle.description}</p>
              </div>
              <div className="text-right">
                <div className="text-amber-400 font-bold">{puzzle.rating}</div>
                <div className="text-xs text-white/50">Rating</div>
              </div>
            </motion.button>
          ))}
        </div>
        
        {/* Locked Puzzles */}
        {info.locked.length > 0 && (
          <div className="space-y-2 mt-6">
            <h3 className="text-sm font-medium text-white/70 px-1">
              Locked ({info.locked.length})
            </h3>
            {info.locked.map((puzzle, index) => (
              <motion.div
                key={puzzle.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.03 }}
                className="w-full glass rounded-xl p-4 opacity-50 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Lock size={20} className="text-white/40" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-medium text-white/70">{puzzle.title}</h4>
                  <p className="text-sm text-white/40">Reach Level {puzzle.requiredLevel} to unlock</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  const renderPuzzleRush = () => (
    <div className="space-y-4">
      {/* Timer and Score */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-4 border border-white/10"
      >
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className={cn(
              "text-3xl font-bold font-mono",
              rushState.timeLeft < 30 ? "text-red-400 animate-pulse" : "text-white"
            )}>
              {formatTime(rushState.timeLeft)}
            </div>
            <div className="text-xs text-white/50">Time Left</div>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400">{rushState.score}</div>
            <div className="text-xs text-white/50">Solved</div>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-400">
              {rushState.currentIndex + 1}/{rushState.puzzles.length}
            </div>
            <div className="text-xs text-white/50">Puzzle</div>
          </div>
        </div>
      </motion.div>
      
      {/* Puzzle Board or Results */}
      {rushState.isActive ? renderPuzzleBoard() : (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass rounded-3xl p-8 text-center border border-amber-500/30"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
            className="text-7xl mb-4"
          >
            🏆
          </motion.div>
          <h3 className="text-2xl font-bold text-white mb-2">Rush Complete!</h3>
          <p className="text-5xl font-bold text-emerald-400 my-4">{rushState.score}</p>
          <p className="text-white/50 mb-2">Puzzles Solved</p>
          <p className="text-amber-400 font-bold text-lg mb-6">
            +{rushState.score * 10} coins earned
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMode('menu')}
            className="px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl font-bold text-white shadow-lg shadow-amber-500/30"
          >
            Continue
          </motion.button>
        </motion.div>
      )}
      
      {/* Quit Button */}
      {rushState.isActive && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            endPuzzleRush();
            setMode('menu');
          }}
          className="w-full py-3 glass rounded-xl text-red-400 font-medium flex items-center justify-center gap-2"
        >
          <X size={18} />
          End Rush
        </motion.button>
      )}
    </div>
  );
  
  return (
    <MobileLayout
      title="Puzzles"
      showBack
      onBack={() => mode === 'menu' ? navigate(-1) : setMode('menu')}
    >
      <div className="p-4 pb-8">
        {mode === 'menu' && renderMenu()}
        {mode === 'daily' && renderPuzzleBoard()}
        {mode === 'rush' && renderPuzzleRush()}
        {mode === 'mate' && renderMatePuzzles()}
        {mode === 'playing' && renderPuzzleBoard()}
      </div>
    </MobileLayout>
  );
};
