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

const TEST_ALARM_ID = 'test-alarm';

// Schedules a quick smoke-test alarm 30 seconds out. No fullScreenAction
// or pressAction so we don't accidentally trigger the routing pipeline
// (the test alarm isn't in the alarmStore; RingingScreen would fail to
// look it up). The user just needs to confirm "did I see/hear it."
export async function scheduleTestAlarm(): Promise<void> {
  await notifee.cancelTriggerNotification(TEST_ALARM_ID);
  const timestamp = Date.now() + 30_000;
  await notifee.createTriggerNotification(
    {
      id: TEST_ALARM_ID,
      title: '测试闹钟 ⏰',
      body: '如果你听到声音并看到这条通知，说明权限已配置正确。',
      android: {
        channelId: 'alarm',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        category: AndroidCategory.ALARM,
        sound: 'default',
        autoCancel: true,
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
