import test from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';

test('Firestore roles protect employee, salary, payslip and audit data', async () => {
  const environment = await initializeTestEnvironment({ projectId: 'demo-hcm-lite-rules', firestore: { rules: readFileSync('firestore.rules', 'utf8') } });
  try {
    await environment.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      const { setDoc } = await import('firebase/firestore');
      await Promise.all([
        setDoc(doc(db, 'users', 'admin1'), { active: true, role: 'admin', companyId: 'default' }),
        setDoc(doc(db, 'users', 'hr1'), { active: true, role: 'hr', companyId: 'default' }),
        setDoc(doc(db, 'users', 'employee1'), { active: true, role: 'employee', companyId: 'default' }),
        setDoc(doc(db, 'users', 'employee2'), { active: true, role: 'employee', companyId: 'default' }),
        setDoc(doc(db, 'users', 'employee3'), { active: true, role: 'employee', companyId: 'default' }),
        setDoc(doc(db, 'employees', 'employee1'), { uid: 'employee1', companyId: 'default', phone: '1', address: '' }),
        setDoc(doc(db, 'employees', 'employee2'), { uid: 'employee2', companyId: 'default', phone: '2', address: '' }),
        setDoc(doc(db, 'employees', 'employee3'), { uid: 'employee3', companyId: 'default', phone: '3', address: '' }),
        setDoc(doc(db, 'salary_records', 'employee2'), { companyId: 'default', basic: 100000 }),
        setDoc(doc(db, 'payslips', '2026-09_employee2'), { uid: 'employee2', companyId: 'default', month: '2026-09' }),
        setDoc(doc(db, 'payslips', '2026-09_employee1'), { uid: 'employee1', companyId: 'default', month: '2026-09' }),
        setDoc(doc(db, 'audit_logs', 'log1'), { companyId: 'default', action: 'employee.create' }),
      ]);
    });
    const employee = environment.authenticatedContext('employee1', { role: 'employee' }).firestore();
    const wrongClaim = environment.authenticatedContext('employee1', { role: 'admin' }).firestore();
    const hr = environment.authenticatedContext('hr1', { role: 'hr' }).firestore();
    const admin = environment.authenticatedContext('admin1', { role: 'admin' }).firestore();
    await assertSucceeds(getDoc(doc(employee, 'employees', 'employee1')));
    await assertFails(getDoc(doc(employee, 'employees', 'employee2')));
    await assertFails(getDoc(doc(employee, 'salary_records', 'employee2')));
    await assertFails(getDoc(doc(employee, 'payslips', '2026-09_employee2')));
    await assertFails(getDoc(doc(wrongClaim, 'audit_logs', 'log1')));
    await assertSucceeds(getDocs(collection(hr, 'employees')));
    await assertSucceeds(getDocs(collection(admin, 'audit_logs')));
    await assertFails(getDocs(collection(employee, 'employees')));
    await assertSucceeds(getDocs(query(collection(employee, 'payslips'), where('uid', '==', 'employee1'))));
    await assertFails(getDocs(query(collection(employee, 'payslips'), where('uid', '==', 'employee2'))));
  } finally { await environment.cleanup(); }
});
