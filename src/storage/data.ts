// 대사·에피소드·공부 기록 저장. 앱의 다른 코드는 이 파일을 통해서만 저장해요.
// AsyncStorage는 웹에서는 브라우저 저장소, 앱에서는 기기 저장소를 써요.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deletePhoto, loadPhoto, savePhoto } from '../platform/photoStore';
import { newSrs } from '../srs';
import { AppData, Episode, Line, Show } from '../types';
import { normalizeSettings, Settings } from './settings';

const KEY = 'll:data';

export const BACKUP_FORMAT = 'lovely-lines-backup';
export const BACKUP_VERSION = 1;

export function emptyData(): AppData {
  const now = new Date().toISOString();
  // 처음 열면 슈츠가 미리 들어 있어요 (제목만)
  return { shows: [{ id: 'suits', title: 'Suits', createdAt: now }], episodes: [], lines: [], activity: {} };
}

// 예전 버전 데이터에 새 항목이 없어도 안전하게 채워 줍니다.
function normalizeLine(raw: Partial<Line> & { id: string }): Line {
  const now = new Date().toISOString();
  return {
    id: raw.id,
    showId: raw.showId ?? 'suits',
    episodeId: raw.episodeId ?? null,
    text: raw.text ?? '',
    highlight: raw.highlight ?? '',
    meaning: raw.meaning ?? '',
    speaker: raw.speaker ?? '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    note: raw.note ?? '',
    hasPhoto: !!raw.hasPhoto,
    favorite: !!raw.favorite,
    examples: Array.isArray(raw.examples) ? raw.examples : [],
    bestScore: raw.bestScore ?? null,
    srs: { ...newSrs(), ...(raw.srs ?? {}) },
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
  };
}

function normalizeEpisode(raw: Partial<Episode> & { id: string }): Episode {
  return {
    id: raw.id,
    showId: raw.showId ?? 'suits',
    season: Number(raw.season) || 1,
    episode: Number(raw.episode) || 1,
    title: raw.title ?? '',
    watchedAt: raw.watchedAt ?? null,
    together: !!raw.together,
    rating: Number(raw.rating) || 0,
    note: raw.note ?? '',
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

export function normalizeData(raw: Partial<AppData> | null | undefined): AppData {
  if (!raw || typeof raw !== 'object') return emptyData();
  const shows: Show[] = Array.isArray(raw.shows) && raw.shows.length ? raw.shows : emptyData().shows;
  return {
    shows,
    episodes: Array.isArray(raw.episodes) ? raw.episodes.map(normalizeEpisode) : [],
    lines: Array.isArray(raw.lines) ? raw.lines.map(normalizeLine) : [],
    activity: raw.activity && typeof raw.activity === 'object' ? raw.activity : {},
  };
}

export async function loadData(): Promise<AppData> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    return normalizeData(json ? JSON.parse(json) : null);
  } catch {
    return emptyData();
  }
}

export async function saveData(d: AppData): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(d));
}

export { deletePhoto, loadPhoto, savePhoto };

// ---- 백업 ----

export interface Backup {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  data: AppData;
  settings?: Settings;
  photos: Record<string, string>; // 대사 id → 사진
}

export async function createBackup(d: AppData, settings: Settings): Promise<Backup> {
  const photos: Record<string, string> = {};
  for (const l of d.lines) {
    if (!l.hasPhoto) continue;
    const p = await loadPhoto(l.id).catch(() => null);
    if (p) photos[l.id] = p;
  }
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), data: d, settings, photos };
}

/** 백업을 지금 기록과 합쳐요. 같은 대사가 있으면 더 최근에 고친 쪽을 남겨요. */
export async function mergeBackup(
  current: AppData,
  text: string,
): Promise<{ data: AppData; settings?: Settings; added: number }> {
  const b = JSON.parse(text) as Partial<Backup>;
  if (b.format !== BACKUP_FORMAT || !b.data) throw new Error('Lovely Lines 백업 파일이 아니에요.');
  const incoming = normalizeData(b.data);
  const byId = <T extends { id: string }>(xs: T[]) => new Map(xs.map((x) => [x.id, x]));

  const shows = byId(current.shows);
  incoming.shows.forEach((s) => shows.has(s.id) || shows.set(s.id, s));
  const eps = byId(current.episodes);
  incoming.episodes.forEach((e) => eps.has(e.id) || eps.set(e.id, e));
  const lines = byId(current.lines);
  let added = 0;
  for (const l of incoming.lines) {
    const cur = lines.get(l.id);
    if (!cur) added++;
    if (!cur || cur.updatedAt < l.updatedAt) lines.set(l.id, l);
  }
  for (const [id, p] of Object.entries(b.photos ?? {})) await savePhoto(id, p).catch(() => undefined);

  const activity = { ...current.activity };
  for (const [d, v] of Object.entries(incoming.activity)) {
    activity[d] = {
      a: Math.max(activity[d]?.a ?? 0, v.a ?? 0),
      b: Math.max(activity[d]?.b ?? 0, v.b ?? 0),
    };
  }
  return {
    data: { shows: [...shows.values()], episodes: [...eps.values()], lines: [...lines.values()], activity },
    settings: b.settings ? normalizeSettings(b.settings) : undefined,
    added,
  };
}
