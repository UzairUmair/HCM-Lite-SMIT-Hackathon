import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Box, Typography, TextField, Button, Stack, Alert, Checkbox, FormControlLabel, IconButton, InputAdornment, Stepper, Step, StepLabel, Chip } from '@mui/material';
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import PeopleOutlineRounded from "@mui/icons-material/PeopleOutlineRounded";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import ShieldOutlined from "@mui/icons-material/ShieldOutlined";
import { Logo } from '../components/Layout';
import { Fields } from '../components/Common';
import { useApp } from '../context/AppContext';
import { authService } from '../services/api';
const setupFields = [['Company name', ['Company email', 'email'], 'Company contact'], [['Office opening time', 'time'], ['Grace period (minutes)', 'number'], ['Working days', 'text', ['Monday–Friday', 'Monday–Saturday', 'Sunday–Thursday']], 'Office location'], ['Admin name', ['Admin email', 'email'], ['Password', 'password'], ['Confirm password', 'password']]];
export default function AuthPage({
  page
}) {
  const {
    setRole
  } = useApp();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [values, setValues] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const login = page === 'login';
  const setup = page === 'setup';
  const forgot = page === 'forgot-password';
  const title = login ? 'Welcome back.' : setup ? 'Make room for your people.' : forgot ? 'Forgot your password?' : page === 'first-login' ? 'A fresh password, a secure start.' : 'Choose a new password';
  async function submit(e) {
    e.preventDefault();
    setError('');
    if (setup && step < 3) {
      if (step === 2 && values.Password !== values['Confirm password']) {
        setError('Passwords must match.');
        return;
      }
      setStep(step + 1);
      return;
    }
    if (!login && !forgot && !setup && values.Password !== values['Confirm password']) {
      setError('Passwords must match.');
      return;
    }
    setLoading(true);
    try {
      await (setup ? authService.bootstrapCompany : login ? authService.signIn : forgot ? authService.resetPassword : authService.changePassword)(values);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  return <Box className="auth-page"><Box className="auth-story"><Logo /><Box className="auth-story-content"><Chip label="BUILT AROUND YOUR PEOPLE" size="small" sx={{
          color: '#bdb7ff',
          bgcolor: '#ffffff10',
          mb: 3
        }} /><Typography component="h1" sx={{
          fontSize: {
            xs: 34,
            lg: 50
          },
          fontWeight: 700,
          lineHeight: 1.15,
          letterSpacing: -2
        }}>Great teams.<br />Thoughtfully<br /><span style={{
            color: '#a8a0ff'
          }}>managed.</span></Typography><Typography sx={{
          color: "#aab9d3",
          mt: 3,
          maxWidth: 370,
          lineHeight: 1.8
        }}>One calm, connected workspace for the people who make your company possible.</Typography><div className="auth-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-core"><PeopleOutlineRounded sx={{
              fontSize: 48
            }} /></div><div className="art-tag tag-one"><span className="status-dot" /> People first</div><div className="art-tag tag-two"><AutoAwesomeOutlined fontSize="small" /> A smarter workday</div></div><Stack direction="row" sx={{
          gap: 3,
          color: "#c6d0e1",
          fontSize: 12
        }}><span><CheckRounded sx={{
              fontSize: 14
            }} /> People & culture</span><span><CheckRounded sx={{
              fontSize: 14
            }} /> Everyday clarity</span></Stack></Box><Typography sx={{
        fontSize: 11,
        color: "#93a5c3"
      }}>HCM Lite · Smarter People Management</Typography></Box><Box className="auth-form-wrap"><Box sx={{
        width: '100%',
        maxWidth: setup ? 620 : 410
      }}><Typography variant="overline" sx={{
          color: "primary.main",
          fontWeight: 700
        }}>YOUR PEOPLE. YOUR WORKSPACE.</Typography><Typography variant="h4" sx={{
          mt: 1
        }}>{title}</Typography><Typography variant="body2" sx={{
          color: "text.secondary",
          mt: 1,
          mb: 4
        }}>{login ? 'Sign in to bring your workday into focus.' : setup ? 'A few thoughtful details to get your workspace ready.' : forgot ? 'Enter your work email to request a reset link once authentication is connected.' : 'Use at least eight characters for your new password.'}</Typography><Box component="form" onSubmit={submit}><Stack sx={{
            gap: 2.5
          }}>{setup ? <><Stepper activeStep={step} alternativeLabel sx={{
                mb: 2
              }}>{['Company', 'Office', 'Admin', 'Review'].map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper>{step < 3 ? <Fields fields={setupFields[step]} values={values} setValues={setValues} /> : <Box><Alert severity="info" sx={{
                  mb: 2
                }}>Company provisioning requires a secure, server-controlled bootstrap service.</Alert>{Object.entries(values).filter(([key]) => !key.toLowerCase().includes('password')).map(([key, value]) => <Stack key={key} direction="row" sx={{
                  justifyContent: "space-between",
                  py: 1
                }}><Typography variant="body2" sx={{
                    color: "text.secondary"
                  }}>{key}</Typography><Typography variant="body2">{value}</Typography></Stack>)}</Box>}</> : <>{(login || forgot) && <TextField label="Work email" type="email" required value={values.Email || ''} onChange={e => setValues({
                ...values,
                Email: e.target.value
              })} autoComplete="email" placeholder="you@company.com" />}{!forgot && <TextField label={login ? 'Password' : 'New password'} required type={visible ? 'text' : 'password'} value={values.Password || ''} onChange={e => setValues({
                ...values,
                Password: e.target.value
              })} autoComplete={login ? 'current-password' : 'new-password'} slotProps={{
                htmlInput: {
                  minLength: 8
                },
                input: {
                  endAdornment: <InputAdornment position="end"><IconButton aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? <VisibilityOffOutlined /> : <VisibilityOutlined />}</IconButton></InputAdornment>
                }
              }} />} {!login && !forgot && <TextField label="Confirm password" required type="password" value={values['Confirm password'] || ''} onChange={e => setValues({
                ...values,
                'Confirm password': e.target.value
              })} />}</>}{login && <Stack direction="row" sx={{
              justifyContent: "space-between",
              alignItems: "center"
            }}><FormControlLabel control={<Checkbox size="small" />} label={<Typography sx={{
                fontSize: 12
              }}>Remember me</Typography>} /><Link to="/forgot-password">Forgot password?</Link></Stack>}{error && <Alert severity="warning">{error}</Alert>}<Stack direction="row" sx={{
              gap: 1
            }}>{setup && step > 0 && <Button onClick={() => setStep(step - 1)}>Back</Button>}<Button type="submit" variant="contained" fullWidth disabled={loading} endIcon={<ArrowForwardRounded />}>{loading ? 'Connecting…' : setup ? step === 3 ? 'Finish setup' : 'Continue' : login ? 'Sign in' : forgot ? 'Send reset link' : 'Update password'}</Button></Stack></Stack></Box>{login ? <><Box className="preview-role-box"><Typography sx={{
              fontWeight: 650,
              fontSize: 13
            }}>Take a look around</Typography><Typography variant="caption" sx={{
              color: "text.secondary"
            }}>UI-only preview · no account or live data</Typography><Stack direction="row" sx={{
              gap: 1,
              mt: 2
            }}>{['admin', 'hr', 'employee'].map(role => <Button key={role} variant="outlined" fullWidth size="small" onClick={() => {
                setRole(role);
                navigate(`/${role}/dashboard`);
              }}>{role === 'hr' ? 'HR' : role[0].toUpperCase() + role.slice(1)}</Button>)}</Stack></Box><Typography variant="body2" sx={{
            textAlign: "center",
            color: "text.secondary",
            mt: 3
          }}>Starting a workspace? <Link to="/setup">Company setup</Link></Typography></> : <Button component={Link} to="/login" sx={{
          mt: 3
        }}>Back to sign in</Button>}<Stack direction="row" sx={{
          justifyContent: "center",
          gap: .7,
          color: "text.secondary",
          mt: 4
        }}><ShieldOutlined sx={{
            fontSize: 15
          }} /><Typography sx={{
            fontSize: 11
          }}>Designed for secure, role-based access</Typography></Stack></Box></Box></Box>;
}
