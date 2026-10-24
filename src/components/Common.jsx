import { useState } from 'react';
import { Box, Paper, Typography, Button, Stack, Chip, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, MenuItem, Skeleton } from '@mui/material';
import InboxOutlined from "@mui/icons-material/InboxOutlined";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
export function PageHeader({
  title,
  subtitle,
  action
}) {
  return <Stack direction="row" sx={{
    justifyContent: "space-between",
    alignItems: "center",
    gap: 2,
    flexWrap: "wrap",
    mb: 3
  }}><Box><Typography variant="h4" component="h1">{title}</Typography><Typography variant="body2" sx={{
        color: "text.secondary",
        mt: .7
      }}>{subtitle}</Typography></Box>{action}</Stack>;
}
export function Card({
  title,
  subtitle,
  action,
  children,
  sx = {}
}) {
  return <Paper sx={{
    p: 3,
    border: '1px solid',
    borderColor: 'divider',
    ...sx
  }}>{(title || subtitle || action) && <Stack direction="row" sx={{
      alignItems: "center",
      justifyContent: "space-between",
      mb: 2,
      gap: 1
    }}><Box>{title && <Typography variant="h6">{title}</Typography>}{subtitle && <Typography variant="caption" sx={{
          color: "text.secondary"
        }}>{subtitle}</Typography>}</Box>{action}</Stack>}{children}</Paper>;
}
export function EmptyState({
  title = 'A fresh start, ready for your team',
  text = 'Your records will appear here once your workspace is connected.',
  compact = false
}) {
  return <Box sx={{
    textAlign: 'center',
    py: compact ? 3 : 6,
    px: 2
  }}><Box className="empty-icon"><InboxOutlined /></Box><Typography sx={{
      fontWeight: 650,
      mt: 2
    }}>{title}</Typography><Typography variant="body2" sx={{
      color: "text.secondary",
      mt: .7,
      maxWidth: 360,
      mx: "auto"
    }}>{text}</Typography></Box>;
}
export function StatusChip({
  label
}) {
  return <Chip size="small" label={label} variant="outlined" sx={{
    fontSize: 11,
    height: 25
  }} />;
}
export function LoadingSkeleton() {
  return <Stack sx={{
    gap: 2
  }}><Skeleton height={80} /><Skeleton height={160} /></Stack>;
}
export function StatCard({
  title,
  icon: Icon,
  detail,
  value
}) {
  return <Card sx={{
    p: 2.5
  }}><Stack direction="row" sx={{
      justifyContent: "space-between"
    }}><Typography variant="body2" sx={{
        color: "text.secondary"
      }}>{title}</Typography>{Icon && <Icon sx={{
        color: 'primary.main',
        fontSize: 20
      }} />}</Stack><Typography sx={{
      fontSize: 30,
      fontWeight: 750,
      my: 1
    }}>{value ?? '—'}</Typography><Typography variant="caption" sx={{
      color: "text.secondary"
    }}>{detail || 'Awaiting connected data'}</Typography></Card>;
}
export function Fields({
  fields,
  values,
  setValues
}) {
  return <Box className="form-grid">{fields.map(field => {
      const [label, type = 'text', options] = typeof field === 'string' ? [field] : field;
      return <TextField key={label} label={label} type={options ? undefined : type} select={!!options} value={values[label] ?? ''} onChange={e => setValues({
        ...values,
        [label]: e.target.value
      })} required={!label.includes('optional')} fullWidth size="small" slotProps={{
        inputLabel: {
          shrink: true
        },
        htmlInput: {
          min: type === 'number' ? 0 : undefined,
          minLength: type === 'password' ? 8 : undefined
        }
      }}>{options?.map(option => <MenuItem key={option} value={option}>{option}</MenuItem>)}</TextField>;
    })}</Box>;
}
export function FormDialog({
  title,
  fields,
  open,
  onClose
}) {
  const [values, setValues] = useState({});
  const [error, setError] = useState('');
  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm"><Box component="form" onSubmit={e => {
      e.preventDefault();
      setError('Service not connected. Your entries have not been saved.');
    }}><DialogTitle>{title}</DialogTitle><DialogContent><Alert severity="info" sx={{
          mb: 3
        }}>Preview the form. Saving requires a connected service.</Alert><Fields fields={fields} values={values} setValues={setValues} />{error && <Alert severity="warning" sx={{
          mt: 2
        }}>{error}</Alert>}</DialogContent><DialogActions><Button onClick={onClose}>Cancel</Button><Button type="submit" variant="contained">Validate form</Button></DialogActions></Box></Dialog>;
}
export function DataTable({
  columns,
  title,
  text
}) {
  return <><TableContainer><Table sx={{
      minWidth: 650
    }}><TableHead><TableRow>{columns.map(c => <TableCell key={c}>{c}</TableCell>)}</TableRow></TableHead><TableBody /></Table></TableContainer><EmptyState title={title} text={text} /></>;
}
export function ServiceNote() {
  return <Alert severity="info" variant="outlined" sx={{
    mb: 3
  }}>UI preview · Live data and secure actions will be available after service integration.</Alert>;
}
export function TextLink({
  children,
  onClick
}) {
  return <Button size="small" endIcon={<ArrowForwardRounded />} onClick={onClick}>{children}</Button>;
}
