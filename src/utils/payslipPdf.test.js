import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPayslipPdf } from './payslipPdf.js';

test('only finalized records create a valid payslip PDF', () => {
  const slip = { status: 'Finalized', month: '2026-09', employeeName: 'Ayesha Khan', employeeCode: 'E-01', basic: 100000, gross: 150000, prorated: 150000, deduction: 0, tax: 10000, net: 140000 };
  const output = buildPayslipPdf(slip, 'Demo Company').output();
  assert.match(output.slice(0, 8), /^%PDF-/);
  assert.ok(output.length > 1000);
  assert.throws(() => buildPayslipPdf({ ...slip, status: 'Draft' }), /finalized/);
});
