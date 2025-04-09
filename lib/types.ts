export interface TrainingSession {
    id: string;
    userId: string;
    title: string;
    description: string;
    date: string; // ISO 형식의 날짜 문자열
    duration: number; // 분 단위
    category: string; // 운동 종류 (예: 근력, 유산소, 유연성 등)
    feeling: number; // 1-5 점수 (낮음 => 높음)
    createdAt: string;
    updatedAt: string;
}