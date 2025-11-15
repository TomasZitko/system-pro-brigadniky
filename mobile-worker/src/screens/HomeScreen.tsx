import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Text, Button } from 'react-native-paper';

export default function HomeScreen({ navigation }: any) {
  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Welcome, {(global as any).user?.firstName}!</Title>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Today's Shifts</Title>
          <Text>You have 1 shift scheduled today</Text>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => navigation.navigate('Schedule')}>View Schedule</Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>This Month</Title>
          <Text>Estimated Pay: 4,850 Kč</Text>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => navigation.navigate('MyPay')}>View Details</Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Marketplace</Title>
          <Text>5 open shifts available</Text>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => navigation.navigate('Marketplace')}>Browse</Button>
        </Card.Actions>
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
    marginBottom: 15,
  },
});
