'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Container,
    CircularProgress,
    Typography
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import NewTrainingForm from '@/components/NewTrainingForm';

export default function AddTrainingPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            // 인증되지 않은 사용자는 로그인 페이지로 리디렉션
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ textAlign: 'center', mt: 10 }}>
                <CircularProgress sx={{ color: '#9147ff' }} />
                <Typography sx={{ mt: 2 }}>로딩 중...</Typography>
            </Container>
        );
    }

    if (!user) {
        return null; // 로딩 중이 아니고 사용자가 없으면 리디렉션 전에 빈 화면을 표시
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 6
            }}>
                <Typography variant="h3" sx={{
                    mb: 4,
                    color: '#efeff1',
                    textShadow: '0 0 10px rgba(145, 71, 255, 0.5)'
                }}>
                    Game Gym
                </Typography>

                <NewTrainingForm />
            </Box>
        </Container>
    );
}