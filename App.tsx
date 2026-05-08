import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { EventType } from '@notifee/react-native';
import { setupNotifee } from './src/services/notifeeService';
import { useAlarmStore } from './src/store/alarmStore';
import AppNavigator, { RootStackParamList } from './src/navigation/AppNavigator';
import { PERMISSION_GUIDE_SEEN_KEY } from './src/screens/PermissionCheckScreen';
import { COLORS } from './src/theme/colors';

// Notification ids beginning with this prefix are smoke-test alarms
// scheduled from the permission-check screen. They aren't backed by an
// entry in the alarm store, so we must NOT route them to RingingScreen.
const TEST_ALARM_PREFIX = 'test-alarm';

const isRealAlarm = (id?: string | null): id is string =>
  typeof id === 'string' && !id.startsWith(TEST_ALARM_PREFIX);

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
      const alarm = displayed.find((d) => isRealAlarm(d.notification?.id));
      if (alarm?.notification?.id) {
        goToRinging(alarm.notification.id);
      }
    } catch {}
  };

  useEffect(() => {
    (async () => {
      await setupNotifee();
      await rescheduleAll();
      // First-launch onboarding: send the user to the permission
      // self-check screen so they configure required permissions
      // before scheduling their first alarm.
      const seen = await AsyncStorage.getItem(PERMISSION_GUIDE_SEEN_KEY);
      if (!seen) {
        setTimeout(() => navRef.current?.navigate('PermissionCheck'), 600);
      }
      // Check once after navigator is ready.
      setTimeout(checkDisplayedAlarm, 800);
    })();

    // Foreground event: fires when a trigger delivers a notification
    // while the app is already in the foreground, or when the user taps
    // a heads-up notification while the app is open.
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      const { notification } = detail;
      if (!isRealAlarm(notification?.id)) return;
      if (type === EventType.DELIVERED || type === EventType.PRESS) {
        goToRinging(notification!.id!);
      }
    });

    // Cold-start launch via notification press.
    notifee.getInitialNotification().then((initial) => {
      if (isRealAlarm(initial?.notification?.id)) {
        setTimeout(() => goToRinging(initial!.notification.id!), 500);
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
