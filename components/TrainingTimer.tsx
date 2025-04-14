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
    const onCompleteRef = useRef(onComplete);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    // 재생이 시작된 시간을 추적하여 중복 재생을 방지
    const lastPlayAttemptRef = useRef(0);
    // 알람 재생 완료 후 onComplete 호출을 위한 리스너 등록 여부 추적
    const alarmEndListenerAddedRef = useRef(false);

    // onComplete props가 변경될 때마다 ref 업데이트
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    // 컴포넌트가 마운트될 때 초기화
    useEffect(() => {
        // 타이머 초기화
        const initialTime = duration * 60;
        totalTime.current = initialTime;
        setTimeLeft(initialTime);

        // 오디오 요소 참조 초기화
        audioElementRef.current = document.getElementById('alarmAudio') as HTMLAudioElement;

        // 오디오 요소 존재 확인 및 로그
        if (audioElementRef.current) {
            console.log('오디오 요소 찾음:', audioElementRef.current);

            // 오디오 재생 상태 모니터링
            const audio = audioElementRef.current;

            // 단일 로그 이벤트 리스너 추가
            const logAudioEvent = (eventName: string) => {
                console.log(`오디오 이벤트: ${eventName}`);
            };

            // 주요 오디오 이벤트 모니터링
            audio.addEventListener('play', () => logAudioEvent('play'));
            audio.addEventListener('playing', () => logAudioEvent('playing'));
            audio.addEventListener('pause', () => logAudioEvent('pause'));
            audio.addEventListener('ended', () => logAudioEvent('ended'));
            audio.addEventListener('error', (e) => {
                console.error('오디오 오류:', e, audio.error);
            });
        } else {
            console.error('오디오 요소를 찾을 수 없음!');
        }

        return () => {
            // 컴포넌트 언마운트 시 정리
            if (audioElementRef.current) {
                try {
                    const audio = audioElementRef.current;
                    audio.pause();
                    audio.currentTime = 0;

                    // 이벤트 리스너 제거
                    const events = ['play', 'playing', 'pause', 'ended', 'error'];
                    events.forEach(event => {
                        audio.removeEventListener(event, () => {});
                    });
                } catch (err) {
                    console.error('오디오 정리 오류:', err);
                }
            }
        };
    }, [duration]);

    // 알람 재생 완료 후 콜백 실행 함수
    const setupCompletionCallback = useCallback(() => {
        if (!audioElementRef.current || alarmEndListenerAddedRef.current) {
            return;
        }

        const audio = audioElementRef.current;

        // 기존에 추가된 ended 이벤트 리스너가 있다면 먼저 제거
        const onEndedHandler = () => {
            console.log('알람 재생 완료, onComplete 호출');
            // 알람이 끝까지 재생된 후 onComplete 호출
            if (onCompleteRef.current) {
                onCompleteRef.current();
            }
            // 한 번만 실행되도록 리스너 제거
            audio.removeEventListener('ended', onEndedHandler);
            alarmEndListenerAddedRef.current = false;
        };

        // ended 이벤트 리스너 추가
        audio.addEventListener('ended', onEndedHandler);
        alarmEndListenerAddedRef.current = true;
        console.log('알람 완료 리스너 등록됨');
    }, []);

    // 알람 재생 함수 - 단순화
    const playAlarm = useCallback(() => {
        console.log('알람 재생 시도');

        if (!audioElementRef.current) {
            console.error('오디오 요소가 존재하지 않음');
            return;
        }

        try {
            const audio = audioElementRef.current;
            const now = Date.now();

            // 500ms 내에 다시 재생 시도를 방지
            if (now - lastPlayAttemptRef.current < 500) {
                console.log('최근 재생 시도가 있었음, 무시됨');
                return;
            }

            // 재생 시도 시간 기록
            lastPlayAttemptRef.current = now;

            // 오디오가 이미 재생 중인지 확인
            if (!audio.paused) {
                console.log('오디오가 이미 재생 중임');
                return;
            }

            // 알람 완료 시 콜백 설정
            setupCompletionCallback();

            // 재생 설정
            audio.currentTime = 0;
            audio.volume = 1.0;
            audio.loop = false; // 반복 재생 비활성화

            // 재생 시도
            const playPromise = audio.play();

            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('알람 재생 성공!');
                    })
                    .catch(err => {
                        console.error('알람 재생 실패:', err);

                        // 재생에 실패한 경우에도 onComplete 호출
                        setTimeout(() => {
                            if (onCompleteRef.current) {
                                onCompleteRef.current();
                            }
                        }, 2000); // 대체 비프음이 충분히 재생될 시간
                    });
            }
        } catch (err) {
            console.error('알람 재생 중 오류:', err);

            // 오류 발생 시에도 onComplete 호출
            setTimeout(() => {
                if (onCompleteRef.current) {
                    onCompleteRef.current();
                }
            }, 2000);
        }
    }, [setupCompletionCallback]);

    // 타이머 완료 처리를 위한 함수
    const handleTimerEnd = useCallback(() => {
        console.log('타이머 완료');

        // 알람 재생 - 이제 알람이 끝날 때 onComplete 콜백이 호출됨
        playAlarm();

        // onComplete 콜백은 알람 재생이 끝날 때 호출되므로 여기서는 제거
    }, [playAlarm]);

    // 타이머 로직
    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;

        if (isRunning && !isPaused) {
            timer = setInterval(() => {
                setTimeLeft((prevTime) => {
                    if (prevTime <= 1) {
                        // 타이머 종료
                        clearInterval(timer!);
                        setIsRunning(false);
                        handleTimerEnd();
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

    // 타이머 제어 함수들
    const handleStart = () => {
        // 타이머 시작 전 오디오 활성화 시도
        if (audioElementRef.current) {
            const audio = audioElementRef.current;
            // 볼륨 0으로 설정하고 짧게 재생 시도
            audio.volume = 0;
            audio.play().then(() => {
                audio.pause();
                audio.currentTime = 0;
                audio.volume = 1.0;
                console.log('자동 재생 활성화 성공');
            }).catch(() => {
                audio.volume = 1.0;
                console.log('자동 재생 활성화 실패 (사용자 상호작용 필요)');
            });
        }

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
            {/* 중요: 직접 오디오 요소 포함 */}
            <audio
                id="alarmAudio"
                src="/alarm.mp3"
                preload="auto"
                style={{ display: 'none' }}
            />

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