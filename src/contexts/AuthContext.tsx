import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { authApi } from '../lib/api';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, username?: string) => Promise<void>;
    verifyOtp: (email: string, token: string) => Promise<void>;
    updateUserMetadata: (data: Record<string, any>) => Promise<void>;
    uploadAvatar: (file: File) => Promise<string>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 获取初始 session
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            setSession(s);
            setUser(s?.user ?? null);
            setLoading(false);
        });

        // 监听认证状态变化
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
            setSession(s);
            setUser(s?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        await authApi.signIn(email, password);
    }, []);

    const signUp = useCallback(async (email: string, password: string, username?: string) => {
        await authApi.signUp(email, password, username);
    }, []);

    const verifyOtp = useCallback(async (email: string, token: string) => {
        const data = await authApi.verifyOtp(email, token);
        if (data.session) {
            setSession(data.session);
            setUser(data.user);
        }
    }, []);

    const signOut = useCallback(async () => {
        await authApi.signOut();
        setUser(null);
        setSession(null);
    }, []);

    const updateUserMetadata = useCallback(async (data: Record<string, any>) => {
        const updatedUser = await authApi.updateUserMetadata(data);
        setUser(updatedUser);
    }, []);

    const uploadAvatar = useCallback(async (file: File) => {
        return await authApi.uploadAvatar(file);
    }, []);

    return (
        <AuthContext.Provider value={{ user, session, loading, signIn, signUp, verifyOtp, updateUserMetadata, uploadAvatar, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
