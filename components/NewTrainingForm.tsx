'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    TextField,
    Button,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    SelectChangeEvent,
    FormHelperText,
    Paper
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ko';
import {collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, where} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { RepeatType } from '@/lib/types';

// 폼 값들의 타입 정의
interface FormValues {
    name: string;
    content: string;
    date: Dayjs | null;
    duration: number; // 분 단위
    repeatType: RepeatType;
}

// 폼 컴포넌트
const NewTrainingForm = () => {
    const router = useRouter();
    const { user } = useAuth();

    // 폼 값 상태 관리
    const [formValues, setFormValues] = useState<FormValues>({
        name: '',
        content: '',
        date: dayjs(),
        duration: 60, // 기본값 60분
        repeatType: 'none'
    });

    // 로딩 상태
    const [submitting, setSubmitting] = useState(false);

    // 유효성 검사 에러 상태
    const [errors, setErrors] = useState<{
        name?: string;
        duration?: string;
        date?: string;
    }>({});

    // 텍스트 필드 변경 핸들러
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormValues(prev => ({ ...prev, [name]: value }));

        // 에러 메시지 지우기
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    // 날짜 선택 핸들러
    const handleDateChange = (newDate: Dayjs | null) => {
        setFormValues(prev => ({ ...prev, date: newDate }));

        if (errors.date) {
            setErrors(prev => ({ ...prev, date: undefined }));
        }
    };

    // 반복 유형 선택 핸들러
    const handleRepeatTypeChange = (e: SelectChangeEvent) => {
        setFormValues(prev => ({ ...prev, repeatType: e.target.value as RepeatType }));
    };

    // 훈련 시간(분) 변경 핸들러
    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = parseInt(e.target.value);
        setFormValues(prev => ({ ...prev, duration: isNaN(value) ? 0 : value }));

        if (isNaN(value) || value <= 0) {
            setErrors(prev => ({ ...prev, duration: '유효한 시간을 입력해주세요.' }));
        } else {
            setErrors(prev => ({ ...prev, duration: undefined }));
        }
    };

    // 폼 제출 핸들러
    // 폼 제출 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 유효성 검사
        const newErrors: { name?: string; duration?: string; date?: string } = {};

        if (!formValues.name.trim()) {
            newErrors.name = '훈련 이름을 입력해주세요.';
        }

        if (formValues.duration <= 0) {
            newErrors.duration = '유효한 시간을 입력해주세요.';
        }

        if (!formValues.date) {
            newErrors.date = '날짜를 선택해주세요.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (!user) {
            // 사용자가 로그인되어 있지 않으면 로그인 페이지로 이동
            router.push('/login');
            return;
        }

        try {
            setSubmitting(true);

            if (user && formValues.date) {
                // 날짜 데이터 추출
                const year = formValues.date.format('YYYY');
                const month = formValues.date.format('MM');
                const day = formValues.date.format('DD');

                // 사용자별 sessions 컬렉션 참조
                const sessionsCollectionRef = collection(db, 'trainingSessions', user.uid, 'sessions');

                // 같은 이름의 훈련 세션이 있는지 먼저 확인합니다
                let sessionPriority = 0;
                try {
                    const sameNameQuery = query(
                        sessionsCollectionRef,
                        // 같은 이름의 훈련을 검색합니다
                        where('name', '==', formValues.name),
                        limit(1)
                    );

                    const sameNameSnapshot = await getDocs(sameNameQuery);

                    if (!sameNameSnapshot.empty) {
                        // 같은 이름의 훈련이 있으면 해당 우선순위 사용
                        const existingSession = sameNameSnapshot.docs[0].data();
                        sessionPriority = existingSession.priority || 0;
                        console.log('기존 훈련 우선순위 사용:', sessionPriority);
                    } else {
                        // 같은 이름의 훈련이 없으면 최고 우선순위 + 1
                        const priorityQuery = query(
                            sessionsCollectionRef,
                            orderBy('priority', 'asc'), // 오름차순으로 정렬 (숫자가 작을수록 위로)
                            limit(1)
                        );

                        const prioritySnapshot = await getDocs(priorityQuery);
                        if (!prioritySnapshot.empty) {
                            const highestPriorityDoc = prioritySnapshot.docs[0].data();
                            sessionPriority = (highestPriorityDoc.priority || 0) - 1; // 가장 작은 숫자보다 1 작게
                        } else {
                            sessionPriority = 0; // 첫 번째 항목
                        }
                        console.log('새 우선순위 생성:', sessionPriority);
                    }
                } catch (error) {
                    console.error('우선순위 조회 오류:', error);
                    // 오류 발생 시 기본값 0 사용
                    sessionPriority = 0;
                }

                // 기본 세션 데이터 준비
                const sessionData = {
                    name: formValues.name,
                    content: formValues.content,
                    date: formValues.date.toDate(),
                    year: year,
                    month: month,
                    day: day,
                    duration: formValues.duration,
                    completed: false,
                    createdAt: serverTimestamp(),
                    repeatType: formValues.repeatType,
                    isRepeated: false,
                    priority: sessionPriority // 계산된 우선순위 사용
                };

                // trainingSessions/{userID}/sessions 컬렉션에 문서 추가
                await addDoc(sessionsCollectionRef, sessionData);

                // 반복 일정 생성
                if (formValues.repeatType !== 'none') {
                    let currentDate = formValues.date.clone();
                    const endDate = formValues.date.clone().add(3, 'month'); // 3개월 동안의 반복 세션 생성

                    while (currentDate.isBefore(endDate)) {
                        if (formValues.repeatType === 'daily') {
                            currentDate = currentDate.add(1, 'day');
                        } else if (formValues.repeatType === 'weekly') {
                            currentDate = currentDate.add(1, 'week');
                        }

                        // 반복 세션의 날짜 데이터
                        const repeatYear = currentDate.format('YYYY');
                        const repeatMonth = currentDate.format('MM');
                        const repeatDay = currentDate.format('DD');

                        const repeatSessionData = {
                            name: formValues.name,
                            content: formValues.content,
                            date: currentDate.toDate(),
                            year: repeatYear,
                            month: repeatMonth,
                            day: repeatDay,
                            duration: formValues.duration,
                            completed: false,
                            createdAt: serverTimestamp(),
                            repeatType: formValues.repeatType,
                            isRepeated: true,
                            priority: sessionPriority // 모든 반복 세션에 동일한 우선순위 사용
                        };

                        // 동일한 컬렉션에 반복 세션 추가
                        await addDoc(sessionsCollectionRef, repeatSessionData);
                    }
                }
            }

            // 메인 페이지로 이동
            router.push('/');
        } catch (error) {
            console.error('훈련 세션 추가 오류:', error);
            alert('훈련 세션을 추가하는 중 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    // 취소 핸들러
    const handleCancel = () => {
        router.back();
    };

    return (
        <Paper
            component="form"
            onSubmit={handleSubmit}
            sx={{
                p: 3,
                maxWidth: 600,
                mx: 'auto',
                mt: 4,
                borderRadius: 2,
            }}
        >
            <Typography variant="h5" gutterBottom sx={{ color: '#efeff1', mb: 3 }}>
                새 훈련 세션 추가
            </Typography>

            {/* 훈련 이름 */}
            <TextField
                fullWidth
                margin="normal"
                label="훈련 이름"
                name="name"
                value={formValues.name}
                onChange={handleTextChange}
                error={!!errors.name}
                helperText={errors.name}
                required
                sx={{ mb: 2 }}
            />

            {/* 훈련 내용 */}
            <TextField
                fullWidth
                margin="normal"
                label="훈련 내용"
                name="content"
                value={formValues.content}
                onChange={handleTextChange}
                multiline
                rows={3}
                sx={{ mb: 2 }}
            />

            {/* 날짜 선택 */}
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
                <DatePicker
                    label="훈련 날짜"
                    value={formValues.date}
                    onChange={handleDateChange}
                    slotProps={{
                        textField: {
                            fullWidth: true,
                            margin: 'normal',
                            error: !!errors.date,
                            helperText: errors.date
                        }
                    }}
                    sx={{ mb: 2 }}
                />
            </LocalizationProvider>

            {/* 훈련 시간(분) */}
            <TextField
                fullWidth
                margin="normal"
                label="훈련 시간 (분)"
                name="duration"
                type="number"
                inputProps={{ min: 1 }}
                value={formValues.duration}
                onChange={handleDurationChange}
                error={!!errors.duration}
                helperText={errors.duration}
                required
                sx={{ mb: 2 }}
            />

            {/* 반복 유형 */}
            <FormControl fullWidth margin="normal" sx={{ mb: 3 }}>
                <InputLabel>반복</InputLabel>
                <Select
                    value={formValues.repeatType}
                    label="반복"
                    onChange={handleRepeatTypeChange}
                >
                    <MenuItem value="none">반복 없음</MenuItem>
                    <MenuItem value="daily">매일</MenuItem>
                    <MenuItem value="weekly">매주</MenuItem>
                </Select>
                <FormHelperText>
                    {formValues.repeatType === 'none' ? '이 훈련은 한 번만 진행됩니다.' :
                        formValues.repeatType === 'daily' ? '이 훈련은 매일 반복됩니다.' :
                            '이 훈련은 매주 같은 요일에 반복됩니다.'}
                </FormHelperText>
            </FormControl>

            {/* 버튼 영역 */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 2 }}>
                <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={submitting}
                    sx={{ color: '#adadb8', borderColor: '#adadb8' }}
                >
                    취소
                </Button>
                <Button
                    variant="contained"
                    type="submit"
                    disabled={submitting}
                    sx={{ bgcolor: '#9147ff', '&:hover': { bgcolor: '#772ce8' } }}
                >
                    {submitting ? '저장 중...' : '저장'}
                </Button>
            </Box>
        </Paper>
    );
};

export default NewTrainingForm;