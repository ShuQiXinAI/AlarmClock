// __tests__/hooks/useBlink.test.ts
import { renderHook, act } from '@testing-library/react-native';

jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  },
}));

import { Camera } from 'expo-camera';
import { useBlink } from '../../src/hooks/useBlink';

type FaceDetectionResult = {
  faces: Array<{
    leftEyeOpenProbability?: number;
    rightEyeOpenProbability?: number;
  }>;
};

describe('useBlink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
  });

  it('requests camera permission on mount', async () => {
    const onBlink = jest.fn();
    const { result } = renderHook(() => useBlink(onBlink));

    // Wait for the async permission request
    await act(async () => {});

    expect(Camera.requestCameraPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(result.current.hasPermission).toBe(true);
  });

  it('onFacesDetected does NOT call onBlink when eyes are open', async () => {
    const onBlink = jest.fn();
    const { result } = renderHook(() => useBlink(onBlink));

    await act(async () => {});

    const event: FaceDetectionResult = {
      faces: [{ leftEyeOpenProbability: 0.9, rightEyeOpenProbability: 0.9 }],
    };

    act(() => {
      result.current.onFacesDetected(event);
    });

    expect(onBlink).not.toHaveBeenCalled();
  });

  it('onFacesDetected calls onBlink when both eyes are closed (< 0.3)', async () => {
    const onBlink = jest.fn();
    const { result } = renderHook(() => useBlink(onBlink));

    await act(async () => {});

    // First, simulate eyes open so that the debounce ref is reset
    const openEvent: FaceDetectionResult = {
      faces: [{ leftEyeOpenProbability: 0.9, rightEyeOpenProbability: 0.9 }],
    };
    act(() => {
      result.current.onFacesDetected(openEvent);
    });

    // Then simulate eyes closed
    const closedEvent: FaceDetectionResult = {
      faces: [{ leftEyeOpenProbability: 0.1, rightEyeOpenProbability: 0.2 }],
    };
    act(() => {
      result.current.onFacesDetected(closedEvent);
    });

    expect(onBlink).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onBlink twice for the same blink (debounce)', async () => {
    const onBlink = jest.fn();
    const { result } = renderHook(() => useBlink(onBlink));

    await act(async () => {});

    // First open eyes to reset debounce state
    const openEvent: FaceDetectionResult = {
      faces: [{ leftEyeOpenProbability: 0.9, rightEyeOpenProbability: 0.9 }],
    };
    act(() => {
      result.current.onFacesDetected(openEvent);
    });

    // Close eyes — first detection
    const closedEvent: FaceDetectionResult = {
      faces: [{ leftEyeOpenProbability: 0.1, rightEyeOpenProbability: 0.2 }],
    };
    act(() => {
      result.current.onFacesDetected(closedEvent);
    });

    // Close eyes again — should NOT call onBlink again (debounce)
    act(() => {
      result.current.onFacesDetected(closedEvent);
    });

    expect(onBlink).toHaveBeenCalledTimes(1);
  });
});
