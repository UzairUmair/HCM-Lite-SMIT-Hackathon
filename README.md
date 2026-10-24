# HCM Lite

HCM Lite is a React, Material UI, Firebase Authentication and Firestore application for the Saylani HCM Lite challenge. It keeps the original visual system while turning the main Admin, HR and Employee flows into authenticated workflows.

## Local setup

1. Install dependencies:

   ```powershell
   npm install
   npm install --prefix functions
   ```

2. Copy `.env.example` to `.env.local`, then enter the Firebase Web App configuration. Do not commit `.env.local`.

3. Authenticate Firebase CLI and select the project only when you are ready to deploy:

   ```powershell
   npx firebase login
   npx firebase use hcm-lite-cff96
   ```

4. Create the first Admin once in the Firebase Console. This is the simple hackathon setup; it needs no public activation page or terminal command.

   1. Open **Firebase Console → Authentication → Users**, click **Add user**, choose Email/Password, then copy the new user's **UID**.
   2. Open **Firestore Database → Start collection**. Create collection `users`, with the document ID set to that exact UID.
   3. Add these fields (replace the example values):

      | Field | Value |
      | --- | --- |
      | `uid` | the copied UID |
      | `name` | Admin name |
      | `email` | the same Authentication email |
      | `role` | `admin` |
      | `active` | `true` (boolean) |
      | `companyId` | `default` |
      | `employeeId` | the copied UID |
      | `mustChangePassword` | `false` (boolean) |

   4. Sign in through `/login`. HCM Lite reads this protected profile and opens `/admin/dashboard`.

   There is no public signup. An Admin creates Employee accounts from **Employees → Add employee** and HR accounts from **Settings → HR accounts**. Each account receives a one-time temporary password. Admin profiles are not editable from the browser, which keeps the last Admin from being accidentally removed or demoted.

5. Run locally:

   ```powershell
   npm run dev
   ```

   Before testing Admin-created accounts against the Firebase project, publish the checked-in `firestore.rules` from **Firebase Console → Firestore Database → Rules → Publish**. The rules allow only an active Admin to create Employee or HR profiles, employee records, and initial salary records.

For emulator work, set `VITE_USE_FIREBASE_EMULATORS=true` in `.env.local`, then start the suite:

```powershell
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot'
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
npx firebase emulators:start
```

## What is implemented

| Module | Status | Details |
| --- | --- | --- |
| Backup | Complete | Original UI preserved on `backup/ui-only` at `1e45e9998cec3384304b8e6518784abab8849ffa`; ZIP is stored outside this repository. |
| Authentication and roles | Implemented | Firebase Auth, verified active Firestore profiles, login, password reset and role-based redirects. Only Admin can provision Employee and HR accounts. |
| Admin and HR provisioning | Implemented | An Admin creates HR and employee Firebase Auth accounts without replacing the Admin session. Firestore Rules restrict the profile, employee and initial salary records to active Admins; temporary passwords are shown once. |
| Organization and people | Implemented | Company, departments, designations, holidays, leave policies, employee search, filtering, pagination, CSV validation/import/export, status controls and HR account controls. |
| Attendance | Implemented | Server timestamps for check-in/out, late and half-day rules, correction request/review, immutable originals retained when corrections are approved. |
| Leave | Implemented | Balance calculation, working-day and holiday checks, overlap prevention, approval, rejection, cancellation and notifications. |
| Payroll | Implemented and unit tested | Server-side drafts use the supplied illustrative tax brackets, proration, absences, unpaid leave and half days. Admin-only finalization locks a run and releases payslips. |
| Payslips | Implemented and unit tested | Employees can download finalized-only PDFs from their own records. |
| Announcements and notifications | Implemented | Staff publish/edit announcements, users receive notifications and can mark their own notifications as read. |
| Analytics and dashboards | Implemented | Local dashboard KPIs read authorized Firestore records directly; empty states are shown when no data exists. |
| AI assistant | Local development ready | The Vite development server uses the ignored local Groq secret and provides general guidance without exposing the key. Live workspace queries remain a deployed-function feature. |
| Firestore rules | Implemented and emulator tested | Direct client changes are restricted; payroll, audit and sensitive account operations are server-side. |

## Security model

Firebase Authentication is used instead of a custom bcrypt/JWT implementation. The active `users/{uid}` Firestore profile is the shared role source for the app and Security Rules. Only an active Admin can create Employee or HR records; public signup is disabled. Users cannot edit their role; only an active Admin can change a non-Admin account between Employee and HR. Cloud Functions continue to own attendance writes, leave decisions, payroll calculations, finalization, audit records and deployed AI access. Rules prevent a client from changing salary, payroll, audit records or another employee’s private data.

The Admin provisioning flow creates the Firebase Authentication user, employment profile, salary record, and one-time temporary password together. It does not link arbitrary profiles by email.

The legacy `npm run bootstrap --prefix functions` script remains a private developer fallback. It is not linked from the application and is not required for the normal Console Admin setup above.

Required secret for AI deployment:

```powershell
npx firebase functions:secrets:set GROQ_API_KEY
```

Cloud Functions deployment generally requires Firebase Blaze billing. This project does not enable billing or deploy anything automatically. Deploy only after the project owner has enabled and approved the appropriate plan:

```powershell
npm run build
npx firebase deploy --only firestore,functions,hosting
```

## Verification

Run:

```powershell
npm run build
npm test --prefix functions
node --test src/utils/payslipPdf.test.js
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot'
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
npx firebase emulators:exec --project demo-hcm-lite-rules --only firestore "node --test tests/firestore.rules.test.mjs"
```

The function tests cover working days, leave overlap/balances, attendance status and correction timestamps, each supplied tax boundary, deduction rules, joining-date proration, payroll locking and finalized-only PDF generation. Rules tests cover employee isolation, protected salaries/payslips/audits, staff access, public Employee signup, rejected self-promotion and Admin-only HR promotion.

## Backup restoration

To view the original UI without changing current work:

```powershell
git show backup/ui-only:src/App.jsx
```

To work from the original UI in another branch, save current work first and then run:

```powershell
git switch -c restore-original backup/ui-only
```

The archive is `C:\Users\USER\Documents\hcm-lite-original-ui-backup.zip`. Extract it into a separate folder rather than over this workspace.

## Roman Urdu presentation note

“Pehla Admin Firebase Console mein banta hai: Authentication mein email/password user banao, UID copy karo, phir Firestore ke `users` collection mein us UID ka document bana kar `role: admin` aur `active: true` set karo. Phir normal `/login` se sign in karo. Public signup band hai. Admin Employees → Add employee se Employee account aur Settings → HR accounts se HR account banata hai; temporary password sirf ek dafa show hota hai. Admin `/admin/dashboard`, HR `/hr/dashboard`, aur Employee `/employee/dashboard` use karta hai.”
