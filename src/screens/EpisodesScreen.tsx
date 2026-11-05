import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Button, Card, Chip, Header, T, useInputText } from '../components/ui';
import { epLabel } from '../helpers';
import { useNav } from '../nav';
import { useSettings, useStyles } from '../settings/SettingsContext';
import { ThemeColors } from '../settings/themes';
import { useData } from '../storage/DataContext';
import { radius, shadow, space } from '../theme';
import { Episode } from '../types';
import { formatKoreanDate } from '../utils/date';

export default function EpisodesScreen() {
  const { c } = useSettings();
  const { data, addShow, addEpisode } = useData();
  const nav = useNav();
  const st = useStyles(makeStyles);
  const text = useInputText();
  const [showId, setShowId] = useState(data.shows[0]?.id ?? 'suits');
  const [newShow, setNewShow] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const eps = useMemo(
    () =>
      data.episodes
        .filter((e) => e.showId === showId)
        .sort((x, y) => x.season - y.season || x.episode - y.episode),
    [data.episodes, showId],
  );
  const last = eps[eps.length - 1];
  const [season, setSeason] = useState(String(last?.season ?? 1));
  const [episode, setEpisode] = useState(String(last ? last.episode + 1 : 1));
  const [title, setTitle] = useState('');

  const seasons = [...new Set(eps.map((e) => e.season))];
  const show = data.shows.find((s) => s.id === showId);

  const openAdd = () => {
    setSeason(String(last?.season ?? 1));
    setEpisode(String(last ? last.episode + 1 : 1));
    setTitle('');
    setAdding(true);
  };

  const add = () => {
    const s = Number(season) || 1;
    const n = Number(episode) || 1;
    const exists = eps.find((e) => e.season === s && e.episode === n);
    const ep = exists ?? addEpisode({ showId, season: s, episode: n, title: title.trim() });
    setAdding(false);
    nav.push({ name: 'episode', id: ep.id });
  };

  const addNewShow = () => {
    const t = (newShow ?? '').trim();
    setNewShow(null);
    if (t) setShowId(addShow(t).id);
  };

  return (
    <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled">
      <Header title={show?.title ?? '에피소드'} sub="에피소드" />

      <View style={st.wrap}>
        {data.shows.map((s) => (
          <Chip key={s.id} label={s.title} selected={s.id === showId} onPress={() => setShowId(s.id)} />
        ))}
        {newShow === null ? (
          <Chip label="드라마 추가" icon="plus" onPress={() => setNewShow('')} />
        ) : (
          <View style={st.inlineInput}>
            <TextInput
              autoFocus
              value={newShow}
              onChangeText={setNewShow}
              onSubmitEditing={addNewShow}
              onBlur={addNewShow}
              placeholder="드라마 이름"
              placeholderTextColor={c.muted}
              style={[text, { fontSize: 14, flex: 1, minWidth: 0, paddingVertical: 6 }]}
            />
          </View>
        )}
      </View>

      {adding ? (
        <Card style={{ gap: 12 }}>
          <T size={16} weight="semibold">
            에피소드 추가
          </T>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <NumField label="시즌" value={season} onChange={setSeason} />
            <NumField label="화" value={episode} onChange={setEpisode} />
          </View>
          <View style={st.inputBox}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="에피소드 제목 (선택)"
              placeholderTextColor={c.muted}
              style={[text, { flex: 1, minWidth: 0, paddingVertical: 11 }]}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Button title="취소" kind="secondary" onPress={() => setAdding(false)} />
            </View>
            <View style={{ flex: 2 }}>
              <Button title="추가하기" icon="check" onPress={add} />
            </View>
          </View>
        </Card>
      ) : (
        <Button title="에피소드 추가" icon="plus" onPress={openAdd} />
      )}

      {eps.length === 0 && !adding ? (
        <T color={c.muted} style={{ textAlign: 'center', marginTop: 24 }}>
          본 에피소드를 추가하고{'\n'}그 화에서 나온 대사를 모아 보세요.
        </T>
      ) : null}

      {seasons.map((s) => (
        <View key={s} style={{ gap: 8 }}>
          <T size={13} weight="semibold" color={c.muted} style={{ paddingHorizontal: 4, marginTop: 6 }}>
            시즌 {s}
          </T>
          {eps
            .filter((e) => e.season === s)
            .map((e) => (
              <EpisodeRow key={e.id} ep={e} count={data.lines.filter((l) => l.episodeId === e.id).length} />
            ))}
        </View>
      ))}
    </ScrollView>
  );
}

function EpisodeRow({ ep, count }: { ep: Episode; count: number }) {
  const { c } = useSettings();
  const nav = useNav();
  const st = useStyles(makeStyles);
  const watched = !!ep.watchedAt;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => nav.push({ name: 'episode', id: ep.id })}
      style={({ pressed }) => [st.row, !watched && { opacity: 0.6 }, pressed && { opacity: 0.7 }]}
    >
      <View style={[st.num, !watched && { backgroundColor: c.fill }]}>
        <T size={13} weight="bold" color={watched ? c.accent : c.muted}>
          E{ep.episode}
        </T>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <T size={15} weight="semibold" numberOfLines={1}>
          {ep.title || `${epLabel(ep)}`}
        </T>
        <T size={12} color={c.muted} numberOfLines={1}>
          {watched
            ? `${formatKoreanDate(ep.watchedAt!)}${ep.together ? ' · 👫 같이 봄' : ''}${ep.rating ? ' · ' + '⭐'.repeat(ep.rating) : ''}`
            : '아직 안 봤어요'}
        </T>
      </View>
      {count > 0 ? (
        <View style={st.count}>
          <T size={12} color={c.ink2}>
            대사 {count}
          </T>
        </View>
      ) : null}
    </Pressable>
  );
}

function NumField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const { c } = useSettings();
  const st = useStyles(makeStyles);
  const text = useInputText();
  return (
    <View style={[st.inputBox, { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
      <T size={13} color={c.muted}>
        {label}
      </T>
      <TextInput
        value={value}
        onChangeText={(v) => onChange(v.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        style={[text, { flex: 1, minWidth: 0, paddingVertical: 11, fontSize: 18 }]}
      />
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    body: { padding: space, paddingBottom: 40, gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center' },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    inlineInput: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.fill,
      borderRadius: 999,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: c.accent,
      minWidth: 130,
    },
    inputBox: { backgroundColor: c.fill, borderRadius: radius.sm, paddingHorizontal: 14 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: 14,
      ...shadow(c),
    },
    num: {
      width: 46,
      height: 46,
      borderRadius: 14,
      backgroundColor: c.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    count: { backgroundColor: c.fill, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  });
}
