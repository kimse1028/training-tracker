'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../lib/firebase';

// 인증 컨텍스트 타입 정의
interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

// 기본값으로 빈 컨텍스트 생성
const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signInWithGoogle: async () => {},
    logout: async () => {},
});

// 인증 컨텍스트 제공자 props 타입
interface AuthProviderProps {
    children: ReactNode;
}

// 인증 컨텍스트 제공자 컴포넌트
export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // Google 로그인 함수
    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error('Google 로그인 오류:', error);
        }
    };

    // 로그아웃 함수
    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('로그아웃 오류:', error);
        }
    };

    // 사용자 인증 상태 감시
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        // 컴포넌트 언마운트 시 구독 해제
        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// 커스텀 훅으로 인증 컨텍스트 사용
export const useAuth = () => useContext(AuthContext);