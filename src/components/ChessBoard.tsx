import { cn } from '@/utils/cn';
import { Board, Move, Position } from '@/chess/types';
import { ChessPiece } from './ChessPiece';

interface ChessBoardProps {
  board: Board;
  selectedSquare: Position | null;
  legalMoves: Move[];
  lastMove: Move | null;
  isCheck: boolean;
  currentPlayer: 'white' | 'black';
  onSquareClick: (pos: Position) => void;
  flipped?: boolean;
}

export function ChessBoard({
  board,
  selectedSquare,
  legalMoves,
  lastMove,
  isCheck,
  currentPlayer,
  onSquareClick,
  flipped = false,
}: ChessBoardProps) {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const isLegalMove = (row: number, col: number) => {
    return legalMoves.some(m => m.to.row === row && m.to.col === col);
  };

  const isLastMoveSquare = (row: number, col: number) => {
    if (!lastMove) return false;
    return (
      (lastMove.from.row === row && lastMove.from.col === col) ||
      (lastMove.to.row === row && lastMove.to.col === col)
    );
  };

  const isKingInCheck = (row: number, col: number) => {
    const piece = board[row][col];
    return isCheck && piece?.type === 'king' && piece?.color === currentPlayer;
  };

  const renderBoard = () => {
    const rows = flipped ? [...Array(8).keys()] : [...Array(8).keys()].reverse();
    const cols = flipped ? [...Array(8).keys()].reverse() : [...Array(8).keys()];

    return rows.map((displayRow, rowIndex) => (
      <div key={displayRow} className="flex">
        {cols.map((displayCol, colIndex) => {
          const row = flipped ? 7 - displayRow : displayRow;
          const col = flipped ? 7 - displayCol : displayCol;
          const piece = board[row][col];
          const isLight = (row + col) % 2 === 0;
          const isSelected = selectedSquare?.row === row && selectedSquare?.col === col;
          const canMove = isLegalMove(row, col);
          const isCapture = canMove && piece !== null;

          return (
            <div
              key={`${row}-${col}`}
              className={cn(
                'relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center cursor-pointer transition-colors',
                isLight ? 'bg-amber-100' : 'bg-amber-700',
                isSelected && 'bg-yellow-400',
                isLastMoveSquare(row, col) && !isSelected && (isLight ? 'bg-yellow-200' : 'bg-yellow-600'),
                isKingInCheck(row, col) && 'bg-red-500'
              )}
              onClick={() => onSquareClick({ row, col })}
            >
              {/* Rank label */}
              {colIndex === 0 && (
                <span className={cn(
                  'absolute top-0.5 left-0.5 text-xs font-semibold',
                  isLight ? 'text-amber-700' : 'text-amber-100'
                )}>
                  {ranks[flipped ? 7 - rowIndex : rowIndex]}
                </span>
              )}
              {/* File label */}
              {rowIndex === 7 && (
                <span className={cn(
                  'absolute bottom-0.5 right-0.5 text-xs font-semibold',
                  isLight ? 'text-amber-700' : 'text-amber-100'
                )}>
                  {files[flipped ? 7 - colIndex : colIndex]}
                </span>
              )}

              {/* Legal move indicator */}
              {canMove && !isCapture && (
                <div className="absolute w-4 h-4 rounded-full bg-black/20" />
              )}
              {canMove && isCapture && (
                <div className="absolute inset-0 border-4 border-black/20 rounded-full" />
              )}

              {/* Piece */}
              {piece && <ChessPiece piece={piece} />}
            </div>
          );
        })}
      </div>
    ));
  };

  return (
    <div className="inline-block border-4 border-amber-900 rounded-lg shadow-2xl">
      {renderBoard()}
    </div>
  );
}
