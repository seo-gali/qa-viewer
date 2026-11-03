# QA Viewer 현재 설계

기준일: 2026-11-03. 현재 코드의 호출 관계와 동작 기준.

## 파일과 호출

- public/app.js: 원본·주소·기기·설정·카드별 클릭/주소·결과 상태 관리와 본 화면 표시.
- public/emulation-ui.js: capture 요청·화면 설정·현재 결과 PNG/WebP/JSON 저장.
- public/profiles.js: 모델 CSS 크기·DPR·UA 참조와 크기·회전 검증. profileChoices에서 같은 브랜드/가로/세로의 선택 항목 통합. 원래 API ID 유지.
- public/inspector.js: 정적 DOM과 Chromium에서 공유하는 레이아웃·현재 문서 SEO 검사.
- public/security.js / public/public-url.js: HTML 격리 문서와 공개 HTTPS URL 검증.
- server/server.mjs: 명시적 정적 파일 제공·로컬 세션·Host/Origin·제한을 거치는 API.
- server/emulation-config.mjs → emulator.mjs → public-resource.mjs: 입력 검증·격리 실행·공개 리소스 읽기.
- server/runtime.mjs: 허용한 Node.js 릴리스 하한 검사.

흐름: 입력 → app.js → 기본 HTML iframe 또는 capture → 로컬 API → 검증 → 격리 Chromium → 이미지/검사/클릭 대상 → 본 화면.

## 렌더링

기본 HTML은 sandbox=allow-same-origin인 Blob iframe이다. allow-scripts를 함께 추가하지 않는다. 원본 doctype·quirks mode·CSS·viewport meta를 유지하고 CSP 삽입·refresh meta 제거·외부 링크 차단을 적용한다. DOM 검사와 경고 overlay를 제공한다.
URL·JavaScript HTML·화면 설정 적용은 새 Chromium mobile context에서 원본을 최상위 문서로 렌더링한다. viewport·screen·DPR·touch·참조 UA·테마를 설정한다. iPhone UA 참조도 실제 엔진은 Chromium이며 Safari 재현이 아니다.
DOMContentLoaded 후 진행 중인 URL GET에 최대 3초, 폰트에 최대 500ms, 마지막 렌더링에 200ms 대기한다. 전체 페이지 PNG·실제 이미지 크기·runtime·공유 Inspector 보고서를 반환하고 브라우저를 종료한다. 완전한 비동기 로딩은 보장하지 않는다.
iframe과 이미지 스크롤 영역은 선택한 CSS 크기다. Fit은 바깥 device 래퍼 transform만 바꾸며 콘텐츠 zoom·meta·env 치환은 하지 않는다. 단일 기기는 등록 모델의 최대 크기를 기준으로 공통 배율, 비교는 행 전체 기준 배율을 사용한다. 임시 스크롤바가 배율에 영향을 주지 않도록 canvas offset 크기를 사용한다.
노치·접힘선·Safe Area는 선택 시만 표시하는 참고 그림이다. 확인되지 않은 시스템 영역을 하드웨어 사양으로 주장하지 않는다.
Playwright 정의가 없는 최신 모델은 제조사 발표 비율과 선택한 DPR로 만든 검수 기준이며 실측 브라우저 기본값이 아니다. [출처와 계산](devices.md)을 별도로 기록한다. Google 모델은 제거했다.
하단 −/+는 현재 배율에 0.1을 더하거나 빼며 10–200%로 제한한다. viewport나 이미지 자체 크기를 바꾸거나 재촬영하지 않는다. 패널 경계는 마우스 드래그·좌우 방향키로 전체 폭의 20–70% 사이를 조절하며 760px 이하는 세로 배치를 사용한다.

## 스크롤과 클릭

이미지를 원래 픽셀 크기로 preview-scroll 안에 배치한다. 휠·키보드·터치 이동은 브라우저 동작, 마우스 드래그는 transform 배율을 반영한 scroll 변경이다. 파일 없는 drop은 업로드로 처리하지 않는다.
이미지 뷰어의 기본 스크롤바는 폭을 차지하지 않도록 숨기고, 이미지 밖 클릭 영역은 자른다. 원본에서 실제 넘침이 있으면 이미지 폭과 스크롤을 보존한다.
보이는 링크·버튼·summary·버튼형 input의 위치와 CSS 선택자를 최대 500개 반환한다. 가려진 요소 제외 후 개수를 제한한다. 원격 HTML을 호스트에 삽입하지 않고 이미지 위에 aria-label이 있는 버튼을 배치한다.
5px 미만 포인터 이동은 클릭, 드래그는 이동으로 구분한다. Enter/Space도 같은 클릭 경로다.
다른 페이지의 공개 HTTPS 링크는 기존 URL 검증·읽기 경로로 연다. 같은 페이지 동작은 최대 8개 CSS 선택자를 새 컨텍스트에서 차례로 클릭한 뒤 결과를 갱신한다. 클릭 입력의 배열·문자열·개수·길이를 검증한다.
카드별 주소·클릭 이력을 유지하며 콘텐츠·기기/방향·다시 렌더링에서 초기화한다. 결과의 scroll 위치로 클릭한 구간을 표시한다. 실패 시 마지막 클릭을 되돌리고 다시 렌더링으로 복구한다.
새 창 링크는 같은 보기로 처리하며 스크립트 팝업·다운로드는 차단한다. 입력값 타이핑·인증·폼 전송·실시간 스트리밍은 구현하지 않았다. 동적 DOM에서는 재생한 선택자가 달라질 수 있다.

## 검사 결과

레이아웃 경고는 실제 문서 가로 넘침이 있을 때만 요소별 넘침을 기록한다. 첫 화면의 잘림 경고는 컨테이너별로 중복 제거한다. 리소스 차단은 개수와 첫 원인으로 한 줄 요약하며 촬영 후 정리 과정의 자체 취소는 제외한다. 제한을 완화하거나 차단된 리소스를 로드 완료로 처리하지 않는다.
SEO는 기존 inspectDocument의 반환값에 9개 항목을 더한다. 제목·description·canonical·robots/googlebot meta·제목 단계·alt 누락·Open Graph·JSON-LD 문법·문서 언어를 DOM에서 읽는다. JSON.parse만 사용하며 구조화 데이터의 검색 적격성은 판정하지 않는다. robots meta 미지정이 실제 색인 허용을 보장하지 않는다.
app.js의 레이아웃/SEO 버튼은 이미 있는 보고서만 표시하며 추가 네트워크 요청 없이 기존 결과 JSON에도 포함된다. 사이트 전체 수집·점수·GEO/AEO 평가·문서 보고서 생성은 구현하지 않았다.

## 상태와 저장

원본 HTML·미적용 코드/URL 초안은 메모리에만 보관한다. 입력창 닫기·검증 실패에서 유지하고 새 콘텐츠 적용·페이지 새로고침에서 초기화한다. 브라우저 저장소나 서버 파일로 자동 저장하지 않는다.
완료 결과 최대 8개를 메모리 Map에 보관한다. 키는 주소·기기·방향·DPR·테마·검수 설정·클릭 이력이며 HTML을 키에 복제하지 않는다. 새 콘텐츠·다시 렌더링에서 폐기한다.
generation으로 이전 결과를 버리고 API 동시 작업 1개에 맞춰 순차 처리한다. 진행 중인 요청은 완료를 기다리며 오래된 후속 요청은 생략한다.
저장은 선택한 카드의 현재 결과를 사용한다. JSON은 이미지 제외 보고서, WebP는 브라우저 Canvas 85% 품질 변환이다. 사용자 저장과 업로드 자동 저장은 구분한다.

## 경계와 제한

| 경계 | 현재 코드 |
| --- | --- |
| 실행 버전 | Node.js 22.23.4+/24.22.1+/26.12.1+의 해당 메이저 |
| 정적 파일 | public 명시적 허용 목록·나머지는 복귀 링크가 있는 404 |
| 로컬 API | 127.0.0.1·Host/Origin·JSON·HttpOnly/SameSite=Strict 세션·분당 20회·동시 1개 |
| 입력 | HTML 2MB·JSON 3MB·240–2048 CSS px·DPR 1–4·클릭 8개/선택자 2048자 |
| 원격 | 공개 HTTPS GET·매 요청 공개 IPv4 DNS 검증/고정 연결·Cookie/Authorization 미전달 |
| 자원 | 작업당 60요청·동시 4연결·리소스 4MB·합계 32MB·총 20초 |
| 브라우저 | 새 컨텍스트·HTML 외부 통신·서비스 워커/폼/팝업/다운로드 차단 |

로컬 세션은 운영 인증이 아니다. DB·영구 저장·API 키·계정·운영 모니터링은 없다. HTTP loopback 쿠키에 Secure/HSTS를 적용한 것으로 설명하지 않는다. 사용자 오류는 내부 stack/path와 구분하고 화면 텍스트는 textContent로 표시한다.

## 현재 확인

2026-11-02 실제 앱·프로젝트 HTML의 마우스 펼치기·키보드 닫기·내부 링크·드래그 구분을 확인했다. 모의 원격 API는 사용하지 않았다.
설치된 Chrome에서 공개 GitHub Issues 이동과 ktwiz 화면 모드 버튼을 확인했다. ktwiz POST 1건은 기존대로 차단됐다. 초기 승인 검토 사용량 제한은 해소 후 같은 승인 경로로 재시도했으며 우회하지 않았다.
구문·실제 설정 검증 3개·시크릿 검사 통과. 전체 단위·모의 브라우저 검사는 이번 작업에서 미실행. 이전 스크롤 작업의 마지막 보조 표시 확인은 별도 미완료로 유지한다.
2026-11-03 실제 Chrome에서 크기별 목록·확대/viewport 유지·패널 드래그/키보드·SEO 9항목을 확인했다. 제공한 나무위키 주소의 실제 제목과 402px 이미지/표시/스크롤 폭 일치를 확인했다. 두 번 확인에서 약 1.9–2.8초·차단 10–12건의 요약 1줄·레이아웃 경고 57–59개였다. 기기/설정 함수 검증 8개·구문·시크릿 검사도 통과했다.
사용법: [README.md](../README.md). 남은 범위: [PLAN.md](../PLAN.md). 추가 진단: [chrome-devtools.md](chrome-devtools.md).
