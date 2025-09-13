// notifications.tsx
import { deleteMealNotification } from '@/lib/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

type MealTimes = Record<string, { hour: number; minute: number }>;

export default function NotificationsScreen() {
  const [mealTimes, setMealTimes] = useState<MealTimes | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const storedMealTimes = await AsyncStorage.getItem('@mealTimes');
      if (storedMealTimes) {
        try {
          setMealTimes(JSON.parse(storedMealTimes));
        } catch {
          setMealTimes({});
        }
      } else {
        setMealTimes({});
      }
    };

    loadData();
  }, []);

  const handleDelete = async (meal: string) => {
    if (!mealTimes) return;

    const updatedMealTimes = { ...mealTimes };
    delete updatedMealTimes[meal];
    setMealTimes(updatedMealTimes);

    if (Object.keys(updatedMealTimes).length === 0) {
      await AsyncStorage.removeItem('@mealTimes');
    } else {
      await AsyncStorage.setItem('@mealTimes', JSON.stringify(updatedMealTimes));
    }

    await deleteMealNotification(meal);
  };

  const renderItem = ({ item }: { item: [string, { hour: number; minute: number }] }) => {
    const [meal, time] = item;
    if (!time) return null;

    const timeStr = `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;

    return (
      <View style={styles.card}>
        <View>
          <Text style={styles.mealTitle}>{meal.charAt(0).toUpperCase() + meal.slice(1)}</Text>
          <Text style={styles.time}>{timeStr}</Text>
        </View>
        <Pressable
          style={styles.deleteButton}
          onPress={() =>
            Alert.alert(
              'Delete Notification',
              `Are you sure you want to delete the ${meal} notification?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => handleDelete(meal) },
              ]
            )
          }
        >
          <Text style={styles.deleteText}>❌</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Scheduled Meal Notifications</Text>

      {mealTimes === null ? (
        <Text style={styles.loading}>Loading...</Text>
      ) : Object.keys(mealTimes).length === 0 ? (
        <Text style={styles.loading}>No notifications scheduled.</Text>
      ) : (
        <FlatList
          data={Object.entries(mealTimes)}
          keyExtractor={([meal]) => meal}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, paddingTop: 60, backgroundColor: '#FCE38A' },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  loading: { fontSize: 16, color: '#555' },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealTitle: { fontSize: 18, fontWeight: 'bold' },
  time: { fontSize: 16, color: '#666' },
  deleteButton: { padding: 8 },
  deleteText: { fontSize: 18 },
});
