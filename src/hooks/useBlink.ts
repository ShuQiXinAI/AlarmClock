import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera } from 'expo-camera';

// ─── Types ───────────────────────────────────────────────────────────────────

export type FaceDetectionResult = {
  faces: Array<{
    leftEyeOpenProbability?: number;
    rightEyeOpenProbability?: number;
  }>;
};

// ─── Constants ───────────────────────────────────────────────────────────────

/** Both eye open-probability must be below this threshold to count as "closed" */
const BLINK_THRESHOLD = 0.3;
/** Both eye open-probability must be above this to reset the debounce state */
const OPEN_THRESHOLD = 0.5;

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Manages camera permission and provides a face-detection callback that
 * detects blinks and calls `onBlink` exactly once per close-eyes event.
 */
export function useBlink(onBlink: () => void): {
  hasPermission: boolean | null;
  onFacesDetected: (event: FaceDetectionResult) => void;
} {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Keep a stable ref so the callback always calls the latest onBlink
  const onBlinkRef = useRef(onBlink);
  useEffect(() => {
    onBlinkRef.current = onBlink;
  });

  // Debounce state: true = we are currently in a "blink already fired" state
  // (eyes are closed and we already called onBlink). Resets when eyes open.
  const blinkFiredRef = useRef(false);

  // ─── Permission request on mount ─────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (!cancelled) {
        setHasPermission(status === 'granted');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Face detection callback ──────────────────────────────────────────────

  const onFacesDetected = useCallback((event: FaceDetectionResult) => {
    const face = event.faces[0];
    if (!face) return;

    const { leftEyeOpenProbability, rightEyeOpenProbability } = face;

    const bothClosed =
      leftEyeOpenProbability !== undefined &&
      rightEyeOpenProbability !== undefined &&
      leftEyeOpenProbability < BLINK_THRESHOLD &&
      rightEyeOpenProbability < BLINK_THRESHOLD;

    const bothOpen =
      leftEyeOpenProbability !== undefined &&
      rightEyeOpenProbability !== undefined &&
      leftEyeOpenProbability > OPEN_THRESHOLD &&
      rightEyeOpenProbability > OPEN_THRESHOLD;

    if (bothClosed && !blinkFiredRef.current) {
      // Eyes just closed — fire the blink
      blinkFiredRef.current = true;
      onBlinkRef.current();
    } else if (bothOpen) {
      // Eyes are open again — reset debounce so next close fires a new blink
      blinkFiredRef.current = false;
    }
  }, []);

  return { hasPermission, onFacesDetected };
}
