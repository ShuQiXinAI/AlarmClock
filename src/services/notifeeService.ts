import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidCategory,
  TriggerType,
} from '@notifee/react-native';
import { Alarm } from '../types';
import { getNextTriggerTimestamp } from '../utils/alarmTime';

export async function setupNotifee(): Promise<void> {
  await notifee.requestPermission();
  await notifee.createChannel({
    id: 'alarm',
    name: '闹钟',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
}

export async function scheduleAlarm(alarm: Alarm): Promise<string> {
  const timestamp = getNextTriggerTimestamp(alarm.time, alarm.repeatDays);
  return notifee.createTriggerNotification(
    {
      id: alarm.id,
      title: '叫不醒你不罢休 ⏰',
      body: alarm.label,
      android: {
        channelId: 'alarm',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        category: AndroidCategory.ALARM,
        fullScreenAction: { id: 'default' },
        pressAction: { id: 'default', launchActivity: 'default' },
        sound: 'default',
        vibrationPattern: [300, 500],
        asForegroundService: true,
      },
    },
    { type: TriggerType.TIMESTAMP, timestamp },
  );
}

export async function cancelAlarm(notifeeJobId: string): Promise<void> {
  await notifee.cancelTriggerNotification(notifeeJobId);
}
