# Chrome DevTools 진단 및 연결 검토안

기준일: 2026-10-26. MCP 미설치·미연결, 전역 설정 변경 없음. 아래 설정은 승인 검토용 예시이며 활성 설정 파일이 아님.

## 활용 범위

기존 Playwright 검사는 동작 회귀 확인에 유지한다. Chrome DevTools MCP는 성능 trace·Lighthouse·메모리 원인 분석에 활용한다. 초기 대상은 `http://127.0.0.1:4173/`의 기본 검수 샘플이며 사용자 개인정보·실제 업로드·로그인 프로필은 사용하지 않는다.

공식 자료: [README](https://github.com/ChromeDevTools/chrome-devtools-mcp#readme), [1.12.0 릴리스](https://github.com/ChromeDevTools/chrome-devtools-mcp/releases/tag/chrome-devtools-mcp-v1.12.0), [설정](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/configuration.md), [도구](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/tool-reference.md).

확인한 로컬 전제: Node.js v24.22.1, Google Chrome `C:\Program Files\Google\Chrome\Application\chrome.exe` 제품 버전 155.0.8059.85. 기존 디버깅 브라우저에 자동 연결하지 않고 임시 프로필 사용. 사용 통계·CrUX URL 전송·주기적 업데이트 확인 비활성화. 브라우저 URL은 기본 loopback 포트로 제한하며 QA_PORT 변경 시 허용 패턴의 포트도 일치 필요.

## 승인 검토용 설정

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@1.12.0",
        "--headless",
        "--isolated",
        "--no-usage-statistics",
        "--no-performance-crux",
        "--allowed-url-pattern=http://127.0.0.1:4173/*"
      ],
      "env": {
        "CHROME_DEVTOOLS_MCP_NO_UPDATE_CHECKS": "1"
      }
    }
  }
}
```

실제 설치·연결은 신규 패키지 실행 및 MCP 클라이언트 설정 변경에 해당하므로 사용자 대화의 명시적 사전 승인 후 진행한다. 클라이언트별 설정 형식과 적용 위치를 확인하고 위 의미에 맞게 반영한다. API/OAuth 접속 주소·인증 환경 변수·승인 정책은 변경하지 않는다. 설치 후 loopback 탐색·콘솔·네트워크·성능 trace를 직접 검증하기 전까지 연결 완료로 기록하지 않는다.

## 설치된 Playwright로 수행한 로컬 기준 측정

MCP 설치 없이 Playwright CDP와 PerformanceObserver로 1회 측정. 1440 × 1000 viewport의 기본 샘플에서 초기 표시 후 비교 3개/단일 1개 화면 전환 5회 수행. heap 측정 전 GC 실행. 모든 요청을 로컬 서버로 제한하고 별도 임시 브라우저 컨텍스트 사용. 개인정보·쿠키·원본 HTML은 측정 파일에 기록하지 않음.

| 항목 | 측정값 |
| --- | --- |
| 시각 | 2026-10-26 12:01:42 UTC |
| 환경 | Node.js v24.22.1·Playwright Chromium 153.0.8010.12 |
| LCP | 192 ms |
| CLS | 0.004746305760513117 |
| 비교 전 JS heap | 1,700,240 bytes |
| 5회 전환 후 JS heap | 2,578,624 bytes |
| 차이 | +878,384 bytes |

측정 원본: Git 제외 경로 `artifacts/performance-baseline.json`. 상위 뷰어의 로컬 단회 측정이며 iframe 원본·실기기·운영 부하 측정이 아님. 이 결과만으로 메모리 누수 여부를 판정하지 않음. 반복 측정과 retained 객체 분석은 후속 진단 대상.
