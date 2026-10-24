import { useState } from 'react';
import { Box, Stack, TextField, MenuItem, Button, Typography } from '@mui/material';
import { Card, PageHeader, DataTable, StatCard, FormDialog } from '../components/Common';
import { AttendanceWidget } from './Dashboard';
import { useApp } from '../context/AppContext';
export default function AttendancePage() {
  const {
    role
  } = useApp();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [status, setStatus] = useState('All statuses');
  const [year, mon] = month.split('-').map(Number);
  const days = new Date(year, mon, 0).getDate();
  const offset = (new Date(year, mon - 1, 1).getDay() + 6) % 7;
  return <><PageHeader title={role === 'employee' ? 'My attendance' : 'Attendance board'} subtitle="Every workday, clearly accounted for." action={<Button variant="outlined" onClick={() => setOpen(true)}>Request correction</Button>} /><Box className="stats-grid four">{['Present', 'Late', 'On leave', 'Missing checkout'].map(title => <StatCard key={title} title={title} />)}</Box><Box className="two-columns" sx={{
      mb: 3
    }}>{role === 'employee' ? <AttendanceWidget /> : <Card title="Daily overview"><Typography variant="body2" sx={{
          color: "text.secondary"
        }}>Review attendance across departments, identify missing checkouts, and follow up on corrections.</Typography><Box className="attendance-legend">{['Present', 'Late', 'Absent', 'On leave', 'Half day', 'Missing checkout'].map((s, i) => <span key={s}><i style={{
              background: ['#16a34a', '#d89112', '#ef4444', '#14b8a6', '#e78a37', '#a47d20'][i]
            }} />{s}</span>)}</Box></Card>}<Card title="Attendance calendar" action={<TextField type="month" size="small" value={month} onChange={e => e.target.value && setMonth(e.target.value)} slotProps={{
        htmlInput: {
          'aria-label': 'Calendar month'
        }
      }} />}><Box className="calendar-grid">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <Typography key={`h${i}`} variant="caption" sx={{
            color: "text.secondary"
          }}>{d}</Typography>)}{Array.from({
            length: offset
          }, (_, i) => <span key={`o${i}`} />)}{Array.from({
            length: days
          }, (_, i) => <span key={i} className="calendar-day">{i + 1}</span>)}</Box><Typography variant="caption" sx={{
          color: "text.secondary"
        }}>Calendar only · no attendance data connected</Typography></Card></Box><Card title="Daily records"><Stack direction="row" sx={{
        gap: 2,
        mb: 2
      }}><TextField label="Date" type="date" size="small" slotProps={{
          inputLabel: {
            shrink: true
          }
        }} /><TextField label="Status" select size="small" value={status} onChange={e => setStatus(e.target.value)} sx={{
          minWidth: 160
        }}>{['All statuses', 'Present', 'Late', 'Absent', 'On leave', 'Half day', 'Missing checkout'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Stack><DataTable columns={['Employee', 'Department', 'Date', 'Check-in', 'Check-out', 'Total hours', 'Status']} title="Workdays will appear here" /></Card><FormDialog title="Request attendance correction" fields={[["Requested date", "date"], ['Requested check-in', 'time'], ['Requested check-out', 'time'], 'Reason']} open={open} onClose={() => setOpen(false)} /></>;
}
