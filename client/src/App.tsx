import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import LoginGate from './pages/LoginGate';
import HomePage from './pages/HomePage';

export default function App() {
  const { isLoggedIn, loading, login, logout } = useAuth();
  const { theme, cycle, info } = useTheme();

  if (!isLoggedIn) {
    return <LoginGate onLogin={login} loading={loading} theme={theme} onCycleTheme={cycle} themeInfo={info} />;
  }

  return <HomePage onLogout={logout} theme={theme} onCycleTheme={cycle} themeInfo={info} />;
}
