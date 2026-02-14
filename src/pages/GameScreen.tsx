import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw, Flag, Home, Pause, ChevronLeft, ChevronRight,
  Clock, Share2, Check, Play, Gift, Undo2, Box,
  Coins, Zap, TrendingUp, Trophy
} from 'lucide-react';
import { useGameStore, BOARD_THEMES } from '@/store/gameStore';
import { audioManager } from '@/systems/audio';
import { ads } from '@/systems/ads';
import { getLegalMoves, posEquals } from '@/chess/logic';
import { Move, Position, PieceType, PieceColor } from '@/chess/types';
import { cn } from '@/utils/cn';
import { ChessPieceRenderer } from '@/components/ChessPieceRenderer';

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
    makeComputerMove, endGame, recoverBet, gameMode, user, settings, timeControl,
    addTransaction, currentGame: storeGame, activeMatch,
    isVsComputer, computerColor, makeGameMove
  } = useGameStore();

  // Use a local ref for currentGame to handle the "rescue" state better
  const [currentGame, setCurrentGame] = useState(storeGame);

  useEffect(() => {
    setCurrentGame(storeGame);
  }, [storeGame]);



  const currentTheme = BOARD_THEMES[settings.boardTheme] || BOARD_THEMES.classic;

  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [flipped, setFlipped] = useState(false);

  // Auto-flip board if player is black
  useEffect(() => {
    if (currentGame && isVsComputer) {
      const playerColor = computerColor === 'white' ? 'black' : 'white';
      if (playerColor === 'black') {
        setFlipped(true);
      } else {
        setFlipped(false);
      }
    }
  }, [isVsComputer, computerColor, !!currentGame]);

  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<Move | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [showRescueModal, setShowRescueModal] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [lastResult, setLastResult] = useState<{ coinsWon: number; xpEarned: number } | null>(null);
  const [hasDoubled, setHasDoubled] = useState(false);
  const [hasRecovered, setHasRecovered] = useState(false);

  // Animation state for piece movement
  const [animatingPiece, setAnimatingPiece] = useState<{
    from: Position;
    to: Position;
    piece: { type: PieceType; color: string } | null;
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
              const result = endGame('loss');
              if (result) setLastResult(result);
              setShowRescueModal(true);
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
              const result = endGame(isVsComputer && computerColor === 'black' ? 'win' : 'loss');
              if (result) setLastResult(result);

              if (isVsComputer && computerColor === 'black') {
                setShowGameOver(true);
              } else {
                setShowRescueModal(true);
              }
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
      setGameEnded(true);
      const endResult = endGame(result);
      if (endResult) setLastResult(endResult);
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
          piece: piece
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

  // Audio Effects
  useEffect(() => {
    if (!currentGame?.moveHistory.length) return;

    const lastMove = currentGame.moveHistory[currentGame.moveHistory.length - 1];
    if (currentGame.isCheckmate) {
      audioManager.play('gameOver');
    } else if (currentGame.isCheck) {
      audioManager.play('check');
    } else if (lastMove.captured) {
      audioManager.play('capture');
    } else {
      audioManager.play('move');
    }
  }, [currentGame?.moveHistory.length, currentGame?.isCheck, currentGame?.isCheckmate]);

  // Toggle 3D function
  const toggle3d = () => {
    useGameStore.getState().updateSettings({ is3d: !settings.is3d });
  };

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

  const handleRescue = async () => {
    setIsWatchingAd(true);
    const success = await ads.showRewardedAd('time_rescue');
    setIsWatchingAd(false);

    if (success) {
      // Add 5 minutes (300 seconds)
      if (currentGame?.currentPlayer === 'white') {
        setWhiteTime(300);
      } else {
        setBlackTime(300);
      }
      setGameEnded(false);
      setShowRescueModal(false);
    }
  };

  const handleDoubleReward = async () => {
    if (hasDoubled || !lastResult) return;

    setIsWatchingAd(true);
    const success = await ads.showRewardedAd('double_reward');
    setIsWatchingAd(false);

    if (success) {
      addTransaction(
        lastResult.coinsWon,
        'ad_reward',
        `Double reward bonus: +${lastResult.coinsWon} coins`
      );
      setHasDoubled(true);
    }
  };
  const handleRecoverCoins = async () => {
    if (hasRecovered || !activeMatch || activeMatch.betAmount <= 0) return;

    setIsWatchingAd(true);
    const success = await ads.showRewardedAd('recover_coins');
    setIsWatchingAd(false);

    if (success) {
      recoverBet();
      setHasRecovered(true);
    }
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
          const row = displayRow;
          const col = displayCol;
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
                isPremiumTheme && !settings.is3d && 'overflow-hidden',
                settings.is3d && "overflow-visible"
              )}
              style={{
                boxShadow: isPremiumTheme && currentTheme.glowColor && isSelected ? `inset 0 0 15px ${currentTheme.glowColor}` : undefined,
                transformStyle: settings.is3d ? 'preserve-3d' : 'flat'
              }}
            >
              {/* Coordinates */}
              {colIndex === 0 && (
                <span className={cn(
                  'absolute top-0.5 left-1 text-[9px] font-bold z-0',
                  isLight ? 'text-amber-600/70' : 'text-amber-200/70'
                )}>
                  {ranks[flipped ? 7 - rowIndex : rowIndex]}
                </span>
              )}
              {rowIndex === 7 && (
                <span className={cn(
                  'absolute bottom-0.5 right-1 text-[9px] font-bold z-0',
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
                  className="absolute w-3 h-3 rounded-full bg-black/25 shadow-sm z-10"
                />
              )}
              {canMove && isCapture && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-1 border-[3px] border-red-500/50 rounded-full z-10"
                />
              )}

              {/* Piece */}
              {piece && !isAnimatingFrom && (
                <ChessPieceRenderer
                  type={piece.type}
                  color={piece.color}
                  theme={settings.pieceTheme}
                  className={cn(
                    'text-[8vw] max-text-4xl absolute',
                    settings.is3d ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 origin-bottom" : ''
                  )}
                  style={{
                    fontSize: 'clamp(24px, 8vw, 36px)',
                    transform: settings.is3d
                      ? `translate(-50%, -60%) rotateX(-60deg) scale(1.6)`
                      : isSelected ? 'scale(1.1)' : 'scale(1)',
                    filter: settings.is3d ? 'drop-shadow(0 10px 5px rgba(0,0,0,0.4))' : undefined,
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    ));
  };

  return (
    <div className="fixed inset-0 h-[100dvh] bg-gradient-to-br from-[#0f0a1e] via-[#1a1333] to-[#0d1b2a] flex flex-col relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      {/* 3D Perspective Container */}
      <div className={cn(
        "flex-1 flex flex-col relative transition-all duration-700",
        settings.is3d ? "origin-center" : ""
      )}
        style={{
          perspective: settings.is3d ? '1000px' : 'none',
          overflow: 'hidden'
        }}>

        {/* Header */}
        <div className="relative z-10 flex-none flex items-center justify-between px-4 py-3 glass-dark pt-safe-top">
          <div className="flex items-center gap-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMenu(true)}
              className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <Pause size={22} />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                useGameStore.getState().undoMove();
                setSelectedSquare(null);
                setLegalMoves([]);
              }}
              disabled={!currentGame || currentGame.moveHistory.length === 0 || isComputerThinking}
              className={cn(
                "p-2.5 rounded-xl transition-all",
                !currentGame || currentGame.moveHistory.length === 0 || isComputerThinking
                  ? "text-white/20 cursor-not-allowed"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
              title="Undo Move"
            >
              <Undo2 size={22} />
            </motion.button>
          </div>

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

          <div className="flex items-center gap-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggle3d}
              className={cn(
                "p-2.5 rounded-xl transition-all",
                settings.is3d ? "text-amber-400 bg-amber-500/10" : "text-white/70 hover:text-white hover:bg-white/10"
              )}
              title="Toggle 3D"
            >
              <Box size={20} className={cn(settings.is3d && "animate-pulse")} />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setFlipped(f => !f)}
              className={cn(
                "p-2.5 rounded-xl transition-all",
                flipped ? "text-amber-400 bg-amber-500/10" : "text-white/70 hover:text-white hover:bg-white/10"
              )}
              title="Flip Board"
            >
              <RotateCcw size={20} className={cn(flipped && "rotate-180")} />
            </motion.button>
          </div>
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
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="opacity-70 text-lg"
            >
              <ChessPieceRenderer
                type={piece.type}
                color={piece.color}
                theme={settings.pieceTheme}
                className="text-2xl"
              />
            </motion.div>
          ))}
        </div>

        {/* Chess Board */}
        <div className={cn(
          "relative z-10 flex-1 flex items-center justify-center px-3 transition-all duration-700"
        )}
          style={{
            transform: settings.is3d ? 'rotateX(35deg) rotateZ(0deg) scale(0.9)' : 'none',
            transformStyle: settings.is3d ? 'preserve-3d' : 'flat',
            transformOrigin: '50% 60%',
            marginTop: settings.is3d ? '-20px' : '0'
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "rounded-2xl shadow-2xl transition-all duration-700",
              currentTheme.border,
              currentTheme.isPremium && "premium-board-border",
              // Remove overflow hidden in 3D to allow pieces to stand out
              settings.is3d ? "overflow-visible border-8" : "overflow-hidden border-4"
            )}
            style={{
              boxShadow: currentTheme.isPremium && currentTheme.glowColor
                ? `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px ${currentTheme.glowColor}, 0 0 0 1px rgba(255,255,255,0.1)`
                : '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)',
              // Set CSS variable for premium border glow
              '--premium-glow-color': currentTheme.glowColor || '#fbbf24',
              transform: 'none',
              transformStyle: 'preserve-3d'
            } as React.CSSProperties}
          >
            {renderBoard()}
          </motion.div>

          {/* Animating piece overlay - Adjusted for 3D */}
          {animatingPiece && animatingPiece.piece && (
            <motion.div
              initial={{
                position: 'absolute',
                left: `calc(${animatingPiece.from.col * 11}vw + 12px)`,
                top: `calc(${(7 - animatingPiece.from.row) * 11}vw)`,
                scale: settings.is3d ? 1.5 : 1,
                zIndex: 50
              }}
              animate={{
                left: `calc(${animatingPiece.to.col * 11}vw + 12px)`,
                top: `calc(${(7 - animatingPiece.to.row) * 11}vw)`,
              }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="pointer-events-none text-4xl"
              style={{
                fontSize: 'clamp(24px, 8vw, 36px)',
                transform: settings.is3d ? `translateY(-20px) rotateX(-60deg) scale(1.5)` : 'none'
              }}
            >
              <ChessPieceRenderer
                type={animatingPiece.piece.type}
                color={animatingPiece.piece.color as PieceColor}
                theme={settings.pieceTheme}
              />
            </motion.div>
          )}
        </div>

        {/* Captured pieces (player's) */}
        <div className="relative z-10 px-4 py-2 flex gap-0.5 min-h-[28px] flex-wrap">
          {(flipped ? currentGame.capturedPieces.white : currentGame.capturedPieces.black).map((piece, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="opacity-70 text-lg"
            >
              <ChessPieceRenderer
                type={piece.type}
                color={piece.color}
                theme={settings.pieceTheme}
                className="text-2xl"
              />
            </motion.div>
          ))}
        </div>

        {/* Player info */}
        <div className="relative z-10 flex items-center gap-3 px-4 py-2.5 glass mx-3 rounded-2xl flex-none mb-2">
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
        <div className="relative z-10 flex items-center gap-2 px-4 py-3 glass-dark flex-none pb-safe-bottom">
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
                  onClick={() => {
                    if (window.confirm('Restart current game?')) {
                      handleNewGame();
                      setShowMenu(false);
                    }
                  }}
                  className="w-full py-4 glass rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                >
                  <RotateCcw size={20} />
                  Restart Game
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

        {/* Time Rescue Modal */}
        <AnimatePresence>
          {showRescueModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[70] p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="glass-dark rounded-3xl p-6 w-full max-w-sm space-y-5 border border-amber-500/30 text-center"
              >
                <div className="w-20 h-20 mx-auto bg-amber-500/20 rounded-2xl flex items-center justify-center text-4xl mb-2 border border-amber-500/30">
                  ⌛
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Time's Up!</h2>
                  <p className="text-white/60 mt-1">Don't lose hope yet! Watch a short video to get extra time.</p>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3 text-left">
                  <div className="bg-amber-500 rounded-lg p-2">
                    <Clock size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold">+5 Minutes</p>
                    <p className="text-amber-400/70 text-xs">Rewarded Extension</p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isWatchingAd}
                  onClick={handleRescue}
                  className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-600 rounded-2xl text-white font-bold text-lg shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 relative overflow-hidden"
                >
                  {isWatchingAd ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Play size={20} fill="currentColor" />
                      Watch to Continue
                    </>
                  )}
                </motion.button>

                <button
                  onClick={() => { setShowRescueModal(false); setShowGameOver(true); }}
                  className="w-full py-2 text-white/40 hover:text-white/60 transition-colors font-medium"
                >
                  No thanks, I'll resign
                </button>

                <p className="text-[10px] text-white/30 italic">
                  {ads.getDisclosure('time_rescue')}
                </p>
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
                    {lastResult?.coinsWon && lastResult.coinsWon > 0 ? '💰' :
                      currentGame.isCheckmate && currentGame.currentPlayer === (isVsComputer ? computerColor : 'black')
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
                    ? (currentGame.currentPlayer === (isVsComputer ? computerColor : 'black') ? 'You mastered the board!' : 'Checkmated by your opponent')
                    : whiteTime === 0 || blackTime === 0
                      ? 'Game ended by timeout'
                      : 'A hard fought peace'}
                </p>

                {/* Rewards Display */}
                {lastResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex gap-4 justify-center py-2 relative z-10"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-1 border border-amber-500/30">
                        <Coins size={20} className="text-amber-400" />
                      </div>
                      <span className="text-amber-400 font-bold">+{lastResult.coinsWon}</span>
                      <span className="text-[10px] text-white/40 uppercase">Coins</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-1 border border-blue-500/30">
                        <Zap size={20} className="text-blue-400" />
                      </div>
                      <span className="text-blue-400 font-bold">+{lastResult.xpEarned}</span>
                      <span className="text-[10px] text-white/40 uppercase">XP</span>
                    </div>
                  </motion.div>
                )}

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
                  {/* Double Reward Button */}
                  {currentGame.isCheckmate && currentGame.currentPlayer === (isVsComputer ? computerColor : 'black') && lastResult && lastResult.coinsWon > 0 && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={hasDoubled || isWatchingAd}
                      onClick={handleDoubleReward}
                      className={cn(
                        "w-full py-4 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 shadow-lg relative overflow-hidden group",
                        hasDoubled
                          ? "bg-white/10 text-white/40 cursor-not-allowed"
                          : "bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white shadow-purple-500/30"
                      )}
                    >
                      {!hasDoubled && (
                        <div className="absolute inset-0 bg-[length:200%_100%] bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                      )}

                      <div className="flex items-center gap-2 relative z-10">
                        {isWatchingAd ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : hasDoubled ? (
                          <Check size={20} />
                        ) : (
                          <Gift size={20} className="animate-bounce" />
                        )}
                        <span className="text-lg">
                          {hasDoubled ? "Rewards Doubled!" : "Double Your Rewards"}
                        </span>
                      </div>

                      {!hasDoubled && !isWatchingAd && (
                        <p className="text-[10px] text-white/70 relative z-10 uppercase tracking-widest">
                          Watch ad to get +{lastResult.coinsWon} coins
                        </p>
                      )}
                    </motion.button>
                  )}

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
                    <div className="space-y-3">
                      {activeMatch && activeMatch.betAmount > 0 && !hasRecovered && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={isWatchingAd}
                          onClick={handleRecoverCoins}
                          className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl text-white font-bold flex flex-col items-center justify-center gap-1 shadow-lg shadow-blue-500/30 relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-[length:200%_100%] bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                          <div className="flex items-center gap-2 relative z-10">
                            {isWatchingAd ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <RotateCcw size={18} />
                            )}
                            <span>Recover Your {activeMatch.betAmount} Coins</span>
                          </div>
                          <p className="text-[10px] text-white/70 relative z-10 uppercase tracking-widest">
                            Watch ad to get your join cost back
                          </p>
                        </motion.button>
                      )}

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
                    </div>
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
                <h2 className="text-xl font-bold text-white text-center">Share Your Match</h2>

                {/* Victory Poster - Visual Card */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br rounded-2xl p-5 text-center relative overflow-hidden shadow-xl",
                  currentGame.isCheckmate && currentGame.currentPlayer === (isVsComputer ? computerColor : 'black')
                    ? "from-green-500 via-emerald-500 to-teal-600"
                    : currentGame.isCheckmate
                      ? "from-red-500 via-rose-500 to-orange-600"
                      : "from-blue-500 via-indigo-500 to-purple-600"
                )}>
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
                    animate={{
                      rotateY: [0, 180, 360],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-10 w-24 h-24 flex items-center justify-center mb-4 mx-auto"
                  >
                    <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-2xl animate-pulse" />
                    <div className="relative text-7xl filter drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] flex items-center justify-center">
                      {currentGame.isCheckmate && currentGame.currentPlayer === (isVsComputer ? computerColor : 'black')
                        ? <Trophy size={64} className="text-amber-400" />
                        : currentGame.isCheckmate
                          ? '😤'
                          : '🤝'}
                    </div>
                  </motion.div>

                  <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 mt-2 relative z-10 tracking-tighter uppercase">
                    {currentGame.isCheckmate
                      ? (currentGame.currentPlayer === (isVsComputer ? computerColor : 'black') ? 'Victory!' : 'Hard Luck!')
                      : 'Draw Game'}
                  </h3>

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

                  {/* Stats & Rewards */}
                  <div className="grid grid-cols-2 gap-2 mt-3 relative z-10">
                    <div className="bg-white/15 rounded-lg px-2 py-1.5 flex items-center justify-center gap-2">
                      <Coins size={14} className="text-amber-400" />
                      <span className="text-white font-bold text-sm">+{lastResult?.coinsWon || 0}</span>
                    </div>
                    <div className="bg-white/15 rounded-lg px-2 py-1.5 flex items-center justify-center gap-2">
                      <TrendingUp size={14} className="text-blue-400" />
                      <span className="text-white font-bold text-sm">+{lastResult?.xpEarned || 0}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2 relative z-10">
                    <div className="bg-white/10 rounded-lg py-1">
                      <p className="text-white/60 text-[8px] uppercase">Moves</p>
                      <p className="text-white font-bold text-xs">{currentGame.moveHistory.length}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg py-1">
                      <p className="text-white/60 text-[8px] uppercase">Level</p>
                      <p className="text-white font-bold text-xs">{user.level}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg py-1">
                      <p className="text-white/60 text-[8px] uppercase">Rank</p>
                      <p className="text-white font-bold text-xs">{user.rank}</p>
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
                        {
                          name: 'WhatsApp', icon: '💬', color: 'from-green-500 to-green-600', action: () => {
                            const text = `🏆 I won a chess game on Chess Champ!\n♟️ ${user.name} (Level ${user.level} ${user.rank})\n📊 Won in ${currentGame.moveHistory.length} moves\n\nDownload & challenge me!`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                          }
                        },
                        {
                          name: 'Twitter', icon: '🐦', color: 'from-blue-400 to-blue-500', action: () => {
                            const text = `🏆 Victory on Chess Champ! Level ${user.level} ${user.rank}. Won in ${currentGame.moveHistory.length} moves! #ChessChamp #Chess`;
                            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                          }
                        },
                        {
                          name: 'Facebook', icon: '📘', color: 'from-blue-600 to-blue-700', action: () => {
                            const text = `🏆 I won a chess game on Chess Champ! Level ${user.level} ${user.rank}.`;
                            window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`, '_blank');
                          }
                        },
                        {
                          name: 'Telegram', icon: '✈️', color: 'from-sky-400 to-sky-500', action: () => {
                            const text = `🏆 I won a chess game on Chess Champ!\n♟️ Level ${user.level} ${user.rank}\n📊 Won in ${currentGame.moveHistory.length} moves`;
                            window.open(`https://t.me/share/url?text=${encodeURIComponent(text)}`, '_blank');
                          }
                        },
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
                      <ChessPieceRenderer
                        type={type}
                        color={currentGame.currentPlayer}
                        theme={settings.pieceTheme}
                      />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Close 3D Container div */}
      </div>
    </div>
  );
}
