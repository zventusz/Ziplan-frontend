import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  // Greeting state
  const [greeting, setGreeting] = useState('');

  // Shopping List State
  const [shoppingList, setShoppingList] = useState<{ text: string; checked: boolean }[]>([]);
  const [newItem, setNewItem] = useState('');

  // Cooking Tip of the Day
  const cookingTips = [
    "Add a pinch of salt to coffee to reduce bitterness.",
    "Let meat rest before slicing for juicier results.",
    "Use pasta water to thicken and flavor sauces.",
    "Store herbs upright in water to keep them fresh longer.",
    "Toast spices before cooking to release their flavor.",
    "Freeze leftover wine in ice cube trays for cooking.",
    "Don't overcrowd the pan for better browning.",
    "Cut onions near running water to reduce tears.",
    "Chill cookie dough before baking for thicker cookies.",
    "Add vinegar to water when boiling eggs for easier peeling.",
    "Grate frozen butter into pastry for flakier layers.",
    "Keep knives sharp — dull knives are more dangerous.",
    "Add lemon juice to keep cut fruit from browning.",
    "Let bread dough rise in a warm, draft-free spot.",
    "Always taste as you cook and adjust seasoning.",
  ];
  const [tipOfTheDay, setTipOfTheDay] = useState('');

  // Set greeting based on current hour
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting('Good morning');
    } else if (hour >= 12 && hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []);

  // Load Shopping List
  useEffect(() => {
    const loadList = async () => {
      const saved = await AsyncStorage.getItem('shoppingList');
      if (saved) setShoppingList(JSON.parse(saved));
    };
    loadList();
  }, []);

  // Save Shopping List
  useEffect(() => {
    AsyncStorage.setItem('shoppingList', JSON.stringify(shoppingList));
  }, [shoppingList]);

  // Pick Tip of the Day
  useEffect(() => {
    const today = new Date().toDateString();
    AsyncStorage.getItem('tipDate').then((savedDate) => {
      if (savedDate !== today) {
        const randomTip = cookingTips[Math.floor(Math.random() * cookingTips.length)];
        setTipOfTheDay(randomTip);
        AsyncStorage.setItem('tipOfTheDay', randomTip);
        AsyncStorage.setItem('tipDate', today);
      } else {
        AsyncStorage.getItem('tipOfTheDay').then((savedTip) => {
          if (savedTip) setTipOfTheDay(savedTip);
        });
      }
    });
  }, []);

  // Handlers
  const removeItem = (index: number) => {
    const updated = [...shoppingList];
    updated.splice(index, 1);
    setShoppingList(updated);
  };

  const toggleItemChecked = (index: number) => {
    const updated = [...shoppingList];
    updated[index].checked = !updated[index].checked;
    setShoppingList(updated);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Greeting Header */}
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingText}>{greeting}!</Text>
      </View>

      {/* Quick Add Buttons */}
      <View style={styles.quickButtons}>
        <TouchableOpacity style={styles.quickButton} onPress={() => router.push('/calendar')}>
          <Text style={styles.quickButtonText}>🍽 Plan Meal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickButton, { backgroundColor: '#CEEE67' }]}
          onPress={() => router.push('/notifications')}
        >
          <Text style={styles.quickButtonText}>🚨 Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={() => router.push('/explore')}>
          <Text style={styles.quickButtonText}>🧾 Browse Recipes</Text>
        </TouchableOpacity>
      </View>

      {/* Cooking Tip of the Day */}
      <View style={styles.tipContainer}>
        <Text style={styles.sectionTitle}>🍳 Cooking Tip of the Day</Text>
        <Text style={styles.tipText}>{tipOfTheDay}</Text>
      </View>

      {/* Shopping List */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>🛍 Weekly Shopping List</Text>
        <FlatList
          data={shoppingList}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.listItem}>
              <TouchableOpacity onPress={() => toggleItemChecked(index)}>
                <Text style={[styles.listItemText, item.checked && styles.checkedItem]}>
                  {item.checked ? '☑️ ' : '⬜ '} {item.text}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeItem(index)}>
                <Text style={{ color: 'red', fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          ListFooterComponent={
            <View style={styles.addItemRow}>
              <TextInput
                style={styles.input}
                placeholder="Add item..."
                value={newItem}
                onChangeText={setNewItem}
                onSubmitEditing={() => {
                  if (newItem.trim()) {
                    setShoppingList([...shoppingList, { text: newItem.trim(), checked: false }]);
                    setNewItem('');
                  }
                }}
                returnKeyType="done"
              />
            </View>
          }
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#FCE38A' },
  greetingContainer: { marginBottom: 20 },
  greetingText: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  quickButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  quickButton: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#CEEE67',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  quickButtonText: { color: '#000000ff', fontWeight: 'bold' },
  tipContainer: { marginBottom: 20, padding: 12, backgroundColor: '#f1f1f1', borderRadius: 10 },
  tipText: { fontSize: 16, fontStyle: 'italic', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  listContainer: { flex: 1 },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  listItemText: { fontSize: 16 },
  checkedItem: { textDecorationLine: 'line-through', color: '#999' },
  addItemRow: { marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 40,
  },
});
