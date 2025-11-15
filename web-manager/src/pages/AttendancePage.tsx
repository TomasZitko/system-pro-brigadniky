import { useState } from 'react';
import { useQuery } from 'react-query';
import { Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { CheckCircle } from '@mui/icons-material';
import { attendanceService } from '../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export default function AttendancePage() {
  const [open, setOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [approvedHours, setApprovedHours] = useState('');
  const [managerNotes, setManagerNotes] = useState('');

  const { data: attendance, refetch } = useQuery('attendance', () =>
    attendanceService.getAll()
  );

  const columns: GridColDef[] = [
    {
      field: 'worker',
      headerName: 'Worker',
      width: 150,
      valueGetter: (params) =>
        `${params.row.worker?.firstName} ${params.row.worker?.lastName}`,
    },
    {
      field: 'clockInTime',
      headerName: 'Clock In',
      width: 180,
      valueGetter: (params) =>
        params.value ? format(new Date(params.value), 'dd/MM/yyyy HH:mm') : '-',
    },
    {
      field: 'clockOutTime',
      headerName: 'Clock Out',
      width: 180,
      valueGetter: (params) =>
        params.value ? format(new Date(params.value), 'dd/MM/yyyy HH:mm') : '-',
    },
    {
      field: 'totalHours',
      headerName: 'Hours',
      width: 100,
      valueGetter: (params) => params.value?.toFixed(2) || '0.00',
    },
    { field: 'status', headerName: 'Status', width: 120 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) =>
        params.row.status === 'clocked_out' ? (
          <Button
            size="small"
            variant="contained"
            startIcon={<CheckCircle />}
            onClick={() => {
              setSelectedAttendance(params.row);
              setApprovedHours(params.row.totalHours?.toString() || '');
              setOpen(true);
            }}
          >
            Approve
          </Button>
        ) : null,
    },
  ];

  const handleApprove = async () => {
    try {
      await attendanceService.approve(selectedAttendance.id, {
        approvedHours: parseFloat(approvedHours),
        managerNotes,
      });
      toast.success('Attendance approved!');
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error('Failed to approve attendance');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Attendance & Time Tracking
      </Typography>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={attendance?.data || []}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          checkboxSelection
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Attendance</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Worker: {selectedAttendance?.worker?.firstName}{' '}
            {selectedAttendance?.worker?.lastName}
          </Typography>
          <Typography variant="body2" gutterBottom>
            Calculated Hours: {selectedAttendance?.totalHours?.toFixed(2)}
          </Typography>

          <TextField
            fullWidth
            margin="normal"
            label="Approved Hours"
            type="number"
            value={approvedHours}
            onChange={(e) => setApprovedHours(e.target.value)}
            helperText="Adjust if worker forgot to clock out or has disputes"
          />

          <TextField
            fullWidth
            margin="normal"
            label="Manager Notes"
            multiline
            rows={3}
            value={managerNotes}
            onChange={(e) => setManagerNotes(e.target.value)}
            placeholder="Optional notes about adjustments..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleApprove} variant="contained">
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
