import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Button, Card, Chip, Field, Header, Highlighted, T, useInputText } from '../components/ui';
import { epLabel, speakersFor } from '../helpers';
import { useNav } from '../nav';
import { pickPhoto } from '../platform/photoStore';
import { useSettings, useStyles } from '../settings/SettingsContext';
import { ThemeColors } from '../settings/themes';
import { loadPhoto } from '../storage/data';
import { useData } from '../storage/DataContext';
import { radius, space } from '../theme';
import { TAGS } from '../types';

interface Props {
  id?: string;
  showId?: string;
  episodeId?: string | null;
}

export default function LineEditScreen({ id, showId: initShow, episodeId: initEp }: Props) {
  const { c } = useSettings();
  const { data, addLine, updateLine } = useData();
  const nav = useNav();
  const st = useStyles(makeStyles);
  const input = useInputText();
  const editing = id ? data.lines.find((l) => l.id === id) : undefined;

  const latestEp = [...data.episodes].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const [showId, setShowId] = useState(editing?.showId ?? initShow ?? latestEp?.showId ?? data.shows[0]?.id ?? 'suits');
  const [episodeId, setEpisodeId] = useState<string | null>(
    editing ? editing.episodeId : initEp !== undefined ? initEp : (latestEp?.showId === showId ? latestEp.id : null),
  );
  const [text, setText] = useState(editing?.text ?? '');
  const [highlight, setHighlight] = useState(editing?.highlight ?? '');
  const [meaning, setMeaning] = useState(editing?.meaning ?? '');
  const [speaker, setSpeaker] = useState(editing?.speaker ?? '');
  const [newSpeaker, setNewSpeaker] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>(editing?.tags ?? []);
  const [note, setNote] = useState(editing?.note ?? '');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [range, setRange] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (editing?.hasPhoto) loadPhoto(editing.id).then(setPhoto);
  }, [editing?.id]);

  const words = text.split(/\s+/).filter(Boolean);
  const eps = data.episodes
    .filter((e) => e.showId === showId)
    .sort((a, b) => a.season - b.season || a.episode - b.episode);

  // 단어를 차례로 누르면 그 사이가 '외우고 싶은 표현'이 돼요
  const tapWord = (i: number) => {
    let r: [number, number];
    if (!range || range[0] !== range[1]) r = [i, i];
    else r = [Math.min(range[0], i), Math.max(range[0], i)];
    setRange(r);
    setHighlight(
      words
        .slice(r[0], r[1] + 1)
        .join(' ')
        .replace(/^[^\w']+|[^\w']+$/g, ''),
    );
  };

  const choosePhoto = async () => {
    const p = await pickPhoto();
    if (p) {
      setPhoto(p);
      setPhotoChanged(true);
    }
  };

  const save = async () => {
    if (!text.trim()) return;
    const fields = {
      showId,
      episodeId,
      text: text.trim(),
      highlight: highlight.trim(),
      meaning: meaning.trim(),
      speaker: speaker.trim(),
      tags,
      note: note.trim(),
    };
    if (editing) {
      await updateLine(editing.id, fields, photoChanged ? photo : undefined);
      nav.pop();
    } else {
      const l = await addLine({ ...fields, photo });
      nav.replace({ name: 'line', id: l.id });
    }
  };

  const addSpeaker = () => {
    const t = (newSpeaker ?? '').trim();
    setNewSpeaker(null);
    if (t) setSpeaker(t);
  };

  const speakers = [...new Set([...speakersFor(data, showId), ...(speaker ? [speaker] : [])])];

  return (
    <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled">
      <Header title={editing ? '대사 고치기' : '대사 저장하기'} onBack={nav.pop} />

      <Card style={{ gap: 10 }}>
        <View style={st.wrap}>
          {data.shows.map((s) => (
            <Chip
              key={s.id}
              label={s.title}
              selected={s.id === showId}
              onPress={() => {
                setShowId(s.id);
                setEpisodeId(null);
              }}
            />
          ))}
        </View>
        {eps.length ? (
          <View style={st.wrap}>
            <Chip label="에피소드 없음" selected={episodeId === null} onPress={() => setEpisodeId(null)} />
            {eps.map((e) => (
              <Chip key={e.id} label={epLabel(e)} selected={episodeId === e.id} onPress={() => setEpisodeId(e.id)} />
            ))}
          </View>
        ) : (
          <T size={12} color={c.muted}>
            '에피소드' 탭에서 본 화를 추가하면 여기서 고를 수 있어요.
          </T>
        )}
      </Card>

      <Card style={{ gap: 10 }}>
        {photo ? (
          <View style={{ gap: 8 }}>
            <Image source={{ uri: photo }} style={st.photo} resizeMode="contain" accessibilityLabel="장면 사진" />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Button title="다른 사진" icon="image" kind="secondary" onPress={choosePhoto} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="사진 빼기"
                  icon="x"
                  kind="secondary"
                  onPress={() => {
                    setPhoto(null);
                    setPhotoChanged(true);
                  }}
                />
              </View>
            </View>
          </View>
        ) : Platform.OS === 'web' ? (
          <Pressable accessibilityRole="button" onPress={choosePhoto} style={st.photoBtn}>
            <Feather name="camera" size={18} color={c.accent} />
            <T size={15} weight="semibold" color={c.accent}>
              장면 사진 넣기
            </T>
          </Pressable>
        ) : null}
        <T size={12} color={c.muted} style={{ lineHeight: 18 }}>
          💡 자막이 나올 때 TV 화면을 찍고, 사진 앱에서 자막 글자를 꾹 누르면 복사돼요. 아래 칸에 붙여넣으세요.
        </T>
      </Card>

      <Card style={{ gap: 12 }}>
        <Label text="영어 대사" />
        <Field
          multiline
          value={text}
          onChangeText={(v) => {
            setText(v);
            setRange(null);
          }}
          placeholder="자막을 붙여넣거나 적어 주세요"
          autoCapitalize="sentences"
          style={{ minHeight: 70 }}
        />

        {words.length > 1 ? (
          <View style={{ gap: 6 }}>
            <Label text="외우고 싶은 표현 (단어를 눌러 고르세요)" />
            <View style={st.wrap}>
              {words.map((w, i) => {
                const on = !!range && i >= range[0] && i <= range[1];
                return (
                  <Pressable key={i} onPress={() => tapWord(i)} style={[st.word, on && st.wordOn]}>
                    <T size={15} weight={on ? 'bold' : 'regular'} color={on ? c.ink : c.ink2}>
                      {w}
                    </T>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
        <Field value={highlight} onChangeText={setHighlight} placeholder="예: figure it out (직접 적어도 돼요)" />
        {text && highlight ? <Highlighted text={text} highlight={highlight} size={15} weight="medium" /> : null}

        <Label text="뜻" />
        <Field value={meaning} onChangeText={setMeaning} placeholder="한국어 뜻" />

        <Label text="누가 말했나요?" />
        <View style={st.wrap}>
          {speakers.map((s) => (
            <Chip key={s} label={s} selected={speaker === s} onPress={() => setSpeaker(speaker === s ? '' : s)} />
          ))}
          {newSpeaker === null ? (
            <Chip label="직접 추가" icon="plus" onPress={() => setNewSpeaker('')} />
          ) : (
            <View style={st.inlineInput}>
              <TextInput
                autoFocus
                value={newSpeaker}
                onChangeText={setNewSpeaker}
                onSubmitEditing={addSpeaker}
                onBlur={addSpeaker}
                placeholder="이름"
                placeholderTextColor={c.muted}
                style={[input, { fontSize: 14, flex: 1, minWidth: 0, paddingVertical: 6 }]}
              />
            </View>
          )}
        </View>

        <Label text="태그" />
        <View style={st.wrap}>
          {TAGS.map((t) => (
            <Chip
              key={t.key}
              label={t.label}
              selected={tags.includes(t.key)}
              onPress={() => setTags(tags.includes(t.key) ? tags.filter((x) => x !== t.key) : [...tags, t.key])}
            />
          ))}
        </View>

        <Label text="메모" />
        <Field
          multiline
          value={note}
          onChangeText={setNote}
          placeholder="어떤 장면이었는지, 언제 쓰면 좋을지"
          style={{ minHeight: 70 }}
        />
      </Card>

      <Button title={editing ? '고친 내용 저장' : '저장하기'} icon="check" disabled={!text.trim()} onPress={save} />
    </ScrollView>
  );
}

function Label({ text }: { text: string }) {
  const { c } = useSettings();
  return (
    <T size={13} weight="semibold" color={c.muted}>
      {text}
    </T>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    body: { padding: space, paddingBottom: 48, gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center' },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    photo: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md, backgroundColor: '#222' },
    photoBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: c.accent,
    },
    word: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: c.fill },
    wordOn: { backgroundColor: c.accentSoft },
    inlineInput: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.fill,
      borderRadius: 999,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: c.accent,
      minWidth: 110,
    },
  });
}
