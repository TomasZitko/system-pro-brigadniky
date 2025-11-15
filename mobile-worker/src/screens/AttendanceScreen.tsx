import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Card, Title, Paragraph, Text } from 'react-native-paper';
import * as Location from 'expo-location';
import api from '../services/api';

export default function AttendanceScreen() {
  const [location, setLocation] = useState<any>(null);
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getLocation();
    getCurrentShift();
  }, []);

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is required for clock-in/out');
      return;
    }

    const loc = await Location.getCurrentPositionAsync({});
    setLocation(loc.coords);
  };

  const getCurrentShift = async () => {
    try {
      const response = await api.get('/shifts/my-shifts');
      // Find current or upcoming shift
      const now = new Date();
      const current = response.data.find((shift: any) => {
        const start = new Date(shift.startTime);
        const end = new Date(shift.endTime);
        return start <= now && end >= now;
      });
      setCurrentShift(current);
    } catch (error) {
      console.error(error);
    }
  };

  const handleClockIn = async () => {
    if (!location) {
      Alert.alert('Error', 'Getting your location...');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/attendance/clock-in', {
        shiftId: currentShift.id,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setAttendance(response.data);
      Alert.alert('Success', 'Clocked in successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Clock-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!location) {
      Alert.alert('Error', 'Getting your location...');
      return;
    }

    setLoading(true);
    try {
      await api.post('/attendance/clock-out', {
        attendanceId: attendance.id,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      Alert.alert('Success', 'Clocked out successfully!');
      setAttendance(null);
      getCurrentShift();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Clock-out failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Time Tracking</Title>

      {currentShift && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>{currentShift.roleName}</Title>
            <Paragraph>
              {new Date(currentShift.startTime).toLocaleTimeString()} -{' '}
              {new Date(currentShift.endTime).toLocaleTimeString()}
            </Paragraph>
            <Text>Rate: {currentShift.hourlyRate} Kč/hour</Text>
          </Card.Content>
        </Card>
      )}

      <View style={styles.buttonContainer}>
        {!attendance ? (
          <Button
            mode="contained"
            onPress={handleClockIn}
            loading={loading}
            disabled={!currentShift || loading}
            style={styles.clockButton}
            buttonColor="#4caf50"
            icon="clock-in"
          >
            Clock In
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={handleClockOut}
            loading={loading}
            disabled={loading}
            style={styles.clockButton}
            buttonColor="#dc004e"
            icon="clock-out"
          >
            Clock Out
          </Button>
        )}
      </View>

      {attendance && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Currently Working</Title>
            <Text>Clocked in: {new Date(attendance.clockInTime).toLocaleTimeString()}</Text>
            <Text>Location verified ✓</Text>
          </Card.Content>
        </Card>
      )}

      {!location && (
        <Text style={styles.info}>Getting your location for geofenced clock-in...</Text>
      )}
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
    marginBottom: 20,
  },
  buttonContainer: {
    marginVertical: 20,
  },
  clockButton: {
    padding: 10,
  },
  info: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
});
