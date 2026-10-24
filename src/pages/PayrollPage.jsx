import { useState } from 'react';
import { Box, Stack, Button, TextField, Typography, Alert, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Card, PageHeader, StatCard, DataTable, Fields } from '../components/Common';
import { useApp } from '../context/AppContext';
export default function PayrollPage({
  page
}) {
  const {
    role
  } = useApp();
  const [values, setValues] = useState({});
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const payslips = page === 'payslips';
  const salary = page === 'salaries';
  return <><PageHeader title={payslips ? 'My payslips' : salary ? 'Salary management' : 'Payroll workspace'} subtitle="Clarity and care, down to the last detail." action={<TextField label="Payroll month" type="month" size="small" defaultValue={new Date().toISOString().slice(0, 7)} slotProps={{
      inputLabel: {
        shrink: true
      }
    }} />} />{!payslips && <><Box className="stats-grid four">{['Total employees', 'Gross salary', 'Deductions', 'Estimated net payroll'].map(title => <StatCard key={title} title={title} />)}</Box><Alert severity="info" sx={{
        mb: 3
      }}>Payroll rules and the challenge brief have not been provided. Financial calculations and finalization remain unavailable.</Alert></>}{salary && <Card title="Salary structure" sx={{
      mb: 3
    }}><Box component="form" onSubmit={e => {
        e.preventDefault();
        setError('Validated locally. No salary record was saved; the service is not connected.');
      }}><Fields fields={['Employee code', ['Basic salary', 'number'], ['House rent allowance', 'number'], ['Medical allowance', 'number'], ['Other deductions', 'number']]} values={values} setValues={setValues} /><Typography variant="body2" sx={{
          my: 2
        }}>Calculated gross salary: —</Typography>{error && <Alert severity="info" sx={{
          mb: 2
        }}>{error}</Alert>}<Button variant="contained" type="submit">Validate structure</Button></Box></Card>}<Card title={payslips ? 'Your pay history' : 'Payroll review'} action={<Chip label="Not connected" size="small" variant="outlined" />}><Stack direction="row" sx={{
        gap: 1,
        flexWrap: "wrap",
        mb: 2
      }}>{!payslips && <><Button disabled variant="contained">Generate draft</Button><Button disabled>Submit for finalization</Button>{role === 'admin' && <Button disabled>Finalize payroll</Button>}</>}<Button variant="outlined" onClick={() => setOpen(true)}>Preview payslip layout</Button></Stack><DataTable columns={payslips ? ['Salary month', 'Gross salary', 'Deductions', 'Net salary', 'Download'] : ['Employee', 'Department', 'Basic salary', 'Allowances', 'Gross salary', 'Deductions', 'Tax', 'Net salary', 'Status']} title="Your payroll starts with verified records" text="No financial records are connected. Drafts and finalized payroll will appear here once available." /></Card><Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm"><DialogTitle>Payslip layout <Chip label="UI preview" size="small" sx={{
          ml: 1
        }} /></DialogTitle><DialogContent><Box className="payslip"><Typography variant="h5">HCM Lite</Typography><Typography variant="caption" sx={{
            color: "text.secondary"
          }}>Company name from workspace</Typography><Typography variant="h6" sx={{
            mt: 3
          }}>Salary statement</Typography><Typography variant="body2" sx={{
            color: "text.secondary",
            mb: 3
          }}>Employee — · Code — · Month —</Typography>{['Basic salary', 'House rent allowance', 'Medical allowance', 'Gross salary', 'Deductions', 'Tax', 'Net salary'].map(label => <Stack key={label} direction="row" sx={{
            justifyContent: "space-between",
            py: 1.4,
            ...{
              borderBottom: '1px solid',
              borderColor: 'divider'
            }
          }}><Typography variant="body2" sx={{
              fontWeight: label === 'Net salary' ? 750 : 400
            }}>{label}</Typography><Typography>—</Typography></Stack>)}<Typography variant="caption" sx={{
            color: "text.secondary",
            display: "block",
            mt: 3
          }}>Layout preview only. This is not a financial document.</Typography></Box></DialogContent><DialogActions><Button onClick={() => setOpen(false)}>Close</Button><Button disabled>Download PDF</Button></DialogActions></Dialog></>;
}
