'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#9147ff', // Twitch 보라색
        },
        secondary: {
            main: '#00b5ad', // 민트 그린
        },
        background: {
            default: '#0e0e10', // 어두운 배경
            paper: '#1f1f23',  // 약간 밝은 배경
        },
        text: {
            primary: '#efeff1',
            secondary: '#adadb8',
        },
        error: {
            main: '#ff5252',
        },
        success: {
            main: '#00b5ad',
        }
    },
    typography: {
        fontFamily: '"Rajdhani", "Roboto", "Helvetica", "Arial", sans-serif',
        h3: {
            fontWeight: 700,
            letterSpacing: '0.02em',
        },
        h6: {
            fontWeight: 600,
        },
        button: {
            fontWeight: 600,
            letterSpacing: '0.05em',
        },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    padding: '10px 20px',
                    boxShadow: '0 2px 10px rgba(145, 71, 255, 0.2)',
                    transition: 'all 0.3s',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 15px rgba(145, 71, 255, 0.3)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'linear-gradient(rgba(31, 31, 35, 0.95), rgba(31, 31, 35, 0.98))',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3), 0 0 1px rgba(145, 71, 255, 0.2)',
                    border: '1px solid rgba(145, 71, 255, 0.1)',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                            borderColor: 'rgba(145, 71, 255, 0.3)',
                        },
                        '&:hover fieldset': {
                            borderColor: 'rgba(145, 71, 255, 0.5)',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#9147ff',
                        },
                    },
                },
            },
        },
    },
});

export default theme;