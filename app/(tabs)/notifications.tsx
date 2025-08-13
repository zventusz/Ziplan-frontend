import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

type MealTime = {
  hour: number;
  minute: number;
};

type MealTimes = {
  [meal: string]: MealTime;
};

export default function NotificationsScreen() {
  const [mealTimes, setMealTimes] = useState<MealTimes | null>(null);

  useEffect(() => {
    const loadMealTimes = async () => {
      const stored = await AsyncStorage.getItem('@mealTimes');
      if (stored) {
        try {
          const parsed: MealTimes = JSON.parse(stored);
          setMealTimes(parsed);
        } catch {
          // In case parse fails, reset to null
          setMealTimes(null);
        }
      } else {
        setMealTimes({});
      }
    };

    loadMealTimes();
  }, []);

  const handleDelete = async (meal: string) => {
    if (!mealTimes) return;

    const updated = { ...mealTimes };
    delete updated[meal];
    setMealTimes(updated);

    if (Object.keys(updated).length === 0) {
      await AsyncStorage.removeItem('@mealTimes');
    } else {
      await AsyncStorage.setItem('@mealTimes', JSON.stringify(updated));
    }
  };

  const renderItem = ({ item }: { item: [string, MealTime] }) => {
    const [meal, time] = item;

    // Defensive check if time exists
    if (!time || typeof time.hour !== 'number' || typeof time.minute !== 'number') {
      return null;
    }

    const timeStr = `${time.hour.toString().padStart(2, '0')}:${time.minute
      .toString()
      .padStart(2, '0')}`;

    return (
      <View style={styles.card}>
        <Text style={styles.mealTitle}>{meal.charAt(0).toUpperCase() + meal.slice(1)}</Text>
        <Text style={styles.time}>{timeStr}</Text>
        <Pressable onPress={() => handleDelete(meal)} style={styles.deleteButton}>
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
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FCE38A',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loading: {
    fontSize: 16,
    color: '#555',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  time: {
    fontSize: 16,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    fontSize: 18,
  },
});
