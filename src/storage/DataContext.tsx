// 앱 전체가 함께 쓰는 기록(드라마·에피소드·대사·공부 기록).
// 바뀔 때마다 바로 저장해요. (적자마자 앱을 닫아도 사라지지 않게)
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Grade, newSrs, review } from '../srs';
import { AppData, Episode, Line, Profile, Show } from '../types';
import { newId, todayKey } from '../utils/date';
import { deletePhoto, loadData, saveData, savePhoto } from './data';

export type NewLine = Omit<Line, 'id' | 'srs' | 'createdAt' | 'updatedAt' | 'hasPhoto' | 'examples' | 'bestScore' | 'favorite'> & {
  photo?: string | null;
};

interface Ctx {
  data: AppData;
  replaceData: (d: AppData) => void;
  addShow: (title: string) => Show;
  addEpisode: (e: Pick<Episode, 'showId' | 'season' | 'episode' | 'title'>) => Episode;
  updateEpisode: (id: string, patch: Partial<Episode>) => void;
  deleteEpisode: (id: string) => void;
  addLine: (l: NewLine) => Promise<Line>;
  updateLine: (id: string, patch: Partial<Line>, photo?: string | null) => Promise<void>;
  deleteLine: (id: string) => void;
  reviewLine: (id: string, grade: Grade, who: Profile['id']) => void;
  logActivity: (who: Profile['id'], n?: number) => void;
}

const DataCtx = createContext<Ctx | null>(null);

export function DataProvider({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const ref = useRef<AppData | null>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    loadData().then((d) => {
      ref.current = d;
      setData(d);
    });
  }, []);

  const commit = useCallback((fn: (d: AppData) => AppData) => {
    if (!ref.current) return;
    const next = fn(ref.current);
    ref.current = next;
    setData(next);
    chain.current = chain.current.then(() => saveData(next)).catch(() => undefined);
  }, []);

  const value = useMemo<Ctx | null>(() => {
    if (!data) return null;
    const now = () => new Date().toISOString();
    const bump = (d: AppData, who: Profile['id'], n: number): AppData['activity'] => {
      const day = todayKey();
      const cur = d.activity[day] ?? {};
      return { ...d.activity, [day]: { ...cur, [who]: (cur[who] ?? 0) + n } };
    };
    return {
      data,
      replaceData: (d) => commit(() => d),
      addShow: (title) => {
        const s: Show = { id: newId(), title: title.trim(), createdAt: now() };
        commit((d) => ({ ...d, shows: [...d.shows, s] }));
        return s;
      },
      addEpisode: (e) => {
        const ep: Episode = { ...e, id: newId(), watchedAt: null, together: true, rating: 0, note: '', createdAt: now() };
        commit((d) => ({ ...d, episodes: [...d.episodes, ep] }));
        return ep;
      },
      updateEpisode: (id, patch) =>
        commit((d) => ({ ...d, episodes: d.episodes.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      deleteEpisode: (id) =>
        commit((d) => ({
          ...d,
          episodes: d.episodes.filter((e) => e.id !== id),
          lines: d.lines.map((l) => (l.episodeId === id ? { ...l, episodeId: null } : l)),
        })),
      addLine: async ({ photo, ...l }) => {
        const line: Line = {
          ...l,
          id: newId(),
          hasPhoto: !!photo,
          favorite: false,
          examples: [],
          bestScore: null,
          srs: newSrs(),
          createdAt: now(),
          updatedAt: now(),
        };
        if (photo) await savePhoto(line.id, photo).catch(() => (line.hasPhoto = false));
        commit((d) => ({ ...d, lines: [line, ...d.lines] }));
        return line;
      },
      updateLine: async (id, patch, photo) => {
        let hasPhoto: boolean | undefined;
        if (photo) hasPhoto = await savePhoto(id, photo).then(() => true, () => false);
        else if (photo === null) {
          await deletePhoto(id).catch(() => undefined);
          hasPhoto = false;
        }
        commit((d) => ({
          ...d,
          lines: d.lines.map((l) =>
            l.id === id ? { ...l, ...patch, ...(hasPhoto !== undefined ? { hasPhoto } : {}), updatedAt: now() } : l,
          ),
        }));
      },
      deleteLine: (id) => {
        void deletePhoto(id).catch(() => undefined);
        commit((d) => ({ ...d, lines: d.lines.filter((l) => l.id !== id) }));
      },
      reviewLine: (id, grade, who) =>
        commit((d) => ({
          ...d,
          lines: d.lines.map((l) => (l.id === id ? { ...l, srs: review(l.srs, grade), updatedAt: now() } : l)),
          activity: bump(d, who, 1),
        })),
      logActivity: (who, n = 1) => commit((d) => ({ ...d, activity: bump(d, who, n) })),
    };
  }, [data, commit]);

  if (!value) return <>{fallback}</>;
  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export function useData(): Ctx {
  const ctx = useContext(DataCtx);
  if (!ctx) throw new Error('DataProvider 안에서만 쓸 수 있어요');
  return ctx;
}
