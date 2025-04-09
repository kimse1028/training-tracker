import { AuthProvider } from '../context/AuthContext';
import type { Metadata } from 'next';
import EmotionCache from '../lib/EmotionCache';
import ThemeRegistry from '../lib/ThemeRegistry';
import './globals.css';

export const metadata: Metadata = {
    title: 'Training Tracker',
    description: '게이밍 컨셉의 트레이닝 추적 앱',
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