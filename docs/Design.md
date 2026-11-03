# QA Viewer 현재 설계

기준일: 2026-11-03. 사용자가 선택한 정적 HTML 전용 구성.

## 호출 관계

- public/app.js: HTML·초안·기기·카드·검수 결과 관리와 JSON 저장.
- public/profiles.js: CSS 크기·회전·기기 선택 항목.
- public/inspector.js: 레이아웃·현재 HTML의 SEO 검사.
- public/security.js: iframe 문서의 CSP 삽입과 refresh meta 제거.
- server/server.mjs: loopback 정적 파일 서버·Host 검증·허용 목록.
- server/runtime.mjs: 지원 Node.js 버전 검사.

흐름: HTML 파일/코드 → 격리 Blob iframe → DOM 검사 → 화면 표시/JSON 저장.
서버는 HTML을 업로드받거나 원격 URL을 요청하지 않는다. 렌더링 API·브라우저 자동화·외부 의존성은 없다.

## 미리보기와 검사

iframe은 sandbox=allow-same-origin만 사용한다. allow-scripts는 추가하지 않는다. 원본 doctype·CSS·viewport meta를 보존하며 refresh meta를 제거한다.
CSP로 JavaScript·외부 CSS/이미지/폰트/통신·중첩 프레임·폼 전송을 차단한다. 인라인 CSS와 허용된 data/blob 리소스를 사용한다. 외부 링크 이동은 차단하며 내부 링크와 details 등 기본 HTML 동작은 제공한다.
선택 크기는 iframe의 CSS px다. Fit과 하단 확대는 바깥 래퍼 transform만 변경한다. 2–4개 비교와 공통 배율, 패널 너비 조절을 제공한다.
미리보기는 현재 데스크톱 브라우저다. DPR·touch·모바일 Safari·키보드·실물 하드웨어를 재현하지 않는다. Safe Area·노치·접힘선은 참고 그림이다.

검사 좌표는 Float64Array 네 개, 부모 인덱스/자르기 상태는 Uint16Array로 처리한다. 하위 14비트는 부모 인덱스+1, 상위 2비트는 가로/세로 자르기 여부다. 최대 10,000요소·250경고이며 잘림 중복은 비트셋으로 표시한다.
SEO 9항목은 현재 DOM의 제목·description·canonical·robots meta·제목 구조·alt·공유 정보·JSON-LD 문법·언어를 읽는다. 사이트 전체 수집·검색 적격성·순위·AI 노출은 판정하지 않는다.
경고와 elements 배열의 index는 같은 DOM 순서다. 선택 경고의 실제 요소를 강조한다. JSON 저장에서는 DOM 참조를 제외한다.

## 상태와 저장

원본·초안·현재 결과만 메모리에 보관한다. 브라우저 저장소·서버 파일로 자동 저장하거나 결과 캐시를 추가하지 않는다.
검사 결과 JSON은 브라우저에서 Blob으로 만들며 사용자가 저장 버튼을 누를 때만 내려받는다. PNG/WebP 촬영·이미지 클릭 재생 기능은 제거했다.

## 실행과 서버

권장 Node.js는 24.22.1 이상(24.x). 실제 허용 범위는 22.23.4+/24.22.1+/26.12.1+의 해당 메이저이며 runtime.mjs가 검사한다.
package.json/lock의 engines >=22 표기는 실제 실행 허용 범위보다 넓다. 이 기존 차이는 유지한다.
기본 주소는 http://127.0.0.1:4173 이다. 포트 변경은 해당 프로세스에 QA_PORT를 지정한다.

```powershell
$env:QA_PORT = '4174'
npm start
```

정적 허용 목록·GET/HEAD·Host 검증·CSP·no-store·404 복귀 링크를 유지한다. /api/status와 /api/emulate는 제거했고 세션 쿠키도 만들지 않는다.
HTML 입력은 클라이언트에서 최대 2MB로 제한한다. DB·운영 인증·운영 모니터링·공개 배포 설정은 없다.

## 직접 확인

설치된 Chrome 156.0.8078.80을 Playwright 없이 직접 실행했다. --no-sandbox 없이 로컬 앱의 비교·확대/viewport 유지·SEO 9항목·JSON 저장·예제의 스크립트 차단·기본 details 클릭을 확인했다.
서버/기기/런타임 검사 7개·구문 검사·의존성 감사 0건을 확인했다. 프로젝트 패키지 의존성은 0개다. 시스템 브라우저의 취약점이 없어졌다는 보장과는 구분한다.

[사용법](../README.md) · [작업 상태](../PLAN.md) · [크기 기준](devices.md)
