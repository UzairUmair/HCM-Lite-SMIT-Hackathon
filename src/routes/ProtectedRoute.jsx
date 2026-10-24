import { Navigate, useParams } from 'react-router';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';

// Preview navigation only. Replace role with verified auth claims when connecting Firebase.
// This component must never be relied on to authorize access to backend records.
export default function ProtectedRoute() {
  const { role } = useApp();
  const { role: requestedRole } = useParams();
  if (!role) return <Navigate to="/login" replace />;
  if (role !== requestedRole) return <Navigate to="/unauthorized" replace />;
  return <Layout />;
}
