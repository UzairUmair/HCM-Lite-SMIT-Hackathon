import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, firebaseConfigured } from '../firebase';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [role, setRole] = useState(null);
  const [account, setAccount] = useState(null);
  const [authLoading, setAuthLoading] = useState(firebaseConfigured);
  const [authError, setAuthError] = useState('');
  const [mode, setMode] = useState(() => localStorage.getItem('hcm-theme') === 'dark' ? 'dark' : 'light');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, async user => {
      setAuthLoading(true);
      setRole(null);
      setAccount(null);
      if (!user) { setAuthLoading(false); return; }
      setAuthError('');
      try {
        const [token, profile] = await Promise.all([
          user.getIdTokenResult(true),
          getDoc(doc(db, 'users', user.uid)),
        ]);
        const verifiedRole = token.claims.role;
        const data = profile.data();
        if (!['admin', 'hr', 'employee'].includes(verifiedRole) || !data || data.role !== verifiedRole || data.active !== true) {
          setAuthError('This account is not active or its role has not been provisioned. Contact your administrator.');
          await signOut(auth);
        } else {
          setRole(verifiedRole);
          setAccount({ uid: user.uid, email: user.email, ...data });
        }
      } catch {
        setAuthError('Could not verify your account. Check your connection and try again.');
        await signOut(auth);
      } finally {
        setAuthLoading(false);
      }
    });
  }, []);

  function toggleMode() {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    localStorage.setItem('hcm-theme', next);
  }

  return <AppContext.Provider value={{ role, account, authLoading, authError, mode, toggleMode, notice, setNotice }}>
    {children}
  </AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
