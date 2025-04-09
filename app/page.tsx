'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Container, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
        <Container maxWidth="lg" sx={{ textAlign: 'center', mt: 10 }}>
          <Typography>로딩 중...</Typography>
        </Container>
    );
  }

  if (!user) {
    return null; // 로딩 중이 아니고 사용자가 없으면 리디렉션 전에 빈 화면을 표시
  }

  return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ mb: 4 }}>
            안녕하세요, {user.displayName || '사용자'}님!
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Training Tracker에 오신 것을 환영합니다.
          </Typography>
          <Button
              variant="contained"
              color="primary"
              onClick={logout}
              sx={{
                mt: 2,
                background: 'linear-gradient(45deg, #6f00ff 30%, #00f7ff 90%)',
                border: '2px solid rgba(0, 247, 255, 0.3)',
                '&:hover': {
                  boxShadow: '0 0 15px rgba(111, 0, 255, 0.8)',
                },
              }}
          >
            로그아웃
          </Button>
        </Box>
      </Container>
  );
}