import { createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword, sendPasswordResetEmail, updatePassword, signOut, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, runTransaction, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions, firebaseConfigured, provisioningAuth } from '../firebase';

export class ServiceUnavailableError extends Error {
  constructor() { super('Firebase is not configured. No changes were saved.'); }
}
function ready() { if (!firebaseConfigured) throw new ServiceUnavailableError(); }
export function friendlyError(error) {
  const code = String(error?.code || '');
  if (typeof error?.message === 'string' && error.message.startsWith('HCM:')) return error.message.slice(4);
  if (['Please enter your full name.', 'Please enter a valid email address.', 'Use a password of at least 12 characters.', 'We could not finish setting up your account. Please try again.'].includes(error?.message)) return error.message;
  const known = {
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/network-request-failed': 'Unable to connect. Check your internet connection and try again.',
    'auth/requires-recent-login': 'For security, sign in again before changing your password.',
    'auth/user-disabled': 'This account is disabled. Contact your administrator.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/email-already-in-use': 'That email is already in use.',
    'permission-denied': 'You do not have permission to perform this action.',
    'functions/permission-denied': 'You do not have permission to perform this action.',
    'functions/unauthenticated': 'Please sign in again.',
    'functions/already-exists': 'A matching record already exists.',
    'functions/failed-precondition': 'This action cannot be completed in its current state.',
    'functions/resource-exhausted': 'Too many requests. Please try again later.',
    'unavailable': 'The service is unavailable. Please try again.',
    'functions/unavailable': 'The service is unavailable. Please try again.',
  };
  return error instanceof ServiceUnavailableError ? error.message : known[code] || 'Something went wrong. Please try again.';
}
async function call(name, data = {}) { ready(); return (await httpsCallable(functions, name)(data)).data; }
async function rows(name, clauses = [], max = 100) {
  ready();
  const result = await getDocs(query(collection(db, name), ...clauses, limit(max)));
  return result.docs.map(d => ({ id: d.id, ...d.data() }));
}
function temporaryPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes, value => 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789-_'.charAt(value % 60)).join('');
}
async function createManagedAccount(data, role) {
  ready();
  const fullName = String(data.fullName || '').trim();
  const email = String(data.email || '').trim().toLowerCase();
  if (!fullName) throw new Error('Please enter your full name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Please enter a valid email address.');
  if (role === 'employee' && (!data.employeeCode || !data.departmentId || !data.designationId || !data.joiningDate || !(Number(data.basicSalary) > 0))) throw new Error('Complete the required employee details.');
  const secondaryAuth = provisioningAuth();
  const password = temporaryPassword();
  const created = await createUserWithEmailAndPassword(secondaryAuth, email, password);
  try {
    const uid = created.user.uid;
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', uid), { uid, companyId: 'default', role, active: true, name: fullName, email, employeeId: uid, mustChangePassword: true, createdAt: serverTimestamp() });
    if (role === 'employee') {
      batch.set(doc(db, 'employees', uid), { companyId: 'default', uid, role, fullName, email, employeeCode: String(data.employeeCode).trim().toUpperCase(), phone: String(data.phone || '').trim(), address: String(data.address || '').trim(), departmentId: data.departmentId, designationId: data.designationId, joiningDate: data.joiningDate, status: 'Active', createdAt: serverTimestamp() });
      batch.set(doc(db, 'salary_records', uid), { companyId: 'default', employeeId: uid, basic: Number(data.basicSalary), hraRate: 0.4, medicalRate: 0.1, updatedAt: serverTimestamp() });
    } else {
      batch.set(doc(db, 'employees', uid), { companyId: 'default', uid, role, fullName, email, employeeCode: `HR-${uid.slice(0, 10).toUpperCase()}`, phone: String(data.phone || '').trim(), address: '', departmentId: String(data.departmentId || 'HR').trim(), designationId: 'HR Manager', joiningDate: new Date().toISOString().slice(0, 10), status: 'Active', createdAt: serverTimestamp() });
    }
    await batch.commit();
    return { uid, temporaryPassword: password };
  } catch (error) {
    await deleteUser(created.user).catch(() => {});
    throw error;
  }
}
async function localDashboard() {
  ready();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Please sign in again.');
  const profile = (await getDoc(doc(db, 'users', uid))).data();
  const today = new Date().toISOString().slice(0, 10);
  if (profile?.role === 'employee') {
    const [attendance, leaves, payslips] = await Promise.all([rows('attendance', [where('uid', '==', uid)], 31), rows('leaves', [where('uid', '==', uid)], 100), rows('payslips', [where('uid', '==', uid)], 24)]);
    return { todayAttendance: attendance.find(row => row.dateKey === today) || null, weekHours: null, leave: { annual: { remaining: '—' } }, latestPayslip: payslips[0]?.month || null };
  }
  const [employees, attendance, leaves, payroll] = await Promise.all([rows('employees', [], 300), rows('attendance', [], 300), rows('leaves', [], 300), getDoc(doc(db, 'payroll_runs', today.slice(0, 7)))]);
  const activeEmployees = employees.filter(row => row.role === 'employee' && row.status === 'Active');
  const todayAttendance = attendance.filter(row => row.dateKey === today);
  return { totalEmployees: employees.filter(row => row.role === 'employee').length, activeEmployees: activeEmployees.length, presentToday: todayAttendance.filter(row => ['Present', 'Late', 'Half day', 'Missing checkout', 'Late · missing checkout'].includes(row.status)).length, lateToday: todayAttendance.filter(row => row.late).length, pendingLeave: leaves.filter(row => row.status === 'Pending').length, onLeaveToday: leaves.filter(row => row.status === 'Approved' && row.startDate <= today && row.endDate >= today).length, monthlyPayroll: payroll.exists() ? payroll.data().netTotal : null };
}
export const authService = {
  async signIn({ Email, Password }) { ready(); return signInWithEmailAndPassword(auth, Email.trim(), Password); },
  async resetPassword({ Email }) { ready(); return sendPasswordResetEmail(auth, Email.trim()); },
  async verifyResetCode(code) { ready(); return verifyPasswordResetCode(auth, code); },
  async confirmReset(code, password) { ready(); return confirmPasswordReset(auth, code, password); },
  async changePassword({ Password }) { ready(); if (!auth.currentUser) throw new Error('Please sign in again.'); return updatePassword(auth.currentUser, Password); },
  async changeFirstPassword({ Password }) { return call('changeFirstPassword', { password: Password }); },
  async signOut() { if (auth) await signOut(auth); },
};
export const accountService = { update: data => call('updateOwnAccount', data) };
export const companyService = {
  async get() { ready(); const d = await getDoc(doc(db, 'companies', 'default')); return d.exists() ? { id: d.id, ...d.data() } : null; },
  save: data => call('saveCompany', data),
};
export const organizationService = {
  list: collectionName => rows(collectionName, [], 200),
  async add(collectionName, data) {
    ready();
    if (!['departments', 'designations', 'holidays', 'leave_policies'].includes(collectionName)) throw new Error('Unsupported collection.');
    const id = collectionName === 'departments' ? String(data.code).toUpperCase() : collectionName === 'leave_policies' ? 'default' : null;
    if (!id) return addDoc(collection(db, collectionName), { ...data, companyId: 'default', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    if (collectionName === 'departments' && !/^[A-Z0-9-]+$/.test(id)) throw new Error('Use letters, numbers and hyphens for the department code.');
    const ref = doc(db, collectionName, id);
    return runTransaction(db, async tx => {
      if ((await tx.get(ref)).exists()) throw new Error('A record with this code already exists.');
      tx.set(ref, { ...data, code: id, companyId: 'default', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      return id;
    });
  },
  async update(collectionName, id, data) { ready(); if (!['departments', 'designations', 'holidays', 'leave_policies'].includes(collectionName)) throw new Error('Unsupported collection.'); return updateDoc(doc(db, collectionName, id), { ...data, updatedAt: serverTimestamp() }); },
  async remove(collectionName, id) { ready(); if (!['departments', 'designations', 'holidays'].includes(collectionName)) throw new Error('Unsupported collection.'); return deleteDoc(doc(db, collectionName, id)); },
};
export const peopleService = {
  list: () => rows('employees', [where('role', '==', 'employee')], 200),
  async get(id) { ready(); const d = await getDoc(doc(db, 'employees', id)); return d.exists() ? { id: d.id, ...d.data() } : null; },
  async getSalary(id) { ready(); const d = await getDoc(doc(db, 'salary_records', id)); return d.exists() ? { id: d.id, ...d.data() } : null; },
  async updateContact(id, data) { ready(); return updateDoc(doc(db, 'employees', id), { phone: data.phone, address: data.address, updatedAt: serverTimestamp() }); },
  register: data => createManagedAccount(data, 'employee'),
  update: data => call('updateEmployee', data),
  async setActive({ id, active }) { const batch = writeBatch(db); batch.update(doc(db, 'users', id), { active, updatedAt: serverTimestamp() }); batch.update(doc(db, 'employees', id), { status: active ? 'Active' : 'Inactive', updatedAt: serverTimestamp() }); return batch.commit(); },
  importCsv: data => call('importEmployees', data),
  createHr: data => createManagedAccount(data, 'hr'),
  setHrActive: ({ uid, active }) => updateDoc(doc(db, 'users', uid), { active, updatedAt: serverTimestamp() }),
  listHr: () => rows('users', [where('role', '==', 'hr')], 100),
  listUsers: () => rows('users', [], 200),
  updateRole: (id, data) => updateDoc(doc(db, 'users', id), { ...data, updatedAt: serverTimestamp() }),
};
export const attendanceService = {
  list: (role, uid) => rows('attendance', [...(role === 'employee' ? [where('uid', '==', uid)] : []), orderBy('dateKey', 'desc')], 200),
  checkIn: () => call('checkIn'),
  checkOut: () => call('checkOut'),
  correct: data => call('requestAttendanceCorrection', data),
  review: data => call('reviewAttendanceCorrection', data),
  corrections: (role, uid) => rows('attendance_corrections', [...(role === 'employee' ? [where('uid', '==', uid)] : []), orderBy('createdAt', 'desc')], 100),
};
export const leaveService = {
  list: (role, uid) => rows('leaves', [...(role === 'employee' ? [where('uid', '==', uid)] : []), orderBy('createdAt', 'desc')], 100),
  balance: () => call('getLeaveBalance'),
  submit: data => call('requestLeave', data),
  review: data => call('reviewLeave', data),
  cancel: data => call('cancelLeave', data),
};
export const payrollService = {
  list: () => rows('payroll_runs', [orderBy('month', 'desc')], 24),
  generate: data => call('generatePayroll', data),
  finalize: data => call('finalizePayroll', data),
  saveSalary: data => call('saveSalary', data),
  payslips: (uid) => rows('payslips', [where('uid', '==', uid), orderBy('month', 'desc')], 24),
};
export const dashboardService = { get: data => import.meta.env.DEV ? localDashboard(data) : call('getDashboard', data) };
export const aiService = {
  async ask({ question, role }) {
    if (import.meta.env.DEV) {
      const response = await fetch('/api/local-ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, role }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'AI request failed.');
      return payload;
    }
    return call('askAssistant', { question });
  },
  summarize: data => call('askAssistant', data), parseLeave: data => call('parseLeave', data),
};
export const announcementService = {
  list: () => rows('announcements', [orderBy('publishedAt', 'desc')], 50),
  create: data => call('publishAnnouncement', data),
  update: data => call('editAnnouncement', data),
};
export const notificationService = {
  list: uid => rows('notifications', [where('uid', '==', uid), orderBy('createdAt', 'desc')], 50),
  async markRead(id) { ready(); return updateDoc(doc(db, 'notifications', id), { readAt: serverTimestamp() }); },
};
export const auditService = { list: () => rows('audit_logs', [orderBy('createdAt', 'desc')], 100) };
