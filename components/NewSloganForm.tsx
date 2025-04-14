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
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

// 폼 값들의 타입 정의
interface FormValues {
    content: string;
}

// 폼 컴포넌트
const NewSloganForm = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [formValues, setFormValues] = useState<FormValues>({
        content: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormValues(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const getHighestPriority = async (userId: string): Promise<number> => {
        try {
            const slogansRef = collection(db, 'UserSlogan', userId, 'slogans');
            const q = query(slogansRef, orderBy('priority', 'desc'), limit(1));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                return 1; // 첫 번째 슬로건인 경우
            }

            const highestPriority = querySnapshot.docs[0].data().priority || 0;
            return highestPriority + 1;
        } catch (error) {
            console.error('Error getting highest priority:', error);
            return 1; // 에러 발생 시 기본값 반환
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            router.push('/login');
            return;
        }

        if (!formValues.content.trim()) {
            setError('슬로건 내용을 입력해주세요.');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const sloganCollectionRef = collection(db, 'UserSlogan', user.uid, 'slogans');

            // 가장 높은 priority 값을 가져옴
            const newPriority = await getHighestPriority(user.uid);

            // 슬로건 데이터에 priority 추가
            const sloganData = {
                content: formValues.content,
                createdAt: serverTimestamp(),
                priority: newPriority
            };

            await addDoc(sloganCollectionRef, sloganData);
            router.push('/');
        } catch (error) {
            setError('슬로건 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
            console.error('Error adding slogan:', error);
        } finally {
            setSubmitting(false);
        }
    };

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