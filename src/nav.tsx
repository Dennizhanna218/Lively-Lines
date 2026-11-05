// 화면 이동: 아래 탭 4개 + 그 위에 쌓이는 화면(뒤로 가기로 닫힘).
import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

export type Tab = 'home' | 'episodes' | 'lines' | 'review';

export type Route =
  | { name: 'settings' }
  | { name: 'episode'; id: string }
  | { name: 'lineEdit'; id?: string; showId?: string; episodeId?: string | null }
  | { name: 'line'; id: string }
  | { name: 'practice'; id: string }
  | { name: 'review' }
  | { name: 'quiz' };

interface Nav {
  tab: Tab;
  setTab: (t: Tab) => void;
  stack: Route[];
  push: (r: Route) => void;
  pop: () => void;
  replace: (r: Route) => void;
}

const NavCtx = createContext<Nav | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [tab, setTabState] = useState<Tab>('home');
  const [stack, setStack] = useState<Route[]>([]);
  const value = useMemo<Nav>(
    () => ({
      tab,
      setTab: (t) => {
        setStack([]);
        setTabState(t);
      },
      stack,
      push: (r) => setStack((s) => [...s, r]),
      pop: () => setStack((s) => s.slice(0, -1)),
      replace: (r) => setStack((s) => [...s.slice(0, -1), r]),
    }),
    [tab, stack],
  );
  return <NavCtx.Provider value={value}>{children}</NavCtx.Provider>;
}

export function useNav(): Nav {
  const ctx = useContext(NavCtx);
  if (!ctx) throw new Error('NavProvider 안에서만 쓸 수 있어요');
  return ctx;
}
