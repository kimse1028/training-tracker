'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, LinearProgress, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';

interface TrainingTimerProps {
    duration: number; // 분 단위
    sessionName: string;
    onComplete: () => void;
}

const TrainingTimer = ({ duration, sessionName, onComplete }: TrainingTimerProps) => {
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0); // 초 단위
    const [progress, setProgress] = useState(100);
    const totalTime = useRef(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // 컴포넌트가 마운트될 때 초기화
    useEffect(() => {
        // 오디오 요소 생성
        audioRef.current = new Audio('/alarm.mp3');

        // 타이머 초기화
        const initialTime = duration * 60;
        totalTime.current = initialTime;
        setTimeLeft(initialTime);

        return () => {
            // 컴포넌트 언마운트 시 오디오 정리
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [duration]);

    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;

        if (isRunning && !isPaused) {
            timer = setInterval(() => {
                setTimeLeft((prevTime) => {
                    if (prevTime <= 1) {
                        // 타이머 종료
                        clearInterval(timer!);
                        setIsRunning(false);
                        playAlarm();
                        onComplete();
                        return 0;
                    }

                    const newTime = prevTime - 1;
                    const newProgress = (newTime / totalTime.current) * 100;
                    setProgress(newProgress);
                    return newTime;
                });
            }, 1000);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isRunning, isPaused, onComplete]);

    const playAlarm = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(err => console.error('오디오 재생 오류:', err));
        }
    };

    const handleStart = () => {
        setIsRunning(true);
        setIsPaused(false);
    };

    const handlePause = () => {
        setIsPaused(true);
    };

    const handleResume = () => {
        setIsPaused(false);
    };

    const handleStop = () => {
        setIsRunning(false);
        setIsPaused(false);
        setTimeLeft(totalTime.current);
        setProgress(100);
    };

    // 시간 포맷팅 (MM:SS)
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Box sx={{ mt: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#efeff1' }}>
                    {sessionName} - {formatTime(timeLeft)}
                </Typography>
                <Box>
                    {!isRunning ? (
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<PlayArrowIcon />}
                            onClick={handleStart}
                            sx={{
                                bgcolor: '#9147ff',
                                '&:hover': { bgcolor: '#772ce8' }
                            }}
                        >
                            시작
                        </Button>
                    ) : (
                        <>
                            {isPaused ? (
                                <IconButton
                                    size="small"
                                    onClick={handleResume}
                                    sx={{ color: '#9147ff' }}
                                >
                                    <PlayArrowIcon />
                                </IconButton>
                            ) : (
                                <IconButton
                                    size="small"
                                    onClick={handlePause}
                                    sx={{ color: '#9147ff' }}
                                >
                                    <PauseIcon />
                                </IconButton>
                            )}
                            <IconButton
                                size="small"
                                onClick={handleStop}
                                sx={{ color: '#ff8a80', ml: 1 }}
                            >
                                <StopIcon />
                            </IconButton>
                        </>
                    )}
                </Box>
            </Box>

            <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'rgba(145, 71, 255, 0.2)',
                    '& .MuiLinearProgress-bar': {
                        bgcolor: isRunning ? '#00b5ad' : '#9147ff'
                    }
                }}
            />
        </Box>
    );
};

export default TrainingTimer;