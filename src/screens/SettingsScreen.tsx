import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Card, Chip, Header, SectionTitle, T, useInputText } from '../components/ui';
import { fontStyles, usePreviewFonts } from '../fonts';
import { useNav } from '../nav';
import { speak } from '../platform/speech';
import { FONT_OPTIONS } from '../settings/fontOptions';
import { useSettings, useStyles } from '../settings/SettingsContext';
import { Theme, ThemeColors, THEMES } from '../settings/themes';
import { createBackup, mergeBackup } from '../storage/data';
import { useData } from '../storage/DataContext';
import { canPickFile, pickBackupFile, saveBackupFile } from '../storage/backupFile';
import { radius, space } from '../theme';
import { Profile } from '../types';
import { todayKey } from '../utils/date';

const EMOJIS = ['👩', '👨', '👧', '👦', '🐰', '🐻', '🐱', '🐶', '🦊', '🐼'];
const RATES = [
  { v: 0.8, label: '천천히' },
  { v: 0.95, label: '보통' },
  { v: 1.1, label: '빠르게' },
];

export default function SettingsScreen() {
  usePreviewFonts();
  const { c, settings, updateSettings } = useSettings();
  const { data, replaceData } = useData();
  const nav = useNav();
  const st = useStyles(makeStyles);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const setProfile = (id: Profile['id'], patch: Partial<Profile>) => {
    const ps = settings.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)) as [Profile, Profile];
    updateSettings({ profiles: ps });
  };

  const exportBackup = async () => {
    try {
      const b = await createBackup(data, settings);
      await saveBackupFile(`lovely-lines-${todayKey()}.json`, JSON.stringify(b));
      setMessage({ text: `대사 ${data.lines.length}개를 백업했어요.` });
    } catch {
      setMessage({ text: '백업하지 못했어요. 다시 시도해 주세요.', error: true });
    }
  };

  const importBackup = async () => {
    const text = await pickBackupFile();
    if (!text) return;
    try {
      const r = await mergeBackup(data, text);
      replaceData(r.data);
      if (r.settings) updateSettings(r.settings);
      setMessage({ text: `새 대사 ${r.added}개를 불러왔어요.` });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : '불러오지 못했어요.', error: true });
    }
  };

  return (
    <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled">
      <Header title="설정" onBack={nav.pop} />

      <Card style={{ gap: 14 }}>
        <SectionTitle title="우리 둘" icon="heart" color={c.accent} />
        {settings.profiles.map((p) => (
          <ProfileRow key={p.id} profile={p} onChange={(patch) => setProfile(p.id, patch)} />
        ))}
      </Card>

      <Card style={{ gap: 10 }}>
        <SectionTitle title="원어민 음성 속도" icon="volume-2" />
        <View style={st.wrap}>
          {RATES.map((r) => (
            <Chip
              key={r.v}
              label={r.label}
              selected={settings.speechRate === r.v}
              onPress={() => {
                updateSettings({ speechRate: r.v });
                speak('Nice to meet you.', r.v);
              }}
            />
          ))}
        </View>
        <T size={12} color={c.muted} style={{ lineHeight: 18 }}>
          음성은 휴대폰에 들어 있는 영어 목소리를 써요. 아이폰은 설정 → 손쉬운 사용 → 읽기 및 말하기 → 음성에서 영어(미국) 목소리를 더 자연스러운 걸로 내려받을 수 있어요.
        </T>
      </Card>

      <Card>
        <SectionTitle title="색감" icon="droplet" color={c.accent} />
        <ThemeGroup title="파스텔 · 차분" themes={THEMES.filter((t) => t.group === 'soft')} />
        <ThemeGroup title="원색" themes={THEMES.filter((t) => t.group === 'vivid')} />
      </Card>

      <Card style={{ gap: 10 }}>
        <SectionTitle title="글씨체" icon="type" />
        {FONT_OPTIONS.map((o) => {
          const selected = settings.fontId === o.id;
          const f = fontStyles(o.id);
          return (
            <Pressable
              key={o.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`글씨체 ${o.name}`}
              onPress={() => updateSettings({ fontId: o.id })}
              style={[st.fontRow, selected && st.fontRowOn]}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[f.bold, { fontSize: Math.round(17 * o.scale), color: c.ink }]}>{o.name}</Text>
                <Text style={[f.regular, { fontSize: Math.round(14 * o.scale), color: c.ink2 }]}>
                  Nice to meet you · {o.desc}
                </Text>
              </View>
              {selected ? <Feather name="check-circle" size={20} color={c.accent} /> : null}
            </Pressable>
          );
        })}
      </Card>

      <Card>
        <SectionTitle title="백업" icon="download" />
        <T size={14} color={c.ink2} style={{ marginTop: -6, lineHeight: 21 }}>
          {Platform.OS === 'web'
            ? '대사와 사진은 이 휴대폰(브라우저)에만 저장돼요. 가끔 백업해 두세요. 남편 휴대폰으로 옮길 때도 백업 파일을 쓰면 돼요.'
            : '대사와 사진은 이 기기에만 저장돼요. 가끔 백업해 두세요.'}
        </T>
        <View style={{ gap: 8 }}>
          <Button title="백업 파일 저장하기" icon="download" onPress={exportBackup} />
          {canPickFile ? <Button title="백업 파일 불러오기" icon="upload" kind="secondary" onPress={importBackup} /> : null}
        </View>
        {message ? (
          <T size={14} weight="semibold" color={message.error ? c.danger : c.accent}>
            {message.text}
          </T>
        ) : null}
      </Card>

      <T size={12} color={c.muted} style={{ textAlign: 'center', marginTop: 4 }}>
        💕 Lovely Lines · 미드 대사로 배우는 우리 둘의 영어
      </T>
    </ScrollView>
  );
}

function ProfileRow({ profile, onChange }: { profile: Profile; onChange: (p: Partial<Profile>) => void }) {
  const { c } = useSettings();
  const st = useStyles(makeStyles);
  const text = useInputText();
  return (
    <View style={{ gap: 8 }}>
      <View style={st.nameBox}>
        <T size={22}>{profile.emoji}</T>
        <TextInput
          value={profile.name}
          onChangeText={(name) => onChange({ name })}
          placeholder="이름"
          placeholderTextColor={c.muted}
          style={[text, { flex: 1, minWidth: 0, paddingVertical: 11 }]}
        />
      </View>
      <View style={st.wrap}>
        {EMOJIS.map((e) => (
          <Pressable
            key={e}
            accessibilityLabel={`${e} 고르기`}
            onPress={() => onChange({ emoji: e })}
            style={[st.emoji, profile.emoji === e && { backgroundColor: c.accentSoft }]}
          >
            <T size={18}>{e}</T>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ThemeGroup({ title, themes }: { title: string; themes: Theme[] }) {
  const { c, settings, updateSettings } = useSettings();
  const st = useStyles(makeStyles);
  return (
    <View style={{ gap: 8 }}>
      <T size={13} weight="medium" color={c.muted}>
        {title}
      </T>
      <View style={st.wrap}>
        {themes.map((t) => {
          const selected = settings.themeId === t.id;
          return (
            <Pressable
              key={t.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`색감 ${t.name}`}
              onPress={() => updateSettings({ themeId: t.id })}
              style={st.themeItem}
            >
              <View
                style={[
                  st.swatch,
                  { backgroundColor: t.colors.bg, borderColor: selected ? c.ink : c.line },
                  selected && { borderWidth: 2 },
                ]}
              >
                <View style={[st.swatchDot, { backgroundColor: t.colors.accent }]}>
                  {selected ? <Feather name="check" size={14} color={t.colors.onAccent} /> : null}
                </View>
              </View>
              <T size={12} weight={selected ? 'semibold' : 'regular'} color={selected ? c.ink : c.ink2}>
                {t.name}
              </T>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    body: { padding: space, paddingBottom: 48, gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center' },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    nameBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: c.fill,
      borderRadius: radius.sm,
      paddingHorizontal: 12,
    },
    emoji: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    themeItem: { width: 64, alignItems: 'center', gap: 6, paddingVertical: 4 },
    swatch: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    swatchDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    fontRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: radius.md,
      backgroundColor: c.fill,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    fontRowOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
  });
}
