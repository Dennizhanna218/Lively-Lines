# CLAUDE.md

## 언어 설정

- 사용자와의 모든 대화는 한국어로 진행합니다.
- 사용자는 비개발자입니다. 설명은 쉽고 친절하게, 전문 용어는 풀어서 해 주세요.

## 새 기능·서비스를 만들 때

- 먼저 앱 마켓을 조사합니다. 비슷한 분야에서 인기 있고 사용자가 많은 앱(예: Cake, Duolingo, ELSA, Speak, Language Reactor, Anki)을 찾아 무엇이 잘 되는지 분석하고, 그 장점을 반영한 구상(화면 미리보기 포함)을 먼저 보여 준 뒤 만듭니다.

## 프로젝트

Lovely Lines: 부부가 함께 미드를 보며 마음에 든 대사를 모으고, 따라 말하고, 복습하는 영어 공부 앱.
Expo(React Native) + TypeScript로 만들고, 지금은 웹앱(PWA)으로 GitHub Pages(`/Lively-Lines/`)에 배포합니다.
나중에 네이티브 앱으로 전환할 예정이라 아래 원칙을 지킵니다.

- 화면은 React Native 컴포넌트만 씁니다. 브라우저 기능이 꼭 필요하면 `*.web.ts`와 `*.ts`(네이티브)로 나눕니다.
  (예: `src/platform/speech*.ts` 원어민 음성, `src/platform/photoStore*.ts` 장면 사진)
- 저장은 `src/storage/`(data.ts, DataContext.tsx)를 통해서만 하고, 바뀔 때마다 바로 저장합니다. 데이터 형식을 바꾸면 `normalize*()`로 예전 데이터와 호환되게 하고 `BACKUP_VERSION`도 함께 관리합니다.
- 기록은 기기에만 저장합니다(서버 없음). 둘 사이 공유는 백업 파일로 합니다.
- 색은 `useSettings().c`(테마 색), 글자는 `<T>` 컴포넌트를 씁니다. 기본 색감은 피치예요.
- 드라마 대본·자막을 앱이나 저장소에 미리 넣지 않습니다(저작권). 대사는 사용자가 직접 적어 넣습니다. 예시·테스트 문장은 직접 지어낸 일반 문장만 씁니다.
- 패키지는 `npx expo install`로 추가합니다. 이 클라우드 환경에서는 `EXPO_OFFLINE=1`을 붙여야 합니다.
- 작업을 마치기 전에 `npm run typecheck`와 `npm run build:web`을 실행합니다.

자세한 구조는 `README.md`, Expo 일반 규칙은 `AGENTS.md`를 참고하세요.
