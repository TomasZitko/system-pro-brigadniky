import React from 'react';
import { View, StyleSheet, FlatList, ScrollView } from 'react-native';
import { Card, Title, Text, Avatar, Chip, DataTable } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function AchievementsScreen() {
  const { data: achievements } = useQuery({
    queryKey: ['myAchievements'],
    queryFn: () => api.get('/gamification/my-achievements'),
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/gamification/leaderboard'),
  });

  const renderAchievement = ({ item }: any) => (
    <Card style={styles.achievementCard}>
      <Card.Content style={styles.achievementContent}>
        <Avatar.Icon
          size={48}
          icon="trophy"
          style={{ backgroundColor: '#ffd700' }}
        />
        <View style={styles.achievementText}>
          <Title>{item.achievement.name}</Title>
          <Text>{item.achievement.description}</Text>
          <Chip style={styles.chip}>{item.achievement.points} pts</Chip>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>My Achievements</Title>

      <FlatList
        data={achievements?.data || []}
        renderItem={renderAchievement}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={
          <Text style={styles.empty}>No achievements yet. Keep working!</Text>
        }
      />

      <Title style={styles.subtitle}>Leaderboard</Title>

      <Card style={styles.card}>
        <Card.Content>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Rank</DataTable.Title>
              <DataTable.Title>Worker</DataTable.Title>
              <DataTable.Title numeric>Points</DataTable.Title>
            </DataTable.Header>

            {leaderboard?.data?.slice(0, 10).map((entry: any, index: number) => (
              <DataTable.Row key={entry.id}>
                <DataTable.Cell>#{index + 1}</DataTable.Cell>
                <DataTable.Cell>
                  {entry.worker?.firstName} {entry.worker?.lastName?.charAt(0)}.
                </DataTable.Cell>
                <DataTable.Cell numeric>{entry.totalPoints}</DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    marginTop: 40,
  },
  subtitle: {
    fontSize: 20,
    marginTop: 30,
    marginBottom: 15,
  },
  achievementCard: {
    marginBottom: 15,
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementText: {
    marginLeft: 15,
    flex: 1,
  },
  chip: {
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  card: {
    marginBottom: 20,
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
  },
});
