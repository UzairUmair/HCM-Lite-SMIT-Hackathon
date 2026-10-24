import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, CircularProgress, LinearProgress, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { Card, EmptyState, PageHeader, StatCard } from '../components/Common';
import { attendanceService, friendlyError, leaveService, payrollService, peopleService } from '../services/api';

function BarList({ rows }) {
  if (!rows.length) return <EmptyState compact title="No records for this filter" text="Try a different month or department." />;
  const max = Math.max(...rows.map(row => row.count), 1);
  return <Stack sx={{ gap: 2 }}>{rows.map(row => <Box key={row.label}><Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}><Typography variant="body2">{row.label}</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{row.count}</Typography></Stack><LinearProgress variant="determinate" value={row.count / max * 100} sx={{ height: 8, borderRadius: 2 }} /></Box>)}</Stack>;
}

export default function AnalyticsPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [department, setDepartment] = useState('All');
  const [data, setData] = useState({ employees: [], attendance: [], leaves: [], payroll: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([peopleService.list(), attendanceService.list('hr'), leaveService.list('hr'), payrollService.list()])
      .then(([employees, attendance, leaves, payroll]) => setData({ employees, attendance, leaves, payroll }))
      .catch(cause => setError(friendlyError(cause))).finally(() => setLoading(false));
  }, []);
  const departments = [...new Set(data.employees.map(row => row.departmentId).filter(Boolean))].sort();
  const employeeIds = useMemo(() => new Set(data.employees.filter(row => department === 'All' || row.departmentId === department).map(row => row.id)), [data.employees, department]);
  const people = data.employees.filter(row => employeeIds.has(row.id));
  const attendance = data.attendance.filter(row => row.dateKey?.startsWith(month) && employeeIds.has(row.employeeId));
  const leaves = data.leaves.filter(row => row.startDate?.startsWith(month) && employeeIds.has(row.employeeId));
  const payroll = data.payroll.find(row => row.month === month && row.status === 'Finalized');
  const group = (items, field) => Object.entries(items.reduce((result, row) => { const key = row[field] || 'Unassigned'; result[key] = (result[key] || 0) + 1; return result; }, {})).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
  const payrollByDepartment = payroll ? group(payroll.lines?.filter(row => employeeIds.has(row.employeeId)) || [], 'departmentId').map(row => ({ ...row, count: Math.round(payroll.lines.filter(line => line.departmentId === row.label && employeeIds.has(line.employeeId)).reduce((sum, line) => sum + line.net, 0)) })) : [];
  return <><PageHeader title="People analytics" subtitle="A clear view of records already saved in your workspace." action={<Stack direction="row" sx={{ gap: 1 }}><TextField type="month" size="small" label="Month" value={month} onChange={event => setMonth(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} /><TextField size="small" select label="Department" value={department} onChange={event => setDepartment(event.target.value)} sx={{ minWidth: 150 }}><MenuItem value="All">All departments</MenuItem>{departments.map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField></Stack>} />
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{loading ? <CircularProgress /> : <><Box className="stats-grid four"><StatCard title="Active employees" value={people.filter(row => row.status === 'Active').length} /><StatCard title="Check-ins" value={attendance.length} /><StatCard title="Late arrivals" value={attendance.filter(row => row.late).length} /><StatCard title="Leave requests" value={leaves.length} /></Box><Box className="two-columns"><Card title="Headcount by department"><BarList rows={group(people.filter(row => row.status === 'Active'), 'departmentId')} /></Card><Card title="Attendance status"><BarList rows={group(attendance, 'status')} /></Card><Card title="Leave by type"><BarList rows={group(leaves, 'type')} /></Card><Card title="Finalized payroll by department"><BarList rows={payrollByDepartment} />{payroll && <Typography variant="caption" color="text.secondary">Values shown in PKR, rounded to whole rupees.</Typography>}</Card></Box></>}
  </>;
}
