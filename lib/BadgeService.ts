import { collection, doc, getDoc, setDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { Badge } from '@/components/BadgeCollection';
import { TrainingSession } from './types';
import dayjs from 'dayjs';

/**
 * 사용자의 뱃지 획득 여부를 확인하고 새 뱃지를 부여하는 서비스
 */
export class BadgeService {
    private userId: string;
    private trainingSessions: TrainingSession[];
    private cachedBadges: Badge[] | null = null;

    constructor(userId: string, trainingSessions: TrainingSession[]) {
        this.userId = userId;
        this.trainingSessions = trainingSessions;
    }

    /**
     * 사용자의 뱃지 획득 조건을 확인하고 획득한 뱃지 반환
     */
    public async checkBadgeAchievements(): Promise<Badge | null> {
        try {
            // 1. 사용자가 이미 획득한 뱃지 목록 가져오기
            const userBadges = await this.getUserBadges();

            // 2. 모든 뱃지 가져오기
            const allBadges = await this.getAllBadges();

            // 3. 획득하지 않은 뱃지 필터링
            const unearnedBadges = allBadges.filter(badge =>
                !userBadges.some(userBadge => userBadge.id === badge.id)
            );

            // 4. 각 뱃지별로 획득 조건 확인
            for (const badge of unearnedBadges) {
                const isEarned = await this.checkBadgeCriteria(badge);

                if (isEarned) {
                    // 5. 뱃지 획득 기록
                    await this.awardBadge(badge.id);
                    return badge;
                }
            }

            return null; // 새로 획득한 뱃지 없음
        } catch (error) {
            console.error('뱃지 획득 확인 오류:', error);
            return null;
        }
    }

    /**
     * 사용자가 획득한 뱃지 목록 가져오기
     */
    private async getUserBadges(): Promise<Badge[]> {
        try {
            // 사용자 뱃지 컬렉션 참조
            const userBadgesRef = collection(db, 'userBadges', this.userId, 'badges');
            const snapshot = await getDocs(userBadgesRef);

            const badgeIds = snapshot.docs.map(doc => doc.id);

            // 뱃지 정보 가져오기
            const badgesRef = collection(db, 'badges');
            const badgesPromises = badgeIds.map(async (badgeId) => {
                const badgeDoc = await getDoc(doc(badgesRef, badgeId));
                if (badgeDoc.exists()) {
                    const data = badgeDoc.data();
                    return {
                        id: badgeDoc.id,
                        name: data.name || '',
                        description: data.description || '',
                        image: data.image || '',
                        category: data.category || '',
                        requirements: data.requirements || '',
                        earnedByUser: true
                    } as Badge;
                }
                return null;
            });

            const badges = await Promise.all(badgesPromises);
            return badges.filter((badge): badge is Badge => badge !== null);
        } catch (error) {
            console.error('사용자 뱃지 가져오기 오류:', error);
            return [];
        }
    }

    /**
     * 모든 뱃지 목록 가져오기 (캐싱 적용)
     */
    private async getAllBadges(): Promise<Badge[]> {
        // 캐시된 뱃지가 있으면 반환
        if (this.cachedBadges) {
            return this.cachedBadges;
        }

        try {
            const badgesRef = collection(db, 'badges');
            const snapshot = await getDocs(badgesRef);

            const badges = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name || '',
                    description: data.description || '',
                    image: data.image || '',
                    category: data.category || '',
                    requirements: data.requirements || '',
                    earnedByUser: false
                } as Badge;
            });

            // 캐시에 저장
            this.cachedBadges = badges;
            return badges;
        } catch (error) {
            console.error('뱃지 목록 가져오기 오류:', error);
            return [];
        }
    }

    /**
     * 뱃지 획득 조건 확인
     */
    private async checkBadgeCriteria(badge: Badge): Promise<boolean> {
        // 뱃지 ID를 기반으로 조건 확인 로직 실행
        switch (badge.id) {
            case 'first-session':
                return this.checkFirstSessionCompleted();

            case 'five-sessions':
                return this.checkCompletedSessionsCount(5);

            case 'ten-sessions':
                return this.checkCompletedSessionsCount(10);

            case 'twenty-sessions':
                return this.checkCompletedSessionsCount(20);

            case 'fifty-sessions':
                return this.checkCompletedSessionsCount(50);

            case 'streak-3':
                return this.checkConsecutiveDays(3);

            case 'streak-7':
                return this.checkConsecutiveDays(7);

            case 'streak-14':
                return this.checkConsecutiveDays(14);

            case 'streak-30':
                return this.checkConsecutiveDays(30);

            case 'hours-5':
                return this.checkTotalHours(5);

            case 'hours-10':
                return this.checkTotalHours(10);

            case 'hours-20':
                return this.checkTotalHours(20);

            case 'hours-50':
                return this.checkTotalHours(50);

            case 'perfect-week':
                return this.checkPerfectWeek();

            case 'early-bird':
                return this.checkEarlyMorningSessions(5);

            case 'night-owl':
                return this.checkLateNightSessions(5);

            case 'weekend-warrior':
                return this.checkWeekendSessions(8);

            default:
                return false;
        }
    }

    /**
     * 첫 번째 세션 완료 체크
     */
    private checkFirstSessionCompleted(): boolean {
        return this.trainingSessions.some(session => session.completed);
    }

    /**
     * 완료된 세션 수 체크
     */
    private checkCompletedSessionsCount(count: number): boolean {
        const completedSessions = this.trainingSessions.filter(session => session.completed);
        return completedSessions.length >= count;
    }

    /**
     * 연속 훈련일 체크
     */
    private checkConsecutiveDays(days: number): boolean {
        // 현재 날짜 기준으로 이전 날짜들 확인
        const today = dayjs().startOf('day');
        let consecutiveDays = 0;

        for (let i = 0; i < days; i++) {
            const checkDate = today.subtract(i, 'day');
            const checkDateStr = checkDate.format('YYYY-MM-DD');

            // 해당 날짜에 완료한 세션이 있는지 확인
            const hasSessions = this.trainingSessions.some(session => {
                if (!session.date || !session.completed) return false;
                const sessionDate = dayjs(session.date).format('YYYY-MM-DD');
                return sessionDate === checkDateStr;
            });

            if (hasSessions) {
                consecutiveDays++;
            } else {
                break; // 연속이 끊김
            }
        }

        return consecutiveDays >= days;
    }

    /**
     * 총 훈련 시간 체크 (시간 단위)
     */
    private checkTotalHours(hours: number): boolean {
        const completedSessions = this.trainingSessions.filter(session => session.completed);
        const totalMinutes = completedSessions.reduce((sum, session) => {
            return sum + (session.duration || 0);
        }, 0);

        return totalMinutes / 60 >= hours;
    }

    /**
     * 한 주 모든 날 훈련 완료 체크 (일요일~토요일)
     */
    private checkPerfectWeek(): boolean {
        // 현재 날짜 기준으로 이번 주 시작일 가져오기
        const today = dayjs();
        const startOfWeek = today.startOf('week');

        // 주의 각 날짜에 완료된 세션이 있는지 확인
        for (let i = 0; i < 7; i++) {
            const checkDate = startOfWeek.add(i, 'day');

            // 미래 날짜는 건너뛰기
            if (checkDate.isAfter(today)) {
                continue;
            }

            const checkDateStr = checkDate.format('YYYY-MM-DD');

            const hasSessions = this.trainingSessions.some(session => {
                if (!session.date || !session.completed) return false;
                const sessionDate = dayjs(session.date).format('YYYY-MM-DD');
                return sessionDate === checkDateStr;
            });

            if (!hasSessions) {
                return false; // 한 날이라도 훈련이 없으면 실패
            }
        }

        return true;
    }

    /**
     * 아침 일찍 훈련 (오전 5시~오전 8시) 세션 체크
     */
    private checkEarlyMorningSessions(count: number): boolean {
        const earlySessions = this.trainingSessions.filter(session => {
            if (!session.completed || !session.createdAt) return false;

            const sessionTime = dayjs(session.createdAt);
            const hour = sessionTime.hour();

            // 오전 5시~오전 8시 사이
            return hour >= 5 && hour < 8;
        });

        return earlySessions.length >= count;
    }

    /**
     * 늦은 밤 훈련 (오후 10시~오전 1시) 세션 체크
     */
    private checkLateNightSessions(count: number): boolean {
        const nightSessions = this.trainingSessions.filter(session => {
            if (!session.completed || !session.createdAt) return false;

            const sessionTime = dayjs(session.createdAt);
            const hour = sessionTime.hour();

            // 오후 10시~오전 1시 사이
            return hour >= 22 || hour < 1;
        });

        return nightSessions.length >= count;
    }

    /**
     * 주말 훈련 세션 체크
     */
    private checkWeekendSessions(count: number): boolean {
        const weekendSessions = this.trainingSessions.filter(session => {
            if (!session.completed || !session.date) return false;

            const sessionDate = dayjs(session.date);
            const day = sessionDate.day();

            // 토요일(6) 또는 일요일(0)
            return day === 0 || day === 6;
        });

        return weekendSessions.length >= count;
    }

    /**
     * 뱃지 부여 및 데이터베이스에 기록
     */
    private async awardBadge(badgeId: string): Promise<void> {
        try {
            const badgeRef = doc(db, 'userBadges', this.userId, 'badges', badgeId);

            await setDoc(badgeRef, {
                earnedAt: new Date(),
                userId: this.userId
            });

            console.log(`뱃지 획득: ${badgeId}`);
        } catch (error) {
            console.error('뱃지 부여 오류:', error);
            throw error;
        }
    }
}

// 빈 데이터베이스에 기본 뱃지 세트 초기화 함수
export async function initializeDefaultBadges(): Promise<void> {
    try {
        // 뱃지 컬렉션 참조
        const badgesRef = collection(db, 'badges');

        // 이미 뱃지가 있는지 확인
        const snapshot = await getDocs(badgesRef);
        if (!snapshot.empty) {
            console.log('뱃지가 이미 초기화되어 있습니다.');
            return;
        }

        // 기본 뱃지 데이터
        const defaultBadges = [
            {
                id: 'first-session',
                name: '첫 훈련',
                description: '첫 번째 훈련 세션을 완료했습니다',
                image: '/badges/first-session.png',
                category: '달성',
                requirements: '첫 번째 훈련 세션 완료'
            },
            {
                id: 'five-sessions',
                name: '5회 달성',
                description: '5개의 훈련 세션을 완료했습니다',
                image: '/badges/five-sessions.png',
                category: '달성',
                requirements: '5개의 훈련 세션 완료'
            },
            {
                id: 'ten-sessions',
                name: '10회 달성',
                description: '10개의 훈련 세션을 완료했습니다',
                image: '/badges/ten-sessions.png',
                category: '달성',
                requirements: '10개의 훈련 세션 완료'
            },
            {
                id: 'twenty-sessions',
                name: '20회 달성',
                description: '20개의 훈련 세션을 완료했습니다',
                image: '/badges/twenty-sessions.png',
                category: '달성',
                requirements: '20개의 훈련 세션 완료'
            },
            {
                id: 'fifty-sessions',
                name: '50회 달성',
                description: '50개의 훈련 세션을 완료했습니다',
                image: '/badges/fifty-sessions.png',
                category: '달성',
                requirements: '50개의 훈련 세션 완료'
            },
            {
                id: 'streak-3',
                name: '3일 연속',
                description: '3일 연속으로 훈련을 완료했습니다',
                image: '/badges/streak-3.png',
                category: '연속',
                requirements: '3일 연속 훈련 완료'
            },
            {
                id: 'streak-7',
                name: '7일 연속',
                description: '7일 연속으로 훈련을 완료했습니다',
                image: '/badges/streak-7.png',
                category: '연속',
                requirements: '7일 연속 훈련 완료'
            },
            {
                id: 'streak-14',
                name: '14일 연속',
                description: '14일 연속으로 훈련을 완료했습니다',
                image: '/badges/streak-14.png',
                category: '연속',
                requirements: '14일 연속 훈련 완료'
            },
            {
                id: 'streak-30',
                name: '30일 연속',
                description: '30일 연속으로 훈련을 완료했습니다',
                image: '/badges/streak-30.png',
                category: '연속',
                requirements: '30일 연속 훈련 완료'
            },
            {
                id: 'hours-5',
                name: '5시간 달성',
                description: '총 5시간의 훈련을 완료했습니다',
                image: '/badges/hours-5.png',
                category: '시간',
                requirements: '총 5시간 훈련 완료'
            },
            {
                id: 'hours-10',
                name: '10시간 달성',
                description: '총 10시간의 훈련을 완료했습니다',
                image: '/badges/hours-10.png',
                category: '시간',
                requirements: '총 10시간 훈련 완료'
            },
            {
                id: 'hours-20',
                name: '20시간 달성',
                description: '총 20시간의 훈련을 완료했습니다',
                image: '/badges/hours-20.png',
                category: '시간',
                requirements: '총 20시간 훈련 완료'
            },
            {
                id: 'hours-50',
                name: '50시간 달성',
                description: '총 50시간의 훈련을 완료했습니다',
                image: '/badges/hours-50.png',
                category: '시간',
                requirements: '총 50시간 훈련 완료'
            },
            {
                id: 'perfect-week',
                name: '완벽한 한 주',
                description: '한 주 동안 매일 훈련을 완료했습니다',
                image: '/badges/perfect-week.png',
                category: '도전',
                requirements: '한 주 동안 매일 훈련 완료'
            },
            {
                id: 'early-bird',
                name: '얼리버드',
                description: '오전 5시에서 8시 사이에 5번 이상 훈련했습니다',
                image: '/badges/early-bird.png',
                category: '도전',
                requirements: '오전 5시~8시 사이에 5번 이상 훈련'
            },
            {
                id: 'night-owl',
                name: '나이트 오울',
                description: '오후 10시에서 오전 1시 사이에 5번 이상 훈련했습니다',
                image: '/badges/night-owl.png',
                category: '도전',
                requirements: '오후 10시~오전 1시 사이에 5번 이상 훈련'
            },
            {
                id: 'weekend-warrior',
                name: '주말 워리어',
                description: '주말에 8번 이상 훈련했습니다',
                image: '/badges/weekend-warrior.png',
                category: '도전',
                requirements: '주말에 8번 이상 훈련'
            }
        ];

        // 뱃지 추가
        const batch = writeBatch(db);

        defaultBadges.forEach(badge => {
            const badgeRef = doc(db, 'badges', badge.id);
            batch.set(badgeRef, badge);
        });

        await batch.commit();
        console.log('기본 뱃지가 초기화되었습니다.');
    } catch (error) {
        console.error('뱃지 초기화 오류:', error);
        throw error;
    }
}