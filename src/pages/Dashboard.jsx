import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import PeopleOutlineRounded from '@mui/icons-material/PeopleOutlineRounded';
import EventAvailableRounded from '@mui/icons-material/EventAvailableRounded';
import BeachAccessOutlined from '@mui/icons-material/BeachAccessOutlined';
import AccountBalanceWalletOutlined from '@mui/icons-material/AccountBalanceWalletOutlined';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import { useApp } from '../context/AppContext';
import { Card, PageHeader, StatCard, EmptyState } from '../components/Common';
import { announcementService, attendanceService, auditService, dashboardService, friendlyError } from '../services/api';

export function ChartCard({ title, subtitle, children }) {
  return <Card title={title} subtitle={subtitle}>{children || <EmptyState compact title="No data yet" text="A chart will appear when records are available." />}</Card>;
}

export function AttendanceWidget({ onChanged }) {
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [activity, setActivity] = useState([]);
  const [success, setSuccess] = useState('');
  async function refresh() { setLoading(true); try { setToday((await dashboardService.get()).todayAttendance); } catch (cause) { setError(friendlyError(cause)); } finally { setLoading(false); } }
  useEffect(() => { refresh(); }, []);
  async function act(type) { setBusy(true); setError(''); setSuccess(''); try { await (type === 'in' ? attendanceService.checkIn() : attendanceService.checkOut()); await refresh(); onChanged?.(); setSuccess(type === 'in' ? 'Check-in recorded.' : 'Check-out recorded.'); } catch (cause) { setError(friendlyError(cause)); } finally { setBusy(false); } }
  const hour = value => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '— : —';
  return <Card title="Your workday" subtitle="Times are recorded by the server">
    {loading ? <CircularProgress size={24} aria-label="Loading attendance" /> : <><Stack direction="row" sx={{ justifyContent: 'space-between', my: 3, gap: 1 }}><Box><Typography variant="caption" sx={{ color: 'text.secondary' }}>CHECK IN</Typography><Typography variant="h5">{hour(today?.checkInAt)}</Typography></Box><Box><Typography variant="caption" sx={{ color: 'text.secondary' }}>CHECK OUT</Typography><Typography variant="h5">{hour(today?.checkOutAt)}</Typography></Box><Box><Typography variant="caption" sx={{ color: 'text.secondary' }}>STATUS</Typography><Typography variant="body2">{today?.status || 'Not checked in'}</Typography></Box></Stack><Stack direction="row" sx={{ gap: 1 }}><Button fullWidth variant="contained" disabled={busy || !!today?.checkInAt} onClick={() => act('in')}>Check in</Button><Button fullWidth variant="outlined" disabled={busy || !today?.checkInAt || !!today?.checkOutAt} onClick={() => act('out')}>Check out</Button></Stack></>}
    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}{success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
  </Card>;
}

export default function Dashboard() {
  const { role, account } = useApp();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function refresh() { setLoading(true); try { setData(await dashboardService.get()); } catch (cause) { setError(friendlyError(cause)); } finally { setLoading(false); } }
  useEffect(() => { refresh(); }, [role]);
  useEffect(() => { announcementService.list().then(setAnnouncements).catch(cause => setError(friendlyError(cause))); if (role === 'admin') auditService.list().then(setActivity).catch(cause => setError(friendlyError(cause))); }, [role]);
  const employee = role === 'employee';
  const hr = role === 'hr';
  const metrics = employee ? [
    ['Today’s attendance', data?.todayAttendance?.status || (loading ? '—' : 'Not checked in'), EventAvailableRounded],
    ['Hours this week', data?.weekHours == null ? '—' : `${data.weekHours}h`, AccountBalanceWalletOutlined],
    ['Annual leave left', data?.leave?.annual?.remaining ?? '—', BeachAccessOutlined],
    ['Latest payslip', data?.latestPayslip || '—', AccountBalanceWalletOutlined],
  ] : hr ? [
    ['Total employees', data?.totalEmployees, PeopleOutlineRounded],
    ['Present today', data?.presentToday, EventAvailableRounded],
    ['Late today', data?.lateToday, EventAvailableRounded],
    ['Pending leave', data?.pendingLeave, BeachAccessOutlined],
  ] : [
    ['Total employees', data?.totalEmployees, PeopleOutlineRounded],
    ['Present today', data?.presentToday, EventAvailableRounded],
    ['On leave', data?.onLeaveToday, BeachAccessOutlined],
    ['Monthly payroll', data?.monthlyPayroll ?? '—', AccountBalanceWalletOutlined],
  ];
  const actions = employee ? [['attendance', 'View attendance'], ['leaves', 'Apply for leave'], ['payslips', 'View payslips']] : hr ? [['employees', 'Find an employee'], ['employees/new', 'Add employee'], ['leaves', 'Review leave']] : [['employees', 'View people'], ['company', 'Company settings'], ['payroll', 'Review payroll']];
  return <><PageHeader title={employee ? `Welcome, ${account?.name || 'there'}.` : hr ? 'HR overview' : 'Organization overview'} subtitle={employee ? 'Your workday, made simple.' : 'The people and tasks that need your attention.'} />
    <Box className="welcome-banner"><Box><Stack direction="row" sx={{ gap: 1, alignItems: 'center', mb: 2 }}><span className="welcome-dot" /><Typography sx={{ fontSize: 10, letterSpacing: 1.5 }}>HCM LITE · SMARTER PEOPLE MANAGEMENT</Typography></Stack><Typography variant="h4" sx={{ color: '#fff' }}>{employee ? 'Ready for your workday?' : 'Your people, in focus.'}</Typography><Typography variant="body2" sx={{ color: '#c6cbe6', mt: 1 }}>{employee ? 'Check in, plan time off and stay informed.' : 'Start with one clear action. The details are always close.'}</Typography><Button onClick={() => navigate(`/${role}/${employee ? 'attendance' : hr ? 'employees/new' : 'employees'}`)} endIcon={<ArrowForwardRounded />} sx={{ bgcolor: '#fff', color: '#242c55', mt: 3, '&:hover': { bgcolor: '#eeeaff' } }}>{employee ? 'View attendance' : hr ? 'Add employee' : 'View people'}</Button></Box><div className="banner-art" aria-hidden="true"><div className="banner-ring" /><div className="banner-ring small" /><div className="banner-tile"><PeopleOutlineRounded sx={{ fontSize: 44 }} /></div></div></Box>
    {error && <Alert severity="error" sx={{ my: 2 }}>{error}<Button size="small" onClick={refresh}>Retry</Button></Alert>}
    <Box className="section-label"><Typography variant="h6">At a glance</Typography><Typography variant="caption" sx={{ color: 'text.secondary' }}>Live workspace data</Typography></Box>
    <Box className="stats-grid four">{metrics.map(([title, value, icon]) => <StatCard key={title} title={title} value={loading ? '—' : value ?? '—'} icon={icon} detail={loading ? 'Loading…' : 'From your workspace'} />)}</Box>
    <Box className="dashboard-columns"><Stack sx={{ gap: 3 }}>{employee || hr ? <AttendanceWidget onChanged={refresh} /> : <Card title="Recent activity">{activity.length ? <Stack sx={{ gap: 1 }}>{activity.slice(0, 4).map(item => <Typography key={item.id} variant="body2">{item.action} · {item.entity}</Typography>)}</Stack> : <EmptyState compact title="No activity yet" text="Recorded actions will appear here." />}</Card>}<Card title={hr ? 'Needs your attention' : employee ? 'Your next steps' : 'Quick actions'}><Stack sx={{ gap: 1 }}>{actions.map(([path, label]) => <Button key={path} className="quick-action" onClick={() => navigate(`/${role}/${path}`)} endIcon={<ArrowForwardRounded />}>{label}</Button>)}</Stack></Card></Stack><Stack sx={{ gap: 3 }}><Box className="ai-insight"><Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}><AutoAwesomeOutlined sx={{ color: '#a59cff' }} /><Typography variant="h6">A smarter perspective</Typography><Chip label="AI" size="small" sx={{ ml: 'auto' }} /></Stack><Typography variant="body2" sx={{ color: '#bfc8df', mt: 2 }}>Ask about the records your role can see.</Typography><Button fullWidth onClick={() => navigate(`/${role}/ai-assistant`)} sx={{ color: '#fff', border: '1px solid #ffffff26', mt: 3 }}>Open AI Assistant</Button></Box><Card title="Announcements">{announcements.length ? <Stack sx={{ gap: 1 }}>{announcements.slice(0, 3).map(item => <Box key={item.id}><Typography sx={{ fontWeight: 700 }}>{item.title}</Typography><Typography variant="body2" color="text.secondary">{item.message.slice(0, 120)}</Typography></Box>)}</Stack> : <EmptyState compact title="Nothing new yet" text="Company updates will appear here." />}<Button onClick={() => navigate(`/${role}/announcements`)}>View announcements</Button></Card></Stack></Box>
  </>;
}
