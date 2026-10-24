import test from 'node:test';
import assert from 'node:assert/strict';
import { assertFinalizable, attendanceStatus, correctionTimes, dateKey, grossSalary, leaveBalance, monthlyTax, overlaps, payrollLine, payrollForEmployee, workingDays, SAYLANI_TAX_BRACKETS } from './core.js';

test('working days exclude weekends and configured holidays', () => {
  assert.equal(workingDays('2026-10-23', '2026-10-27', [0, 6], ['2026-10-26']), 2);
  assert.throws(() => workingDays('2026-10-28', '2026-10-27'), /End date/);
});

test('overlapping leave includes shared endpoints', () => {
  assert.equal(overlaps({ startDate: '2026-10-25', endDate: '2026-10-27' }, { startDate: '2026-10-27', endDate: '2026-10-28' }), true);
  assert.equal(overlaps({ startDate: '2026-10-25', endDate: '2026-10-26' }, { startDate: '2026-10-27', endDate: '2026-10-28' }), false);
  assert.equal(leaveBalance('sick', 8, 3, 2), 3);
  assert.equal(leaveBalance('unpaid', null, 50), null);
});

test('attendance uses company timezone and resolves half day before late', () => {
  const checkIn = new Date('2026-10-26T04:16:00Z'); // 09:16 in Karachi
  assert.equal(dateKey(checkIn, 'Asia/Karachi'), '2026-10-26');
  const short = attendanceStatus(checkIn, new Date('2026-10-26T08:00:00Z'), 'Asia/Karachi');
  assert.equal(short.status, 'Half day');
  assert.equal(short.late, true);
  assert.equal(attendanceStatus(new Date('2026-10-26T04:15:00Z'), new Date('2026-10-26T11:00:00Z'), 'Asia/Karachi').status, 'Present');
});

test('correction times validate local order and convert to trusted timestamps', () => {
  assert.equal(correctionTimes('2026-10-26', '09:00', '17:00').start.toISOString(), '2026-10-26T04:00:00.000Z');
  assert.throws(() => correctionTimes('2026-10-26', '17:00', '09:00'), /after check-in/);
  assert.throws(() => correctionTimes('2026-10-26', 'bad', '17:00'), /valid/);
});

test('official illustrative tax slab boundaries are continuous', () => {
  assert.equal(grossSalary(100000), 150000);
  assert.throws(() => monthlyTax(1200000, []), /Tax policy/);
  assert.equal(SAYLANI_TAX_BRACKETS.length, 5);
  assert.equal(monthlyTax(600000), 0);
  assert.equal(monthlyTax(600001), 0);
  assert.equal(monthlyTax(1200000), 2500);
  assert.equal(monthlyTax(1200001), 2500.01);
  assert.equal(monthlyTax(2400000), 17500);
  assert.equal(monthlyTax(2400001), 17500.02);
  assert.equal(monthlyTax(3600000), 42500);
  assert.equal(monthlyTax(3600001), 42500.03);
});

test('salary applies absence and half-day deductions after joiner proration', () => {
  assert.deepEqual(payrollLine({ basic: 100000, eligibleDays: 20, workingDayCount: 20, absentDays: 1, halfDays: 1 }), {
    gross: 150000,
    prorated: 150000,
    deduction: 11250,
    tax: 10000,
    net: 128750,
  });
  assert.deepEqual(payrollLine({ basic: 40000, eligibleDays: 10, workingDayCount: 20, unpaidDays: 1 }), { gross: 60000, prorated: 30000, deduction: 3000, tax: 0, net: 27000 });
  assert.throws(() => payrollLine({ basic: 100, eligibleDays: 2, workingDayCount: 1 }), /inconsistent/);
});

test('monthly employee calculation respects holidays, paid leave, unpaid leave and missing checkout', () => {
  const month = '2026-10';
  const record = payrollForEmployee({ basic: 40000, joiningDate: '2026-10-26', month, holidays: ['2026-10-27'], attendance: [
    { dateKey: '2026-10-26', status: 'Present', checkOutAt: new Date() },
    { dateKey: '2026-10-28', status: 'Missing checkout', checkOutAt: null },
  ], leaves: [{ startDate: '2026-10-29', endDate: '2026-10-29', type: 'annual', status: 'Approved' }, { startDate: '2026-10-30', endDate: '2026-10-30', type: 'unpaid', status: 'Approved' }] });
  assert.equal(record.eligibleDays, 4);
  assert.equal(record.paidLeaveDays, 1);
  assert.equal(record.unpaidDays, 1);
  assert.equal(record.halfDays, 1);
  assert.equal(record.absentDays, 0);
  assert.equal(record.net, record.prorated - record.deduction - record.tax);
});

test('payroll finalization accepts a draft once and rejects locked or empty runs', () => {
  assert.equal(assertFinalizable({ status: 'Draft', lines: [{ uid: 'one' }] }), true);
  assert.throws(() => assertFinalizable({ status: 'Finalized', lines: [{ uid: 'one' }] }), /draft/);
  assert.throws(() => assertFinalizable({ status: 'Draft', lines: [] }), /non-empty/);
});
