import { PieceType, PieceColor } from '@/chess/types';
import { ChessPiece } from './ChessPiece';

interface PromotionModalProps {
  color: PieceColor;
  onSelect: (pieceType: PieceType) => void;
}

export function PromotionModal({ color, onSelect }: PromotionModalProps) {
  const pieces: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-2xl">
        <h3 className="text-lg font-bold mb-4 text-center">Choose Promotion</h3>
        <div className="flex gap-2">
          {pieces.map((type) => (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className="w-16 h-16 flex items-center justify-center bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors border-2 border-amber-300"
            >
              <ChessPiece piece={{ type, color }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
