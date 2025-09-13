// onboarding.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import Checkbox from 'expo-checkbox';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const dietaryOptions = ['Dairy', 'Vegan', 'Vegetarian', 'Nut Allergy', 'Gluten-Free', 'Halal', 'Kosher', 'Keto'];
const kitchenOptions = ['Stove', 'Microwave', 'Pots & Pans', 'Slow Cooker', 'Oven', 'Blender', 'Air Fryer', 'High Pressure Cooker'];

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function OnboardingScreen() {
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [budget, setBudget] = useState(50);
  const [cookingHours, setCookingHours] = useState(3);
  const [mealTimes, setMealTimes] = useState({
    breakfast: { hour: 8, minute: 0 },
    lunch: { hour: 12, minute: 0 },
    dinner: { hour: 18, minute: 0 },
  });

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [savedDietary, savedEquipment, savedBudget, savedCookingHours, savedMealTimes] = await Promise.all([
          AsyncStorage.getItem('@dietary'),
          AsyncStorage.getItem('@equipment'),
          AsyncStorage.getItem('@budget'),
          AsyncStorage.getItem('@cookingHours'),
          AsyncStorage.getItem('@mealTimes'),
        ]);

        if (savedDietary) setSelectedDietary(JSON.parse(savedDietary));
        if (savedEquipment) setSelectedEquipment(JSON.parse(savedEquipment));
        if (savedBudget) setBudget(Number(savedBudget));
        if (savedCookingHours) setCookingHours(Number(savedCookingHours));
        if (savedMealTimes) setMealTimes(JSON.parse(savedMealTimes));
      } catch (err) {
        console.error('Error loading preferences:', err);
      }
    };
    loadPreferences();
  }, []);

  const toggleDietary = (option: string) => setSelectedDietary(prev => prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]);
  const toggleEquipment = (item: string) => setSelectedEquipment(prev => prev.includes(item) ? prev.filter(e => e !== item) : [...prev, item]);

  const handleTimeChange = (meal: keyof typeof mealTimes, value: string) => {
    // Expected format "HH:MM"
    const [hourStr, minuteStr] = value.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (!isNaN(hour) && !isNaN(minute)) {
      setMealTimes(prev => ({ ...prev, [meal]: { hour, minute } }));
    }
  };

  const handleSubmit = async () => {
    // Save locally
    await AsyncStorage.setItem('@dietary', JSON.stringify(selectedDietary));
    await AsyncStorage.setItem('@equipment', JSON.stringify(selectedEquipment));
    await AsyncStorage.setItem('@budget', budget.toString());
    await AsyncStorage.setItem('@cookingHours', cookingHours.toString());
    await AsyncStorage.setItem('@mealTimes', JSON.stringify(mealTimes));

    // Submit preferences to backend
    try {
      const res = await fetch(`${API_URL}/api/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dietary: selectedDietary, equipment: selectedEquipment, budget, cookingHours, mealTimes }),
      });
      const data = await res.json();
      if (!data.success) console.error('Failed to save preferences on server');
    } catch (err) {
      console.error('Error sending preferences to server:', err);
    }

    router.replace('/(tabs)/home');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Select Dietary Restrictions</Text>
      {dietaryOptions.map(option => (
        <View key={option} style={styles.checkboxContainer}>
          <Checkbox value={selectedDietary.includes(option)} onValueChange={() => toggleDietary(option)} />
          <Text style={styles.label}>{option}</Text>
        </View>
      ))}

      <Text style={styles.title}>Weekly Budget: ${budget}</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={budget.toString()}
        onChangeText={v => setBudget(Number(v))}
      />

      <Text style={styles.title}>Weekly Cooking Hours: {cookingHours}</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={cookingHours.toString()}
        onChangeText={v => setCookingHours(Number(v))}
      />

      <Text style={styles.title}>Meal Times</Text>
      {(['breakfast', 'lunch', 'dinner'] as const).map(meal => (
        <View key={meal} style={styles.timeRow}>
          <Text style={styles.label}>{meal.charAt(0).toUpperCase() + meal.slice(1)}:</Text>
          {Platform.OS === 'web' ? (
            <TextInput
              style={styles.input}
              value={`${mealTimes[meal].hour.toString().padStart(2, '0')}:${mealTimes[meal].minute.toString().padStart(2, '0')}`}
              onChangeText={v => handleTimeChange(meal, v)}
            />
          ) : (
            <Text>{`${mealTimes[meal].hour.toString().padStart(2, '0')}:${mealTimes[meal].minute.toString().padStart(2, '0')}`}</Text>
          )}
        </View>
      ))}

      <Text style={styles.title}>Available Kitchen Equipment</Text>
      {kitchenOptions.map(item => (
        <View key={item} style={styles.checkboxContainer}>
          <Checkbox value={selectedEquipment.includes(item)} onValueChange={() => toggleEquipment(item)} />
          <Text style={styles.label}>{item}</Text>
        </View>
      ))}

      <Button title="Next" onPress={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#FCE38A' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  label: { marginLeft: 8, fontSize: 16 },
  title: { fontSize: 18, marginVertical: 10, fontWeight: 'bold' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 6, minWidth: 80, textAlign: 'center' },
});
