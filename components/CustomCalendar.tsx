'use client';

import { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Button
} from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ko';
import { TrainingSession } from '@/lib/types';

interface DayInfo {
    date: Dayjs;
    isCurrentMonth: boolean;
}

interface CustomCalendarProps {
    trainingSessions: TrainingSession[];
    onDateSelect: (date: Dayjs) => void;
}

// 달력 컴포넌트
const CustomCalendar = ({ trainingSessions, onDateSelect }: CustomCalendarProps) => {
    const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
    const [calendarDays, setCalendarDays] = useState<DayInfo[]>([]);

    // 현재 월의 모든 날짜 가져오기
    useEffect(() => {
        const daysInMonth = currentMonth.daysInMonth();
        const firstDayOfMonth = currentMonth.startOf('month').day(); // 0:일요일, 1:월요일...

        // 달력 그리드 생성 (이전 달, 현재 달, 다음 달 날짜 모두 포함)
        const days: DayInfo[] = [];

        // 이전 달의 날짜 추가
        const prevMonth = currentMonth.subtract(1, 'month');
        const daysInPrevMonth = prevMonth.daysInMonth();

        for (let i = 0; i < firstDayOfMonth; i++) {
            days.unshift({
                date: prevMonth.date(daysInPrevMonth - i),
                isCurrentMonth: false
            });
        }

        // 현재 달의 날짜 추가
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                date: currentMonth.date(i),
                isCurrentMonth: true
            });
        }

        // 다음 달의 날짜 추가 (6주 달력을 만들기 위해 필요한 만큼)
        const nextMonth = currentMonth.add(1, 'month');
        const remainingDays = 42 - days.length; // 7일 x 6주 = 42

        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: nextMonth.date(i),
                isCurrentMonth: false
            });
        }

        setCalendarDays(days);
    }, [currentMonth]);

    // 이전 달로 이동
    const handlePrevMonth = () => {
        setCurrentMonth(currentMonth.subtract(1, 'month'));
    };

    // 다음 달로 이동
    const handleNextMonth = () => {
        setCurrentMonth(currentMonth.add(1, 'month'));
    };

    // 날짜에 훈련 세션이 있는지 확인
    const getSessionsForDate = (date: Dayjs): TrainingSession[] => {
        return trainingSessions.filter(session =>
            session.date && dayjs(session.date).format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
        );
    };

    // 요일 헤더
    const weekdays: string[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    return (
        <Box sx={{ width: '100%' }}>
            {/* 달력 헤더 */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2
            }}>
                <Button onClick={handlePrevMonth}>&lt;</Button>
                <Typography variant="h5">
                    {currentMonth.format('YYYY년 MM월')}
                </Typography>
                <Button onClick={handleNextMonth}>&gt;</Button>
            </Box>

            {/* 요일 헤더와 날짜 그리드를 포함하는 전체 달력 컨테이너 */}
            <Box sx={{
                display: 'grid',
                gridTemplateRows: 'auto 1fr',
                width: '100%'
            }}>
                {/* 요일 헤더 */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)'
                }}>
                    {weekdays.map((day, index) => (
                        <Box key={index} sx={{
                            textAlign: 'center',
                            py: 1,
                            backgroundColor: index === 0 ? 'rgba(255, 0, 0, 0.1)' : (index === 6 ? 'rgba(0, 0, 255, 0.1)' : 'rgba(145, 71, 255, 0.1)'),
                            color: index === 0 ? '#ff8a80' : (index === 6 ? '#8c9eff' : '#9147ff'),
                            fontWeight: 'bold',
                            borderBottom: '1px solid rgba(145, 71, 255, 0.2)'
                        }}>
                            {day}
                        </Box>
                    ))}
                </Box>

                {/* 달력 날짜 그리드 */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gridTemplateRows: 'repeat(6, 100px)'
                }}>
                    {calendarDays.map((dayInfo, index) => {
                        const day = dayInfo.date;
                        const sessions = getSessionsForDate(day);
                        const isToday = day.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
                        const dayOfWeek = day.day(); // 0: 일요일, 6: 토요일

                        return (
                            <Box key={index}
                                 onClick={() => onDateSelect(day)}
                                 sx={{
                                     borderRight: '1px solid rgba(145, 71, 255, 0.1)',
                                     borderBottom: '1px solid rgba(145, 71, 255, 0.1)',
                                     backgroundColor: !dayInfo.isCurrentMonth
                                         ? 'rgba(0, 0, 0, 0.05)'
                                         : (dayOfWeek === 0 ? 'rgba(255, 0, 0, 0.03)' : (dayOfWeek === 6 ? 'rgba(0, 0, 255, 0.03)' : '')),
                                     opacity: dayInfo.isCurrentMonth ? 1 : 0.5,
                                     position: 'relative',
                                     overflow: 'hidden',
                                     cursor: 'pointer',
                                     '&:hover': {
                                         backgroundColor: 'rgba(145, 71, 255, 0.1)',
                                     }
                                 }}>
                                {/* 날짜 번호 */}
                                <Box sx={{
                                    position: 'absolute',
                                    top: 5,
                                    right: 5,
                                    fontSize: '0.8rem',
                                    fontWeight: isToday ? 'bold' : 'normal',
                                    backgroundColor: isToday ? '#00b5ad' : 'transparent',
                                    color: isToday ? 'white' : 'inherit',
                                    width: 20,
                                    height: 20,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {day.format('D')}
                                </Box>

                                {/* 훈련 세션 정보 */}
                                <Box sx={{ p: 1, pt: 3, height: '100%', overflow: 'hidden' }}>
                                    {sessions.map((session, idx) => (
                                        <Box key={idx} sx={{
                                            fontSize: '0.7rem',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            mb: 0.5,
                                            color: session.completed ? '#00b5ad' : '#9147ff',
                                            textDecoration: session.completed ? 'line-through' : 'none'
                                        }}>
                                            {session.name}
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Box>
    );
};

export default CustomCalendar;