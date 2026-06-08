import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import LoginGate from './pages/LoginGate';
import HomePage from './pages/HomePage';

export default function App() {
  const { isLoggedIn, loading, login, logout } = useAuth();
  const { theme, cycle, info } = useTheme();
  const [transitioning, setTransitioning] = useState(false);

  // 登录成功后先显示过渡动画，再切到首页
  useEffect(() => {
    if (isLoggedIn) {
      setTransitioning(true);
      const t = setTimeout(() => setTransitioning(false), 800);
      return () => clearTimeout(t);
    }
  }, [isLoggedIn]);

  return (
    <AnimatePresence mode="wait">
      {!isLoggedIn || transitioning ? (
        <motion.div
          key="gate"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          {transitioning ? (
            <div className="h-full flex items-center justify-center bg-[#FFF5F0]">
              <motion.div
                className="text-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.p
                  className="text-6xl mb-4"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >🍽️</motion.p>
                <p className="text-[#B0887A] text-sm">准备中...</p>
              </motion.div>
            </div>
          ) : (
            <LoginGate onLogin={login} loading={loading} theme={theme} onCycleTheme={cycle} themeInfo={info} />
          )}
        </motion.div>
      ) : (
        <motion.div
          key="home"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="h-full"
        >
          <HomePage onLogout={logout} theme={theme} onCycleTheme={cycle} themeInfo={info} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
