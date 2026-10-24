import { createContext, useContext, useState } from 'react';
const AppContext = createContext(null);
export function AppProvider({
  children
}) {
  const [role, setRole] = useState(null);
  const [mode, setMode] = useState(() => localStorage.getItem('hcm-theme') === 'dark' ? 'dark' : 'light');
  const [notice, setNotice] = useState('');
  function toggleMode() {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    localStorage.setItem('hcm-theme', next);
  }
  return <AppContext.Provider value={{
    role,
    setRole,
    mode,
    toggleMode,
    notice,
    setNotice
  }}>{children}</AppContext.Provider>;
}
export const useApp = () => useContext(AppContext);
