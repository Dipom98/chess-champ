import { Board, GameState, Move, Piece, PieceColor, PieceType, Position } from './types';

export function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

  // Place pawns
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: 'pawn', color: 'black' };
    board[6][col] = { type: 'pawn', color: 'white' };
  }

  // Place other pieces
  const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: backRow[col], color: 'black' };
    board[7][col] = { type: backRow[col], color: 'white' };
  }

  return board;
}

export function createInitialGameState(): GameState {
  return {
    board: createInitialBoard(),
    currentPlayer: 'white',
    moveHistory: [],
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    enPassantTarget: null,
    capturedPieces: { white: [], black: [] },
  };
}

export function copyBoard(board: Board): Board {
  return board.map(row => row.map(piece => piece ? { ...piece } : null));
}

export function posEquals(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

export function isValidPosition(pos: Position): boolean {
  return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
}

export function getPieceAt(board: Board, pos: Position): Piece | null {
  if (!isValidPosition(pos)) return null;
  return board[pos.row][pos.col];
}

export function findKing(board: Board, color: PieceColor): Position | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}

export function isSquareAttacked(board: Board, pos: Position, byColor: PieceColor): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === byColor) {
        const attacks = getRawMoves(board, { row, col }, piece, null, true);
        if (attacks.some(m => posEquals(m.to, pos))) {
          return true;
        }
      }
    }
  }
  return false;
}

export function isInCheck(board: Board, color: PieceColor): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  const opponentColor = color === 'white' ? 'black' : 'white';
  return isSquareAttacked(board, kingPos, opponentColor);
}

function getRawMoves(
  board: Board,
  from: Position,
  piece: Piece,
  enPassantTarget: Position | null,
  attacksOnly: boolean = false
): Move[] {
  const moves: Move[] = [];
  const { row, col } = from;
  const color = piece.color;
  const opponent = color === 'white' ? 'black' : 'white';

  const addMove = (toRow: number, toCol: number, special?: Partial<Move>) => {
    const to = { row: toRow, col: toCol };
    if (!isValidPosition(to)) return false;
    const targetPiece = getPieceAt(board, to);
    if (targetPiece && targetPiece.color === color) return false;

    moves.push({
      from,
      to,
      piece,
      captured: targetPiece || undefined,
      ...special,
    });
    return !targetPiece;
  };

  const addSlidingMoves = (directions: [number, number][]) => {
    for (const [dr, dc] of directions) {
      let r = row + dr;
      let c = col + dc;
      while (isValidPosition({ row: r, col: c })) {
        const canContinue = addMove(r, c);
        if (!canContinue) break;
        r += dr;
        c += dc;
      }
    }
  };

  switch (piece.type) {
    case 'pawn': {
      const direction = color === 'white' ? -1 : 1;
      const startRow = color === 'white' ? 6 : 1;
      const promotionRow = color === 'white' ? 0 : 7;

      // Captures
      for (const dc of [-1, 1]) {
        const newRow = row + direction;
        const newCol = col + dc;
        if (isValidPosition({ row: newRow, col: newCol })) {
          const target = getPieceAt(board, { row: newRow, col: newCol });
          if (target && target.color === opponent) {
            if (newRow === promotionRow) {
              addMove(newRow, newCol, { isPromotion: true, promotedTo: 'queen' });
            } else {
              addMove(newRow, newCol);
            }
          } else if (attacksOnly) {
            // For attack checking, pawns attack diagonally regardless of pieces
            moves.push({ from, to: { row: newRow, col: newCol }, piece });
          }
          // En passant
          if (enPassantTarget && newRow === enPassantTarget.row && newCol === enPassantTarget.col) {
            const capturedPawn = getPieceAt(board, { row, col: newCol });
            addMove(newRow, newCol, { isEnPassant: true, captured: capturedPawn || undefined });
          }
        }
      }

      if (!attacksOnly) {
        // Forward moves
        const newRow = row + direction;
        if (isValidPosition({ row: newRow, col }) && !getPieceAt(board, { row: newRow, col })) {
          if (newRow === promotionRow) {
            addMove(newRow, col, { isPromotion: true, promotedTo: 'queen' });
          } else {
            addMove(newRow, col);
          }
          // Double move from start
          if (row === startRow) {
            const doubleRow = row + 2 * direction;
            if (!getPieceAt(board, { row: doubleRow, col })) {
              addMove(doubleRow, col);
            }
          }
        }
      }
      break;
    }

    case 'knight': {
      const knightMoves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      for (const [dr, dc] of knightMoves) {
        addMove(row + dr, col + dc);
      }
      break;
    }

    case 'bishop': {
      addSlidingMoves([[-1, -1], [-1, 1], [1, -1], [1, 1]]);
      break;
    }

    case 'rook': {
      addSlidingMoves([[-1, 0], [1, 0], [0, -1], [0, 1]]);
      break;
    }

    case 'queen': {
      addSlidingMoves([[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]);
      break;
    }

    case 'king': {
      const kingMoves = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
      ];
      for (const [dr, dc] of kingMoves) {
        addMove(row + dr, col + dc);
      }
      break;
    }
  }

  return moves;
}

export function getLegalMoves(gameState: GameState, from: Position): Move[] {
  const { board, currentPlayer, enPassantTarget } = gameState;
  const piece = getPieceAt(board, from);

  if (!piece || piece.color !== currentPlayer) return [];

  const rawMoves = getRawMoves(board, from, piece, enPassantTarget, false);
  const legalMoves: Move[] = [];

  // Filter moves that don't leave king in check
  for (const move of rawMoves) {
    const newBoard = copyBoard(board);
    newBoard[move.to.row][move.to.col] = piece;
    newBoard[from.row][from.col] = null;

    // Handle en passant capture
    if (move.isEnPassant) {
      const capturedPawnRow = from.row;
      newBoard[capturedPawnRow][move.to.col] = null;
    }

    if (!isInCheck(newBoard, currentPlayer)) {
      legalMoves.push(move);
    }
  }

  // Add castling moves
  if (piece.type === 'king' && !piece.hasMoved && !isInCheck(board, currentPlayer)) {
    const row = currentPlayer === 'white' ? 7 : 0;

    // Kingside castling
    const kingsideRook = getPieceAt(board, { row, col: 7 });
    if (kingsideRook && kingsideRook.type === 'rook' && !kingsideRook.hasMoved) {
      if (!getPieceAt(board, { row, col: 5 }) && !getPieceAt(board, { row, col: 6 })) {
        const opponent = currentPlayer === 'white' ? 'black' : 'white';
        if (!isSquareAttacked(board, { row, col: 5 }, opponent) &&
          !isSquareAttacked(board, { row, col: 6 }, opponent)) {
          legalMoves.push({
            from,
            to: { row, col: 6 },
            piece,
            isCastling: true,
          });
        }
      }
    }

    // Queenside castling
    const queensideRook = getPieceAt(board, { row, col: 0 });
    if (queensideRook && queensideRook.type === 'rook' && !queensideRook.hasMoved) {
      if (!getPieceAt(board, { row, col: 1 }) &&
        !getPieceAt(board, { row, col: 2 }) &&
        !getPieceAt(board, { row, col: 3 })) {
        const opponent = currentPlayer === 'white' ? 'black' : 'white';
        if (!isSquareAttacked(board, { row, col: 2 }, opponent) &&
          !isSquareAttacked(board, { row, col: 3 }, opponent)) {
          legalMoves.push({
            from,
            to: { row, col: 2 },
            piece,
            isCastling: true,
          });
        }
      }
    }
  }

  return legalMoves;
}

export function getAllLegalMoves(gameState: GameState): Move[] {
  const moves: Move[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = getPieceAt(gameState.board, { row, col });
      if (piece && piece.color === gameState.currentPlayer) {
        moves.push(...getLegalMoves(gameState, { row, col }));
      }
    }
  }
  return moves;
}

export function makeMove(gameState: GameState, move: Move): GameState {
  const newBoard = copyBoard(gameState.board);
  const { from, to, piece, isEnPassant, isCastling, isPromotion, promotedTo } = move;

  // Move piece
  const movedPiece = { ...piece, hasMoved: true };

  if (isPromotion && promotedTo) {
    newBoard[to.row][to.col] = { type: promotedTo, color: piece.color, hasMoved: true };
  } else {
    newBoard[to.row][to.col] = movedPiece;
  }
  newBoard[from.row][from.col] = null;

  // Handle en passant
  if (isEnPassant) {
    newBoard[from.row][to.col] = null;
  }

  // Handle castling
  if (isCastling) {
    const row = from.row;
    if (to.col === 6) {
      // Kingside
      const rook = newBoard[row][7];
      newBoard[row][5] = rook ? { ...rook, hasMoved: true } : null;
      newBoard[row][7] = null;
    } else if (to.col === 2) {
      // Queenside
      const rook = newBoard[row][0];
      newBoard[row][3] = rook ? { ...rook, hasMoved: true } : null;
      newBoard[row][0] = null;
    }
  }

  // Update en passant target
  let enPassantTarget: Position | null = null;
  if (piece.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
    enPassantTarget = { row: (from.row + to.row) / 2, col: from.col };
  }

  // Update captured pieces
  const capturedPieces = { ...gameState.capturedPieces };
  if (move.captured) {
    if (move.captured.color === 'white') {
      capturedPieces.white = [...capturedPieces.white, move.captured];
    } else {
      capturedPieces.black = [...capturedPieces.black, move.captured];
    }
  }

  // Generate notation
  const notation = generateMoveNotation(gameState.board, move);

  const nextPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';
  const newGameState: GameState = {
    board: newBoard,
    currentPlayer: nextPlayer,
    moveHistory: [...gameState.moveHistory, { ...move, notation }],
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    enPassantTarget,
    capturedPieces,
  };

  // Check for check/checkmate/stalemate
  newGameState.isCheck = isInCheck(newBoard, nextPlayer);
  const legalMoves = getAllLegalMoves(newGameState);

  if (legalMoves.length === 0) {
    if (newGameState.isCheck) {
      newGameState.isCheckmate = true;
    } else {
      newGameState.isStalemate = true;
    }
  }

  return newGameState;
}

function generateMoveNotation(_board: Board, move: Move): string {
  const { from, to, piece, captured, isCastling, isPromotion, promotedTo } = move;

  if (isCastling) {
    return to.col === 6 ? 'O-O' : 'O-O-O';
  }

  const files = 'abcdefgh';
  const ranks = '87654321';
  const toSquare = files[to.col] + ranks[to.row];

  let notation = '';

  if (piece.type === 'pawn') {
    if (captured) {
      notation = files[from.col] + 'x' + toSquare;
    } else {
      notation = toSquare;
    }
    if (isPromotion && promotedTo) {
      notation += '=' + getPieceSymbol(promotedTo);
    }
  } else {
    notation = getPieceSymbol(piece.type);
    if (captured) notation += 'x';
    notation += toSquare;
  }

  return notation;
}

function getPieceSymbol(type: PieceType): string {
  const symbols: Record<PieceType, string> = {
    king: 'K',
    queen: 'Q',
    rook: 'R',
    bishop: 'B',
    knight: 'N',
    pawn: '',
  };
  return symbols[type];
}

// Piece-Square Tables for better positional evaluation
const PIECE_SQUARE_TABLES: Record<PieceType, number[][]> = {
  pawn: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ],
  knight: [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50]
  ],
  bishop: [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 10, 10, 10, 10, 0, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20]
  ],
  rook: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [0, 0, 0, 5, 5, 0, 0, 0]
  ],
  queen: [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [0, 0, 5, 5, 5, 5, 0, -5],
    [-10, 5, 5, 5, 5, 5, 0, -10],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20]
  ],
  king: [
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [20, 30, 10, 0, 0, 10, 30, 20]
  ]
};

// Simple AI evaluation
export function evaluateBoard(board: Board): number {
  const pieceValues: Record<PieceType, number> = {
    pawn: 100,
    knight: 320,
    bishop: 330,
    rook: 500,
    queen: 900,
    king: 20000,
  };

  let score = 0;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const materialValue = pieceValues[piece.type];

        // Material score
        let pieceScore = materialValue;

        // Positional score (Piece-Square Tables)
        const table = PIECE_SQUARE_TABLES[piece.type];
        // Flip table for black
        const tableRow = piece.color === 'white' ? row : 7 - row;
        pieceScore += table[tableRow][col];

        score += piece.color === 'white' ? pieceScore : -pieceScore;
      }
    }
  }
  return score;
}

export function getBestMove(gameState: GameState, maxDepth: number = 3, difficulty: string = 'intermediate'): Move | null {
  const moves = getAllLegalMoves(gameState);
  if (moves.length === 0) return null;

  // Difficulty-based randomness (to avoid robotic play / allow mistakes)
  if (difficulty === 'beginner') {
    if (Math.random() < 0.25) return moves[Math.floor(Math.random() * moves.length)];
  } else if (difficulty === 'intermediate') {
    if (Math.random() < 0.10) return moves[Math.floor(Math.random() * moves.length)];
  }

  const isMaximizing = gameState.currentPlayer === 'white';
  const timeLimit = 1000; // 1 second time limit
  const startTime = Date.now();

  let bestMoveSoFar: Move | null = null;
  let bestScoreSoFar = isMaximizing ? -Infinity : Infinity;

  // Iterative Deepening
  // Start from depth 1 and go up to maxDepth
  for (let currentDepth = 1; currentDepth <= maxDepth; currentDepth++) {
    const depthStartTime = Date.now();

    // Check if we ran out of time before starting this depth
    if (depthStartTime - startTime > timeLimit) break;

    try {
      // Re-evaluate all moves at current depth
      const evaluatedMoves = moves.map(move => {
        const newState = makeMove(gameState, move);
        // Pass time info to minimax
        const score = minimax(newState, currentDepth - 1, -Infinity, Infinity, !isMaximizing, startTime, timeLimit);
        return { move, score };
      });

      // Sort moves by score
      if (isMaximizing) {
        evaluatedMoves.sort((a, b) => b.score - a.score);
      } else {
        evaluatedMoves.sort((a, b) => a.score - b.score);
      }

      // Update best move found at this completed depth
      if (evaluatedMoves.length > 0) {
        // For lower difficulties, we might not want the absolute best move,
        // but for "Engine" or "Advanced" we do.
        // The original logic picked from top N based on difficulty.
        // Let's refine this:
        // Identify "candidate moves" from this depth

        let selectedMove: Move;

        if (difficulty === 'beginner') {
          const topCount = Math.min(evaluatedMoves.length, 5);
          selectedMove = evaluatedMoves[Math.floor(Math.random() * topCount)].move;
        } else if (difficulty === 'intermediate') {
          const topCount = Math.min(evaluatedMoves.length, 3);
          selectedMove = evaluatedMoves[Math.floor(Math.random() * topCount)].move;
        } else if (difficulty === 'advanced') {
          const topCount = Math.min(evaluatedMoves.length, 2);
          // Weighted choice
          if (Math.random() < 0.8) {
            selectedMove = evaluatedMoves[0].move;
          } else {
            selectedMove = evaluatedMoves[topCount - 1].move;
          }
        } else {
          // Expert / Engine: Best move
          selectedMove = evaluatedMoves[0].move;
        }

        bestMoveSoFar = selectedMove;
      }

    } catch (e) {
      // If minimax throws a timeout, we stop and use the result from the previous depth
      if ((e as Error).message === 'Timeout') {
        break; // Stop deepening
      } else {
        throw e; // Re-throw other errors
      }
    }
  }

  // If we found a move (which we should have, at least from depth 1), return it.
  // If something went wrong and we have no move (unlikely), pick random.
  return bestMoveSoFar || moves[Math.floor(Math.random() * moves.length)];
}

function minimax(
  gameState: GameState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  startTime: number,
  timeLimit: number
): number {
  // Time check every ~1000 nodes or just every call?
  // Every call is safer but slightly slower. Let's do every call for simplicity and safety.
  if ((Date.now() - startTime) > timeLimit) {
    throw new Error('Timeout');
  }

  if (depth === 0 || gameState.isCheckmate || gameState.isStalemate) {
    if (gameState.isCheckmate) {
      // Prioritize quicker checkmates
      return isMaximizing ? -100000 - depth : 100000 + depth;
    }
    if (gameState.isStalemate) {
      return 0;
    }
    return evaluateBoard(gameState.board);
  }

  const moves = getAllLegalMoves(gameState);

  // Basic Move Ordering (captures first) to improve Alpha-Beta efficiency
  moves.sort((a, b) => {
    const aCap = a.captured ? 1 : 0;
    const bCap = b.captured ? 1 : 0;
    return bCap - aCap;
  });

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const move of moves) {
      const newState = makeMove(gameState, move);
      const score = minimax(newState, depth - 1, alpha, beta, false, startTime, timeLimit);
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const move of moves) {
      const newState = makeMove(gameState, move);
      const score = minimax(newState, depth - 1, alpha, beta, true, startTime, timeLimit);
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minScore;
  }
}
