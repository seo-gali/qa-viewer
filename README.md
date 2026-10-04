# Mobile Content QA Viewer

HTML 콘텐츠를 다양한 CSS viewport에서 렌더링하고 레이아웃, Safe Area, overflow, 반응형 문제를 검수하는 로컬 도구입니다. 콘텐츠를 중심에 두고 디자이너가 빠르게 기기를 바꿔 확인하도록 구성합니다.

## 실행

Node.js 22 이상에서 `npm ci`, `npx playwright install chromium`, `npm start` 후 http://127.0.0.1:4173 을 엽니다. 정적 Phase 1–2 서버는 Node 내장 기능만 사용하며 Playwright는 브라우저 검증과 Phase 3용입니다.

HTML 파일을 열거나 화면에 드롭하고, 코드 붙여넣기를 사용할 수 있습니다. Apple / Samsung / Foldable / Flip / Generic / Custom 프로필, 회전, Fit / 100%, Safe Area, 요소 검사 기능을 제공합니다. 업로드 내용은 메모리에 보관하며 기기를 바꿀 때 다시 업로드할 필요가 없습니다. 이미지와 스타일은 HTML에 포함한 단일 파일을 권장합니다.

## 정확도 계약

- iframe 실제 크기는 선택한 CSS px입니다. Fit은 iframe 밖의 transform만 사용합니다.
- 원본 CSS, `meta name="viewport"`, `env()` 값을 치환하지 않습니다. 보안용 CSP 삽입과 meta refresh 제거만 수행합니다.
- 데스크톱 iframe에서는 모바일 viewport meta 동작, DPR, touch, OS, 브라우저 엔진을 재현하지 않습니다. 프로필은 검수용 크기이며 최신 기기 공식 사양표가 아닙니다.
- Safe Area, notch, Dynamic Island, Fold / Flip hinge는 시각화입니다. 실제 UA의 env 변수나 화면 세그먼트를 생성하지 않습니다.
- 작은 텍스트, 잘림, Safe Area 침범은 휴리스틱 경고입니다. 세로 스크롤 콘텐츠를 화면 밖 오류로 취급하지 않습니다.
- 기본 정적 미리보기는 JavaScript를 실행하지 않고 외부 리소스를 차단합니다. 원격 리소스와 상대 경로 에셋이 필요한 HTML은 인라인으로 묶어 주세요.

## 단계와 검증

| 단계 | 범위 | 상태 |
| --- | --- | --- |
| Phase 1 | HTML 입력, CSS viewport, 기기 시각화, Layout Inspector | 완료 · 브라우저 검증 통과 |
| Phase 2 | 2–4개 기기 비교, 개별 검사, 공통 표시 배율 | 완료 · 브라우저 검증 통과 |
| Phase 3 | Playwright Chromium mobile 컨텍스트, DPR / touch / UA, 스크린샷·QA 리포트 | 완료 · URL 및 보안 마감 포함 |
| Phase 4 | 실제 기기 QR 미리보기 | 범위 밖 |

`npm run check`는 구문 검사, `npm test`는 프로필·서버 검증, `npm run test:browser`는 Chromium 기반 실제 화면 동작 검증입니다.

Phase 1 검증: 단위·서버 테스트 4개 통과. Chromium에서 Fit 배율 변경 전후 100vw / 100vh / media query 불변, 업로드·드롭·붙여넣기, 회전, Custom 입력 범위, 요소 경고·bounding box, Safe Area·힌지, 원본 viewport meta 보존, 사용자 스크립트 차단을 확인했습니다. 화면 캡처는 `artifacts/phase-1.png`에 생성됩니다.

Compare 버튼으로 비교 모드를 켭니다. 카드별 프로필과 아래 검사 결과 버튼으로 검사 대상을 선택하고, 상단 크기로 선택 카드의 Custom 크기를 지정할 수 있습니다. ＋ 기기 추가 / ✕ 제거로 2–4개를 구성합니다. 회전과 배율, Safe Area, 최소 글자 기준은 공통 설정입니다. 100%에서는 작업 공간을 스크롤합니다.

Phase 2 검증: 390 / 412 / 768px 동시 렌더링, 공통 Fit 배율, 카드별 overflow 차이·기기 변경, 최소 2 / 최대 4개 제한, 공통 회전, 단일 모드 복귀 후 원본 보존을 Chromium에서 확인했습니다. `artifacts/phase-2.png` 생성.

Phase 3: Chromium 검사 버튼에서 선택한 기기의 DPR, 테마, JavaScript 실행 여부를 지정하고 스크린샷과 JSON 리포트를 저장합니다. PNG 외에 WebP 압축 저장도 지원합니다. 원본 viewport meta의 실제 mobile 처리와 resolution media query, touch, UA를 검사합니다.

URL 열기: 공개 HTTPS 주소의 iframe 미리보기와 Chromium 최상위 페이지 검사를 지원합니다. iframe 삽입이 차단되는 사이트는 Chromium 검사를 사용합니다. cross-origin iframe DOM 검사는 지원하지 않습니다. 인증 사이트·사설망·IPv6 전용·POST API·서비스 워커는 지원하지 않으며 일부 SPA와 봇 차단 사이트는 완전 렌더링이 불가능합니다.

로컬 API에는 HttpOnly/SameSite=Strict 세션, Host/Origin 검증, 분당 20회, 입력 스키마·업로드 제한·timeout, 보안 헤더를 적용했습니다. URL 리소스는 DNS 검증 후 공개 IP에 고정 연결하며 HTTPS GET만 허용합니다. 데이터베이스·계정·비밀번호·API 키는 사용하지 않습니다.

## 공식 근거

[Chrome Device Mode의 한계](https://developer.chrome.com/docs/devtools/device-mode#limitations), [Playwright Emulation](https://playwright.dev/docs/emulation), [MDN viewport meta](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport), [MDN CSS env()](https://developer.mozilla.org/en-US/docs/Web/CSS/env), [MDN iframe sandbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#sandbox).
