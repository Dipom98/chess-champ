import { Piece } from '@/chess/types';

interface ChessPieceProps {
  piece: Piece;
}

const pieceSymbols: Record<string, string> = {
  'white-king': '♔',
  'white-queen': '♕',
  'white-rook': '♖',
  'white-bishop': '♗',
  'white-knight': '♘',
  'white-pawn': '♙',
  'black-king': '♚',
  'black-queen': '♛',
  'black-rook': '♜',
  'black-bishop': '♝',
  'black-knight': '♞',
  'black-pawn': '♟',
};

export function ChessPiece({ piece }: ChessPieceProps) {
  const symbol = pieceSymbols[`${piece.color}-${piece.type}`];
  
  return (
    <span 
      className={`text-4xl sm:text-5xl md:text-6xl select-none drop-shadow-md ${
        piece.color === 'white' ? 'text-white' : 'text-gray-900'
      }`}
      style={{ 
        textShadow: piece.color === 'white' 
          ? '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)' 
          : '1px 1px 2px rgba(255,255,255,0.5)' 
      }}
    >
      {symbol}
    </span>
  );
}
