'use client'

import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Container, Paper, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {useAuth} from "@/context/AuthContext";
import {db} from "@/lib/firebase";

const AddTrainingSessionPage = () => {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        content: '',
        duration: '',
    });

    // 사용자가 로그인하지 않았다면 로그인 페이지로 리디렉션
    React.useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            alert('로그인이 필요합니다.');
            router.push('/login');
            return;
        }

        try {
            setIsSubmitting(true);

            // Firestore에 데이터 저장
            await addDoc(collection(db, 'trainingSessions'), {
                userId: user.uid,
                name: formData.name,
                content: formData.content,
                duration: parseInt(formData.duration, 10) || 0,
                createdAt: serverTimestamp(),
            });

            // 성공적으로 추가 후 홈페이지로 리디렉션
            router.push('/');
        } catch (error) {
            console.error('훈련 세션 추가 오류:', error);
            alert('훈련 세션을 추가하는 데 문제가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
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
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center" sx={{
                    color: '#efeff1',
                    fontWeight: 700,
                    mb: 3
                }}>
                    새 훈련 세션 추가
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    <TextField
                        fullWidth
                        label="훈련 이름"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        margin="normal"
                        variant="outlined"
                        placeholder="예: 에임 트레이닝, 맵 인지 연습"
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="훈련 내용"
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        required
                        margin="normal"
                        multiline
                        rows={4}
                        variant="outlined"
                        placeholder="훈련의 목표와 세부 내용을 적어주세요"
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="훈련 시간 (분)"
                        name="duration"
                        type="number"
                        value={formData.duration}
                        onChange={handleChange}
                        required
                        margin="normal"
                        variant="outlined"
                        placeholder="예: 30"
                        inputProps={{ min: 1 }}
                        sx={{ mb: 3 }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                        <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => router.push('/')}
                        >
                            취소
                        </Button>

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            startIcon={<SaveIcon />}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <CircularProgress size={24} sx={{ color: 'white' }} /> : '추가하기'}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default AddTrainingSessionPage;