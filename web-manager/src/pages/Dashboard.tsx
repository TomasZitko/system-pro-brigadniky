import { Grid, Paper, Typography, Box } from '@mui/material';
import { People, Schedule, AccessTime, TrendingUp } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { workersService, shiftsService, attendanceService } from '../services/api';

export default function Dashboard() {
  const { data: workers } = useQuery('workers', () => workersService.getAll());
  const { data: shifts } = useQuery('shifts', () => shiftsService.getAll());
  const { data: attendance } = useQuery('attendance', () => attendanceService.getAll());

  const stats = [
    {
      title: 'Total Workers',
      value: workers?.data?.length || 0,
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    {
      title: 'Shifts This Month',
      value: shifts?.data?.length || 0,
      icon: <Schedule sx={{ fontSize: 40 }} />,
      color: '#dc004e',
    },
    {
      title: 'Pending Approvals',
      value: attendance?.data?.filter((a: any) => a.status === 'clocked_out').length || 0,
      icon: <AccessTime sx={{ fontSize: 40 }} />,
      color: '#ff9800',
    },
    {
      title: 'Active Now',
      value: attendance?.data?.filter((a: any) => a.status === 'clocked_in').length || 0,
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      color: '#4caf50',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
                bgcolor: stat.color,
                color: 'white',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h3" component="div">
                    {stat.value}
                  </Typography>
                  <Typography variant="body1">{stat.title}</Typography>
                </Box>
                {stat.icon}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Create new shift<br />
              • Approve pending attendance<br />
              • Run payroll calculation<br />
              • Generate ČSSZ export
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Tasks
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Payroll deadline: 5 days<br />
              • 3 shift applications pending<br />
              • 12 attendance records to approve
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
