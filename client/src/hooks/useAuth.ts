import { useEffect, useMemo, useState } from 'react';
import jwtDecode from 'jwt-decode';

type Decoded = { sub: string; email: string; role: 'doctor' | 'patient'; exp: number };

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('accessToken'));
  const user = useMemo(() => {
    if (!token) return null;
    try {
      const decoded = jwtDecode<Decoded>(token);
      if (decoded.exp * 1000 < Date.now()) return null;
      return { id: decoded.sub, email: decoded.email, role: decoded.role };
    } catch {
      return null;
    }
  }, [token]);

  useEffect(() => {
    const handler = () => setToken(localStorage.getItem('accessToken'));
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const login = (accessToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    setToken(accessToken);
  };
  const logout = () => {
    localStorage.removeItem('accessToken');
    setToken(null);
  };

  return { user, token, login, logout };
}




