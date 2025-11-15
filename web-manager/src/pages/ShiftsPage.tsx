import { useState } from 'react';
import { useQuery } from 'react-query';
import { Box, Typography, Button, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import { Add } from '@mui/icons-material';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { shiftsService, workersService } from '../services/api';
import { toast } from 'react-toastify';

const localizer = momentLocalizer(moment);

export default function ShiftsPage() {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState({
    assignedWorkerId: '',
    startTime: '',
    endTime: '',
    roleName: '',
    hourlyRate: '',
    isOpenToMarketplace: false,
  });

  const { data: shifts, refetch } = useQuery('shifts', () => shiftsService.getAll());
  const { data: workers } = useQuery('workers', () => workersService.getAll());

  const events = shifts?.data?.map((shift: any) => ({
    id: shift.id,
    title: `${shift.roleName} - ${shift.assignedWorker?.firstName || 'Open'}`,
    start: new Date(shift.startTime),
    end: new Date(shift.endTime),
  })) || [];

  const handleSelectSlot = ({ start }: any) => {
    setSelectedDate(start);
    setFormData({
      ...formData,
      startTime: moment(start).format('YYYY-MM-DDTHH:mm'),
      endTime: moment(start).add(4, 'hours').format('YYYY-MM-DDTHH:mm'),
    });
    setOpen(true);
  };

  const handleCreateShift = async () => {
    try {
      await shiftsService.create(formData);
      toast.success('Shift created successfully!');
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error('Failed to create shift');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Shift Planner</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          Create Shift
        </Button>
      </Box>

      <Paper sx={{ p: 2, height: 600 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          selectable
          onSelectSlot={handleSelectSlot}
        />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Shift</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Role Name"
            value={formData.roleName}
            onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
            placeholder="e.g., Barista, Server"
          />

          <TextField
            select
            fullWidth
            margin="normal"
            label="Assign Worker (or leave open)"
            value={formData.assignedWorkerId}
            onChange={(e) => setFormData({ ...formData, assignedWorkerId: e.target.value })}
          >
            <MenuItem value="">Open to Marketplace</MenuItem>
            {workers?.data?.map((worker: any) => (
              <MenuItem key={worker.id} value={worker.id}>
                {worker.firstName} {worker.lastName}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            margin="normal"
            label="Start Time"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
          />

          <TextField
            fullWidth
            margin="normal"
            label="End Time"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Hourly Rate (Kč)"
            type="number"
            value={formData.hourlyRate}
            onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateShift} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
