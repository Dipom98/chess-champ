import { Move } from '@/chess/types';

interface MoveHistoryProps {
  moves: Move[];
}

export function MoveHistory({ moves }: MoveHistoryProps) {
  const movePairs: { number: number; white?: string; black?: string }[] = [];
  
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i]?.notation,
      black: moves[i + 1]?.notation,
    });
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 w-full max-w-xs">
      <h3 className="text-white font-bold mb-3 text-lg">Move History</h3>
      <div className="max-h-80 overflow-y-auto">
        {movePairs.length === 0 ? (
          <p className="text-gray-400 text-sm">No moves yet</p>
        ) : (
          <div className="space-y-1">
            {movePairs.map((pair) => (
              <div key={pair.number} className="flex text-sm">
                <span className="text-gray-500 w-8">{pair.number}.</span>
                <span className="text-white w-16">{pair.white || ''}</span>
                <span className="text-white w-16">{pair.black || ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
