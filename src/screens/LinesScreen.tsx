import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import LineCard from '../components/LineCard';
import { Button, Chip, Header, T, useInputText } from '../components/ui';
import { useNav } from '../nav';
import { useSettings, useStyles } from '../settings/SettingsContext';
import { ThemeColors } from '../settings/themes';
import { useData } from '../storage/DataContext';
import { radius, space } from '../theme';
import { TAGS } from '../types';

export default function LinesScreen() {
  const { c } = useSettings();
  const { data } = useData();
  const nav = useNav();
  const st = useStyles(makeStyles);
  const text = useInputText();
  const [filter, setFilter] = useState<string>('all');
  const [q, setQ] = useState('');

  const lines = useMemo(() => {
    const query = q.trim().toLowerCase();
    return data.lines.filter((l) => {
      if (filter === 'fav' && !l.favorite) return false;
      if (filter !== 'all' && filter !== 'fav' && !l.tags.includes(filter)) return false;
      if (!query) return true;
      return [l.text, l.meaning, l.speaker, l.note].some((x) => x.toLowerCase().includes(query));
    });
  }, [data.lines, filter, q]);

  return (
    <FlatList
      data={lines}
      keyExtractor={(l) => l.id}
      contentContainerStyle={st.body}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          <Header title="대사장" sub={`모은 대사 ${data.lines.length}개`} />
          <View style={st.search}>
            <Feather name="search" size={16} color={c.muted} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="대사·뜻·인물로 찾기"
              placeholderTextColor={c.muted}
              style={[text, { flex: 1, minWidth: 0, paddingVertical: 10 }]}
            />
          </View>
          <View style={st.wrap}>
            <Chip label="전체" selected={filter === 'all'} onPress={() => setFilter('all')} />
            <Chip label="⭐ 즐겨찾기" selected={filter === 'fav'} onPress={() => setFilter('fav')} />
            {TAGS.map((t) => (
              <Chip key={t.key} label={t.label} selected={filter === t.key} onPress={() => setFilter(t.key)} />
            ))}
          </View>
          <Button title="대사 저장하기" icon="plus" onPress={() => nav.push({ name: 'lineEdit' })} />
        </View>
      }
      ListEmptyComponent={
        <T color={c.muted} style={{ textAlign: 'center', marginTop: 24 }}>
          {data.lines.length ? '찾는 대사가 없어요.' : '아직 모은 대사가 없어요.\n드라마를 보다가 마음에 든 대사를 저장해 보세요!'}
        </T>
      }
      renderItem={({ item }) => <LineCard line={item} />}
    />
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    body: { padding: space, paddingBottom: 40, gap: 10, maxWidth: 640, width: '100%', alignSelf: 'center' },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      paddingHorizontal: 14,
    },
  });
}
