'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
    const onCompleteRef = useRef(onComplete);

    // onComplete props가 변경될 때마다 ref 업데이트
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    // 컴포넌트가 마운트될 때 초기화
    useEffect(() => {
        // 오디오 요소 생성
        audioRef.current = new Audio('/alarm.mp3');
        // 추가: 오디오 미리 로드
        audioRef.current.load();

        // 타이머 초기화
        const initialTime = duration * 60;
        totalTime.current = initialTime;
        setTimeLeft(initialTime);

        return () => {
            // 컴포넌트 언마운트 시 오디오 정리
            if (audioRef.current) {
                // 재생 중인 경우에만 pause 호출
                try {
                    const audio = audioRef.current;
                    if (!audio.paused) {
                        audio.pause();
                    }
                    audioRef.current = null;
                } catch (err) {
                    console.error('오디오 정리 중 오류:', err);
                }
            }
        };
    }, [duration]);

    // 타이머 완료 처리를 위한 함수
    const handleTimerEnd = useCallback(() => {
        playAlarm();
        // 오디오 재생과 콜백 실행 사이에 짧은 지연 추가
        setTimeout(() => {
            if (onCompleteRef.current) {
                onCompleteRef.current();
            }
        }, 100); // 100ms 지연으로 오디오 재생이 시작될 시간 확보
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;

        if (isRunning && !isPaused) {
            timer = setInterval(() => {
                setTimeLeft((prevTime) => {
                    if (prevTime <= 1) {
                        // 타이머 종료
                        clearInterval(timer!);
                        setIsRunning(false);
                        handleTimerEnd(); // 수정: 별도의 함수로 분리
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
    }, [isRunning, isPaused, handleTimerEnd]);

    const playAlarm = () => {
        if (audioRef.current) {
            try {
                audioRef.current.currentTime = 0;

                // 플레이 상태 확인 및 에러 처리 추가
                const playPromise = audioRef.current.play();

                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            // 재생 성공
                        })
                        .catch(error => {
                            // 브라우저에서 자동 재생이 차단되었거나 다른 오류 발생
                            console.log('오디오 재생 오류 (무시 가능):', error);
                        });
                }
            } catch (err) {
                console.error('오디오 처리 오류:', err);
            }
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