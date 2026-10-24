import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Alert, Box, Button, CircularProgress, Drawer, IconButton, Stack, Typography } from '@mui/material';
import CloseRounded from '@mui/icons-material/CloseRounded';
import { EmptyState } from './Common';
import { friendlyError, notificationService } from '../services/api';
import { useApp } from '../context/AppContext';

export default function NotificationDrawer({ open, onClose }) {
  const { account, role } = useApp();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!open || !account?.uid) return;
    setLoading(true);
    notificationService.list(account.uid).then(setItems).catch(cause => setError(friendlyError(cause))).finally(() => setLoading(false));
  }, [open, account?.uid]);
  async function mark(item) { try { await notificationService.markRead(item.id); setItems(items.map(row => row.id === item.id ? { ...row, readAt: new Date() } : row)); } catch (cause) { setError(friendlyError(cause)); } }
  return <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { sx: { width: 'min(400px, 100vw)', p: 3 } } }}><Stack direction="row" sx={{ justifyContent: 'space-between' }}><Typography variant="h6">Notifications</Typography><IconButton aria-label="Close notifications" onClick={onClose}><CloseRounded /></IconButton></Stack>{error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}{loading ? <Box sx={{ py: 5, textAlign: 'center' }}><CircularProgress /></Box> : !items.length ? <EmptyState title="You're all caught up" text="New updates will appear here." /> : <Stack sx={{ gap: 1, mt: 3 }}>{items.slice(0, 10).map(item => <Box key={item.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: !item.readAt ? 'action.hover' : 'transparent' }}><Typography sx={{ fontWeight: 700 }}>{item.title}</Typography><Typography variant="body2">{item.message}</Typography>{!item.readAt && <Button size="small" onClick={() => mark(item)}>Mark read</Button>}</Box>)}</Stack>}<Button sx={{ mt: 3 }} onClick={() => { onClose(); navigate(`/${role}/notifications`); }}>View all notifications</Button></Drawer>;
}
