import { ThemeProvider, CssBaseline, Snackbar, Alert } from '@mui/material';
import { Routes, Route, Navigate } from 'react-router';
import { AppProvider, useApp } from './context/AppContext';
import { makeTheme } from './theme/theme';
import ProtectedRoute from './routes/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ModulePage from './pages/ModulePage';
import AssistantPage from './pages/AssistantPage';
import ImportEmployeesPage from './pages/ImportEmployeesPage';
import { EmptyState } from './components/Common';
import { navigation } from './routes/navigation';
function Content() {
  const {
    mode,
    notice,
    setNotice
  } = useApp();
  return <ThemeProvider theme={makeTheme(mode)}><CssBaseline /><Routes><Route path="/" element={<Navigate to="/login" replace />} />{['login', 'signup', 'forgot-password', 'reset-password', 'change-password', 'first-login'].map(page => <Route key={page} path={`/${page}`} element={<AuthPage key={page} page={page} />} />)}<Route path="/setup" element={<Navigate to="/login" replace />} /><Route path="/:role" element={<ProtectedRoute />}><Route index element={<Navigate to="dashboard" replace />} /><Route path="dashboard" element={<Dashboard />} /><Route path="ai-assistant" element={<AssistantPage />} /><Route path="employees/import" element={<ImportRoute />} />{[...new Set(Object.values(navigation).flatMap(groups => groups.flatMap(g => g.slice(1).map(([p]) => p))))].filter(p => !['dashboard', 'ai-assistant'].includes(p)).map(page => <Route key={page} path={page} element={<ModulePage key={page} page={page} />} />)}<Route path="employees/:id" element={<ModulePage page="profile" />} /></Route><Route path="/unauthorized" element={<ErrorPage unauthorized />} /><Route path="*" element={<ErrorPage />} /></Routes><Snackbar open={!!notice} autoHideDuration={6000} onClose={() => setNotice('')}><Alert severity="info" onClose={() => setNotice('')}>{notice}</Alert></Snackbar></ThemeProvider>;
}
function ImportRoute() { const { role } = useApp(); return role === 'hr' ? <ImportEmployeesPage /> : <Navigate to="/unauthorized" replace />; }
function ErrorPage({
  unauthorized
}) {
  return <div className="error-page"><EmptyState title={unauthorized ? 'This workspace is restricted' : 'We couldn’t find that page'} text={unauthorized ? 'Choose the matching role preview to explore this workspace.' : 'The page may have moved. Return to the start to continue.'} /><a href="/login">Return to sign in</a></div>;
}
export default function App() {
  return <AppProvider><Content /></AppProvider>;
}
