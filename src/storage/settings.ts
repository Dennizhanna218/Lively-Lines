// 앱 설정(우리 둘 이름, 색감, 글씨체, 읽기 속도). 기기에만 저장해요.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_FONT_ID } from '../settings/fontOptions';
import { DEFAULT_THEME_ID } from '../settings/themes';
import { Profile } from '../types';

export interface Settings {
  themeId: string;
  fontId: string;
  profiles: [Profile, Profile];
  activeProfile: Profile['id']; // 지금 공부하는 사람
  speechRate: number; // 원어민 음성 기본 속도
}

const KEY = 'll:settings';

export function defaultSettings(): Settings {
  return {
    themeId: DEFAULT_THEME_ID,
    fontId: DEFAULT_FONT_ID,
    profiles: [
      { id: 'a', name: '한나', emoji: '👩' },
      { id: 'b', name: '남편', emoji: '👨' },
    ],
    activeProfile: 'a',
    speechRate: 0.95,
  };
}

export function normalizeSettings(raw: Partial<Settings> | null | undefined): Settings {
  const base = defaultSettings();
  if (!raw || typeof raw !== 'object') return base;
  const p = Array.isArray(raw.profiles) ? raw.profiles : [];
  return {
    themeId: typeof raw.themeId === 'string' ? raw.themeId : base.themeId,
    fontId: typeof raw.fontId === 'string' ? raw.fontId : base.fontId,
    profiles: [
      { ...base.profiles[0], ...(p[0] ?? {}), id: 'a' },
      { ...base.profiles[1], ...(p[1] ?? {}), id: 'b' },
    ],
    activeProfile: raw.activeProfile === 'b' ? 'b' : 'a',
    speechRate: typeof raw.speechRate === 'number' ? raw.speechRate : base.speechRate,
  };
}

export async function loadSettings(): Promise<Settings> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    return normalizeSettings(json ? JSON.parse(json) : null);
  } catch {
    return defaultSettings();
  }
}

export async function saveSettings(s: Settings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
}
