import { Piece } from '@/chess/types';
import { ChessPiece } from './ChessPiece';

interface CapturedPiecesProps {
  pieces: Piece[];
  color: 'white' | 'black';
}

export function CapturedPieces({ pieces, color }: CapturedPiecesProps) {
  const sortedPieces = [...pieces].sort((a, b) => {
    const order = { queen: 0, rook: 1, bishop: 2, knight: 3, pawn: 4, king: 5 };
    return order[a.type] - order[b.type];
  });

  return (
    <div className="flex flex-wrap gap-1 min-h-[2rem]">
      {sortedPieces.map((piece, index) => (
        <div key={index} className="text-2xl">
          <ChessPiece piece={piece} />
        </div>
      ))}
      {pieces.length === 0 && (
        <span className="text-gray-400 text-sm">
          No {color} pieces captured
        </span>
      )}
    </div>
  );
}
