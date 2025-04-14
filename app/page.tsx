'use client';

import {useCallback, useEffect, useState} from 'react';
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
import TrainingTimer from '@/components/TrainingTimer';
import PlayArrowIcon from "@mui/icons-material/PlayArrow";


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
    const [activeTimerSessionId, setActiveTimerSessionId] = useState<string | null>(null);


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

                // 새로운 구조: trainingSessions/{userID}/sessions
                const sessionsRef = collection(db, 'trainingSessions', user.uid, 'sessions');
                const q = query(sessionsRef, orderBy('createdAt', 'desc'));

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

                // 혹시 기존 구조에 데이터가 있다면 레거시 데이터도 조회 시도
                try {
                    const legacyQuery = query(
                        collection(db, 'trainingSessions'),
                        where('userId', '==', user.uid),
                        orderBy('createdAt', 'desc')
                    );

                    const legacySnapshot = await getDocs(legacyQuery);
                    const legacySessions = legacySnapshot.docs.map(doc => {
                        const data = doc.data() as Omit<FirestoreTrainingSession, 'id'>;
                        return {
                            id: doc.id,
                            ...data,
                            createdAt: data.createdAt?.toDate(),
                            date: data.date?.toDate() || data.createdAt?.toDate()
                        } as TrainingSession;
                    });

                    setTrainingSessions(legacySessions);
                } catch (secondError) {
                    console.error('레거시 훈련 세션 조회 오류:', secondError);
                }
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

    const handleTimerComplete = useCallback(() => {
        // 타이머가 완료되면 자동으로 훈련을 완료 상태로 변경
        if (activeTimerSessionId) {
            // 상태 업데이트를 setTimeout으로 감싸서 렌더링 사이클 외부에서 실행
            setTimeout(() => {
                handleCheckSession(activeTimerSessionId, true);
                setActiveTimerSessionId(null);
            }, 0);
        }
    }, [activeTimerSessionId]);

    const handleDateSelect = (date: Dayjs) => {
        setSelectedDate(date);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleAddSlogan = () => {
        router.push('/slogan/add');
    }

    const handleAddTrainingSession = () => {
        router.push('/training/add');
    };

    const handleCheckSession = async (sessionId: string, completed: boolean) => {
        try {
            if (!user) return;

            // 로컬 상태 먼저 업데이트 (사용자 경험 향상)
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

            // 새 구조에서 세션 업데이트
            const sessionDocRef = doc(db, 'trainingSessions', user.uid, 'sessions', sessionId);

            try {
                // 에러 발생 가능성이 있는 Firestore 작업을 try-catch로 별도 처리
                const updateResult = await updateDoc(sessionDocRef, {
                    completed: completed
                }).catch(error => {
                    console.error('새 경로에서 업데이트 오류:', error);
                    throw error; // 다음 catch 블록으로 오류 전달
                });

                console.log('세션 업데이트 성공:', sessionId);
                return updateResult;
            } catch (error) {
                console.warn('새 경로 업데이트 실패, 레거시 경로 시도... : ', error);

                // 재시도: 잠시 대기 후 레거시 경로로 시도
                await new Promise(resolve => setTimeout(resolve, 100));

                try {
                    const legacyResult = await updateDoc(doc(db, 'trainingSessions', sessionId), {
                        completed: completed
                    });
                    console.log('레거시 경로 세션 업데이트 성공:', sessionId);
                    return legacyResult;
                } catch (legacyError) {
                    console.error('레거시 경로 업데이트도 실패:', legacyError);
                    // 실패해도 UI는 이미 업데이트됨 (낙관적 UI 업데이트)
                    throw legacyError;
                }
            }
        } catch (error) {
            console.error('훈련 세션 업데이트 처리 중 오류:', error);
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
                    onClick={handleAddSlogan}
                    sx={{ mb: 4 }}
                >
                    새 슬로건 추가
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
                    pb: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Box>
                        {selectedDate && selectedDate.format('YYYY년 MM월 DD일')}의 훈련

                        {/* 과거 날짜 표시 추가 */}
                        {selectedDate && selectedDate.isBefore(dayjs(), 'day') && (
                            <Typography variant="caption" sx={{ display: 'block', color: '#ff8a80', mt: 1 }}>
                                과거 훈련 기록은 수정할 수 없습니다.
                            </Typography>
                        )}
                    </Box>

                    {/* 과거 날짜가 아닐 때만 새 훈련 추가 버튼 표시 */}
                    {(!selectedDate || !selectedDate.isBefore(dayjs(), 'day')) && (
                        <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={handleAddTrainingSession}
                        >
                            새 훈련
                        </Button>
                    )}
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {sessionsForSelectedDate.length > 0 ? (
                        <Box>
                            {sessionsForSelectedDate.map((session) => (
                                <Paper
                                    key={session.id}
                                    sx={{
                                        p: 2,
                                        mt: 2,
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
                                                    disabled={selectedDate && selectedDate.isBefore(dayjs(), 'day')} // 과거 날짜는 비활성화
                                                    sx={{
                                                        color: '#9147ff',
                                                        '&.Mui-checked': {
                                                            color: '#00b5ad',
                                                        },
                                                        '&.Mui-disabled': {
                                                            color: session.completed ? '#006e68' : '#61357f',
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
                                        {session.content || ''}
                                    </Typography>

                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                        <Typography variant="body2" sx={{ color: '#00b5ad' }}>
                                            {session.duration}분
                                        </Typography>
                                    </Box>

                                    {/* 타이머 추가 */}
                                    {activeTimerSessionId === session.id && (
                                        <TrainingTimer
                                            key={`timer-${session.id}`}
                                            duration={session.duration || 0}
                                            sessionName={session.name}
                                            onComplete={handleTimerComplete}
                                        />
                                    )}

                                    {!session.completed && !selectedDate.isBefore(dayjs(), 'day') && activeTimerSessionId !== session.id && (
                                        <Box sx={{ mt: 2, textAlign: 'right' }}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<PlayArrowIcon />}
                                                onClick={() => setActiveTimerSessionId(session.id)}
                                                sx={{
                                                    color: '#9147ff',
                                                    borderColor: '#9147ff',
                                                    '&:hover': {
                                                        borderColor: '#772ce8',
                                                        bgcolor: 'rgba(145, 71, 255, 0.1)'
                                                    }
                                                }}
                                            >
                                                타이머 시작
                                            </Button>
                                        </Box>
                                    )}
                                </Paper>
                            ))}
                        </Box>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Typography color="textSecondary">
                                이 날짜에 등록된 훈련 세션이 없습니다.
                            </Typography>
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