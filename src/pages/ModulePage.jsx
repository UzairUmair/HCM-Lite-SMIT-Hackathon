import { EmptyState } from '../components/Common';
import { useApp } from '../context/AppContext';
import { navigation } from '../routes/navigation';
import ManagementPage, { management } from './ManagementPage';
import FormsPage from './FormsPage';
import AttendancePage, { CorrectionsPage } from './AttendancePage';
import LeavePage from './LeavePage';
import PayrollPage from './PayrollPage';
import CommunicationPage from './CommunicationPage';
import AnalyticsPage from './AnalyticsPage';
export default function ModulePage({
  page
}) {
  const {
    role
  } = useApp();
  const allowed = navigation[role].some(group => group.slice(1).some(([path]) => path === page)) || page === 'profile' && role !== 'employee';
  if (!allowed) return <EmptyState title="This page isn’t available for your role" text="Choose a page from your workspace navigation." />;
  if (page === 'corrections') return <CorrectionsPage />;
  if (management[page]) return <ManagementPage key={page} page={page} />;
  if (['company', 'leave-policies', 'employees/new', 'profile', 'settings'].includes(page)) return <FormsPage key={page} page={page} />;
  if (page === 'attendance') return <AttendancePage />;
  if (page === 'leaves') return <LeavePage />;
  if (['payroll', 'payslips', 'salaries'].includes(page)) return <PayrollPage key={page} page={page} />;
  if (['announcements', 'notifications'].includes(page)) return <CommunicationPage key={page} page={page} />;
  if (page === 'analytics') return <AnalyticsPage />;
  return <EmptyState title="Page unavailable" text="This page has not been connected yet." />;
}
