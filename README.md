# @lp-labs/semver-range

Strict Semantic Versioning 2.0.0 parsing, precedence comparison, and a deliberately small range
language. The parser accepts complete `major.minor.patch` versions only; it does not guess missing
components or implement the entire npm range grammar. This package has no runtime or peer dependencies.

## Install and quick start

```bash
npm install @lp-labs/semver-range
```

```js
import { compareSemVer, parseSemVer, satisfiesRange } from '@lp-labs/semver-range';

if (compareSemVer('1.2.0-rc.2', '1.2.0') >= 0) throw new Error('Prerelease ordering failed');
const version = parseSemVer('2.4.1');
if (!satisfiesRange(`${version.major}.${version.minor}.${version.patch}`, '^2.0.0')) {
  throw new Error('Expected supported major version');
}
```

Node.js 18+ consumers can use ESM imports or CommonJS `require('@lp-labs/semver-range')`.
TypeScript declarations are provided for both entry points.

## Public API

- `parseSemVer(input): SemVer` validates a strict version and returns a frozen value with numeric
  `major`, `minor`, `patch`, and frozen `prerelease` and `build` identifier arrays.
- `compareSemVer(left, right): number` returns -1, 0, or 1 using SemVer precedence. Build metadata
  does not affect precedence. Numeric prerelease identifiers are ordered numerically.
- `parseRange(input): ParsedRange` parses immutable OR alternatives whose terms are ANDed.
- `satisfiesRange(version, range): boolean` accepts range text or a previously parsed `ParsedRange`.
- Types: `SemVer`, `ComparatorOperator`, `Comparator`, and `ParsedRange`.

Range terms are `*`, strict exact versions (optionally `=`), `<`, `<=`, `>`, `>=`, `^`, or `~`.
Whitespace means AND; `||` means OR. `~1.4.2` means `>=1.4.2 <1.5.0`; caret upper bounds follow
the first nonzero component (`^0.2.3` is `<0.3.0`, `^0.0.3` is `<0.0.4`). Prereleases satisfy a
comparator set only when that set contains a prerelease comparator for the same major/minor/patch.
This avoids accidentally selecting prerelease builds through ordinary stable ranges.

```js
import { satisfiesRange } from '@lp-labs/semver-range';
if (!satisfiesRange('0.2.7', '^0.2.3 || >=1.0.0 <2.0.0')) throw new Error('Expected a match');
if (satisfiesRange('1.2.3-beta.1', '>=1.0.0')) throw new Error('Prerelease policy failed');
```

## Errors, limits, and customization

Malformed versions/ranges throw `TypeError`; unsafe numeric components, excessive comparator counts,
or oversized ranges throw `RangeError`. Versions are capped at 256 characters, range text at 2048,
and a parsed range at 128 comparators. Inputs are never coerced. To customize policy, parse the
strict version and apply application-specific predicates around `satisfiesRange`; do not reinterpret
an unsupported operator as a wildcard.

## Performance and scope

Parsing is linear in input length. Comparison is constant in version components plus prerelease
identifier count. Matching costs O(alternatives × comparators). Wildcards such as `1.x`, partial
versions, hyphen ranges, npm aliases, tags, and `workspace:` syntax are intentionally unsupported.
This is a range evaluator, not a package resolver or registry client.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
