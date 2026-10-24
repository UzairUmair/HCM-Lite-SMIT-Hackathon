export const DEFAULT_POLICY = Object.freeze({ annual: 14, sick: 8, casual: 10, unpaid: null });
export const SAYLANI_TAX_BRACKETS = Object.freeze([
  { upTo: 600000, from: 0, fixed: 0, rate: 0 },
  { upTo: 1200000, from: 600000, fixed: 0, rate: 0.05 },
  { upTo: 2400000, from: 1200000, fixed: 30000, rate: 0.15 },
  { upTo: 3600000, from: 2400000, fixed: 210000, rate: 0.25 },
  { upTo: Infinity, from: 3600000, fixed: 510000, rate: 0.35 },
]);

export function isoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Enter a valid date.');
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error('Enter a valid date.');
  return date;
}

export function dateKey(timestamp, timezone) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(timestamp);
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function localMinutes(timestamp, timezone) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(timestamp);
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return Number(value.hour) * 60 + Number(value.minute);
}

export function workingDays(start, end, weekends = [0, 6], holidays = []) {
  const first = isoDate(start);
  const last = isoDate(end);
  if (first > last) throw new Error('End date must be on or after start date.');
  const blocked = new Set(holidays);
  let count = 0;
  for (const day = new Date(first); day <= last; day.setUTCDate(day.getUTCDate() + 1)) {
    if (!weekends.includes(day.getUTCDay()) && !blocked.has(day.toISOString().slice(0, 10))) count++;
  }
  return count;
}

export function overlaps(a, b) { return a.startDate <= b.endDate && b.startDate <= a.endDate; }

export function leaveBalance(type, quota, approvedDays, pendingDays = 0) {
  if (type === 'unpaid') return null;
  return Math.max(0, Number(quota) - approvedDays - pendingDays);
}

export function attendanceStatus(checkInAt, checkOutAt, timezone, officeStart = '09:00', graceMinutes = 15) {
  const [h, m] = officeStart.split(':').map(Number);
  const late = localMinutes(checkInAt, timezone) > h * 60 + m + graceMinutes;
  if (!checkOutAt) return { status: late ? 'Late · missing checkout' : 'Missing checkout', late, minutes: null };
  const minutes = Math.max(0, Math.round((checkOutAt.getTime() - checkInAt.getTime()) / 60000));
  return { status: minutes < 300 ? 'Half day' : late ? 'Late' : 'Present', late, minutes };
}

export function correctionTimes(day, checkIn, checkOut) {
  isoDate(day);
  if (![checkIn, checkOut].every(value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value))) throw new Error('Enter valid check-in and check-out times.');
  const start = new Date(`${day}T${checkIn}:00+05:00`);
  const end = new Date(`${day}T${checkOut}:00+05:00`);
  if (end <= start) throw new Error('Check-out must be after check-in on the same day.');
  return { start, end };
}

export function money(value) { return Math.round((Number(value) + Number.EPSILON) * 100) / 100; }
export function grossSalary(basic, hraRate = 0.4, medicalRate = 0.1) {
  if (!Number.isFinite(Number(basic)) || Number(basic) < 0) throw new Error('Basic salary must be non-negative.');
  return money(Number(basic) * (1 + hraRate + medicalRate));
}

export function monthlyTax(annualGross, brackets = SAYLANI_TAX_BRACKETS) {
  if (!Array.isArray(brackets) || !brackets.length) throw new Error('Tax policy is not configured.');
  const bracket = brackets.find(row => annualGross <= row.upTo) ?? brackets.at(-1);
  if (![bracket.from, bracket.fixed, bracket.rate].every(Number.isFinite)) throw new Error('Tax policy is incomplete.');
  return money((bracket.fixed + Math.max(0, annualGross - bracket.from) * bracket.rate) / 12);
}

export function payrollLine({ basic, eligibleDays, workingDayCount, absentDays = 0, unpaidDays = 0, halfDays = 0, taxBrackets = SAYLANI_TAX_BRACKETS }) {
  if (!Number.isInteger(workingDayCount) || workingDayCount <= 0) throw new Error('Working days are required.');
  if (![eligibleDays, absentDays, unpaidDays, halfDays].every(value => Number.isFinite(value) && value >= 0)) throw new Error('Payroll day counts must be non-negative.');
  if (eligibleDays > workingDayCount || absentDays + unpaidDays + halfDays > eligibleDays) throw new Error('Payroll day counts are inconsistent.');
  const gross = grossSalary(basic);
  const prorated = money(gross * eligibleDays / workingDayCount);
  const deductionDays = absentDays + unpaidDays + halfDays * 0.5;
  const deduction = money(gross * deductionDays / workingDayCount);
  const taxableGross = prorated;
  const tax = monthlyTax(taxableGross * 12, taxBrackets);
  return { gross, prorated, deduction, tax, net: money(Math.max(0, prorated - deduction - tax)) };
}

export function payrollForEmployee({ basic, joiningDate, leavingDate, month, weekends = [0, 6], holidays = [], attendance = [], leaves = [] }) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Choose a valid month.');
  const monthStart = `${month}-01`;
  const monthEnd = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).toISOString().slice(0, 10);
  const blocked = new Set(holidays);
  const dates = [];
  for (const day = isoDate(monthStart); day <= isoDate(monthEnd); day.setUTCDate(day.getUTCDate() + 1)) {
    const key = day.toISOString().slice(0, 10);
    if (!weekends.includes(day.getUTCDay()) && !blocked.has(key)) dates.push(key);
  }
  if (!dates.length) throw new Error('This month has no working days.');
  const eligible = dates.filter(date => date >= joiningDate && (!leavingDate || date <= leavingDate));
  const byDate = new Map(attendance.map(record => [record.dateKey, record]));
  let absentDays = 0, unpaidDays = 0, halfDays = 0, paidLeaveDays = 0;
  for (const date of eligible) {
    const leave = leaves.find(record => record.status === 'Approved' && record.startDate <= date && record.endDate >= date);
    if (leave) { if (leave.type === 'unpaid') unpaidDays++; else paidLeaveDays++; continue; }
    const record = byDate.get(date);
    if (!record) absentDays++;
    else if (record.status === 'Half day' || !record.checkOutAt) halfDays++;
  }
  const amounts = payrollLine({ basic, eligibleDays: eligible.length, workingDayCount: dates.length, absentDays, unpaidDays, halfDays });
  return { ...amounts, workingDays: dates.length, eligibleDays: eligible.length, absentDays, unpaidDays, halfDays, paidLeaveDays };
}

export function assertFinalizable(run) {
  if (!run || run.status !== 'Draft' || !Array.isArray(run.lines) || !run.lines.length) throw new Error('Only a non-empty draft payroll can be finalized.');
  if (run.lines.length > 200) throw new Error('Too many payslips in this run.');
  return true;
}
