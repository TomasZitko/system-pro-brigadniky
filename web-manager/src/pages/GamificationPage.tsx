import { Box, Typography, Paper, Grid, List, ListItem, ListItemText, Chip } from '@mui/material';
import { useQuery } from 'react-query';
import { gamificationService } from '../services/api';
import { EmojiEvents, Star } from '@mui/icons-material';

export default function GamificationPage() {
  const { data: achievements } = useQuery('achievements', () =>
    gamificationService.getAchievements()
  );
  const { data: leaderboard } = useQuery('leaderboard', () =>
    gamificationService.getLeaderboard()
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gamification & Performance
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <EmojiEvents /> Achievements
            </Typography>
            <List>
              {achievements?.data?.map((achievement: any) => (
                <ListItem key={achievement.id}>
                  <ListItemText
                    primary={achievement.name}
                    secondary={achievement.description}
                  />
                  <Chip label={`${achievement.points} pts`} color="primary" />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Star /> Leaderboard
            </Typography>
            <List>
              {leaderboard?.data?.map((entry: any, index: number) => (
                <ListItem key={entry.id}>
                  <Chip
                    label={`#${index + 1}`}
                    color={index < 3 ? 'error' : 'default'}
                    sx={{ mr: 2 }}
                  />
                  <ListItemText
                    primary={`${entry.worker?.firstName} ${entry.worker?.lastName}`}
                    secondary={`${entry.totalPoints} points • ${entry.totalShifts} shifts`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
