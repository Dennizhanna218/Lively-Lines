import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Header, T } from '../components/ui';
import { shuffle } from '../helpers';
import { useNav } from '../nav';
import { speak } from '../platform/speech';
import { useSettings, useStyles } from '../settings/SettingsContext';
import { ThemeColors } from '../settings/themes';
import { useData } from '../storage/DataContext';
import { radius, shadow, space } from '../theme';
import { Profile } from '../types';
import { quizLines } from './ReviewTab';

const ROUNDS = 10;

export default function QuizScreen() {
  const { c, settings } = useSettings();
  const { data, logActivity } = useData();
  const nav = useNav();
  const st = useStyles(makeStyles);
  const [a, b] = settings.profiles;

  // 문제 만들기: 뜻을 보고 맞는 영어 대사 고르기 (보기 3개)
  const questions = useMemo(() => {
    const pool = quizLines(data.lines);
    return shuffle(pool)
      .slice(0, Math.min(ROUNDS, pool.length))
      .map((answer, i) => {
        const others = shuffle(pool.filter((l) => l.id !== answer.id && l.text !== answer.text)).slice(0, 2);
        return {
          answer,
          options: shuffle([answer, ...others]),
          turn: (i % 2 === 0 ? settings.activeProfile : settings.activeProfile === 'a' ? 'b' : 'a') as Profile['id'],
        };
      });
  }, []);

  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState<Record<Profile['id'], number>>({ a: 0, b: 0 });
  const [done, setDone] = useState(false);

  const nameOf = (id: Profile['id']) => (id === 'a' ? a : b);

  const finish = () => {
    // 둘 다 공부한 걸로 기록 (커플 퀘스트·연속 학습에 반영)
    const half = Math.ceil(questions.length / 2);
    logActivity('a', half);
    logActivity('b', questions.length - half);
    setDone(true);
  };

  if (done || !questions.length) {
    const winner = score.a === score.b ? null : score.a > score.b ? a : b;
    return (
      <ScrollView contentContainerStyle={st.body}>
        <Header title="대결 결과" onBack={nav.pop} />
        <Card style={{ alignItems: 'center', gap: 12, paddingVertical: 26 }}>
          <T size={44}>{winner ? '🏆' : '🤝'}</T>
          <T size={22} weight="bold">
            {winner ? `${winner.emoji} ${winner.name} 승리!` : '무승부! 둘 다 최고 💕'}
          </T>
          <Scoreboard score={score} />
          <T size={13} color={c.muted}>
            이번 대결도 커플 퀘스트에 반영됐어요
          </T>
        </Card>
        <Button title="한 판 더" icon="repeat" onPress={() => nav.replace({ name: 'quiz' })} />
        <Button title="돌아가기" kind="secondary" onPress={nav.pop} />
      </ScrollView>
    );
  }

  const q = questions[i];
  const turn = nameOf(q.turn);
  const correct = picked === q.answer.id;

  const pick = (id: string) => {
    if (picked) return;
    setPicked(id);
    if (id === q.answer.id) setScore({ ...score, [q.turn]: score[q.turn] + 1 });
    speak(q.answer.text, settings.speechRate);
  };

  const next = () => {
    setPicked(null);
    if (i + 1 >= questions.length) finish();
    else setI(i + 1);
  };

  return (
    <ScrollView contentContainerStyle={st.body}>
      <Header title="누가 더 잘 기억할까?" onBack={nav.pop} />
      <Scoreboard score={score} turn={q.turn} />
      <T size={13} color={c.muted} style={{ paddingHorizontal: 4 }}>
        문제 {i + 1}/{questions.length} · {turn.emoji} {turn.name} 차례
      </T>
      <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 22 }}>
        <T size={13} color={c.muted}>
          이 뜻의 영어 대사는?
        </T>
        <T size={20} weight="bold" style={{ textAlign: 'center' }}>
          {q.answer.meaning}
        </T>
      </Card>
      {q.options.map((o) => {
        const isAnswer = o.id === q.answer.id;
        const isPicked = o.id === picked;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="button"
            onPress={() => pick(o.id)}
            style={[
              st.opt,
              picked && isAnswer && st.optRight,
              picked && isPicked && !isAnswer && st.optWrong,
            ]}
          >
            <T size={15} weight="medium" style={{ flex: 1 }}>
              {o.text}
            </T>
            {picked && isAnswer ? <T size={16}>✅</T> : null}
            {picked && isPicked && !isAnswer ? <T size={16}>❌</T> : null}
          </Pressable>
        );
      })}
      {picked ? (
        <View style={{ gap: 8 }}>
          <T size={16} weight="bold" color={correct ? '#1B8A5A' : '#C2493D'} style={{ textAlign: 'center' }}>
            {correct ? `정답! ${turn.name} +1점 🎉` : '아쉬워요! 정답을 들어 보세요'}
          </T>
          <Button title={i + 1 >= questions.length ? '결과 보기' : '다음 문제'} icon="arrow-right" onPress={next} />
        </View>
      ) : null}
    </ScrollView>
  );
}

function Scoreboard({ score, turn }: { score: Record<Profile['id'], number>; turn?: Profile['id'] }) {
  const { c, settings } = useSettings();
  const st = useStyles(makeStyles);
  const [a, b] = settings.profiles;
  return (
    <View style={st.vs}>
      {[a, b].map((p, k) => (
        <View key={p.id} style={[st.player, turn === p.id && { backgroundColor: c.accentSoft }, k === 1 && { alignItems: 'flex-end' }]}>
          <T size={13} color={c.ink2}>
            {p.emoji} {p.name}
          </T>
          <T size={26} weight="bold">
            {score[p.id]}
          </T>
        </View>
      ))}
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    body: { padding: space, paddingBottom: 48, gap: 10, maxWidth: 640, width: '100%', alignSelf: 'center' },
    vs: { flexDirection: 'row', gap: 8, backgroundColor: c.surface, borderRadius: radius.lg, padding: 8, ...shadow(c) },
    player: { flex: 1, padding: 10, borderRadius: radius.md, gap: 2 },
    opt: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      padding: 14,
      borderWidth: 2,
      borderColor: 'transparent',
      ...shadow(c),
    },
    optRight: { borderColor: '#1B8A5A', backgroundColor: '#F1FBF5' },
    optWrong: { borderColor: '#C2493D', backgroundColor: '#FFF3F3' },
  });
}
