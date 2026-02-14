import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Gamepad2, Users, History, Settings, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  showTabs?: boolean;
  rightAction?: ReactNode;
  leftAction?: ReactNode;
  onBack?: () => void;
}

export function MobileLayout({
  children,
  title,
  showBack = false,
  showTabs = true,
  rightAction,
  leftAction,
  onBack
}: MobileLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/play', icon: Gamepad2, label: 'Play' },
    { path: '/friends', icon: Users, label: 'Friends' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    // Fixed height wrapper with safe area support
    <div className="fixed inset-0 h-[100dvh] w-full bg-gradient-to-br from-[#0f0a1e] via-[#1a1333] to-[#0d1b2a] flex flex-col overflow-hidden">
      {/* Background decorations - Lower z-index */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header - Fixed at top, z-index above content */}
      {(title || showBack) && (
        <header className="flex-none relative z-50 flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 glass-dark">
          <div className="flex items-center gap-3">
            {leftAction}
            {showBack && !leftAction && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onBack ? onBack() : navigate(-1)}
                className="p-2 -ml-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={24} />
              </motion.button>
            )}
            {title && (
              <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
            )}
          </div>
          {rightAction}
        </header>
      )}

      {/* Main Content - Scrollable area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 w-full no-scrollbar">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn(
            "min-h-full p-4",
            showTabs ? "pb-24" : "pb-[calc(env(safe-area-inset-bottom)+1rem)]"
          )}
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation - Fixed at bottom, z-index above content */}
      {showTabs && (
        <nav className="flex-none relative z-50 glass-dark pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
          <div className="flex justify-around items-center py-2 px-2">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.path ||
                (tab.path === '/home' && location.pathname === '/') ||
                (tab.path === '/play' && location.pathname === '/game');
              return (
                <motion.button
                  key={tab.path}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate(tab.path)}
                  className={cn(
                    'tap-target relative flex flex-col items-center justify-center transition-all px-4',
                    isActive ? 'text-amber-400' : 'text-white/40 hover:text-white/60'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBg"
                      className="absolute inset-0 bg-amber-500/15 rounded-2xl"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <tab.icon size={22} strokeWidth={isActive ? 2.5 : 1.5} className="relative z-10" />
                  <span className={cn(
                    "text-[10px] font-medium relative z-10 transition-all",
                    isActive && "font-semibold"
                  )}>
                    {tab.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
