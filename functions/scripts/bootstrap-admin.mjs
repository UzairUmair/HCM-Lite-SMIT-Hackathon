import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Run only from a trusted local machine or controlled CI. Never bundle this in the browser.
const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;
const email = process.env.HCM_BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.HCM_BOOTSTRAP_ADMIN_PASSWORD;
const companyName = process.env.HCM_BOOTSTRAP_COMPANY_NAME?.trim();
const adminName = process.env.HCM_BOOTSTRAP_ADMIN_NAME?.trim() || 'Workspace Admin';
const companyEmail = process.env.HCM_BOOTSTRAP_COMPANY_EMAIL?.trim().toLowerCase() || email;
if (!projectId || !email || !password || !companyName || password.length < 12) {
  console.error('Set FIREBASE_PROJECT_ID, HCM_BOOTSTRAP_ADMIN_EMAIL, HCM_BOOTSTRAP_ADMIN_PASSWORD (12+ chars), and HCM_BOOTSTRAP_COMPANY_NAME in your shell.');
  process.exit(1);
}
initializeApp(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST
  ? { projectId }
  : { projectId, credential: applicationDefault() });
const db = getFirestore();
const auth = getAuth();
const marker = db.doc('setup/bootstrap');
const [markerSnapshot, companySnapshot] = await Promise.all([marker.get(), db.doc('companies/default').get()]);
if (markerSnapshot.exists || companySnapshot.exists) { console.error('This workspace has already been initialized. No account was created. Sign in with the existing Admin account.'); process.exit(1); }
try {
  await auth.getUserByEmail(email);
  console.error('An Auth account already uses this email. No changes were made. Use a different email or recover that account.');
  process.exit(1);
} catch (error) {
  if (error.code !== 'auth/user-not-found') throw error;
}

let created;
try {
  created = await auth.createUser({ email, password, displayName: adminName });
  await auth.setCustomUserClaims(created.uid, { role: 'admin', companyId: 'default' });
  await db.runTransaction(async tx => {
    if ((await tx.get(marker)).exists) throw new Error('Bootstrap was completed concurrently.');
    tx.create(marker, { completedAt: FieldValue.serverTimestamp(), adminUid: created.uid });
    tx.create(db.doc('companies/default'), { companyId: 'default', name: companyName, email: companyEmail, officeStart: '09:00', officeEnd: '17:00', graceMinutes: 15, timezone: 'Asia/Karachi', weekends: [0, 6], createdAt: FieldValue.serverTimestamp() });
    tx.create(db.doc('leave_policies/default'), { companyId: 'default', annual: 14, sick: 8, casual: 10, unpaid: null, createdAt: FieldValue.serverTimestamp() });
    tx.create(db.doc(`users/${created.uid}`), { companyId: 'default', role: 'admin', active: true, name: adminName, email, employeeId: null, mustChangePassword: false, createdAt: FieldValue.serverTimestamp() });
  });
  console.log('Initial company and Admin account created. Sign in through HCM Lite.');
} catch (error) {
  if (created) await auth.deleteUser(created.uid);
  console.error('Bootstrap failed; the created Auth user was removed. Check project access and retry.');
  process.exitCode = 1;
}
