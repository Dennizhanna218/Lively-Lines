import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { IconName, T } from './src/components/ui';
import { NavProvider, Route, Tab, useNav } from './src/nav';
import EpisodeScreen from './src/screens/EpisodeScreen';
import EpisodesScreen from './src/screens/EpisodesScreen';
import HomeScreen from './src/screens/HomeScreen';
import LineEditScreen from './src/screens/LineEditScreen';
import LineScreen from './src/screens/LineScreen';
import LinesScreen from './src/screens/LinesScreen';
import PracticeScreen from './src/screens/PracticeScreen';
import QuizScreen from './src/screens/QuizScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import ReviewTab from './src/screens/ReviewTab';
import SettingsScreen from './src/screens/SettingsScreen';
import { SettingsProvider, useSettings } from './src/settings/SettingsContext';
import { DataProvider } from './src/storage/DataContext';

const TABS: { key: Tab; label: string; icon: IconName }[] = [
  { key: 'home', label: '홈', icon: 'home' },
  { key: 'episodes', label: '에피소드', icon: 'tv' },
  { key: 'lines', label: '대사장', icon: 'message-circle' },
  { key: 'review', label: '복습', icon: 'repeat' },
];

export default function App() {
  const blank = <View style={{ flex: 1 }} />;
  return (
    <SafeAreaProvider>
      <SettingsProvider fallback={blank}>
        <DataProvider fallback={blank}>
          <NavProvider>
            <Main />
          </NavProvider>
        </DataProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

function RouteView({ route }: { route: Route }) {
  switch (route.name) {
    case 'settings':
      return <SettingsScreen />;
    case 'episode':
      return <EpisodeScreen id={route.id} />;
    case 'lineEdit':
      return <LineEditScreen id={route.id} showId={route.showId} episodeId={route.episodeId} />;
    case 'line':
      return <LineScreen id={route.id} />;
    case 'practice':
      return <PracticeScreen id={route.id} />;
    case 'review':
      return <ReviewScreen />;
    case 'quiz':
      return <QuizScreen />;
  }
}

function Main() {
  const { c } = useSettings();
  const nav = useNav();
  const top = nav.stack[nav.stack.length - 1];

  return (
    <SafeAreaView style={[s.root, { backgroundColor: c.bg }]} edges={['top', 'left', 'right']}>
      <StatusBar style={c.dark ? 'light' : 'dark'} />
      <View style={{ flex: 1 }}>
        {top ? (
          // 같은 종류의 화면이 바뀌어도 새로 그리도록 key를 줘요
          <RouteView key={nav.stack.length + JSON.stringify(top)} route={top} />
        ) : (
          <>
            {nav.tab === 'home' && <HomeScreen />}
            {nav.tab === 'episodes' && <EpisodesScreen />}
            {nav.tab === 'lines' && <LinesScreen />}
            {nav.tab === 'review' && <ReviewTab />}
          </>
        )}
      </View>
      <SafeAreaView edges={['bottom']} style={[s.tabBar, { backgroundColor: c.surface, borderTopColor: c.line }]}>
        {TABS.map((t) => {
          const active = nav.tab === t.key && !top;
          const color = nav.tab === t.key ? c.accent : c.muted;
          return (
            <Pressable
              key={t.key}
              accessibilityRole="tab"
              accessibilityLabel={t.label}
              accessibilityState={{ selected: active }}
              onPress={() => nav.setTab(t.key)}
              style={s.tab}
            >
              <Feather name={t.icon} size={21} color={color} />
              <T size={11} weight={nav.tab === t.key ? 'semibold' : 'medium'} color={color}>
                {t.label}
              </T>
            </Pressable>
          );
        })}
      </SafeAreaView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  tabBar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: 'center', paddingTop: 10, paddingBottom: 8, gap: 3 },
});
