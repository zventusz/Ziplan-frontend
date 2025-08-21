// app/(tabs)/profile.tsx
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Logout', 'You have been logged out.');
  };

  const SectionButton = ({ icon, label, onPress, color }: any) => (
    <TouchableOpacity style={[styles.button, color && { backgroundColor: color }]} onPress={onPress}>
      <View style={styles.buttonContent}>
        {icon}
        <Text style={styles.buttonText}>{label}</Text>
      </View>
      <Feather name="chevron-right" size={20} color="#fff" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.heading}>Profile</Text>

      <SectionButton
        icon={<MaterialIcons name="lock-outline" size={24} color="#fff" style={{ marginRight: 12 }} />}
        label="Passwords & Security"
        onPress={() => Alert.alert('Passwords & Security')}
      />

      <SectionButton
        icon={<Ionicons name="mail-outline" size={24} color="#fff" style={{ marginRight: 12 }} />}
        label="Email"
        onPress={() => Alert.alert('Email Settings')}
      />

      <SectionButton
        icon={<Feather name="settings" size={24} color="#fff" style={{ marginRight: 12 }} />}
        label="Preferences"
        onPress={() => router.push('/onboarding')}
      />

      <SectionButton
        icon={<Feather name="log-out" size={24} color="#fff" style={{ marginRight: 12 }} />}
        label="Logout"
        onPress={handleLogout}
        color="#FF5C5C"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCE38A', padding: 16 },
  heading: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#CEEE67',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  buttonContent: { flexDirection: 'row', alignItems: 'center' },
  buttonText: { color: '#000000ff', fontWeight: 'bold', fontSize: 16 },
});
