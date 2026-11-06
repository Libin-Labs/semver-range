export interface SemVer {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease: readonly string[];
  readonly build: readonly string[];
}
export type ComparatorOperator = '=' | '>' | '>=' | '<' | '<=';
export interface Comparator {
  readonly operator: ComparatorOperator;
  readonly version: SemVer;
}
export interface ParsedRange {
  readonly alternatives: readonly (readonly Comparator[])[];
}
const VERSION =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const MAX_RANGE_LENGTH = 2048;
const MAX_COMPARATORS = 128;

export function parseSemVer(input: string): SemVer {
  if (typeof input !== 'string' || input.length > 256)
    throw new TypeError('Invalid semantic version');
  const match = VERSION.exec(input);
  if (!match || match[0] !== input)
    throw new TypeError(`Invalid strict semantic version: ${input}`);
  const numeric = [match[1], match[2], match[3]].map(Number);
  if (numeric.some((part) => !Number.isSafeInteger(part)))
    throw new RangeError('Version components must be safe integers');
  const prerelease = match[4]?.split('.') ?? [];
  if (prerelease.some((part) => /^\d+$/.test(part) && part.length > 1 && part.startsWith('0'))) {
    throw new TypeError('Numeric prerelease identifiers cannot have leading zeroes');
  }
  return Object.freeze({
    major: numeric[0]!,
    minor: numeric[1]!,
    patch: numeric[2]!,
    prerelease: Object.freeze(prerelease),
    build: Object.freeze(match[5]?.split('.') ?? []),
  });
}

export function compareSemVer(left: string | SemVer, right: string | SemVer): number {
  const a = typeof left === 'string' ? parseSemVer(left) : left;
  const b = typeof right === 'string' ? parseSemVer(right) : right;
  for (const key of ['major', 'minor', 'patch'] as const) {
    if (a[key] !== b[key]) return a[key] < b[key] ? -1 : 1;
  }
  if (a.prerelease.length === 0 || b.prerelease.length === 0) {
    return a.prerelease.length === b.prerelease.length ? 0 : a.prerelease.length === 0 ? 1 : -1;
  }
  const length = Math.max(a.prerelease.length, b.prerelease.length);
  for (let i = 0; i < length; i++) {
    const x = a.prerelease[i];
    const y = b.prerelease[i];
    if (x === undefined || y === undefined) return x === y ? 0 : x === undefined ? -1 : 1;
    if (x === y) continue;
    const xn = /^\d+$/.test(x);
    const yn = /^\d+$/.test(y);
    if (xn && yn) return x.length !== y.length ? (x.length < y.length ? -1 : 1) : x < y ? -1 : 1;
    if (xn !== yn) return xn ? -1 : 1;
    return x < y ? -1 : 1;
  }
  return 0;
}
function tuple(version: SemVer): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}
function upperBound(version: SemVer, kind: '^' | '~'): SemVer {
  if (kind === '~') return parseSemVer(`${version.major}.${version.minor + 1}.0`);
  if (version.major > 0) return parseSemVer(`${version.major + 1}.0.0`);
  if (version.minor > 0) return parseSemVer(`0.${version.minor + 1}.0`);
  return parseSemVer(`0.0.${version.patch + 1}`);
}

export function parseRange(input: string): ParsedRange {
  if (typeof input !== 'string' || input.length === 0 || input.length > MAX_RANGE_LENGTH) {
    throw new TypeError('Range must be a nonempty string of at most 2048 characters');
  }
  const alternatives: Comparator[][] = [];
  let count = 0;
  for (const alternative of input.split('||')) {
    const text = alternative.trim();
    if (!text) throw new TypeError('Empty range alternative');
    const comparators: Comparator[] = [];
    if (text !== '*') {
      for (const part of text.split(/\s+/)) {
        const match = /^(<=|>=|<|>|=|\^|~)?(.+)$/.exec(part);
        if (!match) throw new TypeError(`Invalid range term: ${part}`);
        const op = match[1] ?? '=';
        const version = parseSemVer(match[2]!);
        if (op === '^' || op === '~') {
          comparators.push(
            { operator: '>=', version },
            { operator: '<', version: upperBound(version, op) },
          );
          count += 2;
        } else {
          comparators.push({ operator: op as ComparatorOperator, version });
          count++;
        }
        if (count > MAX_COMPARATORS) throw new RangeError('Range has too many comparators');
      }
    }
    alternatives.push(comparators);
  }
  return Object.freeze({
    alternatives: Object.freeze(alternatives.map((set) => Object.freeze(set))),
  });
}

export function satisfiesRange(versionText: string, rangeText: string | ParsedRange): boolean {
  const version = parseSemVer(versionText);
  const range = typeof rangeText === 'string' ? parseRange(rangeText) : rangeText;
  return range.alternatives.some((set) => {
    if (
      version.prerelease.length > 0 &&
      !set.some(
        (comparator) =>
          comparator.version.prerelease.length > 0 && tuple(comparator.version) === tuple(version),
      )
    )
      return false;
    return set.every((comparator) => {
      const compared = compareSemVer(version, comparator.version);
      switch (comparator.operator) {
        case '=':
          return compared === 0;
        case '>':
          return compared > 0;
        case '>=':
          return compared >= 0;
        case '<':
          return compared < 0;
        case '<=':
          return compared <= 0;
      }
    });
  });
}
