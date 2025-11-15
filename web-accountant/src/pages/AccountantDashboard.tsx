import { Box, Typography, Paper, Button, Card, CardContent, Grid, Chip } from '@mui/material';
import { Download, Assessment } from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useQuery } from 'react-query';
import api from '../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export default function AccountantDashboard() {
  const { data: periods } = useQuery('payrollPeriods', () =>
    api.get('/payroll/periods')
  );

  const handleDownloadCSSZ = async (periodId: string) => {
    try {
      const response = await api.get(`/payroll/periods/${periodId}/export/cssz`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cssz_vpdpp_${periodId}.xml`);
      document.body.appendChild(link);
      link.click();
      toast.success('ČSSZ XML downloaded!');
    } catch (error) {
      toast.error('Failed to download ČSSZ XML');
    }
  };

  const handleDownloadCSV = async (periodId: string) => {
    try {
      const response = await api.get(`/payroll/periods/${periodId}/export/csv`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll_${periodId}.csv`);
      document.body.appendChild(link);
      link.click();
      toast.success('CSV downloaded!');
    } catch (error) {
      toast.error('Failed to download CSV');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Payroll & Compliance Exports
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Download ČSSZ XML files and payroll CSV exports for accounting software (POHODA,
        Money S3)
      </Typography>

      <Grid container spacing={3}>
        {periods?.data?.map((period: any) => (
          <Grid item xs={12} md={6} key={period.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">
                      {format(new Date(period.periodStart), 'MMMM yyyy')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(period.periodStart), 'dd/MM/yyyy')} -{' '}
                      {format(new Date(period.periodEnd), 'dd/MM/yyyy')}
                    </Typography>
                  </Box>
                  <Chip
                    label={period.isLocked ? 'Locked' : 'Open'}
                    color={period.isLocked ? 'success' : 'warning'}
                  />
                </Box>

                {period.isLocked ? (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="error"
                      startIcon={<Download />}
                      onClick={() => handleDownloadCSSZ(period.id)}
                    >
                      ČSSZ XML
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={() => handleDownloadCSV(period.id)}
                    >
                      CSV
                    </Button>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Waiting for manager to lock this period...
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
