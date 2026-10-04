# 설계: Mobile Content QA Viewer

## 제품 경험
상단은 HTML 입력·기기 선택·CSS 크기·회전·배율, 그 아래는 Safe Area와 Inspect 도구를 배치한다. 중앙의 점 패턴 작업 공간에 콘텐츠 화면을 놓고 우측 검사 패널에서 경고를 선택한다. 하단은 실제 viewport와 모드, 한계를 표시한다. 디바이스 장식은 얇은 외곽선과 cutout에 한정한다.

## Phase 1
정적 뷰어는 ES modules와 기본 Node HTTP 서버만 사용한다. profiles.js는 기기 및 치수 검증, inspector.js는 브라우저 DOM 검사, app.js는 원본 문자열·URL·기기·방향·배율·검사 선택 상태를 관리한다. security.js는 HTML 보안 문서를 만든다.

`viewport(width × height) → 동일 크기 iframe → 외부 device 래퍼 transform: scale(s) → 배율을 반영한 slot` 순서다. iframe에 zoom을 적용하지 않는다. 화면 모서리는 iframe 레이아웃을 바꾸지 않고 바깥에서 clip한다. 방향 전환 시 viewport와 safe inset을 함께 회전한다.

검사기는 가로 scrollWidth와 요소 rect, 읽을 수 있는 media rule과 일치 여부, viewport meta, 직접 텍스트를 가진 요소의 font-size, 없는 내부 fragment 링크, 이미지 로드 실패를 검사한다. 외부 링크의 HTTP 생존 여부를 일괄 크롤링하지 않는다. fixed 요소만 세로 viewport 이탈을 경고한다. 명시적인 overflow hidden/clip 조상에 잘린 콘텐츠도 경고한다. offscreen 일반 스크롤 요소는 정상이다. 경고 선택은 원본 DOM을 스타일링하지 않고 별도 overlay rect를 그린다. 스크롤·resize 시 다시 계산한다. 렌더링되지 않은 요소는 제외하고 보고 수와 스캔 요소 수를 제한하며 제한 여부를 표시한다.

정적 문서는 sandbox iframe의 같은 origin Blob 문서로 전달하고 스크립트 실행 없이 DOM을 읽는다. srcdoc는 doctype이 없는 HTML에도 standards mode를 강제하므로 사용하지 않는다. 원본 doctype 유무·quirks mode를 보존하고, 기기 변경 시 이전 Blob URL을 해제한다. CSP는 가장 앞선 head meta로 삽입하고 refresh meta는 제거한다. 네트워크·폼·중첩 프레임과 외부 링크 이동을 차단한다. 사용자 CSS나 viewport meta, env()를 변경하지 않는다. JS 기반 레이아웃이 정적 모드에서 보이지 않는다는 것을 표시한다.

## Phase 2
같은 원본을 2–4개 독립 iframe에 전달한다. 각 카드에서 프로필을 바꾸고 활성 검사 카드를 선택한다. 공통 방향·Safe Area·폰트 임계값을 적용한다. Fit 배율은 비교 행 전체가 작업 공간에 들어오는 최소 배율로 통일한다. 100% 모드는 작업 공간 스크롤을 사용한다. 결과와 overlay는 카드별 DOM에 연결하며 리로드·기기 변경 후 오래된 결과를 버린다.

## Phase 3
로컬 API가 Playwright Chromium의 새 mobile context를 생성한다. viewport, screen, deviceScaleFactor, isMobile, hasTouch, userAgent, colorScheme를 명시한다. 실제 모바일 meta viewport 처리는 원본을 top-level 문서로 렌더링해서 검증한다. 원본 viewport meta와 CSS는 보존한다. 스크린샷과 실제 innerWidth / innerHeight / DPR / touch / UA 및 동일 Inspector 결과를 반환한다. 스크린샷은 정적 결과이며 스트리밍·원격 조작 브라우저가 아니다.

브라우저는 매 검사마다 격리하고 종료한다. HTML의 외부 네트워크와 서버 파일 접근은 route 차단한다. 사용자 스크립트 실행은 기본 꺼짐이며 선택적으로 활성화한다. CSP response sandbox는 top-level 문서에 적용하며 allow-same-origin은 해당 격리 브라우저 컨텍스트 안의 임시 origin만 유지한다. 정적 뷰어의 iframe에서 allow-scripts와 allow-same-origin을 동시에 쓰지 않는 원칙과 구분한다. 콘텐츠는 디스크에 쓰지 않는다. 신뢰할 수 없는 코드를 운영 서비스에서 실행하는 보안 경계로 사용하지 않는다.

## URL 모드와 보안
공개 HTTPS URL을 직접 iframe에 표시한다. 사이트의 frame-ancestors / X-Frame-Options 정책을 우회하지 않는다. cross-origin DOM은 읽을 수 없으므로 검사 미실행 상태를 명시한다. 같은 URL을 Chromium 검사에서는 최상위 페이지로 열어 스크린샷과 DOM QA를 반환한다.

public-url.js는 자격 증명·비표준 포트·사설 및 예약 IP·IPv6·HTTPS 다운그레이드를 거부한다. public-resource.mjs는 각 초기 요청·redirect·리소스에서 공개 IPv4 DNS 결과를 확인하고 실제 소켓 주소를 고정한다. 원격 Cookie/Authorization은 전달하지 않는다. 모든 요청은 GET만 허용하며 동시 원격 연결 4개, 최대 60개 요청, 리소스별 4MB / 합계 32MB를 제한한다. 인증·POST API·서비스 워커·팝업·중첩 프레임·다운로드는 지원하지 않는다. 일부 SPA 및 봇 차단 사이트는 완전 렌더링이 불가능하다.

로컬 API는 127.0.0.1 바인딩, 명시적 Host, 동일 Origin + JSON, 메모리 세션 쿠키, 일정 시간 비교 인증, 분당 20회, 동시 검사 1개, 총 20초 제한을 사용한다. HTML 2MB / JSON 3MB, 설정 필드 allowlist와 값 범위 검증을 적용한다. 응답은 사용자 코드·내부 stack trace·로컬 경로를 노출하지 않는 오류 코드로 정리한다. 사용자 보고 텍스트는 textContent로 출력한다. CSP·nosniff·DENY·Permissions-Policy·CORP·COOP·Referrer-Policy를 사용한다. 쿠키는 HttpOnly / SameSite=Strict이며 loopback HTTP 특성상 Secure / HSTS는 적용하지 않는다. DB·영구 저장·API 키·계정·비밀번호가 없으므로 RLS·암호화 저장·비밀번호 해싱·로그인 봇 보호·SQL 파라미터화는 적용 대상이 아니다.

## UI 마감과 접근성
320px부터 홈·비교·대화상자·404의 바깥 가로 넘침을 방지한다. 비교 콘텐츠와 100% 화면의 작업 공간 스크롤은 유지한다. 모바일 도구 메뉴에 aria-expanded / aria-controls, 입력에 label, 결과 및 오류에 status / alert를 제공한다. 페이지 제목·메타 설명·SVG 파비콘·홈 로고·푸터 링크·자동 저작권 연도·404 복귀 링크를 제공한다. 샘플 링크는 실제 내부 ID를 가리키며 CTA는 작동하는 anchor다. PNG는 CSS pixel 크기로 저장하고 브라우저 Canvas WebP 85% 압축 저장을 추가한다.

## 완료 기록
- Phase 1: 완료. npm run check, npm test (4개), npm run test:browser 통과. CSS viewport / Fit 불변·입력·검사·격리를 Chromium에서 확인. artifacts/phase-1.png 생성.
- Phase 2: 완료. 구문·단위·브라우저 검증 통과. 독립 viewport / 공통 Fit / 카드별 QA / 2–4개 제한 / 회전 / 원본 보존 검증. artifacts/phase-2.png 생성.
- Phase 3: 완료. npm run check / npm test (11개) / npm run test:browser / npm run test:url / npm run test:secrets 통과. 모바일 meta viewport 390 / 980 / 500px, DPR media query·touch·회전·theme·JS opt-in·격리·스크린샷·PNG/WebP/JSON 다운로드·URL 리소스·timeout/동시성/취소 검증. 320 / 375 / 390 / 768 / 1440px의 홈·비교·대화상자·404 검증. example.com 실주소 검사 및 GitHub 푸터 HTTP 200 확인. npm audit 취약점 0건, Git 시크릿 파일·알려진 키 패턴 0건. artifacts/phase-3.png, phase-3-url.png, phase-3-live-url.png, mobile.png, 404-mobile.png 생성.
