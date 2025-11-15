import { Box, Typography, Grid, Paper, Card, CardContent } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { useQuery } from 'react-query';
import api from '../services/api';

export default function HQDashboard() {
  const { data: tenants } = useQuery('childTenants', async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return api.get(`/tenants/${user.tenantId}/children`);
  });

  const { data: analytics } = useQuery('analytics', () =>
    api.get('/analytics/network-summary')
  );

  const locationData = tenants?.data?.map((tenant: any) => ({
    name: tenant.name,
    workers: Math.floor(Math.random() * 50),
    shifts: Math.floor(Math.random() * 200),
    satisfaction: (Math.random() * 2 + 3).toFixed(1),
  })) || [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Franchise HQ Analytics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#1976d2', color: 'white' }}>
            <CardContent>
              <Typography variant="h4">{tenants?.data?.length || 0}</Typography>
              <Typography>Total Locations</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#dc004e', color: 'white' }}>
            <CardContent>
              <Typography variant="h4">
                {locationData.reduce((sum, l) => sum + l.workers, 0)}
              </Typography>
              <Typography>Network Workers</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#ff9800', color: 'white' }}>
            <CardContent>
              <Typography variant="h4">
                {locationData.reduce((sum, l) => sum + l.shifts, 0)}
              </Typography>
              <Typography>Total Shifts</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#4caf50', color: 'white' }}>
            <CardContent>
              <Typography variant="h4">
                {(locationData.reduce((sum, l) => sum + parseFloat(l.satisfaction), 0) /
                  locationData.length || 0).toFixed(1)}
              </Typography>
              <Typography>Avg Satisfaction</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Location Performance Comparison
            </Typography>
            <BarChart width={600} height={300} data={locationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="workers" fill="#1976d2" name="Workers" />
              <Bar dataKey="shifts" fill="#dc004e" name="Shifts" />
            </BarChart>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Customer Satisfaction Trend
            </Typography>
            <LineChart width={300} height={300} data={locationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Line type="monotone" dataKey="satisfaction" stroke="#4caf50" />
            </LineChart>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
