import { compareSemVer, parseRange, type ComparatorOperator } from '@lp-labs/semver-range';
const op: ComparatorOperator = '>=';
const result: number = compareSemVer('1.0.0', '2.0.0');
parseRange('*');
// @ts-expect-error unsupported comparator.
const bad: ComparatorOperator = '>>';
void [op, result, bad];
