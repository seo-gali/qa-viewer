# Mobile Content QA Viewer

HTML·공개 HTTPS 콘텐츠의 모바일 CSS viewport 비교 및 레이아웃 검수 전용 로컬 도구.

## 실행

필수 환경: Node.js 22.23.4 이상(22.x)·24.22.1 이상(24.x)·26.12.1 이상(26.x), Playwright Chromium.

현재 검증 환경: Node.js v24.22.1. `server/runtime.mjs`의 서버·공개 리소스 모듈 초기화 시 버전 검증 및 미지원 버전 실행 차단. CVE-2026-111497의 [공식 보안 릴리스](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases) 기준 하한 적용.

`package.json`·lock 파일의 `engines: >=22`는 기존 메타데이터 유지 상태. 실제 실행 허용 범위는 위 런타임 검사 기준이며, lock 메타데이터 변경은 별도 승인 대상.

```sh
npm ci
npx playwright install chromium
npm start
```

접속 주소: [로컬 작업 공간](http://127.0.0.1:4173).

PowerShell 포트 변경 예시:

```powershell
$env:QA_PORT = '4174'
npm start
```

## 핵심 기능

| 구분 | 기능 |
| --- | --- |
| 콘텐츠 입력 | HTML 열기·Drag & Drop·코드 붙여넣기·공개 HTTPS URL |
| 기기 프로필 | Apple·Samsung·Foldable·Flip·Generic·Custom |
| viewport | 240–2048 CSS px의 Custom 크기·세로/가로 회전 |
| 화면 표시 | Fit·100%·75%·50%·기기 외곽선·cutout 시각화 |
| 검수 오버레이 | Safe Area·Dynamic Island·notch·Fold/Flip hinge·요소 bounding box |
| Layout Inspector | 가로 overflow·잘림·작은 글자·화면 밖 fixed·깨진 내부 링크·이미지 로드 실패·media query |
| 비교 | 동일 콘텐츠의 2–4개 독립 viewport·카드별 기기 및 검사 선택·공통 Fit 배율 |
| Chromium 검사 | 모바일 viewport meta·DPR·resolution media query·touch·UA·테마·선택적 JavaScript 실행 |
| 결과 저장 | CSS pixel 크기의 PNG·WebP 85% 압축·JSON QA 리포트 |
| UI 마감 | 모바일 도구 메뉴·페이지 메타·SVG 파비콘·홈 로고·푸터·자동 저작권 연도·맞춤 404·성공/오류 안내 |

## 사용 순서

1. HTML 파일·코드·공개 HTTPS URL 선택.
2. 기기 프로필 또는 Custom 크기 지정.
3. 회전·Fit 및 더보기의 Safe Area·최소 글자 기준에 따른 콘텐츠 확인.
4. Compare를 통한 2–4개 기기 비교 및 카드별 검사 선택.
5. Inspect 경고 선택에 따른 해당 요소 bounding box 확인.
6. Chromium 검사의 DPR·테마·JavaScript 조건 지정 및 스냅샷 검사.
7. PNG·WebP·JSON 결과 다운로드.

## HTML 제작·검수 흐름

[Effective HTML](https://github.com/plannotator/effective-html)의 단일 HTML·반응형·접근성·상태별 브라우저 검증 원칙 적용. [Android Skills](https://github.com/android/skills)의 화면 크기·테마·상태별 테스트 관점 참고. 외부 스킬 전역 설치 및 Android SDK·Compose·Gradle 의존성 추가 없음.

| 지침 | 적용 범위 |
| --- | --- |
| `html-wireframe` | 화면 구조·정보 순서·작업 흐름 검토를 위한 단일 HTML 제작 참고 |
| `html-prototype` | [반응형 신청 폼](examples/responsive-form.html)의 정상·오류·완료·내용 수정 상태 구현 |
| Android `testing-setup` | 화면 크기·가로 방향·테마·상태별 검증 조합 참고 |
| Android `edge-to-edge` | 시스템 영역의 콘텐츠 가림을 확인하는 수동 검수 관점 참고·네이티브 코드 적용 제외 |

예제 검수 순서:

1. `npm start` 실행 후 파일 열기에서 `examples/responsive-form.html` 선택.
2. 기기 프로필 또는 Custom 크기를 이용한 375·390·768·1440 CSS px 비교 및 회전 확인.
3. 정적 미리보기의 입력 비활성 상태·긴 한국어 문구·줄바꿈·가로 넘침 확인.
4. Chromium 검사에서 Light/Dark 및 JavaScript OFF/ON의 초기 화면 스냅샷 확인.
5. 독립 브라우저에서 예제 파일을 열거나 `node tests/artifact-browser.mjs` 실행을 통한 입력 오류·완료·수정·키보드·포커스 이동 확인.

예제의 인라인 CSS·JavaScript 및 시스템 폰트 사용. 외부 CDN·API·저장 기능·실제 신청 전송 없음. 실제 개인정보 대신 검수용 내용 사용 권장. 예제·문서·서버 소스의 로컬 HTTP 제공 제외 및 기존 파일 허용 목록 유지.

Chromium 검사 결과의 스냅샷 제공에 따른 클릭 흐름 조작 미지원. 정적 iframe의 스크립트 차단 및 HTML 모드의 외부 통신 차단 유지. Android dp 수치의 CSS px 프로필 직접 전용 및 실제 시스템 바·소프트 키보드 재현 제외.

## UX 적용

- HTML 열기·Chromium 검사의 주요 버튼 강조와 모바일 상시 표시. 원본 재렌더링·Safe Area·글자 임계값의 더보기 배치.
- 태그라인·중복 안내·보조 레이블 제거 및 기능명·동작·상태 중심의 문구 사용. 검수 한계와 지원 범위의 접이식 제공.
- 기본 샘플의 홍보 문구·장식 대신 검수 목록·내부 링크·확인 항목 제공.
- 예제 폼의 blur/제출 검증, 오류 입력의 포커스·스크롤 이동, 완료 후 수정 시 입력 내용 유지.
- URL·HTML·DPR 입력 오류의 해당 필드 연결 및 포커스 이동. 숫자·이메일 입력의 키패드 지정과 결과 이미지의 공간 확보.
- 코드·URL 입력창의 미적용 초안 메모리 보존. 닫기·Escape·입력 오류 후 재개, 새 콘텐츠 적용 또는 페이지 새로고침 시 초기화. 미리보기의 적용 전 원본 유지.
- 원본·업로드·개인정보의 localStorage 임시 저장 제외 및 메모리 보관 정책 유지.

프로덕션 배포 전 10개 점검 항목: [AGENTS.md](AGENTS.md#프로덕션-배포-전-점검). 현재 적용 여부와 후속 과제: [PLAN.md](PLAN.md#배포-전-확인-기록).

## 렌더링 계약

- 선택한 CSS px와 동일한 iframe 크기 및 외부 래퍼의 transform 배율 적용.
- 원본 CSS·viewport meta·env()·doctype 유무 및 quirks mode 보존.
- 정적 HTML의 same-origin Blob 문서 전달 및 이전 Blob URL 해제.
- 보안용 CSP 삽입·meta refresh 제거·외부 링크 이동 차단.
- 데스크톱 iframe의 모바일 viewport meta·DPR·touch 재현 미지원.
- Safe Area·cutout·hinge의 참고 시각화 및 실제 UA env 변수 생성 미지원.
- 프로필의 검수용 참고 치수 사용 및 공식 최신 하드웨어 사양 보장 제외.
- 설정 임계값 기반 작은 글자 경고 및 웹 표준 위반 판정 제외.
- 세로 스크롤 콘텐츠와 화면 밖 fixed 요소의 구분.
- Chromium 결과의 정적 스냅샷 제공 및 실제 Safari·OS·CPU·휴대폰 재현 제외.

## URL 지원 범위

| 항목 | 범위 |
| --- | --- |
| 주소 | 인증 정보 없는 공개 HTTPS·기본 443 포트·공개 IPv4 |
| iframe | 사이트의 삽입 정책에 따른 표시·cross-origin DOM 검사 미지원 |
| 삽입 차단 사이트 | Chromium 최상위 페이지의 스크린샷 및 DOM 검사 |
| 리소스 | 공개 HTTPS GET·상대 경로 스타일/이미지·선택적 스크립트 및 GET API |
| 인증 | 원격 Cookie·Authorization 전달 및 로그인 사이트 지원 제외 |
| 제한 | localhost·사설망·예약 주소·IPv6·POST API·서비스 워커·팝업·중첩 프레임·다운로드 차단 |
| 렌더링 한계 | 인증·봇 보호·차단 리소스·복잡한 비동기 로딩에 따른 일부 사이트 불완전 표시 가능성 |

HTML 모드의 외부 리소스 차단 및 인라인 이미지·스타일·폰트를 포함한 단일 파일 사용 권장.

## 보안 기준

- `127.0.0.1` 서버 바인딩 및 애플리케이션 파일 허용 목록.
- 메모리 세션·HttpOnly/SameSite=Strict 쿠키·일정 시간 비교 인증.
- Host·동일 Origin·JSON Content-Type 검증 및 허용 필드/값 범위 검증.
- HTML 2MB·JSON 3MB·분당 20회·동시 검사 1개·총 검사 20초 제한.
- 정적 iframe의 `sandbox="allow-same-origin"` 및 사용자 스크립트 차단.
- Chromium의 검사별 새 컨텍스트·종료·시간 초과 및 취소 처리.
- URL 요청별 DNS 검증·공개 IPv4 고정 연결·HTTPS 다운그레이드 차단.
- 원격 요청 최대 60개·동시 연결 4개·리소스별 4MB·합계 32MB 제한.
- 사용자 보고 텍스트의 textContent 출력 및 내부 stack trace/로컬 경로 없는 API 오류 응답.
- CSP·nosniff·X-Frame-Options·Permissions-Policy·CORP·COOP·Referrer-Policy 적용.
- 업로드 콘텐츠·API 세션의 메모리 보관 및 자동 디스크 저장 제외.
- `.env`·키 파일·인증 파일의 Git 제외 및 추적 파일/커밋의 알려진 시크릿 패턴 검사.
- loopback HTTP 실행 특성에 따른 Secure 쿠키·HSTS 적용 제외.
- DB·계정·비밀번호·API 키 미사용에 따른 RLS·비밀번호 해싱·저장 암호화·SQL 파라미터화 비적용.
- 로컬 검수 도구 범위 및 운영용 다중 사용자 인증·공개 호스팅 제외.

## 구현 단계

| 단계 | 범위 | 상태 |
| --- | --- | --- |
| Phase 1 | HTML Viewer·CSS Viewport·Visual Device Profile·Layout Inspector | 완료 |
| Phase 2 | 2–4개 기기 동시 비교 | 완료 |
| Phase 3 | Playwright Chromium·URL 검사·스크린샷/QA 리포트·UI/보안 마감 | 완료 |
| Phase 4 | 실제 기기 QR 미리보기 | 후속 범위 |
| 유지보수 | 디렉토리 정리·HTML 제작 지침·검수 예제·UX 정리·회귀 검사 | 완료 |

세부 작업 및 후속 항목: [PLAN.md](PLAN.md).

## 검증 결과

현재 변경 검증 기준일: 2026-10-26. Node.js v24.22.1 환경의 전체 회귀 검사 통과.

| 명령 | 검증 범위 | 결과 |
| --- | --- | --- |
| `npm run check` | JavaScript/Node 모듈 구문 | 통과 |
| `npm test` | 프로필·URL·입력·세션·Origin·제한·404·런타임 경계값·스테이징 단독 탐지 | 14개 통과 |
| `npm run test:browser` | viewport/Fit·격리·비교·모바일 브라우저·UI·HTML 예제 상태/키보드/테마 | 통과 |
| `npm run test:url` | example.com 실제 HTTPS 콘텐츠 및 Chromium 스냅샷 | 통과 |
| `npm run test:secrets` | 전체 로컬 커밋·추적 작업 트리·스테이징의 시크릿 파일/인식 키 패턴 | 발견 0건 |
| `npm audit` | 설치 의존성의 알려진 취약점 | 2026-10-05 기록: 0건·이번 의존성 변경 없음 |

`npm start`의 이동한 진입점 및 기존 공개 경로 HTTP 200 확인. 로컬 문서 링크 13개 확인. `test:url` 최초 실행의 샌드박스 연결 차단(`EACCES`) 이후 제한 밖의 동일 검사 재실행 통과.

보완 검증: Node.js 24.22.0을 모의한 서버·공개 리소스 진입점 차단, 실제 v24.22.1 서버 HTTP 200, 추가 문서를 포함한 로컬 링크 15개 확인. 이전 버전의 실제 Node 실행 파일을 설치한 검증은 제외.

주요 확인 항목:

- Fit 변경 전후 100vw·100vh·media query 계산 불변.
- 원본 viewport meta에 따른 모바일 layout width 390·980·500px 구분.
- DPR 3/1에 따른 resolution media query 변화 및 touch points 확인.
- 스크립트 실행 opt-in·검사별 격리·취소·동시 요청 차단·시간 초과 후 복구.
- iframe 삽입 차단 응답의 최상위 페이지 검사 및 URL CSS/스크립트 로딩.
- 홈·비교·입력 대화상자·404의 320·375·390·768·1440px 바깥 가로 넘침 없음.
- 실제 파일 열기 버튼·내부 링크·favicon·페이지 메타·저작권 연도·오류 메시지 확인.
- GitHub 푸터 링크의 공개 HTTPS 응답 200 확인: 2026-10-05 기록.
- HTML 예제의 375·390·768·1440 CSS px 및 844 × 390 가로 방향·Light/Dark·긴 한국어 문구·입력 오류·완료·수정·키보드·포커스 이동·외부 요청 0건 확인.
- 더보기의 키보드 조작, 모바일 주요 버튼 표시, URL·DPR 오류 포커스 및 편집 시 오류 정리 확인.
- 미적용 코드·URL·빈 초안 보존, 오류 후 재개, 새 콘텐츠 적용·새로고침 시 초기화 및 브라우저 저장소 미사용 확인.

추가 로컬 진단: [성능 측정 기록과 Chrome DevTools MCP 연결 검토안](docs/chrome-devtools.md). MCP 설치·클라이언트 설정 변경·Lighthouse 실행은 승인 전 미실시.

브라우저 검증 후 `artifacts/`의 화면 캡처 생성 및 Git 제외:

- `phase-1.png`, `phase-2.png`, `phase-3.png` — 단계별 화면.
- `phase-3-url.png`, `phase-3-live-url.png` — URL 검사.
- `mobile.png`, `404-mobile.png` — 모바일 UI.
- `form-390-light.png`, `form-390-dark.png`, `form-1440-light.png`, `form-1440-dark.png` — 예제의 모바일·데스크톱 및 테마.
- `form-success-light.png`, `form-success-dark.png`, `form-qa-js-off.png`, `form-qa-js-on.png` — 예제의 완료 화면 및 Chromium 스냅샷.

## 디렉토리 구조

```text
qa-viewer/
├─ public/                 브라우저 UI·정적 자산·브라우저/서버 공용 순수 모듈
├─ server/                 로컬 HTTP 서버·입력 검증·Chromium·공개 URL 요청
├─ examples/               외부 통신 없는 단일 HTML 검수 예제
├─ tests/                  단위·브라우저·URL·시크릿 검사
├─ docs/Design.md          설계·렌더링 계약·완료 기록
├─ README.md               실행·사용·검증 안내
├─ PLAN.md                 적용 계획·완료 상태·후속 항목
├─ AGENTS.md               에이전트 작업 원칙
└─ package.json            실행 및 검증 명령
```

기존 웹 경로 `/app.js`·`/styles.css` 등의 유지. 디스크의 `public/` 경로 및 서버 파일의 임의 노출 없음.

## 주요 파일

| 파일 | 역할 |
| --- | --- |
| `public/index.html`, `public/styles.css`, `public/app.js` | 뷰어 UI·반응형 화면·상태 관리 |
| `public/profiles.js`, `public/inspector.js`, `public/security.js` | 프로필·DOM 검사·정적 문서 격리 |
| `server/server.mjs`, `server/emulation-config.mjs`, `server/emulator.mjs` | 로컬 서버·API 검증·Chromium 검사 |
| `server/runtime.mjs`, `tests/runtime.test.mjs` | 지원 메이저 및 보안 패치 하한 검사·경계값 검증 |
| `public/public-url.js`, `server/public-resource.mjs` | URL 검증·공개 HTTPS 리소스 접근 |
| `public/emulation-ui.js` | 검사 결과·다운로드·WebP 압축 |
| `public/sample.js`, `public/404.html`, `public/favicon.svg` | 기본 샘플·404·파비콘 |
| `examples/responsive-form.html`, `tests/artifact-browser.mjs` | 검수용 프로토타입·상태 및 키보드 회귀 검사 |
| `tests/security-audit.mjs`, `tests/security-audit.test.mjs` | 작업 트리·스테이징·이력 검사 및 값 비노출 회귀 검사 |
| [AGENTS.md](AGENTS.md) | 실행·승인·격리·검증 원칙 |
| [PLAN.md](PLAN.md) | 구조 정리·HTML 지침 적용 계획·후속 항목 |
| [docs/Design.md](docs/Design.md) | 제품 구조·렌더링 계약·보안 설계·완료 기록 |

## 공식 근거

- [Chrome Device Mode의 한계](https://developer.chrome.com/docs/devtools/device-mode#limitations).
- [Playwright Emulation](https://playwright.dev/docs/emulation).
- [MDN viewport meta](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport).
- [MDN CSS env()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env).
- [MDN iframe sandbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#sandbox).
- [Effective HTML: html-prototype](https://github.com/plannotator/effective-html/blob/main/skills/html-prototype/SKILL.md).
- [Android Skills: testing-setup](https://github.com/android/skills/blob/main/testing/testing-setup/SKILL.md).
- [Android Skills: edge-to-edge](https://github.com/android/skills/blob/main/system/edge-to-edge/SKILL.md).
