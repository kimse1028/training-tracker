import { AuthProvider } from '@/context/AuthContext';
import type { Metadata } from 'next';
import EmotionCache from '../lib/EmotionCache';
import ThemeRegistry from '../lib/ThemeRegistry';
import './globals.css';

export const metadata: Metadata = {
    icons: {
        icon: '/favicon.png'
    },
    title: 'GameGym - 게임 실력 향상을 위한 트레이닝 플랫폼',
    description: '게임 훈련과 성장을 위한 최고의 트레이닝 플랫폼',
    openGraph: {
        title: 'GameGym - 게임 실력 향상을 위한 트레이닝 플랫폼',
        description: '게임 훈련과 성장을 위한 최고의 트레이닝 플랫폼',
        url: 'https://www.gamegym.kr',
        siteName: 'GameGym',
        images: [
            {
                url: 'https://www.gamegym.kr/game-gym.png',
                width: 1200,
                height: 630,
                alt: 'GameGym',
            },
        ],
        locale: 'ko_KR',
        type: 'website',
    },
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko">
        <body>
        <EmotionCache>
            <ThemeRegistry>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </ThemeRegistry>
        </EmotionCache>
        </body>
        </html>
    );
}