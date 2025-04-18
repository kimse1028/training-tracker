import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Divider
} from '@mui/material';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend, CartesianGrid
} from 'recharts';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { TrainingSession } from '@/lib/types';
import {User} from "firebase/auth";


// 로케일 설정
dayjs.locale('ko');

// 인터페이스 정의
interface WeeklyDataItem {
    day: string;
    전체: number;
    완료: number;
}

interface CategoryDataItem {
    name: string;
    minutes: number;
    completed: number;
    total: number;
}

interface DashboardProps {
    user: User;
    trainingSessions: TrainingSession[];
}

const Dashboard: React.FC<DashboardProps> = ({ trainingSessions }) => {
    const [stats, setStats] = useState({
        completionRate: 0,
        totalHours: 0,
        thisWeekHours: 0,
        streakDays: 0,
        totalSessions: 0,
        completedSessions: 0
    });

    const [weeklyData, setWeeklyData] = useState<WeeklyDataItem[]>([]);
    const [categoryData, setCategoryData] = useState<CategoryDataItem[]>([]);

    // 통계 계산 로직
    useEffect(() => {
        if (!trainingSessions || trainingSessions.length === 0) return;

        // 현재 날짜 정보
        const now = dayjs();
        const startOfWeek = now.startOf('week');

        // 세션 수 계산
        const totalSessions = trainingSessions.length;
        const completedSessions = trainingSessions.filter(session => session.completed).length;

        // 완료율 계산
        const completionRate = totalSessions > 0
            ? Math.round((completedSessions / totalSessions) * 100)
            : 0;

        // 총 훈련 시간(시간) 계산
        const totalMinutes = trainingSessions.reduce((sum, session) => {
            return sum + (session.duration || 0);
        }, 0);
        const totalHours = Math.round(totalMinutes / 60 * 10) / 10; // 소수점 첫째자리까지

        // 이번 주 훈련 시간(시간) 계산
        const thisWeekMinutes = trainingSessions
            .filter(session => {
                if (!session.date) return false;
                const sessionDate = dayjs(session.date);
                return sessionDate.isAfter(startOfWeek) && session.completed;
            })
            .reduce((sum, session) => sum + (session.duration || 0), 0);
        const thisWeekHours = Math.round(thisWeekMinutes / 60 * 10) / 10;

        // 연속 훈련일 계산
        let streakDays = 0;
        let currentDay = now.subtract(1, 'day');

        while (true) {
            const dayStr = currentDay.format('YYYY-MM-DD');
            const hasCompletedSession = trainingSessions.some(session => {
                if (!session.date || !session.completed) return false;
                const sessionDate = dayjs(session.date).format('YYYY-MM-DD');
                return sessionDate === dayStr;
            });

            if (hasCompletedSession) {
                streakDays++;
                currentDay = currentDay.subtract(1, 'day');
            } else {
                break;
            }
        }

        // 주간 데이터 계산
        const weekDays = Array.from({ length: 7 }, (_, i) => {
            return startOfWeek.add(i, 'day');
        });

        const weeklyStats = weekDays.map(day => {
            const dayStr = day.format('YYYY-MM-DD');
            const dayName = day.format('ddd');

            const daySessions = trainingSessions.filter(session => {
                if (!session.date) return false;
                const sessionDate = dayjs(session.date).format('YYYY-MM-DD');
                return sessionDate === dayStr;
            });

            const totalMinutes = daySessions.reduce((sum, session) => {
                return sum + (session.duration || 0);
            }, 0);

            const completedMinutes = daySessions
                .filter(session => session.completed)
                .reduce((sum, session) => sum + (session.duration || 0), 0);

            return {
                day: dayName,
                전체: Math.round(totalMinutes / 60 * 10) / 10,
                완료: Math.round(completedMinutes / 60 * 10) / 10,
            };
        });

        // 카테고리별 데이터
        const categories = trainingSessions.reduce((acc: Record<string, CategoryDataItem>, session) => {
            const name = session.name || '기타';

            if (!acc[name]) {
                acc[name] = {
                    name,
                    minutes: 0,
                    completed: 0,
                    total: 0
                };
            }

            acc[name].minutes += session.duration || 0;
            acc[name].total += 1;

            if (session.completed) {
                acc[name].completed += 1;
            }

            return acc;
        }, {});

        const categoryStats = Object.values(categories)
            .sort((a: CategoryDataItem, b: CategoryDataItem) => b.minutes - a.minutes)
            .slice(0, 5); // 상위 5개 카테고리만

        // 상태 업데이트
        setStats({
            completionRate,
            totalHours,
            thisWeekHours,
            streakDays,
            totalSessions,
            completedSessions
        });

        setWeeklyData(weeklyStats);
        setCategoryData(categoryStats);

    }, [trainingSessions]);

    // 색상 설정
    const COLORS = ['#9147ff', '#006e68', '#772ce8', '#00b5ad', '#61357f'];

    return (
        <Paper sx={{
            p: 3,
            mb: 4,
            width: '100%',
            bgcolor: '#18181b',
            borderRadius: 3,
            border: '1px solid rgba(145, 71, 255, 0.15)'
        }}>
            <Typography variant="h6" sx={{ mb: 3, color: '#efeff1', fontWeight: 500 }}>
                훈련 대시보드
            </Typography>

            {/* 통계 카드 영역 - Grid 대신 Flexbox 사용 */}
            <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
                mb: 4
            }}>
                {/* 완료율 카드 */}
                <Box sx={{
                    p: 2,
                    bgcolor: 'rgba(145, 71, 255, 0.08)',
                    borderRadius: 2,
                    border: '1px solid rgba(145, 71, 255, 0.15)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' }
                }}>
                    <Typography variant="body2" sx={{ color: '#adadb8' }}>
                        세션 완료율
                    </Typography>
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                        mt: 1
                    }}>
                        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                            <CircularProgress
                                variant="determinate"
                                value={stats.completionRate}
                                size={80}
                                thickness={4}
                                sx={{ color: '#9147ff' }}
                            />
                            <Box
                                sx={{
                                    top: 0,
                                    left: 0,
                                    bottom: 0,
                                    right: 0,
                                    position: 'absolute',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    component="div"
                                    sx={{ color: '#efeff1' }}
                                >
                                    {stats.completionRate}%
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#adadb8', textAlign: 'center', mt: 1 }}>
                        {stats.completedSessions}/{stats.totalSessions} 완료
                    </Typography>
                </Box>

                {/* 총 훈련 시간 카드 */}
                <Box sx={{
                    p: 2,
                    bgcolor: 'rgba(0, 181, 173, 0.08)',
                    borderRadius: 2,
                    border: '1px solid rgba(0, 181, 173, 0.15)',
                    height: '100%',
                    flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' }
                }}>
                    <Typography variant="body2" sx={{ color: '#adadb8' }}>
                        총 훈련 시간
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h4" sx={{ color: '#00b5ad', fontWeight: 500 }}>
                            {stats.totalHours}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#adadb8' }}>
                            시간
                        </Typography>
                    </Box>
                </Box>

                {/* 이번 주 훈련 시간 카드 */}
                <Box sx={{
                    p: 2,
                    bgcolor: 'rgba(145, 71, 255, 0.08)',
                    borderRadius: 2,
                    border: '1px solid rgba(145, 71, 255, 0.15)',
                    height: '100%',
                    flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' }
                }}>
                    <Typography variant="body2" sx={{ color: '#adadb8' }}>
                        이번 주 훈련 시간
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h4" sx={{ color: '#9147ff', fontWeight: 500 }}>
                            {stats.thisWeekHours}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#adadb8' }}>
                            시간
                        </Typography>
                    </Box>
                </Box>

                {/* 연속 훈련일 카드 */}
                <Box sx={{
                    p: 2,
                    bgcolor: 'rgba(0, 181, 173, 0.08)',
                    borderRadius: 2,
                    border: '1px solid rgba(0, 181, 173, 0.15)',
                    height: '100%',
                    flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' }
                }}>
                    <Typography variant="body2" sx={{ color: '#adadb8' }}>
                        연속 훈련일
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h4" sx={{ color: '#00b5ad', fontWeight: 500 }}>
                            {stats.streakDays}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#adadb8' }}>
                            일
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Divider sx={{ my: 4, borderColor: 'rgba(145, 71, 255, 0.2)' }} />

            {/* 주간 훈련 시간 차트 */}
            <Typography variant="subtitle1" sx={{ mb: 2, color: '#efeff1' }}>
                주간 훈련 시간
            </Typography>
            <Box sx={{ height: 300, mb: 4 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={weeklyData}
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(145, 71, 255, 0.1)" />
                        <XAxis dataKey="day" stroke="#adadb8" />
                        <YAxis stroke="#adadb8" label={{ value: '시간', angle: -90, position: 'insideLeft', fill: '#adadb8' }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#18181b',
                                border: '1px solid rgba(145, 71, 255, 0.2)',
                                borderRadius: '4px',
                                color: '#efeff1'
                            }}
                        />
                        <Legend />
                        <Bar dataKey="전체" fill="#9147ff" name="계획된 시간" />
                        <Bar dataKey="완료" fill="#00b5ad" name="완료된 시간" />
                    </BarChart>
                </ResponsiveContainer>
            </Box>

            {/* 카테고리별 훈련 시간 차트 */}
            <Typography variant="subtitle1" sx={{ mb: 2, color: '#efeff1' }}>
                훈련 유형별 시간 분포
            </Typography>
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2
            }}>
                {/* 바 차트 */}
                <Box sx={{
                    height: 300,
                    flex: { xs: '1 1 100%', md: '7 1 0%' }
                }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={categoryData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(145, 71, 255, 0.1)" />
                            <XAxis type="number" stroke="#adadb8" />
                            <YAxis dataKey="name" type="category" stroke="#adadb8" width={100} />
                            <Tooltip
                                formatter={(value: number) => [`${Math.round(value / 60 * 10) / 10} 시간`, '훈련 시간']}
                                contentStyle={{
                                    backgroundColor: '#18181b',
                                    border: '1px solid rgba(145, 71, 255, 0.2)',
                                    borderRadius: '4px',
                                    color: '#efeff1'
                                }}
                            />
                            <Bar dataKey="minutes" name="분" fill="#9147ff">
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Box>

                {/* 파이 차트 */}
                <Box sx={{
                    height: 300,
                    flex: { xs: '1 1 100%', md: '5 1 0%' }
                }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="minutes"
                                nameKey="name"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number) => [`${Math.round(value / 60 * 10) / 10} 시간`, '훈련 시간']}
                                contentStyle={{
                                    backgroundColor: '#18181b',
                                    border: '1px solid rgba(145, 71, 255, 0.2)',
                                    borderRadius: '4px',
                                    color: '#efeff1'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </Box>
            </Box>
        </Paper>
    );
};

export default Dashboard;