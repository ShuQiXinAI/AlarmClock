import { registerRootComponent } from 'expo';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';

// Background event handler — must be registered before app start.
// Fires when the user taps the notification or when a trigger fires while
// the app is in the background or killed.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;

  // When the user taps the notification body or the "default" press action,
  // Android launches the app via launchActivity. We just need to keep this
  // handler defined so background events are processed.
  if (type === EventType.PRESS && notification?.id) {
    // The app is being launched; navigation is handled inside the app.
  }

  if (type === EventType.ACTION_PRESS && pressAction?.id === 'dismiss') {
    if (notification?.id) {
      await notifee.cancelNotification(notification.id);
    }
  }
});

registerRootComponent(App);
