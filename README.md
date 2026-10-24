# HCM Lite

A React + Material UI frontend for people management. Built directly in the original workspace. There were no application files or Firebase configuration in the starting folder; the existing dependency declarations were preserved and Vite and MUI Icons were added.

## Run it

```sh
npm install
npm run dev
```

Open the displayed localhost URL. Choose **Admin**, **HR**, or **Employee** in the clearly labeled preview panel. Preview roles last for the current page session; reloading returns to sign in. They are not authenticated accounts.

```sh
npm run build
npm run preview
```

## Screens

- Authentication: sign in, forgot/reset/change password, first-login password change, four-step company setup, unauthorized and not-found pages.
- Admin: dashboard, company settings, departments, designations, leave policies, holidays, HR accounts, employees, attendance, leave overview, payroll, analytics, announcements, audit trail, AI and settings.
- HR: dashboard, directory, employee registration, attendance, correction request interface, leave inbox, salary structures, payroll drafts, analytics, announcements, AI and settings.
- Employee: dashboard, own profile, attendance calendar/history, leave balances/application, payslip layout/history, announcements, notifications, AI and settings.
- Shared: responsive sidebar/drawer, navigation search, profile menu, notifications drawer, persisted light/dark theme, accessible form labels, reduced-motion support and scrollable tables.

## What works locally

Navigation, role preview selection, dark mode, drawers, collapsible menus, profile tabs, calendar month navigation, form inputs and required/email/password/date validation, setup steps/review, CSV file selection, payslip layout preview, AI prompt selection and unavailable/retry feedback.

Search/filter/sort/pagination controls have no real records to process yet. There is no seeded HR or financial data. Unknown metrics use a dash, not an unverified zero. Table row edit/delete, approval, account reset and audit details require real selected records; the empty UI does not fabricate these records.

## UI-only operations

Authentication, secure company creation, data persistence, account provisioning, attendance recording, leave approval, import/export, payroll calculations/finalization, PDF download, publishing, notifications and AI require backend integration. Forms explicitly report that nothing was saved. Disabled controls do not claim success. AI has no hardcoded generated responses and sends nothing to an AI provider.

The payroll challenge brief was not supplied, so salary rules, deductions and tax have deliberately not been invented.

## Where things live

- `src/App.jsx`: wires the theme and page routes together.
- `src/routes/navigation.js`: the menu structure for each role.
- `src/routes/ProtectedRoute.jsx`: preview-only navigation guard.
- `src/context/AppContext.jsx`: temporary role selection and persistent theme preference.
- `src/components/Layout.jsx`: sidebar, top bar, menu and notification drawer.
- `src/components/Common.jsx`: shared cards, form fields, empty states, tables, dialogs and skeletons.
- `src/pages/`: screen modules grouped by workflow so shared screens are not duplicated for each role.
- `src/theme/theme.js`: colors, typography and MUI component defaults.
- `src/styles/global.css`: custom branding, responsive layouts and animation rules.
- `src/services/api.js`: service contracts to replace with real authenticated calls.

## Connecting Firebase later

Add your Firebase initialization in `src/firebase.js` after supplying your project configuration. Replace preview roles with Firebase Auth state and verified claims. Connect each service adapter in `src/services/api.js` to your authenticated API or permitted Firestore reads. Add loading/error/empty/success handling around those calls using the shared components.

Enforce authorization in Firebase rules and server code. Admin bootstrap and role assignment, account provisioning, server-timestamped attendance, leave quota/overlap validation, payroll calculations and finalization, and immutable audit events must use trusted server operations. Employee reads must be scoped to the authenticated employee. Never put AI provider secrets in frontend variables.

## Verification

Production build passes. Browser inspection covered login, role navigation, dashboard and directory, with viewport checks at 375, 768, 1024 and 1440 pixels. The `responsive.html` development harness lets you repeat viewport checks without adding a browser dependency; it is not part of the default production build.

`npm audit` reports four high-severity dependency entries from the existing Firebase / Firestore / gRPC dependency chain. Its suggested fix is a major Firebase downgrade, so it was not applied automatically. Review the supported upstream fix before backend integration. Firebase is not imported by this UI.
