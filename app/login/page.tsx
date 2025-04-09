'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Container, Paper, Typography } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
    const { user, loading, signInWithGoogle } = useAuth();
    const router = useRouter();

    // 이미 로그인된 사용자는 홈으로 리디렉션
    useEffect(() => {
        if (!loading && user) {
            router.push('/');
        }
    }, [user, loading, router]);

    // 구글 로그인 버튼 클릭 핸들러
    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error('로그인 실패:', error);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Typography>로딩 중...</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Paper
                elevation={6}
                sx={{
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(111, 0, 255, 0.3)',
                    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
                    borderRadius: 4,
                    width: '100%',
                    maxWidth: 400,
                }}
            >
                <Typography variant="h4" component="h1" gutterBottom sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(45deg, #6f00ff, #00f7ff)',
                    backgroundClip: 'text',
                    textFillColor: 'transparent',
                    mb: 3
                }}>
                    TRAINING TRACKER
                </Typography>

                <Typography variant="h6" sx={{ mb: 4, textAlign: 'center' }}>
                    트레이닝 플랫폼에 오신 것을 환영합니다
                </Typography>

                <Button
                    variant="contained"
                    size="large"
                    startIcon={<GoogleIcon />}
                    onClick={handleGoogleSignIn}
                    sx={{
                        py: 1.5,
                        px: 4,
                        borderRadius: 2,
                        fontSize: '1rem',
                        background: 'linear-gradient(45deg, #6f00ff 30%, #00f7ff 90%)',
                        border: '2px solid rgba(0, 247, 255, 0.5)',
                        boxShadow: '0 0 10px rgba(111, 0, 255, 0.5)',
                        '&:hover': {
                            boxShadow: '0 0 20px rgba(111, 0, 255, 0.8)',
                            background: 'linear-gradient(45deg, #7c1aff 30%, #19faff 90%)',
                            transform: 'translateY(-2px)',
                            transition: 'all 0.3s',
                        },
                    }}
                >
                    Google로 로그인
                </Button>
            </Paper>
        </Container>
    );
}