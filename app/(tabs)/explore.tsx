import { EXPO_PUBLIC_SPOONACULAR_KEY } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

  // 🔹 Blender states
  const [blenderVisible, setBlenderVisible] = useState(false);
  const [ingredients, setIngredients] = useState('');
  const [blenderRecipe, setBlenderRecipe] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 🔹 Suggested carousel state
  const [suggested, setSuggested] = useState([]);


  useEffect(() => {
    loadSavedRecipes();
    fetchSuggestedRecipes(); // 🔹 NEW: load suggestions on mount
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
        prefillImage: selectedRecipe.image,
      }
    });
  };

  // 🔹 Fetch random suggested recipes (5 daily)
  const fetchSuggestedRecipes = async () => {
    try {
      const response = await fetch(
        `https://api.spoonacular.com/recipes/random?number=5&apiKey=${EXPO_PUBLIC_SPOONACULAR_KEY}`
      );
      const data = await response.json();
      if (data.recipes) {
        setSuggested(data.recipes);
      }
    } catch (error) {
      console.error('Error fetching suggested recipes:', error);
    }
  };

  // 🔹 Blender generate function
  const generateRecipe = async () => {
    if (!ingredients.trim()) return;

    setLoading(true);
    setError('');
    setBlenderRecipe('');

    try {
      const response = await fetch("https://ziplan-backend.onrender.com/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: ingredients.split(",").map(i => i.trim()) }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || "Recipe generation failed");
      } else {
        setBlenderRecipe(data.recipe);
      }

    } catch (err) {
      console.error(err);
      setError("Failed to connect to server. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyRecipeToClipboard = () => {
    if (blenderRecipe) {
      // Clipboard is deprecated, use Alert instead for now
      Alert.alert("Copied", "Recipe copied to clipboard!");
    }
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

      {/* 🔹 Suggested Carousel */}
      {suggested.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontWeight: "bold", fontSize: 18, marginVertical: 10 }}>Today's Suggestions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {suggested.map((item, index) => (
              <TouchableOpacity
                key={`${item.id}-${index}`}
                onPress={() => fetchRecipeDetails(item.id)}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.suggestedImage} // 🔹 NEW style
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={recipes}
        keyExtractor={(item, index) => `${item.id}-${index}`}
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

      {/* Floating Plus Button for Blender */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setBlenderVisible(true)}
      >
        <Image
          source={require('@/assets/images/icons8-sparkle-48.png')} // 👈 put your image here
          style={styles.fabImage}
        />
      </TouchableOpacity>


      {/* 🔹 Blender Modal */}
      <Modal visible={blenderVisible} animationType="slide">
        <ScrollView contentContainerStyle={styles.blenderContainer}>
          <Text style={styles.blenderTitle}>Blender</Text>
          {/* New text here */}
          <Text style={styles.blenderSubtitle}>
            Not sure what you're feeling today? Blender is here at your service! Give blender your leftover ingredients from the fridge and watch it work its spell and magic in no time at all! Whip up a tasty recipe you'll want to prepare as a lightning-quick delicious weekday dinner or even bring to your upcoming social gathering!
          </Text>
          {/* Image 1 */}
          <Image
            source={require('@/assets/images/combinedblender.png')} // combined blender image
            style={styles.blenderImage}
          />
          <Text style={[styles.label, { marginTop: 40 }]}>Enter your ingredients (comma separated):</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., chicken, tomato, high-protein, chinese"
            value={ingredients}
            onChangeText={setIngredients}
          />
          <TouchableOpacity style={styles.button} onPress={generateRecipe}>
            <Text style={styles.buttonText}>Generate Recipe</Text>
          </TouchableOpacity>

          {loading && <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {blenderRecipe ? (
            <View style={styles.recipeContainer}>
              <Text style={styles.recipeText}>{blenderRecipe}</Text>
              <TouchableOpacity style={styles.copyButton} onPress={copyRecipeToClipboard}>
                <Text style={styles.copyButtonText}>Copy Recipe</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <Button title="Close" onPress={() => setBlenderVisible(false)} />
        </ScrollView>
      </Modal>

      {/* Saved Recipes Modal */}
      <Modal visible={savedVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalHeading}>Saved Recipes</Text>
          <FlatList
            data={savedRecipes}
            keyExtractor={(item, index) => `${item.id}-${index}`}
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
  container: { flex: 1, padding: 30, paddingTop: 60, backgroundColor: '#FCE38A' },
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

  // 🔹 Suggested images
  suggestedImage: {
    width: 180,
    height: 140,
    marginRight: 10,
    borderRadius: 8,
  },

  modalContainer: { flex: 1, padding: 30, paddingTop: 60, backgroundColor: '#CEEE67' },
  modalHeading: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  subHeading: { marginTop: 10, fontWeight: 'bold' },
  detailImage: {
    width: '100%',
    height: 200,
    marginBottom: 15,
    borderRadius: 8,
  },
  // 🔹 Blender styles
  blenderContainer: { padding: 20, paddingTop: 40, backgroundColor: "#FA5252" },
  blenderTitle: { fontSize: 28, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  blenderSubtitle: {
    fontSize: 16,
    color: '#000000ff',
    marginBottom: 15,
    textAlign: 'center',
    fontStyle: 'italic', // ← makes it italic
  },
  label: { fontSize: 16, marginBottom: 0 },
  button: { backgroundColor: "#CEEE67", padding: 15, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#000000ff", fontWeight: "bold", fontSize: 16 },
  recipeContainer: { marginTop: 25, backgroundColor: "#f68585ff", padding: 15, borderRadius: 10 },
  recipeText: { fontSize: 16, lineHeight: 22 },
  error: { color: "red", marginTop: 15, textAlign: "center" },
  copyButton: { marginTop: 15, backgroundColor: "#28a745", padding: 12, borderRadius: 8, alignItems: "center" },
  copyButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  // 🔹 Floating action button
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 30,
    backgroundColor: '#FA5252',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    borderWidth: 0,
    borderColor: 'black',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  fabImage: {
    width: 56,   // adjust as needed
    height: 56,
    tintColor: '#fff', // optional, if you want to recolor the icon
  },
  blenderImage: {
    width: '100%',
    height: 400, // adjust as needed
    marginVertical: 0,
    borderRadius: 8,
  },

  fabText: { color: 'white', fontSize: 32, fontWeight: 'bold' },
});