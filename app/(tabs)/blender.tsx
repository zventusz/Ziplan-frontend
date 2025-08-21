// app/blender.tsx
import React, { useState } from "react";
import { ActivityIndicator, Clipboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function BlenderPage() {
  const [ingredients, setIngredients] = useState("");
  const [recipe, setRecipe] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateRecipe = async () => {
    if (!ingredients.trim()) return;

    setLoading(true);
    setError("");
    setRecipe("");

    try {
      const response = await fetch("https://f7b2b5996b4f.ngrok-free.app/api/recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ingredients: ingredients.split(",").map(i => i.trim()) }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || "Recipe generation failed");
      } else {
        setRecipe(data.recipe);
      }

    } catch (err) {
      console.error(err);
      setError("Failed to connect to server. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyRecipeToClipboard = () => {
    if (recipe) {
      Clipboard.setString(recipe);
      alert('Recipe copied to clipboard!');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Blender</Text>
      <Text style={styles.label}>Enter your ingredients (comma separated):</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., chicken, tomato, onion"
        value={ingredients}
        onChangeText={setIngredients}
      />
      <TouchableOpacity style={styles.button} onPress={generateRecipe}>
        <Text style={styles.buttonText}>Generate Recipe</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {recipe ? (
        <View style={styles.recipeContainer}>
          <Text style={styles.recipeText}>{recipe}</Text>
          <TouchableOpacity style={styles.copyButton} onPress={copyRecipeToClipboard}>
            <Text style={styles.copyButtonText}>Copy Recipe</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  label: { fontSize: 16, marginBottom: 10 },
  input: { borderColor: "#ccc", borderWidth: 1, padding: 12, borderRadius: 8, fontSize: 16, marginBottom: 15 },
  button: { backgroundColor: "#007AFF", padding: 15, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  recipeContainer: { marginTop: 25, backgroundColor: "#f9f9f9", padding: 15, borderRadius: 10 },
  recipeText: { fontSize: 16, lineHeight: 22 },
  error: { color: "red", marginTop: 15, textAlign: "center" },
  copyButton: { marginTop: 15, backgroundColor: "#28a745", padding: 12, borderRadius: 8, alignItems: "center" },
  copyButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
