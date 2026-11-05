import { Feather } from '@expo/vector-icons';
import { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Weight } from '../fonts';
import { useSettings, useStyles } from '../settings/SettingsContext';
import { ThemeColors } from '../settings/themes';
import { radius, shadow } from '../theme';

export type IconName = ComponentProps<typeof Feather>['name'];

/** 앱 전체에서 쓰는 글자. 고른 글씨체와 색이 자동으로 적용됩니다. */
export function T({
  weight = 'regular',
  size = 15,
  color,
  style,
  ...rest
}: TextProps & { weight?: Weight; size?: number; color?: string }) {
  const { c, f, scale } = useSettings();
  const s = Math.round(size * scale);
  return <Text style={[f[weight], { fontSize: s, color: color ?? c.ink, lineHeight: Math.round(s * 1.45) }, style]} {...rest} />;
}

/** 입력칸 글자 스타일 */
export function useInputText(): TextStyle {
  const { c, f, scale } = useSettings();
  return { ...f.regular, fontSize: Math.round(16 * scale), color: c.ink };
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const st = useStyles(makeStyles);
  return <View style={[st.card, style]}>{children}</View>;
}

export function SectionTitle({
  title,
  icon,
  color,
  right,
}: {
  title: string;
  icon?: IconName;
  color?: string;
  right?: ReactNode;
}) {
  const { c } = useSettings();
  return (
    <View style={base.sectionTitle}>
      {icon ? <Feather name={icon} size={16} color={color ?? c.ink} /> : null}
      <T weight="semibold" size={16} style={{ flex: 1 }}>
        {title}
      </T>
      {right}
    </View>
  );
}

export function Field({ style, multiline, ...rest }: TextInputProps) {
  const { c } = useSettings();
  const st = useStyles(makeStyles);
  const text = useInputText();
  return (
    <TextInput
      placeholderTextColor={c.muted}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      style={[st.field, text, multiline && { minHeight: 120, paddingTop: 12 }, style]}
      {...rest}
    />
  );
}

/** 탭해서 고르는 작은 알약 모양 버튼 */
export function Chip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
}) {
  const { c } = useSettings();
  const st = useStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [st.chip, selected && st.chipOn, pressed && { opacity: 0.7 }]}
    >
      {icon ? <Feather name={icon} size={13} color={selected ? c.onAccent : c.ink2} /> : null}
      <T size={14} weight={selected ? 'semibold' : 'regular'} color={selected ? c.onAccent : c.ink2}>
        {label}
      </T>
    </Pressable>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const { c } = useSettings();
  return (
    <Switch
      accessibilityLabel={label}
      value={value}
      onValueChange={onChange}
      trackColor={{ false: c.line, true: c.accent }}
      thumbColor="#FFFFFF"
      {...({ activeThumbColor: '#FFFFFF' } as object)}
    />
  );
}

export function Button({
  title,
  onPress,
  icon,
  kind = 'primary',
  disabled,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  kind?: 'primary' | 'secondary';
  disabled?: boolean;
}) {
  const { c } = useSettings();
  const primary = kind === 'primary';
  const fg = primary ? c.onAccent : c.ink;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        base.btn,
        { backgroundColor: primary ? c.accent : c.fill },
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.75 },
      ]}
    >
      {icon ? <Feather name={icon} size={16} color={fg} /> : null}
      <T weight="semibold" size={15} color={fg}>
        {title}
      </T>
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { c } = useSettings();
  const st = useStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [st.iconBtn, (pressed || disabled) && { opacity: disabled ? 0.3 : 0.6 }]}
    >
      <Feather name={icon} size={20} color={c.ink} />
    </Pressable>
  );
}

/** 대사 속 '외우고 싶은 표현'에 형광펜을 칠해서 보여 줘요. */
export function Highlighted({
  text,
  highlight,
  size = 18,
  weight = 'bold',
}: {
  text: string;
  highlight: string;
  size?: number;
  weight?: Weight;
}) {
  const { c } = useSettings();
  const h = highlight.trim();
  const i = h ? text.toLowerCase().indexOf(h.toLowerCase()) : -1;
  if (i < 0) {
    return (
      <T size={size} weight={weight}>
        {text}
      </T>
    );
  }
  return (
    <T size={size} weight={weight}>
      {text.slice(0, i)}
      <Text style={{ backgroundColor: c.accentSoft, color: c.ink }}>{text.slice(i, i + h.length)}</Text>
      {text.slice(i + h.length)}
    </T>
  );
}

/** 위쪽 제목줄 (뒤로 가기 버튼 포함) */
export function Header({ title, sub, onBack, right }: { title: string; sub?: string; onBack?: () => void; right?: ReactNode }) {
  const { c } = useSettings();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4, paddingTop: 10, paddingBottom: 6 }}>
      {onBack ? <IconButton icon="chevron-left" label="뒤로" onPress={onBack} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        {sub ? (
          <T size={12} weight="semibold" color={c.accent}>
            {sub}
          </T>
        ) : null}
        <T size={onBack ? 20 : 26} weight="bold" style={{ letterSpacing: -0.5 }} numberOfLines={1}>
          {title}
        </T>
      </View>
      {right}
    </View>
  );
}

// 색과 관계없는 스타일
const base = StyleSheet.create({
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreRow: { flexDirection: 'row', gap: 6 },
  scoreFace: { fontSize: 24 },
  listTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, paddingLeft: 2 },
  bullet: { width: 4, height: 4, borderRadius: 2, opacity: 0.8 },
  addInput: { flex: 1, minWidth: 0, paddingVertical: 10 },
  addBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btn: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// 테마 색을 쓰는 스타일
function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: { backgroundColor: c.surface, borderRadius: radius.lg, padding: 20, gap: 16, ...shadow(c) },
    field: { backgroundColor: c.fill, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: c.fill,
    },
    chipOn: { backgroundColor: c.accent },
    scoreBtn: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, borderRadius: radius.md, backgroundColor: c.fill },
    scoreBtnOn: { backgroundColor: c.accentSoft },
    addRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.fill,
      borderRadius: radius.sm,
      paddingLeft: 12,
      paddingRight: 6,
      minHeight: 44,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
      ...shadow(c),
    },
  });
}
