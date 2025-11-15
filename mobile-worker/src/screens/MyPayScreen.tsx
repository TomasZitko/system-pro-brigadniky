import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Text, Divider, DataTable } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function MyPayScreen() {
  const { data: payEstimate } = useQuery({
    queryKey: ['payEstimate'],
    queryFn: () => api.get('/payroll/my-pay-estimate'),
  });

  const estimate = payEstimate?.data || {};

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>My Pay Estimate</Title>

      <Card style={styles.card}>
        <Card.Content>
          <Title>This Month</Title>
          <Divider style={styles.divider} />

          <DataTable>
            <DataTable.Row>
              <DataTable.Cell>Hours Worked</DataTable.Cell>
              <DataTable.Cell numeric>{estimate.estimatedHours?.toFixed(2) || '0.00'}</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Base Pay</DataTable.Cell>
              <DataTable.Cell numeric>{estimate.estimatedBasePay?.toFixed(2) || '0.00'} Kč</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Supplements</DataTable.Cell>
              <DataTable.Cell numeric>{estimate.estimatedSupplements?.toFixed(2) || '0.00'} Kč</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Performance Bonus</DataTable.Cell>
              <DataTable.Cell numeric>0.00 Kč</DataTable.Cell>
            </DataTable.Row>
          </DataTable>

          <Divider style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Estimated Gross Pay</Text>
            <Text style={styles.totalValue}>
              {estimate.estimatedGrossPay?.toFixed(2) || '0.00'} Kč
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Breakdown</Title>
          <Text style={styles.info}>
            ✓ Automatic weekend supplements (10%)
          </Text>
          <Text style={styles.info}>
            ✓ Automatic night supplements (10%)
          </Text>
          <Text style={styles.info}>
            ✓ Automatic public holiday supplements (100%)
          </Text>
          <Text style={styles.info}>
            ✓ Real-time calculation
          </Text>
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
  card: {
    marginBottom: 20,
  },
  divider: {
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  info: {
    marginTop: 5,
    color: '#666',
  },
});
