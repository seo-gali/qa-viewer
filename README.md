# Mobile Content QA Viewer

HTML·공개 웹페이지를 화면 크기별로 확인하는 로컬 검수 도구.

![iPhone·Galaxy 비교 화면](docs/screenshots/overview.png)

## 실행

Node.js 24.22.1 이상(24.x) 권장. [전체 지원 버전](docs/Design.md#경계와-제한).

```sh
npm ci
npx playwright install chromium
npm start
```

실행 주소: [http://127.0.0.1:4173](http://127.0.0.1:4173)

## 사용

1. HTML 파일·코드·공개 HTTPS URL 열기.
2. 기기 또는 직접 입력으로 화면 크기 선택.
3. 레이아웃·SEO 확인 후 필요한 결과 저장.

- 스크립트 기반 페이지는 입력창에서 JavaScript 실행 선택.
- 2–4개 기기 비교·회전·자동 맞춤 지원.
- 하단 −/+로 확대·축소, 패널 경계 드래그로 너비 조절.
- 미리보기 안에서 스크롤·드래그·버튼·링크 클릭 지원.
- PNG·WebP·검사 결과 JSON 저장.

## 기기와 검사

- iPhone·Galaxy 프로필. 같은 CSS 크기의 모델은 한 항목으로 표시.
- 직접 입력 범위: 가로·세로 240–2048 CSS px.
- 가로 넘침·콘텐츠 잘림·화면 밖 고정 요소 검사.
- 깨진 내부 링크·이미지 실패·media query 확인.
- 작은 글자 경고: 설정한 최소 크기 기준.
- Safe Area 참고 표시·DPR·밝은/어두운 테마 설정.
- Chromium 기준 미리보기. 실물 기기·Safari 재현과 구분.
- 최신 기기 일부는 제조사 비율 기반 참고값. [기기 크기 기준](docs/devices.md).

## SEO 검사

검수 패널의 SEO 버튼으로 현재 페이지 확인.

- 페이지 제목·검색 설명·대표 주소.
- 검색 차단 meta·제목 구조.
- 이미지 대체문구·공유 정보.
- JSON-LD 문법·문서 언어.
- 검사 결과 JSON 저장.

사이트 전체 수집·검색 순위·AI 노출 평가는 미지원.

![현재 페이지 SEO 검사 화면](docs/screenshots/seo.png)

## 사용 범위

- HTML 최대 2MB. 원본·초안·현재 표시 결과만 메모리에 보관하며 새로고침 시 초기화.
- URL은 인증 정보 없는 공개 HTTPS의 GET 요청만 지원.
- JavaScript 기본 OFF. HTML의 외부 통신·폼 전송·팝업·다운로드 차단.
- 이미지 속 클릭은 처리 후 새 화면으로 갱신. 로그인·입력값 편집·실시간 조작 미지원.
- 리소스가 많은 페이지는 일부 로딩 제한 가능. [제한 상세](docs/Design.md#경계와-제한).

## 개발 문서

- [설계·실행 설정](docs/Design.md)
- [작업 상태·검증 기록](PLAN.md)
- [기기 크기 출처](docs/devices.md)
- [Chrome 진단 기록](docs/chrome-devtools.md)
- [작업 원칙](AGENTS.md)

코드 위치: `public/` 화면·검사기, `server/` 로컬 서버, `tests/` 검사, `examples/` 검수용 HTML.
