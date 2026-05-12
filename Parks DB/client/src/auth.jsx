// Auth context — holds current user, login/register/logout helpers. The
// access token is stored as an HttpOnly cookie by the server; we also keep
// a copy in memory so the api.js wrapper can attach Authorization headers
// if needed.
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser]       = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { user } = await api.get('/auth/me');
                if (!cancelled) setUser(user);
            } catch {
                // Not authenticated — that's fine.
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const login = useCallback(async (email, password) => {
        const { user } = await api.post('/auth/login', { email, password });
        setUser(user);
        return user;
    }, []);

    const register = useCallback(async (data) => {
        const { user } = await api.post('/auth/register', data);
        setUser(user);
        return user;
    }, []);

    const logout = useCallback(async () => {
        try { await api.post('/auth/logout'); } catch {}
        setUser(null);
    }, []);

    return (
        <AuthCtx.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthCtx.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthCtx);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
