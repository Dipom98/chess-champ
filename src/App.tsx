import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';
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
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    CapacitorApp.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
      // If modal is open, close it
      if (showExitModal) {
        setShowExitModal(false);
        return;
      }

      const path = location.pathname;
      const isExitRoot = path === '/home' || path === '/' || path === '/welcome';

      if (isExitRoot) {
        setShowExitModal(true);
      } else {
        if (canGoBack) {
          navigate(-1);
        } else {
          navigate('/home');
        }
      }
    });

    const initNotifications = async () => {
      const { supabase } = await import('@/systems/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      const { initializeNotifications } = await import('@/systems/notifications');

      // Initialize even for local users so they see the permission popup
      await initializeNotifications(user?.id || 'local-user');

      if (user) {
        const { initializeRealtime } = await import('@/systems/realtime');
        initializeRealtime(user.id);
      }
    };

    initNotifications();

    return () => {
      CapacitorApp.removeAllListeners();
      import('@/systems/realtime').then(m => m.stopRealtime());
    };
  }, [navigate, location]);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-indigo-950 relative overflow-hidden">
      <AppRoutes />

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-6"
            onClick={() => setShowExitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-indigo-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-6 text-center"
            >
              <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto">
                <LogOut size={40} className="text-amber-400" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Exit Game?</h2>
                <p className="text-white/60">Are you sure you want to exit Chess Champ?</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitModal(false)}
                  className="flex-1 py-4 glass rounded-2xl text-white font-bold hover:bg-white/10 transition-all"
                >
                  Stay
                </button>
                <button
                  onClick={() => CapacitorApp.exitApp()}
                  className="flex-1 py-4 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl text-white font-bold shadow-lg shadow-red-500/20"
                >
                  Exit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
