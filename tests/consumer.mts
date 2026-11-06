import {
  parseRange,
  parseSemVer,
  satisfiesRange,
  type ParsedRange,
  type SemVer,
} from '@lp-labs/semver-range';
const version: SemVer = parseSemVer('1.2.3');
const range: ParsedRange = parseRange('^1.0.0');
const accepted: boolean = satisfiesRange('1.2.3', range);
// @ts-expect-error versions are provided as strings.
parseSemVer(12);
void [version, accepted];
