import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Tooltip, Skeleton, Divider, Tab, Tabs } from '@mui/material';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {User} from "firebase/auth";

// 뱃지 타입 정의
export interface Badge {
    id: string;
    name: string;
    description: string;
    image: string;
    category: string;
    earnedAt?: Date | null;
    requirements: string;
    earnedByUser: boolean;
}

interface BadgeCollectionProps {
    user: User;
}

const BadgeCollection: React.FC<BadgeCollectionProps> = ({ user }) => {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [tabValue, setTabValue] = useState<number>(0);

    // 뱃지 데이터 가져오기
    useEffect(() => {
        const fetchBadges = async () => {
            if (!user) return;

            try {
                setLoading(true);

                // 1. 사용자가 획득한 뱃지 ID 목록 가져오기
                const userBadgesRef = collection(db, 'userBadges', user.uid, 'badges');
                const userBadgesSnapshot = await getDocs(userBadgesRef);

                const earnedBadgeIds = new Map();
                userBadgesSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    earnedBadgeIds.set(doc.id, data.earnedAt?.toDate() || null);
                });

                // 2. 모든 뱃지 정보 가져오기
                const badgesRef = collection(db, 'badges');
                const badgesQuery = query(badgesRef, orderBy('category'), orderBy('name'));
                const badgesSnapshot = await getDocs(badgesQuery);

                const badgeData = badgesSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.name || '',
                        description: data.description || '',
                        image: data.image || '/badges/placeholder.png',
                        category: data.category || '기타',
                        requirements: data.requirements || '',
                        earnedAt: earnedBadgeIds.get(doc.id) || null,
                        earnedByUser: earnedBadgeIds.has(doc.id)
                    } as Badge;
                });

                setBadges(badgeData);
            } catch (error) {
                console.error('뱃지 데이터 가져오기 오류:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBadges();
    }, [user]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // 뱃지 카테고리
    const categories = ['전체', '달성', '연속', '시간', '도전'];

    // 필터링된 뱃지
    const filteredBadges = tabValue === 0
        ? badges
        : badges.filter(badge => badge.category === categories[tabValue]);

    // 획득한 뱃지와 획득하지 못한 뱃지로 분리
    const earnedBadges = filteredBadges.filter(badge => badge.earnedByUser);
    const unearnedBadges = filteredBadges.filter(badge => !badge.earnedByUser);

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
                나의 뱃지 컬렉션
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'rgba(145, 71, 255, 0.2)', mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        '& .MuiTab-root': { color: '#adadb8' },
                        '& .Mui-selected': { color: '#9147ff' },
                        '& .MuiTabs-indicator': { backgroundColor: '#9147ff' }
                    }}
                >
                    {categories.map((category, index) => (
                        <Tab key={index} label={category} />
                    ))}
                </Tabs>
            </Box>

            {loading ? (
                <Box sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2
                }}>
                    {Array.from(new Array(8)).map((_, index) => (
                        <Box key={index} sx={{
                            flex: {
                                xs: '0 0 calc(50% - 8px)',
                                sm: '0 0 calc(33.33% - 10.67px)',
                                md: '0 0 calc(25% - 12px)'
                            },
                            textAlign: 'center'
                        }}>
                            <Skeleton
                                variant="rectangular"
                                width={80}
                                height={80}
                                sx={{
                                    mx: 'auto',
                                    borderRadius: '50%',
                                    bgcolor: 'rgba(145, 71, 255, 0.1)'
                                }}
                            />
                            <Skeleton
                                variant="text"
                                width={100}
                                sx={{
                                    mx: 'auto',
                                    mt: 1,
                                    bgcolor: 'rgba(145, 71, 255, 0.1)'
                                }}
                            />
                        </Box>
                    ))}
                </Box>
            ) : (
                <>
                    {/* 획득한 뱃지 섹션 */}
                    {earnedBadges.length > 0 && (
                        <>
                            <Typography variant="subtitle1" sx={{ mt: 3, mb: 2, color: '#00b5ad' }}>
                                획득한 뱃지 ({earnedBadges.length})
                            </Typography>

                            <Box sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 2
                            }}>
                                {earnedBadges.map((badge) => (
                                    <Box key={badge.id} sx={{
                                        flex: {
                                            xs: '0 0 calc(50% - 8px)',
                                            sm: '0 0 calc(33.33% - 10.67px)',
                                            md: '0 0 calc(25% - 12px)',
                                            lg: '0 0 calc(16.67% - 13.33px)'
                                        }
                                    }}>
                                        <Tooltip
                                            title={
                                                <Box>
                                                    <Typography variant="subtitle2">{badge.name}</Typography>
                                                    <Typography variant="body2">{badge.description}</Typography>
                                                    {badge.earnedAt && (
                                                        <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                                                            획득: {new Date(badge.earnedAt).toLocaleDateString('ko-KR')}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                            arrow
                                        >
                                            <Box sx={{
                                                textAlign: 'center',
                                                transition: 'all 0.3s',
                                                '&:hover': {
                                                    transform: 'scale(1.05)',
                                                }
                                            }}>
                                                <Box
                                                    component="img"
                                                    src={badge.image}
                                                    alt={badge.name}
                                                    sx={{
                                                        width: {
                                                            xs: '60px',
                                                            sm: '70px',
                                                            md: '80px'
                                                        },
                                                        height: 'auto',
                                                        filter: 'drop-shadow(0 4px 8px rgba(145, 71, 255, 0.4))'
                                                    }}
                                                />
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        display: 'block',
                                                        mt: 1,
                                                        color: '#efeff1',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    {badge.name}
                                                </Typography>
                                            </Box>
                                        </Tooltip>
                                    </Box>
                                ))}
                            </Box>

                            <Divider sx={{ my: 3, borderColor: 'rgba(145, 71, 255, 0.2)' }} />
                        </>
                    )}

                    {/* 미획득 뱃지 섹션 */}
                    {unearnedBadges.length > 0 && (
                        <>
                            <Typography variant="subtitle1" sx={{ mt: 3, mb: 2, color: '#adadb8' }}>
                                도전 과제 ({unearnedBadges.length})
                            </Typography>

                            <Box sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 2
                            }}>
                                {unearnedBadges.map((badge) => (
                                    <Box key={badge.id} sx={{
                                        flex: {
                                            xs: '0 0 calc(50% - 8px)',
                                            sm: '0 0 calc(33.33% - 10.67px)',
                                            md: '0 0 calc(25% - 12px)',
                                            lg: '0 0 calc(16.67% - 13.33px)'
                                        }
                                    }}>
                                        <Tooltip
                                            title={
                                                <Box>
                                                    <Typography variant="subtitle2">{badge.name}</Typography>
                                                    <Typography variant="body2">{badge.description}</Typography>
                                                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#9147ff' }}>
                                                        획득 조건: {badge.requirements}
                                                    </Typography>
                                                </Box>
                                            }
                                            arrow
                                        >
                                            <Box sx={{
                                                textAlign: 'center',
                                                opacity: 0.5,
                                                transition: 'all 0.3s',
                                                '&:hover': {
                                                    opacity: 0.8,
                                                }
                                            }}>
                                                <Box
                                                    component="img"
                                                    src={badge.image}
                                                    alt={badge.name}
                                                    sx={{
                                                        width: {
                                                            xs: '60px',
                                                            sm: '70px',
                                                            md: '80px'
                                                        },
                                                        height: 'auto',
                                                        filter: 'grayscale(100%)'
                                                    }}
                                                />
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        display: 'block',
                                                        mt: 1,
                                                        color: '#adadb8'
                                                    }}
                                                >
                                                    {badge.name}
                                                </Typography>
                                            </Box>
                                        </Tooltip>
                                    </Box>
                                ))}
                            </Box>
                        </>
                    )}

                    {filteredBadges.length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography sx={{ color: '#adadb8' }}>
                                해당 카테고리의 뱃지가 없습니다.
                            </Typography>
                        </Box>
                    )}
                </>
            )}
        </Paper>
    );
};

export default BadgeCollection;