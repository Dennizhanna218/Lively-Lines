import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Highlighted, IconButton, T } from '../components/ui';
import { lineOfTheDay, lineSource } from '../helpers';
import { useNav } from '../nav';
import { speak } from '../platform/speech';
import { useSettings, useStyles } from '../settings/SettingsContext';
import { ThemeColors } from '../settings/themes';
import { coupleStreak, dueLines, isMastered, QUEST_TARGET, weekCount, weekStudied } from '../srs';
import { useData } from '../storage/DataContext';
import { radius, space } from '../theme';

const WEEK = ['월', '화', '수', '목', '금', '토', '일'];

export default function HomeScreen() {
  const { c, settings, updateSettings } = useSettings();
  const { data } = useData();
  const nav = useNav();
  const st = useStyles(makeStyles);

  const streak = coupleStreak(data.activity);
  const week = weekStudied(data.activity);
  const quest = Math.min(QUEST_TARGET, weekCount(data.activity));
  const due = dueLines(data.lines).length;
  const today = lineOfTheDay(data.lines);
  const [a, b] = settings.profiles;

  return (
    <ScrollView contentContainerStyle={st.body}>
      <View style={st.top}>
        <T size={14} weight="bold" color={c.accent}>
          💕 Lovely Lines
        </T>
        <IconButton icon="settings" label="설정" onPress={() => nav.push({ name: 'settings' })} />
      </View>

      <View style={st.streak}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <T size={13} color="#fff" style={{ opacity: 0.9 }}>
              우리 둘의 연속 학습
            </T>
            <T size={30} weight="bold" color="#fff">
              🔥 {streak}일
            </T>
          </View>
          {[a, b].map((p) => {
            const on = settings.activeProfile === p.id;
            return (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                accessibilityLabel={`${p.name}(으)로 공부하기`}
                accessibilityState={{ selected: on }}
                onPress={() => updateSettings({ activeProfile: p.id })}
                style={[st.avatar, on && st.avatarOn]}
              >
                <T size={18}>{p.emoji}</T>
              </Pressable>
            );
          })}
        </View>
        <T size={12} color="#fff" style={{ opacity: 0.9, marginTop: 2 }}>
          지금 공부하는 사람: {settings.activeProfile === 'a' ? a.name : b.name} (얼굴을 눌러 바꿔요)
        </T>
        <View style={st.week}>
          {WEEK.map((d, i) => (
            <View key={d} style={{ alignItems: 'center', gap: 4, flex: 1 }}>
              <T size={11} color="#fff" style={{ opacity: 0.85 }}>
                {d}
              </T>
              <View style={[st.dot, week[i] && st.dotOn]}>
                {week[i] ? <Feather name="check" size={13} color="#FF6F91" /> : null}
              </View>
            </View>
          ))}
        </View>
      </View>

      <Card style={{ gap: 10 }}>
        <T size={13} color={c.muted}>
          ✨ 오늘의 대사
        </T>
        {today ? (
          <>
            <Pressable onPress={() => nav.push({ name: 'line', id: today.id })} style={{ gap: 4 }}>
              <Highlighted text={today.text} highlight={today.highlight} size={18} />
              <T size={14} color={c.ink2}>
                {today.meaning}
                {today.speaker ? ` · ${today.speaker}` : ''}
              </T>
              <T size={12} color={c.muted}>
                {lineSource(data, today)}
              </T>
            </Pressable>
            <View style={st.row}>
              <View style={{ flex: 1 }}>
                <Button title="듣기" icon="volume-2" onPress={() => speak(today.text, settings.speechRate)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="말해 보기" icon="mic" kind="secondary" onPress={() => nav.push({ name: 'practice', id: today.id })} />
              </View>
            </View>
          </>
        ) : (
          <View style={{ gap: 10 }}>
            <T size={15} color={c.ink2}>
              아직 모은 대사가 없어요. 드라마를 보다가 마음에 든 대사를 저장해 보세요!
            </T>
            <Button title="첫 대사 저장하기" icon="plus" onPress={() => nav.push({ name: 'lineEdit' })} />
          </View>
        )}
      </Card>

      <Card style={{ gap: 8 }}>
        <View style={st.row}>
          <T size={16} weight="semibold" style={{ flex: 1 }}>
            💞 이번 주 커플 퀘스트
          </T>
          <T size={13} color={c.muted}>
            {quest}/{QUEST_TARGET}
          </T>
        </View>
        <T size={13} color={c.muted}>
          {quest >= QUEST_TARGET ? '이번 주 퀘스트 완료! 둘 다 최고예요 🎉' : `둘이 합쳐 대사 ${QUEST_TARGET}번 복습하기`}
        </T>
        <View style={st.bar}>
          <View style={[st.barFill, { width: `${(quest / QUEST_TARGET) * 100}%` }]} />
        </View>
        <View style={[st.row, { marginTop: 2 }]}>
          {[a, b].map((p) => (
            <T key={p.id} size={12} color={c.ink2} style={{ flex: 1 }}>
              {p.emoji} {p.name} {weekCount(data.activity, p.id)}번
            </T>
          ))}
        </View>
      </Card>

      <View style={st.stats}>
        <Stat label="모은 대사" value={`${data.lines.length}`} />
        <Stat label="외운 표현" value={`${data.lines.filter(isMastered).length}`} />
        <Stat label="본 에피소드" value={`${data.episodes.filter((e) => e.watchedAt).length}`} />
      </View>

      <Button
        title={due > 0 ? `오늘 복습 ${due}개 시작` : '오늘 복습 끝! 🎉'}
        icon="repeat"
        disabled={due === 0}
        onPress={() => nav.push({ name: 'review' })}
      />
      <Button title="대사 저장하기" icon="plus" kind="secondary" onPress={() => nav.push({ name: 'lineEdit' })} />
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { c } = useSettings();
  const st = useStyles(makeStyles);
  return (
    <View style={st.stat}>
      <T size={12} color={c.muted}>
        {label}
      </T>
      <T size={20} weight="bold">
        {value}
      </T>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    body: { padding: space, paddingBottom: 40, gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center' },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingTop: 8 },
    streak: {
      borderRadius: radius.lg,
      padding: 18,
      backgroundColor: c.accent,
      ...({ backgroundImage: `linear-gradient(135deg, ${c.accent}, #FF6F91)` } as object),
    },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: 'rgba(255,255,255,0.35)',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 6,
    },
    avatarOn: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#fff' },
    week: { flexDirection: 'row', marginTop: 12 },
    dot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.3)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotOn: { backgroundColor: '#fff' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    bar: { height: 8, borderRadius: 4, backgroundColor: c.fill, overflow: 'hidden' },
    barFill: { height: 8, borderRadius: 4, backgroundColor: '#FF6F91' },
    stats: { flexDirection: 'row', gap: 8 },
    stat: { flex: 1, backgroundColor: c.surface, borderRadius: radius.md, padding: 12, gap: 2 },
  });
}
