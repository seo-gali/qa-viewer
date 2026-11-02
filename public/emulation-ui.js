const $ = id => document.getElementById(id);
export async function capture(input, signal) {
  const response = await fetch('/api/emulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? '검사 실패');
  return data;
}
export function setupEmulation(getInput, applySettings, getResult, toast) {
  $('emulate').addEventListener('click', () => {
    $('emulation-dpr').value = getInput().dpr;
    $('emulation-color').value = getInput().colorScheme;
    $('emulation-dialog').showModal();
  });
  $('run-emulation').addEventListener('click', () => {
    $('emulation-dialog').querySelector('.dialog-error')?.remove();
    const dpr = Number($('emulation-dpr').value);
    if (!Number.isFinite(dpr) || dpr < 1 || dpr > 4) return toast('DPR은 1–4 사이의 숫자로 입력하세요.', 'error', $('emulation-dpr'));
    applySettings({ dpr, colorScheme: $('emulation-color').value });
    $('emulation-dialog').close();
  });
  function download(url, filename) { const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); }
  $('download-image').addEventListener('click', () => { const result = getResult(); if (result) { download(result.image, `qa-${result.profile.id}.png`); toast('이미지 저장을 시작했습니다.', 'success'); } });
  $('download-webp').addEventListener('click', async () => {
    const current = getResult();
    if (!current) return;
    try {
      const image = new Image(); image.src = current.image; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      canvas.getContext('2d').drawImage(image, 0, 0);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.85));
      if (!blob || blob.type !== 'image/webp') throw new Error('이 브라우저는 WebP 압축을 지원하지 않습니다. PNG를 사용하세요.');
      const url = URL.createObjectURL(blob); download(url, `qa-${current.profile.id}.webp`); setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('압축 이미지 저장을 시작했습니다.', 'success');
    } catch (error) { toast(error.message); }
  });
  $('download-report').addEventListener('click', () => {
    const result = getResult();
    if (!result) return;
    const { image, ...report } = result;
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    download(url, `qa-${result.profile.id}.json`); setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('검사 결과 저장을 시작했습니다.', 'success');
  });
}
