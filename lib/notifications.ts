// lib/notifications.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MealTime = {
  hour: number;
  minute: number;
};

export type MealNotification = {
  meal: string;
  time: MealTime;
};

// Save meal times
export const saveMealNotifications = async (mealTimes: Record<string, MealTime>) => {
  const notifications: MealNotification[] = Object.keys(mealTimes).map(meal => ({
    meal,
    time: mealTimes[meal],
  }));

  await AsyncStorage.setItem('mealNotifications', JSON.stringify(notifications));
};

// Get saved meal times
export const getMealNotifications = async (): Promise<MealNotification[]> => {
  const stored = await AsyncStorage.getItem('mealNotifications');
  return stored ? JSON.parse(stored) : [];
};

// Delete a meal notification
export const deleteMealNotification = async (meal: string) => {
  const list = await getMealNotifications();
  const updated = list.filter(n => n.meal !== meal);
  await AsyncStorage.setItem('mealNotifications', JSON.stringify(updated));
  return updated;
};
