import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Field, Header, Highlighted, T } from '../components/ui';
import { useNav } from '../nav';
import { speak } from '../platform/speech';
import { useSettings, useStyles } from '../settings/SettingsContext';
import { ThemeColors } from '../settings/themes';
import { scoreMessage, scoreSpeech, usesExpression } from '../speaking';
import { useData } from '../storage/DataContext';
import { radius, space } from '../theme';

type Step = 0 | 1 | 2;
const STEPS = ['① 듣기', '② 따라 말하기', '③ 바꿔 말하기'];

export default function PracticeScreen({ id }: { id: string }) {
  const { c, settings } = useSettings();
  const { data, updateLine, logActivity } = useData();
  const nav = useNav();
  const st = useStyles(makeStyles);
  const line = data.lines.find((l) => l.id === id);
  const [step, setStep] = useState<Step>(0);
  const [heard, setHeard] = useState(0);
  const [spoken, setSpoken] = useState('');
  const [result, setResult] = useState<ReturnType<typeof scoreSpeech> | null>(null);
  const [mine, setMine] = useState('');
  const [mineResult, setMineResult] = useState<boolean | null>(null);

  if (!line) return null;
  const rate = settings.speechRate;
  const who = settings.activeProfile;

  const check = () => {
    if (!spoken.trim()) return;
    const r = scoreSpeech(line.text, spoken);
    setResult(r);
    if (line.bestScore === null || r.score > line.bestScore) void updateLine(line.id, { bestScore: r.score });
    logActivity(who);
  };

  const saveMine = () => {
    const t = mine.trim();
    if (!t) return;
    const ok = !line.highlight || usesExpression(t, line.highlight);
    setMineResult(ok);
    void updateLine(line.id, { examples: [...line.examples, t] });
    logActivity(who);
  };

  return (
    <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled">
      <Header title="말하기 연습" onBack={nav.pop} />

      <View style={st.steps}>
        {STEPS.map((s, i) => (
          <Pressable
            key={s}
            accessibilityRole="tab"
            accessibilityState={{ selected: step === i }}
            onPress={() => setStep(i as Step)}
            style={[st.step, i < step && st.stepDone, step === i && st.stepOn]}
          >
            <T size={12} weight="semibold" color={step === i ? c.onAccent : i < step ? c.accent : c.muted}>
              {s}
              {i < step ? ' ✓' : ''}
            </T>
          </Pressable>
        ))}
      </View>

      <Card style={{ gap: 12, alignItems: 'center' }}>
        <Highlighted text={line.text} highlight={line.highlight} size={20} />
        {step === 0 || step === 2 ? (
          <T size={14} color={c.ink2}>
            {line.meaning}
          </T>
        ) : null}
        <View style={st.row}>
          <View style={{ flex: 1 }}>
            <Button
              title="원어민"
              icon="volume-2"
              onPress={() => {
                speak(line.text, rate);
                setHeard(heard + 1);
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="0.7배"
              kind="secondary"
              onPress={() => {
                speak(line.text, rate * 0.7);
                setHeard(heard + 1);
              }}
            />
          </View>
        </View>
      </Card>

      {step === 0 ? (
        <Card style={{ gap: 10 }}>
          <T size={15} weight="semibold">
            👂 먼저 여러 번 들어 보세요
          </T>
          <T size={14} color={c.ink2} style={{ lineHeight: 21 }}>
            소리 내지 말고 리듬과 억양을 들어요. 3번쯤 듣고 나면 입으로 작게 따라 해 보세요.
          </T>
          <T size={13} color={c.muted}>
            들은 횟수: {heard}번
          </T>
          <Button title="따라 말하러 가기" icon="arrow-right" onPress={() => setStep(1)} />
        </Card>
      ) : null}

      {step === 1 ? (
        <Card style={{ gap: 10 }}>
          <T size={15} weight="semibold">
            🎙️ 소리 내어 따라 말해 보세요
          </T>
          <T size={13} color={c.ink2} style={{ lineHeight: 20 }}>
            아래 칸을 누르고 키보드의 🎤 마이크 버튼(받아쓰기)을 눌러 영어로 말해요. 휴대폰이 받아 적은 문장을 원래 대사와 비교해 점수를 매겨요.
            {'\n'}키보드 언어를 영어로 바꾸면 더 정확해요.
          </T>
          <Field
            value={spoken}
            onChangeText={(v) => {
              setSpoken(v);
              setResult(null);
            }}
            placeholder="여기를 누르고 🎤로 말하기"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={check}
          />
          <Button title="채점하기" icon="check-circle" disabled={!spoken.trim()} onPress={check} />
          {result ? (
            <View style={st.result}>
              <Text style={{ lineHeight: 30 }}>
                {result.words.map((w, i) => (
                  <Text key={i}>
                    <Text style={[st.word, { backgroundColor: w.ok ? '#DDF5E8' : '#FFE1E1', color: w.ok ? '#1B8A5A' : '#C2493D' }]}>
                      {' '}
                      {w.word}{' '}
                    </Text>{' '}
                  </Text>
                ))}
              </Text>
              <T size={18} weight="bold" color={result.score >= 80 ? '#1B8A5A' : c.accent}>
                {result.score}점 · {scoreMessage(result.score)}
              </T>
              {result.score < 100 ? (
                <T size={12} color={c.muted}>
                  빨간 단어를 다시 들어 보고 한 번 더 말해 보세요.
                </T>
              ) : null}
              {result.score >= 60 ? <Button title="바꿔 말하러 가기" icon="arrow-right" onPress={() => setStep(2)} /> : null}
            </View>
          ) : null}
        </Card>
      ) : null}

      {step === 2 ? (
        <Card style={{ gap: 10 }}>
          <T size={15} weight="semibold">
            💬 내 상황으로 바꿔 말하기
          </T>
          <T size={13} color={c.ink2} style={{ lineHeight: 20 }}>
            {line.highlight ? `'${line.highlight}'` : '이 표현'}을 넣어서 회사, 집, 친구와의 대화처럼 내 하루에 맞는 문장을 만들어 말해 보세요.
          </T>
          <Field
            multiline
            value={mine}
            onChangeText={(v) => {
              setMine(v);
              setMineResult(null);
            }}
            placeholder="예: Don't worry, I'll handle it by Friday."
            autoCapitalize="sentences"
            style={{ minHeight: 70 }}
          />
          <Button title="내 문장 저장" icon="save" disabled={!mine.trim()} onPress={saveMine} />
          {mineResult !== null ? (
            <View style={{ gap: 8 }}>
              <T size={15} weight="semibold" color={mineResult ? '#1B8A5A' : c.accent}>
                {mineResult ? '표현을 잘 넣었어요! 👏 대사 카드에 저장했어요.' : `저장했어요. 다음엔 '${line.highlight}'를 꼭 넣어 봐요!`}
              </T>
              <Button title="내 문장 들어 보기" icon="volume-2" kind="secondary" onPress={() => speak(mine, rate)} />
              <Button title="다 했어요" icon="check" onPress={nav.pop} />
            </View>
          ) : null}
          <T size={12} color={c.muted} style={{ lineHeight: 18 }}>
            💡 만든 문장이 자연스러운지 궁금하면 Claude에게 보내 물어보세요.
          </T>
        </Card>
      ) : null}
    </ScrollView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    body: { padding: space, paddingBottom: 48, gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center' },
    row: { flexDirection: 'row', gap: 8, alignSelf: 'stretch' },
    steps: { flexDirection: 'row', gap: 6 },
    step: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radius.sm, backgroundColor: c.fill },
    stepOn: { backgroundColor: c.accent },
    stepDone: { backgroundColor: c.accentSoft },
    result: { gap: 8, backgroundColor: c.fill, borderRadius: radius.md, padding: 12 },
    word: { fontSize: 17, fontWeight: '600', borderRadius: 6 },
  });
}
