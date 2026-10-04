# Mobile Content QA Viewer

HTML·공개 HTTPS 콘텐츠의 모바일 CSS viewport 비교 및 레이아웃 검수 전용 로컬 도구.

## 실행

필수 환경: Node.js 22 이상, Playwright Chromium.

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
3. 회전·Fit·Safe Area 조건에 따른 콘텐츠 확인.
4. Compare를 통한 2–4개 기기 비교 및 카드별 검사 선택.
5. Inspect 경고 선택에 따른 해당 요소 bounding box 확인.
6. Chromium 검사의 DPR·테마·JavaScript 조건 지정 및 스냅샷 검사.
7. PNG·WebP·JSON 결과 다운로드.

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

## 검증 결과

검증 기준일: 2026-10-05.

| 명령 | 검증 범위 | 결과 |
| --- | --- | --- |
| `npm run check` | JavaScript/Node 모듈 구문 | 통과 |
| `npm test` | 프로필·Custom·URL 주소·입력·세션·Origin·크기·rate limit·404 | 11개 통과 |
| `npm run test:browser` | viewport/Fit 불변·업로드/드롭·격리·검사·비교·모바일 브라우저·UI | 통과 |
| `npm run test:url` | example.com 실제 HTTPS 콘텐츠 및 Chromium 스냅샷 | 통과 |
| `npm run test:secrets` | 전체 로컬 커밋 및 Git 추적 파일의 시크릿 파일/인식 키 패턴 | 발견 0건 |
| `npm audit` | 설치 의존성의 알려진 취약점 | 0건 |

주요 확인 항목:

- Fit 변경 전후 100vw·100vh·media query 계산 불변.
- 원본 viewport meta에 따른 모바일 layout width 390·980·500px 구분.
- DPR 3/1에 따른 resolution media query 변화 및 touch points 확인.
- 스크립트 실행 opt-in·검사별 격리·취소·동시 요청 차단·시간 초과 후 복구.
- iframe 삽입 차단 응답의 최상위 페이지 검사 및 URL CSS/스크립트 로딩.
- 홈·비교·입력 대화상자·404의 320·375·390·768·1440px 바깥 가로 넘침 없음.
- 실제 파일 열기 버튼·내부 링크·favicon·페이지 메타·저작권 연도·오류 메시지 확인.
- GitHub 푸터 링크의 공개 HTTPS 응답 200 확인.

브라우저 검증 후 `artifacts/`의 화면 캡처 생성 및 Git 제외:

- `phase-1.png`, `phase-2.png`, `phase-3.png` — 단계별 화면.
- `phase-3-url.png`, `phase-3-live-url.png` — URL 검사.
- `mobile.png`, `404-mobile.png` — 모바일 UI.

## 주요 파일

| 파일 | 역할 |
| --- | --- |
| `index.html`, `styles.css`, `app.js` | 뷰어 UI·반응형 화면·상태 관리 |
| `profiles.js`, `inspector.js`, `security.js` | 프로필·DOM 검사·정적 문서 격리 |
| `server.mjs`, `emulation-config.mjs`, `emulator.mjs` | 로컬 서버·API 검증·Chromium 검사 |
| `public-url.js`, `public-resource.mjs` | URL 검증·공개 HTTPS 리소스 접근 |
| `emulation-ui.js` | 검사 결과·다운로드·WebP 압축 |
| `sample.js`, `404.html`, `favicon.svg` | 샘플 콘텐츠·404·파비콘 |
| [AGENTS.md](AGENTS.md) | 실행·승인·격리·검증 원칙 |
| [Design.md](Design.md) | 제품 구조·렌더링 계약·보안 설계·완료 기록 |

## 공식 근거

- [Chrome Device Mode의 한계](https://developer.chrome.com/docs/devtools/device-mode#limitations).
- [Playwright Emulation](https://playwright.dev/docs/emulation).
- [MDN viewport meta](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport).
- [MDN CSS env()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env).
- [MDN iframe sandbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#sandbox).
