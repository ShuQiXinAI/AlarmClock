import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidCategory,
  TriggerType,
  AlarmType,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import { Alarm } from '../types';
import { getNextTriggerTimestamp } from '../utils/alarmTime';

export async function setupNotifee(): Promise<void> {
  await notifee.requestPermission();

  // The notification itself is mainly a wakeup trigger — the app plays
  // alarm audio via the native AlarmSound module on the alarm audio
  // stream once it launches. The channel keeps a default sound as a brief
  // safety net for the moment between trigger fire and app launch.
  await notifee.createChannel({
    id: 'alarm',
    name: '闹钟',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    bypassDnd: true,
  });
}

export async function openAlarmPermissionSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await notifee.openAlarmPermissionSettings();
  } catch {
    // no-op on Android < 12
  }
}

export async function scheduleAlarm(alarm: Alarm): Promise<string> {
  const timestamp = getNextTriggerTimestamp(alarm.time, alarm.repeatDays);

  return notifee.createTriggerNotification(
    {
      id: alarm.id,
      title: '叫不醒你不罢休 ⏰',
      body: alarm.label || '该起床了！',
      android: {
        channelId: 'alarm',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        category: AndroidCategory.ALARM,
        fullScreenAction: { id: 'default', launchActivity: 'default' },
        pressAction: { id: 'default', launchActivity: 'default' },
        sound: 'default',
        ongoing: true,
        autoCancel: false,
        showTimestamp: true,
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp,
      alarmManager: {
        type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
        allowWhileIdle: true,
      },
    },
  );
}

export async function cancelAlarm(notifeeJobId: string): Promise<void> {
  await notifee.cancelTriggerNotification(notifeeJobId);
}

export async function rescheduleAllAlarms(alarms: Alarm[]): Promise<void> {
  for (const alarm of alarms) {
    if (!alarm.active) continue;
    try {
      if (alarm.notifeeJobId) {
        await notifee.cancelTriggerNotification(alarm.notifeeJobId);
      }
      await scheduleAlarm(alarm);
    } catch {
      // continue if one alarm fails
    }
  }
}
