import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, View } from 'react-native';

export default function TabLayout() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('@userToken'); // 👈 must match what you save on login
        if (token) {
          setAuthenticated(true);
        } else {
          router.replace('/login'); // 🚀 kick to login if not logged in
        }
      } catch (e) {
        console.error('Error checking auth:', e);
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!authenticated) {
    return null; // while redirecting
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIcon: ({ color, focused }) => {
          const icons: Record<string, any> = {
            home: require('@/assets/images/home.png'),
            explore: require('@/assets/images/explore.png'),
            calendar: require('@/assets/images/calendar.png'),
            notifications: require('@/assets/images/notification.png'),
            profile: require('@/assets/images/profile.png'),
          };
          return (
            <Image
              source={icons[route.name]}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? color : '#999',
              }}
              resizeMode="contain"
            />
          );
        },
        tabBarStyle: Platform.select({
          ios: { position: 'absolute', height: 60, backgroundColor: '#FFEEB3' },
          android: { height: 60, backgroundColor: '#FFEEB3' },
        }),
      })}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="notifications" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
