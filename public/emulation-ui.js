const $ = id => document.getElementById(id);
export function setupEmulation(getInput, toast) {
  let result = null, controller = null;
  function clearResult() { result = null; $('emulation-result').hidden = true; $('emulation-progress').textContent = ''; }
  $('emulate').addEventListener('click', () => {
    if (!controller) { clearResult(); $('emulation-dpr').value = getInput().dpr; }
    $('emulation-dialog').showModal();
  });
  $('emulation-dialog').addEventListener('close', () => { controller?.abort(); });
  $('run-emulation').addEventListener('click', async () => {
    $('emulation-dialog').querySelector('.dialog-error')?.remove();
    const input = { ...getInput(), dpr: Number($('emulation-dpr').value), scripts: $('emulation-scripts').checked, colorScheme: $('emulation-color').value };
    if (!Number.isFinite(input.dpr) || input.dpr < 1 || input.dpr > 4) return toast('DPR은 1–4 사이의 숫자로 입력하세요.', 'error', $('emulation-dpr'));
    controller = new AbortController();
    $('run-emulation').disabled = true; clearResult(); $('emulation-progress').textContent = '로컬 Chromium 검사 중… (최대 20초)';
    try {
      const response = await fetch('/api/emulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: controller.signal });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? '검사 실패');
      result = data;
      $('emulation-image').width = data.profile.width; $('emulation-image').height = data.profile.height;
      $('emulation-image').src = data.image; $('emulation-image').alt = `${data.profile.name} Chromium 검사 스크린샷`;
      $('emulation-caption').textContent = `${data.profile.name} · ${data.profile.width} × ${data.profile.height} CSS px · ${data.settings.scripts ? 'JavaScript ON' : 'JavaScript OFF'}`;
      const metrics = [
        ['콘텐츠', data.source.type === 'url' ? data.source.finalUrl : 'HTML snapshot'],
        ['브라우저', `${data.engine} ${data.browserVersion}`], ['CSS layout viewport', `${data.runtime.layoutWidth} × ${data.runtime.layoutHeight}`],
        ['window.innerWidth / Height', `${data.runtime.innerWidth} × ${data.runtime.innerHeight}`], ['DPR / touch points', `${data.runtime.dpr} / ${data.runtime.touchPoints}`],
        ['viewport meta', data.report.metaViewport ?? '없음 · 모바일 기본 layout viewport 적용'], ['가로 스크롤', data.report.horizontalOverflow ? `${data.report.scrollWidth}px · overflow` : '없음'],
        ['UA 참조 프로필', `${data.referenceDevice} · 엔진은 Chromium`], ['검수 경고', `${data.report.issues.length}${data.report.truncated ? '+' : ''}개`]
      ];
      if (data.source.type === 'url') metrics.push(['원격 리소스', `${data.remoteRequests} 요청 · ${data.blockedRequests} 차단`]);
      $('emulation-metrics').replaceChildren();
      for (const [key, value] of metrics) { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = key; dd.textContent = value; $('emulation-metrics').append(dt, dd); }
      $('emulation-issues').replaceChildren();
      for (const issue of data.report.issues) { const item = document.createElement('p'); item.textContent = `⚠ ${issue.selector} · ${issue.message}`; $('emulation-issues').append(item); }
      for (const error of data.errors) { const item = document.createElement('p'); item.textContent = `JS error: ${error}`; $('emulation-issues').append(item); }
      $('emulation-progress').textContent = `검사 완료 · ${(data.durationMs / 1000).toFixed(1)}초 · ${new Date(data.capturedAt).toLocaleTimeString()} 시점의 스냅샷`;
      $('emulation-progress').setAttribute('role', 'status');
      $('emulation-result').hidden = false;
    } catch (error) { $('emulation-progress').textContent = error.name === 'AbortError' ? '검사가 취소되었습니다.' : error.message; $('emulation-progress').setAttribute('role', error.name === 'AbortError' ? 'status' : 'alert'); }
    finally { controller = null; $('run-emulation').disabled = false; }
  });
  function download(url, filename) { const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); }
  $('download-image').addEventListener('click', () => { if (result) { download(result.image, `qa-${result.profile.id}.png`); $('emulation-progress').textContent = 'PNG 다운로드를 시작했습니다.'; } });
  $('download-webp').addEventListener('click', async () => {
    if (!result) return;
    const current = result;
    try {
      const image = new Image(); image.src = current.image; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      canvas.getContext('2d').drawImage(image, 0, 0);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.85));
      if (!blob || blob.type !== 'image/webp') throw new Error('이 브라우저는 WebP 압축을 지원하지 않습니다. PNG를 사용하세요.');
      const url = URL.createObjectURL(blob); download(url, `qa-${current.profile.id}.webp`); setTimeout(() => URL.revokeObjectURL(url), 1000);
      $('emulation-progress').textContent = `WebP 압축 다운로드 시작 · ${Math.round(blob.size / 1024)}KB (원본 PNG ${Math.round(current.image.split(',')[1].length * .75 / 1024)}KB)`;
    } catch (error) { $('emulation-progress').textContent = error.message; $('emulation-progress').setAttribute('role', 'alert'); }
  });
  $('download-report').addEventListener('click', () => {
    if (!result) return;
    const { image, ...report } = result;
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    download(url, `qa-${result.profile.id}.json`); setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('emulation-progress').textContent = 'JSON 리포트 다운로드를 시작했습니다.';
  });
}
