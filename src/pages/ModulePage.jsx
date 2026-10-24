import { useState } from 'react';
import { Button, Stack, TextField, MenuItem, Alert } from '@mui/material';
import { Card, PageHeader, EmptyState, FormDialog } from '../components/Common';
import { useApp } from '../context/AppContext';
import { navigation } from '../routes/navigation';
import ManagementPage, { management } from './ManagementPage';
import FormsPage from './FormsPage';
import AttendancePage from './AttendancePage';
import LeavePage from './LeavePage';
import PayrollPage from './PayrollPage';
import { ChartCard } from './Dashboard';
export default function ModulePage({
  page
}) {
  const {
    role
  } = useApp();
  const [open, setOpen] = useState(false);
  const allowed = navigation[role].some(group => group.slice(1).some(([path]) => path === page)) || page === 'profile' && role !== 'employee';
  if (!allowed) return <EmptyState title="This page isn’t available for your role" text="Choose a page from your workspace navigation." />;
  if (management[page]) return <ManagementPage key={page} page={page} />;
  if (['company', 'leave-policies', 'employees/new', 'profile', 'settings'].includes(page)) return <FormsPage key={page} page={page} />;
  if (page === 'attendance') return <AttendancePage />;
  if (page === 'leaves') return <LeavePage />;
  if (['payroll', 'payslips', 'salaries'].includes(page)) return <PayrollPage key={page} page={page} />;
  if (page === 'analytics') return <><PageHeader title="People analytics" subtitle="Find the patterns. Understand your people." action={<TextField select size="small" defaultValue="month" label="Period"><MenuItem value="month">This month</MenuItem><MenuItem value="year">This year</MenuItem></TextField>} /><div className="two-columns">{['Employee headcount by department', 'Attendance trend', 'Payroll cost by department', 'Leave distribution', 'Employee tenure distribution', ...(role === 'hr' ? ['Department attendance', 'Top late-comers', 'Absenteeism summary'] : [])].map((title, i) => <ChartCard key={title} title={title} type={i === 3 ? 'donut' : 'bars'} />)}</div></>;
  const announcements = page === 'announcements';
  return <><PageHeader title={announcements ? 'The company noticeboard' : 'Your notifications'} subtitle={announcements ? 'Important updates. Shared moments. A more connected team.' : 'Stay close to what matters in your workday.'} action={announcements && role !== 'employee' && <Button variant="contained" onClick={() => setOpen(true)}>Create announcement</Button>} /><Card title={announcements ? 'Latest updates' : 'All notifications'}><Stack direction="row" sx={{
        gap: 2
      }}><TextField label="Search updates" size="small" /><TextField select label="Filter" size="small" defaultValue="all" sx={{
          minWidth: 130
        }}><MenuItem value="all">All updates</MenuItem><MenuItem value="unread">Unread</MenuItem><MenuItem value="important">Important</MenuItem></TextField></Stack><EmptyState title={announcements ? 'A place for your shared story' : 'Nothing to catch up on yet'} text={announcements ? 'Published announcements will include the author, date, priority and read status.' : 'Leave decisions, new payslips and company announcements will appear here.'} /></Card><FormDialog title="Create announcement" fields={['Title', 'Message', ['Priority', 'text', ['Normal', 'Important', 'Urgent']]]} open={open} onClose={() => setOpen(false)} /></>;
}
