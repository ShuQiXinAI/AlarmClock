import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { setupNotifee } from './src/services/notifeeService';
import { useAlarmStore } from './src/store/alarmStore';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const rescheduleAll = useAlarmStore(s => s.rescheduleAll);

  useEffect(() => {
    setupNotifee().then(() => rescheduleAll());
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
