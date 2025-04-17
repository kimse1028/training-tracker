import { Timestamp } from 'firebase/firestore';

/**
 * 훈련 세션의 타입 정의
 */
export type RepeatType = 'none' | 'daily' | 'weekly';

export interface TrainingSession {
    id: string;
    name: string;
    description?: string;
    content?: string;
    date?: string; // YYYY-MM-DD 형식
    startTime?: string; // HH:MM 형식
    duration?: number; // 분 단위
    repeatType?: RepeatType;
    completed: boolean;
    isRepeated?: boolean; // 반복 일정인지 여부
    priority?: number; // 우선순위 필드
}

/**
 * Firestore에서 가져온 원시 훈련 세션 데이터의 타입 정의
 */
export interface FirestoreTrainingSession {
    name: string;
    content: string;
    duration: number;
    completed?: boolean;
    date?: Timestamp;
    createdAt?: Timestamp;
    userId: string;
    priority?: number; // 우선순위 필드
}

