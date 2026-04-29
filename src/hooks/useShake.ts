import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';

const SHAKE_THRESHOLD = 1.8;
const UPDATE_INTERVAL_MS = 100;

/**
 * Subscribes to the device accelerometer and calls `onShake` whenever
 * the measured G-force magnitude exceeds the shake threshold (1.8 g).
 *
 * Cleans up the listener automatically on unmount.
 */
export function useShake(onShake: () => void): void {
  // Keep a stable ref so the listener always calls the latest onShake
  const onShakeRef = useRef(onShake);
  useEffect(() => {
    onShakeRef.current = onShake;
  });

  useEffect(() => {
    Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      if (magnitude > SHAKE_THRESHOLD) {
        onShakeRef.current();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);
}
