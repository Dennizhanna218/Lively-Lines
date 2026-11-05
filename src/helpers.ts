import { AppData, DEFAULT_SPEAKERS, Episode, Line } from './types';
import { todayKey } from './utils/date';

export const epLabel = (e: Pick<Episode, 'season' | 'episode'>) => `S${e.season} E${e.episode}`;

export function lineSource(d: AppData, l: Line): string {
  const show = d.shows.find((s) => s.id === l.showId)?.title ?? '';
  const ep = l.episodeId ? d.episodes.find((e) => e.id === l.episodeId) : null;
  return [show, ep ? epLabel(ep) : ''].filter(Boolean).join(' · ');
}

/** 드라마별 등장인물 버튼: 기본 인물 + 직접 적었던 사람 */
export function speakersFor(d: AppData, showId: string): string[] {
  const base = DEFAULT_SPEAKERS[showId] ?? [];
  const used = d.lines.filter((l) => l.showId === showId && l.speaker).map((l) => l.speaker);
  return [...new Set([...base, ...used])];
}

/** 오늘의 대사: 날짜마다 바뀌고, 즐겨찾기한 대사가 더 자주 나와요 */
export function lineOfTheDay(lines: Line[]): Line | null {
  if (!lines.length) return null;
  const pool = [...lines.filter((l) => l.favorite), ...lines];
  const seed = todayKey()
    .split('')
    .reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  return pool[seed % pool.length];
}

export function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
