'use client';

import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
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
    FormControlLabel,
    Card,
    CardContent, TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
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
    doc,
    deleteDoc,
    limit,
    writeBatch, addDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TrainingSession, FirestoreTrainingSession } from '@/lib/types';
import CustomCalendar from '@/components/CustomCalendar';
import TrainingTimer from '@/components/TrainingTimer';
import {User} from "firebase/auth";
// 로케일 설정
dayjs.locale('ko');

// 피드백 타입 정의
type Feedback = {
    id: string;
    content: string;
    date: Date;
    createdAt: Date;
    userId: string;
};

// Slogan 타입 정의
type Slogan = {
    id: string;
    content: string;
    createdAt: Date;
    priority: number;
};

// SloganSection props 타입 정의
type SloganSectionProps = {
    user: User;
    loadingSlogans: boolean;
    slogans: Slogan[];
    setSlogans: Dispatch<SetStateAction<Slogan[]>>;
};

// 피드백 섹션 컴포넌트
const FeedbackSection = ({
                             user,
                             selectedDate,
                             feedback,
                             setFeedback,
                             isLoading
                         }: {
    user: User;
    selectedDate: Dayjs;
    feedback: Feedback | null;
    setFeedback: (feedback: Feedback | null) => void;
    isLoading: boolean;
}) => {
    const [content, setContent] = useState<string>(feedback?.content || '');
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [characterCount, setCharacterCount] = useState<number>(content.length || 0);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [editMode, setEditMode] = useState<boolean>(false); // 수정 모드 상태 추가
    const MAX_CHAR_COUNT = 200;

    useEffect(() => {
        if (feedback) {
            setContent(feedback.content);
            setCharacterCount(feedback.content.length);
            setEditMode(false); // 피드백이 로드될 때 수정 모드 비활성화
        } else {
            setContent('');
            setCharacterCount(0);
            setEditMode(true); // 새 피드백인 경우 수정 모드 활성화
        }
    }, [feedback]);

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        if (newContent.length <= MAX_CHAR_COUNT) {
            setContent(newContent);
            setCharacterCount(newContent.length);
        }
    };

    const saveFeedback = async () => {
        if (!user || content.trim() === '') return;

        try {
            setIsSaving(true);

            const dateStr = selectedDate.format('YYYY-MM-DD');
            const feedbackRef = collection(db, 'userFeedback', user.uid, 'daily');
            const q = query(feedbackRef, where('date', '==', dateStr));
            const querySnapshot = await getDocs(q);

            const newFeedback = {
                content: content.trim(),
                date: dateStr,
                createdAt: new Date(),
                userId: user.uid
            };

            let docId;

            if (!querySnapshot.empty) {
                // 기존 피드백 업데이트
                docId = querySnapshot.docs[0].id;
                await updateDoc(doc(db, 'userFeedback', user.uid, 'daily', docId), newFeedback);
                setSuccessMessage("피드백이 업데이트되었습니다.");
            } else {
                // 새 피드백 생성
                const docRef = await addDoc(collection(db, 'userFeedback', user.uid, 'daily'), newFeedback);
                docId = docRef.id;
                setSuccessMessage("새 피드백이 등록되었습니다.");
            }

            setFeedback({
                id: docId,
                ...newFeedback,
                date: new Date(dateStr),
                createdAt: new Date()
            });

            // 저장 후 수정 모드 비활성화
            setEditMode(false);

            // 3초 후 메시지 사라짐
            setTimeout(() => setSuccessMessage(null), 3000);

        } catch (error) {
            console.error('피드백 저장 오류:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // 수정 모드 활성화 함수
    const enableEditMode = () => {
        setEditMode(true);
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress size={24} sx={{ color: '#9147ff' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ mt: 4, borderTop: '1px solid rgba(145, 71, 255, 0.2)', pt: 3 }}>
            {/* 제목과 상태 뱃지 */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#efeff1' }}>
                    오늘의 피드백
                </Typography>

                {feedback && !editMode && (
                    <Box
                        component="span"
                        sx={{
                            ml: 2,
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            bgcolor: 'rgba(0, 181, 173, 0.1)',
                            color: '#00b5ad',
                            border: '1px solid rgba(0, 181, 173, 0.3)'
                        }}
                    >
                        저장됨
                    </Box>
                )}

                {feedback && editMode && (
                    <Box
                        component="span"
                        sx={{
                            ml: 2,
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            bgcolor: 'rgba(145, 71, 255, 0.1)',
                            color: '#9147ff',
                            border: '1px solid rgba(145, 71, 255, 0.3)'
                        }}
                    >
                        수정 중
                    </Box>
                )}
            </Box>

            {/* 성공 메시지 */}
            {successMessage && (
                <Box sx={{
                    mb: 2,
                    p: 1.5,
                    bgcolor: 'rgba(0, 181, 173, 0.1)',
                    borderRadius: 1,
                    border: '1px solid rgba(0, 181, 173, 0.3)',
                    color: '#00b5ad',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                        ✓
                    </Box>
                    {successMessage}
                </Box>
            )}

            {/* 최종 수정 시간 */}
            {feedback && (
                <Typography variant="caption" sx={{ color: '#adadb8', mb: 2, display: 'block' }}>
                    마지막 수정: {dayjs(feedback.createdAt).format('YYYY년 MM월 DD일 HH:mm')}
                </Typography>
            )}

            <TextField
                multiline
                fullWidth
                rows={4}
                value={content}
                onChange={handleContentChange}
                placeholder="오늘 훈련에 대한 피드백이나 생각을 남겨보세요. (최대 200자)"
                disabled={Boolean(selectedDate.isBefore(dayjs(), 'day') || (feedback && !editMode))} // 수정 모드가 아니면 비활성화
                InputProps={{
                    sx: {
                        color: '#efeff1',
                        '&.Mui-disabled': {
                            color: '#adadb8',
                        }
                    }
                }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                            borderColor: feedback && !editMode
                                ? 'rgba(0, 181, 173, 0.3)'
                                : 'rgba(145, 71, 255, 0.3)',
                        },
                        '&:hover fieldset': {
                            borderColor: feedback && !editMode
                                ? 'rgba(0, 181, 173, 0.5)'
                                : 'rgba(145, 71, 255, 0.5)',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: feedback && !editMode ? '#00b5ad' : '#9147ff',
                        },
                        ...(feedback && !editMode && {
                            bgcolor: 'rgba(0, 181, 173, 0.03)',
                        }),
                    },
                }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Typography variant="caption" sx={{ color: characterCount >= MAX_CHAR_COUNT ? '#ff8a80' : '#adadb8' }}>
                    {characterCount}/{MAX_CHAR_COUNT}자
                </Typography>

                {!selectedDate.isBefore(dayjs(), 'day') && (
                    feedback ? (
                        // 피드백이 있는 경우: 수정/업데이트 버튼
                        editMode ? (
                            // 수정 모드일 때는 업데이트 버튼
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={saveFeedback}
                                disabled={isSaving || content.trim() === ''}
                                sx={{
                                    bgcolor: '#9147ff',
                                    '&:hover': {
                                        bgcolor: '#772ce8',
                                    },
                                    '&.Mui-disabled': {
                                        bgcolor: 'rgba(145, 71, 255, 0.2)',
                                    }
                                }}
                            >
                                {isSaving ? (
                                    <CircularProgress size={20} sx={{ color: '#fff' }} />
                                ) : (
                                    '업데이트'
                                )}
                            </Button>
                        ) : (
                            // 읽기 모드일 때는 편집 버튼
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={enableEditMode}
                                sx={{
                                    color: '#00b5ad',
                                    borderColor: '#00b5ad',
                                    '&:hover': {
                                        borderColor: '#009c95',
                                        bgcolor: 'rgba(0, 181, 173, 0.1)'
                                    }
                                }}
                            >
                                편집
                            </Button>
                        )
                    ) : (
                        // 새 피드백인 경우: 저장 버튼
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={saveFeedback}
                            disabled={isSaving || content.trim() === ''}
                            sx={{
                                bgcolor: '#9147ff',
                                '&:hover': {
                                    bgcolor: '#772ce8',
                                },
                                '&.Mui-disabled': {
                                    bgcolor: 'rgba(145, 71, 255, 0.2)',
                                }
                            }}
                        >
                            {isSaving ? (
                                <CircularProgress size={20} sx={{ color: '#fff' }} />
                            ) : (
                                '저장'
                            )}
                        </Button>
                    )
                )}
            </Box>
        </Box>
    );
};

// SloganSection 컴포넌트
const SloganSection = ({ user, loadingSlogans, slogans, setSlogans }: SloganSectionProps) => {
    const [draggedItem, setDraggedItem] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const [selectedSloganId, setSelectedSloganId] = useState<string | null>(null);

    // 삭제 다이얼로그 열기
    const handleSloganClick = (sloganId: string) => {
        if (isDragging) return;

        setSelectedSloganId(sloganId);
        setDeleteDialogOpen(true);
    };

    // 삭제 다이얼로그 닫기
    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setSelectedSloganId(null);
    };

    // 슬로건 삭제 처리
    const handleDeleteSlogan = async () => {
        if (!selectedSloganId) return;

        try {
            const sloganRef = doc(db, 'UserSlogan', user.uid, 'slogans', selectedSloganId);
            await deleteDoc(sloganRef);

            // 상태 업데이트
            setSlogans(prevSlogans => prevSlogans.filter(slogan => slogan.id !== selectedSloganId));
            handleCloseDeleteDialog();
        } catch (error) {
            console.error('슬로건 삭제 오류:', error);
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedItem(index);
        setIsDragging(true);
        e.currentTarget.style.opacity = '0.4';

        const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        setTimeout(() => document.body.removeChild(dragImage), 0);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        e.currentTarget.style.transform =
            index < draggedItem! ? 'translateY(-8px)' : 'translateY(8px)';
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = 'translateY(0)';
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        setIsDragging(false);
        e.currentTarget.style.opacity = '1';
        document.querySelectorAll<HTMLElement>('.slogan-card').forEach(card => {
            card.style.transform = 'translateY(0)';
        });
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
        e.preventDefault();
        const dragIndex = draggedItem;
        if (dragIndex === dropIndex || dragIndex === null) return;

        try {
            const newSlogans = [...slogans];
            const [removed] = newSlogans.splice(dragIndex, 1);
            newSlogans.splice(dropIndex, 0, removed);

            const updatedSlogans = newSlogans.map((slogan, index) => ({
                ...slogan,
                priority: newSlogans.length - index
            }));

            const batch = writeBatch(db);
            updatedSlogans.forEach((slogan) => {
                const sloganRef = doc(db, 'UserSlogan', user.uid, 'slogans', slogan.id);
                batch.update(sloganRef, { priority: slogan.priority });
            });
            await batch.commit();

            setSlogans(updatedSlogans);
        } catch (error) {
            console.error('슬로건 우선순위 업데이트 실패:', error);
        }

        document.querySelectorAll<HTMLElement>('.slogan-card').forEach(card => {
            card.style.transform = 'translateY(0)';
        });
    };

    if (loadingSlogans) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress size={32} sx={{ color: '#9147ff' }} />
            </Box>
        );
    }

    return (
        <>
            {slogans.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {slogans.map((slogan, index) => (
                        <Card
                            key={slogan.id}
                            className="slogan-card"
                            draggable
                            onClick={() => handleSloganClick(slogan.id)}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDragEnd={handleDragEnd}
                            onDrop={(e) => handleDrop(e, index)}
                            sx={{
                                bgcolor: 'rgba(145, 71, 255, 0.03)',
                                border: '1px solid rgba(145, 71, 255, 0.1)',
                                borderRadius: 2,
                                transition: 'all 0.2s ease-in-out',
                                cursor: 'grab',
                                '&:hover': {
                                    transform: isDragging ? 'none' : 'translateY(-2px)',
                                    bgcolor: 'rgba(145, 71, 255, 0.08)',
                                    boxShadow: '0 4px 12px rgba(145, 71, 255, 0.15)'
                                },
                                '&:active': {
                                    cursor: 'grabbing'
                                }
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <DragIndicatorIcon
                                        sx={{
                                            color: '#9147ff',
                                            opacity: 0.7,
                                            cursor: 'grab'
                                        }}
                                    />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography
                                            sx={{
                                                color: '#efeff1',
                                                fontSize: '1.1rem',
                                                fontWeight: 500,
                                                lineHeight: 1.5
                                            }}
                                        >
                                            {slogan.content}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: '#adadb8',
                                                mt: 2,
                                                display: 'block',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            {dayjs(slogan.createdAt).format('YYYY년 MM월 DD일')}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography sx={{ color: '#adadb8', fontSize: '1rem', fontWeight: 500 }}>
                        등록된 슬로건이 없습니다.
                    </Typography>
                </Box>
            )}

            {/* 삭제 확인 다이얼로그 */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleCloseDeleteDialog}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        bgcolor: '#18181b',
                        color: '#efeff1'
                    }
                }}
            >
                <DialogTitle sx={{ color: '#efeff1' }}>
                    슬로건 삭제
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: '#adadb8' }}>
                        이 슬로건을 삭제하시겠습니까?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={handleCloseDeleteDialog}
                        sx={{ color: '#adadb8' }}
                    >
                        취소
                    </Button>
                    <Button
                        onClick={handleDeleteSlogan}
                        variant="contained"
                        sx={{
                            bgcolor: '#dc3545',
                            '&:hover': {
                                bgcolor: '#c82333'
                            }
                        }}
                    >
                        삭제
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default function Home() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
    const [loadingSessions, setLoadingSessions] = useState<boolean>(false);
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
    const [open, setOpen] = useState<boolean>(false);
    const [sessionsForSelectedDate, setSessionsForSelectedDate] = useState<TrainingSession[]>([]);
    const [activeTimerSessionId, setActiveTimerSessionId] = useState<string | null>(null);
    const [slogans, setSlogans] = useState<Array<Slogan>>([]);
    const [loadingSlogans, setLoadingSlogans] = useState<boolean>(false);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [loadingFeedback, setLoadingFeedback] = useState<boolean>(false);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loadingAllFeedbacks, setLoadingAllFeedbacks] = useState<boolean>(false);
    const [draggedSessionItem, setDraggedSessionItem] = useState<number | null>(null);
    const [isSessionDragging, setIsSessionDragging] = useState<boolean>(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // 모든 피드백 가져오기
    useEffect(() => {
        const fetchAllFeedbacks = async () => {
            if (!user) return;

            try {
                setLoadingAllFeedbacks(true);
                const feedbackRef = collection(db, 'userFeedback', user.uid, 'daily');
                const querySnapshot = await getDocs(feedbackRef);

                const feedbackData = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        content: data.content,
                        date: new Date(data.date),
                        createdAt: data.createdAt?.toDate() || new Date(),
                        userId: data.userId
                    } as Feedback;
                });

                setFeedbacks(feedbackData);
            } catch (error) {
                console.error('모든 피드백 조회 오류:', error);
            } finally {
                setLoadingAllFeedbacks(false);
            }
        };

        fetchAllFeedbacks();
    }, [user]);


    // 선택된 날짜의 피드백 가져오기
    useEffect(() => {
        const fetchFeedback = async () => {
            if (!user || !selectedDate) return;

            try {
                setLoadingFeedback(true);
                setFeedback(null);

                const dateStr = selectedDate.format('YYYY-MM-DD');
                const feedbackRef = collection(db, 'userFeedback', user.uid, 'daily');
                const q = query(feedbackRef, where('date', '==', dateStr));

                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const doc = querySnapshot.docs[0];
                    const data = doc.data();

                    setFeedback({
                        id: doc.id,
                        content: data.content,
                        date: new Date(data.date),
                        createdAt: data.createdAt?.toDate() || new Date(),
                        userId: data.userId
                    });
                }
            } catch (error) {
                console.error('피드백 조회 오류:', error);
            } finally {
                setLoadingFeedback(false);
            }
        };

        if (open) {
            fetchFeedback();
        }
    }, [user, selectedDate, open]);

    // 슬로건 가져오기
    useEffect(() => {
        const fetchSlogans = async () => {
            if (!user) return;

            try {
                setLoadingSlogans(true);
                const slogansRef = collection(db, 'UserSlogan', user.uid, 'slogans');
                const q = query(
                    slogansRef,
                    orderBy('priority', 'desc'),
                    orderBy('createdAt', 'desc'),
                    limit(3)
                );

                const querySnapshot = await getDocs(q);
                const sloganData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    content: doc.data().content,
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                    priority: doc.data().priority || 0
                }));

                setSlogans(sloganData);
            } catch (error) {
                console.error('슬로건 조회 오류:', error);
            } finally {
                setLoadingSlogans(false);
            }
        };

        fetchSlogans();
    }, [user]);

    // 훈련 세션 가져오기
    useEffect(() => {
        const fetchTrainingSessions = async () => {
            if (!user) return;

            try {
                setLoadingSessions(true);
                const sessionsRef = collection(db, 'trainingSessions', user.uid, 'sessions');
                // 우선순위로 정렬 추가
                const q = query(sessionsRef, orderBy('priority', 'desc'), orderBy('createdAt', 'desc'));

                const querySnapshot = await getDocs(q);
                const sessions = querySnapshot.docs.map(doc => {
                    const data = doc.data() as Omit<FirestoreTrainingSession, 'id'>;
                    return {
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate(),
                        date: data.date?.toDate() || data.createdAt?.toDate(),
                        priority: data.priority || 0 // 우선순위 기본값 설정
                    } as TrainingSession;
                });

                setTrainingSessions(sessions);
            } catch (error) {
                console.error('훈련 세션 조회 오류:', error);

                try {
                    const legacyQuery = query(
                        collection(db, 'trainingSessions'),
                        where('userId', '==', user.uid),
                        orderBy('priority', 'desc'), // 우선순위로 정렬 추가
                        orderBy('createdAt', 'desc')
                    );

                    const legacySnapshot = await getDocs(legacyQuery);
                    const legacySessions = legacySnapshot.docs.map(doc => {
                        const data = doc.data() as Omit<FirestoreTrainingSession, 'id'>;
                        return {
                            id: doc.id,
                            ...data,
                            createdAt: data.createdAt?.toDate(),
                            date: data.date?.toDate() || data.createdAt?.toDate(),
                            priority: data.priority || 0 // 우선순위 기본값 설정
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

    const handleCheckSession = useCallback(async (sessionId: string, completed: boolean) => {
        try {
            if (!user) return;

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

            const sessionDocRef = doc(db, 'trainingSessions', user.uid, 'sessions', sessionId);

            try {
                const updateResult = await updateDoc(sessionDocRef, {
                    completed: completed
                }).catch(error => {
                    console.error('새 경로에서 업데이트 오류:', error);
                    throw error;
                });

                console.log('세션 업데이트 성공:', sessionId);
                return updateResult;
            } catch (error) {
                console.warn('새 경로 업데이트 실패, 레거시 경로 시도... : ', error);

                await new Promise(resolve => setTimeout(resolve, 100));

                try {
                    const legacyResult = await updateDoc(doc(db, 'trainingSessions', sessionId), {
                        completed: completed
                    });
                    console.log('레거시 경로 세션 업데이트 성공:', sessionId);
                    return legacyResult;
                } catch (legacyError) {
                    console.error('레거시 경로 업데이트도 실패:', legacyError);
                    throw legacyError;
                }
            }
        } catch (error) {
            console.error('훈련 세션 업데이트 처리 중 오류:', error);
        }
    }, [user]);

    const handleTimerComplete = useCallback(() => {
        if (activeTimerSessionId) {
            setTimeout(() => {
                handleCheckSession(activeTimerSessionId, true);
                setActiveTimerSessionId(null);
            }, 0);
        }
    }, [activeTimerSessionId, handleCheckSession]);

    const handleDateSelect = (date: Dayjs) => {
        setSelectedDate(date);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleAddSlogan = () => {
        router.push('/slogan/add');
    };

    const handleAddTrainingSession = () => {
        router.push('/training/add');
    };

// 훈련 세션 드래그 핸들러
    const handleSessionDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedSessionItem(index);
        setIsSessionDragging(true);
        e.currentTarget.style.opacity = '0.4';

        const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        setTimeout(() => document.body.removeChild(dragImage), 0);
    };

    const handleSessionDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        e.currentTarget.style.transform =
            index < draggedSessionItem! ? 'translateY(-8px)' : 'translateY(8px)';
    };

    const handleSessionDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = 'translateY(0)';
    };

    const handleSessionDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        setIsSessionDragging(false);
        e.currentTarget.style.opacity = '1';
        document.querySelectorAll<HTMLElement>('.session-card').forEach(card => {
            card.style.transform = 'translateY(0)';
        });
    };

    const handleSessionDrop = async (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
        e.preventDefault();
        const dragIndex = draggedSessionItem;
        // user가 null이면 함수를 바로 종료
        if (dragIndex === dropIndex || dragIndex === null || !user) return;

        try {
            const newSessions = [...sessionsForSelectedDate];
            const [removed] = newSessions.splice(dragIndex, 1);
            newSessions.splice(dropIndex, 0, removed);

            const updatedSessions = newSessions.map((session, index) => ({
                ...session,
                priority: newSessions.length - index
            }));

            // 파이어베이스에 우선순위 업데이트
            const batch = writeBatch(db);
            updatedSessions.forEach((session) => {
                // 여기서 user가 null이 아니라고 확신할 수 있음
                const sessionRef = doc(db, 'trainingSessions', user.uid, 'sessions', session.id);
                batch.update(sessionRef, { priority: session.priority });
            });
            await batch.commit();

            // 상태 업데이트
            setSessionsForSelectedDate(updatedSessions);

            // 전체 훈련 세션 목록도 업데이트
            setTrainingSessions(prev => {
                const updated = [...prev];
                updatedSessions.forEach(session => {
                    const index = updated.findIndex(s => s.id === session.id);
                    if (index !== -1) {
                        updated[index] = session;
                    }
                });
                return updated;
            });
        } catch (error) {
            console.error('훈련 세션 우선순위 업데이트 실패:', error);
        }

        document.querySelectorAll<HTMLElement>('.session-card').forEach(card => {
            card.style.transform = 'translateY(0)';
        });
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
        return null;
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
                    Game Gym
                </Typography>

                <Typography variant="h6" sx={{ mb: 1, color: '#adadb8' }}>
                    안녕하세요, {user.displayName || '사용자'}님!
                </Typography>

                <Typography variant="body1" sx={{ mb: 4, color: '#adadb8', textAlign: 'center' }}>
                    게임 훈련 세션을 관리하고 최고의 퍼포먼스를 달성하세요.
                </Typography>

                <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleAddSlogan}
                        disabled={slogans.length >= 3}
                        sx={{
                            opacity: slogans.length >= 3 ? 0.7 : 1,
                        }}
                    >
                        새 슬로건 추가
                    </Button>
                    {slogans.length >= 3 && (
                        <Typography
                            variant="caption"
                            sx={{
                                color: '#ff8a80',
                                textAlign: 'center'
                            }}
                        >
                            슬로건은 최대 3개까지만 등록할 수 있습니다
                        </Typography>
                    )}
                </Box>

                <Paper
                    elevation={0}
                    sx={{
                        width: '100%',
                        mb: 4,
                        p: 4,
                        bgcolor: 'rgba(145, 71, 255, 0.08)',
                        borderRadius: 3,
                        border: '1px solid rgba(145, 71, 255, 0.15)'
                    }}
                >
                    <SloganSection
                        user={user}
                        loadingSlogans={loadingSlogans}
                        slogans={slogans}
                        setSlogans={setSlogans}
                    />
                </Paper>

                <Paper sx={{ p: 3, mb: 4, width: '100%' }}>
                    {loadingSessions || loadingAllFeedbacks ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                            <CircularProgress size={30} sx={{ color: '#9147ff' }} />
                        </Box>
                    ) : (
                        <CustomCalendar
                            trainingSessions={trainingSessions}
                            feedbacks={feedbacks}
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
                        {selectedDate && selectedDate.format('YYYY년 MM월 DD일')}

                        {selectedDate && selectedDate.isBefore(dayjs(), 'day') && (
                            <Typography variant="caption" sx={{ display: 'block', color: '#ff8a80', mt: 1 }}>
                                과거 훈련 기록은 수정할 수 없습니다.
                            </Typography>
                        )}
                    </Box>

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
                            {sessionsForSelectedDate.map((session, index) => (
                                <Paper
                                    key={session.id}
                                    className="session-card"
                                    draggable={!selectedDate.isBefore(dayjs(), 'day')} // 과거 날짜는 드래그 불가
                                    onDragStart={(e) => handleSessionDragStart(e, index)}
                                    onDragOver={(e) => handleSessionDragOver(e, index)}
                                    onDragLeave={handleSessionDragLeave}
                                    onDragEnd={handleSessionDragEnd}
                                    onDrop={(e) => handleSessionDrop(e, index)}
                                    sx={{
                                        p: 2,
                                        mt: 2,
                                        borderLeft: '4px solid #9147ff',
                                        transition: 'all 0.2s',
                                        cursor: !selectedDate.isBefore(dayjs(), 'day') ? 'grab' : 'default',
                                        '&:hover': {
                                            ...((!selectedDate.isBefore(dayjs(), 'day') && !isSessionDragging) && {
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 4px 12px rgba(145, 71, 255, 0.15)'
                                            })
                                        },
                                        '&:active': {
                                            cursor: !selectedDate.isBefore(dayjs(), 'day') ? 'grabbing' : 'default'
                                        },
                                        ...(session.completed && {
                                            opacity: 0.7,
                                            borderLeft: '4px solid #00b5ad',
                                        })
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            {!selectedDate.isBefore(dayjs(), 'day') && (
                                                <DragIndicatorIcon
                                                    sx={{
                                                        color: '#9147ff',
                                                        opacity: 0.7,
                                                        cursor: 'grab',
                                                        mr: 1
                                                    }}
                                                />
                                            )}
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={session.completed || false}
                                                        onChange={(e) => handleCheckSession(session.id, e.target.checked)}
                                                        disabled={selectedDate && selectedDate.isBefore(dayjs(), 'day')}
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
                    {/* 피드백 섹션 추가 */}
                    <FeedbackSection
                        user={user}
                        selectedDate={selectedDate}
                        feedback={feedback}
                        setFeedback={setFeedback}
                        isLoading={loadingFeedback}
                    />
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