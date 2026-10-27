// Playwright device screen (or viewport when screen is absent), in CSS px. Insets remain visual references.
export const profiles = [
  { id: 'iphone', group: 'Apple', name: 'iPhone 13', referenceDevice: 'iPhone 13', width: 390, height: 844, dpr: 3, cutout: 'notch', safe: [47, 0, 34, 0] },
  { id: 'iphone-large', group: 'Apple', name: 'iPhone 15 Pro Max', referenceDevice: 'iPhone 15 Pro Max', width: 430, height: 932, dpr: 3, cutout: 'island', safe: [59, 0, 34, 0] },
  { id: 'iphone-notch', group: 'Apple', name: 'iPhone X', referenceDevice: 'iPhone X', width: 375, height: 812, dpr: 3, cutout: 'notch', safe: [44, 0, 34, 0] },
  { id: 'iphone-se', group: 'Apple', name: 'iPhone SE', referenceDevice: 'iPhone SE', width: 320, height: 568, dpr: 2, safe: [0, 0, 0, 0] },
  { id: 'iphone-se-3', group: 'Apple', name: 'iPhone SE (3rd gen)', referenceDevice: 'iPhone SE (3rd gen)', width: 375, height: 667, dpr: 2, safe: [0, 0, 0, 0] },
  { id: 'galaxy', group: 'Samsung', name: 'Galaxy S24', referenceDevice: 'Galaxy S24', width: 360, height: 780, dpr: 3, cutout: 'hole', safe: [28, 0, 24, 0] },
  { id: 'galaxy-a55', group: 'Samsung', name: 'Galaxy A55', referenceDevice: 'Galaxy A55', width: 480, height: 1040, dpr: 2.25, cutout: 'hole', safe: [28, 0, 24, 0] },
  { id: 'fold', group: 'Samsung Fold / Flip', name: 'Galaxy Z Fold 6', referenceDevice: 'Galaxy Z Fold 6', width: 928, height: 1080, dpr: 2, hinge: 'vertical', safe: [24, 0, 24, 0] },
  { id: 'fold-cover', group: 'Samsung Fold / Flip', name: 'Galaxy Z Fold 6 Cover', referenceDevice: 'Galaxy Z Fold 6 Cover', width: 484, height: 1188, dpr: 2, cutout: 'hole', safe: [28, 0, 24, 0] },
  { id: 'flip', group: 'Samsung Fold / Flip', name: 'Galaxy Z Flip 6', referenceDevice: 'Galaxy Z Flip 6', width: 360, height: 880, dpr: 3, cutout: 'hole', hinge: 'horizontal', safe: [28, 0, 24, 0] },
  { id: 'pixel-7', group: 'Google', name: 'Pixel 7', referenceDevice: 'Pixel 7', width: 412, height: 915, dpr: 2.625, cutout: 'hole', safe: [28, 0, 24, 0] },
  ...[320, 360, 375, 390, 412, 430].map(width => ({ id: `generic-${width}`, group: 'Generic', name: `${width}px`, width, height: 844, dpr: 1, safe: [0, 0, 0, 0] })),
  { id: 'custom', group: 'Custom', name: '직접 입력', width: 390, height: 844, dpr: 1, safe: [0, 0, 0, 0] }
];
export function validDimension(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 240 && n <= 2048;
}
export function resolveProfile(id, custom = { width: 390, height: 844 }, landscape = false) {
  const original = profiles.find(p => p.id === id);
  if (!original) throw new Error('알 수 없는 프로필입니다.');
  const p = { ...original, safe: [...original.safe] };
  if (id === 'custom') {
    if (!validDimension(custom.width) || !validDimension(custom.height)) throw new Error('크기는 240–2048 사이의 정수여야 합니다.');
    p.width = Number(custom.width); p.height = Number(custom.height);
  }
  if (landscape) {
    [p.width, p.height] = [p.height, p.width];
    const [top, right, bottom, left] = p.safe;
    p.safe = [left, top, right, bottom];
    if (p.hinge) p.hinge = p.hinge === 'vertical' ? 'horizontal' : 'vertical';
  }
  return p;
}
export function fitScale(widths, heights, availableWidth, availableHeight, gap = 40) {
  return Math.max(0.05, Math.min(1, (availableWidth - gap * (widths.length - 1)) / widths.reduce((a, b) => a + b, 0), availableHeight / Math.max(...heights)));
}
