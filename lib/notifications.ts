// lib/notifications.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export type MealTime = {
  hour: number;
  minute: number;
};

export type MealNotification = {
  id: string;
  meal: string;
  time: MealTime;
};

// Schedule notifications and store them
export const scheduleDailyMealNotifications = async (mealTimes: Record<string, MealTime>) => {
  const notifications: MealNotification[] = [];

  for (const meal of Object.keys(mealTimes)) {
    const time = mealTimes[meal];
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${meal} Time!`,
        body: `It's time for your ${meal.toLowerCase()}!`,
      },
      trigger: {
        hour: time.hour,
        minute: time.minute,
        repeats: true,
      },
    });

    notifications.push({ id, meal, time });
  }

  await AsyncStorage.setItem('scheduledNotifications', JSON.stringify(notifications));
};

// Cancel a notification by ID and update storage
export const deleteScheduledNotification = async (idToDelete: string) => {
  await Notifications.cancelScheduledNotificationAsync(idToDelete);

  const stored = await AsyncStorage.getItem('scheduledNotifications');
  const list: MealNotification[] = stored ? JSON.parse(stored) : [];

  const updated = list.filter(n => n.id !== idToDelete);
  await AsyncStorage.setItem('scheduledNotifications', JSON.stringify(updated));
  return updated;
};

// Load notifications from storage
export const getStoredNotifications = async (): Promise<MealNotification[]> => {
  const stored = await AsyncStorage.getItem('scheduledNotifications');
  return stored ? JSON.parse(stored) : [];
};
