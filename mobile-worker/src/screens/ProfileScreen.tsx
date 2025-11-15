import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Text, Button, List } from 'react-native-paper';

export default function ProfileScreen({ navigation }: any) {
  const user = (global as any).user || {};

  const handleLogout = () => {
    delete (global as any).token;
    delete (global as any).user;
    navigation.replace('Login');
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>My Profile</Title>

      <Card style={styles.card}>
        <Card.Content>
          <Title>{user.firstName} {user.lastName}</Title>
          <Text>{user.email}</Text>
          <Text>{user.phone}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Settings</Title>
          <List.Item
            title="Notifications"
            description="Manage notification preferences"
            left={props => <List.Icon {...props} icon="bell" />}
          />
          <List.Item
            title="Availability"
            description="Set your working hours"
            left={props => <List.Icon {...props} icon="calendar" />}
          />
          <List.Item
            title="Bank Details"
            description="Update payment information"
            left={props => <List.Icon {...props} icon="bank" />}
          />
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutButton}
        textColor="#dc004e"
      >
        Logout
      </Button>
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
  logoutButton: {
    marginTop: 20,
    marginBottom: 40,
  },
});
