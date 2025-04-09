'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Container, Typography, Paper, Grid, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import {db} from "@/lib/firebase";
import {useAuth} from "@/context/AuthContext";

export default function Home() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [trainingSessions, setTrainingSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // 사용자의 훈련 세션 가져오기
    useEffect(() => {
        const fetchTrainingSessions = async () => {
            if (!user) return;

            try {
                setLoadingSessions(true);
                const q = query(
                    collection(db, 'trainingSessions'),
                    where('userId', '==', user.uid),
                    orderBy('createdAt', 'desc')
                );

                const querySnapshot = await getDocs(q);
                const sessions = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate()
                }));

                setTrainingSessions(sessions);
            } catch (error) {
                console.error('훈련 세션 조회 오류:', error);
            } finally {
                setLoadingSessions(false);
            }
        };

        fetchTrainingSessions();
    }, [user]);

    const handleAddTrainingSession = () => {
        router.push('/training/add');
    };

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
                    mb: 2,
                    color: '#efeff1',
                    textShadow: '0 0 10px rgba(145, 71, 255, 0.5)'
                }}>
                    <SportsEsportsIcon sx={{ mr: 1, mb: -0.5, fontSize: 36 }} />
                    Training Tracker
                </Typography>

                <Typography variant="h6" sx={{ mb: 1, color: '#adadb8' }}>
                    안녕하세요, {user.displayName || '사용자'}님!
                </Typography>

                <Typography variant="body1" sx={{ mb: 4, color: '#adadb8', textAlign: 'center' }}>
                    게임 훈련 세션을 관리하고 최고의 퍼포먼스를 달성하세요.
                </Typography>

                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleAddTrainingSession}
                    sx={{
                        mb: 5,
                        py: 1.5,
                        px: 3,
                    }}
                >
                    새 훈련 세션 추가
                </Button>

                {/* 훈련 세션 목록 */}
                <Box sx={{ width: '100%', mt: 2 }}>
                    <Typography variant="h5" sx={{
                        mb: 3,
                        color: '#efeff1',
                        fontWeight: 600
                    }}>
                        내 훈련 세션
                    </Typography>

                    {loadingSessions ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                            <CircularProgress size={30} sx={{ color: '#9147ff' }} />
                        </Box>
                    ) : trainingSessions.length > 0 ? (
                        <Grid container spacing={3}>
                            {trainingSessions.map((session) => (
                                <Grid item xs={12} sm={6} md={4} key={session.id}>
                                    <Paper
                                        elevation={3}
                                        sx={{
                                            p: 3,
                                            height: '100%',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            '&::before': {
                                                content: '""',
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '4px',
                                                height: '100%',
                                                backgroundColor: '#9147ff',
                                            }
                                        }}
                                    >
                                        <Typography variant="h6" sx={{ color: '#efeff1' }}>
                                            {session.name}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 1, color: '#adadb8', height: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {session.content}
                                        </Typography>
                                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="body2" sx={{
                                                color: '#00b5ad',
                                                display: 'flex',
                                                alignItems: 'center',
                                                fontWeight: 600
                                            }}>
                                                {session.duration}분
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#adadb8' }}>
                                                {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : '날짜 없음'}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Paper
                            sx={{
                                p: 4,
                                textAlign: 'center',
                                color: '#adadb8',
                                border: '1px dashed rgba(145, 71, 255, 0.3)',
                            }}
                        >
                            <Typography>등록된 훈련 세션이 없습니다. 새로운 훈련 세션을 추가해보세요!</Typography>
                        </Paper>
                    )}
                </Box>

                <Button
                    variant="outlined"
                    color="secondary"
                    onClick={logout}
                    sx={{
                        mt: 6,
                    }}
                >
                    로그아웃
                </Button>
            </Box>
        </Container>
    );
}