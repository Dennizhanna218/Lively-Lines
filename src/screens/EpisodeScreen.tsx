import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import LineCard from '../components/LineCard';
import { Button, Card, Field, Header, T, Toggle } from '../components/ui';
import { epLabel } from '../helpers';
import { useNav } from '../nav';
import { useSettings } from '../settings/SettingsContext';
import { useData } from '../storage/DataContext';
import { space } from '../theme';
import { formatKoreanDate, todayKey } from '../utils/date';

export default function EpisodeScreen({ id }: { id: string }) {
  const { c } = useSettings();
  const { data, updateEpisode, deleteEpisode } = useData();
  const nav = useNav();
  const ep = data.episodes.find((e) => e.id === id);
  if (!ep) return null;
  const show = data.shows.find((s) => s.id === ep.showId);
  const lines = data.lines.filter((l) => l.episodeId === id);

  return (
    <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
      <Header title={ep.title || epLabel(ep)} sub={`${show?.title ?? ''} · ${epLabel(ep)}`} onBack={nav.pop} />

      <Card style={{ gap: 14 }}>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <T size={15} weight="medium">
              봤어요
            </T>
            {ep.watchedAt ? (
              <T size={12} color={c.muted}>
                {formatKoreanDate(ep.watchedAt)}
              </T>
            ) : null}
          </View>
          <Toggle
            label="봤어요"
            value={!!ep.watchedAt}
            onChange={(v) => updateEpisode(id, { watchedAt: v ? todayKey() : null })}
          />
        </View>
        <View style={s.row}>
          <T size={15} weight="medium" style={{ flex: 1 }}>
            👫 둘이 같이 봤어요
          </T>
          <Toggle label="같이 봤어요" value={ep.together} onChange={(v) => updateEpisode(id, { together: v })} />
        </View>
        <View style={s.row}>
          <T size={15} weight="medium" style={{ flex: 1 }}>
            별점
          </T>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              accessibilityLabel={`별점 ${n}점`}
              hitSlop={4}
              onPress={() => updateEpisode(id, { rating: ep.rating === n ? 0 : n })}
            >
              <T size={22} style={{ opacity: n <= ep.rating ? 1 : 0.25 }}>
                ⭐
              </T>
            </Pressable>
          ))}
        </View>
        <Field
          multiline
          placeholder="한 줄 감상 (예: 하비 등장 장면 최고!)"
          value={ep.note}
          onChangeText={(note) => updateEpisode(id, { note })}
          style={{ minHeight: 70 }}
        />
      </Card>

      <View style={[s.row, { paddingHorizontal: 4, marginTop: 6 }]}>
        <T size={16} weight="semibold" style={{ flex: 1 }}>
          이 화에서 모은 대사 {lines.length}
        </T>
      </View>
      <Button
        title="이 화의 대사 저장하기"
        icon="plus"
        onPress={() => nav.push({ name: 'lineEdit', showId: ep.showId, episodeId: ep.id })}
      />
      {lines.map((l) => (
        <LineCard key={l.id} line={l} />
      ))}

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          deleteEpisode(id);
          nav.pop();
        }}
        style={{ alignSelf: 'center', padding: 12, marginTop: 10 }}
      >
        <T size={13} color={c.muted}>
          에피소드 지우기 (대사는 남아요)
        </T>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  body: { padding: space, paddingBottom: 40, gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
