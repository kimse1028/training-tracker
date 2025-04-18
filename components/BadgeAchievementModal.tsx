import React from 'react';
import { Dialog, DialogContent, Box, Typography, Button } from '@mui/material';
import { Badge } from './BadgeCollection';

interface BadgeAchievementModalProps {
    open: boolean;
    onClose: () => void;
    badge: Badge | null;
}

const BadgeAchievementModal: React.FC<BadgeAchievementModalProps> = ({ open, onClose, badge }) => {
    if (!badge) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    bgcolor: '#18181b',
                    color: '#efeff1',
                    maxWidth: '400px',
                    textAlign: 'center',
                    backgroundImage: 'radial-gradient(circle at center, rgba(145, 71, 255, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
                    border: '1px solid rgba(145, 71, 255, 0.2)',
                    boxShadow: '0 0 30px rgba(145, 71, 255, 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                }
            }}
        >
            {/* 배경 효과 */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 0,
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: '-50%',
                        left: '-50%',
                        width: '200%',
                        height: '200%',
                        backgroundImage: 'radial-gradient(circle, rgba(145, 71, 255, 0.2) 0%, rgba(145, 71, 255, 0) 60%)',
                        animation: 'rotate 15s linear infinite',
                    },
                    '@keyframes rotate': {
                        '0%': {
                            transform: 'rotate(0deg)',
                        },
                        '100%': {
                            transform: 'rotate(360deg)',
                        },
                    },
                }}
            />

            <DialogContent
                sx={{
                    p: 4,
                    position: 'relative',
                    zIndex: 1
                }}
            >
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    <Typography
                        variant="h5"
                        sx={{
                            mb: 2,
                            color: '#9147ff',
                            fontWeight: 600,
                            textShadow: '0 0 10px rgba(145, 71, 255, 0.5)'
                        }}
                    >
                        축하합니다!
                    </Typography>

                    <Typography
                        variant="body1"
                        sx={{
                            mb: 3,
                            color: '#adadb8'
                        }}
                    >
                        새로운 뱃지를 획득했습니다
                    </Typography>

                    <Box sx={{
                        mb: 3,
                        mt: 1,
                        position: 'relative',
                    }}>
                        {/* 빛나는 효과 */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '180px',
                                height: '180px',
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(145, 71, 255, 0.3) 0%, rgba(0, 0, 0, 0) 70%)',
                                animation: 'pulse 2s infinite',
                                '@keyframes pulse': {
                                    '0%': {
                                        transform: 'translate(-50%, -50%) scale(0.8)',
                                        opacity: 0.5,
                                    },
                                    '50%': {
                                        transform: 'translate(-50%, -50%) scale(1.1)',
                                        opacity: 0.8,
                                    },
                                    '100%': {
                                        transform: 'translate(-50%, -50%) scale(0.8)',
                                        opacity: 0.5,
                                    },
                                },
                            }}
                        />

                        {/* 뱃지 이미지 */}
                        <Box
                            component="img"
                            src={badge.image}
                            alt={badge.name}
                            sx={{
                                width: '120px',
                                height: '120px',
                                position: 'relative',
                                zIndex: 2,
                                animation: 'bounce 1s infinite alternate ease-in-out',
                                '@keyframes bounce': {
                                    '0%': { transform: 'translateY(0)' },
                                    '100%': { transform: 'translateY(-10px)' },
                                },
                            }}
                        />

                        {/* 작은 별들 효과 */}
                        {Array.from({ length: 5 }).map((_, index) => (
                            <Box
                                key={index}
                                sx={{
                                    position: 'absolute',
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                    width: `${Math.random() * 5 + 3}px`,
                                    height: `${Math.random() * 5 + 3}px`,
                                    backgroundColor: '#fff',
                                    borderRadius: '50%',
                                    boxShadow: '0 0 10px #fff, 0 0 20px #9147ff',
                                    animation: `twinkle ${Math.random() * 2 + 1}s infinite alternate`,
                                    '@keyframes twinkle': {
                                        '0%': { opacity: 0.2, transform: 'scale(0.5)' },
                                        '100%': { opacity: 1, transform: 'scale(1)' },
                                    },
                                }}
                            />
                        ))}
                    </Box>

                    <Typography
                        variant="h6"
                        sx={{
                            mb: 1,
                            color: '#efeff1',
                            fontWeight: 600
                        }}
                    >
                        {badge.name}
                    </Typography>

                    <Typography
                        variant="body1"
                        sx={{
                            color: '#adadb8',
                            mb: 4,
                            px: 2
                        }}
                    >
                        {badge.description}
                    </Typography>

                    <Button
                        variant="contained"
                        onClick={onClose}
                        sx={{
                            bgcolor: '#9147ff',
                            px: 4,
                            py: 1,
                            borderRadius: 2,
                            '&:hover': {
                                bgcolor: '#772ce8'
                            },
                            boxShadow: '0 0 15px rgba(145, 71, 255, 0.5)'
                        }}
                    >
                        좋아요!
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default BadgeAchievementModal;