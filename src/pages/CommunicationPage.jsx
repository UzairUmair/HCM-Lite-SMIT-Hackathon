import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { Card, EmptyState, PageHeader } from '../components/Common';
import { useApp } from '../context/AppContext';
import { announcementService, friendlyError, notificationService } from '../services/api';

function date(value) { return value?.toDate?.().toLocaleString() || 'Just now'; }

export default function CommunicationPage({ page }) {
  const { role, account } = useApp();
  const announcement = page === 'announcements';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', message: '', priority: 'Normal' });
  async function refresh() { setLoading(true); try { setItems(announcement ? await announcementService.list() : await notificationService.list(account?.uid)); } catch (cause) { setError(friendlyError(cause)); } finally { setLoading(false); } }
  useEffect(() => { refresh(); }, [page, account?.uid]);
  const shown = useMemo(() => items.filter(item => (filter === 'All' || (announcement ? item.priority === filter : filter === 'Unread' ? !item.readAt : !!item.readAt)) && (!search || `${item.title} ${item.message}`.toLowerCase().includes(search.toLowerCase()))), [items, filter, search, announcement]);
  function create() { setEditing(null); setForm({ title: '', message: '', priority: 'Normal' }); setOpen(true); }
  async function save(event) { event.preventDefault(); setBusy(true); setError(''); try { await (editing ? announcementService.update({ ...form, id: editing.id }) : announcementService.create(form)); setOpen(false); setSuccess(editing ? 'Announcement updated.' : 'Announcement published.'); await refresh(); } catch (cause) { setError(friendlyError(cause)); } finally { setBusy(false); } }
  async function markRead(item) { setError(''); try { await notificationService.markRead(item.id); setItems(items.map(row => row.id === item.id ? { ...row, readAt: new Date() } : row)); } catch (cause) { setError(friendlyError(cause)); } }
  return <><PageHeader title={announcement ? 'Announcements' : 'Notifications'} subtitle={announcement ? 'Important updates for everyone.' : 'Updates about your workday.'} action={announcement && role !== 'employee' && <Button variant="contained" onClick={create}>Create announcement</Button>} />
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
    <Card title={announcement ? 'Latest updates' : `${items.filter(item => !item.readAt).length} unread`}><Stack direction="row" sx={{ gap: 1, mb: 3, flexWrap: 'wrap' }}><TextField label="Search" size="small" value={search} onChange={event => setSearch(event.target.value)} /><TextField label="Filter" select size="small" value={filter} onChange={event => setFilter(event.target.value)} sx={{ minWidth: 140 }}>{(announcement ? ['All', 'Normal', 'Important', 'Urgent'] : ['All', 'Unread', 'Read']).map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField></Stack>{loading ? <CircularProgress /> : !shown.length ? <EmptyState title="No updates here yet" text="New information will appear here when available." /> : <Stack sx={{ gap: 1 }}>{shown.map(item => <Stack key={item.id} direction="row" sx={{ justifyContent: 'space-between', gap: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: !announcement && !item.readAt ? 'action.hover' : 'transparent' }}><Box><Typography fontWeight={700}>{item.title}</Typography><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>{item.message}</Typography><Typography variant="caption" sx={{ color: 'text.secondary' }}>{date(item.publishedAt || item.createdAt)}{announcement ? ` · ${item.priority}` : ''}</Typography></Box>{announcement && role !== 'employee' && (role === 'admin' || item.authorUid === account?.uid) ? <Button onClick={() => { setEditing(item); setForm({ title: item.title, message: item.message, priority: item.priority }); setOpen(true); }}>Edit</Button> : !announcement && !item.readAt ? <Button onClick={() => markRead(item)}>Mark read</Button> : null}</Stack>)}</Stack>}</Card>
    <Dialog open={open} onClose={() => !busy && setOpen(false)} fullWidth><Box component="form" onSubmit={save}><DialogTitle>{editing ? 'Edit announcement' : 'Create announcement'}</DialogTitle><DialogContent><Stack sx={{ gap: 2, pt: 1 }}><TextField label="Title" required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /><TextField label="Message" required multiline minRows={4} value={form.message} onChange={event => setForm({ ...form, message: event.target.value })} /><TextField label="Priority" select value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value })}>{['Normal', 'Important', 'Urgent'].map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>{error && <Alert severity="error">{error}</Alert>}</Stack></DialogContent><DialogActions><Button onClick={() => setOpen(false)} disabled={busy}>Cancel</Button><Button type="submit" variant="contained" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Publish announcement'}</Button></DialogActions></Box></Dialog>
  </>;
}
