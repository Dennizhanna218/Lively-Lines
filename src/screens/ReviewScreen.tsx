import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Header, Highlighted, T } from '../components/ui';
import { lineSource, shuffle } from '../helpers';
import { useNav } from '../nav';
import { speak } from '../platform/speech';
import { useSettings, useStyles } from '../settings/SettingsContext';
import { ThemeColors } from '../settings/themes';
import { dueLines, Grade, GRADE_LABEL, intervalLabel, nextInterval } from '../srs';
import { useData } from '../storage/DataContext';
import { radius, space } from '../theme';
import { Line } from '../types';

const GRADE_COLORS: Record<Grade, { bg: string; fg: string }> = {
  again: { bg: '#FFE1E1', fg: '#C2493D' },
  hard: { bg: '#FFF1CC', fg: '#9A6B00' },
  good: { bg: '#DDF5E8', fg: '#1B8A5A' },
};

/** 외우고 싶은 표현 자리를 빈칸으로 */
function cloze(l: Line): string | null {
  const h = l.highlight.trim();
  const i = h ? l.text.toLowerCase().indexOf(h.toLowerCase()) : -1;
  if (i < 0) return null;
  return l.text.slice(0, i) + '＿＿＿＿' + l.text.slice(i + h.length);
}

function hint(l: Line): string {
  const target = l.highlight.trim() || l.text;
  return target
    .split(/\s+/)
    .map((w) => w[0] + w.slice(1).replace(/[a-zA-Z]/g, '·'))
    .join(' ');
}

export default function ReviewScreen() {
  const { c, settings } = useSettings();
  const { data, reviewLine } = useData();
  const nav = useNav();
  const st = useStyles(makeStyles);
  // 시작할 때의 복습 목록을 고정해요 (복습하는 동안 목록이 바뀌지 않게)
  const queue = useMemo(() => shuffle(dueLines(data.lines)).map((l) => l.id), []);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [hinted, setHinted] = useState(false);
  const [tally, setTally] = useState<Record<Grade, number>>({ again: 0, hard: 0, good: 0 });

  const line = data.lines.find((l) => l.id === queue[i]);
  const who = settings.activeProfile;
  const me = settings.profiles.find((p) => p.id === who)!;

  if (!line || i >= queue.length) {
    return (
      <ScrollView contentContainerStyle={st.body}>
        <Header title="복습 완료" onBack={nav.pop} />
        <Card style={{ gap: 12, alignItems: 'center', paddingVertical: 28 }}>
          <T size={44}>🎉</T>
          <T size={20} weight="bold">
            {queue.length ? `${queue.length}개 복습 완료!` : '오늘 복습할 대사가 없어요'}
          </T>
          {queue.length ? (
            <T size={14} color={c.ink2}>
              😎 {tally.good} · 🤔 {tally.hard} · 😵 {tally.again}
            </T>
          ) : null}
          <T size={13} color={c.muted}>
            {me.emoji} {me.name}의 기록으로 남았어요
          </T>
        </Card>
        <Button title="돌아가기" onPress={nav.pop} />
      </ScrollView>
    );
  }

  const blank = cloze(line);
  const grade = (g: Grade) => {
    reviewLine(line.id, g, who);
    setTally({ ...tally, [g]: tally[g] + 1 });
    setShown(false);
    setHinted(false);
    setI(i + 1);
  };

  return (
    <ScrollView contentContainerStyle={st.body}>
      <Header title="오늘의 복습" sub={`${me.emoji} ${me.name} · ${i + 1} / ${queue.length}`} onBack={nav.pop} />
      <View style={st.progress}>
        <View style={[st.progressFill, { width: `${(i / queue.length) * 100}%` }]} />
      </View>

      <Card style={{ gap: 14, alignItems: 'center', paddingVertical: 26 }}>
        <T size={12} color={c.muted}>
          {lineSource(data, line)}
          {line.speaker ? ` · ${line.speaker}` : ''}
        </T>
        <T size={13} color={c.muted}>
          한국어를 보고 영어로 말해 보세요
        </T>
        <T size={20} weight="bold" style={{ textAlign: 'center' }}>
          {line.meaning || '(뜻 없음) 대사를 떠올려 보세요'}
        </T>
        {!shown && blank ? (
          <T size={16} weight="medium" color={c.ink2} style={{ textAlign: 'center' }}>
            {blank}
          </T>
        ) : null}
        {!shown && hinted ? (
          <T size={15} color={c.accent} style={{ letterSpacing: 1 }}>
            {hint(line)}
          </T>
        ) : null}
        {shown ? (
          <Pressable onPress={() => speak(line.text, settings.speechRate)} style={{ alignItems: 'center', gap: 6 }}>
            <Highlighted text={line.text} highlight={line.highlight} size={20} />
            <T size={12} color={c.muted}>
              🔊 눌러서 다시 듣기
            </T>
          </Pressable>
        ) : null}
      </Card>

      {!shown ? (
        <View style={st.row}>
          <View style={{ flex: 1 }}>
            <Button title="힌트" icon="help-circle" kind="secondary" disabled={hinted} onPress={() => setHinted(true)} />
          </View>
          <View style={{ flex: 1.6 }}>
            <Button
              title="정답 보기"
              icon="eye"
              onPress={() => {
                setShown(true);
                speak(line.text, settings.speechRate);
              }}
            />
          </View>
        </View>
      ) : (
        <View style={st.row}>
          {(['again', 'hard', 'good'] as Grade[]).map((g) => (
            <Pressable
              key={g}
              accessibilityRole="button"
              accessibilityLabel={GRADE_LABEL[g].label}
              onPress={() => grade(g)}
              style={({ pressed }) => [st.grade, { backgroundColor: GRADE_COLORS[g].bg }, pressed && { opacity: 0.7 }]}
            >
              <T size={15} weight="bold" color={GRADE_COLORS[g].fg}>
                {GRADE_LABEL[g].emoji} {GRADE_LABEL[g].label}
              </T>
              <T size={11} color={GRADE_COLORS[g].fg}>
                {intervalLabel(nextInterval(line.srs, g))}
              </T>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    body: { padding: space, paddingBottom: 48, gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center' },
    row: { flexDirection: 'row', gap: 8 },
    progress: { height: 6, borderRadius: 3, backgroundColor: c.fill, overflow: 'hidden', marginHorizontal: 4 },
    progressFill: { height: 6, borderRadius: 3, backgroundColor: c.accent },
    grade: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 14, borderRadius: radius.md },
  });
}
