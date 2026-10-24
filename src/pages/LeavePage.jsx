import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import { Card, EmptyState, PageHeader } from '../components/Common';
import { useApp } from '../context/AppContext';
import { companyService, friendlyError, leaveService, organizationService } from '../services/api';
import { workingDays } from '../../functions/core.js';

export default function LeavePage() {
  const { role, account } = useApp();
  const [records, setRecords] = useState([]);
  const [balance, setBalance] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [weekends, setWeekends] = useState([0, 6]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: 'annual', startDate: '', endDate: '', reason: '' });
  const [dialog, setDialog] = useState(null);
  const [selected, setSelected] = useState(null);
  const [decision, setDecision] = useState('Approved');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [days, setDays] = useState(null);
  async function refresh() {
    setLoading(true); setError('');
    try {
      const [list, currentBalance, company, holidayRows] = await Promise.all([
        leaveService.list(role, account?.uid),
        role === 'admin' ? Promise.resolve(null) : leaveService.balance(),
        companyService.get(), organizationService.list('holidays'),
      ]);
      setRecords(list); setBalance(currentBalance); setWeekends(company?.weekends || [0, 6]); setHolidays(holidayRows.map(row => row.date));
    } catch (cause) { setError(friendlyError(cause)); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, [role, account?.uid]);
  function reviewRequest(event) {
    event.preventDefault(); setError('');
    try {
      const count = workingDays(form.startDate, form.endDate, weekends, holidays);
      if (!count) throw new Error('Choose at least one working day.');
      if (form.startDate.slice(0, 4) !== form.endDate.slice(0, 4)) throw new Error('Split leave across calendar years into separate requests.');
      if (balance?.[form.type]?.remaining !== null && count > (balance?.[form.type]?.remaining ?? -1)) throw new Error('Your leave balance is insufficient.');
      setDays(count); setDialog('confirm');
    } catch (cause) { setError(cause.message); }
  }
  async function submit() { setBusy(true); setError(''); try { const result = await leaveService.submit(form); setDialog(null); setSuccess(`Leave request submitted for ${result.days} working day${result.days === 1 ? '' : 's'}.`); setForm({ type: 'annual', startDate: '', endDate: '', reason: '' }); await refresh(); } catch (cause) { setError(friendlyError(cause)); } finally { setBusy(false); } }
  async function decide() { setBusy(true); setError(''); try { await leaveService.review({ id: selected.id, decision, comment }); setDialog(null); setSuccess(`Request ${decision.toLowerCase()}.`); await refresh(); } catch (cause) { setError(friendlyError(cause)); } finally { setBusy(false); } }
  async function cancel(row) { setBusy(true); setError(''); try { await leaveService.cancel({ id: row.id }); setSuccess('Request cancelled.'); await refresh(); } catch (cause) { setError(friendlyError(cause)); } finally { setBusy(false); } }
  const canApply = role === 'employee' || role === 'hr';
  return <><PageHeader title={role === 'employee' ? 'My leave' : 'Leave requests'} subtitle={role === 'employee' ? 'Plan time away and follow your requests.' : 'Review time-off requests from your team.'} action={canApply && <Button variant="contained" startIcon={<AddRounded />} onClick={() => setDialog('apply')}>Apply for leave</Button>} />
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
    {canApply && <Box className="stats-grid four">{['annual', 'sick', 'casual', 'unpaid'].map(type => { const current = balance?.[type]; return <Card key={type} title={`${type[0].toUpperCase()}${type.slice(1)} leave`}><Typography sx={{ fontSize: 27, fontWeight: 750 }}>{loading ? '—' : type === 'unpaid' ? 'No quota' : current?.remaining ?? '—'}</Typography><Typography variant="caption" sx={{ color: 'text.secondary' }}>{type === 'unpaid' ? 'Subject to approval' : `Annual ${current?.quota ?? '—'} · Used ${current?.approved ?? '—'} · Pending ${current?.pending ?? '—'}`}</Typography>{type !== 'unpaid' && <LinearProgress variant="determinate" value={current?.quota ? Math.min(100, current.approved / current.quota * 100) : 0} sx={{ mt: 2, height: 5, borderRadius: 3 }} />}</Card>; })}</Box>}
    <Card title={role === 'employee' ? 'My requests' : 'Approval inbox'}>{loading ? <CircularProgress aria-label="Loading leave requests" /> : !records.length ? <EmptyState title="No leave requests yet" text={canApply ? 'Choose Apply for leave to create your first request.' : 'Requests will appear here.'} /> : <TableContainer><Table sx={{ minWidth: 700 }}><TableHead><TableRow>{['Employee', 'Type', 'Dates', 'Days', 'Status', 'Comment', 'Actions'].map(label => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead><TableBody>{records.map(row => <TableRow key={row.id}><TableCell>{row.employeeId || row.uid}</TableCell><TableCell>{row.type}</TableCell><TableCell>{row.startDate} – {row.endDate}</TableCell><TableCell>{row.days}</TableCell><TableCell>{row.status}</TableCell><TableCell>{row.comment || '—'}</TableCell><TableCell>{row.status === 'Pending' && role === 'hr' && row.uid !== account?.uid ? <Button size="small" onClick={() => { setSelected(row); setComment(''); setDialog('review'); }}>Review</Button> : row.status === 'Pending' && row.uid === account?.uid ? <Button size="small" color="error" disabled={busy} onClick={() => cancel(row)}>Cancel</Button> : '—'}</TableCell></TableRow>)}</TableBody></Table></TableContainer>}</Card>
    <Dialog open={dialog === 'apply'} onClose={() => !busy && setDialog(null)} fullWidth><Box component="form" onSubmit={reviewRequest}><DialogTitle>Apply for leave</DialogTitle><DialogContent><Stack sx={{ gap: 2, pt: 1 }}><TextField label="Leave type" select value={form.type} onChange={event => setForm({ ...form, type: event.target.value })}>{['annual', 'sick', 'casual', 'unpaid'].map(type => <MenuItem key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</MenuItem>)}</TextField><TextField label="Start date" type="date" required value={form.startDate} onChange={event => setForm({ ...form, startDate: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} /><TextField label="End date" type="date" required value={form.endDate} onChange={event => setForm({ ...form, endDate: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} /><TextField label="Reason" multiline minRows={3} required value={form.reason} onChange={event => setForm({ ...form, reason: event.target.value })} />{error && <Alert severity="error">{error}</Alert>}</Stack></DialogContent><DialogActions><Button onClick={() => setDialog(null)}>Cancel</Button><Button type="submit" variant="contained">Review request</Button></DialogActions></Box></Dialog>
    <Dialog open={dialog === 'confirm'} onClose={() => !busy && setDialog('apply')}><DialogTitle>Confirm leave request</DialogTitle><DialogContent><Typography>{days} working day{days === 1 ? '' : 's'} of {form.type} leave, {form.startDate} to {form.endDate}.</Typography><Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>The server will recheck weekends, holidays, overlaps and your balance before saving.</Typography>{error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}</DialogContent><DialogActions><Button onClick={() => setDialog('apply')} disabled={busy}>Back</Button><Button variant="contained" onClick={submit} disabled={busy}>{busy ? 'Sending…' : 'Submit request'}</Button></DialogActions></Dialog>
    <Dialog open={dialog === 'review'} onClose={() => !busy && setDialog(null)}><DialogTitle>Review leave request</DialogTitle><DialogContent><Typography variant="body2" sx={{ mb: 2 }}>{selected?.type} leave · {selected?.days} working days · {selected?.reason}</Typography><TextField label="Decision" select fullWidth value={decision} onChange={event => setDecision(event.target.value)} sx={{ mb: 2 }}><MenuItem value="Approved">Approve</MenuItem><MenuItem value="Rejected">Reject</MenuItem></TextField><TextField label="Comment" multiline minRows={2} fullWidth value={comment} onChange={event => setComment(event.target.value)} />{error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}</DialogContent><DialogActions><Button onClick={() => setDialog(null)}>Cancel</Button><Button variant="contained" disabled={busy} onClick={decide}>{busy ? 'Saving…' : `${decision === 'Approved' ? 'Approve' : 'Reject'} leave`}</Button></DialogActions></Dialog>
  </>;
}
