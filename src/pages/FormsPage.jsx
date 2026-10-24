import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Alert, Avatar, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Step, StepLabel, Stepper, Tab, Tabs, TextField, Typography } from '@mui/material';
import { Card, EmptyState, PageHeader } from '../components/Common';
import { useApp } from '../context/AppContext';
import { accountService, companyService, organizationService, peopleService, friendlyError } from '../services/api';

const employeeSteps = ['Personal details', 'Job information', 'Salary', 'Review'];
const initial = { fullName: '', email: '', phone: '', address: '', employeeCode: '', departmentId: '', designationId: '', joiningDate: '', basicSalary: '' };

function AddEmployee() {
  const navigate = useNavigate();
  const { role } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initial);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupBusy, setSetupBusy] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [setup, setSetup] = useState({ departmentId: '', departmentName: '', departmentCode: '', designationName: '' });
  async function refreshOptions() {
    try { const [d, t] = await Promise.all([organizationService.list('departments'), organizationService.list('designations')]); setDepartments(d); setDesignations(t); }
    catch (cause) { setError(friendlyError(cause)); }
  }
  useEffect(() => { refreshOptions(); }, []);
  const change = key => event => setForm({ ...form, [key]: event.target.value });
  function openQuickSetup() { setSetup({ departmentId: departments[0]?.id || '', departmentName: '', departmentCode: '', designationName: '' }); setSetupError(''); setSetupOpen(true); }
  async function saveQuickSetup(event) {
    event.preventDefault(); setSetupBusy(true); setSetupError('');
    try {
      let departmentId = setup.departmentId;
      if (!departmentId) {
        if (!setup.departmentName.trim() || !setup.departmentCode.trim()) throw new Error('Enter a department name and code.');
        const created = await organizationService.add('departments', { name: setup.departmentName.trim(), code: setup.departmentCode.trim(), status: 'Active' });
        departmentId = created?.id || created;
      }
      if (!setup.designationName.trim()) throw new Error('Enter a designation name.');
      const designation = await organizationService.add('designations', { name: setup.designationName.trim(), departmentId, status: 'Active' });
      await refreshOptions();
      setForm(current => ({ ...current, departmentId, designationId: designation?.id || designation }));
      setSetupOpen(false);
    } catch (cause) { setSetupError(friendlyError(cause)); }
    finally { setSetupBusy(false); }
  }
  function next(event) {
    event.preventDefault(); setError('');
    if (step === 0 && (!form.fullName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))) return setError('Enter a name and valid email.');
    if (step === 1 && (!form.employeeCode || !form.departmentId || !form.designationId || !form.joiningDate)) return setError('Complete the job information.');
    if (step === 2 && !(Number(form.basicSalary) > 0)) return setError('Enter a basic salary above zero.');
    setStep(step + 1);
  }
  async function create() {
    setBusy(true); setError('');
    try { const result = await peopleService.register(form); setPassword(result.temporaryPassword); }
    catch (cause) { setError(friendlyError(cause)); }
    finally { setBusy(false); }
  }
  return <><PageHeader title="Add employee" subtitle="Four short steps to bring someone on board." /><Card>
    <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>{employeeSteps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper>
    <Box component="form" onSubmit={next}><Stack sx={{ gap: 2, maxWidth: 600 }}>
      {step === 0 && <><TextField label="Full name" required value={form.fullName} onChange={change('fullName')} /><TextField label="Work email" type="email" required value={form.email} onChange={change('email')} /><TextField label="Phone" value={form.phone} onChange={change('phone')} /><TextField label="Address" value={form.address} onChange={change('address')} /></>}
      {step === 1 && <><TextField label="Employee code" required value={form.employeeCode} onChange={change('employeeCode')} helperText="Use letters, numbers and hyphens." /><TextField label="Department" select required value={form.departmentId} onChange={event => setForm({ ...form, departmentId: event.target.value, designationId: '' })}>{departments.map(row => <MenuItem key={row.id} value={row.id}>{row.name}</MenuItem>)}</TextField><TextField label="Designation" select required value={form.designationId} onChange={change('designationId')} disabled={!form.departmentId}>{designations.filter(row => !row.departmentId || row.departmentId === form.departmentId).map(row => <MenuItem key={row.id} value={row.id}>{row.name}</MenuItem>)}</TextField><TextField label="Joining date" type="date" required value={form.joiningDate} onChange={change('joiningDate')} slotProps={{ inputLabel: { shrink: true } }} />{(!departments.length || !designations.length) && <Alert severity="info" action={<Button size="small" onClick={openQuickSetup}>Quick setup</Button>}>Create a department and designation to continue. You can do it here without leaving this form.</Alert>}</>}
      {step === 2 && <><TextField label="Basic monthly salary" type="number" required value={form.basicSalary} onChange={change('basicSalary')} slotProps={{ htmlInput: { min: 1 } }} /><Alert severity="info">House rent allowance is 40% and medical allowance is 10% of basic salary. Salary details are visible only to authorized staff.</Alert></>}
      {step === 3 && <><Typography variant="h6">Review and create</Typography>{Object.entries(form).map(([key, value]) => <Stack key={key} direction="row" sx={{ justifyContent: 'space-between', gap: 2, borderBottom: '1px solid', borderColor: 'divider', py: 1 }}><Typography variant="body2" sx={{ color: 'text.secondary' }}>{key}</Typography><Typography variant="body2" sx={{ textAlign: 'right' }}>{value || '—'}</Typography></Stack>)}<Alert severity="info">Creating this employee also provisions a secure login. The temporary password is shown only once.</Alert></>}
      {error && <Alert severity="error">{error}</Alert>}
      <Stack direction="row" sx={{ gap: 1, mt: 2 }}><Button onClick={() => step ? setStep(step - 1) : navigate(`/${role}/employees`)} disabled={busy}>{step ? 'Back' : 'Cancel'}</Button>{step < 3 ? <Button variant="contained" type="submit">Next</Button> : <Button variant="contained" onClick={create} disabled={busy}>{busy ? 'Creating…' : 'Create employee'}</Button>}</Stack>
    </Stack></Box>
  </Card><Dialog open={setupOpen} onClose={() => !setupBusy && setSetupOpen(false)} fullWidth maxWidth="xs"><Box component="form" onSubmit={saveQuickSetup}><DialogTitle>Quick job setup</DialogTitle><DialogContent><Stack sx={{ gap: 2, pt: 1 }}>{departments.length ? <TextField select label="Department" required value={setup.departmentId} onChange={event => setSetup({ ...setup, departmentId: event.target.value })}>{departments.map(row => <MenuItem key={row.id} value={row.id}>{row.name}</MenuItem>)}</TextField> : <><TextField label="Department name" required value={setup.departmentName} onChange={event => setSetup({ ...setup, departmentName: event.target.value })} /><TextField label="Department code" required helperText="Letters, numbers and hyphens only." value={setup.departmentCode} onChange={event => setSetup({ ...setup, departmentCode: event.target.value.toUpperCase() })} /></>}<TextField label="Designation" required placeholder="e.g. Software Engineer" value={setup.designationName} onChange={event => setSetup({ ...setup, designationName: event.target.value })} />{setupError && <Alert severity="error">{setupError}</Alert>}</Stack></DialogContent><DialogActions><Button onClick={() => setSetupOpen(false)} disabled={setupBusy}>Cancel</Button><Button type="submit" variant="contained" disabled={setupBusy}>{setupBusy ? 'Creating…' : 'Save and continue'}</Button></DialogActions></Box></Dialog><Dialog open={!!password} onClose={() => { setPassword(''); navigate(`/${role}/employees`); }}><DialogTitle>Employee account created</DialogTitle><DialogContent><Alert severity="success" sx={{ mb: 2 }}>The employee account is ready.</Alert><Typography variant="body2">Share this temporary password privately. It is shown only once.</Typography><Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1, overflowWrap: 'anywhere' }}>{password}</Box></DialogContent><DialogActions><Button onClick={() => { setPassword(''); navigate(`/${role}/employees`); }}>Done</Button></DialogActions></Dialog></>;
}

function CompanyPage({ policy = false }) {
  const [record, setRecord] = useState(null);
  const [form, setForm] = useState({});
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  async function refresh() { setLoading(true); try { const result = policy ? (await organizationService.list('leave_policies')).find(row => row.id === 'default') : await companyService.get(); setRecord(result); setForm(result || (policy ? { annual: 14, sick: 8, casual: 10, unpaid: null } : {})); } catch (cause) { setError(friendlyError(cause)); } finally { setLoading(false); } }
  useEffect(() => { refresh(); }, [policy]);
  async function save(event) { event.preventDefault(); setBusy(true); setError(''); try { if (policy) { const payload = { annual: Number(form.annual), sick: Number(form.sick), casual: Number(form.casual), unpaid: null }; if (record) await organizationService.update('leave_policies', 'default', payload); else await organizationService.add('leave_policies', payload); } else await companyService.save(form); setOpen(false); setSuccess('Settings saved.'); await refresh(); } catch (cause) { setError(friendlyError(cause)); } finally { setBusy(false); } }
  const fields = policy ? [['annual', 'Annual leave days', 'number'], ['sick', 'Sick leave days', 'number'], ['casual', 'Casual leave days', 'number']] : [['name', 'Company name'], ['email', 'Company email', 'email'], ['contact', 'Contact'], ['location', 'Office location'], ['officeStart', 'Office start', 'time'], ['officeEnd', 'Office end', 'time'], ['graceMinutes', 'Grace minutes', 'number']];
  return <><PageHeader title={policy ? 'Leave policies' : 'Company settings'} subtitle={policy ? 'Set the annual leave allowance for your team.' : 'The essentials of how your company works.'} action={<Button variant="contained" onClick={() => setOpen(true)}>Edit settings</Button>} />{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}<Card title={policy ? 'Current allowances' : 'Company details'}>{loading ? <CircularProgress /> : record ? fields.map(([key, label]) => <Stack key={key} direction="row" sx={{ justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}><Typography variant="body2" sx={{ color: 'text.secondary' }}>{label}</Typography><Typography variant="body2">{String(record[key] ?? '—')}</Typography></Stack>) : <EmptyState title="Ready for your first settings" text="Use Edit settings to get started." />}</Card><Dialog open={open} onClose={() => !busy && setOpen(false)} fullWidth><Box component="form" onSubmit={save}><DialogTitle>{policy ? 'Edit leave allowances' : 'Edit company settings'}</DialogTitle><DialogContent><Stack sx={{ gap: 2, pt: 1 }}>{fields.map(([key, label, type]) => <TextField key={key} label={label} type={type || 'text'} required value={form[key] ?? ''} onChange={event => setForm({ ...form, [key]: event.target.value })} slotProps={{ inputLabel: { shrink: true }, htmlInput: type === 'number' ? { min: 0 } : {} }} />)}{error && <Alert severity="error">{error}</Alert>}</Stack></DialogContent><DialogActions><Button onClick={() => setOpen(false)} disabled={busy}>Cancel</Button><Button type="submit" variant="contained" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button></DialogActions></Box></Dialog></>;
}

function ProfilePage() {
  const { role, account } = useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const employeeId = id || account?.employeeId;
  const [employee, setEmployee] = useState(null);
  const [salary, setSalary] = useState(null);
  const [tab, setTab] = useState(0);
  const [contact, setContact] = useState({ phone: '', address: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => { if (!employeeId) return; peopleService.get(employeeId).then(row => { setEmployee(row); setContact({ phone: row?.phone || '', address: row?.address || '' }); }).catch(cause => setError(friendlyError(cause))); if (role !== 'employee') peopleService.getSalary(employeeId).then(setSalary).catch(cause => setError(friendlyError(cause))); }, [employeeId, role]);
  async function save(event) { event.preventDefault(); setBusy(true); setError(''); try { await peopleService.updateContact(employeeId, contact); setSuccess('Contact details saved.'); setEmployee({ ...employee, ...contact }); } catch (cause) { setError(friendlyError(cause)); } finally { setBusy(false); } }
  return <><PageHeader title="Employee profile" subtitle="Personal and work details in one place." />{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}{!employee ? <Card><EmptyState title="Profile unavailable" text="This account does not have a linked employee record yet." /></Card> : <><Card sx={{ mb: 3 }}><Stack direction="row" sx={{ gap: 2, alignItems: 'center' }}><Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>{employee.fullName?.slice(0, 1)}</Avatar><Box><Typography variant="h5">{employee.fullName}</Typography><Typography variant="body2" sx={{ color: 'text.secondary' }}>{employee.employeeCode} · {employee.status}</Typography></Box></Stack><Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto" sx={{ mt: 2 }}>{['Overview', 'Contact', ...(role !== 'employee' ? ['Salary'] : [])].map(label => <Tab key={label} label={label} />)}</Tabs></Card>{tab === 0 && <Card title="Work details">{[['Email', employee.email], ['Department', employee.departmentId], ['Designation', employee.designationId], ['Joining date', employee.joiningDate], ['Status', employee.status]].map(([label, value]) => <Stack key={label} direction="row" sx={{ justifyContent: 'space-between', py: 1.5 }}><Typography sx={{ color: 'text.secondary' }}>{label}</Typography><Typography>{value || '—'}</Typography></Stack>)}</Card>}{tab === 1 && <Card title="Contact details">{employeeId === account?.uid ? <Box component="form" onSubmit={save} sx={{ maxWidth: 500, display: 'grid', gap: 2 }}><TextField label="Phone" value={contact.phone} onChange={event => setContact({ ...contact, phone: event.target.value })} /><TextField label="Address" value={contact.address} onChange={event => setContact({ ...contact, address: event.target.value })} /><Button type="submit" variant="contained" disabled={busy}>{busy ? 'Saving…' : 'Save contact details'}</Button></Box> : <><Typography variant="body2">Phone: {employee.phone || '—'}</Typography><Typography variant="body2">Address: {employee.address || '—'}</Typography><Button onClick={() => navigate('/hr/employees')}>Return to directory</Button></>}</Card>}{tab === 2 && role !== 'employee' && <Card title="Salary structure"><Typography variant="body2">Basic salary: {salary?.basic ?? '—'}</Typography><Typography variant="body2">House rent: 40% · Medical: 10%</Typography></Card>}</>}</>;
}

function AccountSettings() {
  const { account } = useApp();
  const [form, setForm] = useState({ fullName: account?.name || '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => { if (!account?.employeeId) return; peopleService.get(account.employeeId).then(record => setForm({ fullName: account.name || record?.fullName || '', phone: record?.phone || '' })).catch(cause => setError(friendlyError(cause))); }, [account]);
  async function save(event) { event.preventDefault(); setBusy(true); setError(''); setSuccess(''); try { await accountService.update(form); setSuccess('Account details saved.'); } catch (cause) { setError(friendlyError(cause)); } finally { setBusy(false); } }
  return <><PageHeader title="Account settings" subtitle="Keep your account details secure and up to date." />{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}<Card title="Your details" sx={{ mb: 3 }}><Box component="form" onSubmit={save} sx={{ maxWidth: 480, display: 'grid', gap: 2 }}><TextField label="Full name" required value={form.fullName} onChange={event => setForm({ ...form, fullName: event.target.value })} /><TextField label="Email address" value={account?.email || ''} disabled helperText="Email changes require an administrator-led account update." /><TextField label="Phone" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} /><Button type="submit" variant="contained" disabled={busy}>{busy ? 'Saving…' : 'Save details'}</Button></Box></Card><Card title="Password"><Typography variant="body2" sx={{ mb: 2 }}>Choose a new password whenever you need to.</Typography><Button href="/change-password" variant="outlined">Change password</Button></Card></>;
}

export default function FormsPage({ page }) {
  const { role } = useApp();
  if (page === 'employees/new') return <AddEmployee />;
  if (page === 'company') return <CompanyPage />;
  if (page === 'leave-policies') return <CompanyPage policy />;
  if (page === 'profile') return <ProfilePage />;
  return <AccountSettings />;
}
