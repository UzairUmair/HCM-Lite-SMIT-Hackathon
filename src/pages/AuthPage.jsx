import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Alert, Box, Button, Chip, CircularProgress, Collapse, IconButton, InputAdornment, Stack, Step, StepLabel, Stepper, TextField, Typography } from '@mui/material';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import PeopleOutlineRounded from '@mui/icons-material/PeopleOutlineRounded';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import { Logo } from '../components/Layout';
import { useApp } from '../context/AppContext';
import { firebaseConfigured } from '../firebase';
import { authService, companyService, friendlyError } from '../services/api';

const draftKey = 'hcm-setup-draft';
const initialWorkspace = { companyName: '', companyEmail: '', officeStart: '09:00', officeEnd: '17:00', graceMinutes: '15', contact: '', location: '' };

function loadDraft() {
  try { return { ...initialWorkspace, ...JSON.parse(sessionStorage.getItem(draftKey) || '{}') }; } catch { return initialWorkspace; }
}

function PasswordField({ label, value, onChange, visible, setVisible, confirm = false }) {
  return <TextField label={label} required type={visible ? 'text' : 'password'} value={value} onChange={onChange} autoComplete="new-password" helperText={confirm ? undefined : 'Use at least 12 characters.'} slotProps={{ htmlInput: { minLength: 12 }, input: { endAdornment: <InputAdornment position="end"><IconButton aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? <VisibilityOffOutlined /> : <VisibilityOutlined />}</IconButton></InputAdornment> } }} />;
}

export default function AuthPage({ page }) {
  const { role, authError, authLoading } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [values, setValues] = useState({});
  const [workspace, setWorkspace] = useState(loadDraft);
  const [advanced, setAdvanced] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(params.get('passwordChanged') ? 'Password updated. Sign in with your new password.' : '');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const login = page === 'login';
  const setup = page === 'setup';
  const forgot = page === 'forgot-password';
  const reset = page === 'reset-password';
  const code = params.get('oobCode');
  const provisionedAdmin = setup && role === 'admin';
  const title = login ? 'Welcome Back!' : setup ? provisionedAdmin ? 'Finish your workspace' : 'Welcome to HCM Lite' : forgot ? 'Forgot your password?' : 'Choose a new password';

  useEffect(() => { if (role && login) navigate(`/${role}/dashboard`, { replace: true }); }, [role, login, navigate]);
  useEffect(() => { if (setup && role && role !== 'admin') navigate(`/${role}/dashboard`, { replace: true }); }, [setup, role, navigate]);
  useEffect(() => { if (reset && code) authService.verifyResetCode(code).catch(() => setError('This reset link is invalid or has expired. Request a new one.')); }, [reset, code]);
  useEffect(() => {
    if (!provisionedAdmin) return;
    companyService.get().then(company => {
      if (company) setWorkspace(current => ({ ...current, companyName: company.name || '', companyEmail: company.email || '', officeStart: company.officeStart || '09:00', officeEnd: company.officeEnd || '17:00', graceMinutes: String(company.graceMinutes ?? 15), contact: company.contact || '', location: company.location || '' }));
    }).catch(cause => setError(friendlyError(cause)));
  }, [provisionedAdmin]);
  useEffect(() => { if (setup && !provisionedAdmin) sessionStorage.setItem(draftKey, JSON.stringify(workspace)); }, [setup, provisionedAdmin, workspace]);

  function updateWorkspace(key) { return event => setWorkspace(current => ({ ...current, [key]: event.target.value })); }
  function validateWorkspace() {
    if (!workspace.companyName.trim()) return 'Enter your company name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workspace.companyEmail)) return 'Enter a valid company email address.';
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(workspace.officeStart) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(workspace.officeEnd)) return 'Enter valid office hours.';
    return '';
  }
  async function saveWorkspace() {
    const validation = validateWorkspace();
    if (validation) { setError(validation); return; }
    setLoading(true); setError('');
    try {
      await companyService.save({ name: workspace.companyName, email: workspace.companyEmail, officeStart: workspace.officeStart, officeEnd: workspace.officeEnd, graceMinutes: Number(workspace.graceMinutes) || 15, contact: workspace.contact, location: workspace.location, weekends: [0, 6] });
      sessionStorage.removeItem(draftKey);
      navigate('/admin/dashboard', { replace: true });
    } catch (cause) { setError(friendlyError(cause)); }
    finally { setLoading(false); }
  }
  async function submit(event) {
    event.preventDefault(); setError(''); setSuccess('');
    if (setup) {
      const validation = validateWorkspace();
      if (validation) { setError(validation); return; }
      if (provisionedAdmin) { await saveWorkspace(); return; }
      setStep(1); return;
    }
    if (login && !values.Email?.trim()) { setError('Please enter your email address.'); return; }
    if (login && !values.Password) { setError('Please enter your password.'); return; }
    if (reset && !code) { setError('Open the password reset link from your email.'); return; }
    if (!login && !forgot && values.Password !== values.ConfirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      if (login) await authService.signIn({ Email: values.Email, Password: values.Password });
      else if (forgot) { await authService.resetPassword({ Email: values.Email }); setSuccess('If this email has an account, a reset link has been sent.'); }
      else if (reset) { await authService.confirmReset(code, values.Password); setSuccess('Password changed. You can sign in now.'); }
      else { await (page === 'first-login' ? authService.changeFirstPassword : authService.changePassword)({ Password: values.Password }); if (page === 'first-login') { await authService.signOut(); navigate('/login?passwordChanged=1'); return; } setSuccess('Password updated.'); }
    } catch (cause) { setError(friendlyError(cause)); }
    finally { setLoading(false); }
  }
  const workspaceFields = <><TextField label="Company name" required value={workspace.companyName} onChange={updateWorkspace('companyName')} /><TextField label="Company email" type="email" required value={workspace.companyEmail} onChange={updateWorkspace('companyEmail')} /><Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}><TextField label="Office starts" type="time" required fullWidth value={workspace.officeStart} onChange={updateWorkspace('officeStart')} slotProps={{ inputLabel: { shrink: true } }} /><TextField label="Office ends" type="time" required fullWidth value={workspace.officeEnd} onChange={updateWorkspace('officeEnd')} slotProps={{ inputLabel: { shrink: true } }} /></Stack><Button onClick={() => setAdvanced(!advanced)} endIcon={<ExpandMoreRounded sx={{ transform: advanced ? 'rotate(180deg)' : 'none' }} />} sx={{ alignSelf: 'flex-start' }}>Advanced settings</Button><Collapse in={advanced}><Stack sx={{ gap: 2 }}><TextField label="Grace period (minutes)" type="number" value={workspace.graceMinutes} onChange={updateWorkspace('graceMinutes')} slotProps={{ htmlInput: { min: 0, max: 120 } }} /><TextField label="Contact number" value={workspace.contact} onChange={updateWorkspace('contact')} /><TextField label="Office location" value={workspace.location} onChange={updateWorkspace('location')} /></Stack></Collapse></>;

  return <Box className="auth-page"><Box className="auth-story"><Logo /><Box className="auth-story-content"><Chip label="BUILT AROUND YOUR PEOPLE" size="small" sx={{ color: '#bdb7ff', bgcolor: '#ffffff10', mb: 3 }} /><Typography component="h1" sx={{ fontSize: { xs: 34, lg: 50 }, fontWeight: 700, lineHeight: 1.15, letterSpacing: -2 }}>Great teams.<br />Thoughtfully<br /><span style={{ color: '#a8a0ff' }}>managed.</span></Typography><Typography sx={{ color: '#aab9d3', mt: 3, maxWidth: 370, lineHeight: 1.8 }}>One calm, connected workspace for the people who make your company possible.</Typography><div className="auth-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-core"><PeopleOutlineRounded sx={{ fontSize: 48 }} /></div><div className="art-tag tag-one"><span className="status-dot" /> People first</div><div className="art-tag tag-two"><AutoAwesomeOutlined fontSize="small" /> A smarter workday</div></div><Stack direction="row" sx={{ gap: 3, color: '#c6d0e1', fontSize: 12 }}><span><CheckRounded sx={{ fontSize: 14 }} /> People & culture</span><span><CheckRounded sx={{ fontSize: 14 }} /> Everyday clarity</span></Stack></Box><Typography sx={{ fontSize: 11, color: '#93a5c3' }}>HCM Lite · Smarter People Management</Typography></Box>
    <Box className="auth-form-wrap"><Box sx={{ width: '100%', maxWidth: setup ? 560 : 410 }}><Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700 }}>YOUR PEOPLE. YOUR WORKSPACE.</Typography><Typography variant="h4" component="h2" sx={{ mt: 1 }}>{title}</Typography><Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, mb: 4 }}>{login ? 'Sign in to your HCM Lite account.' : setup ? provisionedAdmin ? 'Confirm the company details, then open your Admin dashboard.' : "Let's set up your workspace." : forgot ? 'Enter your work email and we will send a reset link if it is registered.' : 'Choose a secure password for your account.'}</Typography>
      {!firebaseConfigured && <Alert severity="warning" sx={{ mb: 2 }}>This app is not connected to Firebase yet. Add the approved project values in the local environment file.</Alert>}{authError && <Alert severity="warning" sx={{ mb: 2 }}>{authError}</Alert>}
      <Box component="form" onSubmit={submit}><Stack sx={{ gap: 2.5 }}>{setup ? <>{!provisionedAdmin && <Stepper activeStep={step} alternativeLabel><Step><StepLabel>Company</StepLabel></Step><Step><StepLabel>Activation</StepLabel></Step></Stepper>}{step === 0 || provisionedAdmin ? workspaceFields : <Alert severity="info"><Typography sx={{ fontWeight: 700, mb: .5 }}>One secure activation is needed</Typography>Your workspace owner needs to create the first Admin account once from the trusted project environment. This protects your company from a visitor claiming Admin access. After activation, return here and sign in normally.</Alert>}</> : <>{(login || forgot) && <TextField label="Email address" type="email" required autoComplete="email" value={values.Email || ''} onChange={event => setValues({ ...values, Email: event.target.value })} />}{!forgot && (login ? <TextField label="Password" required type={visible ? 'text' : 'password'} value={values.Password || ''} onChange={event => setValues({ ...values, Password: event.target.value })} autoComplete="current-password" slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? <VisibilityOffOutlined /> : <VisibilityOutlined />}</IconButton></InputAdornment> } }} /> : <><PasswordField label="New password" value={values.Password || ''} onChange={event => setValues({ ...values, Password: event.target.value })} visible={visible} setVisible={setVisible} /><PasswordField label="Confirm password" value={values.ConfirmPassword || ''} onChange={event => setValues({ ...values, ConfirmPassword: event.target.value })} visible={visible} setVisible={setVisible} confirm /></>)}</>}
        {login && <Link to="/forgot-password">Forgot password?</Link>}{error && <Alert severity="error">{error}</Alert>}{success && <Alert severity="success">{success}</Alert>}
        {setup && step === 1 && !provisionedAdmin ? <Stack direction="row" sx={{ gap: 1 }}><Button onClick={() => setStep(0)}>Back</Button><Button component={Link} to="/login" variant="contained" fullWidth endIcon={<ArrowForwardRounded />}>Go to sign in</Button></Stack> : <Stack direction="row" sx={{ gap: 1 }}><Button type="submit" variant="contained" fullWidth disabled={loading || authLoading || !firebaseConfigured} endIcon={loading ? <CircularProgress size={16} /> : <ArrowForwardRounded />}>{setup ? provisionedAdmin ? 'Save workspace' : 'Continue' : login ? 'Sign In' : forgot ? 'Send reset link' : 'Save password'}</Button></Stack>}</Stack></Box>
      {login && <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', mt: 3 }}>Setting up a new company? <Link to="/setup">Workspace setup</Link></Typography>}{!login && <Button component={Link} to="/login" sx={{ mt: 3 }}>Back to sign in</Button>}<Stack direction="row" sx={{ justifyContent: 'center', gap: .7, color: 'text.secondary', mt: 4 }}><ShieldOutlined sx={{ fontSize: 15 }} /><Typography sx={{ fontSize: 11 }}>Secure role-based access</Typography></Stack>
    </Box></Box></Box>;
}
