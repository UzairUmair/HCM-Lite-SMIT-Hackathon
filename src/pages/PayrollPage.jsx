import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Card, EmptyState, PageHeader } from '../components/Common';
import { useApp } from '../context/AppContext';
import { companyService, friendlyError, payrollService, peopleService } from '../services/api';

function money(value) { return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(Number(value) || 0); }

export default function PayrollPage({ page }) {
  const { role, account } = useApp();
  const payslips = page === 'payslips';
  const salary = page === 'salaries';
  const [month, setMonth] = useState(() => { const date = new Date(); date.setUTCMonth(date.getUTCMonth() - 1); return date.toISOString().slice(0, 7); });
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [selected, setSelected] = useState('');
  const [basic, setBasic] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirm, setConfirm] = useState(false);
  const activeEmployee = useMemo(() => employees.find(item => item.id === selected), [employees, selected]);

  async function refresh() {
    setLoading(true); setError('');
    try {
      if (payslips) setRecords(await payrollService.payslips(account.uid));
      else {
        const [people, runs] = await Promise.all([peopleService.list(), payrollService.list()]);
        setEmployees(people.filter(item => item.status === 'Active'));
        setRecords(runs);
      }
    } catch (cause) { setError(friendlyError(cause)); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, [page, account?.uid]);
  async function selectEmployee(id) {
    setSelected(id); setBasic(''); setError('');
    if (!id) return;
    try { const record = await peopleService.getSalary(id); setBasic(record?.basic ?? ''); }
    catch (cause) { setError(friendlyError(cause)); }
  }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    try { await payrollService.saveSalary({ id: selected, basic: Number(basic) }); setSuccess('Salary structure saved.'); }
    catch (cause) { setError(friendlyError(cause)); }
    finally { setBusy(false); }
  }
  async function generate() { setBusy(true); setError(''); setSuccess(''); try { await payrollService.generate({ month }); setSuccess('Payroll draft generated. Review each line before finalizing.'); await refresh(); } catch (cause) { setError(friendlyError(cause)); } finally { setBusy(false); } }
  async function finalize() { setBusy(true); setError(''); setSuccess(''); try { await payrollService.finalize({ month }); setConfirm(false); setSuccess('Payroll finalized and payslips released.'); await refresh(); } catch (cause) { setError(friendlyError(cause)); } finally { setBusy(false); } }
  async function download(slip) { setError(''); try { const [company, { downloadPayslipPdf }] = await Promise.all([companyService.get(), import('../utils/payslipPdf')]); downloadPayslipPdf(slip, company?.name || 'HCM Lite'); } catch (cause) { setError(friendlyError(cause)); } }
  const visible = records.filter(item => item.month === month);
  const run = !payslips ? visible[0] : null;
  return <><PageHeader title={payslips ? 'My payslips' : salary ? 'Salary management' : 'Payroll workspace'} subtitle={payslips ? 'Your finalized salary statements.' : 'Review verified salary data and monthly payroll status.'} action={<TextField label="Month" type="month" size="small" value={month} onChange={event => setMonth(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />} />
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
    {!payslips && <Alert severity="info" sx={{ mb: 3 }}>Tax uses the Saylani challenge's illustrative slabs. Drafts can be generated only for completed months. A day without a check-in is absent; a missing check-out counts as half a day. Review the draft before finalization.</Alert>}
    {salary && role === 'hr' && <Card title="Set an employee's basic salary" sx={{ mb: 3 }}><Box component="form" onSubmit={save}><Stack sx={{ gap: 2, maxWidth: 480 }}><TextField select label="Employee" required value={selected} onChange={event => selectEmployee(event.target.value)}><MenuItem value="">Select an employee</MenuItem>{employees.map(item => <MenuItem key={item.id} value={item.id}>{item.fullName} · {item.employeeCode}</MenuItem>)}</TextField><TextField label="Basic salary (PKR)" type="number" required value={basic} onChange={event => setBasic(event.target.value)} slotProps={{ htmlInput: { min: 1, step: 0.01 } }} />{activeEmployee && basic && Number(basic) > 0 && <Typography variant="body2">Gross salary before deductions: {money(Number(basic) * 1.5)} (basic + 40% HRA + 10% medical).</Typography>}<Button type="submit" variant="contained" disabled={busy || !selected || Number(basic) <= 0}>{busy ? 'Saving…' : 'Save salary structure'}</Button></Stack></Box></Card>}
    <Card title={payslips ? 'Pay history' : 'Payroll run'} action={!payslips && (role === 'hr' ? <Button variant="contained" disabled={busy || !!run} onClick={generate}>{busy ? 'Working…' : 'Generate draft'}</Button> : role === 'admin' && run?.status === 'Draft' ? <Button variant="contained" color="success" disabled={busy} onClick={() => setConfirm(true)}>Finalize payroll</Button> : null)}>
      {loading ? <CircularProgress /> : !visible.length ? <EmptyState title={payslips ? 'No finalized payslip for this month' : 'No payroll run for this month'} text={payslips ? 'Your payslip appears after Admin finalizes payroll.' : 'HR can generate a draft for this completed month.'} /> : <><Stack direction="row" sx={{ gap: 2, mb: 2, flexWrap: 'wrap' }}><Typography variant="body2">Status: {run?.status || 'Finalized'}</Typography>{run && <Typography variant="body2">Employees: {run.lines?.length || 0} · Net total: {money(run.netTotal)}</Typography>}</Stack><Box sx={{ overflowX: 'auto' }}><Table size="small"><TableHead><TableRow>{!payslips && <TableCell>Employee</TableCell>}<TableCell>Month</TableCell><TableCell align="right">Gross payable</TableCell><TableCell align="right">Attendance deduction</TableCell><TableCell align="right">Tax</TableCell><TableCell align="right">Net</TableCell>{payslips && <TableCell>PDF</TableCell>}</TableRow></TableHead><TableBody>{(payslips ? visible : run?.lines || []).map(item => <TableRow key={item.id || item.uid}>{!payslips && <TableCell>{item.employeeName} · {item.employeeCode}</TableCell>}<TableCell>{item.month || month}</TableCell><TableCell align="right">{money(item.prorated)}</TableCell><TableCell align="right">{money(item.deduction)}</TableCell><TableCell align="right">{money(item.tax)}</TableCell><TableCell align="right">{money(item.net)}</TableCell>{payslips && <TableCell><Button size="small" onClick={() => download(item)}>Download</Button></TableCell>}</TableRow>)}</TableBody></Table></Box></>}
    </Card><Dialog open={confirm} onClose={() => !busy && setConfirm(false)}><DialogTitle>Finalize {month} payroll?</DialogTitle><DialogContent>This locks the draft and releases {run?.lines?.length || 0} payslips to employees. This action cannot be undone.</DialogContent><DialogActions><Button onClick={() => setConfirm(false)} disabled={busy}>Cancel</Button><Button color="success" variant="contained" onClick={finalize} disabled={busy}>{busy ? 'Finalizing…' : 'Finalize and release'}</Button></DialogActions></Dialog>
  </>;
}
