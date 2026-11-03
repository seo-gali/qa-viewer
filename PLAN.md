# QA Viewer 작업 상태

기준일: 2026-11-03. 정적 HTML 전용으로 변경.

## 완료

- Playwright·playwright-core 패키지와 lock 항목 제거. 외부 패키지 의존성 0개.
- URL 열기·JavaScript 실행·이미지 촬영·클릭 재생·DPR/테마 설정 제거.
- 원격 리소스 요청 코드·렌더링 API·API 세션/요청 제한 코드 제거.
- 해당 기능에만 필요한 UI·스타일·Playwright 브라우저 검사·URL 검사 삭제.
- HTML 파일/코드·기기 크기·2–4개 비교·회전·확대·패널 조절 유지.
- 스크립트 차단 iframe·CSP·Host 검증·정적 허용 목록 유지.
- 레이아웃·SEO 검사·경고 강조·클라이언트 JSON 저장 유지.
- README·설계·기기 기록·작업 지침과 실제 화면 캡처 정합화.

## 직접 확인

| 항목 | 결과 |
| --- | --- |
| npm run check | 통과 |
| node --test tests/profiles.test.mjs tests/runtime.test.mjs tests/server.test.mjs | 7개 통과 |
| npm audit | 취약점 0건 |
| npm ls --all | 의존성 없음 |
| 실제 설치 Chrome 156.0.8078.80 | 비교·확대 중 viewport 유지·SEO 9항목·JSON 저장·기본 HTML 클릭 통과 |
| 실제 프로젝트 HTML | script 미실행·fieldset 비활성 유지·details 열기 통과 |
| 제거된 기능 | URL/실행 설정 버튼 없음·렌더링 API GET 404/POST 405 |
| 문서 화면 | 정적 앱의 비교/SEO 화면으로 교체 |

검증은 새 Chromium을 내려받지 않고 설치된 패치 Chrome과 Node.js 기본 기능으로 수행했다. 기존 모의 브라우저 검사 결과를 현재 통과로 재사용하지 않는다.
실제 확인 코드/출력은 Git 제외 artifacts/static-browser-check.mjs·static-browser-check.log에 보관한다.
이전 캐시/원격 촬영 성능 측정과 동적 클릭 통과 기록은 이전 구현의 결과이며 현재 기능 설명에서 제외했다.

## 남은 범위

- 외부 CSS·JS·이미지가 필요한 HTML은 해당 리소스 없이 표시.
- JavaScript 상태 전환·로그인·폼 전송·원격 URL·이미지 촬영 미지원.
- 데스크톱 iframe의 CSS 크기 확인이며 모바일 브라우저/DPR/하드웨어 재현 미지원.
- 최신 프로필 일부는 제조사 비율 참고값. Safe Area·공식 자료 간 차이는 docs/devices.md에 기록.
- engines >=22 메타데이터와 실제 런타임 하한 차이 유지.
- 브라우저 엔진의 취약점은 iframe/CSP만으로 제거되지 않음. 최신 사용자 브라우저 필요.
- 운영 인증·DB·모니터링·공개 배포 구성 없음.

## 문서 상충 처리

- URL·Chromium 스냅샷·스크립트 실행·PNG/WebP·DPR/테마·자동화 설명 제거.
- Playwright 기기 정의는 설치 의존성이 아닌 기존 참고값 출처로 정정.
- API 세션·DNS·원격 리소스 제한·Playwright 검사 명령은 제거된 구성으로 정리.
- README의 화면 캡처를 현재 정적 도구 모음과 JSON 저장 버튼으로 갱신.

컴퓨터별 캐시/MCP/Electron 조사 결과는 개인 설치 경로가 포함되어 artifacts/의 별도 보고서에만 보관하며 저장소에 포함하지 않는다.
[사용법](README.md) · [설계](docs/Design.md)
