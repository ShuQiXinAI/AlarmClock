import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import notifee, { EventType } from '@notifee/react-native';
import { setupNotifee } from './src/services/notifeeService';
import { useAlarmStore } from './src/store/alarmStore';
import AppNavigator, { RootStackParamList } from './src/navigation/AppNavigator';
import { COLORS } from './src/theme/colors';

export default function App() {
  const rescheduleAll = useAlarmStore(s => s.rescheduleAll);
  const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const navigatedAlarmRef = useRef<string | null>(null);

  // Centralized navigation: jump to RingingScreen for the given alarmId,
  // but only once per alarm to avoid re-entering after the user finishes
  // the challenge.
  const goToRinging = (alarmId: string) => {
    if (navigatedAlarmRef.current === alarmId) return;
    navigatedAlarmRef.current = alarmId;
    navRef.current?.navigate('Ringing', { alarmId });
  };

  // Look at currently-displayed notifications and route to the alarm
  // screen if any are showing. Covers the cases where the app was
  // launched via fullScreenAction (no PRESS event) or brought back from
  // background while a trigger was firing.
  const checkDisplayedAlarm = async () => {
    try {
      const displayed = await notifee.getDisplayedNotifications();
      const alarm = displayed.find((d) => d.notification?.id);
      if (alarm?.notification?.id) {
        goToRinging(alarm.notification.id);
      }
    } catch {}
  };

  useEffect(() => {
    (async () => {
      await setupNotifee();
      await rescheduleAll();
      // Check once after navigator is ready.
      setTimeout(checkDisplayedAlarm, 500);
    })();

    // Foreground event: fires when a trigger delivers a notification
    // while the app is already in the foreground, or when the user taps
    // a heads-up notification while the app is open.
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      const { notification } = detail;
      if (!notification?.id) return;
      if (type === EventType.DELIVERED || type === EventType.PRESS) {
        goToRinging(notification.id);
      }
    });

    // Cold-start launch via notification press.
    notifee.getInitialNotification().then((initial) => {
      if (initial?.notification?.id) {
        setTimeout(() => goToRinging(initial.notification.id!), 500);
      }
    });

    // Whenever the app comes back to the foreground, re-check displayed
    // notifications. Handles fullScreenAction launches that don't fire
    // a PRESS event and warm-start cases.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        // Reset the de-dupe key so a brand-new alarm can re-route us.
        // We only reset if no notification is currently displayed.
        notifee.getDisplayedNotifications().then((displayed) => {
          if (displayed.length === 0) {
            navigatedAlarmRef.current = null;
          } else {
            checkDisplayedAlarm();
          }
        }).catch(() => {});
      }
    });

    return () => {
      unsubscribe();
      sub.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor={COLORS.bg} translucent={false} />
        <NavigationContainer ref={navRef}>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
