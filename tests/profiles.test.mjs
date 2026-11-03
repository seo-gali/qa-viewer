import { test } from 'node:test';
import assert from 'node:assert/strict';
import { profiles, profileChoices, resolveProfile, fitScale, validDimension } from '../public/profiles.js';
import { devices } from 'playwright';
test('named model dimensions, DPR and UA reference match installed Playwright descriptors', () => {
  for (const p of profiles.filter(p => p.referenceDevice)) {
    const device = devices[p.referenceDevice];
    assert.ok(device, p.name);
    assert.deepEqual({ width: p.width, height: p.height }, device.screen ?? device.viewport, p.name);
    assert.equal(p.dpr, device.deviceScaleFactor, p.name);
  }
});
test('all profiles have bounded CSS dimensions and immutable rotated insets', () => {
  for (const p of profiles) { assert.ok(validDimension(p.width)); assert.ok(validDimension(p.height)); assert.equal(resolveProfile(p.id, undefined, true).width, p.height); }
  assert.deepEqual(resolveProfile('iphone', undefined, true).safe, [0, 47, 0, 34]);
  assert.deepEqual(profiles.find(p => p.id === 'iphone').safe, [47, 0, 34, 0]);
  assert.equal(resolveProfile('fold', undefined, true).hinge, 'horizontal');
});
test('picker groups equal CSS sizes by brand and keeps all model IDs', () => {
  const keys = profileChoices.map(p => `${p.group}:${p.width}:${p.height}`);
  assert.equal(new Set(keys).size, keys.length);
  assert.deepEqual([...new Set(profileChoices.map(p => p.group))], ['Apple', 'Samsung', 'Custom']);
  for (const p of profiles.filter(p => p.group !== 'Generic')) {
    const choice = profileChoices.find(c => c.ids.includes(p.id));
    assert.ok(choice?.names.includes(p.name), p.id);
    assert.deepEqual([choice.width, choice.height], [p.width, p.height], p.id);
  }
  assert.equal(profileChoices.find(p => p.ids.includes('iphone-16-pro')).id, 'iphone-18-pro');
  assert.equal(profileChoices.find(p => p.ids.includes('galaxy-s26-ultra')).id, 'galaxy-s26-plus');
  assert.equal(profiles.some(p => /Pixel/.test(p.name)), false);
});
test('custom dimensions reject non-finite, fractional and unbounded input', () => {
  for (const bad of ['', 'abc', 0, 239, 2049, Infinity, 390.5]) assert.equal(validDimension(bad), false);
  assert.throws(() => resolveProfile('custom', { width: 20, height: 844 }));
  assert.throws(() => resolveProfile('unknown'));
  assert.equal(resolveProfile('custom', { width: '412', height: '915' }).width, 412);
});
test('Fit includes viewport heights and multiple card widths without enlarging', () => {
  assert.equal(fitScale([390], [844], 1000, 1000), 1);
  assert.equal(fitScale([390], [844], 1000, 422), .5);
  assert.equal(fitScale([390, 390], [844, 844], 430, 1000), .5);
});
