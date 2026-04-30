import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Vibration, Platform } from 'react-native';
import notifee from '@notifee/react-native';

let currentSound: Audio.Sound | null = null;
let currentAlarmId: string | null = null;

const VIBRATE_PATTERN = [0, 600, 400, 600, 400];

async function configureAudioMode(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: false,
    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    staysActiveInBackground: true,
  });
}

export async function startAlarm(alarmId: string): Promise<void> {
  if (currentAlarmId === alarmId && currentSound) return;

  await stopAlarm();

  currentAlarmId = alarmId;

  // Once the app is driving the alarm, the system notification's own sound
  // is no longer needed. Cancel the displayed notification so it doesn't
  // ring on top of the app audio. (The trigger has already fired, so this
  // does not affect future scheduled alarms.)
  try {
    await notifee.cancelDisplayedNotification(alarmId);
  } catch {}

  try {
    await configureAudioMode();
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/alarm.mp3'),
      { isLooping: true, shouldPlay: true, volume: 1.0 },
    );
    currentSound = sound;
  } catch {
    // audio resource missing — fall back to vibration only
  }

  if (Platform.OS === 'android') {
    Vibration.vibrate(VIBRATE_PATTERN, true);
  }
}

export async function stopAlarm(alarmId?: string): Promise<void> {
  Vibration.cancel();

  if (currentSound) {
    try {
      await currentSound.stopAsync();
    } catch {}
    try {
      await currentSound.unloadAsync();
    } catch {}
    currentSound = null;
  }

  const target = alarmId ?? currentAlarmId;
  currentAlarmId = null;

  if (target) {
    try {
      await notifee.cancelNotification(target);
    } catch {}
  }
}
