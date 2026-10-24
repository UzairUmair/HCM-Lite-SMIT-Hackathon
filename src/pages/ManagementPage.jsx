import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Menu, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import MoreHorizRounded from '@mui/icons-material/MoreHorizRounded';
import FileUploadOutlined from '@mui/icons-material/FileUploadOutlined';
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';
import { Card, PageHeader, EmptyState } from '../components/Common';
import { useApp } from '../context/AppContext';
import { auditService, organizationService, peopleService, attendanceService, friendlyError } from '../services/api';

export const management = {
  departments: { title: 'Departments', subtitle: 'Give each team a place to belong.', item: 'Department', columns: ['Name', 'Code', 'Status', 'Actions'] },
  designations: { title: 'Designations', subtitle: 'Keep job titles organized.', item: 'Designation', columns: ['Job title', 'Department', 'Status', 'Actions'] },
  holidays: { title: 'Holiday calendar', subtitle: 'Plan ahead for days off.', item: 'Holiday', columns: ['Holiday', 'Date', 'Actions'] },
  'hr-accounts': { title: 'HR accounts', subtitle: 'Give your HR team the access they need.', item: 'HR account', columns: ['Name', 'Email', 'Status', 'Actions'] },
  'user-management': { title: 'User management', subtitle: 'Assign Employee or HR access for registered accounts.', columns: ['Name', 'Email', 'Role', 'Status', 'Actions'] },
  employees: { title: 'Employees', subtitle: 'Find and care for your people.', item: 'Employee', columns: ['Employee', 'Code', 'Department', 'Designation', 'Status', 'Actions'] },
  'audit-logs': { title: 'Audit trail', subtitle: 'A protected record of important actions.', columns: ['Actor', 'Action', 'Record', 'Time'] },
  corrections: { title: 'Attendance corrections', subtitle: 'Review requests to correct work records.', columns: ['Employee', 'Date', 'Reason', 'Status', 'Actions'] },
};

const blank = { name: '', code: '', departmentId: '', date: '', email: '', fullName: '', status: 'Active' };
function time(value) { return value?.toDate?.().toLocaleString() || '—'; }
function downloadCsv(records) {
  const keys = ['employeeCode', 'fullName', 'email', 'phone', 'departmentId', 'designationId', 'joiningDate', 'status'];
  const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const data = [keys.join(','), ...records.map(row => keys.map(key => quote(row[key])).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'hcm-employees.csv'; link.click(); URL.revokeObjectURL(url);
}

export default function ManagementPage({ page }) {
  const config = management[page];
  const { role } = useApp();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [queryText, setQueryText] = useState('');
  const [status, setStatus] = useState('All');
  const [department, setDepartment] = useState('All');
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState(blank);
  const [menu, setMenu] = useState(null);
  const [selected, setSelected] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState('');

  async function refresh() {
    setLoading(true); setError('');
    try {
      const list = page === 'employees' ? await peopleService.list() : page === 'hr-accounts' ? await peopleService.listHr() : page === 'user-management' ? await peopleService.listUsers() : page === 'audit-logs' ? await auditService.list() : page === 'corrections' ? await attendanceService.corrections() : await organizationService.list(page);
      setRecords(list);
    } catch (cause) { setError(friendlyError(cause)); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, [page]);
  const filtered = useMemo(() => records.filter(row => {
    const needle = queryText.toLowerCase();
    return (!needle || [row.fullName, row.name, row.email, row.code, row.employeeCode, row.action].some(value => String(value || '').toLowerCase().includes(needle)))
      && (status === 'All' || (row.status || (row.active ? 'Active' : 'Inactive')) === status)
      && (department === 'All' || row.departmentId === department);
  }), [records, queryText, status, department]);
  const departments = [...new Set(records.map(row => row.departmentId).filter(Boolean))];
  const canAdd = !!config.item && (page === 'employees' ? role === 'admin' : page === 'hr-accounts' ? role === 'admin' : role === 'admin');

  function openForm(item = null) { setSelected(item); setForm(item ? { ...blank, ...item } : blank); setDialog('form'); setError(''); }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    try {
      if (page === 'hr-accounts') {
        const result = await peopleService.createHr({ fullName: form.fullName, email: form.email, phone: form.phone, departmentId: form.departmentId });
        setTemporaryPassword(result.temporaryPassword); setDialog('password');
      } else if (page === 'employees' && selected) {
        await peopleService.update({ id: selected.id, fullName: form.fullName, phone: form.phone, address: form.address, departmentId: form.departmentId, designationId: form.designationId, joiningDate: form.joiningDate, leavingDate: form.leavingDate || '' });
        setDialog(null);
      } else if (selected) {
        await organizationService.update(page, selected.id, page === 'departments' ? { name: form.name, code: form.code, status: form.status } : page === 'holidays' ? { name: form.name, date: form.date } : { name: form.name, departmentId: form.departmentId, status: form.status });
        setDialog(null);
      } else {
        await organizationService.add(page, page === 'departments' ? { name: form.name, code: form.code, status: form.status } : page === 'holidays' ? { name: form.name, date: form.date } : { name: form.name, departmentId: form.departmentId, status: form.status });
        setDialog(null);
      }
      setSuccess(`${config.item} ${selected ? 'updated' : 'added'} successfully.`);
      await refresh();
    } catch (cause) { setError(friendlyError(cause)); }
    finally { setBusy(false); }
  }
  async function confirmAction() {
    setBusy(true); setError('');
    try {
      if (page === 'employees') await peopleService.setActive({ id: selected.id, active: selected.status !== 'Active' });
      else if (page === 'hr-accounts') await peopleService.setHrActive({ uid: selected.id, active: !selected.active });
      else if (page === 'user-management') await peopleService.updateRole(selected.id, { active: !selected.active });
      else await organizationService.remove(page, selected.id);
      setDialog(null); setSuccess('Change saved.'); await refresh();
    } catch (cause) { setError(friendlyError(cause)); }
    finally { setBusy(false); }
  }
  async function saveRole() {
    setBusy(true); setError(''); setSuccess('');
    try {
      await peopleService.updateRole(selected.id, { role: form.role });
      setDialog(null); setSuccess('Role updated. The user will receive the new access after signing in again or refreshing.'); await refresh();
    } catch (cause) { setError(friendlyError(cause)); }
    finally { setBusy(false); }
  }
  const rowCells = row => page === 'employees' ? [row.fullName, row.employeeCode, row.departmentId, row.designationId, row.status] : page === 'hr-accounts' ? [row.name, row.email, row.active ? 'Active' : 'Inactive'] : page === 'user-management' ? [row.name, row.email, String(row.role || '').toUpperCase(), row.active ? 'Active' : 'Inactive'] : page === 'departments' ? [row.name, row.code, row.status] : page === 'designations' ? [row.name, row.departmentId, row.status] : page === 'holidays' ? [row.name, row.date] : page === 'corrections' ? [row.employeeId, row.dateKey, row.reason, row.status] : [row.actorUid, row.action, row.entity, time(row.createdAt)];
  return <>
    <PageHeader title={config.title} subtitle={config.subtitle} action={canAdd && <Button variant="contained" startIcon={<AddRounded />} onClick={() => page === 'employees' ? navigate('/admin/employees/new') : openForm()}>Add {config.item}</Button>} />
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
    <Card title={`${config.title} ${loading ? '' : `(${filtered.length})`}`}>
      <Stack direction="row" sx={{ gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <TextField size="small" label="Search" value={queryText} onChange={event => { setQueryText(event.target.value); setPageNumber(0); }} />
        {!['audit-logs', 'holidays'].includes(page) && <TextField size="small" select label="Status" value={status} onChange={event => { setStatus(event.target.value); setPageNumber(0); }} sx={{ minWidth: 130 }}>{['All', 'Active', 'Inactive', 'Pending', 'Approved', 'Rejected'].map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>}
        {page === 'employees' && <TextField size="small" select label="Department" value={department} onChange={event => { setDepartment(event.target.value); setPageNumber(0); }} sx={{ minWidth: 150 }}><MenuItem value="All">All departments</MenuItem>{departments.map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>}
        {page === 'employees' && role === 'admin' && <><Button startIcon={<FileUploadOutlined />} onClick={() => navigate('/admin/employees/import')}>Import CSV</Button><Button startIcon={<FileDownloadOutlined />} disabled={!records.length} onClick={() => downloadCsv(filtered)}>Export CSV</Button></>}
      </Stack>
      {loading ? <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress aria-label="Loading records" /></Box> : !filtered.length ? <EmptyState title={`No ${config.title.toLowerCase()} found`} text={queryText ? 'Try another search.' : 'Use the Add button to create the first record.'} /> : <><TableContainer><Table size="small" sx={{ minWidth: 650 }}><TableHead><TableRow>{config.columns.map(column => <TableCell key={column}>{column}</TableCell>)}</TableRow></TableHead><TableBody>{filtered.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize).map(row => <TableRow key={row.id} hover>{rowCells(row).map((cell, index) => <TableCell key={index}>{cell || '—'}</TableCell>)}{config.columns.includes('Actions') && <TableCell><IconButton aria-label={`Actions for ${row.name || row.fullName || row.id}`} onClick={event => { setMenu(event.currentTarget); setSelected(row); }}><MoreHorizRounded /></IconButton></TableCell>}</TableRow>)}</TableBody></Table></TableContainer><TablePagination component="div" count={filtered.length} page={pageNumber} onPageChange={(_, next) => setPageNumber(next)} rowsPerPage={pageSize} onRowsPerPageChange={event => { setPageSize(Number(event.target.value)); setPageNumber(0); }} rowsPerPageOptions={[10, 25, 50]} /></>}
    </Card>
    <Menu anchorEl={menu} open={!!menu} onClose={() => setMenu(null)}>
      {page === 'employees' && <MenuItem onClick={() => { navigate(`/${role}/employees/${selected.id}`); setMenu(null); }}>View profile</MenuItem>}
      {page === 'employees' && role === 'admin' && <MenuItem onClick={() => { openForm(selected); setMenu(null); }}>Edit employee</MenuItem>}
      {page === 'user-management' && selected?.role !== 'admin' && <MenuItem onClick={() => { setForm({ role: selected.role }); setDialog('role'); setMenu(null); }}>Change role</MenuItem>}
      {['departments', 'designations', 'holidays'].includes(page) && <MenuItem onClick={() => { openForm(selected); setMenu(null); }}>Edit</MenuItem>}
      {['employees', 'hr-accounts', 'departments', 'designations', 'holidays'].includes(page) && <MenuItem onClick={() => { setDialog('confirm'); setMenu(null); }}>{page === 'employees' || page === 'hr-accounts' ? selected?.active || selected?.status === 'Active' ? 'Deactivate' : 'Activate' : 'Delete'}</MenuItem>}
      {page === 'user-management' && selected?.role !== 'admin' && <MenuItem onClick={() => { setDialog('confirm'); setMenu(null); }}>{selected?.active ? 'Deactivate' : 'Activate'}</MenuItem>}
    </Menu>
    <Dialog open={dialog === 'form'} onClose={() => !busy && setDialog(null)} fullWidth maxWidth="sm"><Box component="form" onSubmit={save}><DialogTitle>{selected ? 'Edit' : 'Add'} {config.item}</DialogTitle><DialogContent><Stack sx={{ gap: 2, pt: 1 }}>
      {page === 'hr-accounts' ? <><TextField label="Full name" required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /><TextField label="Work email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /><TextField label="Phone (optional)" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /><TextField label="Department (optional)" value={form.departmentId || ''} onChange={e => setForm({ ...form, departmentId: e.target.value })} /></> : page === 'employees' ? <><TextField label="Full name" required value={form.fullName || ''} onChange={e => setForm({ ...form, fullName: e.target.value })} /><TextField label="Phone" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /><TextField label="Address" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} /><TextField label="Department ID" required value={form.departmentId || ''} onChange={e => setForm({ ...form, departmentId: e.target.value })} /><TextField label="Designation ID" required value={form.designationId || ''} onChange={e => setForm({ ...form, designationId: e.target.value })} /><TextField label="Joining date" type="date" required value={form.joiningDate || ''} onChange={e => setForm({ ...form, joiningDate: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} /><TextField label="Leaving date (optional)" type="date" value={form.leavingDate || ''} onChange={e => setForm({ ...form, leavingDate: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} /></> : <><TextField label={page === 'designations' ? 'Job title' : page === 'holidays' ? 'Holiday name' : 'Department name'} required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />{page === 'departments' && <TextField label="Department code" required value={form.code} disabled={!!selected} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} />}{page === 'designations' && <TextField label="Department ID" required value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} />}{page === 'holidays' && <TextField label="Date" type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />}</>}
      {error && <Alert severity="error">{error}</Alert>}
    </Stack></DialogContent><DialogActions><Button onClick={() => setDialog(null)} disabled={busy}>Cancel</Button><Button type="submit" variant="contained" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button></DialogActions></Box></Dialog>
    <Dialog open={dialog === 'confirm'} onClose={() => !busy && setDialog(null)}><DialogTitle>Confirm change</DialogTitle><DialogContent><Typography>Change the status of {selected?.fullName || selected?.name || selected?.id}? This will affect access or remove this record.</Typography>{error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}</DialogContent><DialogActions><Button onClick={() => setDialog(null)} disabled={busy}>Cancel</Button><Button color="error" onClick={confirmAction} disabled={busy}>{busy ? 'Saving…' : 'Confirm'}</Button></DialogActions></Dialog>
    <Dialog open={dialog === 'role'} onClose={() => !busy && setDialog(null)} fullWidth maxWidth="xs"><DialogTitle>Change role</DialogTitle><DialogContent><Stack sx={{ gap: 2, pt: 1 }}><Typography variant="body2">Choose access for {selected?.name || selected?.email}. Admin access is only configured through the Firebase Console.</Typography><TextField select label="Role" value={form.role || 'employee'} onChange={event => setForm({ ...form, role: event.target.value })}><MenuItem value="employee">Employee</MenuItem><MenuItem value="hr">HR</MenuItem></TextField>{error && <Alert severity="error">{error}</Alert>}</Stack></DialogContent><DialogActions><Button onClick={() => setDialog(null)} disabled={busy}>Cancel</Button><Button variant="contained" onClick={saveRole} disabled={busy || form.role === selected?.role}>{busy ? 'Saving…' : 'Confirm role'}</Button></DialogActions></Dialog>
    <Dialog open={dialog === 'password'} onClose={() => { setTemporaryPassword(''); setDialog(null); }}><DialogTitle>Account created</DialogTitle><DialogContent><Alert severity="success" sx={{ mb: 2 }}>The account was created in Firebase.</Alert><Typography variant="body2">Share this temporary password with the account owner through a secure channel. It is shown only once.</Typography><Box sx={{ p: 2, mt: 2, bgcolor: 'action.hover', borderRadius: 1, overflowWrap: 'anywhere' }}>{temporaryPassword}</Box></DialogContent><DialogActions><Button onClick={() => { setTemporaryPassword(''); setDialog(null); }}>Done</Button></DialogActions></Dialog>
  </>;
}
