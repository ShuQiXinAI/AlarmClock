import { getNextTriggerTimestamp } from '../../src/utils/alarmTime';

describe('getNextTriggerTimestamp', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('one-time alarm in future returns same-day timestamp', () => {
    jest.setSystemTime(new Date('2026-04-27T06:00:00'));
    const ts = getNextTriggerTimestamp('07:00', []);
    const d = new Date(ts);
    expect(d.getHours()).toBe(7);
    expect(d.getMinutes()).toBe(0);
    expect(d.getDate()).toBe(27);
  });

  it('one-time alarm in past returns next-day timestamp', () => {
    jest.setSystemTime(new Date('2026-04-27T08:00:00'));
    const ts = getNextTriggerTimestamp('07:00', []);
    const d = new Date(ts);
    expect(d.getDate()).toBe(28);
  });

  it('repeating alarm finds next matching weekday', () => {
    // Monday = 1, set now to Tuesday 10:00
    jest.setSystemTime(new Date('2026-04-28T10:00:00')); // Tuesday
    const ts = getNextTriggerTimestamp('07:00', [1]); // Mon only
    const d = new Date(ts);
    expect(d.getDay()).toBe(1); // next Monday
  });

  it('repeating alarm same day future time returns today', () => {
    jest.setSystemTime(new Date('2026-04-27T06:00:00')); // Monday
    const ts = getNextTriggerTimestamp('07:00', [1]); // Mon
    const d = new Date(ts);
    expect(d.getDay()).toBe(1);
    expect(d.getDate()).toBe(27);
  });
});
