// shortcut: source presets use manufacturer ratios; replace with measured browser CSS sizes when available.
const define = (brand, rows) => rows.map(([id, name, width, height, dpr = 3, referenceDevice = name, source]) => ({ id, brand, group: brand, name, width, height, dpr, referenceDevice, source, safe: [0, 0, 0, 0] }));
export const profiles = [
  ...define("Apple", [
    ["iphone-18-pro","iPhone 18 Pro",402,874,3,null,"https://www.apple.com/iphone-18-pro/specs/"],
    ["iphone-18-pro-max","iPhone 18 Pro Max",440,956,3,null,"https://www.apple.com/iphone-18-pro/specs/"],
    ["iphone-17e","iPhone 17e",390,844],
    ["iphone-duo","iPhone Duo · 펼침",890,626,3,null,"https://www.apple.com/iphone-duo/specs/"],
    ["iphone-duo-cover","iPhone Duo · 커버",466,678,3,null,"https://www.apple.com/iphone-duo/specs/"],
  ]),
  ...define("Apple", [
    ["iphone-17","iPhone 17",402,874],
    ["iphone-17-pro","iPhone 17 Pro",402,874],
    ["iphone-17-pro-max","iPhone 17 Pro Max",440,956],
    ["iphone-air","iPhone Air",420,912],
    ["iphone-16e","iPhone 16e",390,844],
  ]),
  ...define("Apple", [
    ["iphone-16","iPhone 16",393,852],
    ["iphone-16-plus","iPhone 16 Plus",430,932],
    ["iphone-16-pro","iPhone 16 Pro",402,874],
    ["iphone-16-pro-max","iPhone 16 Pro Max",440,956],
  ]),
  ...define("Apple", [
    ["iphone-15","iPhone 15",393,852],
    ["iphone-15-plus","iPhone 15 Plus",430,932],
    ["iphone-15-pro","iPhone 15 Pro",393,852],
    ["iphone-15-pro-max","iPhone 15 Pro Max",430,932],
  ]),
  ...define("Samsung", [
    ["galaxy-s26","Galaxy S26",360,780,3,null,"https://developer.samsung.com/galaxy-emulator-skin/galaxy-s.html"],
    ["galaxy-s26-plus","Galaxy S26+",412,892,3.5,null,"https://developer.samsung.com/galaxy-emulator-skin/galaxy-s.html"],
    ["galaxy-s26-ultra","Galaxy S26 Ultra",412,892,3.5,null,"https://developer.samsung.com/galaxy-emulator-skin/galaxy-s.html"],
    ["galaxy-s26-fe","Galaxy S26 FE",360,780,3,null,"https://developer.samsung.com/galaxy-emulator-skin/galaxy-s.html"],
    ["fold-8","Galaxy Z Fold 8 · 펼침",1224,924,2,null,"https://news.samsung.com/us/samsung-galaxy-z-fold8-ultra-fold8-flip8-foldables-perfected-every-way-of-living/"],
    ["fold-8-cover","Galaxy Z Fold 8 · 커버",416,658,3,null,"https://news.samsung.com/us/samsung-galaxy-z-fold8-ultra-fold8-flip8-foldables-perfected-every-way-of-living/"],
    ["fold-8-ultra","Galaxy Z Fold 8 Ultra · 펼침",1128,1252,2,null,"https://news.samsung.com/us/samsung-galaxy-z-fold8-ultra-fold8-flip8-foldables-perfected-every-way-of-living/"],
    ["fold-8-ultra-cover","Galaxy Z Fold 8 Ultra · 커버",360,840,3,null,"https://news.samsung.com/us/samsung-galaxy-z-fold8-ultra-fold8-flip8-foldables-perfected-every-way-of-living/"],
    ["flip-8","Galaxy Z Flip 8",360,840,3,null,"https://news.samsung.com/us/samsung-galaxy-z-fold8-ultra-fold8-flip8-foldables-perfected-every-way-of-living/"],
    ["flip-8-cover","Galaxy Z Flip 8 · 커버",474,524,2,null,"https://news.samsung.com/us/samsung-galaxy-z-fold8-ultra-fold8-flip8-foldables-perfected-every-way-of-living/"],
  ]),
  ...define("Samsung", [
    ["fold-7","Galaxy Z Fold 7",984,1092,2],
    ["fold-7-cover","Galaxy Z Fold 7 Cover",360,840],
    ["flip-7","Galaxy Z Flip 7",360,840],
    ["flip-7-cover","Galaxy Z Flip 7 Cover",474,524,2],
  ]),
  // Earlier presets remain available for existing API callers.
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
  ...[320, 360, 375, 390, 412, 430].map(width => ({ id: `generic-${width}`, group: 'Generic', name: `${width}px`, width, height: 844, dpr: 1, safe: [0, 0, 0, 0] })),
  { id: 'custom', group: 'Custom', name: '직접 입력', width: 390, height: 844, dpr: 1, safe: [0, 0, 0, 0] }
];
// Keep API IDs while showing each brand's CSS size once in the picker.
export const profileChoices = [];
for (const p of profiles.filter(p => p.group !== 'Generic')) {
  const brand = p.brand ?? (p.group === 'Apple' ? 'Apple' : p.group.startsWith('Samsung') ? 'Samsung' : p.group);
  let choice = profileChoices.find(c => c.group === brand && c.width === p.width && c.height === p.height);
  if (!choice) { choice = { ...p, group: brand, ids: [], names: [] }; profileChoices.push(choice); }
  choice.ids.push(p.id);
  if (!choice.names.includes(p.name)) choice.names.push(p.name);
  const prefix = brand === 'Apple' ? 'iPhone ' : brand === 'Samsung' ? 'Galaxy ' : '';
  choice.name = prefix + choice.names.map(name => name.startsWith(prefix) ? name.slice(prefix.length) : name).join(' / ');
}
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
