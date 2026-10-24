import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Box, Typography, TextField, Button, Stack, Alert, Checkbox, FormControlLabel, IconButton, InputAdornment, Stepper, Step, StepLabel, Chip, CircularProgress } from '@mui/material';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import PeopleOutlineRounded from '@mui/icons-material/PeopleOutlineRounded';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import { Logo } from '../components/Layout';
import { Fields } from '../components/Common';
import { useApp } from '../context/AppContext';
import { firebaseConfigured } from '../firebase';
import { authService, friendlyError } from '../services/api';

const setupFields = [
  ['Company name', ['Company email', 'email'], 'Company contact'],
  [['Office opening time', 'time'], ['Grace period (minutes)', 'number'], ['Working days', 'text', ['Monday–Friday', 'Monday–Saturday', 'Sunday–Thursday']], 'Office location'],
  ['Admin name', ['Admin email', 'email']],
];

export default function AuthPage({ page }) {
  const { role, authError, authLoading } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [values, setValues] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(params.get('passwordChanged') ? 'Password updated. Sign in with your new password.' : '');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const login = page === 'login';
  const setup = page === 'setup';
  const forgot = page === 'forgot-password';
  const reset = page === 'reset-password';
  const code = params.get('oobCode');
  const title = login ? 'Welcome back.' : setup ? 'Make room for your people.' : forgot ? 'Forgot your password?' : 'Choose a new password';

  useEffect(() => { if (role && login) navigate(`/${role}/dashboard`, { replace: true }); }, [role, login, navigate]);
  useEffect(() => {
    if (reset && code) authService.verifyResetCode(code).catch(() => setError('This reset link is invalid or has expired. Request a new one.'));
  }, [reset, code]);

  async function submit(event) {
    event.preventDefault();
    setError(''); setSuccess('');
    if (setup) {
      if (step < 3) setStep(step + 1);
      return;
    }
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

  return <Box className="auth-page">
    <Box className="auth-story">
      <Logo />
      <Box className="auth-story-content">
        <Chip label="BUILT AROUND YOUR PEOPLE" size="small" sx={{ color: '#bdb7ff', bgcolor: '#ffffff10', mb: 3 }} />
        <Typography component="h1" sx={{ fontSize: { xs: 34, lg: 50 }, fontWeight: 700, lineHeight: 1.15, letterSpacing: -2 }}>Great teams.<br />Thoughtfully<br /><span style={{ color: '#a8a0ff' }}>managed.</span></Typography>
        <Typography sx={{ color: '#aab9d3', mt: 3, maxWidth: 370, lineHeight: 1.8 }}>One calm, connected workspace for the people who make your company possible.</Typography>
        <div className="auth-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-core"><PeopleOutlineRounded sx={{ fontSize: 48 }} /></div><div className="art-tag tag-one"><span className="status-dot" /> People first</div><div className="art-tag tag-two"><AutoAwesomeOutlined fontSize="small" /> A smarter workday</div></div>
        <Stack direction="row" sx={{ gap: 3, color: '#c6d0e1', fontSize: 12 }}><span><CheckRounded sx={{ fontSize: 14 }} /> People & culture</span><span><CheckRounded sx={{ fontSize: 14 }} /> Everyday clarity</span></Stack>
      </Box>
      <Typography sx={{ fontSize: 11, color: '#93a5c3' }}>HCM Lite · Smarter People Management</Typography>
    </Box>
    <Box className="auth-form-wrap"><Box sx={{ width: '100%', maxWidth: setup ? 620 : 410 }}>
      <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700 }}>YOUR PEOPLE. YOUR WORKSPACE.</Typography>
      <Typography variant="h4" component="h2" sx={{ mt: 1 }}>{title}</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, mb: 4 }}>{login ? 'Sign in with your work account.' : setup ? 'Gather the details for secure first-time provisioning.' : forgot ? 'We will email a reset link if this address belongs to an account.' : 'Use at least eight characters.'}</Typography>
      {!firebaseConfigured && <Alert severity="warning" sx={{ mb: 2 }}>Firebase configuration is missing. Add the values in <code>.env.local</code> to connect this app.</Alert>}
      {authError && <Alert severity="warning" sx={{ mb: 2 }}>{authError}</Alert>}
      <Box component="form" onSubmit={submit}><Stack sx={{ gap: 2.5 }}>
        {setup ? <>
          <Stepper activeStep={step} alternativeLabel>{['Company', 'Office', 'Admin', 'Review'].map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper>
          {step < 3 ? <Fields fields={setupFields[step]} values={values} setValues={setValues} /> : <Alert severity="info">First Admin creation must run from the trusted bootstrap script. Review the details here, then follow the local setup steps in the README. Nothing on this screen writes an Admin account.</Alert>}
        </> : <>
          {(login || forgot) && <TextField label="Work email" type="email" required autoComplete="email" value={values.Email || ''} onChange={e => setValues({ ...values, Email: e.target.value })} />}
          {!forgot && <TextField label={login ? 'Password' : 'New password'} required type={visible ? 'text' : 'password'} value={values.Password || ''} onChange={e => setValues({ ...values, Password: e.target.value })} autoComplete={login ? 'current-password' : 'new-password'} slotProps={{ htmlInput: { minLength: 8 }, input: { endAdornment: <InputAdornment position="end"><IconButton aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? <VisibilityOffOutlined /> : <VisibilityOutlined />}</IconButton></InputAdornment> } }} />}
          {!login && !forgot && <TextField label="Confirm password" required type="password" value={values.ConfirmPassword || ''} onChange={e => setValues({ ...values, ConfirmPassword: e.target.value })} />}
        </>}
        {login && <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}><FormControlLabel control={<Checkbox size="small" />} label={<Typography sx={{ fontSize: 12 }}>Remember me</Typography>} /><Link to="/forgot-password">Forgot password?</Link></Stack>}
        {error && <Alert severity="error">{error}</Alert>}{success && <Alert severity="success">{success}</Alert>}
        <Stack direction="row" sx={{ gap: 1 }}>{setup && step > 0 && <Button onClick={() => setStep(step - 1)}>Back</Button>}<Button type="submit" variant="contained" fullWidth disabled={loading || authLoading || !firebaseConfigured || setup && step === 3} endIcon={loading ? <CircularProgress size={16} /> : <ArrowForwardRounded />}>{setup ? 'Continue' : login ? 'Sign in' : forgot ? 'Send reset link' : 'Save password'}</Button></Stack>
      </Stack></Box>
      {login && <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', mt: 3 }}>First time here? <Link to="/setup">Company setup guide</Link></Typography>}
      {!login && <Button component={Link} to="/login" sx={{ mt: 3 }}>Back to sign in</Button>}
      <Stack direction="row" sx={{ justifyContent: 'center', gap: .7, color: 'text.secondary', mt: 4 }}><ShieldOutlined sx={{ fontSize: 15 }} /><Typography sx={{ fontSize: 11 }}>Secure role-based access</Typography></Stack>
    </Box></Box>
  </Box>;
}
