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
import Dashboard from '@/components/Dashboard';
import BadgeCollection from '@/components/BadgeCollection';
import BadgeAchievementModal from '@/components/BadgeAchievementModal';
import { BadgeService, initializeDefaultBadges } from '@/lib/BadgeService';
import { Badge } from '@/components/BadgeCollection';
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
                    position: 'fixed',
                    bottom: 20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    minWidth: 300,
                    maxWidth: '80%',
                    p: 2,
                    bgcolor: 'rgba(0, 181, 173, 0.95)',
                    color: '#fff',
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    backdropFilter: 'blur(5px)',
                    border: '1px solid rgba(0, 181, 173, 0.3)'
                }}>
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M8 12l2 2 4-4"></path>
                        </svg>
                    </Box>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 500 }}>
                        {successMessage}
                    </Typography>
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
    const [forceRefresh, setForceRefresh] = useState(0);
    const [deleteSessionDialogOpen, setDeleteSessionDialogOpen] = useState<boolean>(false);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
    const [newBadge, setNewBadge] = useState<Badge | null>(null);
    const [badgeModalOpen, setBadgeModalOpen] = useState<boolean>(false);



    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        // 첫 로드시 기본 뱃지 초기화 (이미 있으면 아무일도 일어나지 않음)
        if (user) {
            initializeDefaultBadges().catch(console.error);
        }
    }, [user]);

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
    }, [user, forceRefresh]);

    useEffect(() => {
        if (selectedDate && trainingSessions.length > 0) {
            // 드래그앤드롭 중에는 실행되지 않도록 조건 추가
            if (!isSessionDragging) {
                const filteredSessions = trainingSessions.filter(session =>
                    session.date && dayjs(session.date).format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD')
                );
                setSessionsForSelectedDate(filteredSessions);
            }
        } else {
            setSessionsForSelectedDate([]);
        }
    }, [selectedDate, trainingSessions, isSessionDragging]);

    // 훈련 세션 완료 시 뱃지 확인 로직
    const checkForBadges = useCallback(async () => {
        if (!user || trainingSessions.length === 0) return;

        // 뱃지 서비스 인스턴스 생성
        const badgeService = new BadgeService(user.uid, trainingSessions);

        // 새로 획득한 뱃지 확인
        const earnedBadge = await badgeService.checkBadgeAchievements();

        // 뱃지 획득 시 모달 표시
        if (earnedBadge) {
            setNewBadge(earnedBadge);
            setBadgeModalOpen(true);

            // 강제 리렌더링을 위한 추가 단계
            setTimeout(() => {
                setForceRefresh(prev => prev + 1);
            }, 100);
        }
    }, [user, trainingSessions]);

    const handleCheckSession = useCallback(async (sessionId: string, completed: boolean) => {
        try {
            if (!user) return;

            // 완료 표시될 때만 애니메이션 ID 설정
            if (completed) {
                setCompletedSessionId(sessionId);

                // 잠시 후 애니메이션 ID 초기화
                setTimeout(() => {
                    setCompletedSessionId(null);
                }, 1500);
            }

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

                // 완료 시 성공 메시지 표시
                if (completed) {
                    const sessionName = trainingSessions.find(s => s.id === sessionId)?.name || '훈련 세션';
                    setSuccessMessage(`'${sessionName}' 세션이 완료되었습니다! 🎉`);

                    // 3초 후 메시지 사라짐
                    setTimeout(() => setSuccessMessage(null), 3000);

                    // 뱃지 확인 로직 호출
                    setTimeout(() => {
                        checkForBadges();
                    }, 1000);
                }

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
    }, [user, trainingSessions, checkForBadges]);

    const handleTimerComplete = useCallback(() => {
        if (activeTimerSessionId) {
            // 타이머 완료 시 애니메이션 효과 추가
            setCompletedSessionId(activeTimerSessionId);

            // 애니메이션 효과 후 초기화
            setTimeout(() => {
                setCompletedSessionId(null);
            }, 1500);

            setTimeout(() => {
                handleCheckSession(activeTimerSessionId, true);
                setActiveTimerSessionId(null);

                // 뱃지 확인 로직 호출
                setTimeout(() => {
                    checkForBadges();
                }, 1500);
            }, 0);
        }
    }, [activeTimerSessionId, handleCheckSession, checkForBadges]);

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
        e.currentTarget.style.opacity = '1';
        document.querySelectorAll<HTMLElement>('.session-card').forEach(card => {
            card.style.transform = 'translateY(0)';
        });

        // 드롭 실패 시 상태 초기화를 위해 timeout
        setTimeout(() => {
            setIsSessionDragging(false);
        }, 200);
    };

    const handleSessionDrop = async (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
        e.preventDefault();
        const dragIndex = draggedSessionItem;
        // user가 null이면 함수를 바로 종료
        if (dragIndex === dropIndex || dragIndex === null || !user) return;

        try {
            // 드래그 중 상태 설정
            setIsSessionDragging(true);

            // 성공 메시지 초기화
            setSuccessMessage(null);

            // 세션 재정렬을 위한 깊은 복사 생성
            const newSessions = JSON.parse(JSON.stringify(sessionsForSelectedDate));
            const [removed] = newSessions.splice(dragIndex, 1);
            newSessions.splice(dropIndex, 0, removed);

            // 우선순위 업데이트 - 음수 값 사용 (더 작은 값이 더 높은 우선순위)
            const updatedSessions = newSessions.map((session, index) => ({
                ...session,
                priority: -index  // 더 위에 있을수록 더 작은 음수 값 (-0, -1, -2, ...)
            }));

            // 드래그한 세션의 이름과 생성 "월"을 추출
            const draggedSessionName = removed.name;

            // createdAt이 문자열, Date 또는 Timestamp 객체일 수 있으므로 안전하게 처리
            let draggedSessionMonth: number | null = null;
            let draggedSessionYear: number | null = null;

            if (removed.createdAt) {
                // 문자열이나 숫자인 경우 Date 객체로 변환
                const createdAtDate = new Date(removed.createdAt);

                // 유효한 날짜인지 확인
                if (!isNaN(createdAtDate.getTime())) {
                    draggedSessionMonth = createdAtDate.getMonth() + 1; // 0-11에서 1-12로 변환
                    draggedSessionYear = createdAtDate.getFullYear();
                }
            }

            // 로컬 상태 업데이트 - 선택된 날짜의 세션
            setSessionsForSelectedDate([...updatedSessions]);

            // 전체 훈련 세션 목록에서 같은 이름과 같은 생성 월을 가진 세션들의 우선순위 업데이트
            setTrainingSessions(prev => {
                const newTrainingSessions = [...prev];

                // 같은 이름과 생성 월/년도를 가진 세션 찾기
                const sameNameAndDateSessions = newTrainingSessions.filter(s => {
                    // 이름이 같은지 확인
                    if (s.name !== draggedSessionName) return false;

                    // 생성 월이 추출되지 않았다면 이름만으로 비교
                    if (draggedSessionMonth === null || draggedSessionYear === null) {
                        return true;
                    }

                    // createdAt이 없으면 이름으로만 비교
                    if (!s.createdAt) return true;

                    // 문자열이나 숫자인 경우 Date 객체로 변환
                    const createdAtDate = new Date(s.createdAt);

                    // 유효한 날짜가 아니면 이름으로만 비교
                    if (isNaN(createdAtDate.getTime())) return true;

                    // 세션의 생성 월과 년도 추출
                    const sessionMonth = createdAtDate.getMonth() + 1;
                    const sessionYear = createdAtDate.getFullYear();

                    // 이름이 같고, 생성 월과 년도가 같은 세션만 필터링
                    return sessionMonth === draggedSessionMonth && sessionYear === draggedSessionYear;
                });

                // 우선순위 값 가져오기
                const newPriority = updatedSessions.find(s => s.name === draggedSessionName)?.priority || 0;

                // 같은 이름과 생성 월을 가진 모든 세션의 우선순위 업데이트
                sameNameAndDateSessions.forEach(session => {
                    const index = newTrainingSessions.findIndex(s => s.id === session.id);
                    if (index !== -1) {
                        newTrainingSessions[index] = {
                            ...newTrainingSessions[index],
                            priority: newPriority
                        };
                    }
                });

                return newTrainingSessions;
            });

            // 파이어베이스에 우선순위 업데이트 - 같은 이름과 생성 월을 가진 모든 세션 업데이트
            const batch = writeBatch(db);

            // 전체 세션에서 같은 이름과 생성 월을 가진 세션들 찾기
            const sameNameAndDateSessions = trainingSessions.filter(session => {
                // 이름이 같은지 확인
                if (session.name !== draggedSessionName) return false;

                // 생성 월이 추출되지 않았다면 이름만으로 비교
                if (draggedSessionMonth === null || draggedSessionYear === null) {
                    return true;
                }

                // createdAt이 없으면 이름으로만 비교
                if (!session.createdAt) return true;

                // 문자열이나 숫자인 경우 Date 객체로 변환
                const createdAtDate = new Date(session.createdAt);

                // 유효한 날짜가 아니면 이름으로만 비교
                if (isNaN(createdAtDate.getTime())) return true;

                // 세션의 생성 월과 년도 추출
                const sessionMonth = createdAtDate.getMonth() + 1;
                const sessionYear = createdAtDate.getFullYear();

                // 이름이 같고, 생성 월과 년도가 같은 세션만 필터링
                return sessionMonth === draggedSessionMonth && sessionYear === draggedSessionYear;
            });

            // 새 우선순위 값 가져오기
            const newPriority = updatedSessions.find(s => s.name === draggedSessionName)?.priority || 0;

            // 같은 이름과 생성 월을 가진 모든 세션 업데이트
            sameNameAndDateSessions.forEach((session) => {
                const sessionRef = doc(db, 'trainingSessions', user.uid, 'sessions', session.id);
                batch.update(sessionRef, { priority: newPriority });
            });

            await batch.commit();

            // 성공 메시지 설정
            setSuccessMessage(`'${draggedSessionName}' 세션의 순서가 변경되었습니다`);

            // 3초 후 메시지 사라짐
            setTimeout(() => setSuccessMessage(null), 3000);

            // 약간의 지연 후 강제 리렌더링을 위한 추가 단계
            setTimeout(() => {
                // 전체 데이터 새로고침 트리거
                setForceRefresh(prev => prev + 1);
            }, 100);

        } catch (error) {
            console.error('훈련 세션 우선순위 업데이트 실패:', error);
        } finally {
            // 드래그 종료 후 상태 변경 (약간의 지연 추가)
            setTimeout(() => {
                setIsSessionDragging(false);
            }, 100);

            document.querySelectorAll<HTMLElement>('.session-card').forEach(card => {
                card.style.transform = 'translateY(0)';
            });
        }
    };

    const handleSessionClick = (e: React.MouseEvent, sessionId: string) => {
        // 드래그 중이면 실행하지 않음
        if (isSessionDragging) return;

        // 체크박스 클릭은 무시 (체크박스 기능을 유지하기 위해)
        const target = e.target as Element;
        if (target.tagName === 'INPUT' || target.closest('input') ||
            target.classList.contains('MuiCheckbox-root') ||
            target.closest('.MuiCheckbox-root') ||
            target.classList.contains('MuiFormControlLabel-root') ||
            target.closest('.MuiFormControlLabel-root')) {
            return;
        }

        // 타이머 버튼이나 그 하위 요소 클릭은 무시
        if (target.closest('button')) {
            return;
        }

        // 과거 날짜의 세션은 삭제 불가
        if (selectedDate && selectedDate.isBefore(dayjs(), 'day')) {
            return;
        }

        setSelectedSessionId(sessionId);
        setDeleteSessionDialogOpen(true);
    };

    // 삭제 다이얼로그 닫기
    const handleCloseDeleteSessionDialog = () => {
        setDeleteSessionDialogOpen(false);
        setSelectedSessionId(null);
    };

    // 훈련 세션 삭제 처리
    const handleDeleteSession = async () => {
        if (!selectedSessionId || !user) return;

        try {
            setDeleteLoading(true); // 로딩 시작

            // 선택된 세션 정보 가져오기
            const selectedSession = trainingSessions.find(session => session.id === selectedSessionId);
            if (!selectedSession) {
                console.error('선택된 세션을 찾을 수 없습니다.');
                return;
            }

            // 삭제할 세션의 이름과 생성 월/년도 추출
            const sessionName = selectedSession.name;

            // createdAt이 문자열, Date 또는 Timestamp 객체일 수 있으므로 안전하게 처리
            let sessionMonth: number | null = null;
            let sessionYear: number | null = null;

            if (selectedSession.createdAt) {
                // 문자열이나 숫자인 경우 Date 객체로 변환
                const createdAtDate = new Date(selectedSession.createdAt);

                // 유효한 날짜인지 확인
                if (!isNaN(createdAtDate.getTime())) {
                    sessionMonth = createdAtDate.getMonth() + 1; // 0-11에서 1-12로 변환
                    sessionYear = createdAtDate.getFullYear();
                }
            }

            // 같은 이름과 생성 월/년도를 가진 세션 ID 목록 생성
            const sessionsToDelete = trainingSessions.filter(session => {
                // 이름이 같은지 확인
                if (session.name !== sessionName) return false;

                // 생성 월이 추출되지 않았다면 이름만으로 비교
                if (sessionMonth === null || sessionYear === null) {
                    return true;
                }

                // createdAt이 없으면 이름으로만 비교
                if (!session.createdAt) return true;

                // 문자열이나 숫자인 경우 Date 객체로 변환
                const createdAtDate = new Date(session.createdAt);

                // 유효한 날짜가 아니면 이름으로만 비교
                if (isNaN(createdAtDate.getTime())) return true;

                // 세션의 생성 월과 년도 추출
                const month = createdAtDate.getMonth() + 1;
                const year = createdAtDate.getFullYear();

                // 이름이 같고, 생성 월과 년도가 같은 세션만 필터링
                return month === sessionMonth && year === sessionYear;
            }).map(session => session.id);

            // 일괄 삭제를 위한 batch 작업
            const batch = writeBatch(db);

            sessionsToDelete.forEach(sessionId => {
                const sessionRef = doc(db, 'trainingSessions', user.uid, 'sessions', sessionId);
                batch.delete(sessionRef);
            });

            await batch.commit();

            // 상태 업데이트
            setTrainingSessions(prevSessions =>
                prevSessions.filter(session => !sessionsToDelete.includes(session.id))
            );
            setSessionsForSelectedDate(prevSessions =>
                prevSessions.filter(session => !sessionsToDelete.includes(session.id))
            );

            // handleDeleteSession 함수 내 성공 시 부분 (try 블록 내 마지막 부분)
            console.log(`${sessionsToDelete.length}개의 세션이 삭제되었습니다.`);

            // 성공 메시지 설정
            setSuccessMessage(`${sessionsToDelete.length}개의 "${sessionName}" 세션이 삭제되었습니다.`);

            // 다이얼로그 닫기
            handleCloseDeleteSessionDialog();

            // 3초 후 메시지 사라짐
            setTimeout(() => setSuccessMessage(null), 3000);

        } catch (error) {
            console.error('훈련 세션 삭제 오류:', error);
        } finally {
            setDeleteLoading(false); // 로딩 종료
        }
    };

    // 세션 이름 가져오는 함수
    const getSelectedSessionName = () => {
        if (!selectedSessionId) return '';
        const session = trainingSessions.find(session => session.id === selectedSessionId);
        return session ? session.name : '';
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

                {/* 대시보드 추가 */}
                <Dashboard
                    user={user}
                    trainingSessions={trainingSessions}
                />

                {/* 뱃지 컬렉션 추가 */}
                <BadgeCollection user={user} />

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
                {/* 성공 메시지 */}
                {successMessage && (
                    <Box sx={{
                        position: 'fixed',
                        bottom: 20,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 9999,
                        minWidth: 300,
                        maxWidth: '80%',
                        p: 2,
                        bgcolor: 'rgba(0, 181, 173, 0.9)',
                        color: '#fff',
                        borderRadius: 2,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M8 12l2 2 4-4"></path>
                        </svg>
                        {successMessage}
                    </Box>
                )}
                <DialogContent sx={{ pt: 3 }}>
                    {sessionsForSelectedDate.length > 0 ? (
                        <Box>
                            {sessionsForSelectedDate.map((session, index) => (
                                <Paper
                                    key={`${session.id}-${session.priority}`}
                                    className="session-card"
                                    draggable={!selectedDate.isBefore(dayjs(), 'day')} // 과거 날짜는 드래그 불가
                                    onClick={(e) => handleSessionClick(e, session.id)} // 클릭 이벤트 추가
                                    onDragStart={(e) => handleSessionDragStart(e, index)}
                                    onDragOver={(e) => handleSessionDragOver(e, index)}
                                    onDragLeave={handleSessionDragLeave}
                                    onDragEnd={handleSessionDragEnd}
                                    onDrop={(e) => handleSessionDrop(e, index)}
                                    sx={{
                                        p: 2,
                                        mt: 2,
                                        borderLeft: '4px solid #9147ff',
                                        transition: 'all 0.3s',
                                        cursor: !selectedDate.isBefore(dayjs(), 'day') ? 'grab' : 'default',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&:hover': {
                                            ...((!selectedDate.isBefore(dayjs(), 'day') && !isSessionDragging) && {
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 4px 12px rgba(145, 71, 255, 0.15)'
                                            })
                                        },
                                        '&:active': {
                                            cursor: !selectedDate.isBefore(dayjs(), 'day') ? 'grabbing' : 'default'
                                        },
                                        ...(isSessionDragging && draggedSessionItem === index && {
                                            boxShadow: '0 10px 25px rgba(145, 71, 255, 0.3)',
                                            opacity: 0.6,
                                            border: '1px dashed #9147ff',
                                            borderLeft: '4px solid #9147ff',
                                        }),
                                        ...(session.completed && {
                                            opacity: 0.7,
                                            borderLeft: '4px solid #00b5ad',
                                        }),
                                        ...(completedSessionId === session.id && {
                                            animation: 'pulse 1.5s',
                                            '@keyframes pulse': {
                                                '0%': {
                                                    boxShadow: '0 0 0 0 rgba(0, 181, 173, 0.7)',
                                                },
                                                '70%': {
                                                    boxShadow: '0 0 0 10px rgba(0, 181, 173, 0)',
                                                },
                                                '100%': {
                                                    boxShadow: '0 0 0 0 rgba(0, 181, 173, 0)',
                                                },
                                            },
                                        }),
                                        ...(completedSessionId === session.id && {
                                            '&::after': {
                                                content: '""',
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                background: 'linear-gradient(to right, rgba(0, 181, 173, 0.1), rgba(0, 181, 173, 0))',
                                                animation: 'shine 1.5s ease-in-out',
                                                zIndex: 1,
                                                pointerEvents: 'none',
                                            },
                                            '@keyframes shine': {
                                                '0%': {
                                                    transform: 'translateX(-100%)'
                                                },
                                                '100%': {
                                                    transform: 'translateX(100%)'
                                                },
                                            },
                                        }),
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
                {/* 세션 삭제 확인 다이얼로그 */}
                <Dialog
                    open={deleteSessionDialogOpen}
                    onClose={handleCloseDeleteSessionDialog}
                    PaperProps={{
                        sx: {
                            borderRadius: 2,
                            bgcolor: '#18181b',
                            color: '#efeff1',
                            width: '100%',
                            maxWidth: '400px', // 최대 너비 설정
                            margin: '0 auto', // 중앙 정렬
                            position: 'relative',
                            overflow: 'hidden'
                        }
                    }}
                    BackdropProps={{
                        sx: {
                            backgroundColor: 'rgba(0, 0, 0, 0.7)'
                        }
                    }}
                >
                    <DialogTitle sx={{
                        color: '#efeff1',
                        borderBottom: '1px solid rgba(220, 53, 69, 0.2)',
                        pb: 2,
                        textAlign: 'left', // 왼쪽 정렬
                        fontSize: '1.2rem', // 글자 크기 조정
                        fontWeight: 500
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                                color: '#dc3545',
                                bgcolor: 'rgba(220, 53, 69, 0.1)',
                                p: 1,
                                borderRadius: '50%',
                                display: 'flex'
                            }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                </svg>
                            </Box>
                            훈련 세션 삭제
                        </Box>
                    </DialogTitle>
                    <DialogContent sx={{ py: 3, px: 3 }}>
                        <Typography sx={{
                            color: '#efeff1',
                            mb: 2,
                            mt: 2,
                            fontSize: '1rem',
                            fontWeight: 400,
                            lineHeight: 1.5
                        }}>
                            <strong>{getSelectedSessionName()}</strong> 세션을 삭제하시겠습니까?
                        </Typography>
                        <Box sx={{
                            p: 2,
                            bgcolor: 'rgba(220, 53, 69, 0.05)',
                            border: '1px solid rgba(220, 53, 69, 0.2)',
                            borderRadius: 1,
                            mb: 1,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1.5
                        }}>
                            <Box sx={{
                                color: '#dc3545',
                                mt: 0.5,
                                display: 'flex'
                            }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                            </Box>
                            <Typography sx={{
                                color: '#dc3545',
                                fontSize: '0.9rem',
                                fontWeight: 400,
                                lineHeight: 1.5
                            }}>
                                주의: 같은 이름과 생성 월을 가진 모든 세션이 함께 삭제됩니다.
                            </Typography>
                        </Box>
                        <Typography variant="caption" sx={{
                            color: '#adadb8',
                            display: 'block',
                            mt: 1,
                            fontSize: '0.8rem'
                        }}>
                            이 작업은 되돌릴 수 없습니다.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{
                        p: 2,
                        borderTop: '1px solid rgba(145, 71, 255, 0.1)',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 1
                    }}>
                        <Button
                            onClick={handleCloseDeleteSessionDialog}
                            sx={{
                                color: '#adadb8',
                                fontSize: '0.9rem',
                                padding: '6px 16px',
                                '&:hover': {
                                    bgcolor: 'rgba(173, 173, 184, 0.1)'
                                }
                            }}
                        >
                            취소
                        </Button>
                        <Button
                            onClick={handleDeleteSession}
                            variant="contained"
                            disabled={deleteLoading}
                            startIcon={
                                deleteLoading ? (
                                    <CircularProgress size={16} sx={{ color: '#fff' }} />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 6h18"></path>
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                    </svg>
                                )
                            }
                            sx={{
                                bgcolor: '#dc3545',
                                fontSize: '0.9rem',
                                padding: '6px 16px',
                                '&:hover': {
                                    bgcolor: '#c82333'
                                },
                                '&.Mui-disabled': {
                                    bgcolor: 'rgba(220, 53, 69, 0.6)',
                                    color: '#fff'
                                }
                            }}
                        >
                            {deleteLoading ? '삭제 중...' : '삭제'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Dialog>
            {/* 뱃지 획득 모달 */}
            <BadgeAchievementModal
                open={badgeModalOpen}
                onClose={() => setBadgeModalOpen(false)}
                badge={newBadge}
            />
        </Container>
    );
}