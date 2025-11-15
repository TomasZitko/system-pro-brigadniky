import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Title, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { format } from 'date-fns';

export default function MyScheduleScreen() {
  const { data: shifts } = useQuery({
    queryKey: ['myShifts'],
    queryFn: () => api.get('/shifts/my-shifts'),
  });

  const renderShift = ({ item }: any) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{item.roleName}</Title>
        <Text>
          {format(new Date(item.startTime), 'dd/MM/yyyy HH:mm')} -{' '}
          {format(new Date(item.endTime), 'HH:mm')}
        </Text>
        <Text style={styles.rate}>{item.hourlyRate} Kč/hour</Text>
        <Text style={styles.status}>Status: {item.status}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Title style={styles.title}>My Schedule</Title>

      <FlatList
        data={shifts?.data || []}
        renderItem={renderShift}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No shifts scheduled</Text>
        }
      />
    </View>
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
  card: {
    marginBottom: 15,
  },
  rate: {
    marginTop: 5,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  status: {
    marginTop: 5,
    color: '#666',
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
  },
});
