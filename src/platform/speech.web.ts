// 웹: 브라우저(휴대폰)에 들어 있는 영어 음성으로 읽어 줘요. (네이티브 버전은 speech.ts)

let voice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === 'undefined') return null;
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'));
  // 미국 영어 + 자연스러운 음성을 먼저 골라요
  const score = (v: SpeechSynthesisVoice) =>
    (v.lang.toLowerCase() === 'en-us' ? 4 : 0) +
    (/(samantha|enhanced|premium|natural|google us)/i.test(v.name) ? 2 : 0) +
    (v.localService ? 1 : 0);
  return voices.sort((x, y) => score(y) - score(x))[0] ?? null;
}

if (typeof speechSynthesis !== 'undefined') {
  voice = pickVoice();
  speechSynthesis.onvoiceschanged = () => {
    voice = pickVoice();
  };
}

export const canSpeak = typeof speechSynthesis !== 'undefined';

export function speak(text: string, rate = 1, times = 1): void {
  if (!canSpeak) return;
  speechSynthesis.cancel();
  for (let i = 0; i < times; i++) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice?.lang ?? 'en-US';
    if (voice) u.voice = voice;
    u.rate = rate;
    speechSynthesis.speak(u);
  }
}

export function stopSpeaking(): void {
  if (canSpeak) speechSynthesis.cancel();
}
