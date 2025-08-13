import { EXPO_PUBLIC_SPOONACULAR_KEY } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Button,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function Explore() {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [savedVisible, setSavedVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  useEffect(() => {
    loadSavedRecipes();
  }, []);

  const loadSavedRecipes = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedRecipes');
      if (saved) {
        setSavedRecipes(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved recipes:', error);
    }
  };

  const saveRecipesToStorage = async (recipes) => {
    try {
      await AsyncStorage.setItem('savedRecipes', JSON.stringify(recipes));
    } catch (error) {
      console.error('Error saving recipes:', error);
    }
  };

  const searchRecipes = async () => {
    if (!searchTerm.trim()) {
      setRecipes([]);
      return;
    }
    try {
      const response = await fetch(
        `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(
          searchTerm
        )}&number=10&apiKey=${EXPO_PUBLIC_SPOONACULAR_KEY}`
      );
      const data = await response.json();
      if (data.results) {
        setRecipes(data.results);
      } else {
        setRecipes([]);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };

  const fetchRecipeDetails = async (id) => {
    try {
      const response = await fetch(
        `https://api.spoonacular.com/recipes/${id}/information?apiKey=${EXPO_PUBLIC_SPOONACULAR_KEY}`
      );
      const data = await response.json();
      setSelectedRecipe(data);
      setDetailsVisible(true);
    } catch (error) {
      console.error('Error fetching recipe details:', error);
    }
  };

  const saveRecipe = (recipe) => {
    if (!savedRecipes.some((r) => r.id === recipe.id)) {
      const updated = [...savedRecipes, recipe];
      setSavedRecipes(updated);
      saveRecipesToStorage(updated);
    }
  };

  const deleteRecipe = (id) => {
    const updated = savedRecipes.filter((r) => r.id !== id);
    setSavedRecipes(updated);
    saveRecipesToStorage(updated);
  };

  // New handler to add recipe to meal plan calendar
  const addToMealPlan = () => {
    if (!selectedRecipe) return;
    setDetailsVisible(false);
    // Pass recipe title and instructions as params to calendar screen
    router.push({
      pathname: '/calendar',
      params: {
        openAddModal: 'true',
        prefillTitle: String(selectedRecipe.title),
        prefillDescription: [
          selectedRecipe.extendedIngredients
            ? selectedRecipe.extendedIngredients.map(ing => ing.original).join('\n')
            : '',
          selectedRecipe.instructions
            ? selectedRecipe.instructions.replace(/<\/?[^>]+(>|$)/g, "")
            : '',
        ].filter(Boolean).join('\n\n'),
        prefillImage: selectedRecipe.image,  // <=== Add this line
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Explore Recipes</Text>

      <TextInput
        style={styles.input}
        placeholder="Search for recipes..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      <Button title="Search" onPress={searchRecipes} />

      <TouchableOpacity
        style={styles.savedButton}
        onPress={() => setSavedVisible(true)}
      >
        <Text style={styles.savedButtonText}>View Saved Recipes</Text>
      </TouchableOpacity>

      <FlatList
        data={recipes}
        keyExtractor={(item, index) => `${item.id}-${index}`} // appended index for uniqueness
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => fetchRecipeDetails(item.id)}
            style={styles.recipeCard}
          >
            <Image source={{ uri: item.image }} style={styles.recipeImage} />
            <Text style={styles.recipeTitle}>{item.title}</Text>
            <Button title="Save" onPress={() => saveRecipe(item)} />
          </TouchableOpacity>
        )}
      />

      {/* Saved Recipes Modal */}
      <Modal visible={savedVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalHeading}>Saved Recipes</Text>
          <FlatList
            data={savedRecipes}
            keyExtractor={(item, index) => `${item.id}-${index}`} // appended index for uniqueness
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setSavedVisible(false);
                  fetchRecipeDetails(item.id);
                }}
                style={styles.recipeCard}
              >
                <Image source={{ uri: item.image }} style={styles.recipeImage} />
                <Text style={styles.recipeTitle}>{item.title}</Text>
                <Button title="Delete" onPress={() => deleteRecipe(item.id)} />
              </TouchableOpacity>
            )}
          />
          <Button title="Close" onPress={() => setSavedVisible(false)} />
        </View>
      </Modal>

      {/* Recipe Details Modal */}
      <Modal visible={detailsVisible} animationType="slide">
        <ScrollView style={styles.modalContainer}>
          {selectedRecipe ? (
            <>
              <Image source={{ uri: selectedRecipe.image }} style={styles.detailImage} />
              <Text style={styles.modalHeading}>{selectedRecipe.title}</Text>
              <Text>Ready in: {selectedRecipe.readyInMinutes} minutes</Text>
              <Text>Servings: {selectedRecipe.servings}</Text>

              <Text style={styles.subHeading}>Ingredients:</Text>
              {selectedRecipe.extendedIngredients?.map((ing, i) => (
                <Text key={`${ing.id}-${i}`}>- {ing.original}</Text>
              ))}

              <Text style={styles.subHeading}>Instructions:</Text>
              <Text>
                {selectedRecipe.instructions
                  ? selectedRecipe.instructions.replace(/<\/?[^>]+(>|$)/g, "")
                  : 'No instructions provided.'}
              </Text>

              <Button title="Add to Meal Plan" onPress={addToMealPlan} />

              <Button
                title="Close"
                onPress={() => {
                  setDetailsVisible(false);
                  setSelectedRecipe(null);
                }}
              />
            </>
          ) : (
            <Text>Loading...</Text>
          )}
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FCE38A' },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  savedButton: {
    backgroundColor: '#CEEE67',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  savedButtonText: { textAlign: 'center', fontWeight: 'bold' },
  recipeCard: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeImage: {
    width: 60,
    height: 60,
    marginRight: 10,
    borderRadius: 6,
  },
  recipeTitle: { fontSize: 16, fontWeight: '500', flex: 1 },
  modalContainer: { flex: 1, padding: 20, backgroundColor: '#CEEE67' },
  modalHeading: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  subHeading: { marginTop: 10, fontWeight: 'bold' },
  detailImage: {
    width: '100%',
    height: 200,
    marginBottom: 15,
    borderRadius: 8,
  },
});
