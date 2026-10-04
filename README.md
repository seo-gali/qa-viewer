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
| Phase 2 | 2–4개 기기 비교, 개별 검사, 공통 표시 배율 | 예정 |
| Phase 3 | Playwright Chromium mobile 컨텍스트, DPR / touch / UA, 스크린샷·QA 리포트 | 예정 |
| Phase 4 | 실제 기기 QR 미리보기 | 범위 밖 |

`npm run check`는 구문 검사, `npm test`는 프로필·서버 검증, `npm run test:browser`는 Chromium 기반 실제 화면 동작 검증입니다.

Phase 1 검증: 단위·서버 테스트 4개 통과. Chromium에서 Fit 배율 변경 전후 100vw / 100vh / media query 불변, 업로드·드롭·붙여넣기, 회전, Custom 입력 범위, 요소 경고·bounding box, Safe Area·힌지, 원본 viewport meta 보존, 사용자 스크립트 차단을 확인했습니다. 화면 캡처는 `artifacts/phase-1.png`에 생성됩니다.

## 공식 근거

[Chrome Device Mode의 한계](https://developer.chrome.com/docs/devtools/device-mode#limitations), [Playwright Emulation](https://playwright.dev/docs/emulation), [MDN viewport meta](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport), [MDN CSS env()](https://developer.mozilla.org/en-US/docs/Web/CSS/env), [MDN iframe sandbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#sandbox).
