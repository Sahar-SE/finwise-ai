import { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('finwise_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('finwise_token');
    if (!token) {
      setLoading(false);
      return;
    }
    client.get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('finwise_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem('finwise_token');
        localStorage.removeItem('finwise_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const res = await client.post('/auth/login', { email, password });
    localStorage.setItem('finwise_token', res.data.token);
    localStorage.setItem('finwise_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }

  async function register(username, email, password) {
    const res = await client.post('/auth/register', { username, email, password });
    localStorage.setItem('finwise_token', res.data.token);
    localStorage.setItem('finwise_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }

  function logout() {
    client.post('/auth/logout').catch(() => {});
    localStorage.removeItem('finwise_token');
    localStorage.removeItem('finwise_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
