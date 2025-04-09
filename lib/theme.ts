'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#6f00ff', // 네온 보라색
        },
        secondary: {
            main: '#00f7ff', // 네온 청록색
        },
        background: {
            default: '#0a1929', // 어두운 배경
            paper: '#132f4c', // 약간 밝은 어두운 배경
        },
        error: {
            main: '#ff0044', // 네온 핑크
        },
    },
    typography: {
        fontFamily: '"Rajdhani", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 700,
        },
        h2: {
            fontWeight: 600,
        },
        button: {
            fontWeight: 600,
            textTransform: 'none',
        },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderWidth: 2,
                    '&:hover': {
                        boxShadow: '0 0 15px rgba(111, 0, 255, 0.5)',
                    },
                },
                containedPrimary: {
                    background: 'linear-gradient(45deg, #6f00ff 30%, #9b00c9 90%)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'linear-gradient(rgba(19, 47, 76, 0.8), rgba(10, 25, 41, 0.95))',
                    border: '1px solid rgba(111, 0, 255, 0.12)',
                },
            },
        },
    },
});

export default theme;