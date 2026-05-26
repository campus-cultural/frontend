import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="perfil"
      screenOptions={{
        tabBarActiveTintColor: '#111111',
        tabBarInactiveTintColor: '#9B9EA5',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
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
      <MaterialIcons name={icon} size={focused ? 17 : 20} color={focused ? '#111111' : '#9B9EA5'} />
      <Text style={[styles.tabLabel, focused ? styles.tabLabelActive : null]}>{label}</Text>
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
    height: 84,
    paddingBottom: 12,
    paddingHorizontal: 14,
    paddingTop: 10,
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  tabBarItem: {
    height: 54,
  },
  tabPill: {
    alignItems: 'center',
    borderRadius: 12,
    gap: 2,
    height: 42,
    justifyContent: 'center',
    minWidth: 64,
    paddingHorizontal: 8,
  },
  tabPillActive: {
    backgroundColor: '#FFCC00',
  },
  tabLabel: {
    color: '#9B9EA5',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: '#111111',
  },
});
