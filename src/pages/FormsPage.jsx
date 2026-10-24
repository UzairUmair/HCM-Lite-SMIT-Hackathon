import { useState } from 'react';
import { Box, Stack, Button, Typography, Alert, Tabs, Tab, Avatar, Chip } from '@mui/material';
import { Card, PageHeader, Fields, EmptyState, DataTable } from '../components/Common';
import { useApp } from '../context/AppContext';
const company = [['Company details', ['Company name', ['Company email', 'email'], 'Company contact', 'Office location']], ['Working arrangements', [['Office opening time', 'time'], ['Office closing time', 'time'], ['Grace period (minutes)', 'number'], ['Working days', 'text', ['Monday–Friday', 'Monday–Saturday', 'Sunday–Thursday']], ['Attendance radius (meters)', 'number'], ['Attendance status rules', 'text', ['Configure after policy approval']]]]];
const employee = [['Personal information', ['Full name', ['Email', 'email'], ['Phone', 'tel'], 'Address', ['Date of birth (optional)', 'date']]], ['Employment information', ['Employee code', 'Department', 'Designation', ['Joining date', 'date'], ['Employment status', 'text', ['Active', 'Probation', 'Inactive']]]], ['Salary information', [['Basic salary', 'number'], ['House rent allowance', 'number'], ['Medical allowance', 'number'], ['Other allowance (optional)', 'number']]]];
const policies = [['Annual entitlement', [['Annual leave quota', 'number'], ['Sick leave quota', 'number'], ['Casual leave quota', 'number'], ['Unpaid leave policy', 'text', ['Subject to approval', 'Not permitted']]]]];
export default function FormsPage({
  page
}) {
  const {
    role
  } = useApp();
  const [values, setValues] = useState({});
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState(0);
  const profile = page === 'profile';
  const settings = page === 'settings';
  const sections = page === 'company' ? company : page === 'leave-policies' ? policies : profile ? [['Personal contact', ['Phone', 'Address']]] : settings ? [['Preferences', [['Notification preference', 'text', ['All updates', 'Important updates only']], ['Date format', 'text', ['DD/MM/YYYY', 'MM/DD/YYYY']]]]] : employee;
  const title = page === 'company' ? 'Company settings' : page === 'leave-policies' ? 'Leave policies' : profile ? 'Employee 360' : settings ? 'Your settings' : 'Add an employee';
  return <><PageHeader title={title} subtitle={profile ? 'The details that make up a work life.' : 'Thoughtful details. A better organized workspace.'} />{profile && <Card sx={{
      mb: 3
    }}><Stack direction="row" sx={{
        gap: 3,
        alignItems: "center"
      }}><Avatar sx={{
          width: 72,
          height: 72,
          bgcolor: 'primary.main'
        }}>?</Avatar><Box><Typography variant="h5">Profile not connected</Typography><Typography variant="body2" sx={{
            color: "text.secondary"
          }}>Name, designation and department will come from your employee record.</Typography><Chip size="small" label="Awaiting authenticated profile" sx={{
            mt: 1
          }} /></Box></Stack><Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{
        mt: 3
      }}>{['Overview', 'Attendance', 'Leave history', ...(role !== 'employee' ? ['Salary'] : []), 'Activity'].map(t => <Tab key={t} label={t} />)}</Tabs></Card>}{profile && tab > 0 ? <Card><EmptyState title="Your history, in one place" text="This section will display permitted records from your authenticated profile." /></Card> : <Box component="form" onSubmit={e => {
      e.preventDefault();
      setMessage('Your form is valid. Saving requires the connected service; no data was saved.');
    }}><Box className="form-page-columns"><Stack sx={{
          gap: 3
        }}>{sections.map(([heading, fields]) => <Card key={heading} title={heading}><Fields fields={fields} values={values} setValues={setValues} /></Card>)}{page === 'employees/new' && <Card title="Login account"><Alert severity="info">Account provisioning is not connected. A trusted service will issue a temporary password and require a password change at first login.</Alert></Card>}{message && <Alert severity="info">{message}</Alert>}<Stack direction="row" sx={{
            justifyContent: "flex-end",
            gap: 1
          }}><Button onClick={() => {
              setValues({});
              setMessage('');
            }}>Reset form</Button><Button type="submit" variant="contained">Validate details</Button></Stack></Stack><Stack sx={{
          gap: 3
        }}><Card title={profile ? 'Your information, protected' : 'A strong foundation'}><Typography variant="body2" sx={{
              color: "text.secondary"
            }}>{profile ? 'You can update your phone and address. Employment details are managed by your HR team.' : 'These settings help keep your people operations consistent. Review your details before connecting the workspace.'}</Typography></Card>{page === 'leave-policies' && <Card title="Policy checks"><Typography variant="body2" sx={{
              color: "text.secondary"
            }}>Leave quotas, overlapping dates, weekends and public holidays must be validated by the backend before requests are approved.</Typography></Card>}{settings && <Card title="Account security"><Typography variant="body2" sx={{
              color: "text.secondary",
              mb: 2
            }}>Manage your password and keep access to your workspace secure.</Typography><Button href="/change-password" variant="outlined">Change password</Button></Card>}</Stack></Box></Box>}</>;
}
