import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router';
import { Box, Typography, IconButton, Button, Avatar, Stack, Drawer, TextField, InputAdornment, Tooltip, Menu, MenuItem, Collapse, Chip } from '@mui/material';
import GridViewRounded from "@mui/icons-material/GridViewRounded";
import PeopleOutlineRounded from "@mui/icons-material/PeopleOutlineRounded";
import EventAvailableRounded from "@mui/icons-material/EventAvailableRounded";
import AccountBalanceWalletOutlined from "@mui/icons-material/AccountBalanceWalletOutlined";
import InsightsOutlined from "@mui/icons-material/InsightsOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import CampaignOutlined from "@mui/icons-material/CampaignOutlined";
import BusinessOutlined from "@mui/icons-material/BusinessOutlined";
import MenuRounded from "@mui/icons-material/MenuRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import NotificationsNoneRounded from "@mui/icons-material/NotificationsNoneRounded";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import { navigation } from '../routes/navigation';
import { useApp } from '../context/AppContext';
import { authService } from '../services/api';
import NotificationDrawer from './NotificationDrawer';
export function Logo() {
  return <Stack direction="row" sx={{
    gap: 1.2,
    alignItems: "center"
  }}><span className="brand-mark">h<span>·</span></span><Typography sx={{
      fontSize: 22,
      fontWeight: 750,
      letterSpacing: -.7
    }}>HCM <span style={{
        fontWeight: 400
      }}>Lite</span><span className="brand-dot">.</span></Typography></Stack>;
}
function NavIcon({
  path
}) {
  const Icon = path === 'dashboard' ? GridViewRounded : path.includes('employee') || path === 'profile' ? PeopleOutlineRounded : path.includes('attendance') || path === 'leaves' ? EventAvailableRounded : path === 'payroll' || path === 'salaries' || path === 'payslips' ? AccountBalanceWalletOutlined : path === 'analytics' ? InsightsOutlined : path === 'ai-assistant' ? AutoAwesomeOutlined : path === 'announcements' ? CampaignOutlined : path === 'settings' ? SettingsOutlined : BusinessOutlined;
  return <Icon fontSize="small" />;
}
export default function Layout() {
  const {
    role,
    account,
    mode,
    toggleMode
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  const [mobile, setMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [closed, setClosed] = useState({ More: true });
  const [notifications, setNotifications] = useState(false);
  const [menu, setMenu] = useState(null);
  const [search, setSearch] = useState('');
  const links = navigation[role].flatMap(g => g.slice(1));
  const title = links.find(([path]) => location.pathname === `/${role}/${path}`)?.[1] || 'Employee profile';
  const sidebar = <Box className="sidebar-inner"><Box className="sidebar-logo"><Logo /></Box><Box className="workspace-badge"><span className="workspace-avatar">W</span><Box><Typography sx={{
          fontSize: 12,
          fontWeight: 650
        }}>Your workspace</Typography><Typography sx={{
          fontSize: 10,
          color: "#97a8c5"
        }}>{role.toUpperCase()}</Typography></Box></Box><Box component="nav" sx={{
      flex: 1,
      overflowY: 'auto'
    }}>{navigation[role].map(([group, ...items]) => <Box key={group} sx={{
        mb: 2
      }}><button className="nav-group" onClick={() => setClosed({
          ...closed,
          [group]: !closed[group]
        })}>{group}<ExpandMoreRounded sx={{
            fontSize: 15
          }} /></button><Collapse in={!closed[group]}>{items.map(([path, label]) => <NavLink key={path} end to={`/${role}/${path}`} className={({
            isActive
          }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobile(false)}><NavIcon path={path} /><span>{label}</span></NavLink>)}</Collapse></Box>)}</Box><Box className="sidebar-bottom"><Avatar sx={{
        width: 34,
        height: 34,
        bgcolor: '#45436d',
        fontSize: 13
      }}>{role.slice(0, 2).toUpperCase()}</Avatar><Box><Typography sx={{
          fontSize: 12,
          fontWeight: 600
        }}>{account?.name || account?.fullName || role.toUpperCase()}</Typography><Typography sx={{
          fontSize: 10,
          color: "#97a8c5"
        }}>Signed in</Typography></Box><IconButton aria-label="Sign out" onClick={async () => { await authService.signOut(); navigate('/login'); }} sx={{
        color: '#aebbd3'
      }}><LogoutRounded fontSize="small" /></IconButton></Box></Box>;
  return <Box className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}><Box className="desktop-sidebar">{sidebar}</Box><Drawer open={mobile} onClose={() => setMobile(false)} slotProps={{
      paper: {
        sx: {
          width: 260,
          bgcolor: '#101c35',
          color: '#fff'
        }
      }
    }}>{sidebar}</Drawer><Box className="main-shell"><Box component="header" className="topbar" sx={{
        bgcolor: 'background.paper',
        borderColor: 'divider'
      }}><IconButton aria-label="Toggle sidebar" onClick={() => window.innerWidth < 1000 ? setMobile(true) : setCollapsed(!collapsed)}><MenuRounded /></IconButton><Typography variant="body2" className="breadcrumb"><span style={{
            opacity: .5
          }}>Workspace / </span>{title}</Typography><Box sx={{
          flex: 1
        }} /><TextField className="global-search" size="small" placeholder="Find a page…" value={search} onChange={e => setSearch(e.target.value)} slotProps={{
          input: {
            startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment>
          },
          htmlInput: {
            'aria-label': 'Search navigation'
          }
        }} /><Tooltip title="Toggle color theme"><IconButton onClick={toggleMode} aria-label="Toggle color theme">{mode === 'light' ? <DarkModeOutlined /> : <LightModeOutlined />}</IconButton></Tooltip><IconButton aria-label="Open notifications" onClick={() => setNotifications(true)}><NotificationsNoneRounded /></IconButton><IconButton aria-label="Account menu" onClick={e => setMenu(e.currentTarget)}><Avatar sx={{
            width: 32,
            height: 32,
            bgcolor: '#eeeaff',
            color: '#6258e8',
            fontSize: 12
          }}>{role.toUpperCase().slice(0, 2)}</Avatar></IconButton></Box>{search && <Box className="search-results" sx={{
        bgcolor: 'background.paper',
        boxShadow: 3
      }}>{links.filter(([, label]) => label.toLowerCase().includes(search.toLowerCase())).map(([path, label]) => <MenuItem key={path} onClick={() => {
          navigate(`/${role}/${path}`);
          setSearch('');
        }}>{label}</MenuItem>)}{!links.some(([, label]) => label.toLowerCase().includes(search.toLowerCase())) && <Typography sx={{
          p: 2
        }}>No matching pages</Typography>}</Box>}<Box component="main" className="page-content" key={location.pathname}><Outlet /></Box><Box component="footer" className="footer"><span>HCM Lite · Smarter People Management</span><span>Made for your people.</span></Box></Box><Menu anchorEl={menu} open={!!menu} onClose={() => setMenu(null)}><MenuItem onClick={() => {
        navigate(`/${role}/settings`);
        setMenu(null);
      }}>Account settings</MenuItem><MenuItem onClick={async () => { await authService.signOut(); navigate('/login'); }}>Sign out</MenuItem></Menu><NotificationDrawer open={notifications} onClose={() => setNotifications(false)} /></Box>;
}
