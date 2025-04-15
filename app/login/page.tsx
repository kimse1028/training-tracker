'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Container, Paper, Typography, CircularProgress } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../../context/AuthContext';
import Image from "next/image";

export default function LoginPage() {
    const { user, loading, signInWithGoogle } = useAuth();
    const router = useRouter();
    const [logoLoaded, setLogoLoaded] = useState(false);

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

    // 이미지 로드 완료 핸들러
    const handleImageLoad = () => {
        setLogoLoaded(true);
    };

    if (loading) {
        return (
            <Container maxWidth="sm" sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, rgba(14, 14, 16, 0.95) 0%, rgba(23, 23, 30, 0.98) 100%)'
            }}>
                <CircularProgress sx={{ color: '#9147ff' }} />
            </Container>
        );
    }

    return (
        <Container
            maxWidth={false}
            disableGutters
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0e0e10 0%, #17171e 100%)',
                backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(145, 71, 255, 0.1) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(0, 181, 173, 0.1) 0%, transparent 20%)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* 배경 효과 */}
            <Box sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backgroundImage: 'radial-gradient(rgba(145, 71, 255, 0.1) 1px, transparent 1px), radial-gradient(rgba(0, 181, 173, 0.1) 1px, transparent 1px)',
                backgroundSize: '20px 20px, 30px 30px',
                backgroundPosition: '0 0, 10px 10px',
                opacity: 0.1,
                mixBlendMode: 'overlay',
                pointerEvents: 'none'
            }} />

            <Paper
                elevation={6}
                sx={{
                    p: { xs: 3, sm: 5 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(145, 71, 255, 0.2)',
                    background: 'rgba(31, 31, 35, 0.7)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 15px rgba(145, 71, 255, 0.3)',
                    borderRadius: 3,
                    width: '90%',
                    maxWidth: 550,
                    position: 'relative',
                    zIndex: 10
                }}
            >
                <Box
                    sx={{
                        mb: 4,
                        mt: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        width: '100%',
                        maxWidth: '400px',
                        position: 'relative',
                        minHeight: '80px',
                    }}
                >
                    {!logoLoaded && (
                        <Box sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)'
                        }}>
                            <CircularProgress size={24} sx={{ color: '#9147ff' }} />
                        </Box>
                    )}
                    <Box
                        sx={{
                            width: '100%',
                            position: 'relative',
                            opacity: logoLoaded ? 1 : 0,
                            transition: 'opacity 0.3s ease',
                        }}
                    >
                        <Image
                            src="/game-gym.png"
                            alt="Game Gym Logo"
                            layout="responsive"
                            width={300}
                            height={100}
                            priority
                            onLoad={handleImageLoad}
                            style={{
                                filter: 'drop-shadow(0 0 8px rgba(145, 71, 255, 0.5))',
                                maxWidth: '100%',
                                height: 'auto',
                            }}
                        />
                    </Box>
                </Box>

                <Typography
                    variant="h6"
                    sx={{
                        mb: 4,
                        textAlign: 'center',
                        color: '#efeff1',
                        fontWeight: 600,
                        lineHeight: 1.5,
                        textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
                    }}
                >
                    게임 훈련과 성장을 위한<br />
                    <Box component="span" sx={{
                        background: 'linear-gradient(45deg, #9147ff 30%, #00b5ad 90%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 700
                    }}>
                        최고의 트레이닝 플랫폼
                    </Box>
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
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        background: 'linear-gradient(45deg, #9147ff 30%, #00b5ad 90%)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 0 15px rgba(145, 71, 255, 0.3)',
                        '&:hover': {
                            boxShadow: '0 0 25px rgba(145, 71, 255, 0.5)',
                            background: 'linear-gradient(45deg, #8036e5 30%, #00a29b 90%)',
                            transform: 'translateY(-2px)',
                            transition: 'all 0.3s',
                        },
                        position: 'relative',
                        overflow: 'hidden',
                        '&:after': {
                            content: '""',
                            position: 'absolute',
                            top: '-50%',
                            left: '-50%',
                            width: '200%',
                            height: '200%',
                            background: 'linear-gradient(rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0))',
                            transform: 'rotate(30deg)',
                            opacity: 0,
                            transition: 'opacity 0.3s',
                        },
                        '&:hover:after': {
                            opacity: 0.1,
                        }
                    }}
                >
                    Google로 로그인
                </Button>

                {/* 추가 정보/설명 */}
                <Typography
                    variant="caption"
                    sx={{
                        mt: 4,
                        color: '#adadb8',
                        textAlign: 'center',
                        opacity: 0.8,
                        fontSize: { xs: '0.65rem', sm: '0.75rem' }
                    }}
                >
                    로그인하여 게임 훈련 세션을 추가하고<br />
                    최고의 퍼포먼스를 달성하세요
                </Typography>
            </Paper>
        </Container>
    );
}