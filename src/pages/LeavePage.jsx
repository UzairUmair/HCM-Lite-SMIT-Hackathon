import { useState } from 'react';
import { Box, Stack, Button, Typography, TextField, Alert, LinearProgress } from '@mui/material';
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import AddRounded from "@mui/icons-material/AddRounded";
import { Card, PageHeader, DataTable, Fields } from '../components/Common';
import { useApp } from '../context/AppContext';
export default function LeavePage() {
  const {
    role
  } = useApp();
  const [form, setForm] = useState(role === 'employee');
  const [values, setValues] = useState({});
  const [error, setError] = useState('');
  return <><PageHeader title={role === 'employee' ? 'Time for you' : 'Leave overview'} subtitle="Make space for life. Keep your team in sync." action={role === 'employee' && <Button variant="contained" startIcon={<AddRounded />} onClick={() => setForm(!form)}>{form ? 'Hide application' : 'Apply for leave'}</Button>} /><Box className="stats-grid four">{['Annual leave', 'Sick leave', 'Casual leave', 'Unpaid leave'].map(type => <Card key={type} title={type}><Typography sx={{
          fontSize: 28,
          fontWeight: 750
        }}>— <Typography component="span" sx={{
            fontSize: 12,
            color: "text.secondary"
          }}>days available</Typography></Typography><LinearProgress aria-label="Leave balance unavailable" aria-valuetext="Not connected" variant="determinate" value={0} sx={{
          my: 2,
          height: 5,
          borderRadius: 3
        }} /><Typography variant="caption" sx={{
          color: "text.secondary"
        }}>Allowance — · Used — · Remaining —</Typography></Card>)}</Box>{form && <Box className="two-columns" sx={{
      mb: 3
    }}><Card title="Apply for leave" subtitle="A little planning goes a long way"><Box component="form" onSubmit={e => {
          e.preventDefault();
          setError(values['End date'] < values['Start date'] ? 'End date must be on or after the start date.' : 'Leave submission is not connected. Your request has not been submitted.');
        }}><Fields fields={[["Leave type", "text", ['Annual', 'Sick', 'Casual', 'Unpaid']], ['Start date', 'date'], ['End date', 'date'], 'Reason']} values={values} setValues={setValues} /><Typography variant="caption" sx={{
            color: "text.secondary",
            display: "block",
            my: 2
          }}>Available balance and working days require your company’s verified leave policy.</Typography>{error && <Alert severity="warning" sx={{
            mb: 2
          }}>{error}</Alert>}<Button type="submit" variant="contained">Review request</Button></Box></Card><Card title="Ask naturally" subtitle="Smart leave · Coming soon"><AutoAwesomeOutlined color="primary" sx={{
          mb: 2
        }} /><Typography variant="body2" sx={{
          color: "text.secondary",
          mb: 2
        }}>Describe your plans. HCM AI will help prepare a request for you to review and confirm.</Typography><TextField fullWidth multiline minRows={3} label="Your leave plans" placeholder="Example: I need next Monday and Tuesday off for a wedding." /><Button disabled sx={{
          mt: 2
        }}>Prepare with AI</Button><Typography variant="caption" sx={{
          display: "block",
          color: "text.secondary"
        }}>Secure AI service not connected.</Typography></Card></Box>}<Card title={role === 'employee' ? 'My leave requests' : 'Approval inbox'} subtitle={role === 'employee' ? 'Keep track of your time away' : 'Requests awaiting your team’s review'}><DataTable columns={['Employee', 'Leave type', 'Start date', 'End date', 'Working days', 'Status', 'HR comment', ...(role === 'employee' ? [] : ['Actions'])]} title="No connected leave requests" text="Pending, approved, rejected and cancelled requests will appear here once connected." /></Card></>;
}
