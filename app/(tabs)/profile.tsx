import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

export default function ProfileScreen() {
  const router = useRouter();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('@userToken');

      if (token) {
        await fetch(`${API_URL}/api/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }

      await AsyncStorage.removeItem('@userToken');
      Alert.alert('Logged Out', 'You have been logged out.');
      router.replace('/login');
    } catch (error) {
      console.error("❌ Logout error:", error);
      await AsyncStorage.removeItem('@userToken');
      router.replace('/login');
    }
  };

  const handleSaveEmail = async () => {
    if (!newEmail.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem('@userToken');
      const res = await fetch(`${API_URL}/api/update-email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: newEmail }),
      });
      if (res.ok) {
        Alert.alert("Success", "Email updated successfully.");
      } else {
        Alert.alert("Error", "Failed to update email.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setShowEmailModal(false);
    }
  };

  const handleSavePassword = async () => {
    if (password1 !== password2) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem('@userToken');
      const res = await fetch(`${API_URL}/api/update-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: password1 }),
      });
      if (res.ok) {
        Alert.alert("Success", "Password updated successfully.");
      } else {
        Alert.alert("Error", "Failed to update password.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setShowPasswordModal(false);
      setPassword1("");
      setPassword2("");
    }
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
        onPress={() => setShowPasswordModal(true)}
      />

      <SectionButton
        icon={<Ionicons name="mail-outline" size={24} color="#fff" style={{ marginRight: 12 }} />}
        label="Email"
        onPress={() => setShowEmailModal(true)}
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

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              secureTextEntry
              placeholder="Enter new password"
              value={password1}
              onChangeText={setPassword1}
              style={styles.input}
            />
            <TextInput
              secureTextEntry
              placeholder="Confirm new password"
              value={password2}
              onChangeText={setPassword2}
              style={styles.input}
            />
            <View style={styles.row}>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)} style={styles.modalButton}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSavePassword} style={styles.modalButton}>
                <Text>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Email Modal */}
      <Modal visible={showEmailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Change Email</Text>
            <TextInput
              placeholder="Enter new email"
              value={newEmail}
              onChangeText={setNewEmail}
              style={styles.input}
              keyboardType="email-address"
            />
            <View style={styles.row}>
              <TouchableOpacity onPress={() => setShowEmailModal(false)} style={styles.modalButton}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveEmail} style={styles.modalButton}>
                <Text>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCE38A', padding: 30, paddingTop: 60 },
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: {
    padding: 10,
    backgroundColor: '#CEEE67',
    borderRadius: 6,
    marginTop: 10,
  },
});
