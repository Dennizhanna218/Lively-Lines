// 따라 말하기 채점: 원래 대사와 내가 말한(받아쓴) 문장을 단어 단위로 비교해요.

const CONTRACTIONS: Record<string, string> = {
  "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are', "it's": 'it is',
  "that's": 'that is', "what's": 'what is', "he's": 'he is', "she's": 'she is', "there's": 'there is',
  "i'll": 'i will', "you'll": 'you will', "we'll": 'we will', "they'll": 'they will', "it'll": 'it will',
  "i've": 'i have', "you've": 'you have', "we've": 'we have', "i'd": 'i would', "you'd": 'you would',
  "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "can't": 'can not', "cannot": 'can not',
  "won't": 'will not', "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', "weren't": 'were not',
  "let's": 'let us', "gonna": 'going to', "wanna": 'want to', "gotta": 'got to',
};

/** 비교용으로 소문자·문장부호 정리, 줄임말 풀기 */
export function normalizeWords(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter(Boolean)
    .flatMap((w) => (CONTRACTIONS[w] ?? w).split(' '));
}

export interface WordResult {
  word: string; // 원래 대사의 단어 (화면 표시용)
  ok: boolean;
}

/**
 * 원래 대사의 각 단어를 맞게 말했는지 표시하고 점수(0~100)를 매겨요.
 * 순서를 고려한 최장 공통 부분(LCS)으로 비교해서, 한 단어를 빠뜨려도 나머지는 맞게 쳐요.
 */
export function scoreSpeech(target: string, spoken: string): { words: WordResult[]; score: number } {
  const display = target.split(/\s+/).filter(Boolean);
  const t = display.map((w) => normalizeWords(w));
  const flatT: { i: number; w: string }[] = t.flatMap((ws, i) => ws.map((w) => ({ i, w })));
  const s = normalizeWords(spoken);

  const n = flatT.length;
  const m = s.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let a = n - 1; a >= 0; a--)
    for (let b = m - 1; b >= 0; b--)
      dp[a][b] = flatT[a].w === s[b] ? dp[a + 1][b + 1] + 1 : Math.max(dp[a + 1][b], dp[a][b + 1]);

  const matched = new Set<number>();
  let a = 0;
  let b = 0;
  while (a < n && b < m) {
    if (flatT[a].w === s[b]) {
      matched.add(a);
      a++;
      b++;
    } else if (dp[a + 1][b] >= dp[a][b + 1]) a++;
    else b++;
  }

  // 화면 단어 하나가 여러 비교 단어로 풀렸으면(I'll → i will) 모두 맞아야 맞은 걸로
  const words = display.map((word, i) => ({
    word,
    ok: flatT.every((x, k) => x.i !== i || matched.has(k)) && t[i].length > 0,
  }));
  const score = n === 0 ? 0 : Math.round((matched.size / n) * 100);
  return { words, score };
}

export function scoreMessage(score: number): string {
  if (score >= 95) return '완벽해요! 🎉';
  if (score >= 80) return '아주 좋아요! 👏';
  if (score >= 60) return '거의 다 왔어요!';
  return '한 번 더 들어 보고 말해 봐요';
}

/** '바꿔 말하기' 문장에 외우고 싶은 표현이 들어갔는지 */
export function usesExpression(sentence: string, highlight: string): boolean {
  const h = normalizeWords(highlight).join(' ');
  return !!h && normalizeWords(sentence).join(' ').includes(h);
}
