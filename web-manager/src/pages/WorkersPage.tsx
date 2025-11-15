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
  MenuItem,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add } from '@mui/icons-material';
import { workersService } from '../services/api';
import { toast } from 'react-toastify';

export default function WorkersPage() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    workerId: '',
    contractType: 'dpp',
    hourlyRate: '',
    startDate: '',
  });

  const { data: workers, refetch } = useQuery('workers', () => workersService.getAll());

  const columns: GridColDef[] = [
    { field: 'firstName', headerName: 'First Name', width: 150 },
    { field: 'lastName', headerName: 'Last Name', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'phone', headerName: 'Phone', width: 150 },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <span style={{ color: params.value ? 'green' : 'red' }}>
          {params.value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const handleCreateContract = async () => {
    try {
      await workersService.create(formData);
      toast.success('Contract created successfully!');
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error('Failed to create contract');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Workers</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
        >
          Create Contract
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={workers?.data || []}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          checkboxSelection
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create DPP/DPČ Contract</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            margin="normal"
            label="Worker"
            value={formData.workerId}
            onChange={(e) => setFormData({ ...formData, workerId: e.target.value })}
          >
            {workers?.data?.map((worker: any) => (
              <MenuItem key={worker.id} value={worker.id}>
                {worker.firstName} {worker.lastName}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            margin="normal"
            label="Contract Type"
            value={formData.contractType}
            onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
          >
            <MenuItem value="dpp">DPP</MenuItem>
            <MenuItem value="dpc">DPČ</MenuItem>
          </TextField>

          <TextField
            fullWidth
            margin="normal"
            label="Hourly Rate (Kč)"
            type="number"
            value={formData.hourlyRate}
            onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Start Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateContract} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
