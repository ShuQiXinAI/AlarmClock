import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import notifee, { EventType } from '@notifee/react-native';
import { setupNotifee } from './src/services/notifeeService';
import { useAlarmStore } from './src/store/alarmStore';
import AppNavigator, { RootStackParamList } from './src/navigation/AppNavigator';

export default function App() {
  const rescheduleAll = useAlarmStore(s => s.rescheduleAll);
  const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    (async () => {
      await setupNotifee();
      await rescheduleAll();
    })();

    // Foreground event: app is open when notification fires or is tapped.
    // Navigate to RingingScreen so the user has to dismiss via challenge.
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      const { notification } = detail;
      if (!notification?.id) return;

      if (type === EventType.DELIVERED || type === EventType.PRESS) {
        navRef.current?.navigate('Ringing', { alarmId: notification.id });
      }
    });

    // If the app was launched from a notification (cold start), navigate
    // to the ringing screen.
    notifee.getInitialNotification().then(initial => {
      if (initial?.notification?.id) {
        // Defer until navigation is ready.
        setTimeout(() => {
          navRef.current?.navigate('Ringing', {
            alarmId: initial.notification.id!,
          });
        }, 500);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer ref={navRef}>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
