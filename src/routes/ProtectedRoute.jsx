import { Navigate, useParams } from 'react-router';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { Box, CircularProgress } from '@mui/material';

// Routes improve UX; Firestore rules and callable functions enforce real permissions.
export default function ProtectedRoute() {
  const { role, account, authLoading } = useApp();
  const { role: requestedRole } = useParams();
  if (authLoading) return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><CircularProgress aria-label="Checking your account" /></Box>;
  if (!role) return <Navigate to="/login" replace />;
  if (role !== requestedRole) return <Navigate to="/unauthorized" replace />;
  if (account?.mustChangePassword) return <Navigate to="/first-login" replace />;
  return <Layout />;
}
