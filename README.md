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

4. Create the first Admin using a trusted local environment with Application Default Credentials:

   ```powershell
   $env:HCM_BOOTSTRAP_EMAIL='admin@example.com'
   $env:HCM_BOOTSTRAP_PASSWORD='a-long-unique-password'
   npm run bootstrap --prefix functions
   ```

5. Run locally:

   ```powershell
   npm run dev
   ```

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
| Authentication and roles | Implemented | Firebase Auth, custom role claims plus a verified active `users` document, reset password and forced first-password change. |
| Admin and HR provisioning | Implemented | Trusted Cloud Functions create HR and employee accounts, set claims, reserve employee codes and reveal generated temporary passwords once. |
| Organization and people | Implemented | Company, departments, designations, holidays, leave policies, employee search, filtering, pagination, CSV validation/import/export, status controls and HR account controls. |
| Attendance | Implemented | Server timestamps for check-in/out, late and half-day rules, correction request/review, immutable originals retained when corrections are approved. |
| Leave | Implemented | Balance calculation, working-day and holiday checks, overlap prevention, approval, rejection, cancellation and notifications. |
| Payroll | Implemented and unit tested | Server-side drafts use the supplied illustrative tax brackets, proration, absences, unpaid leave and half days. Admin-only finalization locks a run and releases payslips. |
| Payslips | Implemented and unit tested | Employees can download finalized-only PDFs from their own records. |
| Announcements and notifications | Implemented | Staff publish/edit announcements, users receive notifications and can mark their own notifications as read. |
| Analytics and dashboards | Implemented | Dashboard KPIs and analytics are populated from Firestore records; empty states are shown when no data exists. |
| AI assistant | Implemented but needs provider secret | Cloud Function uses a Groq secret, role-aware tool calls, server-side rate limiting and timeouts. Configure `GROQ_API_KEY` before deployment. |
| Firestore rules | Implemented and emulator tested | Direct client changes are restricted; payroll, audit and sensitive account operations are server-side. |

## Security model

Firebase Authentication is used instead of a custom bcrypt/JWT implementation. The role is checked both in custom claims and the active Firestore profile. Cloud Functions own account creation, attendance writes, leave decisions, payroll calculations, finalization, audit records and AI access. Firestore Rules prevent a client from changing a role, salary, payroll, audit record or another employee’s private record.

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

The function tests cover working days, leave overlap/balances, attendance status and correction timestamps, each supplied tax boundary, deduction rules, joining-date proration, payroll locking and finalized-only PDF generation. Rules tests cover employee isolation, protected salaries/payslips/audits, staff access and correctly scoped employee payslip queries.

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

“HCM Lite mein Admin company aur HR accounts manage karta hai. HR employee add karta hai, attendance aur leave approve karta hai. Employee apni attendance, leave balance aur finalized payslip dekh sakta hai. Sensitive kaam browser se direct nahi hotay; Cloud Functions server par validation karti hain. Is liye employee role ya salary change nahi kar sakta. Payroll mein basic ka 40% HRA aur 10% medical add hota hai, phir attendance, unpaid leave aur Saylani ke tax slabs apply hotay hain. Finalize ke baad payroll lock ho jata hai.”
