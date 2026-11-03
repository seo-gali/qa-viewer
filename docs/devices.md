# 기기 크기 기준

기준일: 2026-11-03. 선택 목록은 Apple·Samsung별 같은 CSS 가로/세로 크기를 한 항목으로 묶는다. 연도별 목록과 Google 기기는 제공하지 않는다. 이전 API 기기 ID는 유지한다.

Playwright 참조가 있는 모델은 설치된 기기 정의의 screen 또는 viewport와 DPR을 사용한다. `source`가 있는 프로필은 제조사가 발표한 패널 비율을 검수 크기로 옮긴 참고값이다. 제조사가 공식 CSS viewport나 기본 DPR을 보장한 값으로 표현하지 않는다. 브라우저 UI·글꼴·화면 확대·해상도 설정에 따라 실제 표시 영역이 달라진다.

## 제조사 비율 기반 참고값

| 모델/상태 | 검수 CSS 크기 | 선택 DPR | 환산 기준 |
| --- | --- | --- | --- |
| iPhone 18 Pro / Pro Max | 402×874 / 440×956 | 3 | 패널 1206×2622 / 1320×2868을 3으로 나눔 |
| iPhone Duo 펼침 / 커버 | 890×626 / 466×678 | 3 | 2670×1878 / 1398×2034를 3으로 나눔 |
| Galaxy S26 / FE | 360×780 | 3 | 1080×2340을 3으로 나눔 |
| Galaxy S26+ / Ultra | 412×892 | 3.5 | 1440×3120을 3.5로 나눠 올림 |
| Galaxy Z Fold 8 펼침 / 커버 | 1224×924 / 416×658 | 2 / 3 | 2448×1848 / 1248×1972를 해당 DPR로 나눠 올림 |
| Galaxy Z Fold 8 Ultra 펼침 / 커버 | 1128×1252 / 360×840 | 2 / 3 | 2256×2504 / 1080×2520을 해당 DPR로 나눔 |
| Galaxy Z Flip 8 / 커버 | 360×840 / 474×524 | 3 / 2 | 1080×2520 / 948×1048을 해당 DPR로 나눔 |

S26+·Ultra의 DPR 3.5 등은 프로젝트의 검수 기준 선택이다. 하드웨어 픽셀만으로 브라우저 기본 CSS 크기를 확정할 수 없다. 원래 방향이 가로인 펼침 화면은 가로 크기로 시작하며 회전 버튼으로 가로/세로를 바꾼다. 미확인 Safe Area·노치·접힘선은 추가하지 않는다.

## 출처와 확인 한계

- [Apple iPhone 18 Pro 사양](https://www.apple.com/iphone-18-pro/specs/): 패널 해상도.
- [Apple iPhone Duo 사양](https://www.apple.com/iphone-duo/specs/): 내부/외부 패널 해상도.
- [Samsung Developer Galaxy S](https://developer.samsung.com/galaxy-emulator-skin/galaxy-s.html): S26 시리즈 패널 해상도.
- [Samsung 폴더블 발표](https://news.samsung.com/us/samsung-galaxy-z-fold8-ultra-fold8-flip8-foldables-perfected-every-way-of-living/): Fold 8/Ultra·Flip 8의 내부/외부 비율 기준. 후속 재조회에서 응답 시간 초과 관찰.
- [Samsung Developer Galaxy Z](https://developer.samsung.com/galaxy-emulator-skin/galaxy-z.html): Fold 8 패널 1828×2448 표기는 발표 자료의 1848×2448과 차이 존재. 코드의 발표 자료 기준 유지. 브라우저 실측으로 오인 금지.
- [Playwright 기기 정의](https://playwright.dev/docs/emulation#devices): 기존 참조 모델의 screen/viewport·DPR·UA. 설치된 정의와 비교한 로컬 검사 통과.

최신 참고 모델의 UA는 브랜드별 기존 Playwright 참조를 사용한다. iPhone UA에서도 렌더링 엔진은 Chromium이다. 정확한 기종별 UA·Safari·실물 휴대폰 재현과 구분한다.
