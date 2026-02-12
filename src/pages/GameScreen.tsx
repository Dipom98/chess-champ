import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RotateCcw, Flag, Home, Pause, ChevronLeft, ChevronRight,
  Clock, Share2, Check
} from 'lucide-react';
import { useGameStore, BOARD_THEMES } from '@/store/gameStore';
import { getLegalMoves, posEquals } from '@/chess/logic';
import { Move, Position, PieceType } from '@/chess/types';
import { cn } from '@/utils/cn';

const pieceSymbols: Record<string, string> = {
  'white-king': '♔', 'white-queen': '♕', 'white-rook': '♖',
  'white-bishop': '♗', 'white-knight': '♘', 'white-pawn': '♙',
  'black-king': '♚', 'black-queen': '♛', 'black-rook': '♜',
  'black-bishop': '♝', 'black-knight': '♞', 'black-pawn': '♟',
};

// Time control settings in seconds
const TIME_CONTROLS = {
  unlimited: { initial: 0, increment: 0 },
  bullet: { initial: 60, increment: 0 },
  blitz: { initial: 300, increment: 0 },
  rapid: { initial: 600, increment: 0 },
  classical: { initial: 1800, increment: 0 },
};

export function GameScreen() {
  const navigate = useNavigate();
  const { 
    currentGame, isVsComputer, computerColor, makeGameMove, 
    makeComputerMove, endGame, gameMode, user, settings, timeControl
  } = useGameStore();
  
  const currentTheme = BOARD_THEMES[settings.boardTheme] || BOARD_THEMES.classic;
  
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<Move | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  
  // Animation state for piece movement
  const [animatingPiece, setAnimatingPiece] = useState<{
    from: Position;
    to: Position;
    piece: string;
  } | null>(null);
  
  // Timer states
  const timeSettings = TIME_CONTROLS[timeControl] || TIME_CONTROLS.rapid;
  const [whiteTime, setWhiteTime] = useState(timeSettings.initial);
  const [blackTime, setBlackTime] = useState(timeSettings.initial);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize timers based on time control
  useEffect(() => {
    const settings = TIME_CONTROLS[timeControl] || TIME_CONTROLS.rapid;
    setWhiteTime(settings.initial);
    setBlackTime(settings.initial);
  }, [timeControl]);
  
  // Timer countdown
  useEffect(() => {
    if (!currentGame || currentGame.isCheckmate || currentGame.isStalemate || timeSettings.initial === 0) {
      return;
    }
    
    timerRef.current = setInterval(() => {
      if (currentGame.currentPlayer === 'white') {
        setWhiteTime(prev => {
          if (prev <= 1) {
            // White timeout - black wins
            if (!gameEnded) {
              setGameEnded(true);
              endGame('loss');
              setShowGameOver(true);
            }
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime(prev => {
          if (prev <= 1) {
            // Black timeout - white wins
            if (!gameEnded) {
              setGameEnded(true);
              if (isVsComputer && computerColor === 'black') {
                endGame('win');
              } else {
                endGame('loss');
              }
              setShowGameOver(true);
            }
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentGame?.currentPlayer, currentGame?.isCheckmate, currentGame?.isStalemate, timeSettings.initial, gameEnded, endGame, isVsComputer, computerColor]);

  useEffect(() => {
    if (!currentGame) {
      navigate('/play');
    }
  }, [currentGame, navigate]);

  // Handle computer move
  useEffect(() => {
    if (
      currentGame &&
      isVsComputer && 
      currentGame.currentPlayer === computerColor && 
      !currentGame.isCheckmate && 
      !currentGame.isStalemate &&
      !isComputerThinking
    ) {
      setIsComputerThinking(true);
      makeComputerMove().then(() => {
        setIsComputerThinking(false);
        setSelectedSquare(null);
        setLegalMoves([]);
      });
    }
  }, [currentGame, isVsComputer, computerColor, isComputerThinking, makeComputerMove]);

  // Handle game over
  useEffect(() => {
    if ((currentGame?.isCheckmate || currentGame?.isStalemate) && !gameEnded) {
      // Determine result and end game
      let result: 'win' | 'loss' | 'draw' = 'draw';
      if (currentGame.isCheckmate) {
        // The player who is NOT the current player won (because current player is in checkmate)
        const winner = currentGame.currentPlayer === 'white' ? 'black' : 'white';
        if (isVsComputer) {
          result = winner === computerColor ? 'loss' : 'win';
        } else {
          result = 'win'; // In local PvP, we'll just say the player won
        }
      }
      // Call endGame to settle coins
      setGameEnded(true);
      endGame(result);
      setTimeout(() => setShowGameOver(true), 500);
    }
  }, [currentGame?.isCheckmate, currentGame?.isStalemate, currentGame?.currentPlayer, isVsComputer, computerColor, endGame, gameEnded]);

  const handleSquareClick = useCallback((pos: Position) => {
    if (!currentGame || currentGame.isCheckmate || currentGame.isStalemate) return;
    if (isComputerThinking) return;
    if (isVsComputer && currentGame.currentPlayer === computerColor) return;

    const moveToMake = legalMoves.find(m => posEquals(m.to, pos));
    if (moveToMake) {
      if (moveToMake.isPromotion) {
        setPendingPromotion(moveToMake);
        return;
      }
      
      // Animate the piece movement
      const piece = currentGame.board[moveToMake.from.row][moveToMake.from.col];
      if (piece) {
        setAnimatingPiece({
          from: moveToMake.from,
          to: moveToMake.to,
          piece: pieceSymbols[`${piece.color}-${piece.type}`]
        });
        
        setTimeout(() => {
          makeGameMove(moveToMake);
          setAnimatingPiece(null);
          setSelectedSquare(null);
          setLegalMoves([]);
        }, 150);
      } else {
        makeGameMove(moveToMake);
        setSelectedSquare(null);
        setLegalMoves([]);
      }
      return;
    }

    const piece = currentGame.board[pos.row][pos.col];
    if (piece && piece.color === currentGame.currentPlayer) {
      setSelectedSquare(pos);
      setLegalMoves(getLegalMoves(currentGame, pos));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [currentGame, legalMoves, isVsComputer, computerColor, isComputerThinking, makeGameMove]);

  const handlePromotion = useCallback((pieceType: PieceType) => {
    if (!pendingPromotion) return;
    const promotionMove = { ...pendingPromotion, promotedTo: pieceType };
    makeGameMove(promotionMove);
    setPendingPromotion(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [pendingPromotion, makeGameMove]);

  const handleResign = () => {
    endGame('loss');
    navigate('/home');
  };

  const handleNewGame = () => {
    setShowGameOver(false);
    setSelectedSquare(null);
    setLegalMoves([]);
    setGameEnded(false);
    navigate('/play');
  };
  
  const formatTime = (seconds: number) => {
    if (seconds === 0 && timeSettings.initial === 0) return '∞';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentGame) return null;

  const lastMove = currentGame.moveHistory.length > 0 
    ? currentGame.moveHistory[currentGame.moveHistory.length - 1] 
    : null;

  const isLastMoveSquare = (row: number, col: number) => {
    if (!lastMove) return false;
    return (
      (lastMove.from.row === row && lastMove.from.col === col) ||
      (lastMove.to.row === row && lastMove.to.col === col)
    );
  };

  const isKingInCheck = (row: number, col: number) => {
    const piece = currentGame.board[row][col];
    return currentGame.isCheck && piece?.type === 'king' && piece?.color === currentGame.currentPlayer;
  };

  const isLegalMove = (row: number, col: number) => {
    return legalMoves.some(m => m.to.row === row && m.to.col === col);
  };
  
  const playerTime = flipped ? blackTime : whiteTime;
  const opponentTime = flipped ? whiteTime : blackTime;

  const renderBoard = () => {
    const rows = flipped ? [...Array(8).keys()] : [...Array(8).keys()].reverse();
    const cols = flipped ? [...Array(8).keys()].reverse() : [...Array(8).keys()];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    return rows.map((displayRow, rowIndex) => (
      <div key={displayRow} className="flex">
        {cols.map((displayCol, colIndex) => {
          const row = flipped ? 7 - displayRow : displayRow;
          const col = flipped ? 7 - displayCol : displayCol;
          const piece = currentGame.board[row][col];
          const isLight = (row + col) % 2 === 0;
          const isSelected = selectedSquare?.row === row && selectedSquare?.col === col;
          const canMove = isLegalMove(row, col);
          const isCapture = canMove && piece !== null;
          const isLastMove = isLastMoveSquare(row, col);
          const isInCheck = isKingInCheck(row, col);
          
          // Check if this square is being animated from
          const isAnimatingFrom = animatingPiece && 
            animatingPiece.from.row === row && 
            animatingPiece.from.col === col;

          // Determine background color
          const getSquareColor = () => {
            if (isInCheck) return 'bg-red-500';
            if (isSelected) return 'bg-amber-400';
            if (isLastMove && !isSelected) {
              return isLight ? 'bg-amber-200/70' : 'bg-amber-600/40';
            }
            // Use premium theme classes or regular tailwind classes
            const themeClass = isLight ? currentTheme.light : currentTheme.dark;
            return themeClass;
          };
          
          // Check if using premium theme
          const isPremiumTheme = currentTheme.isPremium;

          return (
            <motion.button
              key={`${row}-${col}`}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSquareClick({ row, col })}
              className={cn(
                'relative w-[11vw] h-[11vw] max-w-12 max-h-12 flex items-center justify-center',
                getSquareColor(),
                isInCheck && 'animate-pulse',
                isPremiumTheme && 'overflow-hidden'
              )}
              style={isPremiumTheme && currentTheme.glowColor ? {
                boxShadow: isSelected ? `inset 0 0 15px ${currentTheme.glowColor}` : undefined
              } : undefined}
            >
              {/* Coordinates */}
              {colIndex === 0 && (
                <span className={cn(
                  'absolute top-0.5 left-1 text-[9px] font-bold',
                  isLight ? 'text-amber-600/70' : 'text-amber-200/70'
                )}>
                  {ranks[flipped ? 7 - rowIndex : rowIndex]}
                </span>
              )}
              {rowIndex === 7 && (
                <span className={cn(
                  'absolute bottom-0.5 right-1 text-[9px] font-bold',
                  isLight ? 'text-amber-600/70' : 'text-amber-200/70'
                )}>
                  {files[flipped ? 7 - colIndex : colIndex]}
                </span>
              )}

              {/* Legal move indicator */}
              {canMove && !isCapture && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute w-3 h-3 rounded-full bg-black/25 shadow-sm" 
                />
              )}
              {canMove && isCapture && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-1 border-[3px] border-red-500/50 rounded-full" 
                />
              )}

              {/* Piece */}
              {piece && !isAnimatingFrom && (
                <motion.span 
                  initial={false}
                  animate={{ scale: isSelected ? 1.1 : 1 }}
                  className={cn(
                    'text-[8vw] max-text-4xl select-none transition-transform',
                    piece.color === 'white' 
                      ? 'text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]' 
                      : 'text-gray-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.2)]'
                  )}
                  style={{ fontSize: 'clamp(24px, 8vw, 36px)' }}
                >
                  {pieceSymbols[`${piece.color}-${piece.type}`]}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0a1e] via-[#1a1333] to-[#0d1b2a] flex flex-col relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 glass-dark">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowMenu(true)} 
          className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
        >
          <Pause size={22} />
        </motion.button>
        <div className="text-center">
          <p className="text-white/50 text-xs uppercase tracking-wider">{gameMode}</p>
          <p className={cn(
            'text-sm font-semibold',
            currentGame.isCheckmate ? 'text-red-400' :
            currentGame.isStalemate ? 'text-amber-400' :
            currentGame.isCheck ? 'text-amber-400 animate-pulse' :
            isComputerThinking ? 'text-purple-400' :
            'text-white'
          )}>
            {currentGame.isCheckmate ? '👑 Checkmate!' :
             currentGame.isStalemate ? '🤝 Stalemate!' :
             currentGame.isCheck ? '⚠️ Check!' :
             isComputerThinking ? '🤔 Thinking...' :
             `${currentGame.currentPlayer === 'white' ? '⚪' : '⚫'} ${currentGame.currentPlayer}'s turn`}
          </p>
        </div>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setFlipped(f => !f)} 
          className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
        >
          <RotateCcw size={22} />
        </motion.button>
      </div>

      {/* Opponent info */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-2.5 glass mx-3 mt-2 rounded-2xl">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-xl shadow-lg">
          {isVsComputer ? '🤖' : '👤'}
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold">
            {isVsComputer ? 'Computer' : 'Player 2'}
          </p>
          <p className="text-white/40 text-xs">
            Playing {flipped ? 'White' : 'Black'}
          </p>
        </div>
        <div className={cn(
          "flex items-center gap-2 rounded-xl px-3 py-2",
          timeSettings.initial === 0 
            ? "bg-white/10" 
            : currentGame.currentPlayer === (flipped ? 'white' : 'black')
            ? "bg-amber-500/30 border border-amber-500/50"
            : "bg-white/10"
        )}>
          <Clock size={14} className={cn(
            timeSettings.initial === 0 ? "text-white/50" :
            currentGame.currentPlayer === (flipped ? 'white' : 'black') ? "text-amber-400" : "text-white/50"
          )} />
          <span className={cn(
            "font-mono text-sm",
            timeSettings.initial === 0 ? "text-white/70" :
            opponentTime < 30 ? "text-red-400 font-bold" :
            currentGame.currentPlayer === (flipped ? 'white' : 'black') ? "text-amber-400 font-semibold" : "text-white"
          )}>
            {formatTime(opponentTime)}
          </span>
        </div>
      </div>

      {/* Captured pieces (opponent's) */}
      <div className="relative z-10 px-4 py-2 flex gap-0.5 min-h-[28px] flex-wrap">
        {(flipped ? currentGame.capturedPieces.black : currentGame.capturedPieces.white).map((piece, i) => (
          <motion.span 
            key={i} 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-lg opacity-60"
          >
            {pieceSymbols[`${piece.color}-${piece.type}`]}
          </motion.span>
        ))}
      </div>

      {/* Chess Board */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-3">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            "rounded-2xl shadow-2xl overflow-hidden border-4", 
            currentTheme.border,
            currentTheme.isPremium && "premium-board-border"
          )}
          style={{ 
            boxShadow: currentTheme.isPremium && currentTheme.glowColor
              ? `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px ${currentTheme.glowColor}, 0 0 0 1px rgba(255,255,255,0.1)` 
              : '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)',
            // Set CSS variable for premium border glow
            '--premium-glow-color': currentTheme.glowColor || '#fbbf24'
          } as React.CSSProperties}
        >
          {renderBoard()}
        </motion.div>
        
        {/* Animating piece overlay */}
        {animatingPiece && (
          <motion.div
            initial={{
              position: 'absolute',
              left: `calc(${animatingPiece.from.col * 11}vw + 12px)`,
              top: `calc(${(7 - animatingPiece.from.row) * 11}vw)`,
            }}
            animate={{
              left: `calc(${animatingPiece.to.col * 11}vw + 12px)`,
              top: `calc(${(7 - animatingPiece.to.row) * 11}vw)`,
            }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="pointer-events-none text-4xl"
            style={{ fontSize: 'clamp(24px, 8vw, 36px)' }}
          >
            {animatingPiece.piece}
          </motion.div>
        )}
      </div>

      {/* Captured pieces (player's) */}
      <div className="relative z-10 px-4 py-2 flex gap-0.5 min-h-[28px] flex-wrap">
        {(flipped ? currentGame.capturedPieces.white : currentGame.capturedPieces.black).map((piece, i) => (
          <motion.span 
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-lg opacity-60"
          >
            {pieceSymbols[`${piece.color}-${piece.type}`]}
          </motion.span>
        ))}
      </div>

      {/* Player info */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-2.5 glass mx-3 rounded-2xl">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xl shadow-lg">
          {user.avatar}
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold">{user.name}</p>
          <p className="text-amber-400/70 text-xs">
            Playing {flipped ? 'Black' : 'White'}
          </p>
        </div>
        <div className={cn(
          "flex items-center gap-2 rounded-xl px-3 py-2",
          timeSettings.initial === 0 
            ? "bg-amber-500/20 border border-amber-500/30" 
            : currentGame.currentPlayer === (flipped ? 'black' : 'white')
            ? "bg-amber-500/30 border border-amber-500/50"
            : "bg-amber-500/20 border border-amber-500/30"
        )}>
          <Clock size={14} className="text-amber-400" />
          <span className={cn(
            "font-mono text-sm font-semibold",
            timeSettings.initial === 0 ? "text-amber-400" :
            playerTime < 30 ? "text-red-400 font-bold animate-pulse" : "text-amber-400"
          )}>
            {formatTime(playerTime)}
          </span>
        </div>
      </div>

      {/* Move history bar */}
      <div className="relative z-10 flex items-center gap-2 px-4 py-3 glass-dark mt-2">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          className="p-1.5 text-white/30 hover:text-white/60 transition-colors"
        >
          <ChevronLeft size={18} />
        </motion.button>
        <div className="flex-1 flex gap-3 overflow-x-auto hide-scrollbar">
          {currentGame.moveHistory.slice(-8).map((move, i) => (
            <span key={i} className={cn(
              "text-sm whitespace-nowrap px-2 py-1 rounded-lg",
              i === currentGame.moveHistory.slice(-8).length - 1 
                ? "bg-amber-500/20 text-amber-400 font-medium" 
                : "text-white/50"
            )}>
              {move.notation}
            </span>
          ))}
          {currentGame.moveHistory.length === 0 && (
            <span className="text-white/30 text-sm italic">Make your first move...</span>
          )}
        </div>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          className="p-1.5 text-white/30 hover:text-white/60 transition-colors"
        >
          <ChevronRight size={18} />
        </motion.button>
      </div>

      {/* Pause Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowMenu(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-3xl p-6 w-full max-w-sm space-y-4 border border-white/10"
            >
              <div className="text-center mb-2">
                <Pause className="mx-auto text-white/50 mb-2" size={32} />
                <h2 className="text-2xl font-bold text-white">Game Paused</h2>
              </div>
              
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowMenu(false)}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl text-white font-bold text-lg shadow-lg shadow-green-500/25 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent" />
                <span className="relative z-10">▶️ Resume Game</span>
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleNewGame}
                className="w-full py-4 glass rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
              >
                <RotateCcw size={20} />
                New Game
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleResign}
                className="w-full py-4 bg-red-500/15 border border-red-500/30 rounded-2xl text-red-400 font-bold text-lg flex items-center justify-center gap-2 hover:bg-red-500/25 transition-colors"
              >
                <Flag size={20} />
                Resign
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => { endGame('loss'); navigate('/home'); }}
                className="w-full py-4 bg-white/5 rounded-2xl text-white/50 font-medium text-lg flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white/70 transition-colors"
              >
                <Home size={20} />
                Exit to Home
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Modal - Enhanced with full result details */}
      <AnimatePresence>
        {showGameOver && (
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
              transition={{ type: 'spring', bounce: 0.3 }}
              className="relative glass rounded-3xl p-6 w-full max-w-sm text-center space-y-4 border border-white/10 max-h-[85vh] overflow-y-auto"
            >
              {/* Decorative background based on result */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl">
                <div className={cn(
                  "absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl -translate-y-1/2",
                  currentGame.isCheckmate && currentGame.currentPlayer === (isVsComputer ? computerColor : 'black')
                    ? "bg-green-500/30"
                    : currentGame.isCheckmate 
                    ? "bg-red-500/30"
                    : "bg-amber-500/20"
                )} />
              </div>
              
              {/* Result Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
                className={cn(
                  "relative z-10 w-24 h-24 mx-auto rounded-2xl flex items-center justify-center shadow-lg",
                  currentGame.isCheckmate && currentGame.currentPlayer === (isVsComputer ? computerColor : 'black')
                    ? "bg-gradient-to-br from-green-400 to-emerald-600 shadow-green-500/30"
                    : currentGame.isCheckmate 
                    ? "bg-gradient-to-br from-red-400 to-rose-600 shadow-red-500/30"
                    : "bg-gradient-to-br from-amber-400 to-orange-600 shadow-amber-500/30"
                )}
              >
                <span className="text-5xl">
                  {currentGame.isCheckmate && currentGame.currentPlayer === (isVsComputer ? computerColor : 'black')
                    ? '🏆'
                    : currentGame.isCheckmate 
                    ? '😤'
                    : '🤝'}
                </span>
              </motion.div>
              
              {/* Result Title */}
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={cn(
                  "text-3xl font-bold relative z-10",
                  currentGame.isCheckmate && currentGame.currentPlayer === (isVsComputer ? computerColor : 'black')
                    ? "text-green-400"
                    : currentGame.isCheckmate 
                    ? "text-red-400"
                    : "text-amber-400"
                )}
              >
                {currentGame.isCheckmate 
                  ? (currentGame.currentPlayer === (isVsComputer ? computerColor : 'black') 
                      ? 'Victory!' 
                      : 'Defeat')
                  : 'Draw!'}
              </motion.h2>
              
              <p className="text-white/60 text-sm relative z-10">
                {currentGame.isCheckmate 
                  ? 'by Checkmate' 
                  : whiteTime === 0 || blackTime === 0 
                  ? 'by Timeout' 
                  : 'by Stalemate'}
              </p>

              {/* Game Stats Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-3 gap-3 relative z-10"
              >
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-white">{currentGame.moveHistory.length}</p>
                  <p className="text-[10px] text-white/50 uppercase">Moves</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-white">{formatTime(playerTime)}</p>
                  <p className="text-[10px] text-white/50 uppercase">Your Time</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-white capitalize">{gameMode}</p>
                  <p className="text-[10px] text-white/50 uppercase">Mode</p>
                </div>
              </motion.div>

              {/* Opponent Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="bg-white/5 rounded-xl p-3 flex items-center gap-3 relative z-10"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-lg">
                  {isVsComputer ? '🤖' : '👤'}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white/50 text-xs">Opponent</p>
                  <p className="text-white font-medium">{isVsComputer ? 'Computer' : 'Player 2'}</p>
                </div>
              </motion.div>

              {/* Buttons */}
              <div className="space-y-3 relative z-10 pt-2">
                {/* Share Button for wins */}
                {currentGame.isCheckmate && currentGame.currentPlayer === (isVsComputer ? computerColor : 'black') && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowShareModal(true)}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                  >
                    <Share2 size={18} />
                    Share Your Victory
                  </motion.button>
                )}

                {/* Retry Button for losses */}
                {currentGame.isCheckmate && currentGame.currentPlayer !== (isVsComputer ? computerColor : 'black') && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNewGame}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent" />
                    <RotateCcw size={18} className="relative z-10" />
                    <span className="relative z-10">Try Again</span>
                  </motion.button>
                )}

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNewGame}
                    className="flex-1 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white font-bold shadow-lg shadow-green-500/25"
                  >
                    New Game
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/home')}
                    className="flex-1 py-3.5 glass rounded-xl text-white font-bold hover:bg-white/10 transition-colors border border-white/10"
                  >
                    Home
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Victory Modal - Enhanced with multiple share options */}
      <AnimatePresence>
        {showShareModal && (
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
              className="glass rounded-3xl p-5 w-full max-w-sm space-y-4 border border-amber-500/30 relative overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold text-white text-center">Share Your Victory</h2>

              {/* Victory Poster - Visual Card */}
              <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 rounded-2xl p-5 text-center relative overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent" />
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                
                {/* Decorative Chess Pieces */}
                <div className="absolute top-2 left-2 text-white/20 text-2xl">♔</div>
                <div className="absolute top-2 right-2 text-white/20 text-2xl">♚</div>
                <div className="absolute bottom-2 left-2 text-white/20 text-lg">♞</div>
                <div className="absolute bottom-2 right-2 text-white/20 text-lg">♝</div>
                
                {/* App Logo */}
                <div className="flex items-center justify-center gap-1.5 mb-2 relative z-10">
                  <span className="text-lg">♟️</span>
                  <span className="text-white font-bold text-sm">Chess Champ</span>
                </div>
                
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="relative z-10"
                >
                  <span className="text-6xl drop-shadow-lg">🏆</span>
                </motion.div>
                
                <h3 className="text-2xl font-bold text-white mt-2 relative z-10">VICTORY!</h3>
                
                {/* Player Info */}
                <div className="bg-white/20 rounded-xl p-3 mt-3 relative z-10">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl">{user.avatar}</span>
                    <div className="text-left">
                      <p className="text-white font-bold">{user.name}</p>
                      <p className="text-white/70 text-xs">{user.country.flag} {user.country.name}</p>
                    </div>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mt-3 relative z-10">
                  <div className="bg-white/15 rounded-lg px-2 py-1.5">
                    <p className="text-white/70 text-[10px]">Moves</p>
                    <p className="text-white font-bold text-sm">{currentGame.moveHistory.length}</p>
                  </div>
                  <div className="bg-white/15 rounded-lg px-2 py-1.5">
                    <p className="text-white/70 text-[10px]">Level</p>
                    <p className="text-white font-bold text-sm">{user.level}</p>
                  </div>
                  <div className="bg-white/15 rounded-lg px-2 py-1.5">
                    <p className="text-white/70 text-[10px]">Rank</p>
                    <p className="text-white font-bold text-sm">{user.rank}</p>
                  </div>
                </div>
                
                {/* QR Placeholder */}
                <div className="mt-3 relative z-10">
                  <div className="bg-white rounded-lg p-1.5 w-14 h-14 mx-auto">
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded flex items-center justify-center">
                      <div className="grid grid-cols-4 gap-px">
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div key={i} className={cn(
                            "w-1.5 h-1.5",
                            (i + Math.floor(i / 4)) % 2 === 0 ? "bg-white" : "bg-transparent"
                          )} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-white/60 text-[10px] mt-1">Download Chess Champ</p>
                </div>
              </div>

              {shareSuccess ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center py-4"
                >
                  <div className="w-14 h-14 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-2">
                    <Check size={28} className="text-white" />
                  </div>
                  <p className="text-green-400 font-bold">Copied to clipboard!</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {/* Social Media Grid */}
                  <p className="text-white/50 text-xs uppercase tracking-wider">Share to Social Media</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { name: 'WhatsApp', icon: '💬', color: 'from-green-500 to-green-600', action: () => {
                        const text = `🏆 I won a chess game on Chess Champ!\n♟️ ${user.name} (Level ${user.level} ${user.rank})\n📊 Won in ${currentGame.moveHistory.length} moves\n\nDownload & challenge me!`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                      }},
                      { name: 'Twitter', icon: '🐦', color: 'from-blue-400 to-blue-500', action: () => {
                        const text = `🏆 Victory on Chess Champ! Level ${user.level} ${user.rank}. Won in ${currentGame.moveHistory.length} moves! #ChessChamp #Chess`;
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                      }},
                      { name: 'Facebook', icon: '📘', color: 'from-blue-600 to-blue-700', action: () => {
                        const text = `🏆 I won a chess game on Chess Champ! Level ${user.level} ${user.rank}.`;
                        window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`, '_blank');
                      }},
                      { name: 'Telegram', icon: '✈️', color: 'from-sky-400 to-sky-500', action: () => {
                        const text = `🏆 I won a chess game on Chess Champ!\n♟️ Level ${user.level} ${user.rank}\n📊 Won in ${currentGame.moveHistory.length} moves`;
                        window.open(`https://t.me/share/url?text=${encodeURIComponent(text)}`, '_blank');
                      }},
                    ].map((platform) => (
                      <motion.button
                        key={platform.name}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={platform.action}
                        className={cn(
                          "aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 bg-gradient-to-br shadow-lg",
                          platform.color
                        )}
                      >
                        <span className="text-xl">{platform.icon}</span>
                        <span className="text-white text-[8px]">{platform.name}</span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Copy & More Options */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const shareText = `🏆 I won a chess game on Chess Champ!\n\n♟️ ${user.name} (${user.rank})\n📊 Won in ${currentGame.moveHistory.length} moves\n🎯 Level ${user.level}\n🏳️ ${user.country.flag} ${user.country.name}\n\nDownload Chess Champ and challenge me!\n#ChessChamp #Chess #Victory`;
                      navigator.clipboard.writeText(shareText).then(() => {
                        setShareSuccess(true);
                        setTimeout(() => {
                          setShareSuccess(false);
                          setShowShareModal(false);
                        }, 2000);
                      });
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
                  >
                    📋 Copy to Clipboard
                  </motion.button>
                  
                  {/* Native Share (if available) */}
                  {typeof navigator.share !== 'undefined' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        try {
                          await navigator.share({
                            title: 'Chess Champ Victory!',
                            text: `🏆 I won a chess game on Chess Champ!\n♟️ ${user.name} (Level ${user.level} ${user.rank})\n📊 Won in ${currentGame.moveHistory.length} moves`,
                            url: 'https://chesschamp.app'
                          });
                        } catch {
                          // User cancelled or error
                        }
                      }}
                      className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
                    >
                      <Share2 size={18} />
                      More Sharing Options
                    </motion.button>
                  )}
                  
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowShareModal(false)}
                    className="w-full py-3 text-white/50 font-medium"
                  >
                    Close
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Promotion Modal */}
      <AnimatePresence>
        {pendingPromotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass rounded-3xl p-6 space-y-5 border border-white/10"
            >
              <h3 className="text-xl font-bold text-white text-center">Choose Promotion</h3>
              <div className="flex gap-3">
                {(['queen', 'rook', 'bishop', 'knight'] as PieceType[]).map((type, i) => (
                  <motion.button
                    key={type}
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.1, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePromotion(type)}
                    className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 rounded-2xl flex items-center justify-center text-4xl transition-colors shadow-lg"
                  >
                    {pieceSymbols[`${currentGame.currentPlayer}-${type}`]}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
