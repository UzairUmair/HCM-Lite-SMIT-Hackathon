import { useState } from 'react';
import { Box, Button, Stack, TextField, MenuItem, Typography, TablePagination, Alert } from '@mui/material';
import AddRounded from "@mui/icons-material/AddRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import FileUploadOutlined from "@mui/icons-material/FileUploadOutlined";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";
import { useNavigate } from 'react-router';
import { Card, PageHeader, DataTable, FormDialog } from '../components/Common';
import { useApp } from '../context/AppContext';
export const management = {
  departments: {
    title: 'Departments',
    subtitle: 'Give every team a place to belong.',
    item: 'department',
    columns: ['Department name', 'Code', 'Employees', 'Status', 'Actions'],
    fields: ['Department name', 'Department code', ['Status', 'text', ['Active', 'Inactive']]]
  },
  designations: {
    title: 'Designations',
    subtitle: 'Bring clarity to the roles across your organization.',
    item: 'designation',
    columns: ['Job title', 'Department', 'Status', 'Actions'],
    fields: ['Job title', 'Department', ['Status', 'text', ['Active', 'Inactive']]]
  },
  holidays: {
    title: 'Holiday calendar',
    subtitle: 'Plan ahead for the days everyone can switch off.',
    item: 'holiday',
    columns: ['Holiday', 'Date', 'Applies to', 'Actions'],
    fields: ['Holiday name', ['Date', 'date'], ['Applies to', 'text', ['All employees']]]
  },
  'hr-accounts': {
    title: 'HR accounts',
    subtitle: 'The people keeping your people operations running.',
    item: 'HR account',
    columns: ['Name', 'Email', 'Status', 'Last login', 'Actions'],
    fields: ['Full name', ['Work email', 'email']]
  },
  employees: {
    title: 'Your people',
    subtitle: 'A connected view of the people behind your company.',
    item: 'employee',
    columns: ['Employee', 'Employee code', 'Department', 'Designation', 'Joining date', 'Status', 'Actions'],
    fields: []
  },
  'audit-logs': {
    title: 'Audit trail',
    subtitle: 'A trustworthy record of important changes.',
    columns: ['Actor', 'Action', 'Entity', 'Timestamp', 'Details']
  },
  corrections: {
    title: 'Attendance corrections',
    subtitle: 'Review discrepancies and keep work records accurate.',
    item: 'correction request',
    columns: ['Employee', 'Requested date', 'Correction', 'Reason', 'Status', 'Actions'],
    fields: [['Requested date', 'date'], ['Check-in time', 'time'], ['Check-out time', 'time'], 'Reason']
  }
};
export default function ManagementPage({
  page
}) {
  const config = management[page];
  const {
    role
  } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All statuses');
  const [rows, setRows] = useState(10);
  const [importOpen, setImportOpen] = useState(false);
  const [file, setFile] = useState('');
  const canAdd = !!config.item && (page !== 'employees' || role === 'hr');
  return <><PageHeader title={config.title} subtitle={config.subtitle} action={canAdd && <Button variant="contained" startIcon={<AddRounded />} onClick={() => page === 'employees' ? navigate('/hr/employees/new') : setOpen(true)}>Add {config.item}</Button>} />{page === 'hr-accounts' && <Alert severity="info" sx={{
      mb: 3
    }}>Account creation, deactivation and password resets require trusted administrative services.</Alert>}<Card><Stack direction="row" sx={{
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 2,
        mb: 3
      }}><Stack direction="row" sx={{
          gap: 1,
          flexWrap: "wrap"
        }}><TextField size="small" label={`Search ${config.title.toLowerCase()}`} value={query} onChange={e => setQuery(e.target.value)} /><TextField size="small" select label="Status" value={status} onChange={e => setStatus(e.target.value)} sx={{
            minWidth: 150
          }}>{['All statuses', 'Active', 'Inactive', 'Pending', 'Approved', 'Rejected'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>{page === 'employees' && <><TextField select size="small" defaultValue="all" label="Department" sx={{
              minWidth: 150
            }}><MenuItem value="all">All departments</MenuItem></TextField><TextField select size="small" defaultValue="all" label="Designation" sx={{
              minWidth: 150
            }}><MenuItem value="all">All designations</MenuItem></TextField></>}</Stack>{page === 'employees' && role === 'hr' && <Stack direction="row" sx={{
          gap: 1
        }}><Button startIcon={<FileUploadOutlined />} onClick={() => setImportOpen(!importOpen)}>Import CSV</Button><Button startIcon={<FileDownloadOutlined />} disabled>Export CSV</Button></Stack>}</Stack>{importOpen && <Box sx={{
        p: 2,
        mb: 2,
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 2
      }}><Typography variant="body2" sx={{
          mb: 1
        }}>Select a CSV to prepare an import. Uploading and validation require the employee service.</Typography><input aria-label="Choose employee CSV" type="file" accept=".csv" onChange={e => setFile(e.target.files[0]?.name || '')} />{file && <Alert severity="info" sx={{
          mt: 2
        }}>{file} selected locally. No records have been imported.</Alert>}</Box>}<Stack direction="row" sx={{
        justifyContent: "space-between",
        mb: 1
      }}><Typography variant="body2" sx={{
          fontWeight: 650
        }}>{config.title} <Typography component="span" variant="caption" sx={{
            color: "text.secondary"
          }}> · Not connected</Typography></Typography><TextField size="small" select defaultValue="name" label="Sort by" sx={{
          width: 160
        }}><MenuItem value="name">Name A–Z</MenuItem><MenuItem value="recent">Most recent</MenuItem></TextField></Stack><DataTable columns={config.columns} title={query ? 'No searchable records yet' : page === 'employees' ? 'Your people will appear here' : `${config.title} will appear here`} text={query ? 'Connect your workspace to search and filter real records.' : 'Connect your workspace to load records and manage them securely.'} /><TablePagination component="div" count={0} page={0} onPageChange={() => {}} rowsPerPage={rows} onRowsPerPageChange={e => setRows(Number(e.target.value))} rowsPerPageOptions={[10, 25, 50]} labelDisplayedRows={() => 'Awaiting data'} /></Card><FormDialog title={`Add ${config.item}`} fields={config.fields || []} open={open} onClose={() => setOpen(false)} /></>;
}
