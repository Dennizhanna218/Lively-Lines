// 간격 반복 복습: 잊을 때쯤 다시 보여 줘요.
import { Activity, Line, Profile, Srs } from './types';
import { addDays, todayKey } from './utils/date';

export type Grade = 'again' | 'hard' | 'good';

export const GRADE_LABEL: Record<Grade, { label: string; emoji: string }> = {
  again: { label: '몰라요', emoji: '😵' },
  hard: { label: '헷갈려요', emoji: '🤔' },
  good: { label: '알아요', emoji: '😎' },
};

export function newSrs(): Srs {
  return { due: todayKey(), interval: 0, reps: 0, lapses: 0, lastReviewedAt: null };
}

/** 이 답을 고르면 며칠 뒤에 다시 보게 되는지 */
export function nextInterval(s: Srs, g: Grade): number {
  if (g === 'again') return 1;
  if (g === 'hard') return s.reps === 0 ? 3 : Math.max(2, Math.round(s.interval * 1.5));
  return s.reps === 0 ? 7 : Math.max(8, Math.round(s.interval * 2.5));
}

export function review(s: Srs, g: Grade): Srs {
  const interval = nextInterval(s, g);
  return {
    due: addDays(todayKey(), interval),
    interval,
    reps: g === 'again' ? 0 : s.reps + 1,
    lapses: g === 'again' ? s.lapses + 1 : s.lapses,
    lastReviewedAt: new Date().toISOString(),
  };
}

export function intervalLabel(days: number): string {
  if (days <= 1) return '내일';
  if (days < 7) return `${days}일 뒤`;
  if (days < 30) return `${Math.round(days / 7)}주 뒤`;
  return `${Math.round(days / 30)}달 뒤`;
}

export const dueLines = (lines: Line[]) => lines.filter((l) => l.srs.due <= todayKey());

/** 3주 이상 간격이면 '외운 표현'으로 쳐요 */
export const isMastered = (l: Line) => l.srs.interval >= 21;

// ---- 연속 학습 · 커플 퀘스트 ----

export const QUEST_TARGET = 10;

const studied = (a: Activity, d: string) => Object.values(a[d] ?? {}).some((n) => (n ?? 0) > 0);

/** 둘 중 누구라도 공부한 날이 며칠 연속인지 (오늘 아직 안 했으면 어제까지) */
export function coupleStreak(a: Activity): number {
  let d = todayKey();
  if (!studied(a, d)) d = addDays(d, -1);
  let n = 0;
  while (studied(a, d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** 이번 주(월~일) 날짜들 */
export function thisWeek(): string[] {
  const today = todayKey();
  const [y, m, dd] = today.split('-').map(Number);
  const dow = (new Date(y, m - 1, dd).getDay() + 6) % 7; // 월=0
  return Array.from({ length: 7 }, (_, i) => addDays(today, i - dow));
}

export function weekStudied(a: Activity): boolean[] {
  return thisWeek().map((d) => studied(a, d));
}

/** 이번 주 둘이 합쳐 공부한 횟수 */
export function weekCount(a: Activity, who?: Profile['id']): number {
  return thisWeek().reduce((sum, d) => {
    const day = a[d] ?? {};
    return sum + (who ? (day[who] ?? 0) : (day.a ?? 0) + (day.b ?? 0));
  }, 0);
}
