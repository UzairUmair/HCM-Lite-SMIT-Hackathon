import test from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, query, where, setDoc, updateDoc, writeBatch, deleteDoc } from 'firebase/firestore';

test('Firestore roles protect employee, salary, payslip and audit data', async () => {
  const environment = await initializeTestEnvironment({ projectId: 'demo-hcm-lite-rules', firestore: { rules: readFileSync('firestore.rules', 'utf8') } });
  try {
    await environment.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
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
    const employee = environment.authenticatedContext('employee1', { role: 'employee', email: 'employee1@example.com' }).firestore();
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

    const newEmployee = environment.authenticatedContext('newEmployee', { email: 'new@example.com' }).firestore();
    const registration = writeBatch(newEmployee);
    registration.set(doc(newEmployee, 'users', 'newEmployee'), { uid: 'newEmployee', name: 'New Employee', email: 'new@example.com', role: 'employee', active: true, companyId: 'default', employeeId: 'newEmployee', mustChangePassword: false, createdAt: new Date() });
    registration.set(doc(newEmployee, 'employees', 'newEmployee'), { uid: 'newEmployee', role: 'employee', companyId: 'default', fullName: 'New Employee', email: 'new@example.com', employeeCode: '', phone: '', address: '', departmentId: '', designationId: '', joiningDate: '', status: 'Active', createdAt: new Date() });
    await assertFails(registration.commit());
    await assertFails(updateDoc(doc(employee, 'users', 'employee1'), { role: 'hr' }));
    await assertFails(setDoc(doc(newEmployee, 'users', 'malicious'), { uid: 'malicious', name: 'Bad', email: 'new@example.com', role: 'admin', active: true, companyId: 'default', employeeId: 'malicious', mustChangePassword: false, createdAt: new Date() }));
    await assertSucceeds(updateDoc(doc(admin, 'users', 'employee2'), { role: 'hr', updatedAt: new Date() }));
    await assertFails(updateDoc(doc(admin, 'users', 'admin1'), { role: 'employee', updatedAt: new Date() }));
    const provision = writeBatch(admin);
    provision.set(doc(admin, 'users', 'employee4'), { uid: 'employee4', companyId: 'default', role: 'employee', active: true, name: 'Provisioned Employee', email: 'employee4@example.com', employeeId: 'employee4', mustChangePassword: true, createdAt: new Date() });
    provision.set(doc(admin, 'employees', 'employee4'), { companyId: 'default', uid: 'employee4', role: 'employee', fullName: 'Provisioned Employee', email: 'employee4@example.com', employeeCode: 'EMP-004', phone: '', address: '', departmentId: 'ENG', designationId: 'DEV', joiningDate: '2026-01-01', status: 'Active', createdAt: new Date() });
    provision.set(doc(admin, 'salary_records', 'employee4'), { companyId: 'default', employeeId: 'employee4', basic: 100000, hraRate: 0.4, medicalRate: 0.1, updatedAt: new Date() });
    await assertSucceeds(provision.commit());
    const removal = writeBatch(admin);
    removal.delete(doc(admin, 'salary_records', 'employee4'));
    removal.delete(doc(admin, 'employees', 'employee4'));
    removal.delete(doc(admin, 'users', 'employee4'));
    await assertSucceeds(removal.commit());
    await assertFails(deleteDoc(doc(employee, 'users', 'employee1')));
  } finally { await environment.cleanup(); }
});
