'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Alert
} from '@mui/material';
import 'dayjs/locale/ko';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

// 폼 값들의 타입 정의
interface FormValues {
    content: string;
}

// 폼 컴포넌트
const NewSloganForm = () => {
    const router = useRouter();
    const { user } = useAuth();

    // 폼 값 상태 관리
    const [formValues, setFormValues] = useState<FormValues>({
        content: '',
    });

    // 로딩 상태
    const [submitting, setSubmitting] = useState(false);
    // 에러 상태
    const [error, setError] = useState<string | null>(null);

    // 텍스트 필드 변경 핸들러
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormValues(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 폼 제출 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            // 사용자가 로그인되어 있지 않으면 로그인 페이지로 이동
            router.push('/login');
            return;
        }

        // 내용이 비어있는지 확인
        if (!formValues.content.trim()) {
            setError('슬로건 내용을 입력해주세요.');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            // 사용자별 slogan 컬렉션 참조
            const sloganCollectionRef = collection(db, 'UserSlogan', user.uid, 'slogans');

            // 기본 세션 데이터 준비
            const sloganData = {
                content: formValues.content,
                createdAt: serverTimestamp(),
            };

            // 컬렉션에 문서 추가
            await addDoc(sloganCollectionRef, sloganData);

            router.push('/');
        } catch (error) {
            setError('슬로건 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
            console.error('Error adding slogan:', error);
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
                새 슬로건 추가
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* 슬로건 내용 */}
            <TextField
                fullWidth
                margin="normal"
                label="슬로건"
                name="content"
                value={formValues.content}
                onChange={handleTextChange}
                multiline
                rows={3}
                sx={{ mb: 2 }}
                error={!!error}
            />

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

export default NewSloganForm;