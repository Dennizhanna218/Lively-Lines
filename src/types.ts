// Lovely Lines 데이터 구조. 화면·저장 방식과 상관없는 순수 데이터라서
// 웹앱 → 네이티브 앱으로 옮겨도 그대로 쓰여요.

export interface Show {
  id: string;
  title: string; // 예: Suits
  createdAt: string;
}

export interface Episode {
  id: string;
  showId: string;
  season: number;
  episode: number;
  title: string; // 비워 둬도 돼요
  watchedAt: string | null; // YYYY-MM-DD
  together: boolean; // 둘이 같이 봤는지
  rating: number; // 0~5
  note: string;
  createdAt: string;
}

/** 복습 일정 (간격 반복) */
export interface Srs {
  due: string; // 다음 복습 날짜 YYYY-MM-DD
  interval: number; // 지금 간격(일)
  reps: number; // 맞힌 횟수
  lapses: number; // 잊어버린 횟수
  lastReviewedAt: string | null;
}

export interface Line {
  id: string;
  showId: string;
  episodeId: string | null;
  text: string; // 영어 대사
  highlight: string; // 외우고 싶은 표현 (대사 안의 일부)
  meaning: string; // 한국어 뜻
  speaker: string;
  tags: string[];
  note: string;
  hasPhoto: boolean; // 장면 사진은 따로 저장 (photoStore)
  favorite: boolean;
  examples: string[]; // '내 상황으로 바꿔 말하기'에서 만든 문장
  bestScore: number | null; // 따라 말하기 최고 점수
  srs: Srs;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: 'a' | 'b';
  name: string;
  emoji: string;
}

/** 날짜별·사람별 공부한 횟수 (연속 학습·커플 퀘스트 계산용) */
export type Activity = Record<string, Partial<Record<Profile['id'], number>>>;

export interface AppData {
  shows: Show[];
  episodes: Episode[];
  lines: Line[];
  activity: Activity;
}

export const TAGS: { key: string; label: string }[] = [
  { key: 'business', label: '💼 비즈니스' },
  { key: 'cool', label: '😎 멋진 말' },
  { key: 'funny', label: '😂 웃긴 말' },
  { key: 'daily', label: '🗣️ 일상 회화' },
  { key: 'slang', label: '🔥 슬랭' },
];

export function tagLabel(key: string): string {
  return TAGS.find((t) => t.key === key)?.label ?? key;
}

/** 드라마별 기본 등장인물 버튼 (직접 추가한 사람도 함께 보여 줘요) */
export const DEFAULT_SPEAKERS: Record<string, string[]> = {
  suits: ['Harvey', 'Mike', 'Donna', 'Louis', 'Jessica', 'Rachel'],
};
