import { Vibration, Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';
import notifee from '@notifee/react-native';

let currentAlarmId: string | null = null;
let nativePlaying = false;

const VIBRATE_PATTERN = [0, 600, 400, 600, 400];

// Lazy-load the native module so dev / web builds don't crash if it's
// absent. In a release Android build, this resolves to the real module
// that plays the system alarm tone on the alarm audio stream.
let AlarmSoundNative: { play(): void; stop(): void } | null = null;
try {
  AlarmSoundNative = requireNativeModule('AlarmSound');
} catch {
  AlarmSoundNative = null;
}

export async function startAlarm(alarmId: string): Promise<void> {
  if (currentAlarmId === alarmId && nativePlaying) return;

  await stopAlarm();

  currentAlarmId = alarmId;

  // Cancel the displayed notification so its sound doesn't double up
  // with the alarm we're about to start. The trigger has already fired,
  // so this won't affect future scheduled alarms.
  try {
    await notifee.cancelDisplayedNotification(alarmId);
  } catch {}

  if (AlarmSoundNative) {
    try {
      AlarmSoundNative.play();
      nativePlaying = true;
    } catch {
      nativePlaying = false;
    }
  }

  if (Platform.OS === 'android') {
    Vibration.vibrate(VIBRATE_PATTERN, true);
  }
}

export async function stopAlarm(alarmId?: string): Promise<void> {
  Vibration.cancel();

  if (AlarmSoundNative && nativePlaying) {
    try {
      AlarmSoundNative.stop();
    } catch {}
    nativePlaying = false;
  }

  const target = alarmId ?? currentAlarmId;
  currentAlarmId = null;

  if (target) {
    try {
      await notifee.cancelNotification(target);
    } catch {}
  }
}
