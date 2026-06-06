import { useState, useCallback } from 'react';
import { login as loginApi } from '../api/endpoints';

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (nickname?: string) => {
    setLoading(true);
    try {
      // 复用已有设备ID，保证同一设备始终同一用户
      let deviceId = localStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = 'guest_' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem('device_id', deviceId);
      }
      const res: any = await loginApi(deviceId, nickname || '吃货本人');
      const t = res.data.token;
      localStorage.setItem('token', t);
      setToken(t);
      setUser(res.data.user);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const isLoggedIn = !!token;

  return { isLoggedIn, user, loading, login, logout };
}
