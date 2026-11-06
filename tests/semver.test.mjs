import test from 'node:test';
import assert from 'node:assert/strict';
import { compareSemVer, parseRange, parseSemVer, satisfiesRange } from '../dist/esm/index.js';

test('parses strict versions and copies identifier arrays', () => {
  const parsed = parseSemVer('2.4.0-rc.2+build.9');
  assert.deepEqual(parsed.prerelease, ['rc', '2']);
  assert.deepEqual(parsed.build, ['build', '9']);
});
test('rejects loose and leading-zero versions', () => {
  for (const value of ['1.2', '01.2.3', '1.2.3-01', 'v1.2.3', '1.2.3\n'])
    assert.throws(() => parseSemVer(value));
});
test('orders prerelease identifiers per semver precedence', () => {
  assert.equal(compareSemVer('1.0.0-alpha.2', '1.0.0-alpha.10'), -1);
  assert.equal(compareSemVer('1.0.0-rc', '1.0.0'), -1);
  assert.equal(compareSemVer('1.0.0+one', '1.0.0+two'), 0);
});
test('supports inclusive and exclusive comparator conjunctions', () => {
  assert.equal(satisfiesRange('1.5.0', '>=1.2.0 <2.0.0'), true);
  assert.equal(satisfiesRange('2.0.0', '>=1.2.0 <2.0.0'), false);
});
test('expands caret and tilde with zero-major rules', () => {
  assert.equal(satisfiesRange('0.2.9', '^0.2.3'), true);
  assert.equal(satisfiesRange('0.3.0', '^0.2.3'), false);
  assert.equal(satisfiesRange('1.4.9', '~1.4.2'), true);
});
test('supports OR and wildcard ranges', () => {
  assert.equal(satisfiesRange('4.0.0', '<2.0.0 || >=4.0.0'), true);
  assert.equal(satisfiesRange('99.0.0', '*'), true);
});
test('prereleases require a same-core prerelease comparator', () => {
  assert.equal(satisfiesRange('1.2.3-beta.2', '>=1.2.3-beta.1 <1.2.3'), true);
  assert.equal(satisfiesRange('1.2.3-beta.2', '>=1.0.0'), false);
});
test('bounds malformed ranges', () => {
  assert.throws(() => parseRange('1.2.3 ||'));
  assert.throws(() => parseRange('1.2.3 '.repeat(130)), RangeError);
});
