import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Alert, Box, Button, CircularProgress, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Card, PageHeader } from '../components/Common';
import { friendlyError, peopleService } from '../services/api';

const required = ['fullName', 'email', 'employeeCode', 'departmentId', 'designationId', 'joiningDate', 'basicSalary'];
const columns = [...required, 'phone', 'address'];

export function parseCsv(source) {
  const lines = [];
  let row = []; let value = ''; let quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '"' && quoted && source[i + 1] === '"') { value += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(value); value = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[i + 1] === '\n') i++;
      row.push(value); value = ''; if (row.some(cell => cell.trim())) lines.push(row); row = [];
    } else value += char;
  }
  if (quoted) throw new Error('The CSV has an unclosed quoted field.');
  row.push(value); if (row.some(cell => cell.trim())) lines.push(row);
  if (lines.length < 2) throw new Error('The CSV needs a header and at least one employee.');
  const headers = lines.shift().map(cell => cell.trim().replace(/^\uFEFF/, ''));
  if (new Set(headers).size !== headers.length) throw new Error('CSV headers must be unique.');
  for (const name of required) if (!headers.includes(name)) throw new Error(`Missing ${name} column.`);
  if (lines.length > 100) throw new Error('Import at most 100 employees at a time.');
  return lines.map((cells, index) => {
    const data = Object.fromEntries(headers.map((key, position) => [key, (cells[position] || '').trim()]));
    const errors = [];
    if (cells.length !== headers.length) errors.push('Column count differs from header');
    for (const key of required) if (!data[key]) errors.push(`${key} is required`);
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('Invalid email');
    if (data.basicSalary && !(Number(data.basicSalary) > 0)) errors.push('Invalid basic salary');
    if (data.joiningDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.joiningDate)) errors.push('Use YYYY-MM-DD for joiningDate');
    return { line: index + 2, data, errors };
  });
}

export default function ImportEmployeesPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  async function choose(event) {
    setError(''); setRows([]); setResults([]);
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) return setError('Choose a CSV smaller than 1 MB.');
    try {
      const parsed = parseCsv(await file.text());
      const seenEmail = new Set(); const seenCode = new Set();
      for (const row of parsed) {
        const email = row.data.email?.toLowerCase(); const code = row.data.employeeCode?.toUpperCase();
        if (seenEmail.has(email)) row.errors.push('Duplicate email in file');
        if (seenCode.has(code)) row.errors.push('Duplicate employee code in file');
        seenEmail.add(email); seenCode.add(code);
      }
      setRows(parsed);
    } catch (cause) { setError(cause.message); }
  }
  async function importRows() {
    setBusy(true); setError('');
    const next = [];
    for (const row of rows) {
      try { const created = await peopleService.register(row.data); next.push({ line: row.line, result: 'Created', temporaryPassword: created.temporaryPassword }); }
      catch (cause) { next.push({ line: row.line, result: friendlyError(cause) }); }
      setResults([...next]);
    }
    setBusy(false);
  }
  return <><PageHeader title="Import employees" subtitle="Check every row before creating accounts." action={<Button onClick={() => navigate('/admin/employees')}>Back to employees</Button>} /><Card title="Choose a CSV"><Typography variant="body2" sx={{ mb: 2 }}>Required columns: {required.join(', ')}. Optional: phone, address. Maximum 100 rows.</Typography><input aria-label="Choose CSV file" type="file" accept=".csv,text/csv" onChange={choose} />{error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}</Card>{rows.length > 0 && <Card title={`Preview · ${rows.length} rows`} sx={{ mt: 3 }}><TableContainer><Table sx={{ minWidth: 650 }}><TableHead><TableRow>{['Line', 'Name', 'Email', 'Code', 'Validation'].map(label => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead><TableBody>{rows.map(row => <TableRow key={row.line}><TableCell>{row.line}</TableCell><TableCell>{row.data.fullName}</TableCell><TableCell>{row.data.email}</TableCell><TableCell>{row.data.employeeCode}</TableCell><TableCell>{row.errors.length ? row.errors.join('; ') : 'Ready'}</TableCell></TableRow>)}</TableBody></Table></TableContainer><Button variant="contained" disabled={busy || rows.some(row => row.errors.length) || results.length > 0} sx={{ mt: 2 }} onClick={importRows}>{busy ? 'Creating accounts…' : `Import ${rows.length} employees`}</Button>{busy && <CircularProgress size={20} sx={{ ml: 2 }} />}{results.length > 0 && <Alert severity={results.every(row => row.result === 'Created') ? 'success' : 'warning'} sx={{ mt: 2 }}>{results.filter(row => row.result === 'Created').length} created. {results.filter(row => row.result !== 'Created').length} failed. Temporary passwords appear below once. Share them privately with each employee.</Alert>}{results.some(row => row.temporaryPassword) && <TableContainer sx={{ mt: 2 }}><Table><TableHead><TableRow><TableCell>CSV line</TableCell><TableCell>Temporary password</TableCell></TableRow></TableHead><TableBody>{results.filter(row => row.temporaryPassword).map(row => <TableRow key={row.line}><TableCell>{row.line}</TableCell><TableCell sx={{ overflowWrap: 'anywhere' }}>{row.temporaryPassword}</TableCell></TableRow>)}</TableBody></Table></TableContainer>}</Card>}</>;
}
