// Reference QA sizes, deliberately not a hardware specifications registry.
export const profiles = [
  { id: 'iphone', group: 'Apple', name: 'iPhone · 390', width: 390, height: 844, dpr: 3, cutout: 'island', safe: [59, 0, 34, 0] },
  { id: 'iphone-large', group: 'Apple', name: 'iPhone Large · 430', width: 430, height: 932, dpr: 3, cutout: 'island', safe: [59, 0, 34, 0] },
  { id: 'iphone-notch', group: 'Apple', name: 'iPhone Notch · 375', width: 375, height: 812, dpr: 3, cutout: 'notch', safe: [44, 0, 34, 0] },
  { id: 'galaxy', group: 'Samsung', name: 'Galaxy S · 360', width: 360, height: 800, dpr: 3, cutout: 'hole', safe: [28, 0, 24, 0] },
  { id: 'galaxy-ultra', group: 'Samsung', name: 'Galaxy Ultra · 412', width: 412, height: 915, dpr: 3, cutout: 'hole', safe: [28, 0, 24, 0] },
  { id: 'fold', group: 'Foldable', name: 'Galaxy Fold · unfolded', width: 768, height: 884, dpr: 2, hinge: 'vertical', safe: [24, 0, 24, 0] },
  { id: 'fold-cover', group: 'Foldable', name: 'Galaxy Fold · cover', width: 344, height: 882, dpr: 3, cutout: 'hole', safe: [28, 0, 24, 0] },
  { id: 'flip', group: 'Flip', name: 'Galaxy Flip · open', width: 360, height: 880, dpr: 3, cutout: 'hole', hinge: 'horizontal', safe: [28, 0, 24, 0] },
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
