import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { lineSource } from '../helpers';
import { useNav } from '../nav';
import { speak } from '../platform/speech';
import { useSettings, useStyles } from '../settings/SettingsContext';
import { ThemeColors } from '../settings/themes';
import { useData } from '../storage/DataContext';
import { radius, shadow } from '../theme';
import { Line } from '../types';
import { Highlighted, T } from './ui';

export default function LineCard({ line }: { line: Line }) {
  const { c, settings } = useSettings();
  const { data, updateLine } = useData();
  const nav = useNav();
  const st = useStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => nav.push({ name: 'line', id: line.id })}
      style={({ pressed }) => [st.card, pressed && { opacity: 0.75 }]}
    >
      <View style={st.top}>
        {line.speaker ? (
          <T size={12} weight="semibold" color={c.accent}>
            {line.speaker}
          </T>
        ) : null}
        <T size={12} color={c.muted} style={{ flex: 1 }} numberOfLines={1}>
          {lineSource(data, line)}
          {line.hasPhoto ? ' · 📸' : ''}
        </T>
        <Pressable
          accessibilityLabel={line.favorite ? '즐겨찾기 해제' : '즐겨찾기'}
          hitSlop={10}
          onPress={() => void updateLine(line.id, { favorite: !line.favorite })}
        >
          <T size={16} style={{ opacity: line.favorite ? 1 : 0.25 }}>
            ⭐
          </T>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Highlighted text={line.text} highlight={line.highlight} size={16} weight="semibold" />
          {line.meaning ? (
            <T size={13} color={c.ink2}>
              {line.meaning}
            </T>
          ) : null}
        </View>
        <Pressable
          accessibilityLabel="듣기"
          hitSlop={8}
          onPress={() => speak(line.text, settings.speechRate)}
          style={st.play}
        >
          <Feather name="volume-2" size={17} color={c.accent} />
        </Pressable>
      </View>
    </Pressable>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: { backgroundColor: c.surface, borderRadius: radius.lg, padding: 14, gap: 6, ...shadow(c) },
    top: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    play: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: c.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
