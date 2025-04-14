'use client';

import { useState } from 'react';
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
    FormHelperText
} from '@mui/material';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ko';

// 훈련 세션의 반복 유형
type RepeatType = 'none' | 'daily' | 'weekly';

// 폼에서 사용될 값들의 타입
interface FormValues {
    name: string;
    description: string;
    startTime: Dayjs | null;
    duration: number; // 분 단위
    repeatType: RepeatType;
}

interface NewTrainingSessionFormProps {
    selectedDate: Dayjs;
    onSubmit: (formValues: FormValues) => void;
    onCancel: () => void;
}

const NewTrainingSessionForm = ({ selectedDate, onSubmit, onCancel }: NewTrainingSessionFormProps) => {
    // 폼 값 상태 관리
    const [formValues, setFormValues] = useState<FormValues>({
        name: '',
        description: '',
        startTime: dayjs().hour(9).minute(0).second(0), // 기본값 오전 9시
        duration: 60, // 기본값 60분
        repeatType: 'none'
    });

    // 유효성 검사 에러 상태
    const [errors, setErrors] = useState<{
        name?: string;
        duration?: string;
    }>({});

    // 텍스트 필드 변경 핸들러
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormValues(prev => ({ ...prev, [name]: value }));

        // 에러 메시지 지우기
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    // 시간 선택 핸들러
    const handleTimeChange = (newTime: Dayjs | null) => {
        setFormValues(prev => ({ ...prev, startTime: newTime }));
    };

    // 반복 유형 선택 핸들러
    const handleRepeatTypeChange = (e: SelectChangeEvent) => {
        setFormValues(prev => ({ ...prev, repeatType: e.target.value as RepeatType }));
    };

    // 훈련 시간(분) 변경 핸들러
    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        setFormValues(prev => ({ ...prev, duration: isNaN(value) ? 0 : value }));

        if (isNaN(value) || value <= 0) {
            setErrors(prev => ({ ...prev, duration: '유효한 시간을 입력해주세요.' }));
        } else {
            setErrors(prev => ({ ...prev, duration: undefined }));
        }
    };

    // 폼 제출 핸들러
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 유효성 검사
        const newErrors: { name?: string; duration?: string } = {};

        if (!formValues.name.trim()) {
            newErrors.name = '훈련 이름을 입력해주세요.';
        }

        if (formValues.duration <= 0) {
            newErrors.duration = '유효한 시간을 입력해주세요.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // 부모 컴포넌트로 값 전달
        onSubmit(formValues);
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
                p: 3,
                maxWidth: 500,
                mx: 'auto',
                backgroundColor: 'white',
                borderRadius: 2,
                boxShadow: 3
            }}
        >
            <Typography variant="h6" gutterBottom>
                {selectedDate.format('YYYY년 MM월 DD일')}에 새 훈련 세션 추가
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
            />

            {/* 훈련 설명 */}
            <TextField
                fullWidth
                margin="normal"
                label="훈련 설명"
                name="description"
                value={formValues.description}
                onChange={handleTextChange}
                multiline
                rows={3}
            />

            {/* 시작 시간 */}
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
                <TimePicker
                    label="시작 시간"
                    value={formValues.startTime}
                    onChange={handleTimeChange}
                    sx={{ mt: 2, width: '100%' }}
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
            />

            {/* 반복 유형 - 월 옵션 제거 */}
            <FormControl fullWidth margin="normal">
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
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
                <Button variant="outlined" onClick={onCancel}>
                    취소
                </Button>
                <Button variant="contained" type="submit" color="primary">
                    저장
                </Button>
            </Box>
        </Box>
    );
};

export default NewTrainingSessionForm;