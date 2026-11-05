// 네이티브 앱: expo-speech로 영어 음성을 읽어 줘요. (웹 버전은 speech.web.ts)
import * as Speech from 'expo-speech';

export const canSpeak = true;

export function speak(text: string, rate = 1, times = 1): void {
  Speech.stop();
  for (let i = 0; i < times; i++) Speech.speak(text, { language: 'en-US', rate });
}

export function stopSpeaking(): void {
  Speech.stop();
}
