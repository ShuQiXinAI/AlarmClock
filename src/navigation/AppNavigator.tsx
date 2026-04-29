import React from 'react';
import { View, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS } from '../theme/colors';
import HomeScreen from '../screens/HomeScreen';
import EditAlarmScreen from '../screens/EditAlarmScreen';
import RingingScreen from '../screens/RingingScreen';
import MathUnlockScreen from '../screens/MathUnlockScreen';

// ─── Param Lists ────────────────────────────────────────────────────────────

export type TabParamList = {
  Home: undefined;
  Stats: undefined;
};

export type RootStackParamList = {
  Tab: undefined;
  EditAlarm: { alarmId?: string };
  Ringing: { alarmId: string };
  MathUnlock: { alarmId: string };
  ShakeUnlock: { alarmId: string };
  BlinkUnlock: { alarmId: string };
  Success: undefined;
};

// ─── Placeholder Screens ─────────────────────────────────────────────────────

const StatsScreen = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>StatsScreen</Text>
  </View>
);




const ShakeUnlockScreen = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>ShakeUnlockScreen</Text>
  </View>
);

const BlinkUnlockScreen = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>BlinkUnlockScreen</Text>
  </View>
);

const SuccessScreen = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>SuccessScreen</Text>
  </View>
);

// ─── Navigators ──────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: COLORS.border,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: '闹钟', tabBarIcon: () => <Text>🔔</Text> }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{ tabBarLabel: '成就', tabBarIcon: () => <Text>🏆</Text> }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tab" component={TabNavigator} />
      <Stack.Screen name="EditAlarm" component={EditAlarmScreen} />
      <Stack.Screen name="Ringing" component={RingingScreen} />
      <Stack.Screen name="MathUnlock" component={MathUnlockScreen} />
      <Stack.Screen name="ShakeUnlock" component={ShakeUnlockScreen} />
      <Stack.Screen name="BlinkUnlock" component={BlinkUnlockScreen} />
      <Stack.Screen name="Success" component={SuccessScreen} />
    </Stack.Navigator>
  );
}
