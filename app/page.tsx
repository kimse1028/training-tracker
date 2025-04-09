'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Button,
    Container,
    Typography,
    Paper,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Checkbox,
    FormControlLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ko';
import { useAuth } from '@/context/AuthContext';
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    updateDoc,
    doc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TrainingSession, FirestoreTrainingSession } from '@/lib/types';
import CustomCalendar from '@/components/CustomCalendar';

// 로케일 설정
dayjs.locale('ko');

export default function Home() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
    const [loadingSessions, setLoadingSessions] = useState<boolean>(false);
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
    const [open, setOpen] = useState<boolean>(false);
    const [sessionsForSelectedDate, setSessionsForSelectedDate] = useState<TrainingSession[]>([]);

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
                const sessions = querySnapshot.docs.map(doc => {
                    const data = doc.data() as Omit<FirestoreTrainingSession, 'id'>;
                    return {
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate(),
                        date: data.date?.toDate() || data.createdAt?.toDate()
                    } as TrainingSession;
                });

                setTrainingSessions(sessions);
            } catch (error) {
                console.error('훈련 세션 조회 오류:', error);
            } finally {
                setLoadingSessions(false);
            }
        };

        fetchTrainingSessions();
    }, [user]);

    // 선택한 날짜에 대한 세션 필터링
    useEffect(() => {
        if (selectedDate && trainingSessions.length > 0) {
            const filteredSessions = trainingSessions.filter(session =>
                session.date && dayjs(session.date).format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD')
            );
            setSessionsForSelectedDate(filteredSessions);
        } else {
            setSessionsForSelectedDate([]);
        }
    }, [selectedDate, trainingSessions]);

    const handleDateSelect = (date: Dayjs) => {
        setSelectedDate(date);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleAddTrainingSession = () => {
        router.push('/training/add');
    };

    const handleCheckSession = async (sessionId: string, completed: boolean) => {
        try {
            // Firestore에서 해당 세션 업데이트
            await updateDoc(doc(db, 'trainingSessions', sessionId), {
                completed: completed
            });

            // 로컬 상태 업데이트
            setTrainingSessions(prev =>
                prev.map(session =>
                    session.id === sessionId
                        ? { ...session, completed }
                        : session
                )
            );

            setSessionsForSelectedDate(prev =>
                prev.map(session =>
                    session.id === sessionId
                        ? { ...session, completed }
                        : session
                )
            );
        } catch (error) {
            console.error('훈련 세션 업데이트 오류:', error);
        }
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
                    sx={{ mb: 4 }}
                >
                    새 훈련 세션 추가
                </Button>

                {/* 커스텀 달력 */}
                <Paper sx={{ p: 3, mb: 4, width: '100%' }}>
                    {loadingSessions ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                            <CircularProgress size={30} sx={{ color: '#9147ff' }} />
                        </Box>
                    ) : (
                        <CustomCalendar
                            trainingSessions={trainingSessions}
                            onDateSelect={handleDateSelect}
                        />
                    )}
                </Paper>

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

            {/* 선택한 날짜의 훈련 세션 다이얼로그 */}
            <Dialog
                open={open}
                onClose={handleClose}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                    }
                }}
            >
                <DialogTitle sx={{
                    borderBottom: '1px solid rgba(145, 71, 255, 0.2)',
                    color: '#efeff1',
                    pb: 2
                }}>
                    {selectedDate && selectedDate.format('YYYY년 MM월 DD일')}의 훈련
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {sessionsForSelectedDate.length > 0 ? (
                        <Box>
                            {sessionsForSelectedDate.map((session) => (
                                <Paper
                                    key={session.id}
                                    sx={{
                                        p: 2,
                                        mb: 2,
                                        borderLeft: '4px solid #9147ff',
                                        transition: 'all 0.2s',
                                        ...(session.completed && {
                                            opacity: 0.7,
                                            borderLeft: '4px solid #00b5ad',
                                        })
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={session.completed || false}
                                                    onChange={(e) => handleCheckSession(session.id, e.target.checked)}
                                                    sx={{
                                                        color: '#9147ff',
                                                        '&.Mui-checked': {
                                                            color: '#00b5ad',
                                                        }
                                                    }}
                                                />
                                            }
                                            label={
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        color: '#efeff1',
                                                        ...(session.completed && {
                                                            textDecoration: 'line-through',
                                                            color: '#adadb8'
                                                        })
                                                    }}
                                                >
                                                    {session.name}
                                                </Typography>
                                            }
                                        />
                                    </Box>

                                    <Typography
                                        variant="body2"
                                        sx={{
                                            ml: 4,
                                            color: '#adadb8',
                                            ...(session.completed && {
                                                textDecoration: 'line-through'
                                            })
                                        }}
                                    >
                                        {session.content}
                                    </Typography>

                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                        <Typography variant="body2" sx={{ color: '#00b5ad' }}>
                                            {session.duration}분
                                        </Typography>
                                    </Box>
                                </Paper>
                            ))}
                        </Box>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Typography color="textSecondary">
                                이 날짜에 등록된 훈련 세션이 없습니다.
                            </Typography>
                            <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={handleAddTrainingSession}
                                sx={{ mt: 2 }}
                            >
                                새 훈련 추가하기
                            </Button>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ borderTop: '1px solid rgba(145, 71, 255, 0.2)', px: 3, py: 2 }}>
                    <Button onClick={handleClose} color="secondary">
                        닫기
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}