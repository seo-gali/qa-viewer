# 브라우저 확인 기록

기준일: 2026-11-03.

- 프로젝트 Playwright 의존성·번들 Chromium 실행 경로 제거.
- 설치된 Chrome 156.0.8078.80으로 실제 로컬 정적 앱 확인.
- Node.js 기본 WebSocket과 Chrome DevTools Protocol로 비교·확대·SEO·JSON 저장·script 차단 확인.
- 확인용 Chrome은 --no-sandbox 없이 별도 임시 프로필로 실행하고 종료.
- 문서 캡처: docs/screenshots/overview.png·seo.png.
- 확인 코드/로그: Git 제외 artifacts/static-browser-check.mjs·static-browser-check.log.
- Chrome DevTools MCP를 새로 설치하거나 전역 실행 정책을 바꾼 작업과 구분.

이전 LCP·CLS·heap·원격 촬영 시간은 이전 구현의 기록이며 현재 성능으로 재사용하지 않음.
기본 iframe도 브라우저 엔진으로 HTML/CSS를 처리하므로 사용자 브라우저 업데이트 필요.

[설계](Design.md) · [작업 상태](../PLAN.md)
