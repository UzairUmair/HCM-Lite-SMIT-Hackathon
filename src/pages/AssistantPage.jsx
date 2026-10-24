import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import { Card, PageHeader } from '../components/Common';
import { useApp } from '../context/AppContext';
import { aiService, friendlyError } from '../services/api';

const prompts = {
  admin: ['How many employees are active?', 'Which department has the highest headcount?', 'What is today’s attendance?'],
  hr: ['Who came late today?', 'How many leave requests are pending?', 'Search employees in HR'],
  employee: ['How many sick leaves do I have left?', 'Explain the leave policy.'],
};

export default function AssistantPage() {
  const { role } = useApp();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function send(event) {
    event?.preventDefault();
    const question = input.trim();
    if (!question || busy) return;
    setInput(''); setError(''); setBusy(true);
    setMessages(previous => [...previous, { role: 'user', text: question }]);
    try {
      const result = await aiService.ask({ question });
      if (!result?.answer) throw new Error('Empty response');
      setMessages(previous => [...previous, { role: 'assistant', text: result.answer }]);
    } catch (cause) { setError(friendlyError(cause)); }
    finally { setBusy(false); }
  }
  return <><PageHeader title="HCM AI Assistant" subtitle="Ask about your people and workday with role-aware access." action={<Button startIcon={<AddRounded />} onClick={() => { setMessages([]); setInput(''); setError(''); }}>New conversation</Button>} />
    <Card sx={{ maxWidth: 880, mx: 'auto', minHeight: 560, display: 'flex', flexDirection: 'column' }}><Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}><AutoAwesomeOutlined color="primary" /><Typography variant="h6">Your workspace, understood.</Typography></Stack>
      {!messages.length && <Box sx={{ flex: 1, display: 'grid', placeContent: 'center', textAlign: 'center', py: 6 }}><Typography variant="h5">What would you like to know?</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Answers use only records your role can access.</Typography><Stack sx={{ gap: 1, mt: 3 }}>{prompts[role].map(prompt => <Button key={prompt} variant="outlined" onClick={() => setInput(prompt)}>{prompt}</Button>)}</Stack></Box>}
      {!!messages.length && <Stack aria-live="polite" sx={{ gap: 2, flex: 1, py: 3 }}>{messages.map((message, index) => <Box key={index} sx={{ p: 2, borderRadius: 2, bgcolor: message.role === 'user' ? 'primary.main' : 'action.hover', color: message.role === 'user' ? 'primary.contrastText' : 'text.primary', alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%', whiteSpace: 'pre-wrap' }}>{message.text}</Box>)}{busy && <CircularProgress size={22} />}</Stack>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={send} className="chat-composer"><TextField value={input} onChange={event => setInput(event.target.value)} placeholder="Ask a question…" fullWidth multiline maxRows={4} variant="standard" slotProps={{ input: { disableUnderline: true }, htmlInput: { 'aria-label': 'Message HCM AI' } }} /><Button type="submit" variant="contained" disabled={!input.trim() || busy} aria-label="Send message"><ArrowUpwardRounded /></Button></Box><Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>AI answers may be incomplete. Verify important decisions against source records.</Typography>
    </Card>
  </>;
}
