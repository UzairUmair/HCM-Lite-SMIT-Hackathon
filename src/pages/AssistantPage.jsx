import { useState } from 'react';
import { Box, Stack, Typography, Button, TextField, Alert, Chip, IconButton } from '@mui/material';
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import ArrowUpwardRounded from "@mui/icons-material/ArrowUpwardRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import ShieldOutlined from "@mui/icons-material/ShieldOutlined";
import { Card, PageHeader } from '../components/Common';
import { useApp } from '../context/AppContext';
import { aiService } from '../services/api';
const questions = {
  admin: ['How many employees are active?', 'What is our monthly payroll cost?', 'Which department has the highest headcount?'],
  hr: ['Who came late this month?', 'How many leave requests are pending?', 'What is today’s attendance rate?'],
  employee: ['How many sick leaves do I have left?', 'Show my attendance this month.', 'Explain the leave policy.']
};
export default function AssistantPage() {
  const {
    role
  } = useApp();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function send(e) {
    e?.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, input]);
    setLoading(true);
    try {
      await aiService.ask(input);
    } catch {
      setError('HCM AI is not connected yet. Your message was not sent to an AI provider.');
    } finally {
      setLoading(false);
    }
  }
  return <><PageHeader title="HCM AI Assistant" subtitle="A thoughtful assistant for your everyday people questions." action={<Button startIcon={<AddRounded />} onClick={() => {
      setMessages([]);
      setInput('');
      setError('');
    }}>New conversation</Button>} /><Box className="assistant-layout"><Card sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 560
      }}><Stack direction="row" sx={{
          alignItems: "center",
          gap: 1
        }}><AutoAwesomeOutlined color="primary" /><Typography variant="h6">Your workspace, understood.</Typography><Chip label="Coming soon" size="small" sx={{
            ml: 'auto'
          }} /></Stack><Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 5
        }}><div className="assistant-orb"><AutoAwesomeOutlined sx={{
              fontSize: 36
            }} /></div><Typography variant="h5" sx={{
            textAlign: "center",
            mt: 3
          }}>Less searching. More understanding.</Typography><Typography variant="body2" sx={{
            color: "text.secondary",
            textAlign: "center",
            maxWidth: 420,
            mx: "auto",
            mt: 1
          }}>Ask about your people, policies and workday. Secure, role-aware answers are on their way.</Typography><Box className="question-grid">{questions[role].map(q => <Button key={q} variant="outlined" onClick={() => setInput(q)}>{q}</Button>)}</Box></Box><Stack aria-live="polite" sx={{
          gap: 2
        }}>{messages.map((message, i) => <Box key={i} className="user-message">{message}</Box>)}{loading && <Typography variant="body2">Connecting…</Typography>}{error && <Alert severity="info" action={<Button size="small" onClick={() => send()}>Retry</Button>}>{error}</Alert>}</Stack><Box component="form" onSubmit={send} className="chat-composer"><TextField value={input} onChange={e => setInput(e.target.value)} placeholder="Ask HCM AI anything about your workspace…" fullWidth multiline maxRows={4} variant="standard" slotProps={{
            input: {
              disableUnderline: true
            },
            htmlInput: {
              'aria-label': 'Message HCM AI'
            }
          }} /><IconButton aria-label="Send message" type="submit" disabled={!input.trim() || loading} sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: 2
          }}><ArrowUpwardRounded /></IconButton></Box><Typography variant="caption" sx={{
          color: "text.secondary",
          textAlign: "center"
        }}>AI service not connected · No generated answers available</Typography></Card><Stack sx={{
        gap: 3
      }}><Card title="Built with boundaries"><ShieldOutlined color="primary" sx={{
            mb: 2
          }} /><Typography variant="body2" sx={{
            color: "text.secondary"
          }}>Your assistant will only access information your role permits. Sensitive records stay protected by the same server-side permissions as your workspace.</Typography></Card><Card title="Good questions start here"><Typography variant="body2" sx={{
            color: "text.secondary"
          }}>Be specific about the dates, teams or policies you want to understand. Always review AI-prepared actions before confirming them.</Typography></Card></Stack></Box></>;
}
