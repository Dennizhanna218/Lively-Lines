import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Header, T } from '../components/ui';
import { useNav } from '../nav';
import { useSettings, useStyles } from '../settings/SettingsContext';
import { ThemeColors } from '../settings/themes';
import { dueLines, isMastered } from '../srs';
import { useData } from '../storage/DataContext';
import { radius, space } from '../theme';
import { addDays, todayKey, weekdayOf } from '../utils/date';

export const quizLines = <T extends { meaning: string; text: string }>(lines: T[]) =>
  lines.filter((l) => l.meaning.trim() && l.text.trim());

export default function ReviewTab() {
  const { c, settings } = useSettings();
  const { data } = useData();
  const nav = useNav();
  const st = useStyles(makeStyles);
  const due = dueLines(data.lines).length;
  const canQuiz = quizLines(data.lines).length >= 3;
  const [a, b] = settings.profiles;

  // 앞으로 7일 동안 복습할 개수
  const upcoming = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(todayKey(), i + 1);
    return { d, n: data.lines.filter((l) => l.srs.due === d).length };
  });
  const max = Math.max(1, ...upcoming.map((u) => u.n));

  return (
    <ScrollView contentContainerStyle={st.body}>
      <Header title="복습" sub={`외운 표현 ${data.lines.filter(isMastered).length}개`} />

      <Card style={{ gap: 10 }}>
        <T size={13} color={c.muted}>
          🔁 오늘의 복습
        </T>
        <T size={26} weight="bold">
          {due > 0 ? `${due}개 남았어요` : '오늘 복습 끝! 🎉'}
        </T>
        <T size={13} color={c.ink2} style={{ lineHeight: 20 }}>
          한국어 뜻을 보고 영어로 말해 본 다음 정답을 확인해요. 몰라요는 내일, 헷갈려요는 며칠 뒤, 알아요는 일주일 뒤에 다시 나와요.
        </T>
        <Button title="복습 시작" icon="play" disabled={due === 0} onPress={() => nav.push({ name: 'review' })} />
      </Card>

      <Card style={{ gap: 10 }}>
        <T size={13} color={c.muted}>
          💞 커플 퀴즈 대결
        </T>
        <T size={20} weight="bold">
          {a.emoji} {a.name} vs {b.emoji} {b.name}
        </T>
        <T size={13} color={c.ink2}>
          한 휴대폰으로 번갈아 풀면서 누가 더 많이 기억하는지 겨뤄 봐요.
        </T>
        <Button
          title={canQuiz ? '대결 시작' : '뜻이 적힌 대사가 3개 이상 필요해요'}
          icon="zap"
          kind={canQuiz ? 'primary' : 'secondary'}
          disabled={!canQuiz}
          onPress={() => nav.push({ name: 'quiz' })}
        />
      </Card>

      <Card style={{ gap: 10 }}>
        <T size={13} color={c.muted}>
          📅 앞으로 7일 복습 일정
        </T>
        <View style={st.chart}>
          {upcoming.map((u) => (
            <View key={u.d} style={st.col}>
              <T size={11} color={c.muted}>
                {u.n || ''}
              </T>
              <View style={[st.bar, { height: 6 + (u.n / max) * 60, opacity: u.n ? 1 : 0.3 }]} />
              <T size={11} color={c.ink2}>
                {weekdayOf(u.d)}
              </T>
            </View>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    body: { padding: space, paddingBottom: 40, gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center' },
    chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 100 },
    col: { flex: 1, alignItems: 'center', gap: 4, justifyContent: 'flex-end' },
    bar: { width: '70%', borderRadius: radius.sm / 2, backgroundColor: c.accent },
  });
}
