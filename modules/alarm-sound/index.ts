import { requireNativeModule } from 'expo-modules-core';

interface AlarmSoundNative {
  play(): void;
  stop(): void;
}

const AlarmSound = requireNativeModule<AlarmSoundNative>('AlarmSound');

export default AlarmSound;
