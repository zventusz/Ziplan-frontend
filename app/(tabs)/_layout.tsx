import { Tabs } from 'expo-router';
import React from 'react';
import { Image, Platform } from 'react-native';

export default function TabLayout() {
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
