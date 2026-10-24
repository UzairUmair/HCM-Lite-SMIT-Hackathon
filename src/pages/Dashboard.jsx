import { Box, Typography, Stack, Button, TextField, MenuItem, Chip } from '@mui/material';
import PeopleOutlineRounded from "@mui/icons-material/PeopleOutlineRounded";
import PersonOutlineRounded from "@mui/icons-material/PersonOutlineRounded";
import EventAvailableRounded from "@mui/icons-material/EventAvailableRounded";
import BeachAccessOutlined from "@mui/icons-material/BeachAccessOutlined";
import AccountBalanceWalletOutlined from "@mui/icons-material/AccountBalanceWalletOutlined";
import PaymentsOutlined from "@mui/icons-material/PaymentsOutlined";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import AddRounded from "@mui/icons-material/AddRounded";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { Card, PageHeader, StatCard, EmptyState, TextLink } from '../components/Common';
export function ChartCard({
  title,
  type = 'bars',
  subtitle
}) {
  return <Card title={title} subtitle={subtitle || 'Connected data will bring this view to life'} action={<Chip label="Not connected" size="small" variant="outlined" sx={{
    fontSize: 10
  }} />}><Box className={`chart-empty ${type}`} aria-label={`${title}: no connected data`}><div className="chart-grid" />{type === 'donut' ? <div className="empty-donut"><span>—<small>No data yet</small></span></div> : <div className="chart-placeholder-label"><span className="mini-chart">▥</span><Typography sx={{
          fontSize: 12,
          color: "text.secondary"
        }}>A clearer picture starts with your data</Typography></div>}</Box></Card>;
}
export function AttendanceWidget() {
  return <Card title="Your workday" subtitle={new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })}><Stack direction="row" sx={{
      justifyContent: "space-between",
      my: 3
    }}><Box><Typography variant="caption" sx={{
          color: "text.secondary"
        }}>CHECK IN</Typography><Typography variant="h5">— : —</Typography></Box><Box><Typography variant="caption" sx={{
          color: "text.secondary"
        }}>CHECK OUT</Typography><Typography variant="h5">— : —</Typography></Box><Box><Typography variant="caption" sx={{
          color: "text.secondary"
        }}>HOURS</Typography><Typography variant="h5">—</Typography></Box></Stack><Stack direction="row" sx={{
      gap: 1
    }}><Button fullWidth variant="contained" disabled>Check in</Button><Button fullWidth variant="outlined" disabled>Check out</Button></Stack><Typography variant="caption" sx={{
      color: "text.secondary",
      display: "block",
      mt: 2
    }}>Attendance will be available when your account is connected.</Typography></Card>;
}
export default function Dashboard() {
  const {
    role
  } = useApp();
  const navigate = useNavigate();
  const employee = role === 'employee';
  const hr = role === 'hr';
  const metrics = employee ? ['Today’s attendance', 'Hours this week', 'Available leave', 'Late arrivals', 'Last payslip'] : hr ? ['Total employees', 'Present today', 'Late today', 'On leave', 'Pending requests', 'Missing checkouts'] : ['Total employees', 'Active employees', 'Present today', 'On leave today', 'Monthly payroll', 'Average salary'];
  const icons = [PeopleOutlineRounded, PersonOutlineRounded, EventAvailableRounded, BeachAccessOutlined, AccountBalanceWalletOutlined, PaymentsOutlined];
  return <><PageHeader title={employee ? 'Your day, at a glance' : 'Workspace overview'} subtitle={employee ? 'A little clarity for a better workday.' : 'Your people, operations and insights. All in one place.'} action={<Stack direction="row" sx={{
      gap: 1
    }}><TextField sx={{ display: employee ? 'none' : undefined }} select size="small" defaultValue="all" slotProps={{
        htmlInput: {
          'aria-label': 'Department filter'
        }
      }}><MenuItem value="all">All departments</MenuItem></TextField><TextField select size="small" defaultValue="month" slotProps={{
        htmlInput: {
          'aria-label': 'Reporting period'
        }
      }}><MenuItem value="month">This month</MenuItem><MenuItem value="week">This week</MenuItem><MenuItem value="year">This year</MenuItem></TextField></Stack>} /><Box className="welcome-banner"><Box><Stack direction="row" sx={{
          gap: 1,
          alignItems: "center",
          mb: 2
        }}><span className="welcome-dot" /><Typography sx={{
            fontSize: 10,
            letterSpacing: 1.5
          }}>A LITTLE MORE CLARITY. A LOT MORE POSSIBILITY.</Typography></Stack><Typography variant="h4" sx={{
          color: "#fff"
        }}>{employee ? 'Welcome to your workspace.' : `Good morning, ${hr ? 'HR' : 'Admin'}.`}</Typography><Typography variant="body2" sx={{
          color: "#c6cbe6",
          mt: 1
        }}>{employee ? 'Ready to start your workday?' : 'Here’s what’s happening across your organization.'}</Typography><Button onClick={() => navigate(`/${role}/${employee ? 'profile' : hr ? 'employees/new' : 'company'}`)} endIcon={<ArrowForwardRounded />} sx={{
          bgcolor: '#fff',
          color: '#242c55',
          mt: 3,
          '&:hover': {
            bgcolor: '#eeeaff'
          }
        }}>{employee ? 'View my profile' : hr ? 'Add an employee' : 'Set up your workspace'}</Button></Box><div className="banner-art" aria-hidden="true"><div className="banner-ring" /><div className="banner-ring small" /><div className="banner-tile"><PeopleOutlineRounded sx={{
            fontSize: 44
          }} /></div><span className="banner-spark">✦</span><span className="banner-small-dot" /></div><Typography className="banner-date" sx={{
        fontSize: 11
      }}>{new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}</Typography></Box><Box className="section-label"><Typography variant="h6">{employee ? 'Your essentials' : 'Organization snapshot'}</Typography><Typography variant="caption" sx={{
        color: "text.secondary"
      }}>Live metrics appear after connection</Typography></Box><Box className="stats-grid">{metrics.map((title, i) => <StatCard key={title} title={title} icon={icons[i % icons.length]} />)}</Box><Box className="dashboard-columns"><Box className="dashboard-main">{employee ? <AttendanceWidget /> : <ChartCard title={hr ? 'Daily attendance' : 'Attendance overview'} subtitle="Daily attendance across your organization" />}<Box className="two-columns"><ChartCard title={employee ? 'Your leave balance' : 'Headcount by department'} type="donut" /><ChartCard title={employee ? 'Attendance history' : 'Payroll by department'} /></Box><Card title={hr ? 'Needs your attention' : employee ? 'Your requests' : 'Recent activity'} action={<TextLink onClick={() => navigate(`/${role}/leaves`)}>View all</TextLink>}><EmptyState compact title={hr ? 'Your action center is ready' : 'A little quiet, for now'} text="Updates and pending requests will appear here once your workspace is connected." /></Card></Box><Stack sx={{
        gap: 3
      }}><Box className="ai-insight"><Stack direction="row" sx={{
            gap: 1,
            alignItems: "center"
          }}><AutoAwesomeOutlined sx={{
              color: '#a59cff'
            }} /><Typography variant="h6">A smarter perspective</Typography><Chip label="AI" size="small" sx={{
              bgcolor: '#ffffff15',
              color: '#d6d2ff',
              ml: 'auto',
              height: 21
            }} /></Stack><Typography variant="body2" sx={{
            color: "#bfc8df",
            mt: 2
          }}>Turn your people data into a clear picture of what matters.</Typography><Box className="ai-unavailable"><span className="status-dot" /> Insights are coming soon</Box><Typography variant="caption" sx={{
            color: "#aebbd5"
          }}>Connect a secure AI service to unlock role-aware summaries.</Typography><Button fullWidth endIcon={<ArrowForwardRounded />} onClick={() => navigate(`/${role}/ai-assistant`)} sx={{
            color: '#e1ddff',
            border: '1px solid #ffffff26',
            mt: 3
          }}>Explore HCM AI</Button></Box><Card title="Quick actions"><Stack sx={{
            gap: 1
          }}>{(employee ? [['leaves', 'Apply for leave'], ['attendance', 'My attendance'], ['payslips', 'View payslips']] : [['employees', 'Employee directory'], ['attendance', 'Attendance board'], ['leaves', 'Review leave requests']]).map(([path, label]) => <Button key={path} onClick={() => navigate(`/${role}/${path}`)} className="quick-action" endIcon={<ArrowOutwardRounded sx={{
              fontSize: 16
            }} />}>{label}</Button>)}</Stack></Card><Card title="Announcements" action={<TextLink onClick={() => navigate(`/${role}/announcements`)}>All</TextLink>}><EmptyState compact title="Keep everyone in the loop" text="Company news and important updates will live here." /></Card></Stack></Box></>;
}
