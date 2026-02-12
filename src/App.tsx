import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
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

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      // If we're on the home screen or welcome screen, minimize/exit
      if (location.pathname === '/home' || location.pathname === '/' || location.pathname === '/welcome') {
        CapacitorApp.exitApp();
      } else {
        // Otherwise go back if possible
        if (canGoBack) {
          navigate(-1);
        } else {
          // If can't go back in history, maybe just navigate home
          navigate('/home');
        }
      }
    });

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, [navigate, location]);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Request notification permissions
        if (CapacitorApp) {
          const { PushNotifications } = await import('@capacitor/push-notifications');
          const status = await PushNotifications.checkPermissions();
          if (status.receive === 'prompt') {
            await PushNotifications.requestPermissions();
          }
        }
      } catch (e) {
        console.log('Push notifications not available or failed', e);
      }
    };

    checkPermissions();
  }, []);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-indigo-950 relative overflow-hidden">
      <AppRoutes />
    </div>
  );
}

export function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
