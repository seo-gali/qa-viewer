export const sample = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>검수 목록</title><style>
*{box-sizing:border-box}body{margin:0;background:#f3f5fa;color:#202838;font:15px/1.7 system-ui,sans-serif}
main{max-width:680px;margin:auto;padding:64px 24px 100px}h1{font-size:30px;margin:0 0 24px}h2{font-size:21px;margin:0 0 18px}h3{font-size:17px;margin:0}p{margin:8px 0 20px;color:#48566d}
section{margin-top:28px}article{background:white;border:1px solid #708098;border-radius:8px;padding:20px;margin-bottom:16px}.tasks{display:grid;gap:16px}.tasks article{margin:0}
a{color:#304d95;text-underline-offset:3px}a:focus-visible{outline:3px solid #304d95;outline-offset:4px}.primary{display:inline-block;padding:12px 18px;background:#304d95;color:white;border-radius:4px;text-decoration:none}
ul{padding-left:22px}li{margin:10px 0}nav{position:fixed;bottom:0;left:0;width:100%;display:flex;gap:28px;justify-content:center;padding:16px 20px 28px;background:#fff;border-top:1px solid #708098}
@media(min-width:600px){.tasks{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:360px){main{padding-inline:18px}}
</style></head><body><main id="tasks"><h1>검수 목록</h1><div class="tasks">
<article><h2>모바일 홈</h2><p>375 × 812 · 390 × 844 CSS px</p><a class="primary" href="#checklist">검사 항목 보기</a></article>
<article><h2>신청 폼</h2><p>입력 오류 · 긴 문구 · 완료 화면</p><a href="#form">검수 내용 보기</a></article>
</div><section id="checklist"><h2>화면 검사</h2><ul><li>가로 스크롤과 잘린 콘텐츠</li><li>화면 밖으로 나간 고정 요소</li><li>제목과 본문의 줄바꿈</li><li>내부 링크의 이동 위치</li></ul></section>
<section id="form"><h2>신청 폼 검사</h2><article><h3>입력 오류</h3><p>제출 시 첫 오류 항목으로 포커스가 이동하는지 확인.</p><h3>내용 수정</h3><p>완료 화면에서 돌아왔을 때 작성 내용이 유지되는지 확인.</p></article></section>
</main><nav aria-label="검수 항목"><a href="#tasks">검수 목록</a><a href="#checklist">화면</a><a href="#form">신청 폼</a></nav></body></html>`;
