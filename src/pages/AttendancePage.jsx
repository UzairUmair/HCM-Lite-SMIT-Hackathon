import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Card, EmptyState, PageHeader, StatCard } from '../components/Common';
import { AttendanceWidget } from './Dashboard';
import { useApp } from '../context/AppContext';
import { attendanceService, friendlyError } from '../services/api';

function displayTime(value) { return value?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '—'; }

export default function AttendancePage() {
  const { role, account } = useApp();
  const [records, setRecords] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [status, setStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: '', checkIn: '', checkOut: '', reason: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  async function refresh() { setLoading(true); try { setRecords(await attendanceService.list(role, account?.uid)); } catch (cause) { setError(friendlyError(cause)); } finally { setLoading(false); } }
  useEffect(() => { refresh(); }, [role, account?.uid]);
  const shown = useMemo(() => records.filter(row => row.dateKey?.startsWith(month) && (status === 'All' || row.status === status)), [records, month, status]);
  const [year, mon] = month.split('-').map(Number);
  const days = new Date(year, mon, 0).getDate();
  const offset = (new Date(year, mon - 1, 1).getDay() + 6) % 7;
  const byDay = Object.fromEntries(shown.map(row => [Number(row.dateKey?.slice(-2)), row]));
  async function submitCorrection(event) { event.preventDefault(); setBusy(true); setError(''); try { await attendanceService.correct(form); setOpen(false); setSuccess('Correction request sent to HR.'); } catch (cause) { setError(friendlyError(cause)); } finally { setBusy(false); } }
  return <><PageHeader title={role === 'employee' ? 'My attendance' : 'Attendance board'} subtitle="See each workday and correct mistakes." action={role !== 'admin' && <Button variant="outlined" onClick={() => setOpen(true)}>Request correction</Button>} />
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
    <Box className="stats-grid four">{['Present', 'Late', 'Half day', 'Missing checkout'].map(title => <StatCard key={title} title={title} value={loading ? '—' : records.filter(row => row.dateKey?.startsWith(month) && row.status === title).length} detail={loading ? 'Loading' : `In ${month}`} />)}</Box>
    <Box className="two-columns" sx={{ mb: 3 }}>{role === 'admin' ? <Card title="Daily overview"><Typography variant="body2">Select a month to inspect attendance records below.</Typography></Card> : <AttendanceWidget onChanged={refresh} />}<Card title="Attendance calendar" action={<TextField type="month" size="small" value={month} onChange={event => event.target.value && setMonth(event.target.value)} slotProps={{ htmlInput: { 'aria-label': 'Calendar month' } }} />}><Box className="calendar-grid">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <Typography key={index} variant="caption" sx={{ color: 'text.secondary' }}>{day}</Typography>)}{Array.from({ length: offset }, (_, index) => <span key={`o${index}`} />)}{Array.from({ length: days }, (_, index) => { const row = byDay[index + 1]; return <span key={index} className="calendar-day" title={row?.status || 'No attendance record'} style={row ? { background: row.status === 'Present' ? '#16a34a26' : '#f59e0b26', color: 'inherit', fontWeight: 700 } : {}}>{index + 1}</span>; })}</Box><Typography variant="caption" sx={{ color: 'text.secondary' }}>Shaded dates have recorded attendance.</Typography></Card></Box>
    <Card title="Daily records"><TextField label="Status" select size="small" value={status} onChange={event => setStatus(event.target.value)} sx={{ minWidth: 160, mb: 2 }}>{['All', 'Present', 'Late', 'Half day', 'Missing checkout', 'Late · missing checkout'].map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>{loading ? <CircularProgress aria-label="Loading attendance" /> : !shown.length ? <EmptyState title="No attendance records for this view" text="Try another month or status." /> : <TableContainer><Table sx={{ minWidth: 650 }}><TableHead><TableRow>{['Employee', 'Date', 'Check in', 'Check out', 'Hours', 'Status'].map(label => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead><TableBody>{shown.map(row => <TableRow key={row.id}><TableCell>{row.employeeId}</TableCell><TableCell>{row.dateKey}</TableCell><TableCell>{displayTime(row.checkInAt)}</TableCell><TableCell>{displayTime(row.checkOutAt)}</TableCell><TableCell>{row.minutes == null ? '—' : (row.minutes / 60).toFixed(1)}</TableCell><TableCell>{row.status}</TableCell></TableRow>)}</TableBody></Table></TableContainer>}</Card>
    <Dialog open={open} onClose={() => !busy && setOpen(false)} fullWidth><Box component="form" onSubmit={submitCorrection}><DialogTitle>Request an attendance correction</DialogTitle><DialogContent><Stack sx={{ gap: 2, pt: 1 }}><TextField label="Date" type="date" required value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} /><TextField label="Requested check-in" type="time" required value={form.checkIn} onChange={event => setForm({ ...form, checkIn: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} /><TextField label="Requested check-out" type="time" required value={form.checkOut} onChange={event => setForm({ ...form, checkOut: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} /><TextField label="Reason" multiline minRows={3} required value={form.reason} onChange={event => setForm({ ...form, reason: event.target.value })} />{error && <Alert severity="error">{error}</Alert>}</Stack></DialogContent><DialogActions><Button onClick={() => setOpen(false)} disabled={busy}>Cancel</Button><Button type="submit" variant="contained" disabled={busy}>{busy ? 'Sending…' : 'Send request'}</Button></DialogActions></Box></Dialog>
  </>;
}

export function CorrectionsPage() {
  const { role, account } = useApp();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function refresh() { setLoading(true); try { setRecords(await attendanceService.corrections(role, account?.uid)); } catch (cause) { setError(friendlyError(cause)); } finally { setLoading(false); } }
  useEffect(() => { refresh(); }, [role, account?.uid]);
  async function decide(decision) { setBusy(true); setError(''); try { await attendanceService.review({ id: selected.id, decision, comment }); setSelected(null); await refresh(); } catch (cause) { setError(friendlyError(cause)); } finally { setBusy(false); } }
  return <><PageHeader title="Attendance corrections" subtitle="Review requests and keep records trustworthy." />{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}<Card title="Requests">{loading ? <CircularProgress /> : !records.length ? <EmptyState title="No correction requests" text="New requests will appear here." /> : <Stack sx={{ gap: 1 }}>{records.map(row => <Stack key={row.id} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}><Box><Typography fontWeight={650}>{row.employeeId} · {row.dateKey}</Typography><Typography variant="body2">{row.reason}</Typography><Typography variant="caption">{row.status}</Typography></Box>{row.status === 'Pending' && <Button onClick={() => setSelected(row)}>Review</Button>}</Stack>)}</Stack>}</Card><Dialog open={!!selected} onClose={() => !busy && setSelected(null)}><DialogTitle>Review correction</DialogTitle><DialogContent><Typography variant="body2" sx={{ mb: 2 }}>Requested check-in: {selected?.requestedCheckIn} · Check-out: {selected?.requestedCheckOut}</Typography><TextField label="Comment" multiline minRows={2} fullWidth value={comment} onChange={event => setComment(event.target.value)} />{error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}</DialogContent><DialogActions><Button onClick={() => setSelected(null)}>Cancel</Button><Button color="error" disabled={busy} onClick={() => decide('Rejected')}>Reject</Button><Button variant="contained" disabled={busy} onClick={() => decide('Approved')}>Approve request</Button></DialogActions></Dialog></>;
}
