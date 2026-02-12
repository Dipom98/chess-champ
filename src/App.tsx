import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { WelcomeScreen } from '@/pages/WelcomeScreen';
import { HomeScreen } from '@/pages/HomeScreen';
import { PlayScreen } from '@/pages/PlayScreen';
import { GameScreen } from '@/pages/GameScreen';
import { FriendsScreen } from '@/pages/FriendsScreen';
import { HistoryScreen } from '@/pages/HistoryScreen';
import { SettingsScreen } from '@/pages/SettingsScreen';
import { InstructionsScreen } from '@/pages/InstructionsScreen';
import { PuzzlesScreen } from '@/screens/PuzzlesScreen';
import { RankedScreen } from '@/pages/RankedScreen';
import { WalletScreen } from '@/pages/WalletScreen';

function AppRoutes() {
  const { hasSeenWelcome } = useGameStore();

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          hasSeenWelcome 
            ? <Navigate to="/home" replace /> 
            : <Navigate to="/welcome" replace />
        } 
      />
      <Route path="/welcome" element={<WelcomeScreen />} />
      <Route path="/home" element={<HomeScreen />} />
      <Route path="/play" element={<PlayScreen />} />
      <Route path="/game" element={<GameScreen />} />
      <Route path="/friends" element={<FriendsScreen />} />
      <Route path="/history" element={<HistoryScreen />} />
      <Route path="/settings" element={<SettingsScreen />} />
      <Route path="/instructions" element={<InstructionsScreen />} />
      <Route path="/puzzles" element={<PuzzlesScreen />} />
      <Route path="/ranked" element={<RankedScreen />} />
      <Route path="/wallet" element={<WalletScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <HashRouter>
      <div className="max-w-md mx-auto min-h-screen bg-indigo-950 relative overflow-hidden">
        <AppRoutes />
      </div>
    </HashRouter>
  );
}
