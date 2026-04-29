// __tests__/store/alarmStore.test.ts
import { act, renderHook } from '@testing-library/react-native';

jest.mock('@notifee/react-native', () => ({
  createTriggerNotification: jest.fn().mockResolvedValue('mock-notifee-id'),
  cancelTriggerNotification: jest.fn().mockResolvedValue(undefined),
  requestPermission: jest.fn().mockResolvedValue({ authorizationStatus: 1 }),
  createChannel: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: { HIGH: 4 },
  TriggerType: { TIMESTAMP: 0 },
  AndroidVisibility: { PUBLIC: 1 },
  AndroidCategory: { ALARM: 'alarm' },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { useAlarmStore } from '../../src/store/alarmStore';

describe('alarmStore', () => {
  beforeEach(() => {
    useAlarmStore.setState({ alarms: [] });
  });

  it('starts with empty alarms', () => {
    const { result } = renderHook(() => useAlarmStore());
    expect(result.current.alarms).toHaveLength(0);
  });

  it('addAlarm adds an alarm', async () => {
    const { result } = renderHook(() => useAlarmStore());
    await act(async () => {
      await result.current.addAlarm({
        time: '07:00', label: '上班打卡', method: 'math',
        active: true, repeatDays: [1, 2, 3, 4, 5],
      });
    });
    expect(result.current.alarms).toHaveLength(1);
    expect(result.current.alarms[0].label).toBe('上班打卡');
    expect(result.current.alarms[0].id).toBeTruthy();
  });

  it('deleteAlarm removes alarm by id', async () => {
    const { result } = renderHook(() => useAlarmStore());
    await act(async () => {
      await result.current.addAlarm({
        time: '07:00', label: 'test', method: 'shake',
        active: false, repeatDays: [],
      });
    });
    const id = result.current.alarms[0].id;
    await act(async () => {
      await result.current.deleteAlarm(id);
    });
    expect(result.current.alarms).toHaveLength(0);
  });

  it('toggleAlarm flips active state', async () => {
    const { result } = renderHook(() => useAlarmStore());
    await act(async () => {
      await result.current.addAlarm({
        time: '07:00', label: 'test', method: 'blink',
        active: true, repeatDays: [],
      });
    });
    const id = result.current.alarms[0].id;
    await act(async () => {
      await result.current.toggleAlarm(id, false);
    });
    expect(result.current.alarms[0].active).toBe(false);
  });
});
