import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Alert, Box, Button, Chip, CircularProgress, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import PeopleOutlineRounded from '@mui/icons-material/PeopleOutlineRounded';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import { Logo } from '../components/Layout';
import { useApp } from '../context/AppContext';
import { firebaseConfigured } from '../firebase';
import { authService, friendlyError } from '../services/api';

function PasswordField({ label, value, onChange, visible, setVisible, confirm = false }) {
  return <TextField label={label} required type={visible ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={confirm ? 'new-password' : 'new-password'} helperText={confirm ? undefined : 'Use at least 12 characters.'} slotProps={{ htmlInput: { minLength: 12 }, input: { endAdornment: <InputAdornment position="end"><IconButton aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? <VisibilityOffOutlined /> : <VisibilityOutlined />}</IconButton></InputAdornment> } }} />;
}

export default function AuthPage({ page }) {
  const { role, authError, authLoading } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [values, setValues] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(params.get('passwordChanged') ? 'Password updated. Sign in with your new password.' : '');
  const [loading, setLoading] = useState(false);
  const login = page === 'login';
  const forgot = page === 'forgot-password';
  const reset = page === 'reset-password';
  const code = params.get('oobCode');
  const title = login ? 'Welcome Back!' : forgot ? 'Forgot your password?' : 'Choose a new password';

  useEffect(() => { if (role && login) navigate(`/${role}/dashboard`, { replace: true }); }, [role, login, navigate]);
  useEffect(() => { if (reset && code) authService.verifyResetCode(code).catch(() => setError('This reset link is invalid or has expired. Request a new one.')); }, [reset, code]);
  const update = key => event => setValues(current => ({ ...current, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault(); setError(''); setSuccess('');
    if ((login || forgot) && !values.Email?.trim()) { setError('Please enter your email address.'); return; }
    if (login && !values.Password) { setError('Please enter your password.'); return; }
    if (reset && !code) { setError('Open the password reset link from your email.'); return; }
    if ((reset || page === 'change-password' || page === 'first-login') && values.Password !== values.ConfirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      if (login) await authService.signIn({ Email: values.Email, Password: values.Password });
      else if (forgot) { await authService.resetPassword({ Email: values.Email }); setSuccess('If this email has an account, a reset link has been sent.'); }
      else if (reset) { await authService.confirmReset(code, values.Password); setSuccess('Password changed. You can sign in now.'); }
      else { await (page === 'first-login' ? authService.changeFirstPassword : authService.changePassword)({ Password: values.Password }); if (page === 'first-login') { await authService.signOut(); navigate('/login?passwordChanged=1'); return; } setSuccess('Password updated.'); }
    } catch (cause) { setError(friendlyError(cause)); }
    finally { setLoading(false); }
  }
  return <Box className="auth-page"><Box className="auth-story"><Logo /><Box className="auth-story-content"><Chip label="BUILT AROUND YOUR PEOPLE" size="small" sx={{ color: '#bdb7ff', bgcolor: '#ffffff10', mb: 3 }} /><Typography component="h1" sx={{ fontSize: { xs: 34, lg: 50 }, fontWeight: 700, lineHeight: 1.15, letterSpacing: -2 }}>Great teams.<br />Thoughtfully<br /><span style={{ color: '#a8a0ff' }}>managed.</span></Typography><Typography sx={{ color: '#aab9d3', mt: 3, maxWidth: 370, lineHeight: 1.8 }}>One calm, connected workspace for the people who make your company possible.</Typography><div className="auth-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-core"><PeopleOutlineRounded sx={{ fontSize: 48 }} /></div><div className="art-tag tag-one"><span className="status-dot" /> People first</div><div className="art-tag tag-two"><AutoAwesomeOutlined fontSize="small" /> A smarter workday</div></div><Stack direction="row" sx={{ gap: 3, color: '#c6d0e1', fontSize: 12 }}><span><CheckRounded sx={{ fontSize: 14 }} /> People & culture</span><span><CheckRounded sx={{ fontSize: 14 }} /> Everyday clarity</span></Stack></Box><Typography sx={{ fontSize: 11, color: '#93a5c3' }}>HCM Lite · Smarter People Management</Typography></Box>
    <Box className="auth-form-wrap"><Box sx={{ width: '100%', maxWidth: 410 }}><Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700 }}>YOUR PEOPLE. YOUR WORKSPACE.</Typography><Typography variant="h4" component="h2" sx={{ mt: 1 }}>{title}</Typography><Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, mb: 4 }}>{login ? 'Sign in to your HCM Lite account.' : forgot ? 'Enter your work email and we will send a reset link if it is registered.' : 'Choose a secure password for your account.'}</Typography>
      {!firebaseConfigured && <Alert severity="warning" sx={{ mb: 2 }}>This app is not connected to Firebase yet. Add the approved project values in the local environment file.</Alert>}{authError && <Alert severity="warning" sx={{ mb: 2 }}>{authError}</Alert>}
      <Box component="form" onSubmit={submit}><Stack sx={{ gap: 2.5 }}>{(login || forgot) && <TextField label="Email address" type="email" required autoComplete="email" value={values.Email || ''} onChange={update('Email')} />}{!forgot && (login ? <TextField label="Password" required type={visible ? 'text' : 'password'} value={values.Password || ''} onChange={update('Password')} autoComplete="current-password" slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? <VisibilityOffOutlined /> : <VisibilityOutlined />}</IconButton></InputAdornment> } }} /> : <><PasswordField label="Password" value={values.Password || ''} onChange={update('Password')} visible={visible} setVisible={setVisible} /><PasswordField label="Confirm password" value={values.ConfirmPassword || ''} onChange={update('ConfirmPassword')} visible={visible} setVisible={setVisible} confirm /></>)}{login && <Link to="/forgot-password">Forgot password?</Link>}{error && <Alert severity="error">{error}</Alert>}{success && <Alert severity="success">{success}</Alert>}<Button type="submit" variant="contained" fullWidth disabled={loading || authLoading || !firebaseConfigured} endIcon={loading ? <CircularProgress size={16} /> : <ArrowForwardRounded />}>{login ? 'Sign In' : forgot ? 'Send reset link' : 'Save password'}</Button></Stack></Box>
      {login && <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', mt: 3 }}>Need an account? Ask your Admin to create one for you.</Typography>}{!login && <Button component={Link} to="/login" sx={{ mt: 3 }}>Back to sign in</Button>}<Stack direction="row" sx={{ justifyContent: 'center', gap: .7, color: 'text.secondary', mt: 4 }}><ShieldOutlined sx={{ fontSize: 15 }} /><Typography sx={{ fontSize: 11 }}>Secure role-based access</Typography></Stack>
    </Box></Box></Box>;
}
