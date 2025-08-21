import { scheduleDailyMealNotifications } from '@/lib/notifications'; // ✅ correct path
import AsyncStorage from '@react-native-async-storage/async-storage'; // ✅ NEW
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import Checkbox from 'expo-checkbox';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';

const dietaryOptions = [
  'Dairy',
  'Vegan',
  'Vegetarian',
  'Nut Allergy',
  'Gluten-Free',
  'Halal',
  'Kosher',
  'Keto',
];

const kitchenOptions = [
  'Stove',
  'Microwave',
  'Pots & Pans',
  'Slow Cooker',
  'Oven',
  'Blender',
  'Air Fryer',
];

// 🔹 Use your Expo tunnel URL here
const TUNNEL_URL = 'https://f7b2b5996b4f.ngrok-free.app';

export default function OnboardingScreen() {
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [budget, setBudget] = useState(50);
  const [cookingHours, setCookingHours] = useState(3);
  const [mealTimes, setMealTimes] = useState({
    breakfast: new Date(0, 0, 0, 8, 0),
    lunch: new Date(0, 0, 0, 12, 0),
    dinner: new Date(0, 0, 0, 18, 0),
  });
  const [showPicker, setShowPicker] = useState<{ meal: keyof typeof mealTimes | null; visible: boolean }>({
    meal: null,
    visible: false,
  });

  const toggleDietary = (option: string) => {
    setSelectedDietary((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };

  const toggleEquipment = (item: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  };

  const onChangeTime = (_event: any, selectedDate?: Date) => {
    if (selectedDate && showPicker.meal) {
      setMealTimes((prev) => ({ ...prev, [showPicker.meal!]: selectedDate }));
    }
    setShowPicker({ meal: null, visible: false });
  };

  const handleSubmit = async () => {
    console.log({ selectedDietary, budget, cookingHours, mealTimes, selectedEquipment });

    const simplifiedMealTimes = {
      breakfast: { hour: mealTimes.breakfast.getHours(), minute: mealTimes.breakfast.getMinutes() },
      lunch: { hour: mealTimes.lunch.getHours(), minute: mealTimes.lunch.getMinutes() },
      dinner: { hour: mealTimes.dinner.getHours(), minute: mealTimes.dinner.getMinutes() },
    };

    await AsyncStorage.setItem('@mealTimes', JSON.stringify(simplifiedMealTimes));
    await scheduleDailyMealNotifications(simplifiedMealTimes);

    // 🔹 Submit preferences to backend
    try {
      const res = await fetch(`${TUNNEL_URL}/api/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dietary: selectedDietary,
          equipment: selectedEquipment,
          budget,
          cookingHours,
          mealTimes: simplifiedMealTimes,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        console.error('Failed to save preferences on server');
      }
    } catch (err) {
      console.error('Error sending preferences to server:', err);
    }

    router.replace('/(tabs)/home');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Select Dietary Restrictions</Text>
      {dietaryOptions.map((option) => (
        <View key={option} style={styles.checkboxContainer}>
          <Checkbox
            value={selectedDietary.includes(option)}
            onValueChange={() => toggleDietary(option)}
          />
          <Text style={styles.label}>{option}</Text>
        </View>
      ))}

      <Text style={styles.title}>Weekly Budget: ${budget}</Text>
      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={1}
        maximumValue={200}
        step={1}
        value={budget}
        onValueChange={setBudget}
        minimumTrackTintColor="#CEEE67"
        maximumTrackTintColor="#d3d3d3"
      />

      <Text style={styles.title}>
        Weekly Cooking Hours: {cookingHours} {cookingHours === 1 ? 'hour' : 'hours'}
      </Text>
      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={cookingHours}
        onValueChange={setCookingHours}
        minimumTrackTintColor="#CEEE67"
        maximumTrackTintColor="#d3d3d3"
      />

      <Text style={styles.title}>Meal Times</Text>
      {(['breakfast', 'lunch', 'dinner'] as const).map((meal) => (
        <View key={meal} style={styles.timeRow}>
          <Text style={styles.label}>{meal.charAt(0).toUpperCase() + meal.slice(1)}:</Text>
          <Button
            title={mealTimes[meal].toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            onPress={() => setShowPicker({ meal, visible: true })}
          />
        </View>
      ))}

      {showPicker.visible && showPicker.meal && (
        <DateTimePicker
          value={mealTimes[showPicker.meal]}
          mode="time"
          is24Hour={false}
          display="spinner"
          onChange={onChangeTime}
        />
      )}

      <Text style={styles.title}>Available Kitchen Equipment</Text>
      {kitchenOptions.map((item) => (
        <View key={item} style={styles.checkboxContainer}>
          <Checkbox
            value={selectedEquipment.includes(item)}
            onValueChange={() => toggleEquipment(item)}
          />
          <Text style={styles.label}>{item}</Text>
        </View>
      ))}

      <Button title="Next" onPress={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FCE38A',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  label: {
    marginLeft: 8,
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    marginVertical: 10,
    fontWeight: 'bold',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
});
