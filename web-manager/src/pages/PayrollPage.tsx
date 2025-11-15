import { useState } from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
} from '@mui/material';
import { Add, Calculate, Lock, Download, Assessment } from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { payrollService } from '../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export default function PayrollPage() {
  const [open, setOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<any>(null);
  const [formData, setFormData] = useState({
    periodStart: '',
    periodEnd: '',
  });

  const { data: periods, refetch } = useQuery('payrollPeriods', () =>
    payrollService.getPeriods()
  );

  const { data: calculations } = useQuery(
    ['calculations', selectedPeriod?.id],
    () => payrollService.getCalculations(selectedPeriod.id),
    { enabled: !!selectedPeriod }
  );

  const handleCreatePeriod = async () => {
    try {
      await payrollService.createPeriod(formData);
      toast.success('Payroll period created!');
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error('Failed to create period');
    }
  };

  const handleCalculate = async (periodId: string) => {
    try {
      await payrollService.calculate(periodId);
      toast.success('Payroll calculated successfully!');
      refetch();
    } catch (error) {
      toast.error('Failed to calculate payroll');
    }
  };

  const handleLock = async (periodId: string) => {
    try {
      await payrollService.lock(periodId);
      toast.success('Payroll period locked!');
      refetch();
    } catch (error) {
      toast.error('Failed to lock period');
    }
  };

  const handleExportCSSZ = async (periodId: string) => {
    try {
      const response = await payrollService.exportCSSZ(periodId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cssz_vpdpp_${periodId}.xml`);
      document.body.appendChild(link);
      link.click();
      toast.success('ČSSZ XML downloaded!');
    } catch (error) {
      toast.error('Failed to export ČSSZ XML');
    }
  };

  const handleExportCSV = async (periodId: string) => {
    try {
      const response = await payrollService.exportCSV(periodId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll_${periodId}.csv`);
      document.body.appendChild(link);
      link.click();
      toast.success('CSV downloaded!');
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'worker',
      headerName: 'Worker',
      width: 150,
      valueGetter: (params) =>
        `${params.row.worker?.firstName} ${params.row.worker?.lastName}`,
    },
    {
      field: 'totalRegularHours',
      headerName: 'Regular Hours',
      width: 120,
      valueGetter: (params) => params.value?.toFixed(2) || '0.00',
    },
    {
      field: 'basePay',
      headerName: 'Base Pay',
      width: 120,
      valueGetter: (params) => `${params.value?.toFixed(2)} Kč`,
    },
    {
      field: 'weekendSupplement',
      headerName: 'Weekend +',
      width: 120,
      valueGetter: (params) => `${params.value?.toFixed(2)} Kč`,
    },
    {
      field: 'nightSupplement',
      headerName: 'Night +',
      width: 120,
      valueGetter: (params) => `${params.value?.toFixed(2)} Kč`,
    },
    {
      field: 'holidaySupplement',
      headerName: 'Holiday +',
      width: 120,
      valueGetter: (params) => `${params.value?.toFixed(2)} Kč`,
    },
    {
      field: 'grossPay',
      headerName: 'Gross Pay',
      width: 150,
      valueGetter: (params) => `${params.value?.toFixed(2)} Kč`,
      renderCell: (params) => (
        <strong style={{ color: '#1976d2' }}>
          {params.value?.toFixed(2)} Kč
        </strong>
      ),
    },
    {
      field: 'ytdHours',
      headerName: 'YTD Hours',
      width: 100,
      valueGetter: (params) => params.value?.toFixed(2) || '0.00',
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Payroll & Compliance</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          Create Period
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        🔥 <strong>KILLER FEATURE:</strong> One-click ČSSZ VPDPP XML export with
        automatic Czech Labor Law compliance!
      </Alert>

      <Grid container spacing={3}>
        {periods?.data?.map((period: any) => (
          <Grid item xs={12} md={6} key={period.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    {format(new Date(period.periodStart), 'dd/MM/yyyy')} -{' '}
                    {format(new Date(period.periodEnd), 'dd/MM/yyyy')}
                  </Typography>
                  <Chip
                    label={period.isLocked ? 'Locked' : 'Open'}
                    color={period.isLocked ? 'error' : 'success'}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {!period.isLocked && (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Calculate />}
                        onClick={() => handleCalculate(period.id)}
                      >
                        Calculate
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Lock />}
                        onClick={() => handleLock(period.id)}
                      >
                        Lock
                      </Button>
                    </>
                  )}

                  {period.isLocked && (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        startIcon={<Download />}
                        onClick={() => handleExportCSSZ(period.id)}
                      >
                        ČSSZ XML
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={() => handleExportCSV(period.id)}
                      >
                        CSV
                      </Button>
                    </>
                  )}

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Assessment />}
                    onClick={() => setSelectedPeriod(period)}
                  >
                    View
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {selectedPeriod && (
        <Paper sx={{ mt: 3, height: 400 }}>
          <Typography variant="h6" sx={{ p: 2 }}>
            Calculations for {format(new Date(selectedPeriod.periodStart), 'MMMM yyyy')}
          </Typography>
          <DataGrid
            rows={calculations?.data || []}
            columns={columns}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
          />
        </Paper>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Payroll Period</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Period Start"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formData.periodStart}
            onChange={(e) =>
              setFormData({ ...formData, periodStart: e.target.value })
            }
          />
          <TextField
            fullWidth
            margin="normal"
            label="Period End"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formData.periodEnd}
            onChange={(e) =>
              setFormData({ ...formData, periodEnd: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreatePeriod} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
