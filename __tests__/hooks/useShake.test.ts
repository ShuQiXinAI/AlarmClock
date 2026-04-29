// __tests__/hooks/useShake.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { Accelerometer } from 'expo-sensors';

jest.mock('expo-sensors', () => ({
  Accelerometer: {
    setUpdateInterval: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

import { useShake } from '../../src/hooks/useShake';

const mockAccelerometer = Accelerometer as jest.Mocked<typeof Accelerometer>;

describe('useShake', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockAccelerometer.addListener as jest.Mock).mockReturnValue({ remove: jest.fn() });
  });

  it('calls Accelerometer.setUpdateInterval(100) on mount', () => {
    const onShake = jest.fn();
    renderHook(() => useShake(onShake));

    expect(mockAccelerometer.setUpdateInterval).toHaveBeenCalledWith(100);
  });

  it('does NOT call onShake when magnitude <= 1.8 (e.g., {x:0, y:0, z:1})', () => {
    const onShake = jest.fn();
    let capturedListener: ((data: { x: number; y: number; z: number }) => void) | null = null;

    (mockAccelerometer.addListener as jest.Mock).mockImplementation((listener) => {
      capturedListener = listener;
      return { remove: jest.fn() };
    });

    renderHook(() => useShake(onShake));

    act(() => {
      capturedListener!({ x: 0, y: 0, z: 1 });
    });

    expect(onShake).not.toHaveBeenCalled();
  });

  it('calls onShake when magnitude > 1.8 (e.g., {x:2, y:0, z:0})', () => {
    const onShake = jest.fn();
    let capturedListener: ((data: { x: number; y: number; z: number }) => void) | null = null;

    (mockAccelerometer.addListener as jest.Mock).mockImplementation((listener) => {
      capturedListener = listener;
      return { remove: jest.fn() };
    });

    renderHook(() => useShake(onShake));

    act(() => {
      capturedListener!({ x: 2, y: 0, z: 0 });
    });

    expect(onShake).toHaveBeenCalledTimes(1);
  });

  it('removes listener on unmount', () => {
    const onShake = jest.fn();
    const removeMock = jest.fn();

    (mockAccelerometer.addListener as jest.Mock).mockReturnValue({ remove: removeMock });

    const { unmount } = renderHook(() => useShake(onShake));

    unmount();

    expect(removeMock).toHaveBeenCalledTimes(1);
  });
});
