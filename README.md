# Mobile Content QA Viewer

HTML·공개 웹페이지를 화면 크기별로 확인하는 로컬 검수 도구.

## 실행

필수 환경: Node.js 22.23.4 이상(22.x), 24.22.1 이상(24.x), 26.12.1 이상(26.x) 및 Playwright Chromium.
실제 허용 범위의 기준은 [server/runtime.mjs](server/runtime.mjs). package.json과 lock의 `engines: >=22`는 실제 실행 허용 범위와 차이 존재.

```sh
npm ci
npx playwright install chromium
npm start
```

기본 주소: [작업 공간](http://127.0.0.1:4173). 공개 서버와 구분. 포트 변경은 해당 실행 프로세스의 QA_PORT 지정.

```powershell
$env:QA_PORT = '4174'
npm start
```

## 사용

1. HTML 파일·코드·공개 HTTPS URL 열기. 스크립트 기반 화면은 입력창에서 JavaScript 실행 선택.
2. 기기 또는 직접 입력으로 화면 크기 선택.
3. 본 화면에서 콘텐츠·경고 확인. 필요한 경우 비교·회전·화면 설정·결과 저장 사용.

도구 모음의 폭에 따른 글자·간격·입력 크기 축소와 한 줄 유지. 좁은 화면의 가로 이동 지원.
자동 맞춤은 기기 간 공통 배율, 비교는 행 전체 기준 배율 사용. 100%는 선택한 CSS 크기 확인용.
노치·접힘선·안전 영역은 Safe Area 선택 시만 표시하는 참고 그림.

## 보기와 클릭

| 동작 | 현재 처리 |
| --- | --- |
| 기본 HTML | 스크립트 없는 Blob iframe·DOM 검사·원본 doctype 유지 |
| URL·JavaScript HTML·화면 설정 적용 | 격리된 Chromium의 전체 페이지 이미지와 검사 결과 |
| 스크롤 | 이미지 안의 휠·드래그·키보드 이동 |
| 다른 페이지 링크 | 선택한 공개 HTTPS 주소를 기존 읽기 경로로 열기 |
| 버튼·같은 페이지 링크 | 실제 DOM에서 순서대로 클릭한 후 결과 갱신·마우스/키보드 지원 |
| 화면 설정 | DPR·밝은/어두운 테마 적용 |
| 저장 | 선택 카드의 PNG·WebP·검사 결과 JSON 저장·추가 검사 요청 없음 |

보이는 클릭 대상 최대 500개·같은 페이지 연속 동작 최대 8회. 다시 렌더링으로 클릭 이력과 결과 초기화.
클릭마다 새 문서에서 처리하므로 로딩 지연·동적 페이지의 재현 차이 가능.
입력값 타이핑·로그인·폼 전송·원격 다운로드·팝업·실시간 브라우저 스트리밍 미지원.
JavaScript 기본 OFF. 스크립트 기반 버튼은 실행 선택 필요. 정적 HTML의 외부 링크·통신 차단 유지.

## 기기와 검사

설치된 [Playwright 기기 정의](https://playwright.dev/docs/emulation#devices)의 모델명·screen 또는 viewport의 CSS 크기·DPR·참조 UA 사용.
iPhone 17·17 Pro·17 Pro Max·Air, Galaxy Z Fold 7·Cover·Flip 7, Pixel 10·10 Pro·10 Pro XL 및 기존 모델 제공.
직접 입력 범위 240–2048 CSS px. 실제 하드웨어·Safari·시스템 바·키보드 재현과 구분.
추가 모델의 Safe Area 참고값 미제공. Galaxy S26의 확인된 CSS 크기 자료 미확보로 목록 제외.

검사 항목: 가로 넘침·작은 글자·화면 밖 고정 요소·콘텐츠 잘림·깨진 내부 링크·이미지 실패·media query.
작은 글자는 설정 임계값 경고이며 웹 표준 위반 판정과 구분. 요소 강조는 기본 HTML 보기에서 제공.

## 데이터와 제한

- 원본 HTML·초안·최근 결과는 메모리에만 보관. 자동 저장·브라우저 저장소 사용 없음.
- 최근 결과 최대 8개 재사용. 새 콘텐츠·다시 렌더링에서 폐기. 주소·기기·설정·클릭 이력으로 결과 구분.
- HTML 최대 2MB·API JSON 최대 3MB. 사용자 저장 파일과 자동 저장 구분.
- URL은 인증 정보 없는 공개 HTTPS·기본 포트·공개 IPv4의 GET만 지원.
- 매 요청의 DNS 검증·공개 IPv4 고정 연결·Cookie/Authorization 전달 차단.
- 작업당 60요청·동시 4연결·리소스 4MB·합계 32MB·검사 20초 제한.
- 로컬 세션·Host/Origin 검증·동시 검사 1개·분당 20회 제한.
- 정적 iframe의 sandbox=allow-same-origin 및 격리 브라우저의 폼·팝업·다운로드·서비스 워커 차단.

공개 서비스 인증·DB·운영 모니터링·공개 SEO 구성 없음. 로컬 세션을 운영 인증으로 간주하지 않음.

## 디렉토리

| 위치 | 역할 |
| --- | --- |
| public/ | 화면·기기 정의·검사기·미리보기 보안·URL 검증 |
| server/ | 로컬 서버·입력 검증·Chromium·공개 리소스 요청·런타임 검사 |
| examples/responsive-form.html | 외부 통신 없는 검수용 단일 HTML |
| tests/ | 입력·서버·브라우저·보안 검사 코드 |
| docs/Design.md | 현재 호출 관계와 렌더링·격리 설계 |
| PLAN.md | 완료 범위·검증 결과·남은 제약 |

예제 참고: [Effective HTML](https://github.com/plannotator/effective-html), [Android Skills](https://github.com/android/skills). 웹 검수 관점만 적용하며 Android SDK·Compose·Gradle 의존성 없음.

## 확인 결과

기준일: 2026-11-02. 실행한 항목과 미실행 항목 구분.

| 확인 | 결과 |
| --- | --- |
| 설치된 Chrome | 공개 GitHub Issues 링크 이동·ktwiz 화면 모드 버튼 클릭 통과 |
| 실제 로컬 앱·프로젝트 HTML | 마우스 펼치기·키보드 닫기·내부 링크·드래그 구분 통과 |
| npm run check | 구문 검사 통과 |
| node --test tests/emulation-config.test.mjs | 실제 설정 검증 함수 3개 통과 |
| npm run test:secrets | 추적 파일·스테이징·이력의 인식 시크릿 발견 0건 |
| 전체 단위·모의 브라우저 검사 | 이번 작업에서 미실행 |
| 이전 스크롤 작업의 보조 표시 최종 확인 | 대기 시점 문제로 중단·미완료 기록 유지 |

공개 사이트 클릭 결과 갱신 단회 약 1.7초. 모든 사이트의 시간·동작 보장 제외.
Git 제외 경로 artifacts/의 click-local-app.png·click-github-link.png·click-live-button.png에 확인 화면 보관.
이전 LCP·CLS·heap 수치를 현재 성능으로 재사용하지 않음. [추가 진단 기록](docs/chrome-devtools.md) 참조.

[설계](docs/Design.md) · [작업 상태](PLAN.md) · [작업·배포 점검 기준](AGENTS.md)
