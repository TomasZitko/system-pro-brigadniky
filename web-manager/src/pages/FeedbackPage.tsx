import { useState } from 'react';
import { useQuery } from 'react-query';
import { Box, Typography, Paper, Button, Grid, Card, CardContent, Rating } from '@mui/material';
import { QrCode2, Feedback as FeedbackIcon } from '@mui/icons-material';
import QRCode from 'qrcode.react';
import { feedbackService } from '../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export default function FeedbackPage() {
  const [qrCode, setQrCode] = useState<string | null>(null);

  const { data: feedback } = useQuery('feedback', () => feedbackService.getAll());

  const handleGenerateQR = async () => {
    try {
      const response = await feedbackService.generateQR({ label: 'Rate our service!' });
      setQrCode(response.data.qrCode);
      toast.success('QR code generated!');
    } catch (error) {
      toast.error('Failed to generate QR code');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Customer Feedback
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              <QrCode2 /> Generate QR Code
            </Typography>
            {qrCode && (
              <Box sx={{ my: 2 }}>
                <QRCode
                  value={`${window.location.origin}/feedback/${qrCode}`}
                  size={200}
                />
              </Box>
            )}
            <Button variant="contained" onClick={handleGenerateQR}>
              Generate New QR Code
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <FeedbackIcon /> Recent Feedback
            </Typography>
            <Grid container spacing={2}>
              {feedback?.data?.slice(0, 10).map((item: any) => (
                <Grid item xs={12} key={item.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">
                          {item.worker?.firstName} {item.worker?.lastName}
                        </Typography>
                        <Rating value={parseInt(item.rating)} readOnly />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {item.tags?.join(', ')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
