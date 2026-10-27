# QA Viewer 작업 계획

기준일: 2026-10-27. 디렉토리 정리·HTML 지침·UX 개선에 이어 URL 자동 검사·붙여넣기 JS 선택·모델별 프로필·도구 모음 수정 및 전체 회귀 검증 완료.

## 이번 적용 범위

디자이너의 HTML 검수를 돕는 제작 지침·예제·브라우저 검증 흐름 적용과 디렉토리 정리. 기존 렌더링 계약·웹 주소·파일 제공 허용 목록·네트워크 격리 유지. 의존성 추가·lock 파일 변경·Brotli 기능 변경 제외.

## 디렉토리 정리

- [x] 브라우저 코드·HTML·CSS·파비콘의 `public/` 이동.
- [x] HTTP 서버·Chromium 검사·입력 검증·원격 요청 코드의 `server/` 이동.
- [x] `Design.md`의 `docs/Design.md` 이동.
- [x] npm 명령·서버 파일 읽기·공용 모듈·테스트 import 경로 수정.
- [x] 기존 `/app.js` 등 웹 경로 유지 및 새 디렉토리·문서·예제의 HTTP 접근 차단 검사 추가.

## HTML 제작 지침 적용

- [x] [Effective HTML](https://github.com/plannotator/effective-html)의 단일 HTML·반응형·접근성·실제 상태·브라우저 검증 원칙 반영.
- [x] `examples/responsive-form.html` 작성: 빈 입력·오류·완료·내용 수정·긴 한국어 문구·Light/Dark.
- [x] 외부 CDN·API 없이 인라인 CSS·JavaScript 및 시스템 폰트 사용.
- [x] 스크립트 차단 시 정적 검수 안내 및 입력 비활성 처리.
- [x] 실제 전송·저장 없이 현재 화면에서만 입력 내용 확인.
- [x] [Android Skills](https://github.com/android/skills)의 화면 크기·가로 방향·테마·상태별 검사 관점 반영.
- [x] README·AGENTS에 재사용 절차와 정적 미리보기/Chromium 스냅샷/동작 테스트의 구분 기록.

구조가 정해지지 않은 화면은 `html-wireframe` 참고, 클릭 흐름과 상태가 필요한 예제는 `html-prototype` 참고. 전역 스킬 설치 없이 공개 지침을 참조하는 방식. Compose·Gradle·Android SDK 도입 제외. 실제 Android 시스템 바·키보드·기기 동작은 별도 검증 대상.

## 구조 정리·UX 작업 검증 (7be2806)

- [x] `node tests/artifact-browser.mjs`: 375·390·768·1440 CSS px 및 844 × 390 가로 방향, Light/Dark, 빈 입력·공백 이름·잘못된 이메일·오류 수정·완료·재수정, Tab/Shift+Tab/Enter/Space/방향키, 포커스 이동, 긴 문구, 외부 요청 0건, 실제 파일 업로드, 정적 스크립트 차단, Chromium JS OFF/ON 스냅샷 통과.
- [x] `npm run check`: 종료 코드 0.
- [x] `npm test`: 11개 통과, 종료 코드 0.
- [x] `npm run test:browser`: 기존 검사와 신규 HTML 예제 검사 통과, 종료 코드 0.
- [x] `npm run test:url`: 공개 example.com·390px·DPR 3·1개 리소스 통과. 샌드박스의 EACCES 이후 제한 밖 재실행, 종료 코드 0.
- [x] `npm run test:secrets`: 새 파일을 포함한 Git 인덱스와 이력 검사, 시크릿 파일·알려진 키 패턴 0건.
- [x] `node tests/mobile-browser.mjs`: 모바일 도구 모음·오류 포커스 변경 재검증, 종료 코드 0. 이후 더보기·모바일 메뉴 제거는 아래 2026-10-27 기록 참조.
- [x] `npm start`: 이동한 진입점과 기존 웹 경로의 HTTP 200 확인, 임시 서버 종료.
- [x] 로컬 문서 링크 13개 확인 및 모바일·데스크톱·Light/Dark 화면 캡처 확인.
- [x] README·설계 문서 최종 결과 기록 및 `7be2806` 로컬 커밋 완료.

## UX·작업 지침 추가

- [x] 수정 전 호출 관계·의존성·영향 파일 확인과 최소 변경 원칙의 AGENTS 반영.
- [x] UX·DX·AX, 직접적인 문구, 주요 버튼·입력 검증·오류 복구·데이터 보관 원칙 반영. 더보기 배치는 후속 요청에 따라 제거.
- [x] 앱 태그라인·중복 도움말·보조 레이블 제거, 지원 범위·검수 한계의 접이식 제공 및 모바일 주요 버튼 상시 표시.
- [x] 기본 샘플의 홍보 문구 제거와 검수 목록 제공.
- [x] 예제 폼의 blur/제출 검증, 입력 타입, 오류 포커스·스크롤, 입력 내용 유지 적용.
- [x] URL·HTML·DPR 오류 필드 연결과 숫자 키패드·결과 이미지 크기 지정.
- [x] 기존 원본 메모리 보관·업로드 크기 제한·네트워크 정책 유지.
- [x] 배포 전 10개 점검 항목의 AGENTS 반영.

금액·비밀번호·페이지네이션·대용량 업로드는 현재 제품 기능에 없으므로 새 기능 추가 제외. 숫자 애니메이션·임시 저장·prefetch의 일괄 적용 제외. 사용자 HTML의 변경·자동 저장 제외.

## 배포 전 확인 기록

현재 로컬 검수 도구의 기록이며 프로덕션 배포 승인 또는 준비 완료 판정이 아님.

| 항목 | 현재 확인 및 남은 작업 |
| --- | --- |
| 환경 변수·시크릿 | `QA_PORT` 포트 설정, 키·비밀번호 미사용, Git 시크릿 검사. 운영 설정 제공 경로는 미정 |
| 오류 처리 | API·UI의 오류·취소·시간 초과·복구 회귀 검사. 운영 알림 체계 미구축 |
| 입력 검증 | 크기·허용 필드·값 범위·공개 HTTPS·DNS/IP 검증 유지 |
| 인증·권한 | loopback 세션·Host/Origin 검증. 운영 다중 사용자 인증 미구축 |
| DB 마이그레이션 | DB 미사용으로 해당 없음 |
| 로그·모니터링 | 로컬 도구 범위. 운영 로그 수집·모니터링 미구축 |
| 단위·통합 테스트 | 위 실행 결과와 README에 기록. 운영 환경 검증은 별도 |
| API 속도 제한 | 분당 20회·동시 검사 1개·20초 및 리소스 제한 유지 |
| 성능·보안 | v24.22.1 로컬 검증, sandbox·CSP·격리 및 런타임 하한 검사 적용. 로컬 LCP·CLS·heap 단회 측정, 운영 부하 시험 미완료 |
| 롤백 계획 | 현재 보완 전 기준 `7be2806`, 구조 정리 전 기준 `8729301`. 해당 수정 커밋의 revert 후 필수 검사와 `npm start` 재확인. 배포·데이터 변경 없음 |

## 후속 항목

- `package.json`·lock의 engines 메타데이터 정합화: 기존 `>=22` 유지. lock 변경은 사전 승인 대상. 서버·공개 리소스 모듈은 22.23.4+/24.22.1+/26.12.1+의 지원 메이저만 실행 허용. 기존 실행 프로세스와 외부 배포 환경은 미확인.
- Phase 4: 실제 기기 QR 미리보기. 현재 loopback 바인딩과 접근 제어를 전제로 별도 설계 필요.
- 실제 Android 시스템 영역·소프트 키보드·기기 브라우저 검증. CSS viewport 검사 결과와 구분.
- Chrome DevTools MCP 1.12.0 설치·연결·Lighthouse·trace·반복 메모리 분석: [승인 검토안](docs/chrome-devtools.md). 기존 Playwright의 로컬 1회 측정과 구분.
- 공개 SEO 대상·도메인·Search Console 소유권 확인. 현재 loopback 전용 도구의 임의 공개 또는 사용자 HTML의 색인 제외. sitemap·robots·SSR 적용은 공개 페이지 범위 확정 후 별도 작업.

## 미완료 항목 보완

- [x] 코드·URL 입력창의 초안 메모리 보존, 빈 초안·검증 오류 후 재개.
- [x] 새 콘텐츠 적용·새로고침 시 초안 초기화 및 저장소 미사용 회귀 검사.
- [x] 시크릿 검사에 `git grep --cached` 추가. 인덱스 단독·작업 트리 단독 탐지 및 값 비노출 회귀 검사.
- [x] 서버·공개 리소스 모듈 초기화 시 Node.js 지원 버전 검사 및 경계값 검증.
- [x] 새 지침의 추측적 복잡성 도입 전 설명·동의 및 문서/코드 상충 보고 원칙 반영.
- [x] Playwright CDP로 LCP·CLS·heap 로컬 기준 측정, 수치와 한계 기록.
- [x] `npm run check`·`npm test` (14개)·`npm run test:browser`·`npm run test:url`·`npm run test:secrets` 종료 코드 0 확인.
- [x] 서버·공개 리소스 진입점에서 모의 24.22.0 차단, 실제 v24.22.1 서버 HTTP 200 확인. 구버전 실제 바이너리 설치·검증은 미실시.
- [x] 추가 문서를 포함한 로컬 링크 15개 확인 및 최종 결과 기록.

확인한 상충과 처리: 문서는 인덱스 검사 완료로 기록했지만 기존 코드는 작업 트리·이력만 검사하던 차이를 같은 Git 호출 방식의 `--cached` 검사로 보완. 커밋 준비로 남아 있던 기록은 실제 `7be2806` 완료로 수정. 기존 engines 메타데이터와 실제 런타임 허용 범위 차이는 위 후속 항목에 명시.

승인 검토용 메타데이터 변경 범위: `package.json`의 engines.node와 `package-lock.json`의 packages[""].engines.node를 모두 `^22.23.4 || ^24.22.1 || ^26.12.1`로 정합화. 의존성 목록·패키지 버전·설치 결과 변경 없음. 현재 두 필드는 변경하지 않았으며, lock 파일 갱신에 대한 사전 승인 후 적용 대상.

SEO 읽기 점검 결과: 초기 UI는 정적 HTML, 검수 영역은 클라이언트 생성. 앱 응답에 noindex meta/X-Robots-Tag 없음. `/robots.txt`·`/sitemap.xml`은 404. 검사한 내부 링크·자산 5개는 200이며 없는 페이지는 404와 복귀 링크 제공. Search Console·공개 도메인은 미확인. 정적 초기 HTML 응답을 SSR 구현 완료로 기록하지 않음.

기존 Phase 1–3 완료 내용과 렌더링·보안 계약: [docs/Design.md](docs/Design.md). 실행·사용 안내: [README.md](README.md).

## 2026-10-27 URL·붙여넣기·기기·도구 모음 수정

- [x] 호출 관계 확인: app.js → emulation-ui.js의 공유 capture → 기존 `/api/emulate` → emulator.mjs / public-resource.mjs. profiles.js는 화면과 서버가 함께 사용하며 테스트·문서까지 수정 범위 확정.
- [x] 별도 상단 헤더·모바일 도구 메뉴·설정 더보기 제거. 로고를 HTML 열기 왼쪽으로 이동하고 설정 상시 표시.
- [x] URL iframe 대신 기존 격리 Chromium 스냅샷·DOM 검사 결과를 본 화면에 자동 표시. URL fragment 보존, 순차 비교·이전 결과 폐기·실패 후 재시도 제공.
- [x] URL·코드 붙여넣기의 JavaScript 실행 선택 제공. 기본 OFF, HTML 외부 통신 차단·정적 iframe sandbox 유지. 사용자 원본·초안의 메모리 보관 유지.
- [x] 스크립트 기반 URL의 비동기 GET 완료를 최대 3초 범위에서 대기. 전체 검사 20초 제한 유지. POST 차단과 60개 제한의 오류 구분.
- [x] 모델명·CSS 크기·DPR·UA 참조를 설치된 Playwright 정의와 정합화. Fold 6 928 × 1080, Cover 484 × 1188, S24 360 × 780. Generic 목록의 UI 제거와 직접 입력 유지.
- [x] 단위 15개·구문 검사 통과. 브라우저의 frame-denied URL·구간 보존·지연 GET·POST 차단·JS opt-in·기기 전환·비교·실패/재시도·DOCTYPE HTML·정적 격리 검사 추가.
- [x] 실제 두 URL의 수정된 UI 표시 확인: hourboard HTTP 200·4 GET·차단 0·약 1.5초, ktwiz HTTP 200·30 GET·POST 차단 1·약 2.5초. iPhone 13 390 × 844, JavaScript ON. ktwiz의 현재 HTML에 boardSec ID 없음 확인. 임의 앵커 생성이나 사이트 변경 없음.
- [x] example.com `npm run test:url` 통과, 종료 코드 0. `npm run test:secrets` 인식 시크릿 0건. 의존성·lock·전역 MCP 변경 없음.
- [x] 최종 `npm run check`·`npm test` (15개)·`npm run test:browser` (5개 브라우저 검사)·`npm run test:url`·`npm run test:secrets` 및 `git diff --check` 종료 코드 0 확인.

확인한 상충과 처리: 기존 AGENTS/README/설계의 설정 더보기·모바일 메뉴 배치는 최신 사용자 요청에 따라 도구 모음으로 수정. URL 직접 iframe·DOM 미검사 문서는 기존 Chromium API를 재사용한 현재 동작으로 수정. Generic 중심 목록·그룹별 공통 UA 설명은 모델별 크기·DPR·UA와 직접 입력 기준으로 수정. 실제 기기·Safari 재현 및 보안 경계는 유지.

미검증·제약: 사용자가 붙여넣은 전체 원본 미제공으로 동일 코드 재현 제외. 완전한 DOCTYPE 문서·인라인 JS·외부 요청 차단은 회귀 검사. URL은 조작 가능한 브라우저가 아닌 정적 스냅샷이며 로그인·POST·긴 비동기 로딩·실제 모바일 브라우저 보장 제외. 진행 중인 이전 검사는 완료까지 대기하며 분당 20회 제한 유지.
