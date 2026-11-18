// Tests for the shared Sunday-to-Saturday week helpers (src/lib/week.ts).
//   npm test   (Node's built-in runner; Node ≥ 23.6 loads .ts directly)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addWeeks, currentWeekStart, formatWeekRange, getWeekEnd, getWeekStart, isWeekStart, weekDays,
} from '../src/lib/week.ts';

test('a Sunday is its own week start', () => {
  assert.equal(getWeekStart('2026-11-15'), '2026-11-15'); // Sunday
  assert.equal(isWeekStart('2026-11-15'), true);
});

test('a Saturday belongs to the Sunday six days before', () => {
  assert.equal(getWeekStart('2026-11-21'), '2026-11-15'); // Saturday
  assert.equal(getWeekEnd('2026-11-15'), '2026-11-21');
  assert.equal(isWeekStart('2026-11-21'), false);
});

test('mid-week days map to the Sunday on or before them', () => {
  for (const d of ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20']) {
    assert.equal(getWeekStart(d), '2026-11-15', d);
  }
});

test('a week across a month boundary', () => {
  assert.equal(getWeekStart('2026-12-02'), '2026-11-29');
  assert.deepEqual(weekDays('2026-11-29'), ['2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05']);
  assert.equal(formatWeekRange('2026-11-29', 'id'), '29 Nov – 5 Des 2026');
  assert.equal(formatWeekRange('2026-11-29', 'en'), '29 Nov – 5 Dec 2026');
});

test('a week across a year boundary', () => {
  assert.equal(getWeekStart('2027-01-01'), '2026-12-27'); // Friday
  assert.equal(getWeekStart('2027-01-02'), '2026-12-27'); // Saturday
  assert.equal(getWeekStart('2027-01-03'), '2027-01-03'); // Sunday
  assert.equal(getWeekEnd('2026-12-27'), '2027-01-02');
  assert.equal(formatWeekRange('2026-12-27', 'id'), '27 Des 2026 – 2 Jan 2027');
  assert.equal(formatWeekRange('2026-12-27', 'en'), '27 Dec 2026 – 2 Jan 2027');
});

test('range within one month', () => {
  assert.equal(formatWeekRange('2026-11-15', 'id'), '15–21 Nov 2026');
  assert.match(formatWeekRange('2026-11-15', 'en'), /^15\s?–\s?21 Nov 2026$/);
});

test('instants are converted to the Jakarta calendar day first', () => {
  // Sat 21 Nov 2026 20:00 UTC = Sun 22 Nov 03:00 in Jakarta -> next week
  assert.equal(getWeekStart(new Date('2026-11-21T20:00:00Z')), '2026-11-22');
  assert.equal(currentWeekStart(new Date('2026-11-21T16:59:00Z')), '2026-11-15'); // Sat 23:59 WIB
  assert.equal(currentWeekStart(new Date('2026-11-21T17:00:00Z')), '2026-11-22'); // Sun 00:00 WIB
});

test('addWeeks steps Sunday to Sunday, across a year', () => {
  assert.equal(addWeeks('2026-12-27', 1), '2027-01-03');
  assert.equal(addWeeks('2027-01-03', -1), '2026-12-27');
  assert.equal(isWeekStart(addWeeks('2026-11-15', 7)), true);
});

test('rejects malformed dates', () => {
  assert.throws(() => getWeekStart('18-11-2026'));
});
