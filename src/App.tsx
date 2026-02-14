import { useState, useEffect, useRef } from 'react';
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
import { SplashScreen } from '@/components/SplashScreen';
import { UnlockModal } from '@/components/UnlockModal';

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

import { audioManager } from '@/systems/audio';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showExitModal, setShowExitModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const locationRef = useRef(location.pathname);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Initial check for background music
    const settings = useGameStore.getState().settings;
    if (settings.backgroundMusicEnabled) {
      audioManager.playBackground();
    }

    // Subscribe to changes
    const unsub = useGameStore.subscribe((state, prevState) => {
      if (state.settings.backgroundMusicEnabled !== prevState.settings.backgroundMusicEnabled) {
        audioManager.toggleBackground(state.settings.backgroundMusicEnabled);
      }
    });

    return () => {
      unsub();
      audioManager.stopBackground();
    }
  }, []);

  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    const backButtonHandler = CapacitorApp.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
      if (showExitModal) {
        setShowExitModal(false);
        return;
      }

      const path = locationRef.current;
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

    // Handle App Lifecycle (Background/Foreground)
    const appStateChangeHandler = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        // App went to background
        audioManager.pauseBackground();
      } else {
        // App returned to foreground
        // We use resumeBackground which checks if it should be playing based on settings
        audioManager.resumeBackground();
      }
    });

    const runInitialization = async () => {
      if (isInitialized.current) return;
      isInitialized.current = true;

      try {
        const { supabase } = await import('@/systems/supabase');
        const { data: { user } } = await supabase.auth.getUser();
        const { initializeNotifications } = await import('@/systems/notifications');

        await initializeNotifications(user?.id || 'local-user');

        if (user) {
          const { initializeRealtime } = await import('@/systems/realtime');
          initializeRealtime(user.id);
        }
      } catch (err) {
        console.error('[App] Initialization error:', err);
      } finally {
        // Ensure splash screen shows for at least 3 seconds for brand presence
        setTimeout(() => setIsLoading(false), 3000);
      }
    };

    runInitialization();

    return () => {
      backButtonHandler.then(h => h.remove());
      appStateChangeHandler.then(h => h.remove());
      import('@/systems/realtime').then(m => m.stopRealtime());
    };
  }, [navigate, showExitModal]);

  return (
    <div className="max-w-md mx-auto min-h-screen animate-gradient-bg relative overflow-hidden">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <SplashScreen key="global-splash" onComplete={() => setIsLoading(false)} />
        ) : (
          <AppRoutes key="app-routes" />
        )}
      </AnimatePresence>

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

      <UnlockModal />
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
