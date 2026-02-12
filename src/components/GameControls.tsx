import { cn } from '@/utils/cn';

interface GameControlsProps {
  isVsComputer: boolean;
  computerColor: 'white' | 'black';
  currentPlayer: 'white' | 'black';
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isComputerThinking: boolean;
  onNewGame: () => void;
  onToggleMode: () => void;
  onFlipBoard: () => void;
  onChangeComputerColor: () => void;
}

export function GameControls({
  isVsComputer,
  computerColor,
  currentPlayer,
  isCheck,
  isCheckmate,
  isStalemate,
  isComputerThinking,
  onNewGame,
  onToggleMode,
  onFlipBoard,
  onChangeComputerColor,
}: GameControlsProps) {
  const getStatusText = () => {
    if (isCheckmate) {
      const winner = currentPlayer === 'white' ? 'Black' : 'White';
      return `Checkmate! ${winner} wins!`;
    }
    if (isStalemate) {
      return 'Stalemate! Draw!';
    }
    if (isComputerThinking) {
      return 'Computer is thinking...';
    }
    if (isCheck) {
      return `${currentPlayer === 'white' ? 'White' : 'Black'} is in check!`;
    }
    return `${currentPlayer === 'white' ? 'White' : 'Black'}'s turn`;
  };

  const statusColor = isCheckmate 
    ? 'text-red-500' 
    : isStalemate 
    ? 'text-yellow-500' 
    : isCheck 
    ? 'text-orange-500' 
    : 'text-white';

  return (
    <div className="flex flex-col gap-4 w-full max-w-xs">
      {/* Status */}
      <div className={cn('text-xl font-bold text-center p-3 bg-gray-800 rounded-lg', statusColor)}>
        {getStatusText()}
      </div>

      {/* Turn indicator */}
      <div className="flex items-center justify-center gap-3 p-3 bg-gray-800 rounded-lg">
        <div className={cn(
          'w-6 h-6 rounded-full border-2',
          currentPlayer === 'white' ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-600'
        )} />
        <span className="text-white font-medium">
          {currentPlayer === 'white' ? 'White' : 'Black'} to move
        </span>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onNewGame}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
        >
          New Game
        </button>
        <button
          onClick={onFlipBoard}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Flip Board
        </button>
        <button
          onClick={onToggleMode}
          className={cn(
            'px-4 py-2 font-medium rounded-lg transition-colors col-span-2',
            isVsComputer ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700',
            'text-white'
          )}
        >
          {isVsComputer ? '🤖 vs Computer' : '👥 Two Players'}
        </button>
        {isVsComputer && (
          <button
            onClick={onChangeComputerColor}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors col-span-2"
          >
            Computer plays: {computerColor === 'white' ? 'White' : 'Black'}
          </button>
        )}
      </div>
    </div>
  );
}
