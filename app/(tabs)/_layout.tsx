import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { clearAuthToken } from '@/src/lib/auth/token';
import { hasAuthToken } from '@/src/lib/api/campus';

export default function TabLayout() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      async function redirectUnauthenticatedUser() {
        if (!(await hasAuthToken())) {
          await clearAuthToken();
          router.replace('/login' as never);
        }
      }

      void redirectUnauthenticatedUser();
    }, [router]),
  );

  return (
    <Tabs
      initialRouteName="perfil"
      screenOptions={{
        tabBarActiveTintColor: '#111111',
        tabBarInactiveTintColor: '#9B9EA5',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarIconStyle: styles.tabBarIcon,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
      }}>
      <Tabs.Screen
        name="calendario"
        options={{
          title: 'Calendário',
          tabBarIcon: ({ focused }) => (
            <TabItem focused={focused} icon="calendar-today" label="Calendário" />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ focused }) => <TabItem focused={focused} icon="home" label="Início" />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => <TabItem focused={focused} icon="person" label="Perfil" />,
        }}
      />
      <Tabs.Screen
        name="novo-evento"
        options={{ href: null }}
      />
    </Tabs>
  );
}

function TabItem({
  focused,
  icon,
  label,
}: {
  focused: boolean;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}) {
  return (
    <View style={[styles.tabPill, focused ? styles.tabPillActive : null]}>
      <MaterialIcons name={icon} size={focused ? 24 : 23} color={focused ? '#111111' : '#A0A3AB'} />
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.82}
        numberOfLines={1}
        style={[styles.tabLabel, focused ? styles.tabLabelActive : null]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#EFEFEF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    elevation: 10,
    height: 104,
    paddingBottom: 18,
    paddingHorizontal: 20,
    paddingTop: 14,
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  tabBarItem: {
    alignItems: 'center',
    flex: 1,
    height: 70,
    justifyContent: 'center',
  },
  tabBarIcon: {
    alignItems: 'center',
    height: 70,
    justifyContent: 'center',
    width: '100%',
  },
  tabPill: {
    alignItems: 'center',
    borderRadius: 22,
    gap: 5,
    height: 64,
    justifyContent: 'center',
    maxWidth: 122,
    minWidth: 102,
    paddingHorizontal: 10,
    width: '100%',
  },
  tabPillActive: {
    backgroundColor: '#FFCC00',
  },
  tabLabel: {
    color: '#9B9EA5',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: '#111111',
  },
});
