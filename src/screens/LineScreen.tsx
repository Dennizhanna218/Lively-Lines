import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Header, Highlighted, T } from '../components/ui';
import { lineSource } from '../helpers';
import { useNav } from '../nav';
import { speak } from '../platform/speech';
import { useSettings, useStyles } from '../settings/SettingsContext';
import { ThemeColors } from '../settings/themes';
import { intervalLabel } from '../srs';
import { loadPhoto } from '../storage/data';
import { useData } from '../storage/DataContext';
import { radius, space } from '../theme';
import { tagLabel } from '../types';
import { formatKoreanDate, todayKey } from '../utils/date';

export default function LineScreen({ id }: { id: string }) {
  const { c, settings } = useSettings();
  const { data, updateLine, deleteLine } = useData();
  const nav = useNav();
  const st = useStyles(makeStyles);
  const line = data.lines.find((l) => l.id === id);
  const [photo, setPhoto] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (line?.hasPhoto) loadPhoto(line.id).then(setPhoto);
    else setPhoto(null);
  }, [line?.id, line?.hasPhoto, line?.updatedAt]);

  if (!line) return null;
  const rate = settings.speechRate;
  const due = line.srs.due <= todayKey() ? '오늘' : formatKoreanDate(line.srs.due);

  return (
    <ScrollView contentContainerStyle={st.body}>
      <Header
        title="대사 카드"
        sub={lineSource(data, line)}
        onBack={nav.pop}
        right={
          <Pressable
            accessibilityLabel={line.favorite ? '즐겨찾기 해제' : '즐겨찾기'}
            hitSlop={10}
            onPress={() => void updateLine(line.id, { favorite: !line.favorite })}
          >
            <T size={24} style={{ opacity: line.favorite ? 1 : 0.25 }}>
              ⭐
            </T>
          </Pressable>
        }
      />

      {photo ? <Image source={{ uri: photo }} style={st.photo} resizeMode="contain" accessibilityLabel="장면 사진" /> : null}

      <Card style={{ gap: 10 }}>
        {line.speaker ? (
          <T size={13} weight="semibold" color={c.accent}>
            {line.speaker}
          </T>
        ) : null}
        <Highlighted text={line.text} highlight={line.highlight} size={22} />
        {line.meaning ? (
          <T size={16} color={c.ink2}>
            {line.meaning}
          </T>
        ) : null}
        <View style={st.row}>
          <View style={{ flex: 1.3 }}>
            <Button title="듣기" icon="volume-2" onPress={() => speak(line.text, rate)} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="천천히" kind="secondary" onPress={() => speak(line.text, rate * 0.7)} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="3번" icon="repeat" kind="secondary" onPress={() => speak(line.text, rate, 3)} />
          </View>
        </View>
        {line.highlight ? (
          <Pressable onPress={() => speak(line.highlight, rate * 0.85)} style={st.hlBox}>
            <T size={13} color={c.muted}>
              🔊 표현만 듣기
            </T>
            <T size={16} weight="bold">
              {line.highlight}
            </T>
          </Pressable>
        ) : null}
        {line.tags.length ? (
          <View style={st.wrap}>
            {line.tags.map((t) => (
              <View key={t} style={st.tag}>
                <T size={12} color={c.ink2}>
                  {tagLabel(t)}
                </T>
              </View>
            ))}
          </View>
        ) : null}
      </Card>

      <Button title="말하기 연습" icon="mic" onPress={() => nav.push({ name: 'practice', id: line.id })} />

      {line.note ? (
        <Card style={{ gap: 6 }}>
          <T size={13} weight="semibold" color={c.muted}>
            📝 메모
          </T>
          <T size={15}>{line.note}</T>
        </Card>
      ) : null}

      {line.examples.length ? (
        <Card style={{ gap: 6 }}>
          <T size={13} weight="semibold" color={c.muted}>
            💬 내가 만든 문장
          </T>
          {line.examples.map((e, i) => (
            <Pressable key={i} onPress={() => speak(e, rate)}>
              <T size={15}>• {e}</T>
            </Pressable>
          ))}
        </Card>
      ) : null}

      <Card style={{ gap: 4 }}>
        <T size={13} color={c.muted}>
          다음 복습: {due}
          {line.srs.interval ? ` (간격 ${intervalLabel(line.srs.interval)})` : ''}
        </T>
        {line.bestScore !== null ? (
          <T size={13} color={c.muted}>
            따라 말하기 최고 점수: {line.bestScore}점
          </T>
        ) : null}
      </Card>

      <View style={st.row}>
        <View style={{ flex: 1 }}>
          <Button title="고치기" icon="edit-2" kind="secondary" onPress={() => nav.push({ name: 'lineEdit', id: line.id })} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title={confirmDelete ? '정말 지울까요?' : '지우기'}
            icon="trash-2"
            kind="secondary"
            onPress={() => {
              if (!confirmDelete) return setConfirmDelete(true);
              deleteLine(line.id);
              nav.pop();
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    body: { padding: space, paddingBottom: 48, gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center' },
    row: { flexDirection: 'row', gap: 8 },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    photo: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.lg, backgroundColor: '#222' },
    hlBox: { backgroundColor: c.fill, borderRadius: radius.md, padding: 12, gap: 2 },
    tag: { backgroundColor: c.fill, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  });
}
