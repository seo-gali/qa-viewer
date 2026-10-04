# 설계: Mobile Content QA Viewer

## 제품 경험
상단은 HTML 입력·기기 선택·CSS 크기·회전·배율, 그 아래는 Safe Area와 Inspect 도구를 배치한다. 중앙의 점 패턴 작업 공간에 콘텐츠 화면을 놓고 우측 검사 패널에서 경고를 선택한다. 하단은 실제 viewport와 모드, 한계를 표시한다. 디바이스 장식은 얇은 외곽선과 cutout에 한정한다.

## Phase 1
ES modules와 기본 Node HTTP 서버만 사용한다. profiles.js는 기기 및 치수 검증, inspector.js는 브라우저 DOM 검사, app.js는 원본 문자열·기기·방향·배율·검사 선택 상태를 관리한다. security.js는 HTML 보안 문서를 만든다.

`viewport(width × height) → 동일 크기 iframe → 외부 device 래퍼 transform: scale(s) → 배율을 반영한 slot` 순서다. iframe에 zoom을 적용하지 않는다. 화면 모서리는 iframe 레이아웃을 바꾸지 않고 바깥에서 clip한다. 방향 전환 시 viewport와 safe inset을 함께 회전한다.

검사기는 가로 scrollWidth와 요소 rect, 읽을 수 있는 media rule, viewport meta, 직접 텍스트를 가진 요소의 font-size를 검사한다. fixed 요소만 세로 viewport 이탈을 경고한다. 명시적인 overflow hidden/clip 조상에 잘린 콘텐츠도 경고한다. offscreen 일반 스크롤 요소는 정상이다. 경고 선택은 원본 DOM을 스타일링하지 않고 별도 overlay rect를 그린다. 스크롤·resize 시 다시 계산한다. 렌더링되지 않은 요소는 제외하고 보고 수와 스캔 요소 수를 제한하며 제한 여부를 표시한다.

정적 문서는 스크립트 실행 없이 같은 origin DOM을 읽는다. CSP는 가장 앞선 head meta로 삽입하고, refresh meta는 제거한다. 네트워크·폼·중첩 프레임을 차단한다. 사용자 CSS나 viewport meta, env()를 변경하지 않는다. JS 기반 레이아웃이 정적 모드에서 보이지 않는다는 것을 표시한다.

## Phase 2
같은 원본을 2–4개 독립 iframe에 전달한다. 각 카드에서 프로필을 바꾸고 활성 검사 카드를 선택한다. 공통 방향·Safe Area·폰트 임계값을 적용한다. Fit 배율은 비교 행 전체가 작업 공간에 들어오는 최소 배율로 통일한다. 100% 모드는 작업 공간 스크롤을 사용한다. 결과와 overlay는 카드별 DOM에 연결하며 리로드·기기 변경 후 오래된 결과를 버린다.

## Phase 3
로컬 API가 Playwright Chromium의 새 mobile context를 생성한다. viewport, screen, deviceScaleFactor, isMobile, hasTouch, userAgent, colorScheme를 명시한다. 실제 모바일 meta viewport 처리는 원본을 top-level 문서로 렌더링해서 검증한다. 원본 viewport meta와 CSS는 보존한다. 스크린샷과 실제 innerWidth / innerHeight / DPR / touch / UA 및 동일 Inspector 결과를 반환한다. 스크린샷은 정적 결과이며 스트리밍·원격 조작 브라우저가 아니다.

브라우저는 매 검사마다 격리하고 종료한다. API는 loopback 바인딩, Host와 Origin 검증, JSON body 제한, 입력 범위 검증, 요청 동시성 제한, timeout을 사용한다. 외부 네트워크와 서버 파일 접근을 모두 route 차단한다. 선택적으로 사용자 스크립트를 실행하며 기본값은 꺼짐이다. 스크립트 켜짐에서도 새 컨텍스트·팝업·다운로드·네트워크 차단을 유지한다. 콘텐츠는 디스크에 쓰지 않는다. 이것은 신뢰할 수 없는 코드를 운영 서비스에서 실행하는 보안 경계로 사용하지 않는다.

## 완료 기록
- Phase 1: 완료. npm run check, npm test (4개), npm run test:browser 통과. CSS viewport / Fit 불변·입력·검사·격리를 Chromium에서 확인. artifacts/phase-1.png 생성.
- Phase 2: 완료. 구문·단위·브라우저 검증 통과. 독립 viewport / 공통 Fit / 카드별 QA / 2–4개 제한 / 회전 / 원본 보존 검증. artifacts/phase-2.png 생성.
- Phase 3: 의존성 승인 후 구현 및 브라우저 검증.
