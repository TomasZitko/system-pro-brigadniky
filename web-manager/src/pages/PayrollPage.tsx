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
import { useTranslation } from 'react-i18next';
import { payrollService } from '../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export default function PayrollPage() {
  const { t } = useTranslation(['pages', 'common']);
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
      toast.success(t('pages:payroll.messages.createSuccess'));
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error(t('pages:payroll.messages.createFailed'));
    }
  };

  const handleCalculate = async (periodId: string) => {
    try {
      await payrollService.calculate(periodId);
      toast.success(t('pages:payroll.messages.calculateSuccess'));
      refetch();
    } catch (error) {
      toast.error(t('pages:payroll.messages.calculateFailed'));
    }
  };

  const handleLock = async (periodId: string) => {
    try {
      await payrollService.lock(periodId);
      toast.success(t('pages:payroll.messages.lockSuccess'));
      refetch();
    } catch (error) {
      toast.error(t('pages:payroll.messages.lockFailed'));
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
      toast.success(t('pages:payroll.messages.exportSuccess'));
    } catch (error) {
      toast.error(t('pages:payroll.messages.exportFailed'));
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
      toast.success(t('pages:payroll.messages.downloadStarted'));
    } catch (error) {
      toast.error(t('pages:payroll.messages.exportFailed'));
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'worker',
      headerName: t('pages:payroll.table.worker'),
      width: 150,
      valueGetter: (params) =>
        `${params.row.worker?.firstName} ${params.row.worker?.lastName}`,
    },
    {
      field: 'totalRegularHours',
      headerName: t('pages:payroll.table.regularHours'),
      width: 120,
      valueGetter: (params) => params.value?.toFixed(2) || '0.00',
    },
    {
      field: 'basePay',
      headerName: t('pages:payroll.table.basePay'),
      width: 120,
      valueGetter: (params) => `${params.value?.toFixed(2)} Kč`,
    },
    {
      field: 'weekendSupplement',
      headerName: t('pages:payroll.table.weekendBonus'),
      width: 120,
      valueGetter: (params) => `${params.value?.toFixed(2)} Kč`,
    },
    {
      field: 'nightSupplement',
      headerName: t('pages:payroll.table.nightBonus'),
      width: 120,
      valueGetter: (params) => `${params.value?.toFixed(2)} Kč`,
    },
    {
      field: 'holidaySupplement',
      headerName: t('pages:payroll.table.holidayBonus'),
      width: 120,
      valueGetter: (params) => `${params.value?.toFixed(2)} Kč`,
    },
    {
      field: 'grossPay',
      headerName: t('pages:payroll.table.grossPay'),
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
      headerName: t('pages:payroll.period.totalHours'),
      width: 100,
      valueGetter: (params) => params.value?.toFixed(2) || '0.00',
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">{t('pages:payroll.title')}</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          {t('pages:payroll.createPeriod')}
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        {t('pages:payroll.export.csszXml')} & {t('pages:payroll.export.csv')}
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
                    label={period.isLocked ? t('pages:payroll.status.locked') : t('pages:payroll.status.draft')}
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
                        {t('pages:payroll.calculate')}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Lock />}
                        onClick={() => handleLock(period.id)}
                      >
                        {t('pages:payroll.lock')}
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
                        {t('pages:payroll.export.csszXml')}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={() => handleExportCSV(period.id)}
                      >
                        {t('pages:payroll.export.csv')}
                      </Button>
                    </>
                  )}

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Assessment />}
                    onClick={() => setSelectedPeriod(period)}
                  >
                    {t('common:actions.view')}
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
        <DialogTitle>{t('pages:payroll.createPeriod')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label={t('pages:payroll.period.start')}
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
            label={t('pages:payroll.period.end')}
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formData.periodEnd}
            onChange={(e) =>
              setFormData({ ...formData, periodEnd: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t('common:actions.cancel')}</Button>
          <Button onClick={handleCreatePeriod} variant="contained">
            {t('common:actions.create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
