import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Title, Text, Button, Chip } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { format } from 'date-fns';

export default function MarketplaceScreen() {
  const queryClient = useQueryClient();

  const { data: shifts } = useQuery({
    queryKey: ['marketplace'],
    queryFn: () => api.get('/shifts/marketplace'),
  });

  const applyMutation = useMutation({
    mutationFn: (shiftId: string) =>
      api.post(`/shifts/${shiftId}/apply`, { message: 'I would like this shift!' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      alert('Application submitted!');
    },
  });

  const renderShift = ({ item }: any) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Title>{item.roleName}</Title>
          <Chip>{item.hourlyRate} Kč/h</Chip>
        </View>
        <Text>
          {format(new Date(item.startTime), 'dd/MM/yyyy HH:mm')} -{' '}
          {format(new Date(item.endTime), 'HH:mm')}
        </Text>
        <Text style={styles.duration}>
          Duration: {((new Date(item.endTime).getTime() - new Date(item.startTime).getTime()) / 3600000).toFixed(1)} hours
        </Text>
      </Card.Content>
      <Card.Actions>
        <Button
          mode="contained"
          onPress={() => applyMutation.mutate(item.id)}
          loading={applyMutation.isPending}
        >
          Apply
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Shift Marketplace</Title>
      <Text style={styles.subtitle}>Apply to open shifts</Text>

      <FlatList
        data={shifts?.data || []}
        renderItem={renderShift}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No open shifts available</Text>
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
    marginBottom: 5,
    marginTop: 40,
  },
  subtitle: {
    color: '#666',
    marginBottom: 20,
  },
  card: {
    marginBottom: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  duration: {
    marginTop: 5,
    color: '#666',
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
  },
});
